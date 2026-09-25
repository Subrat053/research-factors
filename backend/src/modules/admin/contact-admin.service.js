import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class ContactAdminService {
  /**
   * Lists contact inquiries with filtering
   */
  static async listMessages({ status = '', search = '', page = 1, limit = 20, type = '' }) {
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

    if (type === 'sponsorship') {
      where.subject = { startsWith: '[Sponsorship]' };
    } else if (type === 'general') {
      where.NOT = { subject: { startsWith: '[Sponsorship]' } };
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      const searchConditions = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } }
      ];

      where.AND = [
        ...(where.AND || []),
        { OR: searchConditions }
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

  /**
   * Bulk updates contact inquiries (read / resolved)
   */
  static async bulkUpdateMessages(messageIds, data = {}, actorId) {
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      throw new AppError('messageIds array is required and must not be empty', 400, 'INVALID_MESSAGE_IDS');
    }

    const updateData = {};
    if (typeof data.isRead === 'boolean') updateData.isRead = data.isRead;
    if (typeof data.isResolved === 'boolean') updateData.isResolved = data.isResolved;

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No valid update fields provided (isRead or isResolved required)', 400, 'NO_UPDATE_DATA');
    }

    const messages = await prisma.contactMessage.findMany({
      where: { id: { in: messageIds } },
      select: { id: true }
    });

    if (messages.length === 0) {
      return { updatedCount: 0, message: 'No matching inquiries found' };
    }

    const foundIds = messages.map(m => m.id);

    await prisma.$transaction(async (tx) => {
      await tx.contactMessage.updateMany({
        where: { id: { in: foundIds } },
        data: updateData
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'contact.bulk_update',
          entityType: 'ContactMessage',
          entityId: 'bulk',
          metadata: {
            messageIds: foundIds,
            count: foundIds.length,
            changes: updateData
          }
        }
      });
    });

    return {
      updatedCount: foundIds.length,
      message: `Successfully updated ${foundIds.length} inquiry(ies)`
    };
  }

  /**
   * Bulk deletes contact inquiries
   */
  static async bulkDeleteMessages(messageIds, actorId) {
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      throw new AppError('messageIds array is required and must not be empty', 400, 'INVALID_MESSAGE_IDS');
    }

    const messages = await prisma.contactMessage.findMany({
      where: { id: { in: messageIds } },
      select: { id: true, subject: true, email: true }
    });

    if (messages.length === 0) {
      return { deletedCount: 0, message: 'No matching inquiries found' };
    }

    const foundIds = messages.map(m => m.id);

    await prisma.$transaction(async (tx) => {
      await tx.contactMessage.deleteMany({
        where: { id: { in: foundIds } }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'contact.bulk_delete',
          entityType: 'ContactMessage',
          entityId: 'bulk',
          metadata: {
            messageIds: foundIds,
            count: foundIds.length,
            subjects: messages.map(m => m.subject)
          }
        }
      });
    });

    return {
      deletedCount: foundIds.length,
      message: `Successfully deleted ${foundIds.length} inquiry(ies) permanently`
    };
  }
}
