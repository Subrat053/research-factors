# 08. SEO, PERFORMANCE & EDITORIAL UI

## 1. Editorial Aesthetic & Design Philosophy

Research Factors must evoke the prestige, rigor, and visual poise of premier digital publications (e.g. *The Atlantic*, *The New Yorker*, *Nature Publishing Group*, *Wired*). It intentionally avoids the generic SaaS template look.

### Core Typographic & Spacing Rules
- **Pure Native System UI Stack (Option A)**:
  - `font-sans`: `['-apple-system', 'BlinkMacSystemFont', 'system-ui', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif']`
  - `font-serif`: `['-apple-system', 'BlinkMacSystemFont', 'system-ui', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif']`
  - Complete zero-latency native font rendering (SF Pro on Apple, Segoe UI on Windows, Roboto on Android) with 0 external CDN requests. Full details in [15. Frontend Design & Typography System](./15-frontend-design-and-typography-system.md).
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
- **`/site.webmanifest`**: Progressive Web App manifest registering the theme color (`#1239A1`), standalone display mode, and icon resolutions.

---

## 7. Editorial Homepage & Header/Footer Architecture (17-Section Specification)

The homepage transforms Research Factors from a simple blog into an authoritative multi-topic research discovery platform:

1. **Header & Navigation (`Header.jsx`)**:
   - **Desktop Layout (`≥ lg`) (3-Part Balanced Structure)**:
     - **Left (`lg:flex-1 lg:justify-start`)**: Primary RF brand mark with tagline ("Research. Read. Share.").
     - **Middle (`shrink-0 justify-center`)**: Clean baseline-aligned, dead-centered navigation: `Home`, `All Research`, `Topics` (dropdown with categories), `Trending`, `For Brands` (`/sponsorship`), and `About`.
     - **Right (`lg:flex-1 lg:justify-end`)**: Normalized height (`h-10`) actions: compact search button with `[ / ]` shortcut key, "Become an Author" pill, and user profile avatar / authentication dropdown.
   - **Mobile Layout (`< lg`)**:
     - Top bar features strictly the brand logo (`h-8 w-auto`), compact search icon button (`w-9 h-9`), and hamburger button (`w-9 h-9`), eliminating all horizontal crowding and logo truncation on 375px screens.
     - **Slide-Over Navigation Drawer (Right Side)**: Persistent DOM with smooth 300ms ease-in-out open and close transitions (`translate-x-full` ↔ `translate-x-0`) and fading backdrop overlay (`opacity-0` ↔ `opacity-100`).
     - **Integrated Mobile User Account**: User avatar, profile details, quick links (Write Article, Studio/Dashboard, Settings, Bookmarks), and Sign Out / Join actions are housed cleanly inside the drawer with automatic body scroll lock.
2. **Hero Section (3-Column Flow)**:
   - **Left**: Badge ("Trusted Research. Informed Decisions." with `BadgeCheck` verification icon), primary serif headline ("Real Research. Smarter Choices."), descriptive copy, CTA buttons, and qualitative trust signals (`Expert Written`, `Data Backed`, `Unbiased` with uni-color icons).
   - **Center**: High-res editorial researcher photography (`/images/hero_researcher.jpg`) with floating glassmorphism cards ("In-depth Analysis", "Expert Insights").
   - **Right**: "Trending Today" ranked list (1-5) populated dynamically from `GET /api/v1/articles/trending`.
3. **Explore Topics ("Dive Into What Interests You")**:
   - Modern cards (`rounded-xl`, `border-paper-border`) with uni-color icons for Technology, Business, Lifestyle, Science, and Policy.
4. **Featured Research Hero Article**:
   - Prominent editorial research article block with badge and author credentials.
5. **Latest Research & Insights**:
   - Category filter pills (All, Technology, Business, Science, Economics, Policy, Lifestyle) and a 4-column responsive grid of standard article cards.
6. **Research Formats ("More Than Just Articles")**:
   - 4 structured cards: Deep Research, Comparisons, Structured Reviews, and Industry Insights.
7. **Brand Sponsorship Section ("Partner With a Platform That Delivers Real Audience Engagement")**:
   - Equal-height 3-column architecture (`items-stretch`):
     - **Left Column**: Audience engagement thesis, `Target` icon badge ("For Brands & Marketers"), and transparent commercial disclosure pledge.
     - **Middle Column**: 4 animated value pillars (Native Sponsored Articles, Targeted Audience, Measurable Impact, Flexible Collaboration) featuring alternating Framer Motion slide-in transitions (cards 1 & 3 from left, cards 2 & 4 from right; `1 -> 2 -> 3 -> 4`), anchored with a centered "Learn About Brand Sponsorships" primary CTA button.
     - **Right Column**: Featured Case Study card (`/images/sponsorship_case_study.jpg`) with `SPONSORED RESEARCH` badge and "View Sponsorship Options" secondary link.
   - Strict adherence to "Sponsorship" and "Sponsored Research" terminology.
8. **Editorial Standards & Research Creation Process ("From Question to Insight")**:
   - **Left**: Responsive editorial research methodology illustration (`/images/research_methodology.jpg`) with smooth viewport entrance (`opacity: 0, scale: 0.96` → `1, 1`).
   - **Right**: 4-stage process flow (`01 — Research` → `02 — Analyze` → `03 — Publish` → `04 — Discuss`) featuring Framer Motion staggered viewport scroll reveal (`staggerChildren: 0.08`, `duration: 0.65`, cubic bezier `[0.22, 1, 0.36, 1]`).
9. **Credibility & Reader Testimonials ("Built on Credibility, Trusted by Readers")**:
    - Qualitative impact signals: Monthly Readers, In-Depth Articles, Partner Brands, Reader Satisfaction.
    - Verified reader testimonial carousel card with pagination controls.
11. **Authors & Contributors Callout ("Knowledge Comes From People")**:
    - Become an Author, Author Directory, and Editorial Standards.
12. **Newsletter Banner ("Stay Ahead with Quality Research")**:
    - High-contrast dark navy card with input, subscribe button, and trust badge.
13. **Dual Final Call-to-Action**:
    - For Readers: "Have Something You Want to Understand Better?" → Explore Research Library.
    - For Businesses: "Have a Product, Service, or Story Worth Exploring?" → Partner via Sponsorship.
14. **Footer (`Footer.jsx`)**:
    - 5-column editorial footer with Explore, Research Domains, For Authors, For Brands, Company links, and legal notices.

---

## 8. Brand Sponsorship Layer & Commercial Transparency

- **Strict Terminology**: Generic advertising terms are strictly avoided. All commercial participation is framed around **Brand Sponsorships**, **Sponsored Research**, and **Brand Collaborations**.
- **Dedicated Portal (`/sponsorship`)**: Explains sponsorship products, transparent disclosure policies, and includes an interactive inquiry form.
- **Visual Separation**: Sponsored articles carry distinct badge tags and sponsor attribution, ensuring reader trust remains uncompromised.

---

## 9. Article Detail Page 2-Column Architecture & Related Articles Sidebar

The article reading experience is organized into an editorial 2-column layout:
- **Left Column (`lg:col-span-8`)**:
  - Breadcrumbs & Category Badge.
  - Primary H1 headline & Subtitle.
  - Author byline with verified checkmark and social `ShareBar`.
  - Full-width cover image figure.
  - Article prose blocks rendered via `BlockRenderer` (full width of the parent column).
  - Topic tags & Author biography card.
  - Peer discussion & `CommentSection`.
- **Right Column (`lg:col-span-4`)**:
  - Sticky sidebar container (`sticky top-24`).
  - Table of Contents (`TableOfContents`) when headings exist.
  - **"Related Articles" Section**:
    - Horizontal split cards containing strictly **cover image on the left** (`w-20 h-20 rounded-lg`) and **article heading on the right** (`font-serif font-bold text-sm sm:text-base`).
    - Dynamic data query pipeline: uses `article.related` array, enriched with a category fallback query if fewer than 4 items exist, deduplicating the active article.
- **Mobile Responsiveness**:
  - On viewports `< 1024px`, the layout smoothly collapses into a single column.
  - The Related Articles section dynamically appears directly after the author biography and before comments in a responsive 2-column grid (`sm:grid-cols-2`), eliminating horizontal scrolling and cramped sidebars.

---

## 10. Viewport Scroll Restoration (`ScrollToTop.jsx`)

- A lightweight React Router listener resets viewport coordinates to `(0, 0)` upon route change.
- Supports smooth anchor scrolling (`#topics`, `#sponsorship`, `#latest-research`) without jarring page jumps.

---

## 11. Topic Tags, Taxonomy Navigation & Live Production Preview

### 1. Dual-Format Topic Tags
- **Authoring Flexibility**: During manuscript creation/editing, authors can specify tags formatted either with hashtags and snake_case (e.g. `#semiconductor_architecture`) or plain natural language (e.g. `Semiconductor Architecture`).
- **Normalized Persistence**: The backend automatically normalizes both inputs into a canonical Title Case name (`Tag.name`) and kebab-case slug (`Tag.slug`).
- **Editorial Presentation**: On public article detail pages, tags render formatted as `#slug_with_underscores` (e.g. `#semiconductor_architecture`), matching scientific digital publishing conventions.
- **Dynamic Tag Discovery & Filtering**: Clicking any tag badge directs readers to `/research?tag=:slug`, activating an indexed database query and showing an active tag filter chip with a one-click dismiss `[X]` action.

### 2. Live Production Simulation Preview (`/research/preview/:id`)
- Authors and editors can inspect the exact real-world typography, block hierarchy, code blocks, images, and metadata of a manuscript draft without publishing.
- Features a prominent top sticky production simulation banner with draft status indicator and a quick "Return to Editor" action.
- Protected by centralized resource ownership and RBAC permissions (`requireArticleOwnership`).

### 3. Clickable Article Format Discovery & Filtering (`/research?type=:type`)
- Every article displays its editorial format pill (e.g. `RESEARCH`, `COMPARISON`, `REVIEW`, `ANALYSIS`, `GUIDE`, `OPINION`) beneath the headline and alongside reading time.
- Clicking the format pill routes readers to `/research?type=:type`.
- On the Research Archive & Search view (`/research`), an active **Format filter chip** is displayed with a dismiss `[X]` button, allowing instant one-click removal and synchronized dropdown filter state.

## 12. Homepage Impact Metrics & Swipeable Reader Testimonials

### 1. Viewport-Triggered Animated Stats (`StatCounter`)
- Impact metrics on the homepage (`1.2M+ Monthly Readers`, `500+ In-Depth Articles`, `200+ Partner Brands`, `95% Reader Satisfaction`) dynamically count up from 0 to their target values when scrolling into the viewport.
- Uses native `IntersectionObserver` with threshold detection and `requestAnimationFrame` cubic ease-out (`1 - (1 - progress)^3`) over ~1.8–2.2 seconds.
- Supports decimal interpolation (e.g. `0.0 -> 1.2M+`), integer counts (`500+`, `200+`), and percentage symbols (`95%`) with `tabular-nums` formatting to eliminate horizontal character jitter during animation.
- Structured as a balanced responsive grid (`grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5`) with uniform card curvature, flex alignment, and light/dark theme tokens.

### 2. Fixed-Height, Swipeable Reader Testimonials Carousel
- Stabilized container dimensions (`h-[340px] sm:h-[310px] flex flex-col justify-between overflow-hidden select-none`) eliminate height jumps and vertical page reflows between quotes of varying lengths.
- Smooth horizontal sliding track (`flex transition-transform duration-500 ease-out`) with `translateX(-${testimonialIndex * 100}%)`.
- Native touch swipe and mouse/pointer drag gesture detection (`onTouchStart`, `onTouchMove`, `onTouchEnd`, `onMouseDown`, `onMouseMove`, `onMouseUp`) with a 40px swipe threshold.
- Interactive pagination dot indicators with active pill expansion and previous/next arrow buttons with dark/light mode borders.

### 3. Infinite 3-Card Center-Focused Featured Research Carousel (`FeaturedArticlesCarousel.jsx`)
- Converts the horizontal split cards (`<ArticleCard variant="featured" />`) into an infinite circular carousel displaying 3 cards simultaneously on desktop.
- **Center-Dominant Layout**: Active card occupies the center with `scale: 1`, `zIndex: 30`, `opacity: 1`. Left and Right cards are calibrated (`scale: 0.86`, `zIndex: 10`, `opacity: 0.7`) translated to `x: '-78%'` and `x: '78%'` with an interactive overlay (`cursor: pointer`) to smoothly navigate directly into focus on click.
- **Card Proportions & Stage Geometry**:
  - Carousel stage is locked to responsive heights (`h-[520px] sm:h-[480px] md:h-[410px] lg:h-[430px]`) eliminating vertical shifts.
  - Card units maintain locked dimensions (`w-[92vw] max-w-[420px] h-[460px] sm:h-[440px] md:w-[680px] md:h-[370px] lg:w-[800px] lg:h-[390px]`).
  - `ArticleCard` (`variant="featured"`) adopts a balanced 50/50 two-column grid (`md:grid-cols-2`) with equal visual weight between cover media and editorial content, clamped headings (`line-clamp-2`), fallback gradient for missing covers, and bottom-pinned author byline.
- **Spring Physics**: Animated using Framer Motion with spring physics (`stiffness: 240`, `damping: 28`, `mass: 0.8`), simultaneously interpolating horizontal position (`x`), size/scale, and opacity so cards physically shrink and grow as they transition between slots.
- **Infinite Modulo Math & Duplication Protection**: Driven by modulo arithmetic `(activeIndex + position) % total`, with automatic virtual duplication when only 2 articles exist to prevent key collisions or empty slots.
### 4. Methodology Illustration & Staggered Scroll-Reveal Process
- **Visual Pillar (`/images/research_methodology.jpg`)**:
  - Encapsulates research metrics, system workflow, trust verification, and accredited authorship within a responsive editorial container (`w-full max-w-[500px] aspect-square rounded-2xl`).
  - Subtle entrance animation when scrolled into view (`opacity: 0, scale: 0.96` → `1, 1` with `duration: 0.7`, `ease: [0.22, 1, 0.36, 1]`).
- **Staggered 4-Step Reveal List**:
  - Powered by Framer Motion `variants` (`stepContainerVariants` and `stepItemVariants`).
  - Activates when 15% of the list enters the viewport (`viewport={{ once: true, amount: 0.15 }}`).
  - Synchronized sequence with a `0.08s` stagger interval (`staggerChildren: 0.08`), lifting cards by 18px (`y: 18` → `0`) with smooth fade-in (`opacity: 0` → `1`) over `0.65s` using custom editorial cubic bezier easing (`[0.22, 1, 0.36, 1]`).

### 5. Alternating Slide-In Brand Sponsorship Animations
- **Choreography**:
  - Cards 1 and 3 slide in from the left (`x: -48` → `0`).
  - Cards 2 and 4 slide in from the right (`x: 48` → `0`).
  - Sequenced one item at a time with a distinct deliberate time gap (`staggerChildren: 0.5`, `delayChildren: 0.15`) on the parent container when reaching the section (`viewport={{ once: true, amount: 0.2 }}`).
  - Culminates in a sequential fade-in of the primary CTA button (`cardButtonVariants`).
- **Physics**: Smooth fade and decelerating slide using `duration: 0.55` and custom cubic bezier `ease: [0.22, 1, 0.36, 1]`.
- **Layout Architecture**:
  - Grid row enforced with `items-stretch overflow-hidden` to eliminate horizontal scrollbars on mobile viewports.
  - Left column, middle column (with centered CTA button), and right case study card maintain synchronized top and bottom vertical baselines.

---

## 13. Admin Portal Dual Light & Dark Theme System

The administrative and editorial backoffice (`/admin/*`) features seamless dual theme support synchronized with the public magazine via [`ThemeContext.jsx`](file:///d:/Wizmonk/ResearchFactor/frontend/src/context/ThemeContext.jsx).

### 1. Centralized CSS Design Tokens (`index.css`)
To avoid inconsistent ad-hoc styling and maintain strict visual coherence, the backoffice utilizes standardized `@layer components` tokens:
- `.admin-card`: `bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors`
- `.admin-card-inner`: `bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 transition-colors`
- `.admin-toolbar`: Filter & search action bar with rounded padding, dual border, and shadow.
- `.admin-input`: `bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white`
- `.admin-table-container`: Dual-theme card wrapper for data tables.
- `.admin-table-th`: High-contrast column headers (`bg-slate-100/70 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400`).
- `.admin-table-row`: Responsive hover highlights (`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300`).
- `.admin-modal`: Centered dialog overlay surface (`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800`).

### 2. Comprehensive Backoffice Coverage (15 Pages)
All backoffice modules adhere to the dual-theme token standards:
1. `AdminDashboardPage`: Dual KPI stat cards, manuscript intake pipeline table, and editorial quick controls.
2. `ArticleManagementPage`: Article status tabs, filter toolbar, editorial table, and action menus.
3. `ArticleReviewQueuePage`: Peer-review triage table, rejection modal, revision feedback modal, and approval actions.
4. `CategoryManagementPage`: Category directory, creation form, and edit/delete drawers.
5. `TagManagementPage`: Tag inventory table, frequency metrics, and tag merge modal.
6. `MediaLibraryPage`: Media grid, upload dropzone, filter chips, and image metadata inspector drawer.
7. `UserManagementPage`: User table, role badges, status modal, role modification modal, and user creation form.
8. `AuthorManagementPage`: Accreditation queue cards, author directory, feedback modal, and bio editor modal.
9. `RolesPermissionsPage`: Role selection sidebar, granular permission matrix checkboxes, and custom role builder.
10. `ModerationQueuePage`: Comment moderation queue, moderation reason flags, and bulk action toolbar.
11. `ReportTriagePage`: User report cards, report resolution notes, and triage modal.
12. `AuditLogsPage`: Event audit trail, actor badges, IP telemetry, and timestamp formatting.
13. `SystemSettingsPage`: Configuration tabs (General, SEO, Policies, SMTP Test), setting inputs, and live server telemetry.
14. `ContactMessagesPage`: Master-detail Inquiries & Sponsorship Desk with dynamic RBAC (`contact.manage`), channel filters (All, Sponsorships, General Reader), status tabs (Unread, Pending, Resolved), structured campaign metadata cards (company, website, format, timeline), reader reply launcher, and audit logging.
15. `AdminProfilePage`: Personal details form, avatar upload preview, researcher accreditation byline, and password change form.

---

## 13. Future Roadmap

1. **Sponsorship Self-Serve Dashboard**: Enable sponsor brands to track anonymous content impressions, average reading time, and click-through metrics for their sponsored research.
2. **Dynamic Schema.org for Comparisons**: Add Product and Dataset Schema.org structured data to side-by-side comparison tables.
3. **Automated Newsletter Dispatch**: Connect the frontend newsletter subscription form to an email queue service for automated weekly digest delivery.
4. **Tag Aliasing & Synonym Auto-Redirects**: Extend tag management to support tag redirects when legacy tags are merged into new canonical topics.
5. **System-Synchronized Color Scheme Option**: Add an "Auto / System" theme option in addition to explicit Light and Dark toggles to follow `prefers-color-scheme`.


