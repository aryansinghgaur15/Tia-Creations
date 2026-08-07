// server/routes/artist.js
// Artist onboarding — blueprint §4 (6-step) + §14.2.
// Single account: any role=user can apply. artistStatus gates the scopes.
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, loadAccount, HttpError } from '../lib/middleware.js';

const router = Router();

// GET /api/artist/application — current draft + step (or null)
router.get('/application', requireAuth, loadAccount, async (req, res, next) => {
  try {
    const app = await prisma.artistApplication.findUnique({ where: { userId: req.account.id } });
    res.json({ application: app || null, artistStatus: req.account.artistStatus });
  } catch (err) {
    next(err);
  }
});

// POST /api/artist/application/step/:n — autosave a step (1..6)
const STEP_FIELDS = {
  1: ['personal'],
  2: ['info'],
  3: ['portfolio'],
  4: ['kycDocs'],
  5: ['payment'],
  6: ['terms'],
};

router.post('/application/step/:n', requireAuth, loadAccount, async (req, res, next) => {
  try {
    const n = parseInt(req.params.n, 10);
    if (n < 1 || n > 6) return next(new HttpError(400, 'Invalid step'));
    if (req.account.artistStatus === 'approved') {
      return next(new HttpError(400, 'Already an approved artist'));
    }
    if (req.account.artistStatus === 'pending') {
      return next(new HttpError(400, 'Application already submitted for review'));
    }

    const payload = req.body ?? {};
    const data = { step: n };
    // store the provided jsonb blob for this step
    const field = STEP_FIELDS[n][0];
    data[field] = payload;

    const upserted = await prisma.artistApplication.upsert({
      where: { userId: req.account.id },
      create: { userId: req.account.id, ...data },
      update: data,
    });
    res.json({ application: upserted });
  } catch (err) {
    next(err);
  }
});

// POST /api/artist/application/submit — artistStatus=pending, queue event
router.post('/application/submit', requireAuth, loadAccount, async (req, res, next) => {
  try {
    if (req.account.artistStatus !== 'none') {
      return next(new HttpError(400, `Cannot submit: current status ${req.account.artistStatus}`));
    }
    const app = await prisma.artistApplication.findUnique({ where: { userId: req.account.id } });
    if (!app || app.step < 6) {
      return next(new HttpError(400, 'Complete all 6 steps before submitting'));
    }

    const updated = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.account.id },
        data: { artistStatus: 'pending' },
      }),
      prisma.artistApplication.update({
        where: { userId: req.account.id },
        data: { submittedAt: new Date() },
      }),
      prisma.reviewQueue.create({
        data: { type: 'artist', refId: req.account.id, status: 'open' },
      }),
    ]);
    // event artist.application.submitted (blueprint §16) emitted here
    res.json({ artistStatus: updated[0].artistStatus });
  } catch (err) {
    next(err);
  }
});

// GET /api/artist/application/status
router.get('/application/status', requireAuth, loadAccount, (req, res) => {
  res.json({ artistStatus: req.account.artistStatus });
});

export default router;
