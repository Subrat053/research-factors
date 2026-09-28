import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext.jsx';
import { useConfirm } from '../../context/ModalContext.jsx';
import {
  Save,
  Send,
  Eye,
  Edit3,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Image as ImageIcon,
  Table as TableIcon,
  Quote,
  AlertTriangle,
  Heading,
  AlignLeft,
  Check,
  Loader2,
  ArrowLeft,
  UploadCloud,
  X,
  Minus,
  Sparkles,
  Info,
  Lightbulb,
  ExternalLink,
  SplitSquareVertical,
  AlertCircle,
  Clock,
  Globe,
  Archive,
  Search,
  Megaphone
} from 'lucide-react';
import { articlesApi } from '../../services/articles.api.js';
import { adminApi } from '../../services/admin.api.js';
import { mediaApi, normalizeMediaUrl } from '../../services/media.api.js';
import { seoApi } from '../../services/seo.api.js';
import { BlockRenderer } from '../../components/article/BlockRenderer.jsx';
import { RichTextEditor } from '../../components/article/RichTextEditor.jsx';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { ArticleSeoStudio } from '../../components/article/ArticleSeoStudio.jsx';

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
  const slug = data.slug || slugify(cleanTitle) || 'manuscript-slug';

  // Dynamic category determination
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

  const [currentId, setCurrentId] = useState(id && id !== 'new' ? id : null);
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
    blocks: [
      {
        id: 'block-1',
        blockType: 'paragraph',
        position: 0,
        content: { text: 'Begin drafting your research findings, empirical methodology, and analysis here...' }
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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverInputMode, setCoverInputMode] = useState('upload'); // 'upload' | 'url'
  const [activeAlert, setActiveAlert] = useState(null); // { type: 'error' | 'success', message: '' }
  const [uploadingBlockIndex, setUploadingBlockIndex] = useState(null);

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
      .catch(() => {});
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
          // Fallback to getMyArticles if getDraft fails
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
                message: err.message || 'Unable to retrieve draft manuscript.'
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
          await articlesApi.updateDraft(currentId, updatedData);
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

    // Live auto-synchronize generated SEO into input fields when manuscript content changes
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

    // Normalize for comparison
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
      setActiveAlert({ type: 'error', message: 'Maximum 8 topic tags allowed per manuscript.' });
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

  const handleBlockContentChange = (index, newContent) => {
    const newBlocks = [...article.blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      content: { ...newBlocks[index].content, ...newContent }
    };
    const updated = { ...article, blocks: newBlocks };
    setArticle(updated);
    triggerAutosave(updated);
  };

  const addBlock = (type) => {
    let initialContent = {};
    if (type === 'heading') {
      initialContent = { level: 2, text: 'New Section Heading' };
    } else if (type === 'paragraph') {
      initialContent = { text: 'Write detailed analysis and empirical methodology...' };
    } else if (type === 'quote') {
      initialContent = {
        quote: 'Key empirical statement or quotation.',
        author: 'Principal Researcher',
        source: 'Laboratory Benchmark 2026'
      };
    } else if (type === 'callout') {
      initialContent = {
        variant: 'info',
        title: 'Key Takeaway',
        text: 'Important contextual takeaway or finding for researchers.'
      };
    } else if (type === 'table' || type === 'comparison') {
      initialContent = {
        headers: ['Factor', 'Methodology', 'Benchmark Score'],
        rows: [
          { label: 'Inference Latency', values: ['FP16 TensorRT', '98.4 ms'] },
          { label: 'Energy Consumption', values: ['70W TDP', '0.04 kWh'] }
        ]
      };
    } else if (type === 'image') {
      initialContent = {
        url: '',
        alt: 'Research visualization',
        caption: 'Figure: Comparative analysis of empirical results'
      };
    } else if (type === 'divider') {
      initialContent = {};
    }

    const newBlock = {
      id: `block-${Date.now()}`,
      blockType: type,
      position: article.blocks.length,
      content: initialContent
    };

    const updated = { ...article, blocks: [...article.blocks, newBlock] };
    setArticle(updated);
    triggerAutosave(updated);
  };

  const removeBlock = (index) => {
    const newBlocks = article.blocks
      .filter((_, i) => i !== index)
      .map((b, i) => ({ ...b, position: i }));
    const updated = { ...article, blocks: newBlocks };
    setArticle(updated);
    triggerAutosave(updated);
  };

  const moveBlock = (index, direction) => {
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === article.blocks.length - 1)
    ) {
      return;
    }
    const newBlocks = [...article.blocks];
    const targetIndex = index + direction;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    const reindexed = newBlocks.map((b, i) => ({ ...b, position: i }));
    const updated = { ...article, blocks: reindexed };
    setArticle(updated);
    triggerAutosave(updated);
  };

  // Cover Image Upload Handler
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canUploadMedia) {
      setActiveAlert({
        type: 'error',
        message: 'Permission denied: Your account role does not possess media upload privileges.'
      });
      return;
    }

    setUploadingCover(true);
    setActiveAlert(null);
    try {
      const res = await mediaApi.upload(file, {
        altText: article.coverImageAlt || article.title || 'Article Cover'
      });
      const publicUrl = res.data?.publicUrl || res.publicUrl;
      if (!publicUrl) throw new Error('Failed to obtain uploaded file URL from storage provider.');

      handleChange('coverImageUrl', normalizeMediaUrl(publicUrl));
      setActiveAlert({
        type: 'success',
        message: 'Cover image uploaded and converted to WebP successfully!'
      });
    } catch (err) {
      setActiveAlert({
        type: 'error',
        message: err.message || 'Failed to upload cover image. Please verify file type (JPEG, PNG, WebP) and size (<8MB).'
      });
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  // In-Block Media Image Upload Handler
  const handleBlockImageUpload = async (index, file) => {
    if (!file) return;

    if (!canUploadMedia) {
      setActiveAlert({
        type: 'error',
        message: 'Permission denied: Your account role does not possess media upload privileges.'
      });
      return;
    }

    setUploadingBlockIndex(index);
    setActiveAlert(null);
    try {
      const res = await mediaApi.upload(file, {
        altText: article.blocks[index]?.content?.alt || 'Manuscript Figure'
      });
      const publicUrl = res.data?.publicUrl || res.publicUrl;
      if (!publicUrl) throw new Error('Failed to obtain uploaded asset URL.');

      handleBlockContentChange(index, { url: normalizeMediaUrl(publicUrl) });
      setActiveAlert({
        type: 'success',
        message: 'Block media image uploaded and optimized successfully!'
      });
    } catch (err) {
      setActiveAlert({
        type: 'error',
        message: err.message || 'Failed to upload block media image.'
      });
    } finally {
      setUploadingBlockIndex(null);
    }
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
        message: 'Please select or specify a primary research category for your manuscript.'
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
        setSaveStatus('saved');
        setActiveAlert({
          type: 'success',
          message: 'Article draft saved successfully!'
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

        // Populate regenerated values into input fields and mark them as live-sync auto-generated
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

  // Open live production simulation in a separate tab
  const handlePreviewInNewTab = async () => {
    let targetId = currentId;
    if (!targetId || saveStatus === 'unsaved') {
      targetId = await handleSaveDraft();
    }
    if (targetId) {
      window.open(`/research/preview/${targetId}`, '_blank');
    }
  };

  // Submit for Editorial Review Action
  const handleSubmitForReview = async () => {
    setActiveAlert(null);

    if (!canSubmit) {
      setActiveAlert({
        type: 'error',
        message: 'Permission denied: Your account role does not have permission to submit manuscripts for review.'
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
        message: 'Please add at least one content block to your manuscript.'
      });
      return;
    }

    if (article.status === 'PENDING_REVIEW') {
      setActiveAlert({
        type: 'error',
        message: 'This manuscript has already been submitted and is currently undergoing peer editorial review.'
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

  // Direct publish for admin / publisher
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
        message: 'Please add at least one content block to your manuscript before publishing.'
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

  // Unpublish / archive for admin / publisher
  const handleUnpublish = async () => {
    if (!currentId) return;
    const ok = await confirm({
      title: 'Unpublish Manuscript',
      message: `Are you sure you want to unpublish '${article.title || 'this manuscript'}' and return it to the archive? It will no longer be visible to the public.`,
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

  // Calculate total manuscript words and estimated reading time
  const totalWords = [
    article.title || '',
    article.subtitle || '',
    article.excerpt || '',
    ...(article.blocks || []).map(b => {
      if (b.blockType === 'paragraph' || b.blockType === 'heading') return b.content?.text || '';
      if (b.blockType === 'quote') return b.content?.quote || '';
      if (b.blockType === 'callout') return `${b.content?.title || ''} ${b.content?.text || ''}`;
      return '';
    })
  ].join(' ').trim().split(/\s+/).filter(Boolean).length;

  const estimatedReadingTime = Math.max(1, Math.ceil(totalWords / 200));

  const editorActions = (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
      {/* Save status indicator */}
      <span
        className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
          saveStatus === 'saved'
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
            : saveStatus === 'saving'
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 animate-pulse'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
        }`}
      >
        {saveStatus === 'saved' ? '● Saved' : saveStatus === 'saving' ? 'Saving...' : '● Unsaved'}
      </span>

      {/* Article publication status */}
      <span
        className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
          article.status === 'PUBLISHED'
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
            : article.status === 'PENDING_REVIEW'
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
            : article.status === 'REJECTED'
            ? 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
        }`}
      >
        {article.status === 'PENDING_REVIEW'
          ? 'Under Review'
          : article.status === 'REJECTED'
          ? 'Changes Requested'
          : article.status === 'PUBLISHED'
          ? 'Published'
          : 'Draft'}
      </span>

      {/* Live Production Preview in New Tab */}
      <button
        type="button"
        onClick={handlePreviewInNewTab}
        disabled={savingDraft || submitting}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
        title="Open production-accurate live simulation in a new browser tab"
      >
        <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span className="hidden sm:inline">Preview Live</span>
        <span className="sm:hidden">Preview</span>
      </button>

      {/* Manual Save Draft Button */}
      <button
        type="button"
        onClick={handleSaveDraft}
        disabled={savingDraft || submitting}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
      >
        {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        <span>Save Draft</span>
      </button>

      {/* Direct Publish / Unpublish for Admin, or Review actions for Authors */}
      {canPublish ? (
        article.status === 'PUBLISHED' ? (
          <button
            type="button"
            onClick={handleUnpublish}
            disabled={submitting}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Unpublish article back to archive"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
            <span>Unpublish</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDirectPublish}
            disabled={submitting}
            title="Direct publish manuscript live to public magazine"
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            <span>Publish Live</span>
          </button>
        )
      ) : article.status === 'PENDING_REVIEW' ? (
        <button
          type="button"
          disabled
          title="This manuscript is currently undergoing editorial review."
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-not-allowed"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Under Review</span>
        </button>
      ) : article.status === 'PUBLISHED' ? (
        <button
          type="button"
          disabled
          title="This manuscript is already published live."
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Published</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmitForReview}
          disabled={submitting || !canSubmit}
          title={!canSubmit ? 'You do not have permission to submit manuscripts' : 'Submit for peer editorial review'}
          className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>{article.status === 'REJECTED' ? 'Re-submit for Review' : 'Submit for Review'}</span>
        </button>
      )}
    </div>
  );

  return (
    <AdminLayout
      title={currentId ? 'Editor' : 'Write Article'}
      subtitle={article.title ? `Draft: "${article.title}"` : 'Draft, structure content blocks, and submit articles for peer editorial review.'}
      actions={editorActions}
    >
      <Helmet>
        <title>{article.title ? `${article.title} — Editor` : 'Write Article'} — Research Factors Admin</title>
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Dynamic Alert Banner */}
        {activeAlert && (
          <div
            className={`p-4 rounded-2xl flex items-start justify-between border ${
              activeAlert.type === 'error'
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

        {/* Rejection Feedback Banner */}
        {article.status === 'REJECTED' && article.rejectionReason && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-0.5">
                Editorial Feedback & Revision Notes
              </p>
              <p className="text-sm text-slate-200">{article.rejectionReason}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading article workspace...</p>
          </div>
        ) : (
          /* Live Block Authoring Mode */
          <div className="space-y-6">
            {/* 1. TOP TAXONOMY & READING TIME BAR (Matches Breadcrumbs & Format Badge on Public Frontend) */}
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800/80 shadow-xs transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Primary Research Category Selector */}
                <div className="md:col-span-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Article Category <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
                        if (!isCustomCategory) {
                          handleChange('categoryId', '');
                        } else {
                          setCustomCategoryName('');
                        }
                      }}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {isCustomCategory ? 'Select Existing' : '+ Custom Category'}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <input
                      type="text"
                      value={customCategoryName}
                      onChange={(e) => {
                        setCustomCategoryName(e.target.value);
                        handleChange('categoryName', e.target.value);
                      }}
                      placeholder="e.g. Quantum Cryptography, Bioengineering..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  ) : (
                    <select
                      value={article.categoryId}
                      onChange={(e) => handleChange('categoryId', e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
                    >
                      <option value="">Select Field of Study...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Article Format / Genre Selector */}
                <div className="md:col-span-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Article Format / Type <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Editorial genre</span>
                  </div>
                  <select
                    value={article.type || 'RESEARCH'}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
                  >
                    <option value="RESEARCH">Research (Empirical / Experimental)</option>
                    <option value="REVIEW">Review (Literature / Technology)</option>
                    <option value="COMPARISON">Comparison (Benchmarks / Matrix)</option>
                    <option value="ANALYSIS">Analysis (Architectural / Economic)</option>
                    <option value="GUIDE">Guide (Methodology / Technical)</option>
                    <option value="OPINION">Opinion (Perspective / Commentary)</option>
                  </select>
                </div>

                {/* Estimated Reading Time Indicator */}
                <div className="md:col-span-3 flex md:justify-end items-end pt-2 md:pt-0">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400 font-medium shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>~{estimatedReadingTime} min read</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-[11px] text-slate-500">{totalWords} words</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. MANUSCRIPT HEADLINE & THESIS METADATA (Matches Primary Title & Subtitle on Public Frontend) */}
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-5 transition-colors">
              {/* Title */}
              <div>
                <input
                  type="text"
                  value={article.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Article Title (e.g. Empirical Benchmarks of Quantum Processors...)"
                  className="w-full text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent border-b border-transparent focus:border-blue-500 pb-1"
                />
              </div>

              {/* Subtitle */}
              <div>
                <input
                  type="text"
                  value={article.subtitle || ''}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  placeholder="Thesis statement or research subtitle..."
                  className="w-full text-base sm:text-lg font-normal text-slate-700 dark:text-slate-300 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent border-b border-transparent focus:border-blue-500 pb-1"
                />
              </div>

              {/* Excerpt */}
              <div>
                <textarea
                  value={article.excerpt || ''}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                  placeholder="Abstract / Executive Summary (visible on archive cards, social cards, and search previews)..."
                  rows={2}
                  className="w-full text-sm font-normal text-slate-600 dark:text-slate-400 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent resize-none border-b border-transparent focus:border-blue-500 pb-1"
                />
              </div>
            </div>

            {/* 3. HERO COVER ASSET BANNER (Matches Hero Figure on Public Frontend) */}
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Hero Cover Asset
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Prominent editorial banner displayed between headline metadata and body prose
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCoverInputMode('upload')}
                    className={`font-semibold cursor-pointer ${coverInputMode === 'upload' ? 'text-blue-600 dark:text-blue-400 underline' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    Upload File
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={() => setCoverInputMode('url')}
                    className={`font-semibold cursor-pointer ${coverInputMode === 'url' ? 'text-blue-600 dark:text-blue-400 underline' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    Enter Direct URL
                  </button>
                </div>
              </div>

              {article.coverImageUrl ? (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 group max-h-80 shadow-xs">
                    <img
                      src={normalizeMediaUrl(article.coverImageUrl)}
                      alt={article.coverImageAlt || article.title || 'Cover Asset'}
                      className="w-full h-full object-cover max-h-80"
                    />
                    <div className="absolute top-3 right-3 flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleChange('coverImageUrl', '')}
                        className="p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors shadow-md cursor-pointer"
                        title="Remove cover asset"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cover Image Alt Text & Caption */}
                  <div>
                    <input
                      type="text"
                      value={article.coverImageAlt || ''}
                      onChange={(e) => handleChange('coverImageAlt', e.target.value)}
                      placeholder="Cover Image Alt Description & Figure Caption (displays below hero image on public reader view)..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>
              ) : coverInputMode === 'upload' ? (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all text-center">
                  {uploadingCover ? (
                    <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-xs font-semibold">Processing via Sharp WebP...</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Upload Article Cover Image
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        PNG, JPG, WebP up to 8MB (Auto-optimized to modern WebP)
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleCoverUpload}
                    disabled={uploadingCover}
                    className="hidden"
                  />
                </label>
              ) : (
                <input
                  type="url"
                  value={article.coverImageUrl || ''}
                  onChange={(e) => handleChange('coverImageUrl', e.target.value)}
                  placeholder="https://... (Direct image URL or CDN link)"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                />
              )}
            </div>

            {/* 4. MANUSCRIPT CONTENT BLOCKS (Matches Article Prose Body on Public Frontend) */}
            <div className="space-y-4">
              {article.blocks.map((block, index) => (
                <div
                  key={block.id || index}
                  className="group bg-white dark:bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-slate-800 dark:text-slate-100"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 text-[10px]">
                        Block {index + 1}: {block.blockType}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, -1)}
                        disabled={index === 0}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 1)}
                        disabled={index === article.blocks.length - 1}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(index)}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-500 ml-2 transition-colors cursor-pointer"
                        title="Delete Block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 1. HEADING BLOCK */}
                  {block.blockType === 'heading' && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Level:</span>
                        <button
                          type="button"
                          onClick={() => handleBlockContentChange(index, { level: 2 })}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            (block.content?.level || 2) === 2
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          H3 Section
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBlockContentChange(index, { level: 3 })}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            block.content?.level === 3
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          H4 Subsection
                        </button>
                      </div>
                      <input
                        type="text"
                        value={block.content?.text || ''}
                        onChange={(e) => handleBlockContentChange(index, { text: e.target.value })}
                        placeholder="Section Heading Title..."
                        className="w-full text-xl font-semibold text-slate-900 dark:text-white focus:outline-none border-b border-slate-200 dark:border-slate-800 focus:border-blue-500 pb-1 bg-transparent placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    </div>
                  )}

                  {/* 2. PARAGRAPH BLOCK (Production-ready Rich Text Editor) */}
                  {block.blockType === 'paragraph' && (
                    <div className="space-y-2">
                      <RichTextEditor
                        content={block.content}
                        onChange={(updated) => handleBlockContentChange(index, updated)}
                        placeholder="Write manuscript findings, empirical prose, or methodology..."
                      />
                    </div>
                  )}

                  {/* 3. PULL QUOTE BLOCK */}
                  {block.blockType === 'quote' && (
                    <div className="space-y-3 pl-4 border-l-4 border-blue-600 dark:border-blue-500">
                      <textarea
                        value={block.content?.quote ?? block.content?.text ?? ''}
                        onChange={(e) => handleBlockContentChange(index, {
                          quote: e.target.value,
                          text: e.target.value
                        })}
                        placeholder="Key quote or thesis statement..."
                        rows={2}
                        className="w-full text-base italic text-slate-900 dark:text-white focus:outline-none resize-none bg-transparent placeholder-slate-400 dark:placeholder-slate-500"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={block.content?.author ?? block.content?.citation ?? ''}
                          onChange={(e) => handleBlockContentChange(index, {
                            author: e.target.value,
                            citation: e.target.value
                          })}
                          placeholder="Attribution (e.g. Dr. Eleanor Vance)"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                        />
                        <input
                          type="text"
                          value={block.content?.source || ''}
                          onChange={(e) => handleBlockContentChange(index, { source: e.target.value })}
                          placeholder="Source / Citation (e.g. Nature 2026)"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* 4. CALLOUT BOX BLOCK */}
                  {block.blockType === 'callout' && (
                    <div
                      className={`space-y-3 p-4 rounded-xl border ${
                        block.content?.variant === 'warning'
                          ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                          : block.content?.variant === 'tip'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Callout Type:</span>
                        {['info', 'warning', 'tip'].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => handleBlockContentChange(index, { variant: v, type: v })}
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                              (block.content?.variant || 'info') === v
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={block.content?.title || ''}
                        onChange={(e) => handleBlockContentChange(index, { title: e.target.value })}
                        placeholder="Callout Header / Title..."
                        className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none border-b border-slate-300 dark:border-slate-800 focus:border-blue-500 pb-1 placeholder-slate-400 dark:placeholder-slate-500"
                      />

                      <textarea
                        value={block.content?.text ?? block.content?.message ?? ''}
                        onChange={(e) => handleBlockContentChange(index, {
                          text: e.target.value,
                          message: e.target.value
                        })}
                        placeholder="Callout body text or contextual observation..."
                        rows={2}
                        className="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none resize-none placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    </div>
                  )}

                  {/* 5. COMPARISON TABLE / MATRIX BLOCK */}
                  {(block.blockType === 'table' || block.blockType === 'comparison') && (() => {
                    const headers = Array.isArray(block.content?.headers) ? block.content.headers : ['Column 1', 'Column 2'];
                    const rawRows = Array.isArray(block.content?.rows) ? block.content.rows : [];
                    const rows = rawRows.map(r => {
                      if (Array.isArray(r)) return { label: r[0] || '', values: r.slice(1) };
                      return { label: r?.label || '', values: Array.isArray(r?.values) ? r.values : [] };
                    });

                    const updateHeaders = (newHeaders) => {
                      handleBlockContentChange(index, { headers: newHeaders });
                    };

                    const updateRows = (newRows) => {
                      handleBlockContentChange(index, { rows: newRows });
                    };

                    return (
                      <div className="space-y-3 overflow-x-auto">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Interactive Matrix Table Editor
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newHeaders = [...headers, `Col ${headers.length + 1}`];
                                const newRows = rows.map(r => ({ ...r, values: [...r.values, ''] }));
                                handleBlockContentChange(index, { headers: newHeaders, rows: newRows });
                              }}
                              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Column</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newRows = [...rows, { label: `Factor ${rows.length + 1}`, values: new Array(Math.max(1, headers.length - 1)).fill('') }];
                                updateRows(newRows);
                              }}
                              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Row</span>
                            </button>
                          </div>
                        </div>

                        {/* Visual Table Editor */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/40">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                {headers.map((h, hIdx) => (
                                  <th key={hIdx} className="p-2 min-w-[120px]">
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="text"
                                        value={h}
                                        onChange={(e) => {
                                          const next = [...headers];
                                          next[hIdx] = e.target.value;
                                          updateHeaders(next);
                                        }}
                                        placeholder={`Header ${hIdx + 1}`}
                                        className="w-full text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                                      />
                                      {headers.length > 2 && hIdx > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nextHeaders = headers.filter((_, i) => i !== hIdx);
                                            const nextRows = rows.map(r => ({
                                              ...r,
                                              values: r.values.filter((_, i) => i !== hIdx - 1)
                                            }));
                                            handleBlockContentChange(index, { headers: nextHeaders, rows: nextRows });
                                          }}
                                          className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
                                          title="Delete column"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </th>
                                ))}
                                <th className="w-8"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                              {rows.map((r, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-colors">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={r.label}
                                      onChange={(e) => {
                                        const nextRows = [...rows];
                                        nextRows[rIdx] = { ...nextRows[rIdx], label: e.target.value };
                                        updateRows(nextRows);
                                      }}
                                      placeholder="Row Label..."
                                      className="w-full text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                                    />
                                  </td>
                                  {headers.slice(1).map((_, vIdx) => (
                                    <td key={vIdx} className="p-2">
                                      <input
                                        type="text"
                                        value={r.values[vIdx] || ''}
                                        onChange={(e) => {
                                          const nextRows = [...rows];
                                          const nextValues = [...(nextRows[rIdx].values || [])];
                                          nextValues[vIdx] = e.target.value;
                                          nextRows[rIdx] = { ...nextRows[rIdx], values: nextValues };
                                          updateRows(nextRows);
                                        }}
                                        placeholder="Value..."
                                        className="w-full text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                                      />
                                    </td>
                                  ))}
                                  <td className="p-2 text-right">
                                    {rows.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextRows = rows.filter((_, i) => i !== rIdx);
                                          updateRows(nextRows);
                                        }}
                                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                                        title="Delete row"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 6. MEDIA IMAGE BLOCK */}
                  {block.blockType === 'image' && (
                    <div className="space-y-3">
                      {block.content?.url ? (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
                          <img
                            src={normalizeMediaUrl(block.content.url)}
                            alt={block.content.alt || 'Asset'}
                            className="w-full max-h-64 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleBlockContentChange(index, { url: '' })}
                            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors shadow-md cursor-pointer"
                            title="Remove image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* File Upload Dropzone */}
                          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all text-center">
                            {uploadingBlockIndex === index ? (
                              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs font-semibold">Processing via Sharp WebP...</span>
                              </div>
                            ) : (
                              <>
                                <UploadCloud className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-1.5" />
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Upload Manual Image</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">JPG, PNG, WebP (Platform Independent)</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/avif"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleBlockImageUpload(index, f);
                                e.target.value = '';
                              }}
                              disabled={uploadingBlockIndex === index}
                              className="hidden"
                            />
                          </label>

                          {/* URL Input Fallback */}
                          <div className="flex flex-col justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Or Enter Direct Image URL</span>
                            <input
                              type="url"
                              value={block.content?.url || ''}
                              onChange={(e) => handleBlockContentChange(index, { url: e.target.value })}
                              placeholder="https://... (Direct image URL)"
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Alt & Caption */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        <input
                          type="text"
                          value={block.content?.caption || ''}
                          onChange={(e) => handleBlockContentChange(index, { caption: e.target.value })}
                          placeholder="Image Caption (e.g. Figure 1: Benchmark distribution)"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                        />
                        <input
                          type="text"
                          value={block.content?.alt || ''}
                          onChange={(e) => handleBlockContentChange(index, { alt: e.target.value })}
                          placeholder="Alt description for screen readers"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* 7. DIVIDER BLOCK */}
                  {block.blockType === 'divider' && (
                    <div className="py-4 text-center">
                      <hr className="border-t border-slate-200 dark:border-slate-800 max-w-sm mx-auto" />
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 block">
                        Editorial Section Divider
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Block Inserter Bar */}
            <div className="p-6 bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center transition-colors">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-3">
                Insert Research Content Block
              </span>
              <div className="flex items-center justify-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addBlock('paragraph')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 hover:text-blue-600 dark:hover:text-white bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
                >
                  <AlignLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Paragraph</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('heading')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 hover:text-blue-600 dark:hover:text-white bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
                >
                  <Heading className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Heading</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('comparison')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 hover:text-blue-600 dark:hover:text-white bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
                >
                  <TableIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Comparison Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('quote')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 hover:text-blue-600 dark:hover:text-white bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
                >
                  <Quote className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Pull Quote</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('callout')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 hover:text-blue-600 dark:hover:text-white bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Callout Box</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('image')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 hover:text-blue-600 dark:hover:text-white bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Media Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('divider')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750 hover:border-blue-500 hover:text-blue-600 dark:hover:text-white bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
                >
                  <Minus className="w-3.5 h-3.5 text-slate-500" />
                  <span>Divider</span>
                </button>
              </div>
            </div>

            {/* 5. TOPIC TAGS SECTION (Rendered in normal readable form on Public Frontend) */}
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Topic Tags (Research Taxonomies)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Index manuscript under domain topics (rendered in normal form as pill badges in article sidebar)
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {(article.tags || []).length}/8 Tags
                </span>
              </div>

              {/* Tag Chips in Normal Form */}
              {(article.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {article.tags.map((tag, idx) => {
                    const raw = typeof tag === 'string' ? tag : (tag.name || tag.slug || '');
                    const clean = String(raw).replace(/^#+/, '').trim();
                    let displayName = (typeof tag === 'object' && tag.name) ? tag.name : clean;
                    displayName = displayName.replace(/^#+/, '').trim();
                    if (displayName.includes('_') || (displayName.includes('-') && !displayName.includes(' '))) {
                      displayName = displayName.replace(/[-_]/g, ' ');
                    }
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#eef5f6] dark:bg-[#152e35] text-[#0f5466] dark:text-[#5eead4] border border-[#d6e7eb] dark:border-[#1e444e] shadow-2xs"
                      >
                        <span>{displayName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(idx)}
                          className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                          title="Remove tag"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Tag Input Field & Autocomplete */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setShowTagSuggestions(true);
                    }}
                    onFocus={() => setShowTagSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        if (tagInput.trim()) {
                          handleAddTag(tagInput.trim());
                        }
                      }
                    }}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tagInput.trim()) handleAddTag(tagInput.trim());
                    }}
                    disabled={!tagInput.trim() || (article.tags || []).length >= 8}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-40 shrink-0 cursor-pointer shadow-xs"
                  >
                    Add Tag
                  </button>
                </div>

                {/* Autocomplete Suggestions Dropdown */}
                {showTagSuggestions && suggestedTags.length > 0 && (
                  <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-750 py-1.5 z-30 max-h-48 overflow-y-auto">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Suggested Platform Taxonomies
                    </div>
                    {suggestedTags.map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleAddTag(st)}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        <span className="font-medium">{st.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                          {st.articlesCount || 0} {st.articlesCount === 1 ? 'article' : 'articles'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 6. BRAND SPONSORSHIP SECTION (NO PLACEHOLDERS) */}
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-5 transition-colors">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <Megaphone className="w-4 h-4 text-[#c25e34] dark:text-[#f87171]" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Brand Sponsorship & Commercial Underwriting
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Disclose sponsoring organizations or commercial underwriting for this publication
                    </p>
                  </div>
                </div>
              </div>

              {/* Sponsorship Active Toggle */}
              <div>
                <label className="inline-flex items-center space-x-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(article.isSponsored)}
                    onChange={(e) => handleChange('isSponsored', e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    This article is sponsored or commercially underwritten
                  </span>
                </label>
              </div>

              {/* Conditional Sponsorship Input Fields (NO PLACEHOLDERS) */}
              {article.isSponsored && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sponsor Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Sponsor / Brand Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={article.sponsorName || ''}
                        onChange={(e) => handleChange('sponsorName', e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
                      />
                    </div>

                    {/* Sponsor Website / Action URL */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Sponsor Target Action URL (Website / Offer link)
                      </label>
                      <input
                        type="url"
                        value={article.sponsorUrl || ''}
                        onChange={(e) => handleChange('sponsorUrl', e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
                      />
                    </div>
                  </div>

                  {/* Sponsor Partnership Statement / Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Sponsor Partnership Statement / Description
                    </label>
                    <textarea
                      value={article.sponsorDescription || ''}
                      onChange={(e) => handleChange('sponsorDescription', e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
                    />
                  </div>

                  {/* Sponsor Logo URL (Future use) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Sponsor Logo URL (Optional, for future branding)
                    </label>
                    <input
                      type="url"
                      value={article.sponsorLogoUrl || ''}
                      onChange={(e) => handleChange('sponsorLogoUrl', e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
                    />
                  </div>

                  {/* Live Sponsorship Sidebar Preview Widget */}
                  <div className="pt-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                      Right Sidebar Card Preview
                    </span>
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs max-w-sm space-y-3">
                      <span className="text-[11px] font-bold tracking-widest text-rfblue dark:text-[#f87171] uppercase block">
                        SPONSORED
                      </span>
                      <h4 className="font-serif text-xl font-bold text-slate-900 dark:text-white leading-snug">
                        {article.sponsorName || 'Sponsor Name'}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {article.sponsorDescription || 'Sponsor partnership statement and description will be displayed here.'}
                      </p>
                      <div className="pt-1">
                        <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-rfblue shadow-2xs">
                          Visit Sponsor
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 7. EDITORIAL SEO & SOCIAL STUDIO */}
            <ArticleSeoStudio
              article={article}
              onChange={handleChange}
              seoMetadata={seoMetadata}
              resolvedSeo={resolvedSeo}
              onRegenerate={currentId ? handleRegenerateSeo : null}
              isRegenerating={isRegeneratingSeo}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
