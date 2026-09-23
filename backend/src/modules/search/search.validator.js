import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().max(100).optional().default(''),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  type: z.enum(['RESEARCH', 'REVIEW', 'COMPARISON', 'GUIDE', 'ANALYSIS', 'OPINION']).optional(),
  category: z.string().max(100).optional()
});

export const recommendationsQuerySchema = z.object({
  type: z.enum(['RESEARCH', 'REVIEW', 'COMPARISON', 'GUIDE', 'ANALYSIS', 'OPINION']).optional(),
  category: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional().default(4)
});

export const trackClickSchema = z.object({
  articleId: z.string().uuid('Invalid article ID'),
  term: z.string().max(100).optional()
});
