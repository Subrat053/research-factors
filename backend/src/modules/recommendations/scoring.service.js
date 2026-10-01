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
   * Scores a single candidate article against visitor context
   */
  static scoreCandidate({
    candidate,
    currentArticle = null,
    taxonomyContext = {},
    interestProfileMap = new Map(),
    viewedArticleIds = new Set(),
    sessionArticleIds = new Set(),
    weights = {
      interest: 0.30,
      tag: 0.25,
      category: 0.20,
      complementarity: 0.15,
      recency: 0.10
    }
  }) {
    let score = 0;
    const reasons = [];
    let primaryTagReason = null;

    // 1. User Interest Affinity (Explicit or Implicit preference vector)
    const interestScore = interestProfileMap.get(candidate.categoryId) || 0;
    const normalizedInterest = Math.min(interestScore / 10, 1.0);
    score += normalizedInterest * (weights.interest ?? 0.30);
    let interestReason = null;
    if (normalizedInterest > 0.4) {
      interestReason = `Aligned with your interest in ${candidate.category?.name || 'this topic'}`;
    }

    // 2. Contextual Hierarchical Category Similarity (Dynamic across all categories)
    let categoryScore = 0;
    let categoryReason = null;

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
      // Tier 2B: Child subcategory (current article is parent, candidate is child subcategory)
      else if (
        candParentId === currentCatId ||
        childCategoryIds.includes(candCatId)
      ) {
        categoryScore = 0.70;
        categoryReason = `Specialized research in ${candCategory?.name}`;
      }
      // Tier 2C: Parent category (current article is child, candidate is its parent)
      else if (
        currentParentId &&
        candCatId === currentParentId
      ) {
        categoryScore = 0.65;
        categoryReason = `Broader domain context from ${candCategory?.name || currentCategory?.parent?.name || 'parent domain'}`;
      }

      score += categoryScore * (weights.category ?? 0.20);
    }

    // 3. Industry-Standard Tag Similarity (Jaccard + Overlap Coefficient)
    let tagScore = 0;
    if (currentArticle && currentArticle.tags && candidate.tags) {
      const currentTags = extractTagDescriptors(currentArticle.tags);
      const candidateTags = extractTagDescriptors(candidate.tags);

      const sharedNames = [];
      let commonIdCount = 0;

      for (const candTag of candidate.tags) {
        const cId = candTag.tagId || candTag.tag?.id || candTag.id;
        const cName = candTag.tag?.name || candTag.name;
        const cSlug = candTag.tag?.slug || candTag.slug || (cName ? String(cName).toLowerCase().replace(/[^a-z0-9]+/g, '-') : null);

        const isMatch = (cId && currentTags.ids.has(String(cId))) || (cSlug && currentTags.slugs.has(String(cSlug).toLowerCase()));
        if (isMatch) {
          commonIdCount++;
          if (cName && !sharedNames.includes(cName)) {
            sharedNames.push(cName);
          }
        }
      }

      const currentSize = currentTags.slugs.size || currentTags.ids.size;
      const candidateSize = candidateTags.slugs.size || candidateTags.ids.size;
      const matchCount = Math.max(sharedNames.length, commonIdCount);

      if (currentSize > 0 && candidateSize > 0 && matchCount > 0) {
        const unionSize = currentSize + candidateSize - matchCount;
        const jaccard = unionSize > 0 ? matchCount / unionSize : 0;
        const overlap = matchCount / Math.min(currentSize, candidateSize);

        // Blended metric: Jaccard for balanced set similarity + Overlap for subset containment
        tagScore = Math.min(1.0, 0.6 * jaccard + 0.4 * overlap);
        score += tagScore * (weights.tag ?? 0.25);

        if (sharedNames.length > 0) {
          primaryTagReason = `Shares topics: #${sharedNames.slice(0, 2).join(' #')}`;
        } else {
          primaryTagReason = 'Shares core research tags with what you are reading';
        }
      }
    }

    // 4. Cross-Format Complementarity (Journey Mapping)
    let compScore = 0;
    let compReason = null;
    if (currentArticle && currentArticle.type) {
      const currentType = currentArticle.type;
      const candidateType = candidate.type;

      if (currentType !== candidateType) {
        if (currentType === 'REVIEW' && candidateType === 'COMPARISON') {
          compScore = 1.0;
          compReason = 'Complements this review with a direct comparison';
        } else if (currentType === 'REVIEW' && candidateType === 'GUIDE') {
          compScore = 0.85;
          compReason = 'Actionable implementation guide for this review';
        } else if (currentType === 'RESEARCH' && candidateType === 'ANALYSIS') {
          compScore = 1.0;
          compReason = 'Critical editorial analysis of related research';
        } else if (currentType === 'RESEARCH' && candidateType === 'COMPARISON') {
          compScore = 0.8;
          compReason = 'Comparative benchmark evaluating this research';
        } else if (candidateType === 'RESEARCH') {
          compScore = 0.75;
          compReason = 'Underlying scientific & methodology research';
        } else {
          compScore = 0.6;
          compReason = `Alternate ${candidateType.toLowerCase()} perspective`;
        }
      } else {
        compScore = 0.3;
      }
      score += compScore * (weights.complementarity ?? 0.15);
    }

    // 5. Recency with Half-Life Time Decay (14-day half life)
    const pubDate = candidate.publishedAt ? new Date(candidate.publishedAt).getTime() : Date.now();
    const ageInDays = Math.max(0, (Date.now() - pubDate) / (1000 * 60 * 60 * 24));
    const recencyScore = Math.exp((-Math.LN2 / 14) * ageInDays);
    score += recencyScore * (weights.recency ?? 0.10);

    // 6. Popularity Boost (Logarithmic)
    const viewCount = candidate.viewCount || 0;
    const popularityBonus = Math.min(Math.log10(viewCount + 1) * 0.05, 0.15);
    score += popularityBonus;

    // 7. Penalties for Already Read / Session Repeat
    if (viewedArticleIds.has(candidate.id)) {
      score *= 0.25; // heavy penalty for already completed
    } else if (sessionArticleIds.has(candidate.id)) {
      score *= 0.6;
    }

    // Assemble Reason Hierarchy (most specific topical reason first)
    if (primaryTagReason) {
      reasons.push(primaryTagReason);
    }
    if (categoryReason && categoryScore >= 0.65) {
      reasons.push(categoryReason);
    }
    if (interestReason) {
      reasons.push(interestReason);
    }
    if (compReason) {
      reasons.push(compReason);
    }
    if (categoryReason && !reasons.includes(categoryReason)) {
      reasons.push(categoryReason);
    }

    // Fallback Reason if none generated
    if (reasons.length === 0) {
      reasons.push(
        candidate.isFeatured
          ? 'Featured editorial selection'
          : `Popular reading in ${candidate.category?.name || 'Research Factors'}`
      );
    }

    // Dynamic probability score mapped between 74% and 99%
    const normalizedScore = Math.max(0.1, Math.min(1.0, score * 1.35));
    const matchPercentage = Math.round(72 + normalizedScore * 27);

    return {
      candidate,
      score,
      matchPercentage,
      reason: reasons[0]
    };
  }

  /**
   * Scores an array of candidate articles and sorts descending by score
   */
  static scoreCandidates(candidates, context) {
    const scored = candidates.map((candidate) => this.scoreCandidate({ candidate, ...context }));
    return scored.sort((a, b) => b.score - a.score);
  }
}
