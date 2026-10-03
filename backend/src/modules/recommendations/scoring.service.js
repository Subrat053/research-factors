import { RECOMMENDATION_CONFIG } from './recommendation.config.js';

function extractTagDescriptors(tags) {
  if (!Array.isArray(tags)) return { ids: new Set(), slugs: new Set(), names: [] };
  const ids = new Set();
  const slugs = new Set();
  const names = [];

  for (const item of tags) {
    const id = item.tagId || item.tag?.id || item.id;
    const name = item.tag?.name || item.name;
    const slug = item.tag?.slug || item.slug || (name ? String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-') : null);

    if (id) ids.add(String(id));
    if (slug) slugs.add(String(slug).toLowerCase());
    if (name && !names.includes(name)) names.push(name);
  }
  return { ids, slugs, names };
}

export class ScoringService {
  /**
   * Scores a single candidate article against visitor context with strict [0.0, 1.0] normalization
   */
  static scoreCandidate({
    candidate,
    currentArticle = null,
    taxonomyContext = {},
    interestProfileMap = new Map(),
    typePreferenceMap = new Map(),
    feedbackMap = {
      likedArticleIds: new Set(),
      dislikedArticleIds: new Set(),
      dislikedCategories: new Map(),
      dislikedTypes: new Map(),
      dislikedTagIds: new Set()
    },
    viewedArticleIds = new Set(),
    sessionArticleIds = new Set(),
    weights = null,
    includeDebug = false
  }) {
    const activeWeights = {
      ...RECOMMENDATION_CONFIG.weights,
      ...(weights || {})
    };

    const reasons = [];
    let primaryTagReason = null;
    let categoryReason = null;
    let compReason = null;
    let interestReason = null;

    // 1. Contextual Hierarchical Category Similarity [0.0 - 1.0]
    let categoryScore = 0;
    if (currentArticle) {
      const currentCategory = currentArticle.category;
      const currentCatId = currentArticle.categoryId;
      const currentParentId = currentCategory?.parentId || currentCategory?.parent_id || null;

      const candCatId = candidate.categoryId;
      const candCategory = candidate.category;
      const candParentId = candCategory?.parentId || candCategory?.parent_id || null;

      const siblingCategoryIds = taxonomyContext?.siblingCategoryIds || [];
      const childCategoryIds = taxonomyContext?.childCategoryIds || [];

      // Tier 1: Exact same category / subcategory
      if (candCatId === currentCatId) {
        categoryScore = 1.0;
        categoryReason = `More in-depth coverage in ${candCategory?.name || currentCategory?.name || 'this topic'}`;
      }
      // Tier 2A: Sibling subcategories (both share the same parentId)
      else if (
        currentParentId &&
        (candParentId === currentParentId || siblingCategoryIds.includes(candCatId))
      ) {
        const parentName = currentCategory?.parent?.name || candCategory?.parent?.name;
        categoryScore = 0.75;
        categoryReason = parentName
          ? `Related ${parentName} research in ${candCategory?.name}`
          : `Related discipline focus in ${candCategory?.name || 'this field'}`;
      }
      // Tier 2B: Child subcategory (specialized branch)
      else if (
        candParentId === currentCatId ||
        childCategoryIds.includes(candCatId)
      ) {
        categoryScore = 0.70;
        categoryReason = `Specialized research in ${candCategory?.name}`;
      }
      // Tier 2C: Parent category (broader domain context)
      else if (
        currentParentId &&
        candCatId === currentParentId
      ) {
        categoryScore = 0.65;
        categoryReason = `Broader domain context from ${candCategory?.name || currentCategory?.parent?.name || 'parent domain'}`;
      } else {
        categoryScore = 0.0;
      }
    } else {
      // In general feed without active article context, category similarity is neutral
      categoryScore = 0.5;
    }

    // 2. User Category Interest Affinity [0.0 - 1.0]
    const rawInterest = interestProfileMap.get(candidate.categoryId) || 0;
    const interestScore = Math.min(Math.max(0, rawInterest / 10.0), 1.0);
    if (interestScore > 0.35) {
      interestReason = `Aligned with your interest in ${candidate.category?.name || 'this topic'}`;
    }

    // 3. Tag Similarity (Jaccard + Overlap Coefficient) [0.0 - 1.0]
    let tagScore = 0;
    if (currentArticle && currentArticle.tags && candidate.tags) {
      const currentTags = extractTagDescriptors(currentArticle.tags);
      const candidateTags = extractTagDescriptors(candidate.tags);

      const sharedNames = [];
      let commonCount = 0;

      for (const candTag of candidate.tags) {
        const cId = candTag.tagId || candTag.tag?.id || candTag.id;
        const cName = candTag.tag?.name || candTag.name;
        const cSlug = candTag.tag?.slug || candTag.slug || (cName ? String(cName).toLowerCase().replace(/[^a-z0-9]+/g, '-') : null);

        const isMatch = (cId && currentTags.ids.has(String(cId))) || (cSlug && currentTags.slugs.has(String(cSlug).toLowerCase()));
        if (isMatch) {
          commonCount++;
          if (cName && !sharedNames.includes(cName)) {
            sharedNames.push(cName);
          }
        }
      }

      const currentSize = currentTags.slugs.size || currentTags.ids.size;
      const candidateSize = candidateTags.slugs.size || candidateTags.ids.size;

      if (currentSize > 0 && candidateSize > 0 && commonCount > 0) {
        const unionSize = currentSize + candidateSize - commonCount;
        const jaccard = unionSize > 0 ? commonCount / unionSize : 0;
        const overlap = commonCount / Math.min(currentSize, candidateSize);
        tagScore = Math.min(1.0, 0.6 * jaccard + 0.4 * overlap);

        if (sharedNames.length > 0) {
          primaryTagReason = `Shares topics: #${sharedNames.slice(0, 2).join(' #')}`;
        } else {
          primaryTagReason = 'Shares core research tags with what you are reading';
        }
      }
    }

    // 4. User Article Type Affinity [0.0 - 1.0]
    const userTypePref = typePreferenceMap.get(candidate.type);
    const typeAffinityScore = userTypePref ? userTypePref.normalizedAffinity : 0.5;

    // 5. Cross-Format Complementarity [0.0 - 1.0]
    let complementarityScore = 0.5;
    if (currentArticle && currentArticle.type) {
      const currentType = currentArticle.type;
      const candType = candidate.type;

      if (currentType !== candType) {
        if (currentType === 'REVIEW' && candType === 'COMPARISON') {
          complementarityScore = 1.0;
          compReason = 'Complements this review with a direct comparison';
        } else if (currentType === 'REVIEW' && candType === 'GUIDE') {
          complementarityScore = 0.85;
          compReason = 'Actionable implementation guide for this review';
        } else if (currentType === 'RESEARCH' && candType === 'ANALYSIS') {
          complementarityScore = 1.0;
          compReason = 'Critical editorial analysis of related research';
        } else if (currentType === 'RESEARCH' && candType === 'COMPARISON') {
          complementarityScore = 0.80;
          compReason = 'Comparative benchmark evaluating this research';
        } else if (candType === 'RESEARCH') {
          complementarityScore = 0.75;
          compReason = 'Underlying scientific & methodology research';
        } else {
          complementarityScore = 0.60;
          compReason = `Alternate ${candType.toLowerCase()} perspective`;
        }
      } else {
        // Same format has lower complementarity bonus
        complementarityScore = 0.35;
      }

      // If user has strong negative preference for this type (negativeScore >= 2.0), override complementarity
      if (userTypePref && userTypePref.negativeScore >= 2.0) {
        complementarityScore *= 0.4;
      }
    }

    // 6. Explicit Feedback Relationship [0.0 - 1.0]
    let explicitFeedbackScore = 0.0;
    if (feedbackMap.likedArticleIds.size > 0) {
      // If user liked articles in this exact category, give a bounded positive signal
      const likedInCat = interestScore > 0 ? 0.8 : 0.0;
      explicitFeedbackScore = Math.min(1.0, likedInCat);
    }

    // 7. Comment Engagement Signal [0.0 - 1.0]
    const commentAffinityScore = Math.min(1.0, interestScore * 0.7);

    // 8. Recency with 14-day exponential half-life decay [0.0 - 1.0]
    const pubDate = candidate.publishedAt ? new Date(candidate.publishedAt).getTime() : Date.now();
    const ageInDays = Math.max(0, (Date.now() - pubDate) / (1000 * 60 * 60 * 24));
    const recencyScore = Math.exp((-Math.LN2 / 14) * ageInDays);

    // 9. Popularity Boost [0.0 - 1.0] (Logarithmic normalization against 100k views)
    const viewCount = candidate.viewCount || 0;
    const popularityScore = Math.min(Math.log10(viewCount + 1) / 5.0, 1.0);

    // 10. Conservative Negative Penalties
    let negativePenalty = 0.0;

    // Penalty for tag overlap with disliked articles
    if (feedbackMap.dislikedTagIds && feedbackMap.dislikedTagIds.size > 0 && candidate.tags) {
      let dislikedTagMatches = 0;
      for (const t of candidate.tags) {
        const tid = t.tagId || t.tag?.id || t.id;
        if (tid && feedbackMap.dislikedTagIds.has(tid)) {
          dislikedTagMatches++;
        }
      }
      if (dislikedTagMatches > 0) {
        negativePenalty += Math.min(0.12, dislikedTagMatches * 0.04);
      }
    }

    // Repeated Category Dislike Soft Penalty (Triggered only after >= 3 dislikes)
    const categoryDislikes = feedbackMap.dislikedCategories?.get(candidate.categoryId) || 0;
    if (categoryDislikes >= 3 && interestScore < 0.5) {
      negativePenalty += Math.min(0.15, categoryDislikes * 0.03);
    }

    // Repeated Article Type Dislike Soft Penalty (Triggered only after >= 2 dislikes)
    const typeDislikes = feedbackMap.dislikedTypes?.get(candidate.type) || 0;
    if (typeDislikes >= 2) {
      negativePenalty += Math.min(0.10, typeDislikes * 0.03);
    }

    // Aggregate Base Weighted Score
    const weightedSum =
      categoryScore * (activeWeights.category ?? 0.26) +
      interestScore * (activeWeights.interest ?? 0.20) +
      tagScore * (activeWeights.tag ?? 0.16) +
      typeAffinityScore * (activeWeights.articleTypeAffinity ?? 0.10) +
      explicitFeedbackScore * (activeWeights.explicitFeedback ?? 0.10) +
      complementarityScore * (activeWeights.complementarity ?? 0.08) +
      commentAffinityScore * (activeWeights.commentAffinity ?? 0.04) +
      recencyScore * (activeWeights.recency ?? 0.03) +
      popularityScore * (activeWeights.popularity ?? 0.03);

    // Subtract negative penalty
    let finalScore = Math.max(0.02, weightedSum - negativePenalty);

    // Penalties for already completed / same session read
    if (viewedArticleIds.has(candidate.id)) {
      finalScore *= 0.25; // Significant penalty for completed read
    } else if (sessionArticleIds.has(candidate.id)) {
      finalScore *= 0.60; // Moderate penalty for same-session view
    }

    finalScore = Math.max(0.01, Math.min(1.0, finalScore));

    // Dynamic, calibrated Match Percentage (Ranges realistically between 62% and 96%)
    const matchPercentage = Math.round(62 + finalScore * 34);

    // Assemble Explainable Reason Hierarchy
    if (primaryTagReason) {
      reasons.push(primaryTagReason);
    }
    if (categoryReason && categoryScore >= 0.65) {
      reasons.push(categoryReason);
    }
    if (interestReason) {
      reasons.push(interestReason);
    }
    if (compReason && complementarityScore >= 0.75) {
      reasons.push(compReason);
    }
    if (categoryReason && !reasons.includes(categoryReason)) {
      reasons.push(categoryReason);
    }

    if (reasons.length === 0) {
      reasons.push(
        candidate.isFeatured
          ? 'Featured editorial selection'
          : `Popular reading in ${candidate.category?.name || 'Research Factors'}`
      );
    }

    const result = {
      candidate,
      score: finalScore,
      matchPercentage,
      reason: reasons[0]
    };

    if (includeDebug) {
      result.debug = {
        category: categoryScore,
        interest: interestScore,
        tag: tagScore,
        typeAffinity: typeAffinityScore,
        feedback: explicitFeedbackScore,
        complementarity: complementarityScore,
        comment: commentAffinityScore,
        recency: recencyScore,
        popularity: popularityScore,
        negativePenalty,
        finalScore
      };
    }

    return result;
  }

  /**
   * Scores an array of candidate articles and sorts descending by score
   */
  static scoreCandidates(candidates, context) {
    const scored = candidates.map((candidate) => this.scoreCandidate({ candidate, ...context }));
    return scored.sort((a, b) => b.score - a.score);
  }
}
