import jwt from 'jsonwebtoken';

const getSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }
  return process.env.JWT_SECRET;
};

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email
    },
    getSecret(),
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}
