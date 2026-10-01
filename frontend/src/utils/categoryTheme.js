import { normalizeMediaUrl } from '../services/media.api.js';

// 12 Curated editorial color palettes for dynamic category lighting & accents
const EDITORIAL_PALETTES = [
  { accent: '#2563EB', glow: 'rgba(37, 99, 235, 0.16)', lightBg: '#EFF6FF', border: '#BFDBFE' }, // Sapphire
  { accent: '#0D9488', glow: 'rgba(13, 148, 136, 0.16)', lightBg: '#F0FDFA', border: '#99F6E4' }, // Teal
  { accent: '#7C3AED', glow: 'rgba(124, 58, 237, 0.16)', lightBg: '#F5F3FF', border: '#DDD6FE' }, // Violet
  { accent: '#059669', glow: 'rgba(5, 150, 105, 0.16)', lightBg: '#ECFDF5', border: '#A7F3D0' }, // Emerald
  { accent: '#D97706', glow: 'rgba(217, 119, 6, 0.16)', lightBg: '#FFFBEB', border: '#FDE68A' }, // Amber
  { accent: '#E11D48', glow: 'rgba(225, 29, 72, 0.16)', lightBg: '#FFF1F2', border: '#FECDD3' }, // Rose
  { accent: '#0284C7', glow: 'rgba(2, 132, 199, 0.16)', lightBg: '#F0F9FF', border: '#BAE6FD' }, // Sky
  { accent: '#4F46E5', glow: 'rgba(79, 70, 229, 0.16)', lightBg: '#EEF2FF', border: '#C7D2FE' }, // Indigo
  { accent: '#EA580C', glow: 'rgba(234, 88, 12, 0.16)', lightBg: '#FFF7ED', border: '#FED7AA' }, // Coral
  { accent: '#0891B2', glow: 'rgba(8, 145, 178, 0.16)', lightBg: '#ECFEFF', border: '#A5F3FC' }, // Cyan
  { accent: '#9333EA', glow: 'rgba(147, 51, 234, 0.16)', lightBg: '#FAF5FF', border: '#E9D5FF' }, // Purple
  { accent: '#1E40AF', glow: 'rgba(30, 64, 175, 0.16)', lightBg: '#EFF6FF', border: '#DBEAFE' }  // Deep Blue
];

/**
 * Deterministically computes an editorial color theme for ANY category (present or future)
 * based on a stable string hash of its name or slug.
 */
export function getDynamicCategoryTheme(name = '', slug = '') {
  const seed = `${slug || ''}-${name || ''}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % EDITORIAL_PALETTES.length;
  return EDITORIAL_PALETTES[index];
}

/**
 * Dynamically generates a crisp editorial vector SVG emblem (data URI) for any category
 * based on its initials and deterministic palette.
 */
export function generateDynamicCategorySvg(name = 'Research', palette) {
  const cleanName = (name || '').trim();
  const initial = (cleanName[0] || 'R').toUpperCase();
  const secondary = cleanName.length > 1 ? cleanName[1].toUpperCase() : '';
  const glyph = secondary ? `${initial}${secondary}` : initial;
  const pal = palette || EDITORIAL_PALETTES[0];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${pal.accent}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="${pal.border}" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="18" fill="${pal.lightBg}" stroke="${pal.border}" stroke-width="2"/>
    <circle cx="32" cy="32" r="18" fill="url(#grad)"/>
    <text x="32" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="-0.5">${glyph}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Resolves the primary Flaticon / illustration art for ANY category dynamically:
 * 1. Admin uploaded image (`category.imageUrl`) takes top priority.
 * 2. Inherits parent category image (`category.parent?.imageUrl`) if child category.
 * 3. Semantic keyword dictionary for static assets.
 * 4. Dynamic vector SVG emblem generation based on name and theme palette.
 */
export function resolveCategoryArt(category = {}) {
  const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

  // 1. Direct custom upload
  if (category.imageUrl && typeof category.imageUrl === 'string' && category.imageUrl.trim() !== '') {
    return normalizeMediaUrl(category.imageUrl);
  }

  // 2. Inherited from parent category
  if (category.parent?.imageUrl && typeof category.parent.imageUrl === 'string' && category.parent.imageUrl.trim() !== '') {
    return normalizeMediaUrl(category.parent.imageUrl);
  }

  // 3. High-accuracy semantic keyword matching
  const parentKey = `${category.parent?.slug || ''} ${category.parent?.name || ''}`.toLowerCase();
  const key = `${category.slug || ''} ${category.name || ''} ${parentKey}`.toLowerCase();

  if (/tech|software|ai\b|compute|hardware|chip|cloud|data|cyber|digital|semiconductor|server|gaming|game|esport/.test(key)) {
    return `${baseUrl}/icons/categories/technology.png`;
  }

  if (/business|capital|startup|enterprise|management|firm|strategy|venture|company/.test(key)) {
    return `${baseUrl}/icons/categories/business.png`;
  }

  if (/policy|law|legal|govern|treaty|court|regulat|complian|ethic|rights|justice|democracy/.test(key)) {
    return `${baseUrl}/icons/categories/policy.png`;
  }

  if (/science|physics|chem|bio|space|astro|quantum|lab|nature|climate|energy|genom/.test(key)) {
    return `${baseUrl}/icons/categories/science.png`;
  }

  if (/econ|market|finance|bank|inflat|trade|fiscal|invest|stock|monet|crypto|commodity/.test(key)) {
    return `${baseUrl}/icons/categories/economics.png`;
  }

  if (/sport|cricket|athletic|football|tennis|fitness|exercise|olympic/.test(key)) {
    return `${baseUrl}/icons/categories/lifestyle.png`;
  }

  if (/life|health|well|diet|food|fit|sleep|travel|ergonomic|living|psych|fashion/.test(key)) {
    return `${baseUrl}/icons/categories/lifestyle.png`;
  }

  if (/auto|car|vehicle|motor|ev\b|battery|mobility|transport|aviation|aerospace/.test(key)) {
    return `${baseUrl}/icons/categories/automotive.png`;
  }

  // 4. Truly dynamic bespoke vector emblem generator
  const theme = getDynamicCategoryTheme(category.name || '', category.slug || '');
  return generateDynamicCategorySvg(category.name || 'Research', theme);
}
