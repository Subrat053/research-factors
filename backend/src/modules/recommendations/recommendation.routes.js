import { Router } from 'express';
import { RecommendationController } from './recommendation.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import {
  trackEventSchema,
  setInterestsSchema,
  recommendationFeedQuerySchema,
  articleFeedbackSchema,
  syncVisitorSchema
} from './recommendation.validator.js';

export const recommendationRoutes = Router();

// 1. Reading & Telemetry Event Ingestion
recommendationRoutes.post(
  '/events',
  optionalAuthenticate,
  validateRequest(trackEventSchema),
  RecommendationController.recordEvent
);

// 2. User/Visitor Interest Preferences
recommendationRoutes.post(
  '/interests',
  optionalAuthenticate,
  validateRequest(setInterestsSchema),
  RecommendationController.setInterests
);

recommendationRoutes.get(
  '/interests',
  optionalAuthenticate,
  RecommendationController.getVisitorInterests
);

recommendationRoutes.delete(
  '/interests/:categoryId',
  optionalAuthenticate,
  RecommendationController.removeInterest
);

// 3. Explicit Article Feedback (Like / Dislike / None)
recommendationRoutes.post(
  '/feedback',
  optionalAuthenticate,
  validateRequest(articleFeedbackSchema),
  RecommendationController.setArticleFeedback
);

recommendationRoutes.get(
  '/feedback/:articleId',
  optionalAuthenticate,
  RecommendationController.getArticleFeedback
);

recommendationRoutes.delete(
  '/feedback/:articleId',
  optionalAuthenticate,
  RecommendationController.removeArticleFeedback
);

// 4. Anonymous Visitor to User Account Synchronization
recommendationRoutes.post(
  '/sync-visitor',
  authenticate,
  validateRequest(syncVisitorSchema),
  RecommendationController.syncVisitor
);

// 5. Multi-Intent Recommendations
recommendationRoutes.get(
  '/article/:articleId',
  optionalAuthenticate,
  RecommendationController.getArticleRecommendations
);

recommendationRoutes.get(
  '/feed',
  optionalAuthenticate,
  validateRequest(recommendationFeedQuerySchema, 'query'),
  RecommendationController.getPersonalizedFeed
);

// 6. Governance Configuration
recommendationRoutes.get('/config', RecommendationController.getConfig);

recommendationRoutes.patch(
  '/config',
  authenticate,
  requirePermission('system.manage'),
  RecommendationController.updateConfig
);
