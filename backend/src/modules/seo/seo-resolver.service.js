import { prisma } from '../../config/db.js';
import { config } from '../../config/index.js';
import { SeoGeneratorService } from './seo-generator.service.js';

export class SeoResolverService {
  /**
   * Loads site-wide default settings for fallback level 4
   */
  static async getSiteDefaults() {
    const baseUrl = config.APP_URL || 'https://researchfactors.com';

    let settings = {};
    try {
      const dbSettings = await prisma.systemSetting.findMany({
        where: {
          key: { in: ['site_name', 'site_description', 'default_og_image', 'organization', 'social_links'] }
        }
      });
      for (const s of dbSettings) {
        settings[s.key] = s.value;
      }
    } catch {
      // Fallback if settings query fails
    }

    return {
      siteName: settings.site_name || 'Research Factors',
      siteDescription: settings.site_description || 'Peer-reviewed insights, empirical benchmarks, and interdisciplinary analysis.',
      siteUrl: baseUrl,
      defaultOgImage: settings.default_og_image || `${baseUrl}/logo.png`,
      organization: settings.organization || {
        name: 'Research Factors',
        logo: `${baseUrl}/logo.png`,
        url: baseUrl
      },
      socialLinks: settings.social_links || {
        twitter: 'https://x.com',
        facebook: 'https://facebook.com',
        youtube: 'https://youtube.com',
        instagram: 'https://instagram.com'
      }
    };
  }

  /**
   * Resolves the complete SEO payload for any entity using the 4-tier fallback:
   * 1. Admin Custom Override
   * 2. Generated SEO Value
   * 3. Entity Content Fallback
   * 4. Site Default Fallback
   */
  static async resolveSEO({
    entityType,       // 'ARTICLE' | 'CATEGORY' | 'PAGE' | 'SITE'
    entityId,         // UUID or slug
    entityData = null // Optional preloaded entity object
  }) {
    const siteDefaults = await this.getSiteDefaults();
    const normalizedType = String(entityType).toUpperCase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(entityId));

    // 1. Fetch Entity Data if not supplied (safely checking UUID vs Slug)
    let entity = entityData;
    if (!entity) {
      if (normalizedType === 'ARTICLE') {
        entity = await prisma.article.findFirst({
          where: isUuid ? { OR: [{ id: entityId }, { slug: entityId }] } : { slug: entityId },
          include: {
            category: true,
            author: { include: { authorProfile: true } },
            tags: { include: { tag: true } },
            blocks: { orderBy: { position: 'asc' } }
          }
        });
      } else if (normalizedType === 'CATEGORY') {
        entity = await prisma.category.findFirst({
          where: isUuid ? { OR: [{ id: entityId }, { slug: entityId }] } : { slug: entityId }
        });
      } else if (normalizedType === 'TAG') {
        entity = await prisma.tag.findFirst({
          where: isUuid ? { OR: [{ id: entityId }, { slug: entityId }] } : { slug: entityId }
        });
      }
    }

    // 2. Determine target entityId for SeoMetadata record (prefer entity.id if resolved)
    const targetEntityId = entity?.id || String(entityId);

    // 3. Fetch existing SeoMetadata record if present
    let seoRecord = null;
    try {
      seoRecord = await prisma.seoMetadata.findUnique({
        where: {
          entityType_entityId: {
            entityType: normalizedType,
            entityId: targetEntityId
          }
        }
      });
      // Fallback lookup with original entityId if different
      if (!seoRecord && targetEntityId !== String(entityId)) {
        seoRecord = await prisma.seoMetadata.findUnique({
          where: {
            entityType_entityId: {
              entityType: normalizedType,
              entityId: String(entityId)
            }
          }
        });
      }
    } catch {
      // Handle missing table gracefully
    }

    // 3. Fallback on-the-fly generation if generated values are missing from DB
    let generated = {};
    if (normalizedType === 'ARTICLE' && entity) {
      generated = SeoGeneratorService.generateArticleSeo(
        entity,
        entity.category,
        entity.tags ? entity.tags.map(t => t.tag || t) : []
      );
    } else if (normalizedType === 'CATEGORY' && entity) {
      generated = SeoGeneratorService.generateCategorySeo(entity);
    } else if (normalizedType === 'TAG' && entity) {
      const tagName = entity.name || entity.slug;
      generated = {
        generatedTitle: `#${tagName} - Research & Publications | ${siteDefaults.siteName}`,
        generatedDescription: `Explore peer-reviewed publications, in-depth analyses, and benchmarks tagged with #${tagName} on ${siteDefaults.siteName}.`,
        generatedCanonicalUrl: `${siteDefaults.siteUrl}/tag/${entity.slug}`,
        generatedOgTitle: `#${tagName} - Research & Publications`,
        generatedOgDescription: `Explore research articles and analyses tagged with #${tagName} on ${siteDefaults.siteName}.`,
        generatedOgImage: siteDefaults.defaultOgImage,
        schemaType: 'CollectionPage'
      };
    } else if (normalizedType === 'PAGE') {
      generated = SeoGeneratorService.getStaticPageDefaults(entityId);
    } else {
      generated = {
        generatedTitle: siteDefaults.siteName,
        generatedDescription: siteDefaults.siteDescription,
        generatedCanonicalUrl: siteDefaults.siteUrl,
        generatedOgTitle: siteDefaults.siteName,
        generatedOgDescription: siteDefaults.siteDescription,
        generatedOgImage: siteDefaults.defaultOgImage,
        schemaType: 'WebSite'
      };
    }

    // 4. Resolve Title (Level 1 -> 2 -> 3 -> 4)
    const title =
      seoRecord?.customTitle ||
      entity?.seoTitle ||
      seoRecord?.generatedTitle ||
      generated.generatedTitle ||
      entity?.title ||
      entity?.name ||
      siteDefaults.siteName;

    // 5. Resolve Description (Level 1 -> 2 -> 3 -> 4)
    const description =
      seoRecord?.customDescription ||
      entity?.seoDescription ||
      seoRecord?.generatedDescription ||
      generated.generatedDescription ||
      entity?.excerpt ||
      entity?.description ||
      siteDefaults.siteDescription;

    // 6. Resolve Canonical URL
    const canonicalUrl =
      seoRecord?.customCanonicalUrl ||
      entity?.canonicalUrl ||
      seoRecord?.generatedCanonicalUrl ||
      generated.generatedCanonicalUrl ||
      (entity?.slug
        ? `${siteDefaults.siteUrl}/${normalizedType === 'CATEGORY' ? 'categories' : normalizedType === 'TAG' ? 'tag' : 'research'}/${entity.slug}`
        : `${siteDefaults.siteUrl}/`);

    // 7. Resolve Robots Directives
    const isDraft = entity?.status && entity.status !== 'PUBLISHED';
    const isNoIndex = Boolean(isDraft || seoRecord?.isNoIndex);
    const isNoFollow = Boolean(isDraft || seoRecord?.isNoFollow);
    const robots = `${isNoIndex ? 'noindex' : 'index'}, ${isNoFollow ? 'nofollow' : 'follow'}`;

    // 8. Resolve Open Graph Metadata
    const ogTitle =
      seoRecord?.customOgTitle ||
      seoRecord?.generatedOgTitle ||
      generated.generatedOgTitle ||
      title;

    const ogDescription =
      seoRecord?.customOgDescription ||
      seoRecord?.generatedOgDescription ||
      generated.generatedOgDescription ||
      description;

    const ogImage =
      seoRecord?.customOgImage ||
      entity?.coverImageUrl ||
      seoRecord?.generatedOgImage ||
      generated.generatedOgImage ||
      siteDefaults.defaultOgImage;

    const ogType = normalizedType === 'ARTICLE' ? 'article' : 'website';

    // 9. Resolve Twitter Card
    const twitterCard = seoRecord?.customTwitterCard || 'summary_large_image';
    const twitterTitle =
      seoRecord?.customTwitterTitle ||
      seoRecord?.generatedTwitterTitle ||
      ogTitle;
    const twitterDescription =
      seoRecord?.customTwitterDescription ||
      seoRecord?.generatedTwitterDescription ||
      ogDescription;
    const twitterImage =
      seoRecord?.customTwitterImage ||
      ogImage;

    // 10. Resolve Structured Data (JSON-LD)
    const schemaType =
      seoRecord?.schemaType ||
      generated.schemaType ||
      (normalizedType === 'ARTICLE' ? 'Article' : 'WebPage');

    const jsonLd = this.buildJsonLd({
      entityType: normalizedType,
      entity,
      title,
      description,
      canonicalUrl,
      ogImage,
      schemaType,
      siteDefaults,
      customSchema: seoRecord?.customSchema
    });

    return {
      entityType: normalizedType,
      entityId: String(entityId),
      title,
      description,
      canonicalUrl,
      robots,
      isNoIndex,
      isNoFollow,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: canonicalUrl,
        type: ogType,
        siteName: siteDefaults.siteName,
        image: ogImage
      },
      twitter: {
        card: twitterCard,
        title: twitterTitle,
        description: twitterDescription,
        image: twitterImage
      },
      keywords: {
        focus: seoRecord?.focusKeyword || generated.focusKeyword || '',
        secondary: seoRecord?.secondaryKeywords || generated.secondaryKeywords || []
      },
      schema: {
        type: schemaType,
        jsonLd
      },
      // Expose the raw metadata record for Admin inspection
      record: seoRecord ? {
        id: seoRecord.id,
        customTitle: seoRecord.customTitle,
        customDescription: seoRecord.customDescription,
        customCanonicalUrl: seoRecord.customCanonicalUrl,
        customOgTitle: seoRecord.customOgTitle,
        customOgDescription: seoRecord.customOgDescription,
        customOgImage: seoRecord.customOgImage,
        customTwitterTitle: seoRecord.customTwitterTitle,
        customTwitterDescription: seoRecord.customTwitterDescription,
        customTwitterImage: seoRecord.customTwitterImage,
        generatedTitle: seoRecord.generatedTitle || generated.generatedTitle,
        generatedDescription: seoRecord.generatedDescription || generated.generatedDescription,
        generatedCanonicalUrl: seoRecord.generatedCanonicalUrl || generated.generatedCanonicalUrl,
        generatedOgTitle: seoRecord.generatedOgTitle || generated.generatedOgTitle,
        generatedOgDescription: seoRecord.generatedOgDescription || generated.generatedOgDescription,
        generatedOgImage: seoRecord.generatedOgImage || generated.generatedOgImage,
        isNoIndex: seoRecord.isNoIndex,
        isNoFollow: seoRecord.isNoFollow,
        focusKeyword: seoRecord.focusKeyword || generated.focusKeyword,
        secondaryKeywords: seoRecord.secondaryKeywords || generated.secondaryKeywords,
        schemaType: seoRecord.schemaType || generated.schemaType
      } : null
    };
  }

  /**
   * Constructs valid Schema.org JSON-LD Graph
   */
  static buildJsonLd({
    entityType,
    entity,
    title,
    description,
    canonicalUrl,
    ogImage,
    schemaType,
    siteDefaults,
    customSchema
  }) {
    if (customSchema && typeof customSchema === 'object' && Object.keys(customSchema).length > 0) {
      return customSchema;
    }

    const graph = [];

    // 1. Organization Schema
    const organizationSchema = {
      '@type': 'Organization',
      '@id': `${siteDefaults.siteUrl}/#organization`,
      name: siteDefaults.siteName,
      url: siteDefaults.siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: siteDefaults.organization.logo || `${siteDefaults.siteUrl}/logo.png`
      }
    };
    graph.push(organizationSchema);

    // 2. WebSite Schema
    const websiteSchema = {
      '@type': 'WebSite',
      '@id': `${siteDefaults.siteUrl}/#website`,
      url: siteDefaults.siteUrl,
      name: siteDefaults.siteName,
      description: siteDefaults.siteDescription,
      publisher: {
        '@id': `${siteDefaults.siteUrl}/#organization`
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteDefaults.siteUrl}/research?search={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
    graph.push(websiteSchema);

    // 3. Entity-Specific Schemas
    if (entityType === 'ARTICLE' && entity) {
      const author = entity.author;
      const authorName = author
        ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'Research Factors Editorial Team'
        : 'Research Factors Editorial Team';

      const authorSchema = {
        '@type': 'Person',
        name: authorName,
        url: author?.authorProfile?.websiteUrl || `${siteDefaults.siteUrl}/`
      };

      const articleSchema = {
        '@type': schemaType || 'Article',
        '@id': `${canonicalUrl}#article`,
        isPartOf: {
          '@id': `${siteDefaults.siteUrl}/#website`
        },
        headline: title,
        description: description,
        image: ogImage ? [ogImage] : [],
        datePublished: entity.publishedAt ? new Date(entity.publishedAt).toISOString() : new Date().toISOString(),
        dateModified: entity.updatedAt ? new Date(entity.updatedAt).toISOString() : new Date().toISOString(),
        author: authorSchema,
        publisher: {
          '@id': `${siteDefaults.siteUrl}/#organization`
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl
        }
      };

      if (entity.category) {
        articleSchema.articleSection = entity.category.name;
      }

      if (Array.isArray(entity.tags) && entity.tags.length > 0) {
        articleSchema.keywords = entity.tags
          .map(t => typeof t === 'string' ? t : (t.tag?.name || t.name || ''))
          .filter(Boolean)
          .join(', ');
      }

      graph.push(articleSchema);

      // BreadcrumbList for Article
      const breadcrumbs = {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteDefaults.siteUrl
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: entity.category?.name || 'Research',
            item: entity.category
              ? `${siteDefaults.siteUrl}/categories/${entity.category.slug}`
              : `${siteDefaults.siteUrl}/research`
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: title,
            item: canonicalUrl
          }
        ]
      };
      graph.push(breadcrumbs);
    } else if (entityType === 'CATEGORY' && entity) {
      const collectionSchema = {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#collection`,
        url: canonicalUrl,
        name: title,
        description: description,
        isPartOf: {
          '@id': `${siteDefaults.siteUrl}/#website`
        },
        about: {
          '@type': 'Thing',
          name: entity.name
        }
      };
      graph.push(collectionSchema);

      const breadcrumbs = {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteDefaults.siteUrl
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Categories',
            item: `${siteDefaults.siteUrl}/research`
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: entity.name,
            item: canonicalUrl
          }
        ]
      };
      graph.push(breadcrumbs);
    } else if (entityType === 'PAGE') {
      const webPageSchema = {
        '@type': schemaType || 'WebPage',
        '@id': `${canonicalUrl}#page`,
        url: canonicalUrl,
        name: title,
        description: description,
        isPartOf: {
          '@id': `${siteDefaults.siteUrl}/#website`
        }
      };
      graph.push(webPageSchema);
    }

    return {
      '@context': 'https://schema.org',
      '@graph': graph
    };
  }
}
