import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  getLastSearchContext
} from '../searchHistory.js';

describe('Search History Utility (Zero-DB Latency)', () => {
  let mockStore = {};

  beforeEach(() => {
    mockStore = {};
    const mockLocalStorage = {
      getItem: (key) => mockStore[key] || null,
      setItem: (key, val) => {
        mockStore[key] = String(val);
      },
      removeItem: (key) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      }
    };

    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.stubGlobal('window', {
      localStorage: mockLocalStorage,
      dispatchEvent: vi.fn(),
      CustomEvent: class CustomEvent {
        constructor(name, detail) {
          this.name = name;
          this.detail = detail;
        }
      }
    });
  });

  it('should return an empty array initially', () => {
    expect(getRecentSearches()).toEqual([]);
  });

  it('should add a search item and store it in localStorage', () => {
    addRecentSearch('quantum computing', { type: 'RESEARCH' });
    const items = getRecentSearches();

    expect(items.length).toBe(1);
    expect(items[0].query).toBe('quantum computing');
    expect(items[0].type).toBe('RESEARCH');
  });

  it('should cap recent searches strictly at 5 items', () => {
    addRecentSearch('Item 1');
    addRecentSearch('Item 2');
    addRecentSearch('Item 3');
    addRecentSearch('Item 4');
    addRecentSearch('Item 5');
    addRecentSearch('Item 6');

    const items = getRecentSearches();
    expect(items.length).toBe(5);
    expect(items[0].query).toBe('Item 6');
    expect(items[4].query).toBe('Item 2');
  });

  it('should deduplicate case-insensitively and promote to front', () => {
    addRecentSearch('Semiconductors');
    addRecentSearch('Biotech');
    addRecentSearch('semiconductors'); // duplicate with different casing

    const items = getRecentSearches();
    expect(items.length).toBe(2);
    expect(items[0].query).toBe('semiconductors');
    expect(items[1].query).toBe('Biotech');
  });

  it('should remove a specific search item', () => {
    addRecentSearch('Physics');
    addRecentSearch('Mathematics');

    removeRecentSearch('Physics');
    const items = getRecentSearches();
    expect(items.length).toBe(1);
    expect(items[0].query).toBe('Mathematics');
  });

  it('should clear all recent searches', () => {
    addRecentSearch('Query 1');
    addRecentSearch('Query 2');

    clearRecentSearches();
    expect(getRecentSearches()).toEqual([]);
  });

  it('should extract the last searched context (type or category)', () => {
    addRecentSearch('First', { type: 'ANALYSIS' });
    addRecentSearch('Second', { categorySlug: 'technology' });

    const context = getLastSearchContext();
    expect(context.lastQuery).toBe('Second');
    expect(context.categorySlug).toBe('technology');
  });
});
