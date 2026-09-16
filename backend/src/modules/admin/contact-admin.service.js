import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class ContactAdminService {
  /**
   * Lists contact inquiries with filtering
   */
  static async listMessages({ status = '', search = '', page = 1, limit = 20 }) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {};
    if (status === 'unread') {
      where.isRead = false;
    } else if (status === 'resolved') {
      where.isResolved = true;
    } else if (status === 'pending') {
      where.isResolved = false;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.contactMessage.count({ where })
    ]);

    return {
      messages,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  /**
   * Updates message read or resolved status
   */
  static async updateMessage(id, { isRead, isResolved }, actorId) {
    const message = await prisma.contactMessage.findUnique({ where: { id } });
    if (!message) {
      throw new AppError('Contact inquiry not found', 404, 'MESSAGE_NOT_FOUND');
    }

    const data = {};
    if (typeof isRead === 'boolean') data.isRead = isRead;
    if (typeof isResolved === 'boolean') data.isResolved = isResolved;

    const updated = await prisma.$transaction(async (tx) => {
      const m = await tx.contactMessage.update({
        where: { id },
        data
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'contact.update_status',
          entityType: 'ContactMessage',
          entityId: id,
          metadata: { previous: message, updated: data }
        }
      });

      return m;
    });

    return updated;
  }

  /**
   * Deletes a contact inquiry
   */
  static async deleteMessage(id, actorId) {
    const message = await prisma.contactMessage.findUnique({ where: { id } });
    if (!message) {
      throw new AppError('Contact inquiry not found', 404, 'MESSAGE_NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
      await tx.contactMessage.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'contact.delete',
          entityType: 'ContactMessage',
          entityId: id,
          metadata: { subject: message.subject, email: message.email }
        }
      });
    });

    return { id, deleted: true };
  }
}
