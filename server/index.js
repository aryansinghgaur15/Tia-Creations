// server/index.js
// TIA Creations API server entry.
// Wires auth, artist, artworks, admin routes behind /api with scope-gated middleware.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { attachUser, HttpError } from './lib/middleware.js';
import { rateLimit } from './lib/rateLimit.js';
import authRoutes from './routes/auth.js';
import artistRoutes from './routes/artist.js';
import artworkRoutes from './routes/artworks.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import categoryRoutes from './routes/categories.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

// ── CORS ────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (curl, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
      return callback(null, true);
    }
    callback(new HttpError(403, 'CORS: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// ── Security Headers ────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// ── Body Parsing ────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

// ── Rate Limiting ───────────────────────────────────────────────
// Global: 120 requests/minute
app.use(rateLimit({ windowMs: 60_000, max: 120, keyPrefix: 'global' }));

// Auth endpoints: stricter (15/min for login, 10/min for register)
app.use('/api/auth/login', rateLimit({ windowMs: 60_000, max: 15, keyPrefix: 'auth-login' }));
app.use('/api/auth/register', rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'auth-register' }));
app.use('/api/auth/refresh', rateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'auth-refresh' }));

// Admin mutations: 60/min (write operations)
app.use('/api/admin', (req, res, next) => {
  if (req.method !== 'GET') {
    return rateLimit({ windowMs: 60_000, max: 60, keyPrefix: 'admin-write' })(req, res, next);
  }
  next();
});

// ── User Attachment ─────────────────────────────────────────────
app.use(attachUser);

// ── Root ────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({
  name: 'TIA Creations API',
  version: '1.0.0',
  docs: '/api/health',
}));

// ── Health Check ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── Static Files (uploaded images) ─────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Route Groups ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/artist', artistRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);

// ── 404 ─────────────────────────────────────────────────────────
app.use('/api', (_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Central Error Handler ───────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  // Zod validation errors → 400
  if (err.name === 'ZodError') {
    const message = err.errors?.map(e => e.message).join('; ') || 'Validation failed';
    return res.status(400).json({ error: message, details: err.errors });
  }
  console.error('[Unhandled]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`TIA Creations API listening on :${PORT}`);
});

export default app;
