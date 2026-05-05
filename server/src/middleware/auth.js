import { User } from '../models/User.js';
import { verifyToken } from '../utils/tokens.js';
import { HttpError } from '../utils/errors.js';
import { userSelect } from '../utils/access.js';
import { toPublicUser } from '../utils/serializers.js';

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new HttpError(401, 'Authentication required');
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).select(userSelect);

    if (!user) {
      throw new HttpError(401, 'Your session is no longer valid');
    }

    req.user = toPublicUser(user);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new HttpError(401, 'Your session has expired'));
      return;
    }
    next(error);
  }
}
