import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { config } from './config/index.js';
import { prisma } from './config/db.js';
import { logger } from './utils/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';

export const app = express();

// 1. Core Security & Parsing Middleware
app.use(requestIdMiddleware);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: [config.APP_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// 2. HTTP Access Logging
const morganStream = {
  write: (message) => logger.http(message.trim())
};
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: morganStream }));

// 3. Static Media Serve (Local Storage Provider)
if (config.STORAGE_PROVIDER === 'local') {
  const localUploadDir = path.resolve(process.cwd(), config.LOCAL_STORAGE_PATH);
  app.use('/uploads', express.static(localUploadDir));
}
app.get('/', (req, res) => {
  res.send('Research Factors Backend API is running');
});
// 4. Health Checks
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      storageProvider: config.STORAGE_PROVIDER,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed - database disconnected', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 5. API v1 Base Routes
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'Research Factors API v1 is operational',
    version: '1.0.0'
  });
});

import { authRoutes } from './modules/auth/auth.routes.js';
import { articleRoutes } from './modules/articles/article.routes.js';
import { categoryRoutes } from './modules/categories/category.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { mediaRoutes } from './modules/media/media.routes.js';
import { commentRoutes } from './modules/comments/comment.routes.js';
import { bookmarkRoutes } from './modules/bookmarks/bookmark.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { seoRoutes } from './modules/seo/seo.routes.js';

app.use('/', seoRoutes);
app.use('/api/v1/seo', seoRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/articles', articleRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1', commentRoutes);
app.use('/api/v1/bookmarks', bookmarkRoutes);
app.use('/api/v1/admin', adminRoutes);



// 6. 404 Handler
app.use((req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'));
});

// 7. Global Error Handler
app.use(errorHandler);
