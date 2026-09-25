import { Router } from 'express';
import { SeoController } from './seo.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAnyPermission } from '../../middleware/authorize.js';

export const seoRoutes = Router();

// ================= 1. DYNAMIC SITEMAPS SUITE =================
seoRoutes.get('/sitemap.xml', SeoController.getSitemapIndex);
seoRoutes.get('/sitemaps/articles.xml', SeoController.getArticlesSitemap);
seoRoutes.get('/sitemaps/categories.xml', SeoController.getCategoriesSitemap);
seoRoutes.get('/sitemaps/pages.xml', SeoController.getPagesSitemap);

// ================= 2. ROBOTS DIRECTIVES =================
seoRoutes.get('/robots.txt', SeoController.getRobots);

// ================= 3. PUBLIC SEO RESOLUTION =================
seoRoutes.get('/resolve', SeoController.resolvePublicSeo);

// ================= 4. AUTHENTICATED ADMIN SEO MANAGEMENT =================
seoRoutes.get(
  '/admin/audit',
  authenticate,
  requireAnyPermission('setting.manage', 'article.approve', 'article.create'),
  SeoController.getSeoAudit
);

seoRoutes.post(
  '/admin/regenerate',
  authenticate,
  requireAnyPermission('setting.manage', 'article.create', 'article.update_own'),
  SeoController.regenerateSeo
);

seoRoutes.post(
  '/admin/migrate-missing',
  authenticate,
  requireAnyPermission('setting.manage'),
  SeoController.migrateMissingSeo
);

seoRoutes.put(
  '/admin/:entityType/:entityId',
  authenticate,
  requireAnyPermission('setting.manage', 'article.create', 'article.update_own'),
  SeoController.updateSeoMetadata
);
