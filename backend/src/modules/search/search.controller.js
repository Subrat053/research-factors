import { SearchService } from './search.service.js';
import { ArticleDTO } from '../articles/article.dto.js';

export class SearchController {
  static async search(req, res, next) {
    try {
      const { q = '', limit = 10, type, category } = req.query;
      const articles = await SearchService.searchArticles(q, {
        type,
        category,
        limit: Number(limit) || 10
      });

      res.json({
        success: true,
        data: articles.map(a => ArticleDTO.toPublicSummary(a))
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTrending(req, res, next) {
    try {
      const { limit = 6 } = req.query;
      const articles = await SearchService.getTrendingArticles(Number(limit) || 6);

      res.json({
        success: true,
        data: articles.map(a => ArticleDTO.toPublicSummary(a))
      });
    } catch (err) {
      next(err);
    }
  }

  static async getRecommendations(req, res, next) {
    try {
      const { type, category, limit = 4 } = req.query;
      const articles = await SearchService.getRecommendedArticles({
        type,
        category,
        limit: Number(limit) || 4
      });

      res.json({
        success: true,
        data: articles.map(a => ArticleDTO.toPublicSummary(a))
      });
    } catch (err) {
      next(err);
    }
  }

  static async trackClick(req, res, next) {
    try {
      const { articleId, term } = req.body;
      const result = await SearchService.recordSearchClick(articleId, term);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}
