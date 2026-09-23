import { ContactService } from './contact.service.js';

export class ContactController {
  static async createSponsorshipInquiry(req, res, next) {
    try {
      const result = await ContactService.submitSponsorshipInquiry(req.body);
      res.status(201).json({
        success: true,
        message: 'Your sponsorship inquiry has been received. Our partnerships team will review and respond promptly.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async createGeneralContact(req, res, next) {
    try {
      const result = await ContactService.submitGeneralContact(req.body);
      res.status(201).json({
        success: true,
        message: 'Your inquiry has been received. Our editorial team will review it shortly.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
