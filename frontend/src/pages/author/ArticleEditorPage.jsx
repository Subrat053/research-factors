import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext.jsx';
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
  Clock
} from 'lucide-react';
import { articlesApi } from '../../services/articles.api.js';
import { mediaApi, normalizeMediaUrl } from '../../services/media.api.js';
import { BlockRenderer } from '../../components/article/BlockRenderer.jsx';
import { Footer } from '../../components/layout/Footer.jsx';

export default function ArticleEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  // Dynamic RBAC Permission Checks
  const canCreate = hasPermission('article.create');
  const canSubmit = hasPermission('article.submit');
  const canUploadMedia = hasPermission('media.upload');

  const [currentId, setCurrentId] = useState(id && id !== 'new' ? id : null);
  const [article, setArticle] = useState({
    title: '',
    subtitle: '',
    excerpt: '',
    coverImageUrl: '',
    coverImageAlt: '',
    categoryId: '',
    status: 'DRAFT',
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

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'
  const [isPreview, setIsPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverInputMode, setCoverInputMode] = useState('upload'); // 'upload' | 'url'
  const [activeAlert, setActiveAlert] = useState(null); // { type: 'error' | 'success', message: '' }
  const [uploadingBlockIndex, setUploadingBlockIndex] = useState(null);

  const autosaveTimerRef = useRef(null);

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
            setArticle({
              title: data.title || '',
              subtitle: data.subtitle || '',
              excerpt: data.excerpt || '',
              coverImageUrl: normalizeMediaUrl(data.coverImageUrl || ''),
              coverImageAlt: data.coverImageAlt || '',
              categoryId: data.category?.id || data.categoryId || '',
              status: data.status || 'DRAFT',
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
                setArticle({
                  title: found.title || '',
                  subtitle: found.subtitle || '',
                  excerpt: found.excerpt || '',
                  coverImageUrl: normalizeMediaUrl(found.coverImageUrl || ''),
                  coverImageAlt: found.coverImageAlt || '',
                  categoryId: found.category?.id || found.categoryId || '',
                  status: found.status || 'DRAFT',
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
    const updated = { ...article, [field]: value };
    setArticle(updated);
    triggerAutosave(updated);
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
        altText: article.coverImageAlt || article.title || 'Manuscript Cover'
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
        message: 'Manuscript title must be at least 5 characters long before saving.'
      });
      return null;
    }

    if (!article.categoryId) {
      setActiveAlert({
        type: 'error',
        message: 'Please select a primary research category for your manuscript.'
      });
      return null;
    }

    setSavingDraft(true);
    setSaveStatus('saving');
    try {
      if (!currentId) {
        const res = await articlesApi.createDraft(article);
        const newId = res.data.id;
        setCurrentId(newId);
        setSaveStatus('saved');
        setActiveAlert({
          type: 'success',
          message: 'Manuscript draft created and saved successfully!'
        });
        navigate(`/editor/${newId}`, { replace: true });
        return newId;
      } else {
        await articlesApi.updateDraft(currentId, article);
        setSaveStatus('saved');
        setActiveAlert({
          type: 'success',
          message: 'Manuscript draft saved successfully!'
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
        message: 'Manuscript title must be at least 5 characters long before submission.'
      });
      return;
    }

    if (!article.categoryId) {
      setActiveAlert({
        type: 'error',
        message: 'Please select a primary category before submitting for review.'
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
    try {
      let targetId = currentId;
      if (!targetId) {
        const res = await articlesApi.createDraft(article);
        targetId = res.data.id;
        setCurrentId(targetId);
      } else {
        await articlesApi.updateDraft(targetId, article);
      }

      await articlesApi.submitForReview(targetId);
      setArticle(prev => ({ ...prev, status: 'PENDING_REVIEW' }));
      setSaveStatus('saved');
      setActiveAlert({
        type: 'success',
        message: 'Manuscript successfully submitted for peer editorial review!'
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

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Helmet>
        <title>Research Workspace & Editor — Research Factors</title>
      </Helmet>

      {/* Editor Top Command Bar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-paper-border px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <Link to="/" className="p-1.5 text-ink-muted hover:text-ink transition-colors rounded-lg">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-rfblue">
              Manuscript Studio
            </span>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-ink-darkest truncate max-w-[180px] sm:max-w-md">
                {article.title || 'Untitled Draft'}
              </h2>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  saveStatus === 'saved'
                    ? 'bg-emerald-50 text-emerald-700'
                    : saveStatus === 'saving'
                    ? 'bg-amber-50 text-amber-700 animate-pulse'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {saveStatus === 'saved' ? '● Saved' : saveStatus === 'saving' ? 'Saving...' : '● Unsaved'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  article.status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : article.status === 'PENDING_REVIEW'
                    ? 'bg-amber-100 text-amber-800'
                    : article.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {article.status === 'PENDING_REVIEW' ? 'Under Review' :
                 article.status === 'REJECTED' ? 'Changes Requested' :
                 article.status === 'PUBLISHED' ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-paper-border text-xs font-semibold text-ink-muted hover:text-ink hover:bg-paper transition-all"
          >
            {isPreview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isPreview ? 'Edit' : 'Preview'}</span>
          </button>

          {/* Manual Save Draft Button */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft || submitting}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-paper-border hover:border-rfblue hover:text-rfblue text-xs font-semibold text-ink transition-all disabled:opacity-50"
          >
            {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>

          {/* Submit for Review Button */}
          {article.status === 'PENDING_REVIEW' ? (
            <button
              type="button"
              disabled
              title="This manuscript is currently undergoing editorial review."
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold cursor-not-allowed"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Under Review</span>
            </button>
          ) : article.status === 'PUBLISHED' ? (
            <button
              type="button"
              disabled
              title="This manuscript is already published live."
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold cursor-not-allowed"
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
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-rfblue hover:bg-rfblue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{article.status === 'REJECTED' ? 'Re-submit for Review' : 'Submit for Review'}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Dynamic Alert Banner */}
        {activeAlert && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-start justify-between border ${
              activeAlert.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-start space-x-2.5">
              {activeAlert.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-medium">{activeAlert.message}</p>
            </div>
            <button
              onClick={() => setActiveAlert(null)}
              className="p-1 text-ink-muted hover:text-ink rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Rejection Feedback Banner */}
        {article.status === 'REJECTED' && article.rejectionReason && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-900 mb-0.5">
                Editorial Feedback & Revision Notes
              </p>
              <p className="text-sm">{article.rejectionReason}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-rfblue mx-auto mb-3" />
            <p className="text-sm text-ink-muted">Loading manuscript workspace...</p>
          </div>
        ) : isPreview ? (
          /* Preview Mode Rendering */
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-paper-border shadow-sm max-w-prose mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-rfblue">
                Article Preview
              </span>
              {article.categoryId && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rfblue-50 text-rfblue border border-rfblue-100">
                  {categories.find(c => c.id === article.categoryId)?.name || 'Research'}
                </span>
              )}
            </div>

            {article.coverImageUrl && (
              <div className="rounded-2xl overflow-hidden mb-8 border border-paper-border max-h-[400px]">
                <img
                  src={normalizeMediaUrl(article.coverImageUrl)}
                  alt={article.coverImageAlt || article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-ink-darkest mb-4">
              {article.title || 'Untitled Manuscript'}
            </h1>
            {article.subtitle && (
              <h2 className="text-lg sm:text-xl font-light text-ink-muted mb-6">
                {article.subtitle}
              </h2>
            )}
            {article.excerpt && (
              <p className="text-base text-ink-muted font-light leading-relaxed mb-8 italic border-l-2 border-rfblue pl-4">
                {article.excerpt}
              </p>
            )}
            <BlockRenderer blocks={article.blocks} />
          </div>
        ) : (
          /* Live Block Authoring Mode */
          <div className="space-y-8">
            {/* Metadata Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-paper-border shadow-xs space-y-5">
              {/* Title */}
              <div>
                <input
                  type="text"
                  value={article.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Manuscript Title (e.g. Comparative Analysis of Latency...)"
                  className="w-full font-serif text-2xl sm:text-3xl font-bold text-ink-darkest focus:outline-none placeholder:text-ink-lighter"
                />
              </div>

              {/* Subtitle */}
              <div>
                <input
                  type="text"
                  value={article.subtitle || ''}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  placeholder="Thesis statement or research subtitle..."
                  className="w-full text-base font-light text-ink focus:outline-none placeholder:text-ink-lighter"
                />
              </div>

              {/* Excerpt */}
              <div>
                <textarea
                  value={article.excerpt || ''}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                  placeholder="Abstract / Executive Summary (visible on archive cards and search previews)..."
                  rows={2}
                  className="w-full text-sm font-light text-ink-muted focus:outline-none placeholder:text-ink-lighter resize-none"
                />
              </div>

              {/* Category & Cover Image Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-paper-border">
                {/* Primary Category Selector */}
                <div>
                  <label className="block text-xs font-semibold text-ink-darkest mb-1.5">
                    Primary Research Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={article.categoryId}
                    onChange={(e) => handleChange('categoryId', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-paper-border bg-paper focus:outline-none focus:ring-1 focus:ring-rfblue text-ink font-medium"
                  >
                    <option value="">Select Field of Study...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cover Image Upload Area */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-ink-darkest">
                      Cover Asset
                    </label>
                    <div className="flex items-center space-x-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setCoverInputMode('upload')}
                        className={`font-semibold ${coverInputMode === 'upload' ? 'text-rfblue underline' : 'text-ink-muted'}`}
                      >
                        Upload File
                      </button>
                      <span className="text-paper-border">|</span>
                      <button
                        type="button"
                        onClick={() => setCoverInputMode('url')}
                        className={`font-semibold ${coverInputMode === 'url' ? 'text-rfblue underline' : 'text-ink-muted'}`}
                      >
                        Enter URL
                      </button>
                    </div>
                  </div>

                  {article.coverImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-paper-border bg-paper group">
                      <img
                        src={normalizeMediaUrl(article.coverImageUrl)}
                        alt={article.coverImageAlt || 'Cover Asset'}
                        className="w-full h-24 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleChange('coverImageUrl', '')}
                        className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black text-white rounded-full transition-colors shadow-xs"
                        title="Remove cover asset"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : coverInputMode === 'upload' ? (
                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-paper-border rounded-xl cursor-pointer hover:border-rfblue hover:bg-paper/50 transition-all text-center">
                      {uploadingCover ? (
                        <div className="flex items-center space-x-2 text-rfblue">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs font-semibold">Processing via Sharp WebP...</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-5 h-5 text-rfblue mb-1" />
                          <span className="text-xs font-semibold text-ink">Upload Manual Image</span>
                          <span className="text-[10px] text-ink-light">PNG, JPG, WebP up to 8MB</span>
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
                      placeholder="https://... (CDN or direct image URL)"
                      className="w-full text-xs p-2.5 rounded-xl border border-paper-border bg-paper focus:outline-none focus:ring-1 focus:ring-rfblue text-ink"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Block Stack */}
            <div className="space-y-4">
              {article.blocks.map((block, index) => (
                <div
                  key={block.id || index}
                  className="group bg-white rounded-2xl p-5 border border-paper-border shadow-xs hover:border-rfblue-300 transition-colors"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-paper-border text-xs text-ink-light">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold uppercase tracking-widest text-rfblue text-[10px]">
                        Block {index + 1}: {block.blockType}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, -1)}
                        disabled={index === 0}
                        className="p-1 hover:text-ink disabled:opacity-30 transition-colors"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 1)}
                        disabled={index === article.blocks.length - 1}
                        className="p-1 hover:text-ink disabled:opacity-30 transition-colors"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(index)}
                        className="p-1 hover:text-red-600 ml-2 transition-colors"
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
                        <span className="text-[10px] font-bold text-ink-muted uppercase">Level:</span>
                        <button
                          type="button"
                          onClick={() => handleBlockContentChange(index, { level: 2 })}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                            (block.content?.level || 2) === 2
                              ? 'bg-rfblue text-white'
                              : 'bg-paper text-ink-muted hover:text-ink'
                          }`}
                        >
                          H2 Section
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBlockContentChange(index, { level: 3 })}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                            block.content?.level === 3
                              ? 'bg-rfblue text-white'
                              : 'bg-paper text-ink-muted hover:text-ink'
                          }`}
                        >
                          H3 Subsection
                        </button>
                      </div>
                      <input
                        type="text"
                        value={block.content?.text || ''}
                        onChange={(e) => handleBlockContentChange(index, { text: e.target.value })}
                        placeholder="Section Heading Title..."
                        className="w-full font-serif text-xl font-bold text-ink-darkest focus:outline-none border-b border-transparent focus:border-rfblue pb-1"
                      />
                    </div>
                  )}

                  {/* 2. PARAGRAPH BLOCK */}
                  {block.blockType === 'paragraph' && (
                    <div className="space-y-2">
                      <textarea
                        value={block.content?.text ?? (block.content?.html ? block.content.html.replace(/<[^>]+>/g, '') : '')}
                        onChange={(e) => handleBlockContentChange(index, {
                          text: e.target.value,
                          html: `<p>${e.target.value.replace(/\n\n/g, '</p><p>')}</p>`
                        })}
                        placeholder="Write manuscript findings, empirical prose, or methodology..."
                        rows={4}
                        className="w-full text-sm leading-relaxed text-ink focus:outline-none resize-y p-2 rounded-lg bg-paper/50 border border-transparent focus:border-rfblue"
                      />
                      <div className="text-[10px] text-ink-light text-right">
                        {(block.content?.text || '').split(/\s+/).filter(Boolean).length} words
                      </div>
                    </div>
                  )}

                  {/* 3. PULL QUOTE BLOCK */}
                  {block.blockType === 'quote' && (
                    <div className="space-y-3 pl-4 border-l-4 border-rfblue">
                      <textarea
                        value={block.content?.quote ?? block.content?.text ?? ''}
                        onChange={(e) => handleBlockContentChange(index, {
                          quote: e.target.value,
                          text: e.target.value
                        })}
                        placeholder="Key quote or statement..."
                        rows={2}
                        className="w-full font-serif text-base italic text-ink-darkest focus:outline-none resize-none"
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
                          className="w-full text-xs p-1.5 rounded-lg border border-paper-border bg-paper focus:outline-none"
                        />
                        <input
                          type="text"
                          value={block.content?.source || ''}
                          onChange={(e) => handleBlockContentChange(index, { source: e.target.value })}
                          placeholder="Source / Citation (e.g. Nature 2026)"
                          className="w-full text-xs p-1.5 rounded-lg border border-paper-border bg-paper focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 4. CALLOUT BOX BLOCK */}
                  {block.blockType === 'callout' && (
                    <div
                      className={`space-y-3 p-4 rounded-xl border ${
                        block.content?.variant === 'warning'
                          ? 'bg-red-50/50 border-red-200'
                          : block.content?.variant === 'tip'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-rfblue-50/50 border-rfblue-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-ink-muted uppercase">Callout Type:</span>
                        {['info', 'warning', 'tip'].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => handleBlockContentChange(index, { variant: v, type: v })}
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold capitalize transition-colors ${
                              (block.content?.variant || 'info') === v
                                ? 'bg-rfblue text-white'
                                : 'bg-white text-ink-muted hover:text-ink'
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
                        className="w-full text-xs font-bold text-ink-darkest bg-transparent focus:outline-none border-b border-paper-border pb-1"
                      />

                      <textarea
                        value={block.content?.text ?? block.content?.message ?? ''}
                        onChange={(e) => handleBlockContentChange(index, {
                          text: e.target.value,
                          message: e.target.value
                        })}
                        placeholder="Callout body text or contextual observation..."
                        rows={2}
                        className="w-full text-xs text-ink-muted bg-transparent focus:outline-none resize-none"
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
                          <span className="text-xs font-bold text-ink-darkest">
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
                              className="text-[11px] font-semibold text-rfblue hover:underline inline-flex items-center space-x-1"
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
                              className="text-[11px] font-semibold text-rfblue hover:underline inline-flex items-center space-x-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Row</span>
                            </button>
                          </div>
                        </div>

                        {/* Visual Table Editor */}
                        <div className="border border-paper-border rounded-xl overflow-hidden bg-paper/40">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-paper border-b border-paper-border">
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
                                        className="w-full text-xs font-bold text-ink-darkest bg-white px-2 py-1 rounded border border-paper-border focus:outline-none focus:border-rfblue"
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
                                          className="text-ink-muted hover:text-red-500 p-0.5"
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
                            <tbody className="divide-y divide-paper-border/60">
                              {rows.map((r, rIdx) => (
                                <tr key={rIdx} className="bg-white hover:bg-paper/20">
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
                                      className="w-full text-xs font-semibold text-ink-darkest bg-paper px-2 py-1 rounded border border-paper-border focus:outline-none"
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
                                        className="w-full text-xs text-ink bg-paper/50 px-2 py-1 rounded border border-paper-border focus:outline-none"
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
                                        className="text-ink-muted hover:text-red-500 p-1"
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
                        <div className="relative rounded-xl overflow-hidden border border-paper-border bg-paper">
                          <img
                            src={normalizeMediaUrl(block.content.url)}
                            alt={block.content.alt || 'Asset'}
                            className="w-full max-h-56 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleBlockContentChange(index, { url: '' })}
                            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors shadow-xs"
                            title="Remove image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* File Upload Dropzone */}
                          <label className="flex flex-col items-center justify-center p-5 border border-dashed border-paper-border rounded-xl cursor-pointer hover:border-rfblue hover:bg-paper/50 transition-all text-center">
                            {uploadingBlockIndex === index ? (
                              <div className="flex items-center space-x-2 text-rfblue">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs font-semibold">Processing via Sharp WebP...</span>
                              </div>
                            ) : (
                              <>
                                <UploadCloud className="w-6 h-6 text-rfblue mb-1.5" />
                                <span className="text-xs font-semibold text-ink">Upload Manual Image</span>
                                <span className="text-[10px] text-ink-light">JPG, PNG, WebP (Platform Independent)</span>
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
                          <div className="flex flex-col justify-center p-4 rounded-xl border border-paper-border bg-paper/40 space-y-2">
                            <span className="text-xs font-semibold text-ink-darkest">Or Enter Image URL</span>
                            <input
                              type="url"
                              value={block.content?.url || ''}
                              onChange={(e) => handleBlockContentChange(index, { url: e.target.value })}
                              placeholder="https://... (Direct image URL)"
                              className="w-full text-xs p-2 rounded-lg border border-paper-border bg-white focus:outline-none"
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
                          className="w-full text-xs p-2 rounded-lg border border-paper-border bg-paper focus:outline-none"
                        />
                        <input
                          type="text"
                          value={block.content?.alt || ''}
                          onChange={(e) => handleBlockContentChange(index, { alt: e.target.value })}
                          placeholder="Alt description for screen readers"
                          className="w-full text-xs p-2 rounded-lg border border-paper-border bg-paper focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 7. DIVIDER BLOCK */}
                  {block.blockType === 'divider' && (
                    <div className="py-4 text-center">
                      <hr className="border-t border-paper-border max-w-sm mx-auto" />
                      <span className="text-[10px] text-ink-light uppercase tracking-widest mt-1 block">
                        Editorial Section Divider
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Block Inserter Bar */}
            <div className="p-6 bg-white rounded-3xl border border-dashed border-paper-border text-center">
              <span className="text-xs font-semibold text-ink-muted block mb-3">
                Insert Research Content Block
              </span>
              <div className="flex items-center justify-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addBlock('paragraph')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-paper-border hover:border-rfblue hover:text-rfblue bg-paper text-xs font-semibold text-ink-muted transition-colors"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>Paragraph</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('heading')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-paper-border hover:border-rfblue hover:text-rfblue bg-paper text-xs font-semibold text-ink-muted transition-colors"
                >
                  <Heading className="w-3.5 h-3.5" />
                  <span>Heading</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('comparison')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-paper-border hover:border-rfblue hover:text-rfblue bg-paper text-xs font-semibold text-ink-muted transition-colors"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Comparison Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('quote')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-paper-border hover:border-rfblue hover:text-rfblue bg-paper text-xs font-semibold text-ink-muted transition-colors"
                >
                  <Quote className="w-3.5 h-3.5" />
                  <span>Pull Quote</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('callout')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-paper-border hover:border-rfblue hover:text-rfblue bg-paper text-xs font-semibold text-ink-muted transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Callout Box</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('image')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-paper-border hover:border-rfblue hover:text-rfblue bg-paper text-xs font-semibold text-ink-muted transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Media Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('divider')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-paper-border hover:border-rfblue hover:text-rfblue bg-paper text-xs font-semibold text-ink-muted transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Divider</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
