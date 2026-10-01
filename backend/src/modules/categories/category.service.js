import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { SeoGeneratorService } from '../seo/seo-generator.service.js';

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
          select: {
            articles: {
              where: {
                status: 'PUBLISHED',
                author: { status: 'ACTIVE' }
              }
            }
          }
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
          select: {
            articles: {
              where: {
                status: 'PUBLISHED',
                author: { status: 'ACTIVE' }
              }
            }
          }
        }
      }
    });

    if (!category || !category.isActive) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    return category;
  }

  static async createCategory(data, actorId) {
    const { name, description, imageUrl, isActive, showInFooter, seoTitle, seoDescription, seoKeywords, canonicalUrl, parentId } = data;
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
          showInFooter: showInFooter !== undefined ? showInFooter : true,
          seoTitle: seoTitle?.trim() || null,
          seoDescription: seoDescription?.trim() || null,
          seoKeywords: seoKeywords?.trim() || null,
          canonicalUrl: canonicalUrl?.trim() || null,
          parentId: parentId || null
        },
        include: { parent: true }
      });

      // Sync SeoMetadata for Category
      try {
        const generatedSeo = SeoGeneratorService.generateCategorySeo(cat);
        await tx.seoMetadata.create({
          data: {
            entityType: 'CATEGORY',
            entityId: cat.id,
            customTitle: cat.seoTitle,
            customDescription: cat.seoDescription,
            customCanonicalUrl: cat.canonicalUrl,
            ...generatedSeo
          }
        });
      } catch {
        // Keep category creation resilient
      }

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

    const { name, description, imageUrl, isActive, showInFooter, seoTitle, seoDescription, seoKeywords, canonicalUrl, parentId } = data;
    const updatePayload = {};

    if (name) {
      updatePayload.name = name.trim();
      updatePayload.slug = data.slug?.trim() || updatePayload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updatePayload.description = description;
    if (imageUrl !== undefined) updatePayload.imageUrl = imageUrl;
    if (isActive !== undefined) updatePayload.isActive = isActive;
    if (showInFooter !== undefined) updatePayload.showInFooter = showInFooter;
    if (seoTitle !== undefined) updatePayload.seoTitle = seoTitle?.trim() || null;
    if (seoDescription !== undefined) updatePayload.seoDescription = seoDescription?.trim() || null;
    if (seoKeywords !== undefined) updatePayload.seoKeywords = seoKeywords?.trim() || null;
    if (canonicalUrl !== undefined) updatePayload.canonicalUrl = canonicalUrl?.trim() || null;
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

      // Sync SeoMetadata for Category
      try {
        const generatedSeo = SeoGeneratorService.generateCategorySeo(updated);
        await tx.seoMetadata.upsert({
          where: { entityType_entityId: { entityType: 'CATEGORY', entityId: id } },
          update: {
            customTitle: updated.seoTitle,
            customDescription: updated.seoDescription,
            customCanonicalUrl: updated.canonicalUrl,
            ...generatedSeo
          },
          create: {
            entityType: 'CATEGORY',
            entityId: id,
            customTitle: updated.seoTitle,
            customDescription: updated.seoDescription,
            customCanonicalUrl: updated.canonicalUrl,
            ...generatedSeo
          }
        });
      } catch {
        // Keep category update resilient
      }

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

  /**
   * Dynamically resolves or creates a category by ID or Name
   * Enables authors to assign or introduce new categories during manuscript authoring
   */
  static async findOrCreateCategory(categoryInput, actorId = null) {
    if (!categoryInput) return null;

    const input = String(categoryInput).trim();
    if (!input) return null;

    // Check if input is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
    if (isUuid) {
      const existingById = await prisma.category.findUnique({ where: { id: input } });
      if (existingById) return existingById;
    }

    // Look up by name or slug (case-insensitive)
    const slug = input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: input, mode: 'insensitive' } },
          { slug }
        ]
      }
    });

    if (existing) return existing;

    // Format proper Title Case for display name if it was slug-like
    const formattedName = input.includes('-') || input.includes('_')
      ? input.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : input.replace(/\b\w/g, c => c.toUpperCase());

    return prisma.$transaction(async (tx) => {
      const newCategory = await tx.category.create({
        data: {
          name: formattedName,
          slug,
          isActive: true
        }
      });

      if (actorId) {
        await tx.auditLog.create({
          data: {
            actorId,
            action: 'category.author_create',
            entityType: 'Category',
            entityId: newCategory.id,
            metadata: { name: newCategory.name, slug: newCategory.slug }
          }
        });
      }

      return newCategory;
    });
  }

  /**
   * Merges sourceCategory into targetCategory, reassigning all articles and child categories
   */
  static async mergeCategories({ sourceCategoryId, targetCategoryId }, actorId) {
    if (!sourceCategoryId || !targetCategoryId) {
      throw new AppError('Both sourceCategoryId and targetCategoryId are required', 400, 'INVALID_MERGE_REQUEST');
    }

    if (sourceCategoryId === targetCategoryId) {
      throw new AppError('Cannot merge a category into itself', 400, 'CANNOT_MERGE_SAME_CATEGORY');
    }

    const [sourceCategory, targetCategory] = await Promise.all([
      prisma.category.findUnique({ where: { id: sourceCategoryId }, include: { articles: true, children: true } }),
      prisma.category.findUnique({ where: { id: targetCategoryId } })
    ]);

    if (!sourceCategory || !targetCategory) {
      throw new AppError('One or both specified categories do not exist', 404, 'CATEGORY_NOT_FOUND');
    }

    const reassignedArticlesCount = sourceCategory.articles.length;

    await prisma.$transaction(async (tx) => {
      // 1. Reassign all articles to target category
      if (reassignedArticlesCount > 0) {
        await tx.article.updateMany({
          where: { categoryId: sourceCategoryId },
          data: { categoryId: targetCategoryId }
        });
      }

      // 2. Reassign any children of sourceCategory to targetCategory
      if (sourceCategory.children.length > 0) {
        await tx.category.updateMany({
          where: { parentId: sourceCategoryId },
          data: { parentId: targetCategoryId }
        });
      }

      // 3. Delete sourceCategory
      await tx.category.delete({ where: { id: sourceCategoryId } });

      // 4. Record Audit Log
      if (actorId) {
        await tx.auditLog.create({
          data: {
            actorId,
            action: 'category.merge',
            entityType: 'Category',
            entityId: targetCategoryId,
            metadata: {
              mergedSource: { id: sourceCategory.id, name: sourceCategory.name, slug: sourceCategory.slug },
              target: { id: targetCategory.id, name: targetCategory.name, slug: targetCategory.slug },
              reassignedArticlesCount
            }
          }
        });
      }
    });

    return {
      success: true,
      mergedInto: { id: targetCategory.id, name: targetCategory.name },
      deletedCategory: { id: sourceCategory.id, name: sourceCategory.name },
      articlesReassigned: reassignedArticlesCount
    };
  }
}
