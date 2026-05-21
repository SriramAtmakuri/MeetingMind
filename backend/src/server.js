import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

// Routes
import meetingRoutes from './routes/meetings.js';
import uploadRoutes from './routes/upload.js';
import searchRoutes from './routes/search.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import actionItemRoutes from './routes/action-items.js';
import exportRoutes from './routes/exports.js';
import aiChatRoutes from './routes/ai-chat.js';
import templateRoutes from './routes/templates.js';
import comparisonRoutes from './routes/comparisons.js';
import seedRoutes from './routes/seed.js';
import { requireAuth, extractUser } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Upload limit reached. Try again in an hour.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 30,
  message: { error: 'AI request limit reached. Try again shortly.' },
});

app.use('/api', globalLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api/ai-chat', aiLimiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Directories ───────────────────────────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || join(__dirname, '../../uploads');
const storageDir = process.env.STORAGE_DIR || join(__dirname, '../../storage');

[uploadDir, storageDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use('/uploads', express.static(uploadDir));
app.use('/storage', express.static(storageDir));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    ai: !!process.env.GEMINI_API_KEY,
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/meetings', requireAuth, meetingRoutes);
app.use('/api/upload', requireAuth, uploadRoutes);
app.use('/api/search', requireAuth, searchRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);
app.use('/api/notifications', requireAuth, notificationRoutes);
app.use('/api/action-items', requireAuth, actionItemRoutes);
app.use('/api/exports', requireAuth, exportRoutes);
app.use('/api/ai-chat', requireAuth, aiChatRoutes);
app.use('/api/templates', extractUser, templateRoutes);
app.use('/api/comparisons', extractUser, comparisonRoutes);
app.use('/api/seed', requireAuth, seedRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
if (process.env.SENTRY_DSN) {
  app.use(Sentry.expressErrorHandler());
}

app.use((err, req, res, next) => {
  console.error('Error:', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: {
      message: status < 500 ? err.message : 'Internal server error',
      ...(isDev && status >= 500 && { stack: err.stack }),
    },
  });
});

app.use((req, res) => {
  res.status(404).json({ error: { message: `Route ${req.method} ${req.path} not found` } });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║       MeetingMind API Server              ║
║  Port: ${PORT}  |  Env: ${(process.env.NODE_ENV || 'development').padEnd(11)} ║
║  AI: ${process.env.GEMINI_API_KEY ? 'enabled ' : 'disabled'} | Rate limit: on             ║
╚═══════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

export default app;
