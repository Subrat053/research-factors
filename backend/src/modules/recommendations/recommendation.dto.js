import { ArticleDTO } from '../articles/article.dto.js';

export class RecommendationDTO {
  /**
   * Serializes a single scored recommendation item
   */
  static toItem(scoredItem, intent = null) {
    if (!scoredItem || !scoredItem.candidate) return null;

    const feedbackState = scoredItem.feedbackState || scoredItem.candidate?.feedbacks?.[0]?.feedbackType || 'NONE';

    const item = {
      article: ArticleDTO.toPublicSummary(scoredItem.candidate),
      matchPercentage: scoredItem.matchPercentage || 85,
      reason: scoredItem.reason || 'Curated for your research interests',
      intent: intent || scoredItem.intent || 'RECOMMENDED',
      feedback: { state: feedbackState }
    };

    if (scoredItem.debug) {
      item.debug = scoredItem.debug;
    }

    return item;
  }

  /**
   * Serializes an array of scored items
   */
  static toItemList(scoredItems, intent = null) {
    if (!Array.isArray(scoredItems)) return [];
    return scoredItems
      .map((item) => this.toItem(item, intent))
      .filter(Boolean);
  }

  /**
   * Serializes grouped multi-intent journeys for the article detail page
   */
  static toArticleJourneys({
    articleFeedbackState = 'NONE',
    recommendations = [],
    completeYourResearch = [],
    deepTopicDive = [],
    trendingInInterests = [],
    discoverSomethingNew = []
  }) {
    return {
      articleFeedback: { state: articleFeedbackState },
      recommendations: this.toItemList(recommendations, 'TOP_MATCH'),
      completeYourResearch: {
        title: 'Complete Your Research',
        intent: 'CROSS_FORMAT_JOURNEY',
        description: 'Multi-perspective coverage spanning comparisons, implementation guides, and foundational analyses',
        items: this.toItemList(completeYourResearch, 'CROSS_FORMAT')
      },
      deepTopicDive: {
        title: 'Deep Topic Dive',
        intent: 'CATEGORY_TAG_CONVERGENCE',
        description: 'Explore deeper facets and specialized research within this specific domain',
        items: this.toItemList(deepTopicDive, 'TOPIC_DIVE')
      },
      trendingInInterests: {
        title: 'Trending in Your Interests',
        intent: 'HIGH_VELOCITY_AFFINITY',
        description: 'High-impact articles currently gaining momentum across your topics',
        items: this.toItemList(trendingInInterests, 'TRENDING')
      },
      discoverSomethingNew: {
        title: 'Discover Something New',
        intent: 'SERENDIPITY_EXPANSION',
        description: 'Curated high-quality perspectives across adjacent disciplines',
        items: this.toItemList(discoverSomethingNew, 'DISCOVERY')
      }
    };
  }

  /**
   * Serializes general personalized feed for home/browse pages
   */
  static toFeedResponse({ items = [], topInterests = [] }) {
    return {
      topInterests,
      recommendations: this.toItemList(items)
    };
  }
}
