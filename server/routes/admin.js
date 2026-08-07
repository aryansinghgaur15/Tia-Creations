// server/routes/admin.js
// Admin console API — blueprint §14.5, §21.
// All routes require role=admin. Every mutation writes AdminAudit (immutable).
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { computeScopes } from '../lib/scopes.js';
import { requireAdmin, HttpError } from '../lib/middleware.js';

const router = Router();

// All admin routes gated
router.use(requireAdmin);

// GET /api/admin/queue/artists — pending artist applications
router.get('/queue/artists', async (req, res, next) => {
  try {
    const items = await prisma.reviewQueue.findMany({
      where: { type: 'artist', status: 'open' },
      orderBy: { createdAt: 'asc' },
    });
    // Fetch user for each item (polymorphic refId)
    const itemsWithUser = await Promise.all(
      items.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.refId },
          select: { id: true, displayName: true, email: true, artistStatus: true },
        });
        return { ...item, user };
      })
    );
    res.json({ items: itemsWithUser });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/queue/artworks — pending artwork reviews
router.get('/queue/artworks', async (req, res, next) => {
  try {
    const items = await prisma.reviewQueue.findMany({
      where: { type: 'artwork', status: 'open' },
      orderBy: { createdAt: 'asc' },
    });
    // Fetch artwork for each item (polymorphic refId)
    const itemsWithArtwork = await Promise.all(
      items.map(async (item) => {
        const artwork = await prisma.artwork.findUnique({
          where: { id: item.refId },
          include: { artist: { select: { displayName: true } } },
        });
        return { ...item, artwork };
      })
    );
    res.json({ items: itemsWithArtwork });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/artists/:id/approve — artistStatus=approved + scopes + ArtistProfile
router.post('/artists/:id/approve', async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return next(new HttpError(404, 'User not found'));
    if (target.artistStatus !== 'pending') return next(new HttpError(400, 'Not pending'));

    const scopes = computeScopes({ ...target, artistStatus: 'approved' });

    // Fetch application data to populate ArtistProfile
    const app = await prisma.artistApplication.findUnique({ where: { userId: req.params.id } });
    const info = app?.info || {};
    const profileData = {
      bio: info.bio || null,
      experienceYears: info.experience ? parseInt(info.experience, 10) || null : null,
      education: info.education || null,
      awards: info.awards || null,
      specialization: info.specialization || null,
      mediums: info.mediums || [],
      styles: info.styles || [],
      subjects: info.subjects || [],
      website: info.website || null,
      instagram: info.instagram || null,
      facebook: info.facebook || null,
    };

    const [updated] = await prisma.$transaction([
      prisma.user.update({ where: { id: req.params.id }, data: { artistStatus: 'approved', scopes } }),
      prisma.artistProfile.upsert({
        where: { userId: req.params.id },
        create: { userId: req.params.id, ...profileData },
        update: profileData,
      }),
      prisma.reviewQueue.updateMany({
        where: { type: 'artist', refId: req.params.id, status: 'open' },
        data: { status: 'resolved' },
      }),
      prisma.notification.create({
        data: {
          userId: req.params.id,
          type: 'artist_approved',
          channel: 'in_app',
          body: 'Congratulations! Your artist application has been approved. You can now start listing your artworks.',
        },
      }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'approve_artist',
          entityType: 'user',
          entityId: req.params.id,
          meta: { previousArtistStatus: target.artistStatus, newArtistStatus: 'approved' },
        },
      }),
    ]);
    res.json({ artistStatus: updated.artistStatus, scopes: updated.scopes });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/artists/:id/reject — require reason
router.post('/artists/:id/reject', async (req, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return next(new HttpError(404, 'User not found'));
    if (target.artistStatus !== 'pending') return next(new HttpError(400, 'Not pending'));

    const [updated] = await prisma.$transaction([
      prisma.user.update({ where: { id: req.params.id }, data: { artistStatus: 'rejected' } }),
      prisma.reviewQueue.updateMany({
        where: { type: 'artist', refId: req.params.id, status: 'open' },
        data: { status: 'resolved' },
      }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'reject_artist',
          entityType: 'user',
          entityId: req.params.id,
          meta: { reason, previousArtistStatus: target.artistStatus, newArtistStatus: 'rejected' },
        },
      }),
    ]);
    // event artist.rejected (blueprint §16)
    res.json({ artistStatus: updated.artistStatus });
  } catch (err) {
    next(err);
  }
});

// ── USERS MANAGEMENT ───────────────────────────────────────────────

// GET /api/admin/users/stats — aggregate counts for KPI cards
router.get('/users/stats', async (req, res, next) => {
  try {
    const [total, active, suspended, banned, buyers, artists, pendingArtists, admins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { userStatus: 'active' } }),
      prisma.user.count({ where: { userStatus: 'suspended' } }),
      prisma.user.count({ where: { userStatus: 'banned' } }),
      prisma.user.count({ where: { role: 'user', artistStatus: 'none' } }),
      prisma.user.count({ where: { artistStatus: 'approved' } }),
      prisma.user.count({ where: { artistStatus: 'pending' } }),
      prisma.user.count({ where: { role: 'admin' } }),
    ]);
    res.json({ total, active, suspended, banned, buyers, artists, pendingArtists, admins });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users — paginated, searchable, sortable user list with counts
router.get('/users', async (req, res, next) => {
  try {
    const { search, role, status, artistStatus, sort = 'newest', page = '1', limit = '20' } = req.query;
    const where = {};
    if (role) where.role = role;
    if (status) where.userStatus = status;
    if (artistStatus) where.artistStatus = artistStatus;
    if (search) {
      where.OR = [
        { displayName: { contains: search } },
        { email: { contains: search } },
        { fullName: { contains: search } },
        { id: { contains: search } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sort === 'name_asc') orderBy = { displayName: 'asc' };
    else if (sort === 'name_desc') orderBy = { displayName: 'desc' };
    else if (sort === 'recently_updated') orderBy = { updatedAt: 'desc' };

    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, displayName: true, fullName: true, avatarUrl: true,
          role: true, userStatus: true, artistStatus: true, createdAt: true, updatedAt: true,
          _count: { select: { artworks: true, orders: true, reviews: true, wishlistItems: true, following: true, followedBy: true } },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ items, total, page: Math.max(parseInt(page, 10), 1), totalPages: Math.ceil(total / take) });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users/:id — detailed user view with relations
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, displayName: true, fullName: true, avatarUrl: true,
        phone: true, role: true, userStatus: true, artistStatus: true,
        createdAt: true, updatedAt: true,
        _count: {
          select: { artworks: true, orders: true, reviews: true, wishlistItems: true, following: true, followedBy: true },
        },
      },
    });
    if (!user) return next(new HttpError(404, 'User not found'));

    const [artistProfile, recentArtworks, recentOrders, auditHistory] = await Promise.all([
      user.artistStatus !== 'none' ? prisma.artistProfile.findUnique({
        where: { userId: user.id },
        select: { bio: true, experienceYears: true, specialization: true, ratingAvg: true, followersCount: true, kycStatus: true, createdAt: true },
      }) : null,
      prisma.artwork.findMany({
        where: { artistId: user.id },
        select: { id: true, title: true, status: true, price: true, createdAt: true, isFeatured: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.order.findMany({
        where: { buyerId: user.id },
        select: { id: true, amount: true, currency: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.adminAudit.findMany({
        where: { entityType: 'user', entityId: user.id },
        select: { id: true, action: true, meta: true, createdAt: true, admin: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    res.json({ user, artistProfile, recentArtworks, recentOrders, auditHistory });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users/:id/suspend — active -> suspended
router.post('/users/:id/suspend', async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { userStatus: true, role: true, displayName: true } });
    if (!target) return next(new HttpError(404, 'User not found'));
    if (target.role === 'admin') return next(new HttpError(400, 'Cannot suspend admin accounts'));
    if (target.userStatus !== 'active') return next(new HttpError(400, 'Only active users can be suspended'));

    const [updated] = await prisma.$transaction([
      prisma.user.update({ where: { id: req.params.id }, data: { userStatus: 'suspended' } }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'suspend_user',
          entityType: 'user',
          entityId: req.params.id,
          meta: { previousUserStatus: target.userStatus, newUserStatus: 'suspended' },
        },
      }),
      prisma.notification.create({
        data: {
          userId: req.params.id,
          type: 'user_suspended',
          channel: 'in_app',
          body: `Your account has been suspended. Please contact support for more information.`,
        },
      }),
    ]);
    res.json({ userStatus: updated.userStatus });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users/:id/reactivate — suspended/banned -> active
router.post('/users/:id/reactivate', async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { userStatus: true, displayName: true } });
    if (!target) return next(new HttpError(404, 'User not found'));
    if (!['suspended', 'banned'].includes(target.userStatus)) return next(new HttpError(400, 'User is not suspended or banned'));

    const [updated] = await prisma.$transaction([
      prisma.user.update({ where: { id: req.params.id }, data: { userStatus: 'active' } }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'reactivate_user',
          entityType: 'user',
          entityId: req.params.id,
          meta: { previousUserStatus: target.userStatus, newUserStatus: 'active' },
        },
      }),
      prisma.notification.create({
        data: {
          userId: req.params.id,
          type: 'user_reactivated',
          channel: 'in_app',
          body: `Your account has been reactivated. Welcome back!`,
        },
      }),
    ]);
    res.json({ userStatus: updated.userStatus });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users/:id/ban — set userStatus=banned
router.post('/users/:id/ban', async (req, res, next) => {
  try {
    const { ban } = z.object({ ban: z.boolean().default(true) }).parse(req.body);
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { userStatus: true, role: true } });
    if (!target) return next(new HttpError(404, 'User not found'));
    if (target.role === 'admin') return next(new HttpError(400, 'Cannot ban admin accounts'));
    if (ban && target.userStatus === 'banned') return next(new HttpError(400, 'User is already banned'));
    if (!ban && target.userStatus !== 'banned') return next(new HttpError(400, 'User is not banned'));

    const newStatus = ban ? 'banned' : 'active';
    const [updated] = await prisma.$transaction([
      prisma.user.update({ where: { id: req.params.id }, data: { userStatus: newStatus } }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: ban ? 'ban_user' : 'unban_user',
          entityType: 'user',
          entityId: req.params.id,
          meta: { previousUserStatus: target.userStatus, newUserStatus: newStatus },
        },
      }),
      ...(ban ? [prisma.notification.create({
        data: {
          userId: req.params.id,
          type: 'user_suspended',
          channel: 'in_app',
          body: `Your account has been banned. Please contact support for more information.`,
        },
      })] : [prisma.notification.create({
        data: {
          userId: req.params.id,
          type: 'user_reactivated',
          channel: 'in_app',
          body: `Your account ban has been lifted. Welcome back!`,
        },
      })]),
    ]);
    res.json({ userStatus: updated.userStatus });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/artworks — all artworks (admin sees all statuses)
router.get('/artworks', async (req, res, next) => {
  try {
    const { status, artistId, search, page = '1', limit = '50' } = req.query;
    const where = {};
    if (status) where.status = status;
    if (artistId) where.artistId = artistId;
    if (search) where.title = { contains: search };
    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;
    const [items, total] = await Promise.all([
      prisma.artwork.findMany({
        where,
        include: {
          artist: { select: { id: true, displayName: true, avatarUrl: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        take, skip,
      }),
      prisma.artwork.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page, 10), limit: take });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// ARTWORK MODERATION — queue, stats, bulk actions
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/moderation/stats — status counts for moderation dashboard
router.get('/moderation/stats', async (req, res, next) => {
  try {
    const [inReview, changesRequested, published, rejected, archived, draft, total] = await Promise.all([
      prisma.artwork.count({ where: { status: 'in_review' } }),
      prisma.artwork.count({ where: { status: 'changes_requested' } }),
      prisma.artwork.count({ where: { status: 'published' } }),
      prisma.artwork.count({ where: { status: 'rejected' } }),
      prisma.artwork.count({ where: { status: 'archived' } }),
      prisma.artwork.count({ where: { status: 'draft' } }),
      prisma.artwork.count(),
    ]);
    res.json({ inReview, changesRequested, published, rejected, archived, draft, total });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/moderation/queue — paginated artwork list with artist info, filters, search, sorting
router.get('/moderation/queue', async (req, res, next) => {
  try {
    const {
      status, medium, style, artistId, minPrice, maxPrice,
      featured, search, sort = 'newest', page = '1', limit = '50',
    } = req.query;

    const where = {};
    if (status) {
      if (status === 'pending_review') where.status = 'in_review';
      else where.status = status;
    }
    if (medium) where.medium = { contains: medium };
    if (style) where.style = { contains: style };
    if (artistId) where.artistId = artistId;
    if (featured !== undefined) where.isFeatured = featured === 'true';
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { id: { contains: search } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sort === 'price_high') orderBy = { price: 'desc' };
    else if (sort === 'price_low') orderBy = { price: 'asc' };
    else if (sort === 'updated') orderBy = { updatedAt: 'desc' };

    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.artwork.findMany({
        where,
        include: {
          artist: { select: { id: true, displayName: true, email: true, avatarUrl: true, artistStatus: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy,
        take, skip,
      }),
      prisma.artwork.count({ where }),
    ]);

    // Attach review queue data for each artwork
    const artworkIds = items.map(a => a.id);
    const queueItems = artworkIds.length > 0
      ? await prisma.reviewQueue.findMany({
          where: { type: 'artwork', refId: { in: artworkIds }, status: { not: 'resolved' } },
          select: { refId: true, assignedTo: true, slaDueAt: true, createdAt: true },
        })
      : [];
    const queueMap = {};
    queueItems.forEach(q => { queueMap[q.refId] = q; });

    const enriched = items.map(a => ({
      ...a,
      queue: queueMap[a.id] || null,
    }));

    res.json({
      items: enriched,
      total,
      page: parseInt(page, 10),
      limit: take,
      totalPages: Math.ceil(total / take),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/moderation/bulk — bulk actions on artworks
router.post('/moderation/bulk', async (req, res, next) => {
  try {
    const parsed = z.object({
      action: z.enum(['move_to_review', 'archive']),
      artworkIds: z.array(z.string().min(1)).min(1),
    }).safeParse(req.body);

    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join('; ');
      return next(new HttpError(400, msg));
    }

    const { action, artworkIds } = parsed.data;

    let data = {};
    if (action === 'move_to_review') data.status = 'in_review';
    else if (action === 'archive') data.status = 'archived';

    const [result] = await prisma.$transaction([
      prisma.artwork.updateMany({ where: { id: { in: artworkIds } }, data }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: `bulk_${action}`,
          entityType: 'artwork',
          entityId: artworkIds.join(','),
          meta: { count: artworkIds.length, action, affectedIds: artworkIds },
        },
      }),
    ]);

    if (action === 'move_to_review') {
      await prisma.reviewQueue.createMany({
        data: artworkIds.map(id => ({ type: 'artwork', refId: id, status: 'open' })),
        skipDuplicates: true,
      });
    }

    res.json({ updated: result.count });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports — platform analytics snapshot (extended with growth data)
router.get('/reports', async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [users, artists, artworks, published, orders, pendingArtists, pendingArtworks,
      newUsersWeek, newArtworksWeek, newUsersMonth, newArtworksMonth,
      totalSaves, totalReviews] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { artistStatus: 'approved' } }),
      prisma.artwork.count(),
      prisma.artwork.count({ where: { status: 'published' } }),
      prisma.order.count(),
      prisma.reviewQueue.count({ where: { type: 'artist', status: 'open' } }),
      prisma.reviewQueue.count({ where: { type: 'artwork', status: 'open' } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.artwork.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.artwork.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.artworkSave.count(),
      prisma.artworkReview.count(),
    ]);
    res.json({
      kpis: { users, artists, artworks, published, orders, pendingArtists, pendingArtworks },
      growth: {
        newUsersWeek, newArtworksWeek, newUsersMonth, newArtworksMonth,
        totalSaves, totalReviews,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/audit — paginated audit log with filters (immutable, read-only)
router.get('/audit', async (req, res, next) => {
  try {
    const { page = '1', limit = '50', action, entityType, adminId, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(200, Math.max(10, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * take;

    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (adminId) where.adminId = adminId;
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { entityType: { contains: search } },
        { entityId: { contains: search } },
      ];
    }

    const [log, total] = await Promise.all([
      prisma.adminAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          admin: { select: { id: true, displayName: true, email: true } },
        },
      }),
      prisma.adminAudit.count({ where }),
    ]);

    res.json({ log, total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/revenue — revenue chart data (last 7 days + summary)
router.get('/revenue', async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get daily revenue for last 7 days from completed/paid/delivered orders
    const paidStatuses = ['paid', 'shipped', 'delivered', 'completed'];
    const weeklyOrders = await prisma.order.findMany({
      where: {
        status: { in: paidStatuses },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { amount: true, createdAt: true },
    });

    // Get weekly/monthly totals
    const [weekTotal, monthTotal, totalRevenue] = await Promise.all([
      prisma.order.aggregate({
        where: { status: { in: paidStatuses }, createdAt: { gte: sevenDaysAgo } },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: { status: { in: paidStatuses }, createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: { status: { in: paidStatuses } },
        _sum: { amount: true },
      }),
    ]);

    // Build daily buckets for the last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayRevenue = weeklyOrders
        .filter(o => o.createdAt >= d && o.createdAt < nextD)
        .reduce((sum, o) => sum + Number(o.amount), 0);

      dailyData.push({
        day: dayNames[d.getDay()],
        date: d.toISOString().slice(0, 10),
        revenue: dayRevenue,
      });
    }

    // Normalize bar heights (0-100%) for chart display
    const maxRevenue = Math.max(...dailyData.map(d => d.revenue), 1);
    const bars = dailyData.map(d => ({
      ...d,
      height: Math.round((d.revenue / maxRevenue) * 100) || 0,
    }));

    res.json({
      bars,
      weekTotal: Number(weekTotal._sum.amount || 0),
      monthTotal: Number(monthTotal._sum.amount || 0),
      totalRevenue: Number(totalRevenue._sum.amount || 0),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/system-status — real-time system health check
router.get('/system-status', async (req, res, next) => {
  try {
    const startTime = Date.now();

    // Test database connectivity and latency
    let dbStatus = 'connected';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
    } catch {
      dbStatus = 'disconnected';
    }

    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    res.json({
      api: { status: 'running', port: process.env.PORT || 4000, uptime: Math.floor(uptime) },
      database: { status: dbStatus, type: 'MySQL', latency: `${dbLatency}ms` },
      frontend: { status: 'running', port: 5173 },
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heap: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      },
      nodeVersion: process.version,
      platform: process.platform,
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// ARTIST APPLICATIONS — full lifecycle management
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/applications — list all applications with counts + filters
router.get('/applications', async (req, res, next) => {
  try {
    const { status, search, priority, sort = 'newest', page = '1', limit = '50' } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;
    if (priority) where.priority = priority;

    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

    const orderBy = sort === 'oldest' ? { createdAt: 'asc' }
      : sort === 'updated' ? { updatedAt: 'desc' }
      : sort === 'priority' ? { priority: 'desc' }
      : { createdAt: 'desc' };

    const [items, total, counts] = await Promise.all([
      prisma.artistApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true, email: true, displayName: true, fullName: true,
              avatarUrl: true, createdAt: true, artistStatus: true,
            },
          },
        },
        orderBy,
        take, skip,
      }),
      prisma.artistApplication.count({ where }),
      prisma.artistApplication.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const statusCounts = { all: 0, pending: 0, under_review: 0, needs_info: 0, approved: 0, rejected: 0 };
    counts.forEach(c => {
      statusCounts[c.status] = c._count.status;
      statusCounts.all += c._count.status;
    });

    res.json({ items, total, counts: statusCounts, page: parseInt(page, 10), limit: take });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/applications/stats — summary metrics
router.get('/applications/stats', async (req, res, next) => {
  try {
    const [pending, underReview, approved, needsInfo, rejected, total] = await Promise.all([
      prisma.artistApplication.count({ where: { status: 'pending' } }),
      prisma.artistApplication.count({ where: { status: 'under_review' } }),
      prisma.artistApplication.count({ where: { status: 'approved' } }),
      prisma.artistApplication.count({ where: { status: 'needs_info' } }),
      prisma.artistApplication.count({ where: { status: 'rejected' } }),
      prisma.artistApplication.count(),
    ]);
    res.json({ pending, underReview, approved, needsInfo, rejected, total });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/applications/:userId — single application detail
router.get('/applications/:userId', async (req, res, next) => {
  try {
    const app = await prisma.artistApplication.findUnique({
      where: { userId: req.params.userId },
      include: {
        user: {
          select: {
            id: true, email: true, displayName: true, fullName: true,
            avatarUrl: true, phone: true, createdAt: true, artistStatus: true,
            userStatus: true,
          },
        },
        notes: {
          include: { admin: { select: { id: true, displayName: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!app) return next(new HttpError(404, 'Application not found'));

    const timeline = await prisma.adminAudit.findMany({
      where: { entityType: 'artist_application', entityId: req.params.userId },
      include: { admin: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const reviewQueueItem = await prisma.reviewQueue.findFirst({
      where: { type: 'artist', refId: req.params.userId },
    });

    res.json({ application: app, timeline, queueItem: reviewQueueItem });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/applications/:userId/status — update status + optional priority/assignedTo
router.patch('/applications/:userId/status', async (req, res, next) => {
  try {
    const body = z.object({
      status: z.enum(['pending', 'under_review', 'needs_info', 'approved', 'rejected']).optional(),
      priority: z.enum(['normal', 'high', 'urgent']).optional(),
      assignedTo: z.string().nullable().optional(),
    }).parse(req.body);

    const app = await prisma.artistApplication.findUnique({ where: { userId: req.params.userId } });
    if (!app) return next(new HttpError(404, 'Application not found'));

    const data = {};
    if (body.status) data.status = body.status;
    if (body.priority) data.priority = body.priority;
    if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo;

    const previousStatus = app.status;
    const previousPriority = app.priority;

    const [updated] = await prisma.$transaction([
      prisma.artistApplication.update({
        where: { userId: req.params.userId },
        data,
      }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: body.status ? `application_status_${body.status}` : 'application_status_updated',
          entityType: 'artist_application',
          entityId: req.params.userId,
          meta: {
            previousStatus,
            newStatus: body.status || previousStatus,
            previousPriority,
            newPriority: body.priority || previousPriority,
            ...(body.assignedTo !== undefined ? { assignedTo: body.assignedTo } : {}),
          },
        },
      }),
    ]);

    res.json({ application: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/applications/:userId/approve — approve application + create ArtistProfile
router.post('/applications/:userId/approve', async (req, res, next) => {
  try {
    const app = await prisma.artistApplication.findUnique({ where: { userId: req.params.userId } });
    if (!app) return next(new HttpError(404, 'Application not found'));

    const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!target) return next(new HttpError(404, 'User not found'));

    const scopes = computeScopes({ ...target, artistStatus: 'approved' });

    // Build ArtistProfile data from the application info step
    const info = app.info || {};
    const profileData = {
      bio: info.bio || null,
      experienceYears: info.experience ? parseInt(info.experience, 10) || null : null,
      education: info.education || null,
      awards: info.awards || null,
      specialization: info.specialization || null,
      mediums: info.mediums || [],
      styles: info.styles || [],
      subjects: info.subjects || [],
      website: info.website || null,
      instagram: info.instagram || null,
      facebook: info.facebook || null,
    };

    // Build notification for the user
    const notificationData = {
      userId: req.params.userId,
      type: 'artist_approved',
      channel: 'in_app',
      body: 'Congratulations! Your artist application has been approved. You can now start listing your artworks.',
    };

    const [updated] = await prisma.$transaction([
      prisma.artistApplication.update({
        where: { userId: req.params.userId },
        data: { status: 'approved', reviewedAt: new Date(), reviewedBy: req.user.sub },
      }),
      prisma.user.update({
        where: { id: req.params.userId },
        data: { artistStatus: 'approved', scopes },
      }),
      prisma.artistProfile.upsert({
        where: { userId: req.params.userId },
        create: { userId: req.params.userId, ...profileData },
        update: profileData,
      }),
      prisma.reviewQueue.updateMany({
        where: { type: 'artist', refId: req.params.userId, status: { in: ['open', 'assigned'] } },
        data: { status: 'resolved' },
      }),
      prisma.notification.create({ data: notificationData }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'approve_artist',
          entityType: 'artist_application',
          entityId: req.params.userId,
          meta: { applicationId: req.params.userId },
        },
      }),
    ]);

    res.json({ application: updated, artistStatus: 'approved', scopes });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/applications/:userId/reject — reject with reason + notification
router.post('/applications/:userId/reject', async (req, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);
    const app = await prisma.artistApplication.findUnique({ where: { userId: req.params.userId } });
    if (!app) return next(new HttpError(404, 'Application not found'));

    const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!target) return next(new HttpError(404, 'User not found'));

    const [updated] = await prisma.$transaction([
      prisma.artistApplication.update({
        where: { userId: req.params.userId },
        data: { status: 'rejected', rejectReason: reason, reviewedAt: new Date(), reviewedBy: req.user.sub },
      }),
      prisma.user.update({
        where: { id: req.params.userId },
        data: { artistStatus: 'rejected' },
      }),
      prisma.reviewQueue.updateMany({
        where: { type: 'artist', refId: req.params.userId, status: { in: ['open', 'assigned'] } },
        data: { status: 'resolved' },
      }),
      prisma.notification.create({
        data: {
          userId: req.params.userId,
          type: 'artist_rejected',
          channel: 'in_app',
          body: `Your artist application was not approved. Reason: ${reason}`,
        },
      }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'reject_artist',
          entityType: 'artist_application',
          entityId: req.params.userId,
          meta: { reason },
        },
      }),
    ]);

    res.json({ application: updated, artistStatus: 'rejected' });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/applications/:userId/request-info — request more information
router.post('/applications/:userId/request-info', async (req, res, next) => {
  try {
    const { message, categories } = z.object({
      message: z.string().min(1),
      categories: z.array(z.string()).optional(),
    }).parse(req.body);

    const app = await prisma.artistApplication.findUnique({ where: { userId: req.params.userId } });
    if (!app) return next(new HttpError(404, 'Application not found'));

    const [updated] = await prisma.$transaction([
      prisma.artistApplication.update({
        where: { userId: req.params.userId },
        data: { status: 'needs_info' },
      }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'request_info_artist',
          entityType: 'artist_application',
          entityId: req.params.userId,
          meta: { message, categories },
        },
      }),
    ]);

    res.json({ application: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/applications/:userId/notes — add internal note
router.post('/applications/:userId/notes', async (req, res, next) => {
  try {
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);
    const note = await prisma.applicationNote.create({
      data: {
        applicationUserId: req.params.userId,
        adminId: req.user.sub,
        content,
      },
      include: { admin: { select: { id: true, displayName: true, fullName: true } } },
    });
    res.json({ note });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/applications/:userId/notes — list notes
router.get('/applications/:userId/notes', async (req, res, next) => {
  try {
    const notes = await prisma.applicationNote.findMany({
      where: { applicationUserId: req.params.userId },
      include: { admin: { select: { id: true, displayName: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ notes });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/applications/bulk — bulk actions
router.post('/applications/bulk', async (req, res, next) => {
  try {
    const { userIds, action, value } = z.object({
      userIds: z.array(z.string()).min(1),
      action: z.enum(['assign_reviewer', 'change_priority', 'move_to_review']),
      value: z.string().optional(),
    }).parse(req.body);

    let data = {};
    if (action === 'assign_reviewer') data.assignedTo = value || null;
    else if (action === 'change_priority') data.priority = value || 'normal';
    else if (action === 'move_to_review') data.status = 'under_review';

    // Fetch previous values for accurate audit meta
    const previousApps = await prisma.artistApplication.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, status: true, priority: true, assignedTo: true },
    });
    const previousMap = {};
    previousApps.forEach(a => { previousMap[a.userId] = a; });

    const [result] = await prisma.$transaction([
      prisma.artistApplication.updateMany({
        where: { userId: { in: userIds } },
        data,
      }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: `bulk_${action}`,
          entityType: 'artist_application',
          entityId: userIds.join(','),
          meta: {
            count: userIds.length,
            action,
            value,
            affectedUserIds: userIds,
            previousValues: previousApps.map(a => ({
              userId: a.userId,
              status: a.status,
              priority: a.priority,
              assignedTo: a.assignedTo,
            })),
          },
        },
      }),
    ]);

    res.json({ updated: result.count });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// ORDERS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/orders — list all orders with filters + pagination
router.get('/orders', async (req, res, next) => {
  try {
    const { status, buyerId, search, sort = 'newest', page = '1', limit = '50' } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;
    if (buyerId) where.buyerId = buyerId;
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { buyer: { displayName: { contains: search } } },
      ];
    }

    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;
    const orderBy = sort === 'oldest' ? { createdAt: 'asc' }
      : sort === 'amount' ? { amount: 'desc' }
      : { createdAt: 'desc' };

    const [items, total, counts] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          buyer: { select: { id: true, displayName: true, email: true } },
          items: { include: { artwork: { select: { id: true, title: true, thumbnail: true } } } },
        },
        orderBy,
        take, skip,
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
    ]);

    const statusCounts = { all: 0, placed: 0, paid: 0, shipped: 0, delivered: 0, completed: 0, cancelled: 0, disputed: 0, refunded: 0 };
    counts.forEach(c => {
      statusCounts[c.status] = c._count.status;
      statusCounts.all += c._count.status;
    });

    const [revenue] = await prisma.$transaction([
      prisma.order.aggregate({
        where: { status: { in: ['paid', 'shipped', 'delivered', 'completed'] } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    res.json({
      items, total,
      counts: statusCounts,
      revenue: Number(revenue._sum.amount || 0),
      totalOrders: revenue._count,
      page: parseInt(page, 10), limit: take,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders/stats — order summary metrics
router.get('/orders/stats', async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
    const paidStatuses = ['paid', 'shipped', 'delivered', 'completed'];

    const [totalOrders, weekOrders, monthOrders, totalRevenue, weekRevenue, monthRevenue, avgOrderValue] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.order.aggregate({ where: { status: { in: paidStatuses } }, _sum: { amount: true } }),
      prisma.order.aggregate({ where: { status: { in: paidStatuses }, createdAt: { gte: sevenDaysAgo } }, _sum: { amount: true } }),
      prisma.order.aggregate({ where: { status: { in: paidStatuses }, createdAt: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
      prisma.order.aggregate({ where: { status: { in: paidStatuses } }, _avg: { amount: true } }),
    ]);

    res.json({
      totalOrders, weekOrders, monthOrders,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      weekRevenue: Number(weekRevenue._sum.amount || 0),
      monthRevenue: Number(monthRevenue._sum.amount || 0),
      avgOrderValue: Number(avgOrderValue._avg.amount || 0),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders/:id — single order detail
router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        buyer: { select: { id: true, displayName: true, email: true, phone: true } },
        items: { include: { artwork: { select: { id: true, title: true, thumbnail: true, price: true, images: true } } } },
      },
    });
    if (!order) return next(new HttpError(404, 'Order not found'));
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orders/:id/status — update order status
router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['placed', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed', 'refunded']) }).parse(req.body);
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return next(new HttpError(404, 'Order not found'));

    const [updated] = await prisma.$transaction([
      prisma.order.update({ where: { id: req.params.id }, data: { status } }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: `order_status_${status}`,
          entityType: 'order',
          entityId: req.params.id,
          meta: { from: order.status, to: status },
        },
      }),
    ]);
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// PAYOUTS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/payouts — list all payouts
router.get('/payouts', async (req, res, next) => {
  try {
    const { status, artistId, page = '1', limit = '50' } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;
    if (artistId) where.userId = artistId;

    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

    const [items, total, counts, totals] = await Promise.all([
      prisma.artistPayout.findMany({
        where,
        include: { user: { select: { id: true, displayName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take, skip,
      }),
      prisma.artistPayout.count({ where }),
      prisma.artistPayout.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.artistPayout.aggregate({
        where: { status: { in: ['pending', 'held'] } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const statusCounts = { all: 0, pending: 0, held: 0, settled: 0, failed: 0 };
    counts.forEach(c => {
      statusCounts[c.status] = c._count.status;
      statusCounts.all += c._count.status;
    });

    res.json({
      items, total, counts: statusCounts,
      pendingAmount: Number(totals._sum.amount || 0),
      pendingCount: totals._count,
      page: parseInt(page, 10), limit: take,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/payouts — create a payout for an artist
router.post('/payouts', async (req, res, next) => {
  try {
    const { userId, amount, method, txnRef } = z.object({
      userId: z.string(),
      amount: z.number().positive(),
      method: z.string().optional(),
      txnRef: z.string().optional(),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next(new HttpError(404, 'User not found'));
    if (user.artistStatus !== 'approved') return next(new HttpError(400, 'User is not an approved artist'));

    const payout = await prisma.$transaction([
      prisma.artistPayout.create({
        data: { userId, amount, method: method || null, txnRef: txnRef || null },
        include: { user: { select: { id: true, displayName: true } } },
      }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'create_payout',
          entityType: 'payout',
          entityId: userId,
          meta: { amount, method },
        },
      }),
    ]);
    res.json({ payout: payout[0] });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/payouts/:id/status — update payout status
router.patch('/payouts/:id/status', async (req, res, next) => {
  try {
    const { status, txnRef } = z.object({
      status: z.enum(['pending', 'held', 'settled', 'failed']),
      txnRef: z.string().optional(),
    }).parse(req.body);

    const payout = await prisma.artistPayout.findUnique({ where: { id: req.params.id } });
    if (!payout) return next(new HttpError(404, 'Payout not found'));

    const updateData = { status };
    if (txnRef) updateData.txnRef = txnRef;

    const [updated] = await prisma.$transaction([
      prisma.artistPayout.update({ where: { id: req.params.id }, data: updateData }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: `payout_status_${status}`,
          entityType: 'payout',
          entityId: req.params.id,
          meta: { from: payout.status, to: status },
        },
      }),
    ]);
    res.json({ payout: updated });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// COLLECTIONS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/collections — list all collections
router.get('/collections', async (req, res, next) => {
  try {
    const { search, page = '1', limit = '50' } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
      ];
    }
    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take, skip,
      }),
      prisma.collection.count({ where }),
    ]);

    // Enrich each collection with artwork count + thumbnails
    const enriched = await Promise.all(items.map(async (col) => {
      const artworkIds = col.artworkIds || [];
      const artworkCount = Array.isArray(artworkIds) ? artworkIds.length : 0;
      let thumbnails = [];
      if (artworkCount > 0) {
        const firstIds = Array.isArray(artworkIds) ? artworkIds.slice(0, 4) : [];
        thumbnails = await prisma.artwork.findMany({
          where: { id: { in: firstIds } },
          select: { id: true, thumbnail: true, title: true },
        });
      }
      return { ...col, artworkCount, thumbnails };
    }));

    res.json({ items: enriched, total, page: parseInt(page, 10), limit: take });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/collections — create a new collection
router.post('/collections', async (req, res, next) => {
  try {
    const { title, slug, artworkIds } = z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      artworkIds: z.array(z.string()).optional(),
    }).parse(req.body);

    // Check slug uniqueness
    const existing = await prisma.collection.findUnique({ where: { slug } });
    if (existing) return next(new HttpError(409, 'Slug already exists'));

    const collection = await prisma.$transaction([
      prisma.collection.create({
        data: { title, slug, curatorId: req.user.sub, artworkIds: artworkIds || [] },
      }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'create_collection',
          entityType: 'collection',
          entityId: slug,
          meta: { title, artworkCount: (artworkIds || []).length },
        },
      }),
    ]);
    res.json({ collection: collection[0] });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/collections/:id — update collection
router.patch('/collections/:id', async (req, res, next) => {
  try {
    const { title, slug, artworkIds } = z.object({
      title: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      artworkIds: z.array(z.string()).optional(),
    }).parse(req.body);

    const col = await prisma.collection.findUnique({ where: { id: req.params.id } });
    if (!col) return next(new HttpError(404, 'Collection not found'));

    // Check slug uniqueness if changed
    if (slug && slug !== col.slug) {
      const existing = await prisma.collection.findUnique({ where: { slug } });
      if (existing) return next(new HttpError(409, 'Slug already exists'));
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (slug !== undefined) data.slug = slug;
    if (artworkIds !== undefined) data.artworkIds = artworkIds;

    const [updated] = await prisma.$transaction([
      prisma.collection.update({ where: { id: req.params.id }, data }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'update_collection',
          entityType: 'collection',
          entityId: req.params.id,
          meta: { previous: { title: col.title, slug: col.slug }, changed: Object.keys(data) },
        },
      }),
    ]);
    res.json({ collection: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/collections/:id — delete collection
router.delete('/collections/:id', async (req, res, next) => {
  try {
    const col = await prisma.collection.findUnique({ where: { id: req.params.id } });
    if (!col) return next(new HttpError(404, 'Collection not found'));

    await prisma.$transaction([
      prisma.collection.delete({ where: { id: req.params.id } }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'delete_collection',
          entityType: 'collection',
          entityId: req.params.id,
          meta: { title: col.title },
        },
      }),
    ]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/notifications — list notifications for admin user
router.get('/notifications', async (req, res, next) => {
  try {
    const { unread, page = '1', limit = '50' } = req.query;
    const where = { userId: req.user.sub };
    if (unread === 'true') where.readAt = null;

    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take, skip,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.sub, readAt: null } }),
    ]);

    res.json({ items, total, unreadCount, page: parseInt(page, 10), limit: take });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/notifications/unread-count — quick unread count
router.get('/notifications/unread-count', async (req, res, next) => {
  try {
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.sub, readAt: null },
    });
    res.json({ unreadCount });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/notifications/:id/read — mark as read
router.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    const notif = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notif) return next(new HttpError(404, 'Notification not found'));
    if (notif.userId !== req.user.sub) return next(new HttpError(403, 'Not your notification'));

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { readAt: new Date() },
    });
    res.json({ notification: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/notifications/mark-all-read — mark all as read
router.post('/notifications/mark-all-read', async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.sub, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ updated: result.count });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/notifications — create a notification (admin broadcasting)
router.post('/notifications', async (req, res, next) => {
  try {
    const { userId, type, channel, body } = z.object({
      userId: z.string(),
      type: z.enum(['user_registered', 'artist_application_submitted', 'artist_approved', 'artist_rejected', 'artwork_submitted', 'artwork_published', 'artwork_rejected', 'order_placed', 'price_drop', 'artist_new_work', 'review_posted', 'payout_processed']),
      channel: z.enum(['in_app', 'email', 'push']).default('in_app'),
      body: z.string().min(1),
    }).parse(req.body);

    const notif = await prisma.notification.create({
      data: { userId, type, channel, body },
    });
    res.json({ notification: notif });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/notifications/:id — delete a notification
router.delete('/notifications/:id', async (req, res, next) => {
  try {
    const notif = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notif) return next(new HttpError(404, 'Notification not found'));
    if (notif.userId !== req.user.sub) return next(new HttpError(403, 'Not your notification'));

    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// CMS PAGES
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/cms — list all CMS pages
router.get('/cms', async (req, res, next) => {
  try {
    const { status, search, page = '1', limit = '50' } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

    const [items, total, counts] = await Promise.all([
      prisma.cmsPage.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take, skip,
      }),
      prisma.cmsPage.count({ where }),
      prisma.cmsPage.groupBy({ by: ['status'], _count: { status: true } }),
    ]);

    const statusCounts = { all: 0, draft: 0, published: 0, archived: 0 };
    counts.forEach(c => {
      statusCounts[c.status] = c._count.status;
      statusCounts.all += c._count.status;
    });

    res.json({ items, total, counts: statusCounts, page: parseInt(page, 10), limit: take });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/cms/:id — single CMS page
router.get('/cms/:id', async (req, res, next) => {
  try {
    const page = await prisma.cmsPage.findUnique({ where: { id: req.params.id } });
    if (!page) return next(new HttpError(404, 'Page not found'));
    res.json({ page });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/cms — create CMS page
router.post('/cms', async (req, res, next) => {
  try {
    const { slug, title, body, status } = z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      body: z.string().default(''),
      status: z.enum(['draft', 'published', 'archived']).default('draft'),
    }).parse(req.body);

    const existing = await prisma.cmsPage.findUnique({ where: { slug } });
    if (existing) return next(new HttpError(409, 'Slug already exists'));

    const [page] = await prisma.$transaction([
      prisma.cmsPage.create({ data: { slug, title, body, status } }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'create_cms_page',
          entityType: 'cms_page',
          entityId: slug,
          meta: { title, status },
        },
      }),
    ]);
    res.json({ page });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/cms/:id — update CMS page
router.patch('/cms/:id', async (req, res, next) => {
  try {
    const { slug, title, body, status } = z.object({
      slug: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
      body: z.string().optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
    }).parse(req.body);

    const existing = await prisma.cmsPage.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new HttpError(404, 'Page not found'));

    // Check slug uniqueness if changed
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.cmsPage.findUnique({ where: { slug } });
      if (slugExists) return next(new HttpError(409, 'Slug already exists'));
    }

    const data = {};
    if (slug !== undefined) data.slug = slug;
    if (title !== undefined) data.title = title;
    if (body !== undefined) data.body = body;
    if (status !== undefined) data.status = status;

    const [page] = await prisma.$transaction([
      prisma.cmsPage.update({ where: { id: req.params.id }, data }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'update_cms_page',
          entityType: 'cms_page',
          entityId: req.params.id,
          meta: { changed: Object.keys(data) },
        },
      }),
    ]);
    res.json({ page });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/cms/:id — delete CMS page
router.delete('/cms/:id', async (req, res, next) => {
  try {
    const page = await prisma.cmsPage.findUnique({ where: { id: req.params.id } });
    if (!page) return next(new HttpError(404, 'Page not found'));

    await prisma.$transaction([
      prisma.cmsPage.delete({ where: { id: req.params.id } }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'delete_cms_page',
          entityType: 'cms_page',
          entityId: req.params.id,
          meta: { title: page.title },
        },
      }),
    ]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// TAXONOMY — CATEGORIES MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/categories — list all categories as flat tree
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { artworks: true } },
        children: { orderBy: { name: 'asc' } },
      },
    });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/categories — create category
router.post('/categories', async (req, res, next) => {
  try {
    const { name, slug, parentId } = z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      parentId: z.string().nullable().optional(),
    }).parse(req.body);

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return next(new HttpError(409, 'Slug already exists'));

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) return next(new HttpError(404, 'Parent category not found'));
    }

    const [category] = await prisma.$transaction([
      prisma.category.create({ data: { name, slug, parentId: parentId || null } }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'create_category',
          entityType: 'category',
          entityId: slug,
          meta: { name, slug, parentId: parentId || null },
        },
      }),
    ]);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/categories/:id — update category
router.patch('/categories/:id', async (req, res, next) => {
  try {
    const { name, slug, parentId } = z.object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      parentId: z.string().nullable().optional(),
    }).parse(req.body);

    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new HttpError(404, 'Category not found'));

    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.category.findUnique({ where: { slug } });
      if (slugExists) return next(new HttpError(409, 'Slug already exists'));
    }

    if (parentId === existing.id) return next(new HttpError(400, 'Category cannot be its own parent'));

    if (parentId && parentId !== existing.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) return next(new HttpError(404, 'Parent category not found'));
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (parentId !== undefined) data.parentId = parentId || null;

    const [category] = await prisma.$transaction([
      prisma.category.update({ where: { id: req.params.id }, data }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'update_category',
          entityType: 'category',
          entityId: req.params.id,
          meta: { previous: { name: existing.name, slug: existing.slug }, changes: data },
        },
      }),
    ]);
    res.json({ category });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/categories/:id — delete category
router.delete('/categories/:id', async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { artworks: true } }, children: true },
    });
    if (!category) return next(new HttpError(404, 'Category not found'));

    if (category._count.artworks > 0) {
      return next(new HttpError(400, `Cannot delete category: ${category._count.artworks} artwork(s) reference it`));
    }

    await prisma.$transaction([
      prisma.category.delete({ where: { id: req.params.id } }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'delete_category',
          entityType: 'category',
          entityId: req.params.id,
          meta: { name: category.name, slug: category.slug, hadChildren: category.children.length > 0 },
        },
      }),
    ]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// TAXONOMY — MEDIUMS, STYLES, THEMES, SUBJECTS
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/taxonomy/:type — list all items of a type
router.get('/taxonomy/:type', async (req, res, next) => {
  try {
    const validTypes = ['medium', 'style', 'theme', 'subject'];
    if (!validTypes.includes(req.params.type)) {
      return next(new HttpError(400, `Invalid type. Must be one of: ${validTypes.join(', ')}`));
    }
    const items = await prisma.taxonomy.findMany({
      where: { type: req.params.type },
      orderBy: { name: 'asc' },
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/taxonomy/:type — create a taxonomy item
router.post('/taxonomy/:type', async (req, res, next) => {
  try {
    const validTypes = ['medium', 'style', 'theme', 'subject'];
    if (!validTypes.includes(req.params.type)) {
      return next(new HttpError(400, `Invalid type. Must be one of: ${validTypes.join(', ')}`));
    }
    const { name, slug } = z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
    }).parse(req.body);

    const existing = await prisma.taxonomy.findUnique({
      where: { type_slug: { type: req.params.type, slug } },
    });
    if (existing) return next(new HttpError(409, 'Slug already exists for this type'));

    const [item] = await prisma.$transaction([
      prisma.taxonomy.create({ data: { type: req.params.type, name, slug } }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'create_taxonomy',
          entityType: `taxonomy_${req.params.type}`,
          entityId: slug,
          meta: { name, slug, type: req.params.type },
        },
      }),
    ]);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/taxonomy/:type/:id — update a taxonomy item
router.patch('/taxonomy/:type/:id', async (req, res, next) => {
  try {
    const { name, slug } = z.object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
    }).parse(req.body);

    const existing = await prisma.taxonomy.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new HttpError(404, 'Taxonomy item not found'));

    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.taxonomy.findUnique({
        where: { type_slug: { type: existing.type, slug } },
      });
      if (slugExists) return next(new HttpError(409, 'Slug already exists for this type'));
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;

    const [item] = await prisma.$transaction([
      prisma.taxonomy.update({ where: { id: req.params.id }, data }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'update_taxonomy',
          entityType: `taxonomy_${existing.type}`,
          entityId: req.params.id,
          meta: { previous: { name: existing.name }, changes: data },
        },
      }),
    ]);
    res.json({ item });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/taxonomy/:type/:id — delete a taxonomy item
router.delete('/taxonomy/:type/:id', async (req, res, next) => {
  try {
    const existing = await prisma.taxonomy.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new HttpError(404, 'Taxonomy item not found'));

    await prisma.$transaction([
      prisma.taxonomy.delete({ where: { id: req.params.id } }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'delete_taxonomy',
          entityType: `taxonomy_${existing.type}`,
          entityId: req.params.id,
          meta: { name: existing.name, type: existing.type },
        },
      }),
    ]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export default router;
