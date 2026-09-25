import sanitizeHtml from 'sanitize-html';
import { prisma } from '../../config/db.js';

const SANITIZE_OPTIONS = {
  allowedTags: [],
  allowedAttributes: {}
};

const SPONSORSHIP_TYPE_LABELS = {
  'launch-article': 'Launch Article Package (₹14,999)',
  'authority-series': 'Authority Series Package (₹34,999)',
  'enterprise-benchmark': 'Enterprise & Benchmark Package (₹74,999)',
  'sponsored-research': 'Native Research Article',
  'product-review': 'Product Review',
  'product-comparison': 'Product & Solution Comparison',
  'expert-insight': 'Brand Insight Feature',
  'industry-report': 'Industry Benchmark Report',
  'custom-collaboration': 'Custom Collaboration'
};

const sanitize = (text) => {
  if (!text || typeof text !== 'string') return '';
  return sanitizeHtml(text.trim(), SANITIZE_OPTIONS);
};

export class ContactService {
  /**
   * Submits and records a new sponsorship inquiry from the public portal
   */
  static async submitSponsorshipInquiry({
    name,
    email,
    company,
    website = '',
    sponsorshipType = 'sponsored-research',
    budgetTimeline = 'immediate',
    message
  }) {
    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email);
    const cleanCompany = sanitize(company);
    const cleanWebsite = sanitize(website);
    const cleanType = sanitize(sponsorshipType);
    const cleanTimeline = sanitize(budgetTimeline);
    const cleanMessage = sanitize(message);

    const typeLabel = SPONSORSHIP_TYPE_LABELS[cleanType] || cleanType || 'Brand Collaboration';
    const subject = `[Sponsorship] ${cleanCompany} — ${typeLabel}`;

    const formattedMessage = [
      `Company / Brand: ${cleanCompany}`,
      `Contact Person: ${cleanName}`,
      `Work Email: ${cleanEmail}`,
      `Website: ${cleanWebsite || 'Not provided'}`,
      `Sponsorship Format: ${typeLabel}`,
      `Budget / Timeline: ${cleanTimeline}`,
      '',
      '--- Inquirer Message ---',
      cleanMessage
    ].join('\n');

    const inquiry = await prisma.contactMessage.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        subject,
        message: formattedMessage,
        isRead: false,
        isResolved: false
      }
    });

    return {
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      subject: inquiry.subject,
      createdAt: inquiry.createdAt
    };
  }

  /**
   * Submits a general contact inquiry
   */
  static async submitGeneralContact({ name, email, subject, message }) {
    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email);
    const cleanSubject = sanitize(subject);
    const cleanMessage = sanitize(message);

    const inquiry = await prisma.contactMessage.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
        isRead: false,
        isResolved: false
      }
    });

    return {
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      subject: inquiry.subject,
      createdAt: inquiry.createdAt
    };
  }
}
