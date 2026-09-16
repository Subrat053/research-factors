import { z } from 'zod';

export const createAdminUserSchema = {
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50).trim(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50).trim(),
    email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().nullable(),
    roleNames: z.array(z.string()).min(1, 'At least one role must be selected'),
    emailVerified: z.boolean().optional()
  })
};

export const toggleRegistrationSchema = {
  body: z.object({
    allowRegistration: z.boolean()
  })
};
