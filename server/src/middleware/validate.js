import { ZodError } from 'zod';
import { HttpError } from '../utils/errors.js';

export function validateBody(schema) {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new HttpError(
            400,
            'Validation failed',
            error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message
            }))
          )
        );
        return;
      }
      next(error);
    }
  };
}
