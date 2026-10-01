import { RecommendationService } from './recommendation.service.js';
import { EventService } from './event.service.js';

export class RecommendationController {
  /**
   * Records a user reading event
   */
  static async recordEvent(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const event = await EventService.recordEvent({
        ...req.body,
        userId
      });

      res.status(201).json({
        success: true,
        data: { id: event.id, eventType: event.eventType }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sets visitor interests from popup or preferences
   */
  static async setInterests(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const { visitorId, categoryIds } = req.body;
      const result = await EventService.setExplicitInterests({
        visitorId,
        userId,
        categoryIds
      });

      res.status(200).json({
        success: true,
        message: 'Reading preferences saved successfully',
        data: { updatedCount: result.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves visitor's saved interests
   */
  static async getVisitorInterests(req, res, next) {
    try {
      const visitorId = req.query.visitorId || req.headers['x-visitor-id'] || null;
      const userId = req.user?.id || null;
      const interests = await RecommendationService.getVisitorInterests(visitorId, userId);

      res.status(200).json({
        success: true,
        data: interests
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Removes an interest
   */
  static async removeInterest(req, res, next) {
    try {
      const visitorId = req.query.visitorId || req.headers['x-visitor-id'] || null;
      const userId = req.user?.id || null;
      const { categoryId } = req.params;

      await RecommendationService.removeInterest(visitorId, categoryId, userId);

      res.status(200).json({
        success: true,
        message: 'Interest removed'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gets multi-intent recommendation journeys for an article
   */
  static async getArticleRecommendations(req, res, next) {
    try {
      const { articleId } = req.params;
      const visitorId = req.query.visitorId || req.headers['x-visitor-id'] || null;
      const sessionId = req.query.sessionId || req.headers['x-session-id'] || null;
      const userId = req.user?.id || null;

      const journeys = await RecommendationService.getArticleRecommendations(articleId, {
        visitorId,
        userId,
        sessionId
      });

      res.status(200).json({
        success: true,
        data: journeys
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gets general personalized feed
   */
  static async getPersonalizedFeed(req, res, next) {
    try {
      const visitorId = req.query.visitorId || req.headers['x-visitor-id'] || null;
      const sessionId = req.query.sessionId || req.headers['x-session-id'] || null;
      const userId = req.user?.id || null;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 8;

      const feed = await RecommendationService.getPersonalizedFeed({
        visitorId,
        userId,
        sessionId,
        limit
      });

      res.status(200).json({
        success: true,
        data: feed
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves recommendation configuration
   */
  static async getConfig(req, res, next) {
    try {
      const config = await RecommendationService.getConfig();
      res.status(200).json({
        success: true,
        data: config
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates recommendation configuration (Admin)
   */
  static async updateConfig(req, res, next) {
    try {
      const config = await RecommendationService.updateConfig(req.body);
      res.status(200).json({
        success: true,
        message: 'Recommendation settings updated',
        data: config
      });
    } catch (error) {
      next(error);
    }
  }
}
