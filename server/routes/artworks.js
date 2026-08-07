// server/routes/artworks.js
// Artwork lifecycle — blueprint §6, §14.3, §14.4.
// Public browse + authenticated wishlist/review + artist CRUD + admin review.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, loadAccount, requireScope, requireAdmin, HttpError } from '../lib/middleware.js';

const router = Router();

const artworkInput = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  subcategory: z.string().optional().nullable(),
  customSubcategory: z.string().optional().nullable(),
  medium: z.string().optional(),
  style: z.string().optional(),
  subject: z.string().optional(),
  orientation: z.string().optional(),
  dimensions: z.string().optional(),
  year: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  certificate: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  images: z.any().optional(), // [{full, featured, thumb}]
  thumbnail: z.string().optional(),
});

// GET /api/artworks/mine — artist's own artworks (all statuses)
router.get('/mine', requireAuth, loadAccount, async (req, res, next) => {
  try {
    const artworks = await prisma.artwork.findMany({
      where: { artistId: req.account.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ artworks });
  } catch (err) {
    next(err);
  }
});

// GET /api/artworks — public list (published only), filterable
router.get('/', async (req, res, next) => {
  try {
    const { medium, style, subject, tag, artistId, status, search, page = '1', limit = '24' } = req.query;
    const where = { status: 'published' };
    if (medium) where.medium = medium;
    if (style) where.style = style;
    if (subject) where.subject = subject;
    if (tag) where.tags = { hasSome: [tag] };
    if (artistId) where.artistId = artistId;
    if (status && req.user?.role === 'admin') where.status = status;
    if (search) where.title = { contains: search };

    const take = Math.min(parseInt(limit, 10) || 24, 60);
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.artwork.findMany({
        where,
        include: {
          artist: { select: { id: true, displayName: true, avatarUrl: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take,
        skip,
      }),
      prisma.artwork.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page, 10), limit: take });
  } catch (err) {
    next(err);
  }
});

// GET /api/artworks/:id — public if published (or owner/admin always)
router.get('/:id', async (req, res, next) => {
  try {
    const artwork = await prisma.artwork.findUnique({
      where: { id: req.params.id },
      include: {
        artist: { select: { id: true, displayName: true, avatarUrl: true, artistStatus: true } },
        reviews: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
        category: { select: { id: true, name: true, slug: true, parent: { select: { id: true, name: true, slug: true } } } },
      },
    });
    if (!artwork) return next(new HttpError(404, 'Artwork not found'));
    const isOwner = req.user?.sub === artwork.artistId;
    const isAdmin = req.user?.role === 'admin';
    if (artwork.status !== 'published' && !isOwner && !isAdmin) {
      return next(new HttpError(404, 'Artwork not found'));
    }
    res.json({ artwork });
  } catch (err) {
    next(err);
  }
});

// POST /api/artworks — artist creates draft (scope upload_artwork)
router.post('/', requireAuth, loadAccount, requireScope('upload_artwork'), async (req, res, next) => {
  try {
    const data = artworkInput.parse(req.body);
    const artwork = await prisma.artwork.create({
      data: { ...data, artistId: req.account.id, status: 'draft' },
    });
    res.status(201).json({ artwork });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/artworks/:id — owner edits draft/rejected/changes_requested only
router.patch('/:id', requireAuth, loadAccount, requireScope('manage_artwork'), async (req, res, next) => {
  try {
    const artwork = await prisma.artwork.findUnique({ where: { id: req.params.id } });
    if (!artwork) return next(new HttpError(404, 'Artwork not found'));
    if (artwork.artistId !== req.account.id) return next(new HttpError(403, 'Not your artwork'));
    if (!['draft', 'rejected', 'changes_requested'].includes(artwork.status)) {
      return next(new HttpError(400, 'Only draft/rejected/changes_requested artworks can be edited'));
    }
    const data = artworkInput.partial().parse(req.body);
    const updated = await prisma.artwork.update({ where: { id: req.params.id }, data });
    res.json({ artwork: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/artworks/:id/submit — draft or changes_requested -> in_review
router.post('/:id/submit', requireAuth, loadAccount, requireScope('manage_artwork'), async (req, res, next) => {
  try {
    const artwork = await prisma.artwork.findUnique({ where: { id: req.params.id } });
    if (!artwork) return next(new HttpError(404, 'Artwork not found'));
    if (artwork.artistId !== req.account.id) return next(new HttpError(403, 'Not your artwork'));
    if (!['draft', 'changes_requested'].includes(artwork.status)) {
      return next(new HttpError(400, 'Only draft or changes_requested artworks can be submitted'));
    }

    const [updated] = await prisma.$transaction([
      prisma.artwork.update({ where: { id: req.params.id }, data: { status: 'in_review' } }),
      prisma.reviewQueue.create({ data: { type: 'artwork', refId: req.params.id, status: 'open' } }),
      prisma.notification.create({
        data: {
          userId: artwork.artistId,
          type: 'artwork_submitted',
          channel: 'in_app',
          body: `Your artwork "${artwork.title}" has been submitted for review.`,
        },
      }),
    ]);
    res.json({ artwork: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/artworks/:id — owner deletes draft/rejected
router.delete('/:id', requireAuth, loadAccount, requireScope('manage_artwork'), async (req, res, next) => {
  try {
    const artwork = await prisma.artwork.findUnique({ where: { id: req.params.id } });
    if (!artwork) return next(new HttpError(404, 'Artwork not found'));
    if (artwork.artistId !== req.account.id) return next(new HttpError(403, 'Not your artwork'));
    if (!['draft', 'rejected', 'changes_requested'].includes(artwork.status)) {
      return next(new HttpError(400, 'Cannot delete published artwork'));
    }
    await prisma.artwork.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/artworks/:id/save — wishlist (scope wishlist)
router.post('/:id/save', requireAuth, loadAccount, requireScope('wishlist'), async (req, res, next) => {
  try {
    await prisma.artworkSave.upsert({
      where: { userId_artworkId: { userId: req.account.id, artworkId: req.params.id } },
      create: { userId: req.account.id, artworkId: req.params.id },
      update: {},
    });
    await prisma.artwork.update({ where: { id: req.params.id }, data: { saves: { increment: 1 } } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/artworks/:id/reviews — review (scope review)
router.post('/:id/reviews', requireAuth, loadAccount, requireScope('review'), async (req, res, next) => {
  try {
    const schema = z.object({ rating: z.number().min(1).max(5), title: z.string().optional(), body: z.string().optional() });
    const data = schema.parse(req.body);
    const review = await prisma.artworkReview.create({
      data: { ...data, artworkId: req.params.id, userId: req.account.id },
    });
    // event review.posted (blueprint §16)
    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
});

// ── ADMIN review actions (blueprint §14.5, §5.2) ──

// POST /api/artworks/:id/approve — in_review -> published
router.post('/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    const artwork = await prisma.artwork.findUnique({ where: { id: req.params.id } });
    if (!artwork) return next(new HttpError(404, 'Artwork not found'));
    if (artwork.status !== 'in_review') return next(new HttpError(400, 'Artwork not in review'));

    const [updated] = await prisma.$transaction([
      prisma.artwork.update({
        where: { id: req.params.id },
        data: { status: 'published', publishedAt: new Date() },
      }),
      prisma.reviewQueue.updateMany({
        where: { type: 'artwork', refId: req.params.id, status: 'open' },
        data: { status: 'resolved' },
      }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'approve_artwork',
          entityType: 'artwork',
          entityId: req.params.id,
          meta: { previousStatus: artwork.status, newStatus: 'published' },
        },
      }),
      prisma.notification.create({
        data: {
          userId: artwork.artistId,
          type: 'artwork_published',
          channel: 'in_app',
          body: `Your artwork "${artwork.title}" has been approved and is now live on the marketplace.`,
        },
      }),
    ]);
    res.json({ artwork: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/artworks/:id/reject — in_review -> rejected (require reason)
router.post('/:id/reject', requireAdmin, async (req, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);
    const artwork = await prisma.artwork.findUnique({ where: { id: req.params.id } });
    if (!artwork) return next(new HttpError(404, 'Artwork not found'));
    if (artwork.status !== 'in_review') return next(new HttpError(400, 'Artwork not in review'));

    const [updated] = await prisma.$transaction([
      prisma.artwork.update({ where: { id: req.params.id }, data: { status: 'rejected' } }),
      prisma.reviewQueue.updateMany({
        where: { type: 'artwork', refId: req.params.id, status: 'open' },
        data: { status: 'resolved' },
      }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'reject_artwork',
          entityType: 'artwork',
          entityId: req.params.id,
          meta: { reason, previousStatus: artwork.status, newStatus: 'rejected' },
        },
      }),
      prisma.notification.create({
        data: {
          userId: artwork.artistId,
          type: 'artwork_rejected',
          channel: 'in_app',
          body: `Your artwork "${artwork.title}" was not approved. Reason: ${reason}`,
        },
      }),
    ]);
    res.json({ artwork: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/artworks/:id/request-changes — in_review -> changes_requested
router.post('/:id/request-changes', requireAdmin, async (req, res, next) => {
  try {
    const { feedback } = z.object({ feedback: z.string().min(1) }).parse(req.body);
    const artwork = await prisma.artwork.findUnique({ where: { id: req.params.id } });
    if (!artwork) return next(new HttpError(404, 'Artwork not found'));
    if (artwork.status !== 'in_review') return next(new HttpError(400, 'Artwork not in review'));

    const [updated] = await prisma.$transaction([
      prisma.artwork.update({ where: { id: req.params.id }, data: { status: 'changes_requested' } }),
      prisma.reviewQueue.updateMany({
        where: { type: 'artwork', refId: req.params.id, status: 'open' },
        data: { status: 'resolved' },
      }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'request_changes_artwork',
          entityType: 'artwork',
          entityId: req.params.id,
          meta: { feedback, previousStatus: artwork.status, newStatus: 'changes_requested' },
        },
      }),
      prisma.notification.create({
        data: {
          userId: artwork.artistId,
          type: 'artwork_changes_requested',
          channel: 'in_app',
          body: `Changes requested for "${artwork.title}". Feedback: ${feedback}`,
        },
      }),
    ]);
    res.json({ artwork: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/artworks/:id/archive — published -> archived
router.post('/:id/archive', requireAdmin, async (req, res, next) => {
  try {
    const artwork = await prisma.artwork.findUnique({ where: { id: req.params.id } });
    if (!artwork) return next(new HttpError(404, 'Artwork not found'));
    if (!['published', 'rejected'].includes(artwork.status)) {
      return next(new HttpError(400, 'Only published or rejected artworks can be archived'));
    }

    const [updated] = await prisma.$transaction([
      prisma.artwork.update({ where: { id: req.params.id }, data: { status: 'archived' } }),
      prisma.reviewQueue.updateMany({
        where: { type: 'artwork', refId: req.params.id, status: 'open' },
        data: { status: 'resolved' },
      }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: 'archive_artwork',
          entityType: 'artwork',
          entityId: req.params.id,
          meta: { previousStatus: artwork.status, newStatus: 'archived' },
        },
      }),
    ]);
    res.json({ artwork: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/artworks/:id/feature — toggle is_featured
router.post('/:id/feature', requireAdmin, async (req, res, next) => {
  try {
    const { featured } = z.object({ featured: z.boolean() }).parse(req.body);
    const artwork = await prisma.artwork.findUnique({ where: { id: req.params.id } });
    if (!artwork) return next(new HttpError(404, 'Artwork not found'));

    const [updated] = await prisma.$transaction([
      prisma.artwork.update({
        where: { id: req.params.id },
        data: { isFeatured: featured },
      }),
      prisma.adminAudit.create({
        data: {
          adminId: req.user.sub,
          action: featured ? 'feature_artwork' : 'unfeature_artwork',
          entityType: 'artwork',
          entityId: req.params.id,
          meta: { previousFeatured: artwork.isFeatured, newFeatured: featured },
        },
      }),
    ]);
    res.json({ artwork: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
