import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { config } from './config/index.js';
import { prisma } from './config/db.js';
import { logger } from './utils/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { crawlerPrerenderMiddleware } from './middleware/crawlerPrerender.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { articleRoutes } from './modules/articles/article.routes.js';
import { categoryRoutes } from './modules/categories/category.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { mediaRoutes } from './modules/media/media.routes.js';
import { commentRoutes } from './modules/comments/comment.routes.js';
import { bookmarkRoutes } from './modules/bookmarks/bookmark.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { seoRoutes } from './modules/seo/seo.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { tagRoutes } from './modules/tags/tag.routes.js';
import { contactRoutes } from './modules/contact/contact.routes.js';
import { recommendationRoutes } from './modules/recommendations/recommendation.routes.js';

export const app = express();

// Enable reverse proxy trust (Render, Nginx, Apache, FASTPANEL, Cloudflare load balancers)
app.set('trust proxy', 1);

// 1. Core Security & Parsing Middleware
app.use(requestIdMiddleware);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const parseOrigin = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return '';
  try {
    return new URL(urlStr).origin;
  } catch {
    return urlStr.replace(/\/+$/, '');
  }
};

const configuredOrigins = config.APP_URL
  ? config.APP_URL.split(',').map(u => u.trim()).filter(Boolean).map(parseOrigin)
  : [];

const apiOrigins = config.API_URL
  ? [parseOrigin(config.API_URL)]
  : [];

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:4173',
  'http://localhost:5005',
  'http://localhost:5000'
];

const allowedOriginList = Array.from(new Set([...configuredOrigins, ...apiOrigins, ...defaultOrigins])).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (tools, curl, server-to-server)
    if (!origin) return callback(null, true);

    const incomingOrigin = parseOrigin(origin);
    // Explicit match
    if (allowedOriginList.includes(incomingOrigin) || allowedOriginList.includes(origin)) {
      return callback(null, true);
    }
    // Dynamically allow wizmonk.com, Render subdomains, or non-production origins
    if (
      config.NODE_ENV !== 'production' ||
      origin.includes('wizmonk.com') ||
      origin.includes('onrender.com')
    ) {
      return callback(null, true);
    }
    return callback(null, origin);
  },
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

// 3. Static Media Serve (Local Storage Provider) with dual mounting (/uploads & /rf/uploads)
if (config.STORAGE_PROVIDER === 'local') {
  const localUploadDir = path.resolve(process.cwd(), config.LOCAL_STORAGE_PATH);
  const mediaHeaders = (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  };

  app.use('/uploads', mediaHeaders, express.static(localUploadDir));
  app.use('/rf/uploads', mediaHeaders, express.static(localUploadDir));
}

// 4. Health Checks with dual mounting (/health & /rf/health)
const sendHealthLive = (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
};

const sendHealthReady = async (req, res) => {
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
};

app.get(['/health/live', '/rf/health/live'], sendHealthLive);
app.get(['/health/ready', '/rf/health/ready'], sendHealthReady);

// 5. API v1 Base Route
const sendApiBase = (req, res) => {
  res.json({
    success: true,
    message: 'Research Factors API v1 is operational',
    version: '1.0.0'
  });
};
app.get(['/api/v1', '/rf/api/v1'], sendApiBase);

// 6. Social Crawler Head Pre-rendering
app.use(crawlerPrerenderMiddleware);

// 7. Dual Mounting Helper for API Routes (/api/v1 and /rf/api/v1)
const mountDual = (pathPrefix, router) => {
  app.use(pathPrefix, router);
  app.use(`/rf${pathPrefix}`, router);
};

// SEO & Sitemap Routes
app.use('/', seoRoutes);
app.use('/rf', seoRoutes);
mountDual('/api/v1/seo', seoRoutes);

// Core Modular Monolith Routes
mountDual('/api/v1/auth', authRoutes);
mountDual('/api/v1/users', userRoutes);
mountDual('/api/v1/articles', articleRoutes);
mountDual('/api/v1/categories', categoryRoutes);
mountDual('/api/v1/tags', tagRoutes);
mountDual('/api/v1/search', searchRoutes);
mountDual('/api/v1/media', mediaRoutes);
mountDual('/api/v1/contact', contactRoutes);
mountDual('/api/v1', commentRoutes);
mountDual('/api/v1/bookmarks', bookmarkRoutes);
mountDual('/api/v1/admin', adminRoutes);
mountDual('/api/v1/recommendations', recommendationRoutes);

// 8. Static Client Serving (Optional & Production Resilient)
const clientDistCandidates = [
  path.resolve(process.cwd(), config.CLIENT_DIST_PATH || '../frontend/dist'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), 'public')
];
const resolvedClientDist = clientDistCandidates.find(p => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html')));

if (resolvedClientDist && (config.SERVE_STATIC_CLIENT || config.NODE_ENV === 'production')) {
  logger.info(`Static client serving active from ${resolvedClientDist}`);
  app.use('/rf', express.static(resolvedClientDist));
  app.use('/', express.static(resolvedClientDist));

  // SPA fallback for non-API client routes
  app.get(['/rf/*', '/*'], (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/rf/api') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/rf/uploads') ||
      req.path.startsWith('/health') ||
      req.path.startsWith('/rf/health')
    ) {
      return next();
    }
    res.sendFile(path.join(resolvedClientDist, 'index.html'));
  });
} else {
  app.get(['/', '/rf'], (req, res) => {
    res.send('Research Factors Backend API is running');
  });
}

// 9. 404 Handler
app.use((req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'));
});

// 10. Global Error Handler
app.use(errorHandler);
