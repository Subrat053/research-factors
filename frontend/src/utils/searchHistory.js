const STORAGE_KEY = 'rf_recent_searches_v1';
const MAX_RECENT_SEARCHES = 5;

/**
 * Safely retrieves recent searches from localStorage.
 * Always returns an array of up to 5 items.
 */
export function getRecentSearches() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : [];
  } catch (err) {
    console.warn('Failed to read recent searches from localStorage', err);
    return [];
  }
}

/**
 * Adds or promotes a search query to the front of the recent searches list.
 * Deduplicates case-insensitively and caps at MAX_RECENT_SEARCHES (5).
 */
export function addRecentSearch(query, metadata = {}) {
  if (typeof window === 'undefined' || !query || !query.trim()) return;

  const trimmedQuery = query.trim();
  const existing = getRecentSearches();

  // Remove existing match (case-insensitive) to promote to front
  const filtered = existing.filter(
    (item) => item.query.toLowerCase() !== trimmedQuery.toLowerCase()
  );

  const newItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    query: trimmedQuery,
    type: metadata.type || null,
    categorySlug: metadata.categorySlug || null,
    timestamp: Date.now()
  };

  const updated = [newItem, ...filtered].slice(0, MAX_RECENT_SEARCHES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rf_recent_searches_updated', { detail: updated }));
  } catch (err) {
    console.warn('Failed to save recent search to localStorage', err);
  }

  return updated;
}

/**
 * Removes a specific query from recent searches.
 */
export function removeRecentSearch(query) {
  if (typeof window === 'undefined' || !query) return;

  const existing = getRecentSearches();
  const updated = existing.filter(
    (item) => item.query.toLowerCase() !== query.trim().toLowerCase()
  );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rf_recent_searches_updated', { detail: updated }));
  } catch (err) {
    console.warn('Failed to remove recent search from localStorage', err);
  }

  return updated;
}

/**
 * Clears all recent searches.
 */
export function clearRecentSearches() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('rf_recent_searches_updated', { detail: [] }));
  } catch (err) {
    console.warn('Failed to clear recent searches from localStorage', err);
  }

  return [];
}

/**
 * Extracts the most recent search type or category if present, to seed recommendation queries.
 */
export function getLastSearchContext() {
  const recent = getRecentSearches();
  const match = recent.find((item) => item.type || item.categorySlug);
  return {
    type: match?.type || null,
    categorySlug: match?.categorySlug || null,
    lastQuery: recent[0]?.query || null
  };
}
