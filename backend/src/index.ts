import 'dotenv/config';
import express from 'express';
import path from 'path';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { connectMongo } from './config/db';
import { authRouter } from './routes/auth';
import { resultsRouter } from './routes/results';
import { curriculumRouter } from './routes/curriculum';
import { deadlinesRouter } from './routes/deadlines';
import { chatRouter } from './routes/chat';
import { chatbotRouter } from './routes/chatbot';
import { eventsRouter } from './routes/events';
import { adminRouter } from './routes/admin';
import { initializeSocket } from './realtime/socket';

const app = express();

app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginEmbedderPolicy: false,
  // Cho phép load scripts và styles từ same origin
  contentSecurityPolicy: false, // Tạm thời disable để test
}));
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép requests không có origin (mobile apps, Postman, etc.)
    if (!origin) {
      // eslint-disable-next-line no-console
      console.log('[CORS] Request without origin - allowing');
      return callback(null, true);
    }
    
    // eslint-disable-next-line no-console
    console.log('[CORS] Request from origin:', origin);
    
    // Cho phép localhost trong development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Cho phép tất cả ngrok domains
    if (origin.includes('.ngrok.io') || 
        origin.includes('.ngrok-free.app') || 
        origin.includes('.ngrok-free.dev') ||
        origin.includes('.ngrok.app')) {
      // eslint-disable-next-line no-console
      console.log('[CORS] Allowing ngrok origin');
      return callback(null, true);
    }
    
    // Cho phép tất cả origins (có thể thắt chặt hơn trong production)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400, // 24 hours for preflight cache
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));
// Body parser - phải đặt trước routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware để debug
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth/')) {
    // eslint-disable-next-line no-console
    console.log('[REQUEST]', req.method, req.path, {
      origin: req.headers.origin,
      contentType: req.headers['content-type'],
      body: req.body ? { ...req.body, password: req.body.password ? '[REDACTED]' : undefined } : undefined,
    });
  }
  next();
});

app.use(morgan('dev'));

// MongoDB connect (modularized)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finaldoan';
// eslint-disable-next-line no-console
console.log('[mongo] Connecting to:', MONGO_URI.replace(/\/\/[^@]+@/, '//***:***@')); // Ẩn credentials nếu có
connectMongo(MONGO_URI).then(() => {
  // eslint-disable-next-line no-console
  console.log('[mongo] Connected successfully');
}).catch((err: any) => {
  // eslint-disable-next-line no-console
  console.error('[mongo] Connection error:', err.message);
});

app.get('/api/health', async (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), mongo: mongoose.connection.readyState });
});

// Static serving for uploaded files
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR, {
  fallthrough: true,
  index: false,
  dotfiles: 'ignore',
  maxAge: '1d',
}));

// API Routes - Phải đặt TRƯỚC static file serving
app.use('/api/auth', authRouter);
app.use('/api/results', resultsRouter);
app.use('/api/curriculum', curriculumRouter);
app.use('/api/deadlines', deadlinesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/events', eventsRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/admin', adminRouter);

// Serve static files from frontend build (cho iOS và production)
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
app.use(express.static(PUBLIC_DIR, {
  // HTML files: No cache để luôn có version mới nhất
  // Assets (JS/CSS): Cache ngắn hạn vì có hash trong tên file
  maxAge: (req, res, filePath) => {
    // HTML files: No cache
    if (filePath.endsWith('.html')) {
      return 0; // No cache
    }
    // Service Worker: No cache
    if (filePath.endsWith('sw.js')) {
      return 0; // No cache
    }
    // Assets: Cache 1 hour (files có hash nên an toàn)
    return 3600000; // 1 hour
  },
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // HTML files: No cache headers
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // Service Worker: No cache headers
    else if (filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // Assets: Cache with revalidation
    else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    }
  },
}));

// Fallback: Serve index.html cho tất cả routes không phải API (SPA routing)
// CHỈ match routes không bắt đầu bằng /api, /socket.io, /uploads
app.get('*', (req, res, next) => {
  // Skip nếu là API, socket.io, hoặc uploads
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/socket.io') || 
      req.path.startsWith('/uploads')) {
    return next();
  }
  
  // Serve index.html cho SPA routing
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'), (err) => {
    if (err) {
      console.error('[static] Error serving index.html:', err);
      res.status(404).send('Not found');
    }
  });
});

const PORT = Number(process.env.PORT || 5000);
const server = http.createServer(app);
initializeSocket(server).catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[socket] init error', err);
});
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${PORT}`);
});


