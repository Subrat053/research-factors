import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext.jsx';
import { useConfirm } from '../../context/ModalContext.jsx';
import {
  FileText,
  Layers,
  Database,
  BookOpen,
  Search,
  Globe,
  AlertCircle,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { articlesApi } from '../../services/articles.api.js';
import { adminApi } from '../../services/admin.api.js';
import { normalizeMediaUrl } from '../../services/media.api.js';
import { seoApi } from '../../services/seo.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';

// Modular Workspace Tab Components
import { ArticleWorkspaceHeader } from '../../components/author/ArticleWorkspaceHeader.jsx';
import { ArticleOverviewTab } from '../../components/author/ArticleOverviewTab.jsx';
import { ArticleContentTab } from '../../components/author/ArticleContentTab.jsx';
import { ArticleResearchDataTab } from '../../components/author/ArticleResearchDataTab.jsx';
import { ArticleSourcesTab } from '../../components/author/ArticleSourcesTab.jsx';
import { ArticleSeoTab } from '../../components/author/ArticleSeoTab.jsx';
import { ArticlePublishingTab } from '../../components/author/ArticlePublishingTab.jsx';

const slugify = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const getGeneratedArticleSeo = (data = {}, categoriesList = []) => {
  const cleanTitle = (data.title || '').trim();
  const title = cleanTitle ? `${cleanTitle} | Research Factors` : 'Untitled Manuscript | Research Factors';
  const cleanExcerpt = (data.excerpt || '').trim();
  const description = cleanExcerpt
    ? (cleanExcerpt.length > 160 ? cleanExcerpt.slice(0, 157).trim() + '...' : cleanExcerpt)
    : 'Empirical research findings, methodologies, and analysis published on Research Factors.';
  const slug = data.slug || slugify(cleanTitle) || 'article-slug';

  let categorySlug = 'research';
  if (data.category && typeof data.category === 'object' && data.category.slug) {
    categorySlug = data.category.slug;
  } else if (data.categorySlug) {
    categorySlug = data.categorySlug;
  } else if (data.categoryId && Array.isArray(categoriesList)) {
    const matched = categoriesList.find(c => c.id === data.categoryId);
    if (matched?.slug) categorySlug = matched.slug;
  } else if (data.categoryName) {
    categorySlug = slugify(data.categoryName);
  }

  const canonicalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/rf/${categorySlug}/${slug}`
    : `/rf/${categorySlug}/${slug}`;
  const ogImage = normalizeMediaUrl(data.coverImageUrl || '') ||
    (typeof window !== 'undefined' ? `${window.location.origin}/images/og-default.png` : '/images/og-default.png');

  return {
    title,
    description,
    canonicalUrl,
    ogTitle: title,
    ogDescription: description,
    ogImage
  };
};

export default function ArticleEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const confirm = useConfirm();

  // Dynamic RBAC Permission Checks
  const canCreate = hasPermission('article.create');
  const canSubmit = hasPermission('article.submit');
  const canUploadMedia = hasPermission('media.upload');
  const canPublish = hasPermission('article.publish');
  const canUpdateAny = hasPermission('article.update_any');

  // RBAC SEO Gating: Authors without publishing/update_any permissions cannot manage SEO
  const canAccessSeo = canPublish || canUpdateAny || user?.role === 'ADMIN' || user?.role === 'EDITOR' || user?.role === 'SUPER_ADMIN';

  const [currentId, setCurrentId] = useState(id && id !== 'new' ? id : null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'content' | 'research' | 'sources' | 'seo' | 'publishing'

  const [article, setArticle] = useState({
    title: '',
    subtitle: '',
    excerpt: '',
    coverImageUrl: '',
    coverImageAlt: '',
    categoryId: '',
    type: 'RESEARCH',
    tags: [],
    status: 'DRAFT',
    isSponsored: false,
    sponsorName: '',
    sponsorDescription: '',
    sponsorUrl: '',
    sponsorLogoUrl: '',
    methodologyEnvironment: '',
    sampleSize: '',
    datasetUrl: '',
    methodologyNotes: '',
    sources: [],
    seoTitle: '',
    isSeoTitleCustom: false,
    seoDescription: '',
    isSeoDescCustom: false,
    canonicalUrl: '',
    isCanonicalCustom: false,
    focusKeyword: '',
    secondaryKeywords: [],
    isNoIndex: false,
    isNoFollow: false,
    customOgTitle: '',
    isOgTitleCustom: false,
    customOgDescription: '',
    isOgDescCustom: false,
    customOgImage: '',
    isOgImageCustom: false,
    schemaType: 'ScholarlyArticle',
    rejectionReason: null,
    hasUnpublishedChanges: false,
    blocks: [
      {
        id: 'block-1',
        blockType: 'paragraph',
        position: 0,
        content: { text: 'Begin drafting your research findings here...' }
      }
    ]
  });

  const [seoMetadata, setSeoMetadata] = useState(null);
  const [resolvedSeo, setResolvedSeo] = useState(null);
  const [isRegeneratingSeo, setIsRegeneratingSeo] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null); // { type: 'error' | 'success', message: '' }

  // Dynamic Category & Topic Tags states
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const autosaveTimerRef = useRef(null);

  // Dynamic Tag Autocomplete search
  useEffect(() => {
    if (!tagInput || tagInput.trim().length < 1) {
      setSuggestedTags([]);
      return;
    }
    const cleanQuery = tagInput.trim().replace(/^#+/, '');
    const timer = setTimeout(() => {
      articlesApi.getTags({ search: cleanQuery, limit: 6 })
        .then(res => setSuggestedTags(res.data || []))
        .catch(() => setSuggestedTags([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [tagInput]);

  // Auto-dismiss alert banners after 5 seconds
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  // 1. Fetch categories
  useEffect(() => {
    articlesApi.getCategories()
      .then(res => setCategories(res.data || []))
      .catch(() => { });
  }, []);

  // 2. Fetch existing article if editing
  useEffect(() => {
    if (id && id !== 'new') {
      setCurrentId(id);
      setLoading(true);
      articlesApi.getDraft(id)
        .then(res => {
          if (res.data) {
            const data = res.data;
            if (data.seoMetadata) setSeoMetadata(data.seoMetadata);
            if (data.seo) setResolvedSeo(data.seo);

            const seoMeta = data.seoMetadata || {};
            const generated = getGeneratedArticleSeo(data, categories);

            const hasCustomTitle = Boolean(seoMeta.customTitle);
            const hasCustomDesc = Boolean(seoMeta.customDescription);
            const hasCustomCanonical = Boolean(seoMeta.customCanonicalUrl);
            const hasCustomOgTitle = Boolean(seoMeta.customOgTitle);
            const hasCustomOgDesc = Boolean(seoMeta.customOgDescription);
            const hasCustomOgImage = Boolean(seoMeta.customOgImage);

            const initialSeoTitle = hasCustomTitle
              ? seoMeta.customTitle
              : (seoMeta.generatedTitle || data.seoTitle || generated.title);
            const initialSeoDesc = hasCustomDesc
              ? seoMeta.customDescription
              : (seoMeta.generatedDescription || data.seoDescription || generated.description);
            const initialCanonical = hasCustomCanonical
              ? seoMeta.customCanonicalUrl
              : (seoMeta.generatedCanonicalUrl || data.canonicalUrl || generated.canonicalUrl);
            const initialOgTitle = hasCustomOgTitle
              ? seoMeta.customOgTitle
              : (seoMeta.generatedOgTitle || initialSeoTitle);
            const initialOgDesc = hasCustomOgDesc
              ? seoMeta.customOgDescription
              : (seoMeta.generatedOgDescription || initialSeoDesc);
            const initialOgImage = hasCustomOgImage
              ? seoMeta.customOgImage
              : (seoMeta.generatedOgImage || normalizeMediaUrl(data.coverImageUrl || '') || generated.ogImage);

            const firstTagName = Array.isArray(data.tags) && data.tags.length > 0
              ? (typeof data.tags[0] === 'string' ? data.tags[0] : (data.tags[0].name || data.tags[0].slug || ''))
              : '';
            const initialFocusKeyword = seoMeta.focusKeyword || firstTagName;

            setArticle({
              title: data.title || '',
              subtitle: data.subtitle || '',
              excerpt: data.excerpt || '',
              coverImageUrl: normalizeMediaUrl(data.coverImageUrl || ''),
              coverImageAlt: data.coverImageAlt || '',
              categoryId: data.category?.id || data.categoryId || '',
              type: data.type || 'RESEARCH',
              tags: Array.isArray(data.tags) ? data.tags : [],
              status: data.status || 'DRAFT',
              isSponsored: Boolean(data.isSponsored),
              sponsorName: data.sponsorName || '',
              sponsorDescription: data.sponsorDescription || '',
              sponsorUrl: data.sponsorUrl || '',
              sponsorLogoUrl: data.sponsorLogoUrl || '',
              methodologyEnvironment: data.methodologyEnvironment || '',
              sampleSize: data.sampleSize || '',
              datasetUrl: data.datasetUrl || '',
              methodologyNotes: data.methodologyNotes || '',
              sources: Array.isArray(data.sources) ? data.sources : [],
              seoTitle: initialSeoTitle,
              isSeoTitleCustom: hasCustomTitle,
              seoDescription: initialSeoDesc,
              isSeoDescCustom: hasCustomDesc,
              canonicalUrl: initialCanonical,
              isCanonicalCustom: hasCustomCanonical,
              focusKeyword: initialFocusKeyword,
              secondaryKeywords: seoMeta.secondaryKeywords || [],
              isNoIndex: Boolean(seoMeta.isNoIndex),
              isNoFollow: Boolean(seoMeta.isNoFollow),
              customOgTitle: initialOgTitle,
              isOgTitleCustom: hasCustomOgTitle,
              customOgDescription: initialOgDesc,
              isOgDescCustom: hasCustomOgDesc,
              customOgImage: initialOgImage,
              isOgImageCustom: hasCustomOgImage,
              schemaType: seoMeta.schemaType || 'ScholarlyArticle',
              rejectionReason: data.rejectionReason || null,
              hasUnpublishedChanges: Boolean(data.hasUnpublishedChanges),
              blocks: Array.isArray(data.blocks) && data.blocks.length > 0
                ? data.blocks.map((b, idx) => ({
                  id: b.id || `block-${idx}`,
                  blockType: b.blockType || b.type || 'paragraph',
                  position: b.position ?? idx,
                  content: b.blockType === 'image' && b.content?.url
                    ? { ...b.content, url: normalizeMediaUrl(b.content.url) }
                    : (b.content || {})
                }))
                : [
                  {
                    id: 'block-1',
                    blockType: 'paragraph',
                    position: 0,
                    content: { text: 'Begin drafting your research findings here...' }
                  }
                ]
            });
          }
        })
        .catch(err => {
          articlesApi.getMyArticles()
            .then(res => {
              const found = (res.data || []).find(a => a.id === id);
              if (found) {
                if (found.seoMetadata) setSeoMetadata(found.seoMetadata);
                if (found.seo) setResolvedSeo(found.seo);

                const seoMeta = found.seoMetadata || {};
                const generated = getGeneratedArticleSeo(found, categories);

                const hasCustomTitle = Boolean(seoMeta.customTitle);
                const hasCustomDesc = Boolean(seoMeta.customDescription);
                const hasCustomCanonical = Boolean(seoMeta.customCanonicalUrl);
                const hasCustomOgTitle = Boolean(seoMeta.customOgTitle);
                const hasCustomOgDesc = Boolean(seoMeta.customOgDescription);
                const hasCustomOgImage = Boolean(seoMeta.customOgImage);

                const initialSeoTitle = hasCustomTitle
                  ? seoMeta.customTitle
                  : (seoMeta.generatedTitle || found.seoTitle || generated.title);
                const initialSeoDesc = hasCustomDesc
                  ? seoMeta.customDescription
                  : (seoMeta.generatedDescription || found.seoDescription || generated.description);
                const initialCanonical = hasCustomCanonical
                  ? seoMeta.customCanonicalUrl
                  : (seoMeta.generatedCanonicalUrl || found.canonicalUrl || generated.canonicalUrl);
                const initialOgTitle = hasCustomOgTitle
                  ? seoMeta.customOgTitle
                  : (seoMeta.generatedOgTitle || initialSeoTitle);
                const initialOgDesc = hasCustomOgDesc
                  ? seoMeta.customOgDescription
                  : (seoMeta.generatedOgDescription || initialSeoDesc);
                const initialOgImage = hasCustomOgImage
                  ? seoMeta.customOgImage
                  : (seoMeta.generatedOgImage || normalizeMediaUrl(found.coverImageUrl || '') || generated.ogImage);

                const firstTagName = Array.isArray(found.tags) && found.tags.length > 0
                  ? (typeof found.tags[0] === 'string' ? found.tags[0] : (found.tags[0].name || found.tags[0].slug || ''))
                  : '';
                const initialFocusKeyword = seoMeta.focusKeyword || firstTagName;

                setArticle({
                  title: found.title || '',
                  subtitle: found.subtitle || '',
                  excerpt: found.excerpt || '',
                  coverImageUrl: normalizeMediaUrl(found.coverImageUrl || ''),
                  coverImageAlt: found.coverImageAlt || '',
                  categoryId: found.category?.id || found.categoryId || '',
                  type: found.type || 'RESEARCH',
                  tags: Array.isArray(found.tags) ? found.tags : [],
                  status: found.status || 'DRAFT',
                  isSponsored: Boolean(found.isSponsored),
                  sponsorName: found.sponsorName || '',
                  sponsorDescription: found.sponsorDescription || '',
                  sponsorUrl: found.sponsorUrl || '',
                  sponsorLogoUrl: found.sponsorLogoUrl || '',
                  methodologyEnvironment: found.methodologyEnvironment || '',
                  sampleSize: found.sampleSize || '',
                  datasetUrl: found.datasetUrl || '',
                  methodologyNotes: found.methodologyNotes || '',
                  sources: Array.isArray(found.sources) ? found.sources : [],
                  seoTitle: initialSeoTitle,
                  isSeoTitleCustom: hasCustomTitle,
                  seoDescription: initialSeoDesc,
                  isSeoDescCustom: hasCustomDesc,
                  canonicalUrl: initialCanonical,
                  isCanonicalCustom: hasCustomCanonical,
                  focusKeyword: initialFocusKeyword,
                  secondaryKeywords: seoMeta.secondaryKeywords || [],
                  isNoIndex: Boolean(seoMeta.isNoIndex),
                  isNoFollow: Boolean(seoMeta.isNoFollow),
                  customOgTitle: initialOgTitle,
                  isOgTitleCustom: hasCustomOgTitle,
                  customOgDescription: initialOgDesc,
                  isOgDescCustom: hasCustomOgDesc,
                  customOgImage: initialOgImage,
                  isOgImageCustom: hasCustomOgImage,
                  schemaType: seoMeta.schemaType || 'ScholarlyArticle',
                  rejectionReason: found.rejectionReason || null,
                  hasUnpublishedChanges: Boolean(found.hasUnpublishedChanges),
                  blocks: Array.isArray(found.blocks) && found.blocks.length > 0
                    ? found.blocks.map(b => b.blockType === 'image' && b.content?.url ? { ...b, content: { ...b.content, url: normalizeMediaUrl(b.content.url) } } : b)
                    : [
                      {
                        id: 'block-1',
                        blockType: 'paragraph',
                        position: 0,
                        content: { text: 'Begin drafting your research findings here...' }
                      }
                    ]
                });
              }
            })
            .catch(() => {
              setActiveAlert({
                type: 'error',
                message: err.message || 'Unable to retrieve draft article'
              });
            });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Debounced Autosave Trigger (2500ms) only if draft already exists in DB
  const triggerAutosave = (updatedData) => {
    setSaveStatus('unsaved');
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      if (currentId) {
        try {
          setSaveStatus('saving');
          const res = await articlesApi.updateDraft(currentId, updatedData);
          if (res.data?.hasUnpublishedChanges !== undefined) {
            setArticle(prev => ({ ...prev, hasUnpublishedChanges: res.data.hasUnpublishedChanges }));
          }
          setSaveStatus('saved');
        } catch {
          setSaveStatus('unsaved');
        }
      }
    }, 2500);
  };

  const handleChange = (field, value) => {
    let updated;
    if (typeof field === 'object' && field !== null) {
      updated = { ...article, ...field };
    } else {
      updated = { ...article, [field]: value };
    }

    // Live auto-synchronize generated SEO into input fields when article content changes
    if (typeof field === 'string') {
      if (field === 'title') {
        const generated = getGeneratedArticleSeo({ ...updated, title: value }, categories);
        if (!updated.isSeoTitleCustom) {
          updated.seoTitle = generated.title;
        }
        if (!updated.isCanonicalCustom) {
          updated.canonicalUrl = generated.canonicalUrl;
        }
        if (!updated.isOgTitleCustom) {
          updated.customOgTitle = generated.ogTitle;
        }
      } else if (field === 'categoryId') {
        const generated = getGeneratedArticleSeo({ ...updated, categoryId: value }, categories);
        if (!updated.isCanonicalCustom) {
          updated.canonicalUrl = generated.canonicalUrl;
        }
      } else if (field === 'excerpt') {
        const generated = getGeneratedArticleSeo({ ...updated, excerpt: value }, categories);
        if (!updated.isSeoDescCustom) {
          updated.seoDescription = generated.description;
        }
        if (!updated.isOgDescCustom) {
          updated.customOgDescription = generated.ogDescription;
        }
      } else if (field === 'coverImageUrl') {
        const generated = getGeneratedArticleSeo({ ...updated, coverImageUrl: value }, categories);
        if (!updated.isOgImageCustom) {
          updated.customOgImage = generated.ogImage;
        }
      }
    }

    setArticle(updated);
    triggerAutosave(updated);
  };

  const handleAddTag = (tagToAdd) => {
    let clean = (typeof tagToAdd === 'string' ? tagToAdd : (tagToAdd.name || tagToAdd.slug || '')).trim();
    if (!clean) return;
    clean = clean.replace(/^#+/, '').trim();
    if (!clean) return;

    const cleanSlug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existingSlugs = (article.tags || []).map(t =>
      (typeof t === 'string' ? t.replace(/^#+/, '') : (t.slug || t.name || '')).toLowerCase().replace(/[^a-z0-9]+/g, '-')
    );

    if (existingSlugs.includes(cleanSlug)) {
      setTagInput('');
      setShowTagSuggestions(false);
      return;
    }

    if ((article.tags || []).length >= 8) {
      setActiveAlert({ type: 'error', message: 'Maximum 8 topic tags allowed per article' });
      return;
    }

    const tagObj = (typeof tagToAdd === 'object' && tagToAdd.id)
      ? tagToAdd
      : { name: clean, slug: cleanSlug };

    const updatedTags = [...(article.tags || []), tagObj];
    const updates = { tags: updatedTags };
    if (!article.focusKeyword) {
      updates.focusKeyword = clean;
    }
    handleChange(updates);
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (indexToRemove) => {
    const updatedTags = (article.tags || []).filter((_, idx) => idx !== indexToRemove);
    handleChange('tags', updatedTags);
  };

  // Explicit Save Draft Button Action
  const handleSaveDraft = async () => {
    setActiveAlert(null);

    if (!article.title || article.title.trim().length < 5) {
      setActiveAlert({
        type: 'error',
        message: 'Article title must be at least 5 characters long before saving.'
      });
      return null;
    }

    const hasCategory = article.categoryId || (isCustomCategory && customCategoryName.trim().length >= 2);
    if (!hasCategory) {
      setActiveAlert({
        type: 'error',
        message: 'Please select or specify a primary research category for your article'
      });
      return null;
    }

    setSavingDraft(true);
    setSaveStatus('saving');

    const payload = {
      ...article,
      tags: article.tags || [],
      ...(isCustomCategory && customCategoryName.trim()
        ? { categoryName: customCategoryName.trim(), categoryId: '' }
        : { categoryId: article.categoryId })
    };

    try {
      if (!currentId) {
        const res = await articlesApi.createDraft(payload);
        const newId = res.data.id;
        setCurrentId(newId);
        if (res.data?.seoMetadata) setSeoMetadata(res.data.seoMetadata);
        if (res.data?.seo) setResolvedSeo(res.data.seo);
        setSaveStatus('saved');
        setActiveAlert({
          type: 'success',
          message: 'Article draft created and saved successfully!'
        });
        navigate(`/admin/editor/${newId}`, { replace: true });
        return newId;
      } else {
        const res = await articlesApi.updateDraft(currentId, payload);
        if (res.data?.seoMetadata) setSeoMetadata(res.data.seoMetadata);
        if (res.data?.seo) setResolvedSeo(res.data.seo);
        if (res.data?.hasUnpublishedChanges !== undefined) {
          setArticle(prev => ({ ...prev, hasUnpublishedChanges: res.data.hasUnpublishedChanges }));
        }
        setSaveStatus('saved');
        setActiveAlert({
          type: 'success',
          message: article.status === 'PUBLISHED'
            ? 'Article draft modifications saved without altering live publication!'
            : 'Article draft saved successfully!'
        });
        return currentId;
      }
    } catch (err) {
      setSaveStatus('unsaved');
      setActiveAlert({
        type: 'error',
        message: err.message || 'Failed to save draft. Please verify server connectivity.'
      });
      return null;
    } finally {
      setSavingDraft(false);
    }
  };

  const handleRegenerateSeo = async () => {
    if (!currentId) {
      setActiveAlert({
        type: 'error',
        message: 'Please save your draft first before regenerating SEO metadata.'
      });
      return;
    }
    setIsRegeneratingSeo(true);
    try {
      const res = await seoApi.regenerateSeo('ARTICLE', currentId);
      if (res.data) {
        setSeoMetadata(res.data);
        const resolved = await seoApi.resolveSeo({ type: 'ARTICLE', id: currentId });
        if (resolved?.seo) setResolvedSeo(resolved.seo);

        const updated = {
          ...article,
          seoTitle: res.data.generatedTitle || article.seoTitle,
          isSeoTitleCustom: false,
          seoDescription: res.data.generatedDescription || article.seoDescription,
          isSeoDescCustom: false,
          canonicalUrl: res.data.generatedCanonicalUrl || article.canonicalUrl,
          isCanonicalCustom: false,
          customOgTitle: res.data.generatedOgTitle || res.data.generatedTitle || article.customOgTitle,
          isOgTitleCustom: false,
          customOgDescription: res.data.generatedOgDescription || res.data.generatedDescription || article.customOgDescription,
          isOgDescCustom: false,
          customOgImage: res.data.generatedOgImage || article.customOgImage,
          isOgImageCustom: false
        };
        setArticle(updated);
        triggerAutosave(updated);

        setActiveAlert({
          type: 'success',
          message: 'SEO metadata regenerated and populated into editor input fields successfully!'
        });
      }
    } catch (err) {
      setActiveAlert({
        type: 'error',
        message: err.message || 'Failed to regenerate SEO metadata.'
      });
    } finally {
      setIsRegeneratingSeo(false);
    }
  };

  const handlePreviewInNewTab = async () => {
    let targetId = currentId;
    if (!targetId || saveStatus === 'unsaved') {
      targetId = await handleSaveDraft();
    }
    if (targetId) {
      window.open(`/research/preview/${targetId}`, '_blank');
    }
  };

  const handleSubmitForReview = async () => {
    setActiveAlert(null);

    if (!canSubmit) {
      setActiveAlert({
        type: 'error',
        message: 'Permission denied: Your account role does not have permission to submit articles for review.'
      });
      return;
    }

    if (!article.title || article.title.trim().length < 5) {
      setActiveAlert({
        type: 'error',
        message: 'Article title must be at least 5 characters long before submission.'
      });
      return;
    }

    const hasCategory = article.categoryId || (isCustomCategory && customCategoryName.trim().length >= 2);
    if (!hasCategory) {
      setActiveAlert({
        type: 'error',
        message: 'Please select or specify a primary category before submitting for review.'
      });
      return;
    }

    if (!article.blocks || article.blocks.length === 0) {
      setActiveAlert({
        type: 'error',
        message: 'Please add at least one content block to your article'
      });
      return;
    }

    if (article.status === 'PENDING_REVIEW') {
      setActiveAlert({
        type: 'error',
        message: 'This article has already been submitted and is currently undergoing peer editorial review.'
      });
      return;
    }

    setSubmitting(true);
    const payload = {
      ...article,
      tags: article.tags || [],
      ...(isCustomCategory && customCategoryName.trim()
        ? { categoryName: customCategoryName.trim(), categoryId: '' }
        : { categoryId: article.categoryId })
    };

    try {
      let targetId = currentId;
      if (!targetId) {
        const res = await articlesApi.createDraft(payload);
        targetId = res.data.id;
        setCurrentId(targetId);
      } else {
        await articlesApi.updateDraft(targetId, payload);
      }

      await articlesApi.submitForReview(targetId);
      setArticle(prev => ({ ...prev, status: 'PENDING_REVIEW' }));
      setSaveStatus('saved');
      setActiveAlert({
        type: 'success',
        message: 'Article successfully submitted for peer editorial review!'
      });
    } catch (err) {
      setActiveAlert({
        type: 'error',
        message: err.message || 'Failed to submit article for review. Please check all required fields.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectPublish = async () => {
    setActiveAlert(null);

    if (!canPublish) {
      setActiveAlert({
        type: 'error',
        message: 'Permission denied: Your account role does not have permission to publish articles directly.'
      });
      return;
    }

    if (!article.title || article.title.trim().length < 3) {
      setActiveAlert({
        type: 'error',
        message: 'Article title must be at least 3 characters long before publishing.'
      });
      return;
    }

    const hasCategory = article.categoryId || (isCustomCategory && customCategoryName.trim().length >= 2);
    if (!hasCategory) {
      setActiveAlert({
        type: 'error',
        message: 'Please select or specify a primary category before publishing.'
      });
      return;
    }

    if (!article.blocks || article.blocks.length === 0) {
      setActiveAlert({
        type: 'error',
        message: 'Please add at least one content block to your article before publishing.'
      });
      return;
    }

    setSubmitting(true);
    const payload = {
      ...article,
      tags: article.tags || [],
      ...(isCustomCategory && customCategoryName.trim()
        ? { categoryName: customCategoryName.trim(), categoryId: '' }
        : { categoryId: article.categoryId })
    };

    try {
      let targetId = currentId;
      if (!targetId) {
        const res = await articlesApi.createDraft(payload);
        targetId = res.data.id;
        setCurrentId(targetId);
        navigate(`/admin/editor/${targetId}`, { replace: true });
      } else {
        await articlesApi.updateDraft(targetId, payload);
      }

      await adminApi.publishArticle(targetId);
      setArticle(prev => ({ ...prev, status: 'PUBLISHED' }));
      setSaveStatus('saved');
      setActiveAlert({
        type: 'success',
        message: 'Article published live to public magazine successfully!'
      });
    } catch (err) {
      setActiveAlert({
        type: 'error',
        message: err.response?.data?.error?.message || err.message || 'Failed to publish article.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnpublish = async () => {
    if (!currentId) return;
    const ok = await confirm({
      title: 'Unpublish Manuscript',
      message: `Are you sure you want to unpublish '${article.title || 'this article'}' and return it to the archive? It will no longer be visible to the public.`,
      confirmText: 'Unpublish',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    if (!ok) return;

    setSubmitting(true);
    try {
      await adminApi.archiveArticle(currentId);
      setArticle(prev => ({ ...prev, status: 'ARCHIVED' }));
      setSaveStatus('saved');
      setActiveAlert({
        type: 'success',
        message: 'Article unpublished and moved to archive.'
      });
    } catch (err) {
      setActiveAlert({
        type: 'error',
        message: err.response?.data?.error?.message || err.message || 'Failed to unpublish article.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleModifyChanges = async () => {
    setActiveAlert(null);

    if (!article.title || article.title.trim().length < 3) {
      setActiveAlert({
        type: 'error',
        message: 'Article title must be at least 3 characters long before applying modifications.'
      });
      return;
    }

    const hasCategory = article.categoryId || (isCustomCategory && customCategoryName.trim().length >= 2);
    if (!hasCategory) {
      setActiveAlert({
        type: 'error',
        message: 'Please select or specify a primary category before applying modifications.'
      });
      return;
    }

    if (!article.blocks || article.blocks.length === 0) {
      setActiveAlert({
        type: 'error',
        message: 'Please ensure at least one content block exists in your article.'
      });
      return;
    }

    setSubmitting(true);
    const payload = {
      ...article,
      tags: article.tags || [],
      ...(isCustomCategory && customCategoryName.trim()
        ? { categoryName: customCategoryName.trim(), categoryId: '' }
        : { categoryId: article.categoryId })
    };

    try {
      let targetId = currentId;
      if (!targetId) {
        const res = await articlesApi.createDraft(payload);
        targetId = res.data.id;
        setCurrentId(targetId);
        navigate(`/admin/editor/${targetId}`, { replace: true });
      }

      const res = await articlesApi.modifyChanges(targetId, payload);
      const isLive = res.publishedLive || res.data?.status === 'PUBLISHED';

      setArticle(prev => ({
        ...prev,
        status: isLive ? 'PUBLISHED' : 'PENDING_REVIEW',
        hasUnpublishedChanges: false
      }));
      setSaveStatus('saved');
      setActiveAlert({
        type: 'success',
        message: isLive
          ? 'Article modifications published live to digital magazine successfully!'
          : 'Article modifications submitted for peer editorial review!'
      });
    } catch (err) {
      setActiveAlert({
        type: 'error',
        message: err.response?.data?.error?.message || err.message || 'Failed to modify article.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!currentId) return;
    const ok = await confirm({
      title: 'Discard Draft Changes',
      message: 'Are you sure you want to discard your draft edits? The workspace will revert back to the currently live published version of this article.',
      confirmText: 'Discard Changes',
      cancelText: 'Keep Editing',
      variant: 'warning'
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await articlesApi.discardDraft(currentId);
      if (res.data) {
        const data = res.data;
        setArticle(prev => ({
          ...prev,
          title: data.title || '',
          subtitle: data.subtitle || '',
          excerpt: data.excerpt || '',
          coverImageUrl: normalizeMediaUrl(data.coverImageUrl || ''),
          coverImageAlt: data.coverImageAlt || '',
          categoryId: data.category?.id || data.categoryId || '',
          type: data.type || 'RESEARCH',
          tags: Array.isArray(data.tags) ? data.tags : [],
          status: data.status || 'PUBLISHED',
          hasUnpublishedChanges: false,
          blocks: Array.isArray(data.blocks) && data.blocks.length > 0
            ? data.blocks.map(b => b.blockType === 'image' && b.content?.url ? { ...b, content: { ...b.content, url: normalizeMediaUrl(b.content.url) } } : b)
            : prev.blocks
        }));
        setSaveStatus('saved');
        setActiveAlert({
          type: 'success',
          message: 'Draft modifications discarded. Reverted to live published version.'
        });
      }
    } catch (err) {
      setActiveAlert({
        type: 'error',
        message: err.response?.data?.error?.message || err.message || 'Failed to discard draft changes.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Word count and reading time metrics
  const totalWords = useMemo(() => {
    return [
      article.title || '',
      article.subtitle || '',
      article.excerpt || '',
      ...(article.blocks || []).map(b => {
        if (b.blockType === 'paragraph' || b.blockType === 'heading') return b.content?.text || '';
        if (b.blockType === 'quote') return b.content?.quote || '';
        if (b.blockType === 'callout') return `${b.content?.title || ''} ${b.content?.text || ''}`;
        if (b.blockType === 'list') {
          const items = Array.isArray(b.content?.items) ? b.content.items : [];
          return items.map(it => (typeof it === 'string' ? it : it?.text || '')).join(' ');
        }
        if (b.blockType === 'faq') {
          const items = Array.isArray(b.content?.items) ? b.content.items : [];
          return items.map(it => `${it.question || ''} ${it.answer || ''}`).join(' ');
        }
        return '';
      })
    ].join(' ').trim().split(/\s+/).filter(Boolean).length;
  }, [article.title, article.subtitle, article.excerpt, article.blocks]);

  const estimatedReadingTime = Math.max(1, Math.ceil(totalWords / 200));

  // Workspace Tabs Definition with RBAC SEO Gating
  const visibleTabs = useMemo(() => {
    const tabs = [
      { key: 'overview', label: 'Overview', icon: FileText },
      { key: 'content', label: 'Content', icon: Layers, badge: `${(article.blocks || []).length}` },
      { key: 'research', label: 'Research Data', icon: Database },
      {
        key: 'sources',
        label: 'Sources',
        icon: BookOpen,
        badge: Array.isArray(article.sources) && article.sources.length ? `${article.sources.length}` : undefined
      }
    ];

    // SEO tab is ONLY shown if user has publishing/update_any or editor/admin privileges
    if (canAccessSeo) {
      tabs.push({ key: 'seo', label: 'SEO & Social', icon: Search });
    }

    tabs.push({ key: 'publishing', label: 'Publishing', icon: Globe });

    return tabs;
  }, [article.blocks, article.sources, canAccessSeo]);

  // If user loses permission or direct URL specifies SEO when forbidden, fallback to content
  useEffect(() => {
    if (activeTab === 'seo' && !canAccessSeo) {
      setActiveTab('content');
    }
  }, [activeTab, canAccessSeo]);

  return (
    <AdminLayout
      title={currentId ? 'Writing Space' : 'Draft'}
      subtitle={article.title ? `Working on: "${article.title}"` : 'Structure chapters, empirical benchmarks, and submit for peer review.'}
    >
      <Helmet>
        <title>{article.title ? `${article.title} — Workspace` : 'New Article'} — Research Factors</title>
      </Helmet>

      {/* Sticky Workspace Navigation & Action Header */}
      <div className="-mx-4 sm:-mx-8 -mt-6 mb-6">
        <ArticleWorkspaceHeader
          article={article}
          currentId={currentId}
          saveStatus={saveStatus}
          savingDraft={savingDraft}
          submitting={submitting}
          totalWords={totalWords}
          estimatedReadingTime={estimatedReadingTime}
          canPublish={canPublish}
          canSubmit={canSubmit}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          visibleTabs={visibleTabs}
          onSaveDraft={handleSaveDraft}
          onPreviewLive={handlePreviewInNewTab}
          onSubmitForReview={handleSubmitForReview}
          onDirectPublish={handleDirectPublish}
          onUnpublish={handleUnpublish}
          onModifyChanges={handleModifyChanges}
          onDiscardDraft={handleDiscardDraft}
        />
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Dynamic Alert Banner */}
        {activeAlert && (
          <div
            className={`p-4 rounded-2xl flex items-start justify-between border animate-in fade-in duration-200 ${activeAlert.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
              }`}
          >
            <div className="flex items-start space-x-2.5">
              {activeAlert.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-medium">{activeAlert.message}</p>
            </div>
            <button
              onClick={() => setActiveAlert(null)}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading article workspace...</p>
          </div>
        ) : (
          /* Active Tab Panels */
          <div>
            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <ArticleOverviewTab
                article={article}
                onChange={handleChange}
                categories={categories}
                isCustomCategory={isCustomCategory}
                setIsCustomCategory={setIsCustomCategory}
                customCategoryName={customCategoryName}
                setCustomCategoryName={setCustomCategoryName}
                tagInput={tagInput}
                setTagInput={setTagInput}
                suggestedTags={suggestedTags}
                showTagSuggestions={showTagSuggestions}
                setShowTagSuggestions={setShowTagSuggestions}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                canUploadMedia={canUploadMedia}
                onAlert={setActiveAlert}
                totalWords={totalWords}
                estimatedReadingTime={estimatedReadingTime}
              />
            )}

            {/* Tab 2: Content (Mode A Section Builder / Mode B Full Article Editor) */}
            {activeTab === 'content' && (
              <ArticleContentTab
                blocks={article.blocks}
                onChange={handleChange}
                canUploadMedia={canUploadMedia}
                onAlert={setActiveAlert}
              />
            )}

            {/* Tab 3: Research Data & Underwriting */}
            {activeTab === 'research' && (
              <ArticleResearchDataTab
                article={article}
                onChange={handleChange}
              />
            )}

            {/* Tab 4: Sources & Citations */}
            {activeTab === 'sources' && (
              <ArticleSourcesTab
                article={article}
                onChange={handleChange}
              />
            )}

            {/* Tab 5: SEO & Social (RBAC Gated) */}
            {activeTab === 'seo' && (
              <ArticleSeoTab
                article={article}
                onChange={handleChange}
                seoMetadata={seoMetadata}
                resolvedSeo={resolvedSeo}
                onRegenerate={currentId ? handleRegenerateSeo : null}
                isRegenerating={isRegeneratingSeo}
                canAccessSeo={canAccessSeo}
              />
            )}

            {/* Tab 6: Publishing & Lifecycle */}
            {activeTab === 'publishing' && (
              <ArticlePublishingTab
                article={article}
                currentId={currentId}
                canPublish={canPublish}
                canSubmit={canSubmit}
                savingDraft={savingDraft}
                submitting={submitting}
                onSaveDraft={handleSaveDraft}
                onSubmitForReview={handleSubmitForReview}
                onDirectPublish={handleDirectPublish}
                onUnpublish={handleUnpublish}
                onPreviewLive={handlePreviewInNewTab}
                onModifyChanges={handleModifyChanges}
                onDiscardDraft={handleDiscardDraft}
              />
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
