import { Router } from 'express';
import { SearchController } from './search.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  searchQuerySchema,
  recommendationsQuerySchema,
  trackClickSchema
} from './search.validator.js';

const router = Router();

// Search published articles
router.get('/', validateRequest({ query: searchQuerySchema }), SearchController.search);

// High-speed cached trending research (most read and searched)
router.get('/trending', SearchController.getTrending);

// Dynamic recommendations tailored to searched article type or category
router.get('/recommendations', validateRequest({ query: recommendationsQuerySchema }), SearchController.getRecommendations);

// Track search click engagement (fire-and-forget)
router.post('/click', validateRequest({ body: trackClickSchema }), SearchController.trackClick);

export const searchRoutes = router;
