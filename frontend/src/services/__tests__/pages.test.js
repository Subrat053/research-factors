import { describe, it, expect, vi, beforeEach } from 'vitest';
import pagesContent from '../../data/pagesContent.json';
import { pagesApi } from '../pages.api.js';
import { apiClient } from '../api.client.js';

describe('Public Legal & Company Pages Content & API Suite', () => {
  it('should verify pagesContent.json contains all 4 required informational pages', () => {
    expect(pagesContent.about).toBeDefined();
    expect(pagesContent.terms).toBeDefined();
    expect(pagesContent['privacy-policy']).toBeDefined();
    expect(pagesContent['cookie-policy']).toBeDefined();
  });

  it('should verify About page structure matches Requirements/pages.md', () => {
    const about = pagesContent.about;
    expect(about.title).toBe('About Research Factors');
    expect(about.subtitle).toBe('Know More. Choose Better.');
    expect(about.sections.length).toBeGreaterThanOrEqual(10);
    expect(about.sections.some((s) => s.id === 'what-we-do')).toBe(true);
    expect(about.sections.some((s) => s.id === 'our-approach')).toBe(true);
    expect(about.sections.some((s) => s.id === 'our-vision')).toBe(true);
  });

  it('should verify Terms & Conditions contains all 18 numbered sections', () => {
    const terms = pagesContent.terms;
    expect(terms.title).toBe('Terms & Conditions');
    expect(terms.sections.length).toBe(18);
    expect(terms.sections[0].heading).toBe('About Research Factors');
    expect(terms.sections[17].heading).toBe('Contact Us');
  });

  it('should verify Privacy Policy contains all 15 numbered sections', () => {
    const privacy = pagesContent['privacy-policy'];
    expect(privacy.title).toBe('Privacy Policy');
    expect(privacy.sections.length).toBe(15);
    expect(privacy.sections[0].heading).toBe('Information We May Collect');
    expect(privacy.sections[14].heading).toBe('Contact Us');
  });

  it('should verify Cookie Policy contains all 7 numbered sections', () => {
    const cookie = pagesContent['cookie-policy'];
    expect(cookie.title).toBe('Cookie Policy');
    expect(cookie.sections.length).toBe(7);
    expect(cookie.sections[0].heading).toBe('What Are Cookies?');
    expect(cookie.sections[6].heading).toBe('Contact Us');
  });

  describe('pagesApi Fallback Resolution', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should serve local JSON fallback when backend route returns 404 or network error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce({
        status: 404,
        code: 'NETWORK_ERROR',
        message: 'Request failed with status code 404'
      });

      const res = await pagesApi.getPageContent('terms');
      expect(res.success).toBe(true);
      expect(res._isFallback).toBe(true);
      expect(res.data.title).toBe('Terms & Conditions');
      expect(res.data.sections.length).toBe(18);
    });

    it('should serve live dynamic backend page content when backend route exists', async () => {
      const dynamicPage = {
        success: true,
        data: {
          slug: 'about',
          title: 'Custom Admin Managed About Page',
          sections: []
        }
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(dynamicPage);

      const res = await pagesApi.getPageContent('about');
      expect(res.data.title).toBe('Custom Admin Managed About Page');
      expect(res._isFallback).toBeUndefined();
    });
  });
});
