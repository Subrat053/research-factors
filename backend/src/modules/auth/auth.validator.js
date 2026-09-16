import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().min(2, 'First name must be at least 2 characters').trim(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').trim(),
    bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
    password: z.string().min(1, 'Password is required')
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address').trim().toLowerCase()
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters long')
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long')
  })
});
