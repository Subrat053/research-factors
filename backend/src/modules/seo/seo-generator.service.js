import { config } from '../../config/index.js';

/**
 * Stopwords to exclude during keyword extraction
 */
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'this', 'these', 'those', 'their', 'there', 'they', 'what',
  'when', 'where', 'which', 'who', 'why', 'how', 'about', 'after', 'all',
  'also', 'been', 'can', 'could', 'each', 'have', 'into', 'just', 'more',
  'most', 'much', 'only', 'other', 'some', 'such', 'than', 'them', 'then',
  'through', 'would', 'your', 'our'
]);

/**
 * Disallowed sensationalist/clickbait phrases to strictly prevent marketing hype
 */
const FORBIDDEN_CLICKBAIT = /\b(best|#1|number one|ultimate|guaranteed|world's leading|miracle|secret|jaw-dropping)\b/gi;

export class SeoGeneratorService {
  /**
   * Sanitizes string, trims whitespace and strips HTML tags
   */
  static cleanText(input) {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extracts clean plain text from blocks array
   */
  static extractPlainTextFromBlocks(blocks = []) {
    if (!Array.isArray(blocks) || blocks.length === 0) return '';
    const textPieces = [];

    for (const b of blocks) {
      if (!b) continue;
      if (typeof b === 'string') {
        textPieces.push(b);
      } else if (b.content) {
        if (typeof b.content.text === 'string') textPieces.push(b.content.text);
        if (typeof b.content.html === 'string') textPieces.push(b.content.html);
        if (typeof b.content.quote === 'string') textPieces.push(b.content.quote);
        if (typeof b.content.heading === 'string') textPieces.push(b.content.heading);
      }
    }

    return this.cleanText(textPieces.join(' '));
  }

  /**
   * Truncates text on sentence/word boundaries to target length
   */
  static truncate(text, maxLength = 160) {
    const cleaned = this.cleanText(text);
    if (cleaned.length <= maxLength) return cleaned;

    const truncated = cleaned.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.6) {
      return `${truncated.slice(0, lastSpace)}...`;
    }
    return `${truncated}...`;
  }

  /**
   * Extracts keywords from title and content
   */
  static extractKeywords(title, text, tags = []) {
    const combined = `${title} ${text}`.toLowerCase();
    const words = combined
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w));

    // Frequency analysis
    const frequency = {};
    for (const w of words) {
      frequency[w] = (frequency[w] || 0) + 1;
    }

    const sortedWords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);

    // Primary focus keyword is often the title's core noun phrase
    const focusKeyword = tags.length > 0
      ? (typeof tags[0] === 'string' ? tags[0] : (tags[0].name || tags[0].slug || '')).replace(/[-_]/g, ' ')
      : sortedWords.slice(0, 2).join(' ') || 'research';

    // Secondary keywords (top 4-6 distinctive keywords)
    const secondary = [];
    for (const t of tags) {
      const tagText = (typeof t === 'string' ? t : (t.name || t.slug || '')).replace(/[-_]/g, ' ');
      if (tagText && tagText.toLowerCase() !== focusKeyword.toLowerCase() && !secondary.includes(tagText)) {
        secondary.push(tagText);
      }
    }

    for (const w of sortedWords) {
      if (secondary.length >= 5) break;
      if (w !== focusKeyword && !secondary.includes(w)) {
        secondary.push(w);
      }
    }

    return {
      focusKeyword: focusKeyword.trim(),
      secondaryKeywords: secondary
    };
  }

  /**
   * Automatically derives schema type based on article format
   */
  static mapArticleTypeToSchema(type) {
    switch (String(type).toUpperCase()) {
      case 'RESEARCH':
        return 'ScholarlyArticle';
      case 'ANALYSIS':
      case 'COMPARISON':
      case 'GUIDE':
        return 'TechArticle';
      case 'REVIEW':
        return 'Review';
      case 'OPINION':
      default:
        return 'Article';
    }
  }

  /**
   * Generates deterministic, publication-grade SEO payload for an article
   */
  static generateArticleSeo(article, category = null, tags = []) {
    const baseUrl = config.APP_URL || 'https://researchfactors.com';
    const rawTitle = this.cleanText(article.title || 'Research Publication');
    const cleanTitle = rawTitle.replace(FORBIDDEN_CLICKBAIT, '').trim();

    // 1. Generate SEO Title: Target ~50-60 characters
    let generatedTitle = cleanTitle;
    if (!generatedTitle.toLowerCase().includes('research factors')) {
      if (`${generatedTitle} | Research Factors`.length <= 65) {
        generatedTitle = `${generatedTitle} | Research Factors`;
      }
    }

    // 2. Generate Meta Description: Target ~140-160 characters
    const blockText = this.extractPlainTextFromBlocks(article.blocks || []);
    const sourceDescription = this.cleanText(article.excerpt || blockText || article.subtitle || cleanTitle);
    const generatedDescription = this.truncate(sourceDescription, 155);

    // 3. Keywords
    const { focusKeyword, secondaryKeywords } = this.extractKeywords(cleanTitle, blockText, tags);

    // 4. Canonical URL (Canonical points to /:categorySlug/:slug)
    const categorySlug = category?.slug || article.category?.slug || 'research';
    const canonicalUrl = `${baseUrl}/${categorySlug}/${article.slug}`;

    // 5. Open Graph & Twitter Card defaults
    const generatedOgTitle = cleanTitle;
    const generatedOgDescription = generatedDescription;
    const coverImage = article.coverImageUrl || `${baseUrl}/logo.png`;

    // 6. Schema Type
    const schemaType = this.mapArticleTypeToSchema(article.type);

    return {
      generatedTitle,
      generatedDescription,
      generatedCanonicalUrl: canonicalUrl,
      generatedOgTitle,
      generatedOgDescription,
      generatedOgImage: coverImage,
      generatedTwitterTitle: generatedOgTitle,
      generatedTwitterDescription: generatedDescription,
      focusKeyword,
      secondaryKeywords,
      schemaType,
      isNoIndex: false,
      isNoFollow: false
    };
  }

  /**
   * Generates deterministic SEO payload for a category
   */
  static generateCategorySeo(category) {
    const baseUrl = config.APP_URL || 'https://researchfactors.com';
    const catName = this.cleanText(category.name || 'Category');
    const generatedTitle = `${catName} Research & Analysis | Research Factors`;
    const desc = category.description
      ? this.cleanText(category.description)
      : `Peer-reviewed studies, empirical datasets, and critical insights in ${catName}.`;
    const generatedDescription = this.truncate(desc, 155);
    const canonicalUrl = `${baseUrl}/categories/${category.slug}`;

    return {
      generatedTitle,
      generatedDescription,
      generatedCanonicalUrl: canonicalUrl,
      generatedOgTitle: generatedTitle,
      generatedOgDescription: generatedDescription,
      generatedOgImage: category.imageUrl || `${baseUrl}/logo.png`,
      generatedTwitterTitle: generatedTitle,
      generatedTwitterDescription: generatedDescription,
      focusKeyword: `${catName.toLowerCase()} research`,
      secondaryKeywords: [catName.toLowerCase(), 'analysis', 'data', 'studies'],
      schemaType: 'CollectionPage',
      isNoIndex: false,
      isNoFollow: false
    };
  }

  /**
   * Pre-configured, authoritative defaults for static public pages
   */
  static getStaticPageDefaults(pageSlug) {
    const baseUrl = config.APP_URL || 'https://researchfactors.com';

    const staticCatalog = {
      home: {
        title: 'Research Factors — Peer-Reviewed Insights & Empirical Research',
        description: 'Explore verified research, empirical benchmarks, and interdisciplinary analysis across technology, science, business, and policy.',
        canonical: `${baseUrl}/`,
        schemaType: 'WebSite'
      },
      research: {
        title: 'Research Archive & Library | Research Factors',
        description: 'Browse the complete index of peer-reviewed research publications, analytical reviews, and systematic comparisons.',
        canonical: `${baseUrl}/research`,
        schemaType: 'CollectionPage'
      },
      about: {
        title: 'About Research Factors — Editorial Creed & Peer Review Standards',
        description: 'Learn about Research Factors: our mission for scientific rigor, peer-review methodology, and transparent empirical benchmarks.',
        canonical: `${baseUrl}/about`,
        schemaType: 'AboutPage'
      },
      contact: {
        title: 'Contact the Editorial Board | Research Factors',
        description: 'Inquire with Research Factors editors, submit research pitches, report errata, or connect with our investigative board.',
        canonical: `${baseUrl}/contact`,
        schemaType: 'ContactPage'
      },
      sponsorship: {
        title: 'Research Sponsorship & Academic Grants | Research Factors',
        description: 'Partner with Research Factors through ethical, disclosure-first sponsorships, academic fellowships, and research grants.',
        canonical: `${baseUrl}/sponsorship`,
        schemaType: 'WebPage'
      },
      'privacy-policy': {
        title: 'Privacy Policy | Research Factors',
        description: 'Read the Research Factors privacy policy: our commitment to GDPR, CCPA compliance, zero tracker monetization, and data ethics.',
        canonical: `${baseUrl}/privacy-policy`,
        schemaType: 'WebPage'
      },
      terms: {
        title: 'Terms & Conditions of Publication | Research Factors',
        description: 'Review the legal terms, licensing rules, intellectual property rights, and reader terms governing Research Factors.',
        canonical: `${baseUrl}/terms`,
        schemaType: 'WebPage'
      },
      'cookie-policy': {
        title: 'Cookie Policy & Consent Settings | Research Factors',
        description: 'Understand how Research Factors uses strictly necessary session cookies and respects Do Not Track browser signals.',
        canonical: `${baseUrl}/cookie-policy`,
        schemaType: 'WebPage'
      },
      'editorial-guidelines': {
        title: 'Editorial Guidelines & Review Standards | Research Factors',
        description: 'Explore the editorial guidelines, empirical research methodologies, peer-review standards, and conflict-of-interest firewalls governing Research Factors.',
        canonical: `${baseUrl}/editorial-guidelines`,
        schemaType: 'WebPage'
      }
    };

    const configItem = staticCatalog[pageSlug] || {
      title: `${pageSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} | Research Factors`,
      description: 'Research Factors digital publication.',
      canonical: `${baseUrl}/${pageSlug}`,
      schemaType: 'WebPage'
    };

    return {
      generatedTitle: configItem.title,
      generatedDescription: configItem.description,
      generatedCanonicalUrl: configItem.canonical,
      generatedOgTitle: configItem.title,
      generatedOgDescription: configItem.description,
      generatedOgImage: `${baseUrl}/logo.png`,
      generatedTwitterTitle: configItem.title,
      generatedTwitterDescription: configItem.description,
      focusKeyword: pageSlug.replace(/[-_]/g, ' '),
      secondaryKeywords: ['research factors', 'academic', 'journal'],
      schemaType: configItem.schemaType,
      isNoIndex: false,
      isNoFollow: false
    };
  }
}
