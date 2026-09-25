/**
 * Dynamic Public Sharable Link & Clipboard Utilities
 * Research Factors — Production-Grade Publishing Platform
 */

/**
 * Generate a clean, canonical public sharable URL for an article entity.
 *
 * @param {Object} article - The article entity (from API / DTO)
 * @param {Object} [options] - Optional configurations
 * @param {boolean} [options.clean=true] - Strip transient query parameters and hash fragments
 * @param {string|null} [options.tracking=null] - Optional attribution tracking tag (e.g., 'share')
 * @returns {string} Fully resolved public share URL
 */
export function generateShareableUrl(article, options = {}) {
  const { clean = true, tracking = null } = options;

  // 1. If explicit absolute canonical URL is specified in article metadata, use it
  if (article?.canonicalUrl && /^https?:\/\//i.test(article.canonicalUrl)) {
    try {
      const urlObj = new URL(article.canonicalUrl);
      if (clean) {
        urlObj.hash = '';
      }
      if (tracking) {
        urlObj.searchParams.set('ref', tracking);
      }
      return urlObj.toString();
    } catch {
      return article.canonicalUrl;
    }
  }

  // 2. Resolve origin and base path in browser or default SSR
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://researchfactors.com';

  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  // 3. Resolve category and article slug
  const categorySlug = article?.category?.slug || article?.categorySlug || 'research';
  const slug = article?.slug || (typeof window !== 'undefined' ? window.location?.pathname.split('/').pop() : '');

  let resolvedPath = `${cleanBase}${categorySlug}/${slug}`;
  // Normalize consecutive slashes
  resolvedPath = resolvedPath.replace(/\/+/g, '/');

  try {
    const fullUrl = new URL(resolvedPath, origin);
    if (clean) {
      fullUrl.hash = '';
    }
    if (tracking) {
      fullUrl.searchParams.set('ref', tracking);
    }
    return fullUrl.toString();
  } catch {
    return `${origin}${resolvedPath}`;
  }
}

/**
 * Resolves the client-side router path for an article entity.
 *
 * @param {Object} article - The article entity
 * @returns {string} Route path in format `/:categorySlug/:articleSlug`
 */
export function getArticleUrl(article) {
  if (!article) return '/research';
  const categorySlug = article.category?.slug || article.categorySlug || 'research';
  const slug = article.slug || '';
  return `/${categorySlug}/${slug}`;
}

/**
 * Bulletproof 2-tier clipboard copy engine.
 * Supports modern Clipboard API with synchronous document.execCommand fallback.
 *
 * @param {string} text - The text string to copy
 * @returns {Promise<boolean>} Resolves true if copied successfully, false otherwise
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  // Tier 1: Modern async Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API writeText failed, attempting execCommand fallback:', err);
    }
  }

  // Tier 2: Synchronous document.execCommand fallback for restricted iframe / non-HTTPS contexts
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      textarea.setAttribute('readonly', '');
      textarea.setAttribute('aria-hidden', 'true');
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999); // Mobile compatibility

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return Boolean(successful);
    } catch (fallbackErr) {
      console.error('execCommand copy fallback failed:', fallbackErr);
      return false;
    }
  }

  return false;
}

/**
 * Generate formatted social and messaging channel share links.
 *
 * @param {Object} params
 * @param {string} params.title - Publication title
 * @param {string} params.url - Sharable publication URL
 * @param {string} [params.excerpt] - Optional publication excerpt / subtitle
 * @returns {Object} Pre-encoded URLs and citation snippet
 */
export function getShareLinks({ title = '', url = '', excerpt = '' }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`"${title}" on Research Factors`);
  const encodedSummary = encodeURIComponent(excerpt ? `${title} — ${excerpt}` : title);

  return {
    url,
    title,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    email: `mailto:?subject=${encodeURIComponent(`Research Publication: ${title}`)}&body=${encodeURIComponent(`I thought you might find this research interesting:\n\n${title}\n\nRead the full publication at:\n${url}`)}`,
    markdownCitation: `[${title}](${url})`
  };
}
