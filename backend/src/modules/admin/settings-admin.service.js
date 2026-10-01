import { prisma } from '../../config/db.js';
import { config } from '../../config/index.js';
import { emailService } from '../../email/index.js';
import { AppError } from '../../middleware/errorHandler.js';

export const DEFAULT_SPONSORSHIP_PACKAGES = [
  {
    id: 'launch-article',
    name: 'Launch Article',
    kicker: 'Starter',
    price: '₹14,999',
    period: 'Single Study Investment',
    description: 'Best for one-time brand visibility and technical awareness with an evidence-led sponsored study or review.',
    features: [
      '1 Sponsored research article or review (up to 1,500 words)',
      '1 Primary category hub directory listing',
      'Full Schema.org JSON-LD & OpenGraph SEO metadata',
      'Transparent commercial disclosure badge',
      'Contextual brand callout box with outbound link',
      '1 Editorial revision & factual verification round',
      'Permanent indexing in universal Research Archive'
    ],
    cta: 'Start With Starter',
    isPopular: false,
    isActive: true
  },
  {
    id: 'authority-series',
    name: 'Authority Series',
    kicker: 'Growth',
    price: '₹34,999',
    period: '3-Part Research Package',
    description: 'Designed for brands seeking compounding search visibility, comparative positioning, and deep category authority.',
    features: [
      '3 Long-form research articles or reviews (up to 2,000 words each)',
      'Priority placement across multiple category hubs',
      'Structured side-by-side comparison matrix integration',
      'Featured placement in Homepage Latest Research section',
      'Dedicated brand CTA card with custom trial/documentation link',
      '2 Editorial revision rounds with direct desk review',
      'Quarterly verified reader engagement summary'
    ],
    cta: 'Choose Growth',
    isPopular: true,
    isActive: true
  },
  {
    id: 'enterprise-benchmark',
    name: 'Enterprise & Benchmark',
    kicker: 'Scale',
    price: '₹74,999',
    period: 'Comprehensive Partnership',
    description: 'For technology leaders and enterprise solutions requiring definitive market leadership and extensive editorial reach.',
    features: [
      'Co-branded Industry Benchmark Report or 6-article series (up to 2,500 words)',
      'Homepage Featured Research Carousel rotation',
      'Executive / engineering interview (Brand Insight Feature)',
      'Cross-category syndication & indexed topic tag network',
      'Priority editorial turnaround with dedicated senior editor',
      'Comprehensive reader engagement & audience analytics dossier',
      'Custom whitepaper or lead generation integration'
    ],
    cta: 'Inquire Enterprise',
    isPopular: false,
    isActive: true
  }
];

export class SettingsAdminService {
  /**
   * Retrieves all system configuration settings
   */
  static async getAllSettings() {
    const settings = await prisma.systemSetting.findMany();
    const result = {};

    for (const s of settings) {
      result[s.key] = s.value;
    }

    if (!result.sponsorship_packages) {
      result.sponsorship_packages = DEFAULT_SPONSORSHIP_PACKAGES;
    }

    return {
      settings: result,
      metadata: {
        totalConfigured: settings.length,
        environment: config.NODE_ENV,
        storageProvider: config.STORAGE_PROVIDER,
        emailProvider: config.EMAIL_PROVIDER
      }
    };
  }

  /**
   * Retrieves public settings for public site header/footer/seo/sponsorship
   */
  static async getPublicSettings() {
    const settings = await prisma.systemSetting.findMany({
      where: { isPublic: true }
    });

    const result = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    // Safely expose allowRegistration from policies setting
    const policies = await prisma.systemSetting.findUnique({
      where: { key: 'policies' }
    });
    result.allowRegistration = policies?.value?.allowRegistration ?? true;

    // Ensure sponsorship_packages is always available on public site
    if (!result.sponsorship_packages) {
      const spSetting = await prisma.systemSetting.findUnique({
        where: { key: 'sponsorship_packages' }
      });
      result.sponsorship_packages = spSetting?.value || DEFAULT_SPONSORSHIP_PACKAGES;
    }

    if (Array.isArray(result.sponsorship_packages)) {
      result.sponsorship_packages = result.sponsorship_packages.filter(p => p.isActive !== false);
    }

    return result;
  }

  /**
   * Batch updates system settings
   */
  static async updateSettings(settingsMap, actorId) {
    if (!settingsMap || typeof settingsMap !== 'object') {
      throw new AppError('Invalid settings data format', 400, 'INVALID_SETTINGS');
    }

    const updatedKeys = Object.keys(settingsMap);

    await prisma.$transaction(async (tx) => {
      for (const [key, value] of Object.entries(settingsMap)) {
        const isPublic = ['general', 'seo', 'sponsorship_packages'].includes(key);
        const category = ['general', 'seo', 'policies', 'sponsorship_packages'].includes(key) ? key : 'general';

        await tx.systemSetting.upsert({
          where: { key },
          update: {
            value,
            isPublic,
            updatedBy: actorId
          },
          create: {
            key,
            value,
            category,
            isPublic,
            updatedBy: actorId
          }
        });
      }

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'system.settings_update',
          entityType: 'SystemSetting',
          entityId: 'global',
          metadata: { updatedKeys }
        }
      });
    });

    return this.getAllSettings();
  }

  /**
   * Tests outbound email delivery using configured email service
   */
  static async testEmailConfiguration({ recipientEmail }, actorId) {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      throw new AppError('Valid recipient email address is required', 400, 'INVALID_EMAIL');
    }

    const testSubject = `Research Factors — SMTP Test (${new Date().toISOString()})`;
    const testHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #111;">
        <h2>Research Factors System Diagnostic</h2>
        <p>This is an automated test message sent by Super Administrator from the platform settings backoffice.</p>
        <p><strong>Outbound Provider:</strong> ${config.EMAIL_PROVIDER}</p>
        <p><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">If you received this message, outbound mail delivery is functioning properly.</p>
      </div>
    `;

    try {
      await emailService.sendMail({
        to: recipientEmail,
        subject: testSubject,
        html: testHtml
      });

      // Record Audit Log
      await prisma.auditLog.create({
        data: {
          actorId,
          action: 'system.email_test',
          entityType: 'SystemSetting',
          entityId: 'email',
          metadata: { recipientEmail, success: true }
        }
      });

      return {
        success: true,
        recipient: recipientEmail,
        provider: config.EMAIL_PROVIDER,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      throw new AppError(`Email delivery test failed: ${err.message}`, 502, 'EMAIL_SEND_FAILED');
    }
  }

  /**
   * Diagnostics: Database latency, storage provider status, memory and uptime
   */
  static async getSystemHealth() {
    const startTime = Date.now();
    let dbStatus = 'connected';
    let dbLatencyMs = 0;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - startTime;
    } catch (err) {
      dbStatus = 'disconnected';
    }

    const [totalUsers, totalArticles, totalMedia, totalLogs] = await Promise.all([
      prisma.user.count(),
      prisma.article.count(),
      prisma.media.count(),
      prisma.auditLog.count()
    ]);

    const memoryUsage = process.memoryUsage();

    return {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: 'PostgreSQL'
      },
      storage: {
        provider: config.STORAGE_PROVIDER,
        totalAssetsTracked: totalMedia
      },
      email: {
        provider: config.EMAIL_PROVIDER
      },
      system: {
        nodeVersion: process.version,
        port: config.PORT,
        uptimeSeconds: Math.floor(process.uptime()),
        memory: {
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024)
        }
      },
      counts: {
        users: totalUsers,
        articles: totalArticles,
        media: totalMedia,
        auditLogs: totalLogs
      }
    };
  }

  /**
   * Retrieves current platform public registration status
   */
  static async getRegistrationStatus() {
    const policies = await prisma.systemSetting.findUnique({
      where: { key: 'policies' }
    });

    return {
      allowRegistration: policies?.value?.allowRegistration ?? true
    };
  }

  /**
   * Toggles public registration on or off with audit tracking
   */
  static async updateRegistrationStatus(allowRegistration, actorId) {
    const policies = await prisma.systemSetting.findUnique({
      where: { key: 'policies' }
    });

    const currentPolicies = policies?.value || {
      commentsEnabled: true,
      maintenanceMode: false,
      allowRegistration: true,
      autoHideReportThreshold: 3,
      requireEmailVerification: true
    };

    const updatedPolicies = {
      ...currentPolicies,
      allowRegistration: !!allowRegistration
    };

    await prisma.$transaction(async (tx) => {
      await tx.systemSetting.upsert({
        where: { key: 'policies' },
        update: {
          value: updatedPolicies,
          updatedBy: actorId
        },
        create: {
          key: 'policies',
          value: updatedPolicies,
          category: 'policies',
          isPublic: false,
          updatedBy: actorId
        }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'system.registration_status_toggled',
          entityType: 'SystemSetting',
          entityId: 'policies',
          metadata: {
            previousState: currentPolicies.allowRegistration ?? true,
            newState: !!allowRegistration
          }
        }
      });
    });

    return {
      allowRegistration: !!allowRegistration
    };
  }
}
