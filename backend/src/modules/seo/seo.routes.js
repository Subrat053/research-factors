import { Router } from 'express';
import { SeoController } from './seo.controller.js';

export const seoRoutes = Router();

seoRoutes.get('/sitemap.xml', SeoController.getSitemap);
seoRoutes.get('/robots.txt', SeoController.getRobots);
