import { prisma } from '../../config/db.js';

export class AuditEnricherService {
  /**
   * Enriches a batch of audit logs with human-readable target details,
   * friendly action labels, semantic badges, and structured diffs.
   * Performs batched database lookups to prevent N+1 performance degradation.
   *
   * @param {Array<Object>} logs - Raw Prisma audit log records with actor included
   * @returns {Promise<Array<Object>>} Enriched audit log DTOs
   */
  static async enrichLogs(logs) {
    if (!Array.isArray(logs) || logs.length === 0) {
      return [];
    }

    // 1. Gather all entity IDs and bulk target IDs grouped by domain
    const userIds = new Set();
    const articleIds = new Set();
    const commentIds = new Set();
    const categoryIds = new Set();
    const tagIds = new Set();
    const contactIds = new Set();
    const mediaIds = new Set();
    const roleIds = new Set();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    logs.forEach((log) => {
      const type = (log.entityType || '').toLowerCase();
      const id = log.entityId;

      if (id && uuidRegex.test(id)) {
        if (type === 'user' || type === 'author') userIds.add(id);
        else if (type === 'article') articleIds.add(id);
        else if (type === 'comment') commentIds.add(id);
        else if (type === 'category') categoryIds.add(id);
        else if (type === 'tag') tagIds.add(id);
        else if (type === 'contactmessage' || type === 'contact') contactIds.add(id);
        else if (type === 'media') mediaIds.add(id);
        else if (type === 'role') roleIds.add(id);
      }

      // Check for bulk arrays in metadata (e.g. targetIds, articleIds, messageIds)
      const bulkCandidates = [
        ...(Array.isArray(log.metadata?.targetIds) ? log.metadata.targetIds : []),
        ...(Array.isArray(log.metadata?.articleIds) ? log.metadata.articleIds : []),
        ...(Array.isArray(log.metadata?.messageIds) ? log.metadata.messageIds : [])
      ];
      bulkCandidates.forEach((tid) => {
        if (typeof tid === 'string' && uuidRegex.test(tid)) {
          if (type === 'user') userIds.add(tid);
          else if (type === 'article') articleIds.add(tid);
          else if (type === 'comment') commentIds.add(tid);
          else if (type === 'contactmessage' || type === 'contact') contactIds.add(tid);
          else if (type === 'media') mediaIds.add(tid);
        }
      });

      // Check for related IDs in metadata (e.g. articleId, authorId)
      if (log.metadata) {
        if (log.metadata.articleId && uuidRegex.test(log.metadata.articleId)) {
          articleIds.add(log.metadata.articleId);
        }
        if (log.metadata.authorId && uuidRegex.test(log.metadata.authorId)) {
          userIds.add(log.metadata.authorId);
        }
        if (log.metadata.userId && uuidRegex.test(log.metadata.userId)) {
          userIds.add(log.metadata.userId);
        }
      }
    });

    // 2. Parallel batch queries for each entity domain
    const [
      users,
      articles,
      comments,
      categories,
      tags,
      contactMessages,
      mediaList,
      roles
    ] = await Promise.all([
      userIds.size > 0
        ? prisma.user.findMany({
            where: { id: { in: Array.from(userIds) } },
            select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, status: true }
          })
        : [],
      articleIds.size > 0
        ? prisma.article.findMany({
            where: { id: { in: Array.from(articleIds) } },
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              category: { select: { name: true, slug: true } }
            }
          })
        : [],
      commentIds.size > 0
        ? prisma.comment.findMany({
            where: { id: { in: Array.from(commentIds) } },
            select: {
              id: true,
              content: true,
              status: true,
              article: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  category: { select: { slug: true } }
                }
              },
              user: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            }
          })
        : [],
      categoryIds.size > 0
        ? prisma.category.findMany({
            where: { id: { in: Array.from(categoryIds) } },
            select: { id: true, name: true, slug: true, isActive: true }
          })
        : [],
      tagIds.size > 0
        ? prisma.tag.findMany({
            where: { id: { in: Array.from(tagIds) } },
            select: { id: true, name: true, slug: true }
          })
        : [],
      contactIds.size > 0
        ? prisma.contactMessage.findMany({
            where: { id: { in: Array.from(contactIds) } },
            select: { id: true, name: true, email: true, subject: true, message: true, isResolved: true }
          })
        : [],
      mediaIds.size > 0
        ? prisma.media.findMany({
            where: { id: { in: Array.from(mediaIds) } },
            select: { id: true, originalName: true, provider: true, publicUrl: true, mimeType: true }
          })
        : [],
      roleIds.size > 0
        ? prisma.role.findMany({
            where: { id: { in: Array.from(roleIds) } },
            select: { id: true, name: true, description: true }
          })
        : []
    ]);

    // Build fast lookup maps
    const userMap = new Map(users.map((u) => [u.id, u]));
    const articleMap = new Map(articles.map((a) => [a.id, a]));
    const commentMap = new Map(comments.map((c) => [c.id, c]));
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const tagMap = new Map(tags.map((t) => [t.id, t]));
    const contactMap = new Map(contactMessages.map((m) => [m.id, m]));
    const mediaMap = new Map(mediaList.map((m) => [m.id, m]));
    const roleMap = new Map(roles.map((r) => [r.id, r]));

    // 3. Transform and enrich each log record
    return logs.map((log) => {
      const type = (log.entityType || '').toLowerCase();
      const meta = log.metadata || {};
      const actorName = log.actor
        ? `${log.actor.firstName} ${log.actor.lastName}`.trim()
        : 'System';

      // A. Action descriptor and semantics
      const actionDescriptor = this.describeAction(log.action, log.entityType);

      // B. Resolve Target Details
      let target = {
        id: log.entityId,
        type: log.entityType,
        name: log.entityId,
        subtitle: null,
        link: null,
        isBulk: false,
        items: []
      };

      // User Domain
      if (type === 'user' || type === 'author') {
        if (log.entityId === 'bulk' || Array.isArray(meta.targetIds)) {
          const targetIds = meta.targetIds || [];
          const count = meta.targetCount || targetIds.length;
          target.isBulk = true;
          target.name = `${count} User Accounts`;
          target.subtitle = meta.reason || 'Bulk administrative modification';
          target.link = '/admin/users';

          // Resolve individual bulk items
          target.items = targetIds.map((tid) => {
            const u = userMap.get(tid);
            return {
              id: tid,
              name: u ? `${u.firstName} ${u.lastName}`.trim() : `User ${tid.slice(0, 8)}...`,
              email: u?.email || 'Unknown Email',
              status: u?.status || meta.newStatus || 'UNKNOWN',
              link: u ? `/admin/users?search=${encodeURIComponent(u.email)}` : `/admin/users`
            };
          });
        } else {
          const u = userMap.get(log.entityId);
          if (u) {
            target.name = `${u.firstName} ${u.lastName}`.trim();
            target.subtitle = u.email;
            target.link = `/admin/users?search=${encodeURIComponent(u.email)}`;
          } else if (meta.email || meta.name || meta.targetName) {
            target.name = meta.targetName || meta.name || 'User Account';
            target.subtitle = meta.targetEmail || meta.email || log.entityId;
            target.link = `/admin/users`;
          } else {
            target.name = `User (${log.entityId.slice(0, 8)}...)`;
            target.link = `/admin/users`;
          }
        }
      }
      // Article Domain
      else if (type === 'article') {
        const rawArticleIds = meta.articleIds || (Array.isArray(meta.targetIds) ? meta.targetIds : null);
        if (log.entityId === 'bulk' || Array.isArray(rawArticleIds)) {
          const bulkIds = Array.isArray(rawArticleIds) ? rawArticleIds : [];
          const count = meta.count || bulkIds.length;
          target.isBulk = true;
          target.name = `${count} Articles`;
          target.subtitle = meta.newStatus ? `Bulk status changed to ${meta.newStatus}` : 'Bulk editorial modification';
          target.link = `/admin/articles`;
          target.items = bulkIds.map((aid) => {
            const a = articleMap.get(aid);
            return {
              id: aid,
              name: a ? a.title : `Article ${aid.slice(0, 8)}...`,
              email: a?.category?.name || 'Manuscript',
              status: a?.status || meta.newStatus || 'UNKNOWN',
              link: a?.category?.slug ? `/${a.category.slug}/${a.slug}` : `/admin/articles`
            };
          });
        } else {
          const art = articleMap.get(log.entityId);
          if (art) {
            target.name = art.title;
            target.subtitle = art.category?.name ? `${art.category.name} • /${art.category.slug}/${art.slug}` : `/${art.slug}`;
            target.link = art.category?.slug ? `/${art.category.slug}/${art.slug}` : `/admin/articles`;
          } else if (meta.title) {
            target.name = meta.title;
            target.subtitle = meta.slug ? `/${meta.slug}` : null;
            target.link = `/admin/articles`;
          } else {
            target.name = `Manuscript (${log.entityId.slice(0, 8)}...)`;
            target.link = `/admin/articles`;
          }
        }
      }
      // Comment Domain
      else if (type === 'comment') {
        const comm = commentMap.get(log.entityId);
        if (comm) {
          const authorName = comm.user
            ? `${comm.user.firstName} ${comm.user.lastName}`.trim()
            : 'Reader';
          const articleTitle = comm.article?.title || 'Article';
          target.name = `Comment by ${authorName}`;
          target.subtitle = `on "${articleTitle}"`;
          target.link = `/admin/comments`;
        } else {
          const relatedArticle = meta.articleId ? articleMap.get(meta.articleId) : null;
          const relatedAuthor = meta.authorId ? userMap.get(meta.authorId) : null;
          target.name = relatedAuthor
            ? `Comment by ${relatedAuthor.firstName} ${relatedAuthor.lastName}`
            : meta.authorName
            ? `Comment by ${meta.authorName}`
            : `Comment (${log.entityId.slice(0, 8)}...)`;
          target.subtitle = relatedArticle
            ? `on "${relatedArticle.title}"`
            : meta.articleTitle
            ? `on "${meta.articleTitle}"`
            : null;
          target.link = `/admin/comments`;
        }
      }
      // Category Domain
      else if (type === 'category') {
        const cat = categoryMap.get(log.entityId);
        if (cat) {
          target.name = cat.name;
          target.subtitle = `Slug: ${cat.slug}`;
          target.link = `/admin/categories`;
        } else if (meta.target?.name || meta.name) {
          target.name = meta.target?.name || meta.name;
          target.subtitle = meta.target?.slug || meta.slug ? `Slug: ${meta.target?.slug || meta.slug}` : null;
          target.link = `/admin/categories`;
        } else {
          target.name = `Category (${log.entityId.slice(0, 8)}...)`;
          target.link = `/admin/categories`;
        }
      }
      // Tag Domain
      else if (type === 'tag') {
        const tag = tagMap.get(log.entityId);
        if (tag) {
          target.name = tag.name;
          target.subtitle = `Slug: ${tag.slug}`;
          target.link = `/admin/tags`;
        } else if (meta.name) {
          target.name = meta.name;
          target.subtitle = meta.slug ? `Slug: ${meta.slug}` : null;
          target.link = `/admin/tags`;
        } else {
          target.name = `Tag (${log.entityId.slice(0, 8)}...)`;
          target.link = `/admin/tags`;
        }
      }
      // Contact Message Domain
      else if (type === 'contactmessage' || type === 'contact') {
        if (log.entityId === 'bulk' || Array.isArray(meta.messageIds)) {
          const messageIds = meta.messageIds || [];
          target.isBulk = true;
          target.name = `${messageIds.length} Inquiries`;
          target.subtitle = meta.status ? `Status updated to ${meta.status}` : 'Bulk update';
          target.link = `/admin/contact-messages`;
          target.items = messageIds.map((mid) => {
            const m = contactMap.get(mid);
            return {
              id: mid,
              name: m ? `${m.name} (${m.email})` : `Message ${mid.slice(0, 8)}...`,
              email: m?.subject || 'Contact Inquiry',
              status: m?.isResolved ? 'RESOLVED' : 'PENDING',
              link: `/admin/contact-messages`
            };
          });
        } else {
          const msg = contactMap.get(log.entityId);
          if (msg) {
            target.name = msg.name || msg.email;
            target.subtitle = `Inquiry: "${msg.subject || 'No Subject'}"`;
            target.link = `/admin/contact-messages`;
          } else if (meta.sender || meta.senderName || meta.subject) {
            target.name = meta.senderName || meta.sender || 'Reader Inquiry';
            target.subtitle = meta.subject || null;
            target.link = `/admin/contact-messages`;
          } else {
            target.name = `Inquiry (${log.entityId.slice(0, 8)}...)`;
            target.link = `/admin/contact-messages`;
          }
        }
      }
      // Media Domain
      else if (type === 'media') {
        const med = mediaMap.get(log.entityId);
        if (med) {
          target.name = med.originalName || 'Media Asset';
          target.subtitle = `${med.provider.toUpperCase()} • ${med.mimeType}`;
          target.link = `/admin/media`;
        } else if (meta.filename || meta.originalName) {
          target.name = meta.filename || meta.originalName;
          target.subtitle = meta.provider ? `Provider: ${meta.provider}` : null;
          target.link = `/admin/media`;
        } else {
          target.name = `Media Asset (${log.entityId.slice(0, 8)}...)`;
          target.link = `/admin/media`;
        }
      }
      // Role Domain
      else if (type === 'role') {
        const r = roleMap.get(log.entityId);
        if (r) {
          target.name = r.name;
          target.subtitle = r.description || 'System Role';
          target.link = `/admin/roles`;
        } else {
          target.name = meta.roleName || `Role (${log.entityId.slice(0, 8)}...)`;
          target.link = `/admin/roles`;
        }
      }
      // System Setting Domain
      else if (type === 'systemsetting' || type === 'system') {
        target.name = meta.key ? this.formatSettingKey(meta.key) : 'System Policy Settings';
        target.subtitle = meta.category ? `Category: ${meta.category}` : 'Platform Configuration';
        target.link = `/admin/settings`;
      }

      // C. Plain-English Event Narrative
      const narrative = this.buildNarrative(actorName, actionDescriptor.label, target, meta);

      // D. Structured State Changes & Diff
      const changes = this.extractChanges(meta);

      return {
        id: log.id,
        action: log.action,
        actionLabel: actionDescriptor.label,
        actionCategory: actionDescriptor.category,
        badgeVariant: actionDescriptor.variant,
        entityType: log.entityType,
        entityId: log.entityId,
        createdAt: log.createdAt,
        actor: {
          id: log.actor?.id || log.actorId,
          name: actorName,
          email: log.actor?.email || null,
          initials: log.actor?.firstName ? log.actor.firstName[0].toUpperCase() : 'S'
        },
        target,
        narrative,
        changes,
        metadata: log.metadata || {}
      };
    });
  }

  /**
   * Translates internal action identifiers into human-readable labels and badge styles
   */
  static describeAction(action = '', entityType = '') {
    const act = action.toLowerCase();

    // User & Identity
    if (act === 'user.bulk_suspended') {
      return { label: 'Bulk Suspended Users', category: 'security', variant: 'danger' };
    }
    if (act === 'user.bulk_active' || act === 'user.bulk_activated') {
      return { label: 'Bulk Activated Users', category: 'security', variant: 'success' };
    }
    if (act === 'user.suspended') {
      return { label: 'Suspended User', category: 'security', variant: 'danger' };
    }
    if (act === 'user.active' || act === 'user.activated') {
      return { label: 'Activated User', category: 'security', variant: 'success' };
    }
    if (act === 'user.created') {
      return { label: 'Created Account', category: 'security', variant: 'success' };
    }
    if (act === 'user.roles_updated' || act === 'user.role_assigned') {
      return { label: 'Updated User Roles', category: 'security', variant: 'purple' };
    }
    if (act === 'user.bulk_role_assigned') {
      return { label: 'Bulk Assigned Roles', category: 'security', variant: 'purple' };
    }
    if (act === 'author.approved') {
      return { label: 'Approved Author Application', category: 'editorial', variant: 'success' };
    }
    if (act === 'author.rejected') {
      return { label: 'Rejected Author Application', category: 'editorial', variant: 'danger' };
    }

    // Article & Editorial
    if (act === 'article.published' || act === 'article.publish') {
      return { label: 'Published Article', category: 'editorial', variant: 'success' };
    }
    if (act === 'article.approved' || act === 'article.approve') {
      return { label: 'Approved Article', category: 'editorial', variant: 'success' };
    }
    if (act === 'article.scheduled') {
      return { label: 'Scheduled Article', category: 'editorial', variant: 'info' };
    }
    if (act === 'article.rejected' || act === 'article.reject') {
      return { label: 'Rejected Manuscript', category: 'editorial', variant: 'danger' };
    }
    if (act === 'article.submitted') {
      return { label: 'Submitted for Review', category: 'editorial', variant: 'info' };
    }
    if (act === 'article.archived' || act === 'article.unpublished') {
      return { label: 'Unpublished Article', category: 'editorial', variant: 'warning' };
    }
    if (act === 'article.deleted') {
      return { label: 'Deleted Article', category: 'editorial', variant: 'danger' };
    }

    // Comments & Moderation
    if (act === 'comment.hidden') {
      return { label: 'Quarantined Comment', category: 'moderation', variant: 'warning' };
    }
    if (act === 'comment.deleted') {
      return { label: 'Purged Comment', category: 'moderation', variant: 'danger' };
    }
    if (act === 'comment.restored' || act === 'comment.approved' || act === 'comment.visible') {
      return { label: 'Restored Comment Visibility', category: 'moderation', variant: 'success' };
    }
    if (act === 'report.dismissed') {
      return { label: 'Dismissed Report', category: 'moderation', variant: 'neutral' };
    }

    // Taxonomy (Categories & Tags)
    if (act === 'category.created') {
      return { label: 'Created Category', category: 'taxonomy', variant: 'success' };
    }
    if (act === 'category.updated') {
      return { label: 'Updated Category', category: 'taxonomy', variant: 'info' };
    }
    if (act === 'category.deleted') {
      return { label: 'Deleted Category', category: 'taxonomy', variant: 'danger' };
    }
    if (act === 'category.merged' || act === 'category.merge') {
      return { label: 'Merged Category', category: 'taxonomy', variant: 'purple' };
    }
    if (act === 'tag.created') {
      return { label: 'Created Tag', category: 'taxonomy', variant: 'success' };
    }
    if (act === 'tag.deleted') {
      return { label: 'Deleted Tag', category: 'taxonomy', variant: 'danger' };
    }

    // Contact Inquiries
    if (act === 'contact.status_update' || act === 'contact.updated') {
      return { label: 'Updated Inquiry Status', category: 'inquiry', variant: 'info' };
    }
    if (act === 'contact.deleted') {
      return { label: 'Deleted Inquiry', category: 'inquiry', variant: 'danger' };
    }
    if (act === 'contact.bulk_status_update') {
      return { label: 'Bulk Updated Inquiries', category: 'inquiry', variant: 'info' };
    }

    // Media
    if (act === 'media.deleted' || act === 'media.force_deleted') {
      return { label: 'Deleted Media Asset', category: 'media', variant: 'danger' };
    }

    // Settings
    if (act === 'system.settings_update' || act === 'settings.updated') {
      return { label: 'Updated System Settings', category: 'system', variant: 'purple' };
    }

    // Fallback
    const formatted = action
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { label: formatted, category: 'general', variant: 'neutral' };
  }

  /**
   * Generates a plain-English narrative sentence of what occurred
   */
  static buildNarrative(actorName, actionLabel, target, meta) {
    const reasonText = meta.reason ? ` Reason: "${meta.reason}"` : '';

    if (target.isBulk) {
      return `${actorName} performed ${actionLabel} on ${target.name}.${reasonText}`;
    }

    return `${actorName} performed ${actionLabel} on ${target.type} "${target.name}".${reasonText}`;
  }

  /**
   * Extracts visual diffs and status transitions from metadata
   */
  static extractChanges(meta) {
    const changes = {};

    if (meta.previousStatus || meta.newStatus) {
      changes.status = {
        from: meta.previousStatus || null,
        to: meta.newStatus || null
      };
    }

    if (meta.previousRoles || meta.roles || meta.newRoles) {
      changes.roles = {
        from: Array.isArray(meta.previousRoles) ? meta.previousRoles.join(', ') : meta.previousRoles,
        to: Array.isArray(meta.roles || meta.newRoles) ? (meta.roles || meta.newRoles).join(', ') : (meta.roles || meta.newRoles)
      };
    }

    if (meta.reason) {
      changes.reason = meta.reason;
    }

    if (meta.targetCategory) {
      changes.mergedInto = meta.targetCategory;
    }

    if (meta.updatedFields && typeof meta.updatedFields === 'object') {
      changes.fields = meta.updatedFields;
    }

    return changes;
  }

  /**
   * Formats system setting keys (e.g. 'policies' -> 'Platform Policies')
   */
  static formatSettingKey(key = '') {
    const map = {
      policies: 'Platform Signup & Registration Policies',
      general: 'General Platform Settings',
      editorial: 'Editorial & Peer Review Workflow',
      seo: 'Global SEO & OpenGraph Settings',
      security: 'Security & Session Inactivity Rules'
    };
    return map[key] || `System Setting: ${key}`;
  }
}
