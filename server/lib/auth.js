// server/lib/auth.js
// JWT issue/verify + password hashing helpers.
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || ACCESS_SECRET === 'dev-only-placeholder') {
  console.error('[FATAL] JWT_SECRET must be set to a strong, unique value in .env');
  process.exit(1);
}
if (!REFRESH_SECRET || REFRESH_SECRET === 'dev-only-placeholder') {
  console.error('[FATAL] JWT_REFRESH_SECRET must be set to a strong, unique value in .env');
  process.exit(1);
}

const ACCESS_TTL = process.env.TOKEN_EXPIRY ? `${process.env.TOKEN_EXPIRY}s` : '900s';
const REFRESH_TTL_DAYS = process.env.REFRESH_EXPIRY_DAYS
  ? parseInt(process.env.REFRESH_EXPIRY_DAYS, 10)
  : 30;

export function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export function issueAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      artistStatus: user.artistStatus,
      scopes: user.scopes,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

export function issueRefreshToken(user) {
  return jwt.sign({ sub: user.id }, REFRESH_SECRET, { expiresIn: `${REFRESH_TTL_DAYS}d` });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}
