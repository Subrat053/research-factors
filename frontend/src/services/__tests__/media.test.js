import { describe, it, expect } from 'vitest';
import { normalizeMediaUrl, getStorageBaseUrl } from '../media.api.js';

describe('Media URL Normalizer', () => {
  it('returns empty string for null, undefined, or invalid inputs', () => {
    expect(normalizeMediaUrl(null)).toBe('');
    expect(normalizeMediaUrl(undefined)).toBe('');
    expect(normalizeMediaUrl('')).toBe('');
    expect(normalizeMediaUrl(123)).toBe('');
  });

  it('preserves external CDN URLs (Cloudinary, Cloudflare R2, AWS S3)', () => {
    const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/sample.webp';
    expect(normalizeMediaUrl(cloudinaryUrl)).toBe(cloudinaryUrl);

    const r2Url = 'https://media.researchfactors.com/media/test-asset.webp';
    expect(normalizeMediaUrl(r2Url)).toBe(r2Url);

    const s3Url = 'https://s3.amazonaws.com/my-bucket/media/image.webp';
    expect(normalizeMediaUrl(s3Url)).toBe(s3Url);
  });

  it('dynamically rewrites localhost:5005 and localhost:5000 URLs to active storageUrl', () => {
    const storageBase = getStorageBaseUrl();
    const legacyUrl1 = 'http://localhost:5005/uploads/media/15e9acf9-cc82-4a7e-8713-063b0b925c51.webp';
    expect(normalizeMediaUrl(legacyUrl1)).toBe(`${storageBase}/media/15e9acf9-cc82-4a7e-8713-063b0b925c51.webp`);

    const legacyUrl2 = 'http://localhost:5000/uploads/media/sample.webp';
    expect(normalizeMediaUrl(legacyUrl2)).toBe(`${storageBase}/media/sample.webp`);

    const loopbackUrl = 'http://127.0.0.1:8080/uploads/media/sample2.webp';
    expect(normalizeMediaUrl(loopbackUrl)).toBe(`${storageBase}/media/sample2.webp`);
  });

  it('prepends storageUrl to relative /uploads paths and bare media/ keys', () => {
    const storageBase = getStorageBaseUrl();
    expect(normalizeMediaUrl('/uploads/media/photo.webp')).toBe(`${storageBase}/media/photo.webp`);
    expect(normalizeMediaUrl('media/photo.webp')).toBe(`${storageBase}/media/photo.webp`);
  });

  it('qualifies public static asset paths with baseUrl', () => {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
    expect(normalizeMediaUrl('/images/hero.png')).toBe(`${base}/images/hero.png`);
  });
});
