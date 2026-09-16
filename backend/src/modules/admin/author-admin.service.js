import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class AuthorAdminService {
  /**
   * Lists approved authors with publication statistics
   */
  static async listAuthors({ search = '', page = 1, limit = 20 }) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {
      isApproved: true
    };

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.user = {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      };
    }

    const [authors, total] = await Promise.all([
      prisma.authorProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              status: true,
              createdAt: true,
              roles: { include: { role: true } },
              _count: {
                select: { articles: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.authorProfile.count({ where })
    ]);

    // Aggregate views per author
    const authorStats = await Promise.all(
      authors.map(async (a) => {
        const viewAggregate = await prisma.article.aggregate({
          where: { authorId: a.userId },
          _sum: { viewCount: true }
        });

        return {
          id: a.id,
          userId: a.userId,
          name: `${a.user.firstName} ${a.user.lastName}`.trim(),
          email: a.user.email,
          avatarUrl: a.user.avatarUrl,
          userStatus: a.user.status,
          headline: a.headline,
          biography: a.biography,
          websiteUrl: a.websiteUrl,
          twitterUrl: a.twitterUrl,
          linkedinUrl: a.linkedinUrl,
          githubUrl: a.githubUrl,
          isApproved: a.isApproved,
          articlesCount: a.user._count.articles,
          totalViews: viewAggregate._sum.viewCount || 0,
          joinedAt: a.createdAt
        };
      })
    );

    return {
      authors: authorStats,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  /**
   * Retrieves pending author applications
   */
  static async listPendingApplications({ page = 1, limit = 20 }) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = { isApproved: false };

    const [applications, total] = await Promise.all([
      prisma.authorProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take
      }),
      prisma.authorProfile.count({ where })
    ]);

    return {
      applications: applications.map(a => ({
        id: a.id,
        userId: a.userId,
        name: `${a.user.firstName} ${a.user.lastName}`.trim(),
        email: a.user.email,
        avatarUrl: a.user.avatarUrl,
        headline: a.headline,
        biography: a.biography,
        websiteUrl: a.websiteUrl,
        twitterUrl: a.twitterUrl,
        linkedinUrl: a.linkedinUrl,
        githubUrl: a.githubUrl,
        appliedAt: a.createdAt
      })),
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  /**
   * Approves an author application, granting the AUTHOR role
   */
  static async approveApplication(profileId, reviewerId) {
    const profile = await prisma.authorProfile.findUnique({
      where: { id: profileId },
      include: { user: true }
    });

    if (!profile) {
      throw new AppError('Author application not found', 404, 'APPLICATION_NOT_FOUND');
    }

    const authorRole = await prisma.role.findUnique({ where: { name: 'AUTHOR' } });
    if (!authorRole) {
      throw new AppError('System role AUTHOR not found', 500, 'ROLE_NOT_CONFIGURED');
    }

    await prisma.$transaction(async (tx) => {
      // Mark author profile approved
      await tx.authorProfile.update({
        where: { id: profileId },
        data: { isApproved: true }
      });

      // Ensure user has AUTHOR role
      const existingUserRole = await tx.userRole.findUnique({
        where: {
          userId_roleId: {
            userId: profile.userId,
            roleId: authorRole.id
          }
        }
      });

      if (!existingUserRole) {
        await tx.userRole.create({
          data: {
            userId: profile.userId,
            roleId: authorRole.id
          }
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: 'author.approve',
          entityType: 'AuthorProfile',
          entityId: profileId,
          metadata: { userId: profile.userId }
        }
      });

      // Notification
      await tx.notification.create({
        data: {
          userId: profile.userId,
          type: 'AUTHOR_APPLICATION_APPROVED',
          title: 'Author Status Approved!',
          message: 'Congratulations! Your author accreditation has been approved. You may now create and submit research articles.'
        }
      });
    });

    return { id: profileId, isApproved: true };
  }

  /**
   * Rejects an author application with feedback
   */
  static async rejectApplication(profileId, reviewerId, { reason = null }) {
    const profile = await prisma.authorProfile.findUnique({
      where: { id: profileId },
      include: { user: true }
    });

    if (!profile) {
      throw new AppError('Author application not found', 404, 'APPLICATION_NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
      await tx.authorProfile.delete({
        where: { id: profileId }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: 'author.reject',
          entityType: 'AuthorProfile',
          entityId: profileId,
          metadata: { userId: profile.userId, reason }
        }
      });

      // Notification
      await tx.notification.create({
        data: {
          userId: profile.userId,
          type: 'AUTHOR_APPLICATION_REJECTED',
          title: 'Author Application Update',
          message: reason || 'Your author application was reviewed and could not be approved at this time.'
        }
      });
    });

    return { id: profileId, rejected: true };
  }

  /**
   * Edits an author's public profile
   */
  static async updateAuthorProfile(profileId, updateData, actorId) {
    const profile = await prisma.authorProfile.findUnique({
      where: { id: profileId }
    });

    if (!profile) {
      throw new AppError('Author profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    const { headline, biography, websiteUrl, twitterUrl, linkedinUrl, githubUrl } = updateData;

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.authorProfile.update({
        where: { id: profileId },
        data: {
          ...(headline !== undefined && { headline }),
          ...(biography !== undefined && { biography }),
          ...(websiteUrl !== undefined && { websiteUrl }),
          ...(twitterUrl !== undefined && { twitterUrl }),
          ...(linkedinUrl !== undefined && { linkedinUrl }),
          ...(githubUrl !== undefined && { githubUrl })
        }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'author.update_profile',
          entityType: 'AuthorProfile',
          entityId: profileId,
          metadata: { previous: profile, updated: updateData }
        }
      });

      return p;
    });

    return updated;
  }
}
