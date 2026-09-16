import { BookmarkService } from './bookmark.service.js';

export class BookmarkController {
  static async toggle(req, res, next) {
    try {
      const { articleId } = req.body;
      const userId = req.user.id;

      const result = await BookmarkService.toggleBookmark(articleId, userId);

      res.status(200).json({
        success: true,
        message: result.bookmarked ? 'Article bookmarked' : 'Bookmark removed',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBookmarks(req, res, next) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const result = await BookmarkService.getUserBookmarks(userId, { page, limit });

      res.status(200).json({
        success: true,
        data: result.articles,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async checkStatus(req, res, next) {
    try {
      const { articleId } = req.params;
      const userId = req.user?.id || null;

      const bookmarked = await BookmarkService.isArticleBookmarked(articleId, userId);

      res.status(200).json({
        success: true,
        data: { bookmarked }
      });
    } catch (error) {
      next(error);
    }
  }
}
