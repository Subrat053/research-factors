import { z } from 'zod';

export const trackEventSchema = z.object({
  visitorId: z.string().trim().min(1, 'visitorId is required'),
  sessionId: z.string().trim().min(1, 'sessionId is required'),
  eventType: z.enum([
    'ARTICLE_VIEW',
    'ARTICLE_SCROLL_50',
    'ARTICLE_COMPLETED',
    'CATEGORY_CLICK',
    'INTEREST_SELECTED',
    'RECOMMENDATION_CLICK',
    'SEARCH'
  ]),
  articleId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  tagId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable()
});

export const setInterestsSchema = z.object({
  visitorId: z.string().trim().min(1, 'visitorId is required'),
  categoryIds: z.array(z.string().uuid()).default([])
});

export const recommendationFeedQuerySchema = z.object({
  visitorId: z.string().trim().optional(),
  sessionId: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(24).optional().default(8)
});
