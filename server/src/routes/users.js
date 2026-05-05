import { Router } from 'express';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { userSelect } from '../utils/access.js';
import { toPublicUser } from '../utils/serializers.js';

const router = Router();

router.use(authenticate);

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? '').trim();

    if (q.length < 2) {
      res.json({ users: [] });
      return;
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({
      $or: [{ email: regex }, { name: regex }]
    })
      .select(userSelect)
      .sort({ name: 1 })
      .limit(8);

    res.json({
      users: users.map(toPublicUser).filter((user) => user.id !== req.user.id)
    });
  })
);

export default router;
