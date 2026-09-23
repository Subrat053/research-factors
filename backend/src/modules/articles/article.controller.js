import { ArticleService } from './article.service.js';
import { ArticleDTO } from './article.dto.js';
import { prisma } from '../../config/db.js';

export class ArticleController {
  static async getPublishedArticles(req, res, next) {
    try {
      const { page, limit, category, tag, type, search, sort } = req.query;
      const result = await ArticleService.getPublishedArticles({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 12,
        categorySlug: category,
        tagSlug: tag,
        type,
        search,
        sort
      });

      res.json({
        success: true,
        data: {
          items: result.items.map(a => ArticleDTO.toPublicSummary(a)),
          pagination: result.pagination
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getArticleBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const result = await ArticleService.getArticleBySlug(slug);

      if (result.redirect) {
        return res.status(301).json({
          success: true,
          redirect: true,
          newSlug: result.newSlug,
          message: 'Article has moved to a new URL slug'
        });
      }

      res.json({
        success: true,
        data: ArticleDTO.toPublicDetail(result.article, result.related)
      });
    } catch (err) {
      next(err);
    }
  }

  static async getFeatured(req, res, next) {
    try {
      const article = await ArticleService.getFeaturedArticle();
      res.json({
        success: true,
        data: article ? ArticleDTO.toPublicSummary(article) : null
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTrending(req, res, next) {
    try {
      const articles = await ArticleService.getTrendingArticles(6);
      res.json({
        success: true,
        data: articles.map(a => ArticleDTO.toPublicSummary(a))
      });
    } catch (err) {
      next(err);
    }
  }

  static async createDraft(req, res, next) {
    try {
      const article = await ArticleService.createDraft(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: ArticleDTO.toAuthorAdmin(article),
        message: 'Draft created successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateDraft(req, res, next) {
    try {
      const article = await ArticleService.updateDraft(req.params.id, req.body);
      res.json({
        success: true,
        data: ArticleDTO.toAuthorAdmin(article),
        message: 'Draft saved'
      });
    } catch (err) {
      next(err);
    }
  }

  static async submitForReview(req, res, next) {
    try {
      const article = await ArticleService.submitForReview(req.params.id);
      res.json({
        success: true,
        data: ArticleDTO.toAuthorAdmin(article),
        message: 'Article submitted for editorial review'
      });
    } catch (err) {
      next(err);
    }
  }

  static async getDraft(req, res, next) {
    try {
      const article = await ArticleService.getDraftById(req.params.id);
      res.json({
        success: true,
        data: ArticleDTO.toAuthorAdmin(article)
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMyArticles(req, res, next) {
    try {
      const articles = await prisma.article.findMany({
        where: { authorId: req.user.id },
        orderBy: { updatedAt: 'desc' },
        include: {
          category: true,
          blocks: { orderBy: { position: 'asc' } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true } }
        }
      });

      res.json({
        success: true,
        data: articles.map(a => ArticleDTO.toAuthorAdmin(a))
      });
    } catch (err) {
      next(err);
    }
  }

  static async approveArticle(req, res, next) {
    try {
      const article = await ArticleService.approveArticle(req.params.id, req.user.id);
      res.json({
        success: true,
        data: ArticleDTO.toAuthorAdmin(article),
        message: 'Article approved'
      });
    } catch (err) {
      next(err);
    }
  }

  static async rejectArticle(req, res, next) {
    try {
      const { reason } = req.body;
      const article = await ArticleService.rejectArticle(req.params.id, req.user.id, reason);
      res.json({
        success: true,
        data: ArticleDTO.toAuthorAdmin(article),
        message: 'Article rejected with editorial feedback'
      });
    } catch (err) {
      next(err);
    }
  }

  static async publishArticle(req, res, next) {
    try {
      const article = await ArticleService.publishArticle(req.params.id, req.user.id);
      res.json({
        success: true,
        data: ArticleDTO.toAuthorAdmin(article),
        message: 'Article published successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}
