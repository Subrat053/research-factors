import { z } from 'zod';

export const sponsorshipInquirySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('A valid email address is required').max(150, 'Email cannot exceed 150 characters'),
  company: z.string().trim().min(2, 'Company name must be at least 2 characters long').max(120, 'Company name cannot exceed 120 characters'),
  website: z.string().trim().max(255).optional().or(z.literal('')),
  sponsorshipType: z.string().trim().max(100).optional().default('sponsored-research'),
  budgetTimeline: z.string().trim().max(100).optional().default('immediate'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters long').max(3000, 'Message cannot exceed 3000 characters')
});

export const generalContactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('A valid email address is required').max(150, 'Email cannot exceed 150 characters'),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters long').max(200, 'Subject cannot exceed 200 characters'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters long').max(3000, 'Message cannot exceed 3000 characters')
});
