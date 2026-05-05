import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { asyncHandler, HttpError } from '../utils/errors.js';
import { signToken } from '../utils/tokens.js';
import { userSelect } from '../utils/access.js';
import { toPublicUser } from '../utils/serializers.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, signupSchema } from '../utils/schemas.js';

const router = Router();

router.post(
  '/signup',
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const existing = await User.findOne({ email });

    if (existing) {
      throw new HttpError(409, 'An account with this email already exists');
    }

    const user = await User.create({
      name: req.body.name,
      email,
      passwordHash: await bcrypt.hash(req.body.password, 12)
    });

    const publicUser = toPublicUser(user);

    res.status(201).json({
      user: publicUser,
      token: signToken(user)
    });
  })
);

router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const validPassword = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!validPassword) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const publicUser = toPublicUser(user);

    res.json({
      user: publicUser,
      token: signToken(user)
    });
  })
);

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
