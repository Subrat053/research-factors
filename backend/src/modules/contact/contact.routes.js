import { Router } from 'express';
import { ContactController } from './contact.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { writeLimiter } from '../../middleware/rateLimiter.js';
import { sponsorshipInquirySchema, generalContactSchema } from './contact.validator.js';

export const contactRoutes = Router();

// Public brand sponsorship inquiry route
contactRoutes.post(
  '/sponsorship',
  writeLimiter,
  validateRequest({ body: sponsorshipInquirySchema }),
  ContactController.createSponsorshipInquiry
);

// General public contact route (accessible at / and /general)
contactRoutes.post(
  '/',
  writeLimiter,
  validateRequest({ body: generalContactSchema }),
  ContactController.createGeneralContact
);

contactRoutes.post(
  '/general',
  writeLimiter,
  validateRequest({ body: generalContactSchema }),
  ContactController.createGeneralContact
);
