import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { name: 'asc' },
          include: {
            children: { orderBy: { name: 'asc' } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

export default router;
