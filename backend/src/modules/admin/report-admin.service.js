import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class ReportAdminService {
  /**
   * Retrieves paginated list of comment reports
   */
  static async listReports({ reason = '', page = 1, limit = 20 }) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {};
    if (reason && ['SPAM', 'OFFENSIVE', 'HARASSMENT', 'MISINFORMATION', 'PERSONAL_INFO', 'PROMOTIONAL', 'OTHER'].includes(reason)) {
      where.reason = reason;
    }

    const [reports, total] = await Promise.all([
      prisma.commentReport.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          comment: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true, status: true }
              },
              article: {
                select: { id: true, title: true, slug: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.commentReport.count({ where })
    ]);

    return {
      reports: reports.map(r => ({
        id: r.id,
        reason: r.reason,
        details: r.details,
        createdAt: r.createdAt,
        reporter: {
          id: r.user.id,
          name: `${r.user.firstName} ${r.user.lastName}`.trim(),
          email: r.user.email
        },
        comment: r.comment ? {
          id: r.comment.id,
          content: r.comment.content,
          status: r.comment.status,
          createdAt: r.comment.createdAt,
          author: {
            id: r.comment.user.id,
            name: `${r.comment.user.firstName} ${r.comment.user.lastName}`.trim(),
            email: r.comment.user.email,
            status: r.comment.user.status
          },
          article: r.comment.article
        } : null
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
   * Resolves a comment report with chosen action
   */
  static async resolveReport(reportId, { action, notes = null }, actorId) {
    const report = await prisma.commentReport.findUnique({
      where: { id: reportId },
      include: {
        comment: {
          include: { user: true }
        }
      }
    });

    if (!report) {
      throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }

    const validActions = ['DISMISS', 'HIDE_COMMENT', 'DELETE_COMMENT', 'SUSPEND_AUTHOR'];
    if (!validActions.includes(action)) {
      throw new AppError(`Invalid action. Allowed: ${validActions.join(', ')}`, 400, 'INVALID_ACTION');
    }

    await prisma.$transaction(async (tx) => {
      if (report.comment) {
        if (action === 'HIDE_COMMENT') {
          await tx.comment.update({
            where: { id: report.comment.id },
            data: { status: 'HIDDEN' }
          });
        } else if (action === 'DELETE_COMMENT') {
          await tx.comment.update({
            where: { id: report.comment.id },
            data: { status: 'DELETED' }
          });
        } else if (action === 'SUSPEND_AUTHOR') {
          await tx.comment.update({
            where: { id: report.comment.id },
            data: { status: 'HIDDEN' }
          });

          await tx.user.update({
            where: { id: report.comment.user.id },
            data: { status: 'SUSPENDED' }
          });

          await tx.notification.create({
            data: {
              userId: report.comment.user.id,
              type: 'ACCOUNT_SUSPENDED',
              title: 'Account Suspended',
              message: notes || 'Your account was suspended due to community guidelines violations.'
            }
          });
        }
      }

      // Clean up reports: if comment was moderated or suspended, clear all reports for this comment
      if (['HIDE_COMMENT', 'DELETE_COMMENT', 'SUSPEND_AUTHOR'].includes(action)) {
        await tx.commentReport.deleteMany({ where: { commentId: report.commentId } });
      } else {
        // For DISMISS, delete this specific report
        await tx.commentReport.delete({ where: { id: reportId } });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId,
          action: `report.${action.toLowerCase()}`,
          entityType: 'CommentReport',
          entityId: reportId,
          metadata: {
            commentId: report.commentId,
            authorId: report.comment?.userId,
            action,
            notes
          }
        }
      });
    });

    return { id: reportId, resolvedAction: action };
  }
}
