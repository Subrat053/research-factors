import { prisma } from '../../config/db.js';
import { config } from '../../config/index.js';
import { SeoGeneratorService } from './seo-generator.service.js';
import { SeoResolverService } from './seo-resolver.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export class SeoController {
  /**
   * Sitemap Index: /sitemap.xml
   */
  static async getSitemapIndex(req, res, next) {
    try {
      const baseUrl = config.APP_URL || 'https://researchfactors.com';
      const today = new Date().toISOString().split('T')[0];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemaps/articles.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/categories.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

      res.header('Content-Type', 'application/xml');
      res.status(200).send(xml);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Articles Sitemap: /sitemaps/articles.xml
   * Strictly includes PUBLISHED articles that are not noindexed
   */
  static async getArticlesSitemap(req, res, next) {
    try {
      const baseUrl = config.APP_URL || 'https://researchfactors.com';

      // 1. Fetch published articles
      const articles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          category: { isActive: true },
          author: { status: 'ACTIVE' }
        },
        select: {
          id: true,
          slug: true,
          category: { select: { slug: true } },
          updatedAt: true,
          publishedAt: true,
          isFeatured: true
        },
        orderBy: { publishedAt: 'desc' }
      });

      // 2. Fetch noindex overrides
      const noIndexRecords = await prisma.seoMetadata.findMany({
        where: {
          entityType: 'ARTICLE',
          isNoIndex: true
        },
        select: { entityId: true }
      });
      const noIndexSet = new Set(noIndexRecords.map(r => r.entityId));

      const validArticles = articles.filter(a => !noIndexSet.has(a.id) && !noIndexSet.has(a.slug));

      const urls = validArticles.map(a => {
        const lastmod = (a.updatedAt || a.publishedAt || new Date()).toISOString().split('T')[0];
        const priority = a.isFeatured ? '0.9' : '0.8';
        const catSlug = a.category?.slug || 'research';
        return `  <url>
    <loc>${baseUrl}/${catSlug}/${a.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
      });

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.status(200).send(xml);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Categories Sitemap: /sitemaps/categories.xml
   * Strictly includes active categories that have >= 1 published article
   */
  static async getCategoriesSitemap(req, res, next) {
    try {
      const baseUrl = config.APP_URL || 'https://researchfactors.com';

      const categories = await prisma.category.findMany({
        where: {
          isActive: true,
          articles: {
            some: { status: 'PUBLISHED' }
          }
        },
        select: {
          id: true,
          slug: true,
          updatedAt: true
        }
      });

      // Exclude noindexed categories
      const noIndexRecords = await prisma.seoMetadata.findMany({
        where: {
          entityType: 'CATEGORY',
          isNoIndex: true
        },
        select: { entityId: true }
      });
      const noIndexSet = new Set(noIndexRecords.map(r => r.entityId));

      const validCategories = categories.filter(c => !noIndexSet.has(c.id) && !noIndexSet.has(c.slug));

      const urls = validCategories.map(c => {
        const lastmod = c.updatedAt.toISOString().split('T')[0];
        return `  <url>
    <loc>${baseUrl}/categories/${c.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.status(200).send(xml);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Static Pages Sitemap: /sitemaps/pages.xml
   */
  static async getPagesSitemap(req, res, next) {
    try {
      const baseUrl = config.APP_URL || 'https://researchfactors.com';
      const today = new Date().toISOString().split('T')[0];

      const pages = [
        { path: '/', priority: '1.0', changefreq: 'daily' },
        { path: '/research', priority: '0.9', changefreq: 'daily' },
        { path: '/about', priority: '0.7', changefreq: 'monthly' },
        { path: '/contact', priority: '0.6', changefreq: 'monthly' },
        { path: '/sponsorship', priority: '0.7', changefreq: 'monthly' },
        { path: '/privacy-policy', priority: '0.5', changefreq: 'yearly' },
        { path: '/terms', priority: '0.5', changefreq: 'yearly' },
        { path: '/cookie-policy', priority: '0.5', changefreq: 'yearly' },
        { path: '/editorial-guidelines', priority: '0.6', changefreq: 'monthly' }
      ];

      const urls = pages.map(p => `  <url>
    <loc>${baseUrl}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.status(200).send(xml);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Robots.txt: /robots.txt
   */
  static getRobots(req, res) {
    const baseUrl = config.APP_URL || 'https://researchfactors.com';
    const robots = `# Research Factors Search Engine Directives
User-agent: *
Allow: /
Allow: /research/
Allow: /categories/
Allow: /about
Allow: /contact
Allow: /sponsorship
Allow: /privacy-policy
Allow: /terms
Allow: /cookie-policy
Allow: /editorial-guidelines
Disallow: /admin/
Disallow: /editor/
Disallow: /api/
Disallow: /bookmarks
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password

# Canonical Sitemap Indexes
Sitemap: ${baseUrl}/sitemap.xml
`;
    res.header('Content-Type', 'text/plain');
    res.status(200).send(robots);
  }

  /**
   * Public SEO Resolution Endpoint: GET /api/v1/seo/resolve?type=:type&id=:id
   */
  static async resolvePublicSeo(req, res, next) {
    try {
      const { type = 'PAGE', id = 'home' } = req.query;
      const resolved = await SeoResolverService.resolveSEO({
        entityType: type,
        entityId: id
      });

      res.json({
        success: true,
        data: resolved
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Endpoint: PUT /api/v1/admin/seo/:entityType/:entityId
   * Updates custom overrides and crawl directives for an entity
   */
  static async updateSeoMetadata(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      const data = req.body;
      const normalizedType = String(entityType).toUpperCase();

      const existing = await prisma.seoMetadata.findUnique({
        where: {
          entityType_entityId: {
            entityType: normalizedType,
            entityId: String(entityId)
          }
        }
      });

      const updatePayload = {
        customTitle: data.customTitle !== undefined ? (data.customTitle ? data.customTitle.trim() : null) : undefined,
        customDescription: data.customDescription !== undefined ? (data.customDescription ? data.customDescription.trim() : null) : undefined,
        customCanonicalUrl: data.customCanonicalUrl !== undefined ? (data.customCanonicalUrl ? data.customCanonicalUrl.trim() : null) : undefined,
        customOgTitle: data.customOgTitle !== undefined ? (data.customOgTitle ? data.customOgTitle.trim() : null) : undefined,
        customOgDescription: data.customOgDescription !== undefined ? (data.customOgDescription ? data.customOgDescription.trim() : null) : undefined,
        customOgImage: data.customOgImage !== undefined ? (data.customOgImage ? data.customOgImage.trim() : null) : undefined,
        customTwitterCard: data.customTwitterCard || undefined,
        customTwitterTitle: data.customTwitterTitle !== undefined ? (data.customTwitterTitle ? data.customTwitterTitle.trim() : null) : undefined,
        customTwitterDescription: data.customTwitterDescription !== undefined ? (data.customTwitterDescription ? data.customTwitterDescription.trim() : null) : undefined,
        customTwitterImage: data.customTwitterImage !== undefined ? (data.customTwitterImage ? data.customTwitterImage.trim() : null) : undefined,
        isNoIndex: data.isNoIndex !== undefined ? Boolean(data.isNoIndex) : undefined,
        isNoFollow: data.isNoFollow !== undefined ? Boolean(data.isNoFollow) : undefined,
        focusKeyword: data.focusKeyword !== undefined ? (data.focusKeyword ? data.focusKeyword.trim() : null) : undefined,
        secondaryKeywords: data.secondaryKeywords !== undefined ? data.secondaryKeywords : undefined,
        schemaType: data.schemaType !== undefined ? data.schemaType : undefined,
        customSchema: data.customSchema !== undefined ? data.customSchema : undefined
      };

      // Filter out undefined
      const cleanData = {};
      for (const [key, val] of Object.entries(updatePayload)) {
        if (val !== undefined) cleanData[key] = val;
      }

      let result;
      if (existing) {
        result = await prisma.seoMetadata.update({
          where: { id: existing.id },
          data: cleanData
        });
      } else {
        // Generate baseline values first if creating
        let generated = {};
        if (normalizedType === 'ARTICLE') {
          const article = await prisma.article.findFirst({
            where: { OR: [{ id: entityId }, { slug: entityId }] },
            include: { category: true, tags: { include: { tag: true } }, blocks: true }
          });
          if (article) {
            generated = SeoGeneratorService.generateArticleSeo(article, article.category, article.tags);
          }
        } else if (normalizedType === 'CATEGORY') {
          const category = await prisma.category.findFirst({
            where: { OR: [{ id: entityId }, { slug: entityId }] }
          });
          if (category) {
            generated = SeoGeneratorService.generateCategorySeo(category);
          }
        } else if (normalizedType === 'PAGE') {
          generated = SeoGeneratorService.getStaticPageDefaults(entityId);
        }

        result = await prisma.seoMetadata.create({
          data: {
            entityType: normalizedType,
            entityId: String(entityId),
            ...generated,
            ...cleanData
          }
        });
      }

      // Also synchronize backward-compatible columns on Article or Category
      if (normalizedType === 'ARTICLE') {
        await prisma.article.updateMany({
          where: { OR: [{ id: entityId }, { slug: entityId }] },
          data: {
            seoTitle: cleanData.customTitle,
            seoDescription: cleanData.customDescription,
            canonicalUrl: cleanData.customCanonicalUrl
          }
        }).catch(() => {});
      } else if (normalizedType === 'CATEGORY') {
        await prisma.category.updateMany({
          where: { OR: [{ id: entityId }, { slug: entityId }] },
          data: {
            seoTitle: cleanData.customTitle,
            seoDescription: cleanData.customDescription,
            canonicalUrl: cleanData.customCanonicalUrl
          }
        }).catch(() => {});
      }

      const resolved = await SeoResolverService.resolveSEO({
        entityType: normalizedType,
        entityId: String(entityId)
      });

      res.json({
        success: true,
        message: 'SEO metadata successfully saved',
        data: resolved
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Endpoint: POST /api/v1/admin/seo/regenerate
   * Re-analyzes entity content and updates generated values WITHOUT wiping custom overrides
   */
  static async regenerateSeo(req, res, next) {
    try {
      const { entityType, entityId } = req.body;
      if (!entityType || !entityId) {
        throw new AppError('entityType and entityId are required', 400);
      }
      const normalizedType = String(entityType).toUpperCase();

      let generated = {};
      if (normalizedType === 'ARTICLE') {
        const article = await prisma.article.findFirst({
          where: { OR: [{ id: entityId }, { slug: entityId }] },
          include: { category: true, tags: { include: { tag: true } }, blocks: true }
        });
        if (!article) throw new AppError('Article not found', 404);
        generated = SeoGeneratorService.generateArticleSeo(article, article.category, article.tags);
      } else if (normalizedType === 'CATEGORY') {
        const category = await prisma.category.findFirst({
          where: { OR: [{ id: entityId }, { slug: entityId }] }
        });
        if (!category) throw new AppError('Category not found', 404);
        generated = SeoGeneratorService.generateCategorySeo(category);
      } else if (normalizedType === 'PAGE') {
        generated = SeoGeneratorService.getStaticPageDefaults(entityId);
      }

      const existing = await prisma.seoMetadata.findUnique({
        where: {
          entityType_entityId: {
            entityType: normalizedType,
            entityId: String(entityId)
          }
        }
      });

      let savedRecord;
      if (existing) {
        savedRecord = await prisma.seoMetadata.update({
          where: { id: existing.id },
          data: {
            generatedTitle: generated.generatedTitle,
            generatedDescription: generated.generatedDescription,
            generatedCanonicalUrl: generated.generatedCanonicalUrl,
            generatedOgTitle: generated.generatedOgTitle,
            generatedOgDescription: generated.generatedOgDescription,
            generatedOgImage: generated.generatedOgImage,
            generatedTwitterTitle: generated.generatedTwitterTitle,
            generatedTwitterDescription: generated.generatedTwitterDescription,
            focusKeyword: existing.focusKeyword || generated.focusKeyword,
            secondaryKeywords: existing.secondaryKeywords || generated.secondaryKeywords,
            schemaType: existing.schemaType || generated.schemaType
          }
        });
      } else {
        savedRecord = await prisma.seoMetadata.create({
          data: {
            entityType: normalizedType,
            entityId: String(entityId),
            ...generated
          }
        });
      }

      const resolved = await SeoResolverService.resolveSEO({
        entityType: normalizedType,
        entityId: String(entityId)
      });

      res.json({
        success: true,
        message: 'SEO suggestions regenerated successfully (manual customizations preserved)',
        data: resolved
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Operational SEO Audit: GET /api/v1/admin/seo/audit
   */
  static async getSeoAudit(req, res, next) {
    try {
      const [
        totalArticles,
        publishedArticles,
        draftArticles,
        articlesWithSeo,
        noIndexArticles,
        categories,
        slugHistoryCount
      ] = await Promise.all([
        prisma.article.count(),
        prisma.article.count({ where: { status: 'PUBLISHED' } }),
        prisma.article.count({ where: { status: 'DRAFT' } }),
        prisma.seoMetadata.count({ where: { entityType: 'ARTICLE' } }),
        prisma.seoMetadata.count({ where: { entityType: 'ARTICLE', isNoIndex: true } }),
        prisma.category.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            _count: { select: { articles: { where: { status: 'PUBLISHED' } } } }
          }
        }),
        prisma.articleSlugHistory.count()
      ]);

      // Detect articles with quality warnings
      const articles = await prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          coverImageAlt: true,
          readingTimeMin: true,
          publishedAt: true,
          author: { select: { firstName: true, lastName: true } },
          category: { select: { name: true } }
        },
        take: 100,
        orderBy: { publishedAt: 'desc' }
      });

      const warnings = [];
      for (const a of articles) {
        const itemWarnings = [];
        if (!a.excerpt || a.excerpt.length < 50) {
          itemWarnings.push('Short or missing excerpt/description');
        }
        if (!a.coverImageUrl) {
          itemWarnings.push('Missing featured cover image');
        } else if (!a.coverImageAlt) {
          itemWarnings.push('Cover image missing alt text');
        }
        if (a.title.length < 25) {
          itemWarnings.push('Title may be too short for search clarity');
        } else if (a.title.length > 70) {
          itemWarnings.push('Title exceeds 70 characters and may truncate');
        }

        if (itemWarnings.length > 0) {
          warnings.push({
            id: a.id,
            title: a.title,
            slug: a.slug,
            category: a.category?.name,
            author: `${a.author?.firstName || ''} ${a.author?.lastName || ''}`.trim(),
            issues: itemWarnings
          });
        }
      }

      res.json({
        success: true,
        data: {
          metrics: {
            totalArticles,
            publishedArticles,
            draftArticles,
            indexableArticles: Math.max(0, publishedArticles - noIndexArticles),
            noIndexArticles,
            articlesWithMetadataRecord: articlesWithSeo,
            coveragePercentage: publishedArticles > 0 ? Math.round((articlesWithSeo / publishedArticles) * 100) : 100,
            totalCategories: categories.length,
            activeCategories: categories.filter(c => c.isActive).length,
            emptyCategories: categories.filter(c => c._count.articles === 0).length,
            slugHistoryRedirects: slugHistoryCount
          },
          actionableWarnings: warnings,
          sitemapUrls: {
            masterIndex: `${config.APP_URL}/sitemap.xml`,
            articles: `${config.APP_URL}/sitemaps/articles.xml`,
            categories: `${config.APP_URL}/sitemaps/categories.xml`,
            pages: `${config.APP_URL}/sitemaps/pages.xml`,
            robots: `${config.APP_URL}/robots.txt`
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Batch Migration: POST /api/v1/admin/seo/migrate-missing
   * Automatically generates baseline SeoMetadata for all published content missing records
   */
  static async migrateMissingSeo(req, res, next) {
    try {
      const articles = await prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          category: true,
          tags: { include: { tag: true } },
          blocks: { orderBy: { position: 'asc' } }
        }
      });

      const categories = await prisma.category.findMany();
      let createdArticles = 0;
      let createdCategories = 0;
      let createdPages = 0;

      // 1. Migrate articles
      for (const a of articles) {
        const existing = await prisma.seoMetadata.findUnique({
          where: {
            entityType_entityId: {
              entityType: 'ARTICLE',
              entityId: a.id
            }
          }
        });

        if (!existing) {
          const generated = SeoGeneratorService.generateArticleSeo(a, a.category, a.tags);
          await prisma.seoMetadata.create({
            data: {
              entityType: 'ARTICLE',
              entityId: a.id,
              customTitle: a.seoTitle || null,
              customDescription: a.seoDescription || null,
              customCanonicalUrl: a.canonicalUrl || null,
              ...generated
            }
          });
          createdArticles++;
        }
      }

      // 2. Migrate categories
      for (const c of categories) {
        const existing = await prisma.seoMetadata.findUnique({
          where: {
            entityType_entityId: {
              entityType: 'CATEGORY',
              entityId: c.id
            }
          }
        });

        if (!existing) {
          const generated = SeoGeneratorService.generateCategorySeo(c);
          await prisma.seoMetadata.create({
            data: {
              entityType: 'CATEGORY',
              entityId: c.id,
              customTitle: c.seoTitle || null,
              customDescription: c.seoDescription || null,
              customCanonicalUrl: c.canonicalUrl || null,
              ...generated
            }
          });
          createdCategories++;
        }
      }

      // 3. Migrate static public pages
      const staticPages = ['home', 'research', 'about', 'contact', 'sponsorship', 'privacy-policy', 'terms', 'cookie-policy', 'editorial-guidelines'];
      for (const pageSlug of staticPages) {
        const existing = await prisma.seoMetadata.findUnique({
          where: {
            entityType_entityId: {
              entityType: 'PAGE',
              entityId: pageSlug
            }
          }
        });

        if (!existing) {
          const defaults = SeoGeneratorService.getStaticPageDefaults(pageSlug);
          await prisma.seoMetadata.create({
            data: {
              entityType: 'PAGE',
              entityId: pageSlug,
              ...defaults
            }
          });
          createdPages++;
        }
      }

      res.json({
        success: true,
        message: 'Successfully generated missing SEO records across catalog',
        data: {
          createdArticles,
          createdCategories,
          createdPages,
          totalCreated: createdArticles + createdCategories + createdPages
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
