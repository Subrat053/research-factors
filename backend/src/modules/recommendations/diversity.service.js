export class DiversityService {
  /**
   * Applies diversity rules across category and article types
   * @param {Array} scoredItems - array of { candidate, score, matchPercentage, reason }
   * @param {Object} options
   * @param {number} options.maxPerCategory - maximum articles allowed from a single category (default: 2)
   * @param {number} options.maxPerType - maximum articles allowed of the same article type (default: 2)
   * @param {number} options.limit - maximum total items to return
   */
  static applyDiversity(scoredItems, { maxPerCategory = 2, maxPerType = 2, limit = 8 } = {}) {
    const categoryCounts = new Map();
    const typeCounts = new Map();
    const selected = [];
    const deferred = [];

    for (const item of scoredItems) {
      const catId = item.candidate.categoryId;
      const type = item.candidate.type;

      const currentCatCount = categoryCounts.get(catId) || 0;
      const currentTypeCount = typeCounts.get(type) || 0;

      if (currentCatCount < maxPerCategory && currentTypeCount < maxPerType) {
        selected.push(item);
        categoryCounts.set(catId, currentCatCount + 1);
        typeCounts.set(type, currentTypeCount + 1);
      } else {
        deferred.push(item);
      }

      if (selected.length >= limit) {
        break;
      }
    }

    // If limits were too strict to meet the limit, backfill with top deferred items
    if (selected.length < limit && deferred.length > 0) {
      for (const item of deferred) {
        if (!selected.some((s) => s.candidate.id === item.candidate.id)) {
          selected.push(item);
        }
        if (selected.length >= limit) {
          break;
        }
      }
    }

    return selected;
  }
}
