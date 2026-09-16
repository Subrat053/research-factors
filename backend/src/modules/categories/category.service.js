import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class CategoryService {
  /**
   * Public active categories listing
   */
  static async getActiveCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: {
          select: { articles: { where: { status: 'PUBLISHED' } } }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Admin full categories listing (includes inactive & hierarchy)
   */
  static async getAllCategories() {
    return prisma.category.findMany({
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true, isActive: true } },
        _count: {
          select: { articles: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  static async getCategoryBySlug(slug) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: {
          select: { articles: { where: { status: 'PUBLISHED' } } }
        }
      }
    });

    if (!category || !category.isActive) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    return category;
  }

  static async createCategory(data, actorId) {
    const { name, description, imageUrl, isActive, parentId } = data;
    if (!name || name.trim().length < 2) {
      throw new AppError('Category name must be at least 2 characters long', 400, 'INVALID_NAME');
    }

    const trimmedName = name.trim();
    const slug = data.slug?.trim() || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: trimmedName }, { slug }] }
    });

    if (existing) {
      throw new AppError(`A category with name or slug '${trimmedName}' already exists`, 409, 'CATEGORY_ALREADY_EXISTS');
    }

    return prisma.$transaction(async (tx) => {
      const cat = await tx.category.create({
        data: {
          name: trimmedName,
          slug,
          description: description?.trim() || null,
          imageUrl: imageUrl || null,
          isActive: isActive !== undefined ? isActive : true,
          parentId: parentId || null
        },
        include: { parent: true }
      });

      if (actorId) {
        await tx.auditLog.create({
          data: {
            actorId,
            action: 'category.create',
            entityType: 'Category',
            entityId: cat.id,
            metadata: { name: cat.name, slug: cat.slug }
          }
        });
      }

      return cat;
    });
  }

  static async updateCategory(id, data, actorId) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    const { name, description, imageUrl, isActive, parentId } = data;
    const updatePayload = {};

    if (name) {
      updatePayload.name = name.trim();
      updatePayload.slug = data.slug?.trim() || updatePayload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updatePayload.description = description;
    if (imageUrl !== undefined) updatePayload.imageUrl = imageUrl;
    if (isActive !== undefined) updatePayload.isActive = isActive;
    if (parentId !== undefined) {
      if (parentId === id) {
        throw new AppError('A category cannot be its own parent', 400, 'INVALID_PARENT_CATEGORY');
      }
      updatePayload.parentId = parentId || null;
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.category.update({
        where: { id },
        data: updatePayload,
        include: { parent: true }
      });

      if (actorId) {
        await tx.auditLog.create({
          data: {
            actorId,
            action: 'category.update',
            entityType: 'Category',
            entityId: id,
            metadata: { previous: category, updated: updatePayload }
          }
        });
      }

      return updated;
    });
  }

  static async deleteCategory(id, actorId) {
    // 1. Referential integrity check: disallow deletion if articles are linked
    const articleCount = await prisma.article.count({ where: { categoryId: id } });
    if (articleCount > 0) {
      throw new AppError(
        `Cannot delete category: ${articleCount} articles are assigned to it. Reassign articles first.`,
        400,
        'CATEGORY_NOT_EMPTY'
      );
    }

    // 2. Disallow deletion if child categories are linked
    const childrenCount = await prisma.category.count({ where: { parentId: id } });
    if (childrenCount > 0) {
      throw new AppError(
        `Cannot delete category: ${childrenCount} sub-categories exist under this parent. Reassign child categories first.`,
        400,
        'CATEGORY_HAS_CHILDREN'
      );
    }

    return prisma.$transaction(async (tx) => {
      const cat = await tx.category.delete({ where: { id } });

      if (actorId) {
        await tx.auditLog.create({
          data: {
            actorId,
            action: 'category.delete',
            entityType: 'Category',
            entityId: id,
            metadata: { name: cat.name, slug: cat.slug }
          }
        });
      }

      return cat;
    });
  }
}
