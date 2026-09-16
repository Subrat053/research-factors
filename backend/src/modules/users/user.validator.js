import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50).trim().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50).trim().optional(),
  avatarUrl: z.string().url('Invalid avatar URL').nullable().optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').nullable().optional(),
  headline: z.string().max(160, 'Headline cannot exceed 160 characters').nullable().optional(),
  biography: z.string().max(3000, 'Biography cannot exceed 3000 characters').nullable().optional(),
  websiteUrl: z.string().url('Invalid website URL').nullable().optional().or(z.literal('')),
  twitterUrl: z.string().url('Invalid Twitter/X URL').nullable().optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').nullable().optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid GitHub URL').nullable().optional().or(z.literal(''))
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long')
});
