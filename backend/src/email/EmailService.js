import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class EmailService {
  constructor() {
    this.provider = config.EMAIL_PROVIDER;
    if (this.provider === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465,
        auth: config.SMTP_USER ? {
          user: config.SMTP_USER,
          pass: config.SMTP_PASSWORD
        } : undefined
      });
    }
  }

  async sendMail({ to, subject, html, text }) {
    if (this.provider === 'smtp' && this.transporter) {
      try {
        return await this.transporter.sendMail({
          from: `"${config.SMTP_FROM_NAME}" <${config.SMTP_FROM_EMAIL}>`,
          to,
          subject,
          text: text || html.replace(/<[^>]*>?/gm, ''),
          html
        });
      } catch (error) {
        logger.error(`Failed to send email to ${to}:`, error);
        throw error;
      }
    } else {
      // In development / json_log mode: Log formatted email to console
      logger.info(`📧 [EMAIL SERVICE DISPATCH] To: ${to} | Subject: ${subject}`);
      logger.debug(`📧 [EMAIL BODY]:\n${html}`);
      return { messageId: 'mock-dev-id-' + Date.now() };
    }
  }

  async sendVerificationEmail(to, token, name) {
    const verificationUrl = `${config.APP_URL}/verify-email?token=${token}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to Research Factors, ${name}!</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Thank you for joining our research community. Please verify your email address to activate your account.
        </p>
        <div style="margin: 24px 0;">
          <a href="${verificationUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Or copy and paste this link: ${verificationUrl}</p>
      </div>
    `;
    return this.sendMail({ to, subject: 'Verify your Research Factors Account', html });
  }

  async sendPasswordResetEmail(to, token) {
    const resetUrl = `${config.APP_URL}/reset-password?token=${token}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Reset Your Password</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          A password reset was requested for your account. Click the button below to choose a new password. This link expires in 1 hour.
        </p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;
    return this.sendMail({ to, subject: 'Password Reset Request — Research Factors', html });
  }
}

export const emailService = new EmailService();
