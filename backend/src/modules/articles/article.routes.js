import { Router } from 'express';
import { ArticleController } from './article.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { requireArticleOwnership } from '../../middleware/ownership.js';

const router = Router();

// 1. Public Read Endpoints
router.get('/', ArticleController.getPublishedArticles);
router.get('/featured', ArticleController.getFeatured);
router.get('/trending', ArticleController.getTrending);
router.get('/:slug', ArticleController.getArticleBySlug);

// 2. Author Endpoints
router.get('/author/me', authenticate, requirePermission('article.create'), ArticleController.getMyArticles);
router.post('/', authenticate, requirePermission('article.create'), ArticleController.createDraft);
router.get('/:id/draft', authenticate, requireArticleOwnership, ArticleController.getDraft);
router.patch('/:id/draft', authenticate, requirePermission('article.update_own'), requireArticleOwnership, ArticleController.updateDraft);
router.post('/:id/submit', authenticate, requirePermission('article.submit'), requireArticleOwnership, ArticleController.submitForReview);
router.post('/:id/modify-changes', authenticate, requireArticleOwnership, ArticleController.modifyChanges);
router.post('/:id/discard-draft', authenticate, requireArticleOwnership, ArticleController.discardDraft);

// 3. Editorial & Publishing Endpoints
router.post('/:id/approve', authenticate, requirePermission('article.approve'), ArticleController.approveArticle);
router.post('/:id/reject', authenticate, requirePermission('article.reject'), ArticleController.rejectArticle);
router.post('/:id/publish', authenticate, requirePermission('article.publish'), ArticleController.publishArticle);

export const articleRoutes = router;
