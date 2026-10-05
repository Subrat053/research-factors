import { UserDTO } from '../users/user.dto.js';
import { resolveMediaUrl } from '../../utils/mediaUrlResolver.js';

export class ArticleDTO {
  static toPublicSummary(article) {
    if (!article) return null;

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      subtitle: article.subtitle,
      excerpt: article.excerpt,
      coverImageUrl: resolveMediaUrl(article.coverImageUrl),
      coverImageAlt: article.coverImageAlt,
      type: article.type,
      status: article.status,
      readingTimeMin: article.readingTimeMin,
      viewCount: article.viewCount,
      isFeatured: Boolean(article.isFeatured),
      isSponsored: Boolean(article.isSponsored),
      sponsorName: article.sponsorName || null,
      sponsorDescription: article.sponsorDescription || null,
      sponsorUrl: article.sponsorUrl || null,
      sponsorLogoUrl: resolveMediaUrl(article.sponsorLogoUrl),
      publishedAt: article.publishedAt,
      category: article.category ? {
        id: article.category.id,
        name: article.category.name,
        slug: article.category.slug
      } : null,
      author: article.author ? UserDTO.toPublic(article.author) : null,
      tags: article.tags ? article.tags.map(at => at.tag ? {
        id: at.tag.id,
        name: at.tag.name,
        slug: at.tag.slug
      } : at) : [],
      commentCount: article._count?.comments || 0
    };
  }

  static toCardDTO(article) {
    return this.toPublicSummary(article);
  }

  static toPublicDetail(article, related = []) {
    if (!article) return null;

    const summary = this.toPublicSummary(article);
    const blocks = article.blocks ? article.blocks.sort((a, b) => a.position - b.position).map(b => {
      let content = b.content;
      if (b.blockType === 'image' && content?.url) {
        content = { ...content, url: resolveMediaUrl(content.url) };
      }
      return {
        id: b.id,
        blockType: b.blockType,
        position: b.position,
        content,
        metadata: b.metadata
      };
    }) : [];

    return {
      ...summary,
      seoTitle: article.seoTitle || article.seo?.title || article.title,
      seoDescription: article.seoDescription || article.seo?.description || article.excerpt,
      canonicalUrl: article.canonicalUrl || article.seo?.canonicalUrl,
      seo: article.seo || null,
      blocks,
      related: related.map(r => this.toPublicSummary(r))
    };
  }

  static toAuthorAdmin(article) {
    if (!article) return null;
    return {
      ...this.toPublicDetail(article),
      rejectionReason: article.rejectionReason,
      hasUnpublishedChanges: Boolean(article.hasUnpublishedChanges),
      draftData: article.draftData || null,
      scheduledAt: article.scheduledAt,
      createdById: article.createdById,
      publishedById: article.publishedById,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      seoMetadata: article.seoMetadata || null
    };
  }
}
