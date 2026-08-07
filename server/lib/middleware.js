// server/lib/middleware.js
// Authentication + scope-gated authorization middleware.
// Enforces blueprint §3 permission matrix and §21.10 / §19.9 UI guards at the API edge.
import { verifyAccessToken } from './auth.js';
import { hasScope } from './scopes.js';
import { prisma } from './prisma.js';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Attach req.user (decoded token) — does NOT block unauthenticated requests.
export function attachUser(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      req.user = verifyAccessToken(token);
    } catch {
      // invalid/expired token -> treat as anonymous, downstream guards decide
      req.user = null;
    }
  }
  next();
}

// Require a valid access token (any authenticated user).
export function requireAuth(req, _res, next) {
  if (!req.user) {
    return next(new HttpError(401, 'Authentication required'));
  }
  next();
}

// Require one or more scopes (blueprint permission matrix).
export function requireScope(...scopes) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'Authentication required'));
    }
    const ok = scopes.every((s) => hasScope(req.user, s));
    if (!ok) {
      return next(new HttpError(403, `Missing required scope: ${scopes.join(', ')}`));
    }
    next();
  };
}

// Require admin role (internal-only accounts, blueprint §1).
export function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new HttpError(403, 'Admin access only'));
  }
  next();
}

// Re-fetch fresh user row (with computed scopes) and attach as req.account.
// Use before mutations that change status so audits/logic see live state.
export async function loadAccount(req, _res, next) {
  try {
    const account = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!account) return next(new HttpError(401, 'Account not found'));
    if (account.userStatus === 'banned') return next(new HttpError(403, 'Account banned'));
    req.account = account;
    next();
  } catch (err) {
    next(err);
  }
}
