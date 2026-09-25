import { SeoResolverService } from '../modules/seo/seo-resolver.service.js';
import { prisma } from '../config/db.js';

const CRAWLER_USER_AGENT_REGEX = /bot|crawler|spider|crawling|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Discordbot|Googlebot|bingbot|yandex|duckduckbot|applebot|baiduspider/i;

export async function crawlerPrerenderMiddleware(req, res, next) {
  // Only intercept GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const userAgent = req.headers['user-agent'] || '';
  const isCrawler = CRAWLER_USER_AGENT_REGEX.test(userAgent);

  // If request is explicitly asking for crawler HTML (e.g. ?crawler=1) or from a bot
  const forceCrawler = req.query.crawler === '1';
  if (!isCrawler && !forceCrawler) {
    return next();
  }

  const urlPath = req.path;

  try {
    let entityType = null;
    let entityId = null;

    // 1. Detect Article Routes: /research/:slug, /articles/:slug, or /:categorySlug/:slug
    const legacyArticleMatch = urlPath.match(/^\/(?:research|articles)\/([^/?#]+)$/i);
    if (legacyArticleMatch) {
      entityType = 'ARTICLE';
      entityId = legacyArticleMatch[1];
    }

    // 2. Detect Category Routes: /categories/:slug
    const categoryMatch = urlPath.match(/^\/categories\/([^/?#]+)$/i);
    if (categoryMatch) {
      entityType = 'CATEGORY';
      entityId = categoryMatch[1];
    }

    // 3. Detect 2-segment Category-Scoped Article Routes: /:categorySlug/:articleSlug
    if (!entityType) {
      const parts = urlPath.split('/').filter(Boolean);
      const reservedPrefixes = new Set([
        'api', 'admin', 'rf', 'categories', 'sitemaps', 'auth', 'bookmarks',
        'about', 'contact', 'sponsorship', 'privacy-policy', 'terms', 'cookie-policy',
        'editorial-guidelines',
        'login', 'register', 'forgot-password', 'reset-password', 'editor', 'search'
      ]);
      if (parts.length === 2 && !reservedPrefixes.has(parts[0].toLowerCase())) {
        entityType = 'ARTICLE';
        entityId = parts[1];
      }
    }

    // 3. Detect Static Routes
    const staticMap = {
      '/': 'home',
      '/research': 'research',
      '/about': 'about',
      '/contact': 'contact',
      '/sponsorship': 'sponsorship',
      '/privacy-policy': 'privacy-policy',
      '/terms': 'terms',
      '/cookie-policy': 'cookie-policy',
      '/editorial-guidelines': 'editorial-guidelines'
    };

    if (staticMap[urlPath]) {
      entityType = 'PAGE';
      entityId = staticMap[urlPath];
    }

    // If not a recognized public entity route, pass along
    if (!entityType || !entityId) {
      return next();
    }

    // Resolve SEO
    const resolved = await SeoResolverService.resolveSEO({
      entityType,
      entityId
    });

    if (!resolved) {
      return next();
    }

    // Fetch minimal plain text body if it's an article for search crawler indexing
    let bodySnippet = '';
    if (entityType === 'ARTICLE') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(entityId));
      const article = await prisma.article.findFirst({
        where: isUuid ? { OR: [{ id: entityId }, { slug: entityId }] } : { slug: entityId },
        select: { title: true, excerpt: true, subtitle: true, publishedAt: true }
      });
      if (article) {
        bodySnippet = `
          <header>
            <h1>${article.title}</h1>
            ${article.subtitle ? `<p>${article.subtitle}</p>` : ''}
            <time datetime="${new Date(article.publishedAt || Date.now()).toISOString()}">${new Date(article.publishedAt || Date.now()).toLocaleDateString()}</time>
          </header>
          <main>
            <p>${article.excerpt || ''}</p>
          </main>
        `;
      }
    }

    // Build crawler HTML response
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${resolved.title}</title>
  <meta name="description" content="${resolved.description}">
  <link rel="canonical" href="${resolved.canonicalUrl}">
  <meta name="robots" content="${resolved.robots}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${resolved.openGraph.type}">
  <meta property="og:url" content="${resolved.openGraph.url}">
  <meta property="og:title" content="${resolved.openGraph.title}">
  <meta property="og:description" content="${resolved.openGraph.description}">
  <meta property="og:image" content="${resolved.openGraph.image}">
  <meta property="og:site_name" content="${resolved.openGraph.siteName}">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="${resolved.twitter.card}">
  <meta name="twitter:title" content="${resolved.twitter.title}">
  <meta name="twitter:description" content="${resolved.twitter.description}">
  <meta name="twitter:image" content="${resolved.twitter.image}">

  <!-- Schema.org Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify(resolved.schema.jsonLd)}
  </script>
</head>
<body>
  <div id="root">
    ${bodySnippet}
  </div>
</body>
</html>`;

    res.header('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (error) {
    // If prerendering fails, continue to normal handling
    next();
  }
}
