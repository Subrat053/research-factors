import slugify from 'slugify';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CategoryService } from '../categories/category.service.js';

const RICH_BLOCK_SANITIZE_OPTIONS = {
  allowedTags: [
    'p', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'code', 'pre',
    'blockquote', 'ul', 'ol', 'li', 'a', 'sub', 'sup', 'br'
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    code: ['class'],
    span: ['class']
  },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName: 'a',
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    })
  }
};

/**
 * Sanitizes block contents (especially rich HTML) to enforce Rule 6 server-side sanitization.
 */
export function sanitizeBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];

  return blocks.map((b, idx) => {
    const blockType = b.blockType || b.type || 'paragraph';
    let content = b.content ? { ...b.content } : {};

    // If block contains rich HTML, sanitize strictly against XSS allowlist
    if (content.html && typeof content.html === 'string') {
      content.html = sanitizeHtml(content.html, RICH_BLOCK_SANITIZE_OPTIONS);
    }

    return {
      blockType,
      position: idx,
      content,
      metadata: b.metadata || {}
    };
  });
}

export const VALID_ARTICLE_TYPES = new Set([
  'RESEARCH',
  'REVIEW',
  'COMPARISON',
  'GUIDE',
  'ANALYSIS',
  'OPINION'
]);

export class ArticleService {
  /**
   * Generates a unique, URL-safe slug with collision resolution
   */
  static async generateUniqueSlug(title, excludeArticleId = null) {
    let baseSlug = slugify(title, { lower: true, strict: true, trim: true });
    if (!baseSlug) {
      baseSlug = `research-${Date.now()}`;
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.article.findUnique({
        where: { slug },
        select: { id: true }
      });

      if (!existing || existing.id === excludeArticleId) {
        return slug;
      }

      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  /**
   * Calculates approximate reading time based on 200 words per minute
   */
  static calculateReadingTime(textBlocks) {
    const totalWords = textBlocks.reduce((count, block) => {
      let text = '';
      if (typeof block === 'string') text = block;
      else if (block.content?.text) text = block.content.text;
      else if (block.content?.quote) text = block.content.quote;
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      return count + words;
    }, 0);

    return Math.max(1, Math.ceil(totalWords / 200));
  }

  /**
   * Fetches paginated published research articles with multi-filtering
   */
  static async getPublishedArticles({
    page = 1,
    limit = 12,
    categorySlug,
    tagSlug,
    type,
    search,
    sort = 'latest'
  }) {
    const skip = (Math.max(1, page) - 1) * limit;
    const where = {
      status: 'PUBLISHED'
    };

    if (categorySlug) {
      where.category = { slug: categorySlug, isActive: true };
    }

    if (tagSlug) {
      where.tags = {
        some: {
          tag: { slug: tagSlug }
        }
      };
    }

    if (type) {
      where.type = type;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { subtitle: { contains: term, mode: 'insensitive' } },
        { excerpt: { contains: term, mode: 'insensitive' } },
        {
          tags: {
            some: {
              tag: { name: { contains: term, mode: 'insensitive' } }
            }
          }
        }
      ];
    }

    let orderBy = { publishedAt: 'desc' };
    if (sort === 'popular') {
      orderBy = { viewCount: 'desc' };
    } else if (sort === 'discussed') {
      orderBy = { comments: { _count: 'desc' } };
    }

    const [total, articles] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          author: {
            include: { authorProfile: true }
          },
          tags: {
            include: { tag: true }
          },
          _count: {
            select: { comments: { where: { status: 'VISIBLE' } } }
          }
        }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Fetches single published article by slug (with 301 history fallback)
   */
  static async getArticleBySlug(slug) {
    let article = await prisma.article.findUnique({
      where: { slug },
      include: {
        category: true,
        author: {
          include: { authorProfile: true }
        },
        tags: {
          include: { tag: true }
        },
        blocks: {
          orderBy: { position: 'asc' }
        },
        _count: {
          select: { comments: { where: { status: 'VISIBLE' } } }
        }
      }
    });

    // Check slug redirect history if not found
    if (!article) {
      const history = await prisma.articleSlugHistory.findUnique({
        where: { slug },
        include: { article: true }
      });

      if (history?.article) {
        return { redirect: true, newSlug: history.article.slug };
      }

      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    if (article.status !== 'PUBLISHED') {
      throw new AppError('This article is not currently published', 403, 'ARTICLE_UNPUBLISHED');
    }

    // Increment view count asynchronously
    prisma.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } }
    }).catch(() => {});

    // Fetch related articles
    const related = await prisma.article.findMany({
      where: {
        categoryId: article.categoryId,
        id: { not: article.id },
        status: 'PUBLISHED'
      },
      take: 4,
      orderBy: { publishedAt: 'desc' },
      include: {
        category: true,
        author: true,
        _count: { select: { comments: true } }
      }
    });

    return { article, related };
  }

  /**
   * Fetches top featured article for homepage hero
   */
  static async getFeaturedArticle() {
    let article = await prisma.article.findFirst({
      where: {
        status: 'PUBLISHED',
        isFeatured: true
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        category: true,
        author: { include: { authorProfile: true } },
        tags: { include: { tag: true } },
        _count: {
          select: { comments: { where: { status: 'VISIBLE' } } }
        }
      }
    });

    if (!article) {
      article = await prisma.article.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        include: {
          category: true,
          author: { include: { authorProfile: true } },
          tags: { include: { tag: true } },
          _count: {
            select: { comments: { where: { status: 'VISIBLE' } } }
          }
        }
      });
    }

    return article;
  }

  /**
   * Fetches trending research based on engagement metrics
   */
  static async getTrendingArticles(limit = 6) {
    return prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      take: limit,
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' }
      ],
      include: {
        category: true,
        author: true,
        _count: {
          select: { comments: { where: { status: 'VISIBLE' } } }
        }
      }
    });
  }

  /**
   * Fetches full draft article for author studio
   */
  static async getDraftById(articleId) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        category: true,
        author: {
          include: { authorProfile: true }
        },
        tags: {
          include: { tag: true }
        },
        blocks: {
          orderBy: { position: 'asc' }
        },
        _count: {
          select: { comments: true }
        }
      }
    });

    if (!article) {
      throw new AppError('Draft manuscript not found', 404, 'DRAFT_NOT_FOUND');
    }

    return article;
  }

  /**
   * Helper to normalize & find/create tags in dual format:
   * Supports: #semiconductor_architecture OR Semiconductor Architecture OR objects
   */
  static async resolveTags(tx, tagsInput = []) {
    if (!Array.isArray(tagsInput) || tagsInput.length === 0) return [];

    const resolvedTagIds = [];
    const seenSlugs = new Set();

    for (const raw of tagsInput) {
      if (!raw) continue;
      let rawString = typeof raw === 'string' ? raw : (raw.name || raw.slug || '');
      rawString = String(rawString).trim();
      if (rawString.length < 2) continue;

      // 1. Strip leading # and whitespace
      const clean = rawString.replace(/^#+/, '').trim();
      if (clean.length < 2) continue;

      // 2. Compute canonical slug
      const slug = clean
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      if (!slug || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      // 3. Compute canonical Title Case name
      let name;
      if (clean.includes('_') || clean.includes('-')) {
        name = clean
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
      } else {
        name = clean.replace(/\b\w/g, c => c.toUpperCase());
      }

      // 4. Find or Create tag in interactive transaction
      let tag = await tx.tag.findFirst({
        where: {
          OR: [
            { slug },
            { name: { equals: name, mode: 'insensitive' } }
          ]
        }
      });

      if (!tag) {
        tag = await tx.tag.create({
          data: { name, slug }
        });
      }

      resolvedTagIds.push(tag.id);
    }

    return resolvedTagIds;
  }

  /**
   * Creates a new draft article
   */
  static async createDraft(authorId, data) {
    if (!data.title || data.title.trim().length < 5) {
      throw new AppError('Manuscript title must be at least 5 characters long', 400, 'TITLE_TOO_SHORT');
    }

    // Dynamic Category Resolution: accepts categoryId or new categoryName from author
    let resolvedCategory = null;
    if (data.categoryId || data.categoryName) {
      resolvedCategory = await CategoryService.findOrCreateCategory(
        data.categoryName || data.categoryId,
        authorId
      );
    }

    if (!resolvedCategory) {
      throw new AppError('Please select or specify a primary category for your manuscript', 400, 'CATEGORY_REQUIRED');
    }

    const slug = await this.generateUniqueSlug(data.title);
    const readingTimeMin = this.calculateReadingTime([
      data.title,
      data.excerpt || '',
      ...(data.blocks || [])
    ]);

    const normalizedType = data.type && VALID_ARTICLE_TYPES.has(String(data.type).toUpperCase())
      ? String(data.type).toUpperCase()
      : 'RESEARCH';

    return prisma.$transaction(async (tx) => {
      const article = await tx.article.create({
        data: {
          title: data.title.trim(),
          slug,
          subtitle: data.subtitle ? data.subtitle.trim() : null,
          excerpt: data.excerpt ? data.excerpt.trim() : null,
          coverImageUrl: data.coverImageUrl || null,
          coverImageAlt: data.coverImageAlt || null,
          type: normalizedType,
          status: 'DRAFT',
          readingTimeMin,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          canonicalUrl: data.canonicalUrl || null,
          authorId,
          categoryId: resolvedCategory.id,
          createdById: authorId
        }
      });

      if (data.blocks && data.blocks.length > 0) {
        const sanitizedBlocks = sanitizeBlocks(data.blocks);
        await tx.articleBlock.createMany({
          data: sanitizedBlocks.map(b => ({
            articleId: article.id,
            ...b
          }))
        });
      }

      // Dynamic Tag Handling (dual-format strings or objects)
      const tagsToProcess = data.tags || data.tagIds || [];
      if (tagsToProcess.length > 0) {
        const tagIds = await this.resolveTags(tx, tagsToProcess);
        if (tagIds.length > 0) {
          await tx.articleTag.createMany({
            data: tagIds.map(tagId => ({
              articleId: article.id,
              tagId
            }))
          });
        }
      }

      return tx.article.findUnique({
        where: { id: article.id },
        include: {
          category: true,
          blocks: { orderBy: { position: 'asc' } },
          tags: { include: { tag: true } }
        }
      });
    });
  }

  /**
   * Debounced update of draft content, blocks, category, and tags
   */
  static async updateDraft(articleId, data) {
    const readingTimeMin = this.calculateReadingTime([
      data.title || '',
      data.excerpt || '',
      ...(data.blocks || [])
    ]);

    return prisma.$transaction(async (tx) => {
      const updateData = {
        updatedAt: new Date(),
        readingTimeMin
      };

      if (data.title) updateData.title = data.title.trim();
      if (data.subtitle !== undefined) updateData.subtitle = data.subtitle ? data.subtitle.trim() : null;
      if (data.excerpt !== undefined) updateData.excerpt = data.excerpt ? data.excerpt.trim() : null;
      if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;
      if (data.coverImageAlt !== undefined) updateData.coverImageAlt = data.coverImageAlt;
      if (data.type) {
        const candidate = String(data.type).toUpperCase();
        if (VALID_ARTICLE_TYPES.has(candidate)) {
          updateData.type = candidate;
        }
      }
      if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle;
      if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription;

      // Dynamic category resolution on update
      if (data.categoryName || data.categoryId) {
        const resolvedCategory = await CategoryService.findOrCreateCategory(
          data.categoryName || data.categoryId
        );
        if (resolvedCategory) {
          updateData.categoryId = resolvedCategory.id;
        }
      }

      await tx.article.update({
        where: { id: articleId },
        data: updateData
      });

      if (data.blocks) {
        await tx.articleBlock.deleteMany({ where: { articleId } });
        const sanitizedBlocks = sanitizeBlocks(data.blocks);
        if (sanitizedBlocks.length > 0) {
          await tx.articleBlock.createMany({
            data: sanitizedBlocks.map(b => ({
              articleId,
              ...b
            }))
          });
        }
      }

      // Dynamic tags synchronization on update
      if (data.tags !== undefined || data.tagIds !== undefined) {
        const tagsToProcess = data.tags !== undefined ? data.tags : data.tagIds;
        await tx.articleTag.deleteMany({ where: { articleId } });

        if (Array.isArray(tagsToProcess) && tagsToProcess.length > 0) {
          const tagIds = await this.resolveTags(tx, tagsToProcess);
          if (tagIds.length > 0) {
            await tx.articleTag.createMany({
              data: tagIds.map(tagId => ({
                articleId,
                tagId
              }))
            });
          }
        }
      }

      return tx.article.findUnique({
        where: { id: articleId },
        include: {
          category: true,
          blocks: { orderBy: { position: 'asc' } },
          tags: { include: { tag: true } }
        }
      });
    });
  }

  /**
   * Submits draft for editorial review
   */
  static async submitForReview(articleId) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { category: true }
    });
    if (!article) throw new AppError('Manuscript not found', 404, 'ARTICLE_NOT_FOUND');

    if (article.status !== 'DRAFT' && article.status !== 'REJECTED') {
      throw new AppError(`Cannot submit article with status '${article.status}'`, 400, 'INVALID_STATUS');
    }

    if (!article.categoryId) {
      throw new AppError('Manuscript must have a primary category selected before submitting for review', 400, 'CATEGORY_REQUIRED');
    }

    if (!article.title || article.title.trim().length < 5) {
      throw new AppError('Manuscript title must be at least 5 characters long', 400, 'TITLE_TOO_SHORT');
    }

    return prisma.article.update({
      where: { id: articleId },
      data: {
        status: 'PENDING_REVIEW',
        rejectionReason: null
      },
      include: {
        category: true,
        blocks: { orderBy: { position: 'asc' } },
        tags: { include: { tag: true } }
      }
    });
  }

  /**
   * Editorial actions: Approve, Reject, Publish, Unpublish
   */
  static async approveArticle(articleId, editorId) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.article.update({
        where: { id: articleId },
        data: { status: 'APPROVED' }
      });

      await tx.auditLog.create({
        data: {
          actorId: editorId,
          action: 'ARTICLE_APPROVED',
          entityType: 'Article',
          entityId: articleId
        }
      });

      return updated;
    });
  }

  static async rejectArticle(articleId, editorId, reason) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.article.update({
        where: { id: articleId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: editorId,
          action: 'ARTICLE_REJECTED',
          entityType: 'Article',
          entityId: articleId,
          metadata: { reason }
        }
      });

      return updated;
    });
  }

  static async publishArticle(articleId, publisherId) {
    return prisma.$transaction(async (tx) => {
      const article = await tx.article.findUnique({ where: { id: articleId } });
      if (!article) throw new AppError('Article not found', 404);

      if (!article.title || article.title.trim().length < 3) {
        throw new AppError('Article must have a valid title before publishing', 400);
      }

      const updated = await tx.article.update({
        where: { id: articleId },
        data: {
          status: 'PUBLISHED',
          publishedAt: article.publishedAt || new Date(),
          publishedById: publisherId
        }
      });

      // Maintain slug history
      await tx.articleSlugHistory.upsert({
        where: { slug: updated.slug },
        update: { articleId: updated.id },
        create: { slug: updated.slug, articleId: updated.id }
      });

      await tx.auditLog.create({
        data: {
          actorId: publisherId,
          action: 'ARTICLE_PUBLISHED',
          entityType: 'Article',
          entityId: articleId
        }
      });

      return updated;
    });
  }
}
