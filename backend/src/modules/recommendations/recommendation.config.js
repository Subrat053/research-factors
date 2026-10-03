/**
 * Centralized Recommendation & Personalization Engine Configuration
 * Single source of truth for all weights, decay half-lives, penalties, and thresholds.
 */

export const RECOMMENDATION_CONFIG = {
  popupEnabled: true,
  dwellTimeSeconds: 30,
  scrollThresholdPercent: 50,
  cooldownDays: 7,
  maxCategoryPills: 8,

  // Multi-dimensional normalized scoring weights (Sum of baseline components = 1.0)
  weights: {
    category: 0.26,             // Contextual category & subcategory alignment
    interest: 0.20,             // Learned long-term user category affinity
    tag: 0.16,                  // Jaccard & overlap tag similarity
    articleTypeAffinity: 0.10,  // User preferred article formats
    explicitFeedback: 0.10,     // Like-derived topic & entity affinity
    complementarity: 0.08,      // Cross-format logical journey mapping
    commentAffinity: 0.04,      // Engagement via meaningful discussion
    recency: 0.03,              // Freshness half-life
    popularity: 0.03            // Logarithmic view count boost
  },

  thresholds: {
    // Comment signals & quality filters
    minCharsForCommentWeight: 15,
    commentWeights: {
      COMMENT_SUBMITTED: 1.5,
      COMMENT_REPLY: 1.2,
      COMMENT_LIKE: 0.5
    },

    // Explicit feedback adjustments
    likeBonus: 0.10,
    dislikePenalty: 0.15,
    tagDislikePenalty: 0.08,
    categoryDislikeThreshold: 3, // >=3 dislikes in same category triggers soft penalty
    typeDislikeThreshold: 2,     // >=2 dislikes of same format triggers soft penalty

    // Time decay half-lives (in days)
    halfLifeDays: {
      interest: 30,
      typePreference: 30,
      recency: 14
    },

    // Candidate generation pooling limits
    candidatePoolSizes: {
      exactCategory: 20,
      parentCategory: 12,
      siblingCategory: 16,
      childCategory: 16,
      tagMatch: 16,
      userInterests: 16,
      typeAffinity: 16,
      trendingFallback: 16,
      totalPreScoreCap: 100
    },

    // Diversity constraints
    diversity: {
      maxPerCategory: 2,
      maxPerType: 2,
      defaultLimit: 8
    }
  }
};
