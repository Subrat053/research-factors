import { Router } from 'express';
import { CommentController } from './comment.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';

export const commentRoutes = Router();

// Article-scoped comment endpoints
commentRoutes.get('/articles/:articleId/comments', optionalAuthenticate, CommentController.getByArticle);
commentRoutes.post('/articles/:articleId/comments', authenticate, requirePermission('comment.create'), CommentController.create);

// Individual comment interaction endpoints
commentRoutes.post('/comments/:commentId/like', authenticate, requirePermission('comment.like'), CommentController.toggleLike);
commentRoutes.post('/comments/:commentId/report', authenticate, CommentController.report);
commentRoutes.delete('/comments/:commentId', authenticate, CommentController.delete);
