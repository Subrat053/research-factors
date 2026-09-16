# 08. SEO, PERFORMANCE & EDITORIAL UI

## 1. Editorial Aesthetic & Design Philosophy

Research Factors must evoke the prestige, rigor, and visual poise of premier digital publications (e.g. *The Atlantic*, *The New Yorker*, *Nature Publishing Group*, *Wired*). It intentionally avoids the generic SaaS template look.

### Core Typographic & Spacing Rules
- **Headline Font**: Elegant serif typography (e.g. *Merriweather* / *Newsreader* from Google Fonts) designed for high editorial authority.
- **Body & Interface Font**: Ultra-clean, legible sans-serif (*Inter* / *Plus Jakarta Sans*) with tailored letter-spacing.
- **Optimal Line Measure**: Reading container is constrained to `68ch` to `72ch` (approx. 720px) to prevent eye strain.
- **Line Height**: Generous line-height (`leading-relaxed` to `leading-loose`, 1.75) for effortless long-form research consumption.
- **Disciplined Editorial Color System**:
  - **White (`#FFFFFF` / Warm Paper `#F8FAFC` / Neutral `#FAFAF9`)**: Clean, spacious editorial background, pristine readability, card surfaces.
  - **Black (`#09090B` / Deep Ink `#0F172A` / Neutral `#18181B`)**: Crisp typography, high-contrast serif headlines, borders, and dark mode background surfaces.
  - **Blue (`#1E40AF` / Royal Blue `#1D4ED8` / Deep Academic Navy `#0F2B5C`)**: Primary brand identity, interactive links, primary CTA buttons, active navigation indicators, category badges, reading progress bar.
  - **Red (`#DC2626` / `#B91C1C` / Crimson `#991B1B` - USED SPARINGLY)**: Reserved exclusively for subtle urgency accents, critical alerts, editorial rejection notices, destructive actions (delete draft), and live/breaking badges. Kept strictly under 5% visual weight across the interface.

---

## 2. Dynamic SEO Architecture for React SPA

Because the frontend is a React SPA (built with Vite), search engine bots must receive rich, crawlable HTML with complete meta tags.

### Hybrid SEO Rendering Strategy
1. **Dynamic Open Graph & Meta Injection Middleware**:
   The Express backend serves as a reverse proxy for public article pages when accessed by social scrapers (Facebook, Twitter/X, WhatsApp, LinkedIn, Slack):
   - User-Agent detection identifies social crawler bots.
   - When a crawler requests `/research/:category/:slug`, Express intercepts the request, queries Prisma for article metadata, and injects `<title>`, `<meta name="description">`, `<meta property="og:image">`, and `<script type="application/ld+json">` directly into the `index.html` template before returning the response.
2. **Client Head Management**:
   The React SPA utilizes `react-helmet-async` to dynamically update document title, canonical link, and meta tags during in-app client-side navigation.

---

## 3. Schema.org JSON-LD Structured Data

Every published article embeds structured metadata conforming to Schema.org standards:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Empirical Performance Analysis of Hybrid Quantum Processors",
  "description": "A comprehensive benchmark examining thermal dissipation and gate fidelity in commercial quantum computing.",
  "image": [
    "https://cdn.researchfactors.com/media/quantum-setup.webp"
  ],
  "datePublished": "2026-09-01T08:00:00.000Z",
  "dateModified": "2026-09-05T12:30:00.000Z",
  "author": {
    "@type": "Person",
    "name": "Dr. Eleanor Vance",
    "url": "https://researchfactors.com/authors/eleanor-vance"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Research Factors",
    "logo": {
      "@type": "ImageObject",
      "url": "https://researchfactors.com/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://researchfactors.com/research/technology/empirical-quantum-processors"
  }
}
```

---

## 4. URL Structure & Slug Redirect Engine

### URL Hierarchy
- Homepage: `/`
- Research Archive: `/research`
- Category Hub: `/research/:categorySlug`
- Public Article: `/research/:categorySlug/:articleSlug`
- Author Profile: `/authors/:authorId`
- Search Engine: `/search?q=quantum`

### Automatic 301 Permanent Redirection
When an article slug is updated (e.g. from `quantum-cpu-v1` to `empirical-quantum-processors`):
1. The old slug is saved in `ArticleSlugHistory`.
2. When a visitor hits the old URL, the backend detects the historical slug in `ArticleSlugHistory`.
3. The server immediately returns an **HTTP 301 Permanent Redirect** to the new canonical URL.
4. Backlinks, search engine equity, and social shares are 100% preserved.

---

## 5. Dynamic Sitemap & Robots.txt

### `robots.txt`
```txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /author/
Disallow: /account/
Disallow: /api/

Sitemap: https://researchfactors.com/sitemap.xml
```

### `sitemap.xml`
Generated dynamically by the backend:
- Includes all `PUBLISHED` articles with `<lastmod>` timestamps.
- Includes active category landing pages.
- Includes public author bio pages.
- Never includes drafts, pending reviews, or private user routes.
- Supports sitemap index splitting (`sitemap-articles-1.xml`, `sitemap-categories.xml`) if the catalog exceeds 10,000 items.

---

## 6. Brand Identity, Logos & Multi-Platform Favicon Specification

All public assets are hosted under the frontend `public/` directory with clean alpha transparency and high DPI support:

### Logo Suite
- **`/logo.png`**: Master full-color horizontal brand mark (RF shield emblem + high-contrast serif wordmark). Tightly cropped with anti-aliased alpha transparency for seamless integration across light and paper backgrounds.
- **`/logo-icon.png`**: Standalone RF shield emblem badge (512x512) with transparent outer perimeter and high-contrast white "RF" monogram.
- **`/logo-white.png`**: Inverted horizontal brand mark optimized for dark-mode interfaces and deep navy backgrounds.

### Multi-Screen Favicon Suite & Web App Manifest
- **`/favicon.ico`**: Multi-resolution legacy ICO container containing 16x16, 32x32, and 48x48 bitmaps for desktop browsers.
- **`/favicon.svg`**: Modern scalable vector container with crisp rendering across all display scales.
- **`/favicon-16x16.png`**: 16x16 standard browser tab icon.
- **`/favicon-32x32.png`**: 32x32 retina browser tab icon.
- **`/favicon-48x48.png`**: 48x48 desktop shortcut icon.
- **`/apple-touch-icon.png`**: 180x180 high-DPI icon for iOS Home Screen bookmarks.
- **`/android-chrome-192x192.png`**: 192x192 icon for Android devices and PWA task switchers.
- **`/android-chrome-512x512.png`**: 512x512 icon for splash screens and PWA install prompts.
- **`/site.webmanifest`**: Progressive Web App manifest registering the theme color (`#1239A1`), standalone display mode, and icon resolutions.
