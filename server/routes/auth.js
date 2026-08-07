// server/routes/auth.js
// Auth & Identity — blueprint §14.1. Single public registration.
// No buyer/artist split at signup (blueprint §0, §2).
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, issueAccessToken, issueRefreshToken } from '../lib/auth.js';
import { computeScopes } from '../lib/scopes.js';
import { requireAuth, loadAccount, HttpError } from '../lib/middleware.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1),
  displayName: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register — every user starts as role=user, artistStatus=none
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName, displayName } = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return next(new HttpError(409, 'Email already registered'));

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        fullName,
        displayName: displayName || fullName,
        role: 'user',
        artistStatus: 'none',
      },
    });

    const scopes = computeScopes(user);
    await prisma.user.update({ where: { id: user.id }, data: { scopes } });

    // event user.registered would be emitted here (blueprint §16)
    res.status(201).json({
      user: publicUser(user, scopes),
      accessToken: issueAccessToken({ ...user, scopes }),
      refreshToken: issueRefreshToken(user),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return next(new HttpError(401, 'Invalid credentials'));
    }
    if (user.userStatus === 'banned') return next(new HttpError(403, 'Account banned'));
    const scopes = computeScopes(user);
    res.json({
      user: publicUser(user, scopes),
      accessToken: issueAccessToken({ ...user, scopes }),
      refreshToken: issueRefreshToken(user),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const { verifyRefreshToken } = await import('../lib/auth.js');
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) return next(new HttpError(401, 'Invalid refresh token'));
    const scopes = computeScopes(user);
    res.json({
      accessToken: issueAccessToken({ ...user, scopes }),
      refreshToken: issueRefreshToken(user),
    });
  } catch {
    next(new HttpError(401, 'Invalid refresh token'));
  }
});

// GET /api/me — current user profile + scopes
router.get('/me', requireAuth, loadAccount, (req, res) => {
  res.json({ user: publicUser(req.account, req.account.scopes) });
});

// PATCH /api/me — edit profile/settings
router.patch('/me', requireAuth, loadAccount, async (req, res, next) => {
  try {
    const schema = z.object({
      displayName: z.string().min(1).optional(),
      fullName: z.string().optional(),
      avatarUrl: z.string().url().optional(),
      phone: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const updated = await prisma.user.update({ where: { id: req.account.id }, data });
    res.json({ user: publicUser(updated, updated.scopes) });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// USER ADDRESSES
// ============================================================
router.get('/addresses', requireAuth, async (req, res, next) => {
  try {
    const addresses = await prisma.userAddress.findMany({
      where: { userId: req.account.id },
      orderBy: { isDefault: 'desc' },
    });
    res.json({ addresses });
  } catch (err) { next(err); }
});

router.post('/addresses', requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      label: z.string().min(1),
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      pincode: z.string().min(1),
      country: z.string().min(1),
      isDefault: z.boolean().optional(),
    });
    const data = schema.parse(req.body);

    if (data.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: req.account.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.userAddress.create({
      data: { userId: req.account.id, ...data },
    });
    res.status(201).json({ address });
  } catch (err) { next(err); }
});

router.patch('/addresses/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.userAddress.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.account.id) {
      return next(new HttpError(404, 'Address not found'));
    }

    const schema = z.object({
      label: z.string().min(1).optional(),
      line1: z.string().min(1).optional(),
      line2: z.string().optional(),
      city: z.string().min(1).optional(),
      state: z.string().min(1).optional(),
      pincode: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
      isDefault: z.boolean().optional(),
    });
    const data = schema.parse(req.body);

    if (data.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: req.account.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.userAddress.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ address });
  } catch (err) { next(err); }
});

router.delete('/addresses/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.userAddress.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.account.id) {
      return next(new HttpError(404, 'Address not found'));
    }
    await prisma.userAddress.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ============================================================
// USER NOTIFICATIONS
// ============================================================
router.get('/notifications', requireAuth, async (req, res, next) => {
  try {
    const { unread, page = '1', limit = '20' } = req.query;
    const where = { userId: req.account.id };
    if (unread === 'true') where.readAt = null;

    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * take;

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take, skip,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.account.id, readAt: null } }),
    ]);

    res.json({ items, total, unreadCount, page: parseInt(page, 10), limit: take });
  } catch (err) { next(err); }
});

router.get('/notifications/unread-count', requireAuth, async (req, res, next) => {
  try {
    const unreadCount = await prisma.notification.count({
      where: { userId: req.account.id, readAt: null },
    });
    res.json({ unreadCount });
  } catch (err) { next(err); }
});

router.patch('/notifications/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notif = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notif || notif.userId !== req.account.id) {
      return next(new HttpError(404, 'Notification not found'));
    }
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { readAt: new Date() },
    });
    res.json({ notification: updated });
  } catch (err) { next(err); }
});

router.post('/notifications/mark-all-read', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.account.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

function publicUser(user, scopes) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    userStatus: user.userStatus,
    role: user.role,
    artistStatus: user.artistStatus,
    scopes,
  };
}

export default router;
