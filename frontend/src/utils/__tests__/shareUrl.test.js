import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateShareableUrl, copyToClipboard, getShareLinks } from '../shareUrl.js';

describe('shareUrl Utility', () => {
  describe('generateShareableUrl', () => {
    it('uses canonicalUrl if absolute URL is provided', () => {
      const article = {
        slug: 'quantum-computing-breakthrough',
        canonicalUrl: 'https://researchfactors.com/articles/quantum-computing-breakthrough'
      };
      const url = generateShareableUrl(article);
      expect(url).toBe('https://researchfactors.com/articles/quantum-computing-breakthrough');
    });

    it('generates URL from slug and current origin when no canonicalUrl is present', () => {
      const article = {
        slug: 'ai-governance-framework'
      };
      const url = generateShareableUrl(article);
      expect(url).toContain('/research/ai-governance-framework');
    });

    it('generates category-scoped URL when article has category', () => {
      const article = {
        slug: 'quantum-computing-breakthrough',
        category: { slug: 'quantum-physics' }
      };
      const url = generateShareableUrl(article);
      expect(url).toContain('/quantum-physics/quantum-computing-breakthrough');
    });

    it('appends tracking param when tracking option is provided', () => {
      const article = {
        slug: 'neuroscience-sleep-cycles',
        canonicalUrl: 'https://researchfactors.com/research/neuroscience-sleep-cycles'
      };
      const url = generateShareableUrl(article, { tracking: 'share' });
      expect(url).toContain('ref=share');
    });
  });

  describe('getShareLinks', () => {
    it('generates valid social share links with proper URI encoding', () => {
      const links = getShareLinks({
        title: 'Future of Clean Fusion',
        url: 'https://researchfactors.com/research/future-of-clean-fusion'
      });

      expect(links.twitter).toContain('twitter.com/intent/tweet');
      expect(links.twitter).toContain(encodeURIComponent('https://researchfactors.com/research/future-of-clean-fusion'));
      expect(links.linkedin).toContain('linkedin.com/sharing/share-offsite');
      expect(links.whatsapp).toContain('api.whatsapp.com/send');
      expect(links.reddit).toContain('reddit.com/submit');
      expect(links.email).toContain('mailto:?subject=');
      expect(links.markdownCitation).toBe('[Future of Clean Fusion](https://researchfactors.com/research/future-of-clean-fusion)');
    });
  });

  describe('copyToClipboard', () => {
    const originalClipboard = navigator.clipboard;

    afterEach(() => {
      Object.assign(navigator, { clipboard: originalClipboard });
      vi.restoreAllMocks();
    });

    it('returns false for empty text', async () => {
      const result = await copyToClipboard('');
      expect(result).toBe(false);
    });

    it('uses navigator.clipboard.writeText when available', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });

      const result = await copyToClipboard('https://example.com');
      expect(writeTextMock).toHaveBeenCalledWith('https://example.com');
      expect(result).toBe(true);
    });
  });
});
