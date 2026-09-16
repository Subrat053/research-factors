import { prisma } from '../../config/db.js';
import { config } from '../../config/index.js';

export class SeoController {
  static async getSitemap(req, res, next) {
    try {
      const baseUrl = config.APP_URL || 'https://researchfactors.com';

      const [articles, categories] = await Promise.all([
        prisma.article.findMany({
          where: { status: 'PUBLISHED' },
          select: { slug: true, updatedAt: true, publishedAt: true },
          orderBy: { publishedAt: 'desc' }
        }),
        prisma.category.findMany({
          select: { slug: true, updatedAt: true }
        })
      ]);

      const staticUrls = [
        { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
        { loc: `${baseUrl}/research`, changefreq: 'daily', priority: '0.9' }
      ];

      const categoryUrls = categories.map(c => ({
        loc: `${baseUrl}/category/${c.slug}`,
        lastmod: c.updatedAt.toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8'
      }));

      const articleUrls = articles.map(a => ({
        loc: `${baseUrl}/articles/${a.slug}`,
        lastmod: (a.updatedAt || a.publishedAt || new Date()).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.7'
      }));

      const allUrls = [...staticUrls, ...categoryUrls, ...articleUrls];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.status(200).send(xml);
    } catch (error) {
      next(error);
    }
  }

  static getRobots(req, res) {
    const baseUrl = config.APP_URL || 'https://researchfactors.com';
    const robots = `# Research Factors Robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /editor/
Disallow: /api/
Disallow: /login
Disallow: /register

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.header('Content-Type', 'text/plain');
    res.status(200).send(robots);
  }
}
