import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Globe,
  Smartphone,
  Monitor,
  Eye,
  Tag,
  ShieldAlert,
  Image as ImageIcon,
  Check,
  ExternalLink,
  ChevronDown,
  Layers
} from 'lucide-react';

export function ArticleSeoStudio({
  article,
  onChange,
  seoMetadata,
  resolvedSeo,
  onRegenerate,
  isRegenerating
}) {
  const [activeTab, setActiveTab] = useState('serp'); // 'serp' | 'social' | 'preview' | 'audit'
  const [serpDevice, setSerpDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [socialPlatform, setSocialPlatform] = useState('facebook'); // 'facebook' | 'twitter'

  // Generated fallbacks
  const cleanTitle = (article.title || '').trim();
  const genTitle = seoMetadata?.generatedTitle || `${cleanTitle || 'Untitled Manuscript'} | Research Factors`;
  const cleanExcerpt = (article.excerpt || '').trim();
  const genDesc = seoMetadata?.generatedDescription || (cleanExcerpt ? (cleanExcerpt.length > 160 ? cleanExcerpt.slice(0, 157).trim() + '...' : cleanExcerpt) : 'Empirical research findings, methodologies, and analysis published on Research Factors.');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const catSlug = article.category?.slug || (article.categorySlug ? article.categorySlug : 'research');
  const genCanonical = seoMetadata?.generatedCanonicalUrl || `${origin}/rf/${catSlug}/${article.slug || 'manuscript-slug'}`;
  const genOgImage = seoMetadata?.generatedOgImage || article.coverImageUrl || `${origin}/images/og-default.png`;

  // Resolved live values for preview
  const liveTitle = (article.seoTitle || '').trim() || genTitle;
  const liveDesc = (article.seoDescription || '').trim() || genDesc;
  const liveCanonical = (article.canonicalUrl || '').trim() || genCanonical;
  const liveOgTitle = (article.customOgTitle || '').trim() || liveTitle;
  const liveOgDesc = (article.customOgDescription || '').trim() || liveDesc;
  const liveOgImage = (article.customOgImage || '').trim() || genOgImage;

  // Real-time SEO Quality Audit Metrics
  const audit = useMemo(() => {
    const checks = [];

    // 1. Title Length
    const titleLen = liveTitle.length;
    const titleOptimal = titleLen >= 45 && titleLen <= 65;
    checks.push({
      id: 'title-length',
      label: 'Title Length (45–65 chars)',
      passed: titleOptimal,
      score: titleOptimal ? 1 : 0,
      details: `${titleLen} characters. ${titleOptimal ? 'Perfect length for SERP display.' : titleLen < 45 ? 'Slightly short; add descriptive research context.' : 'May get truncated on Google.'}`
    });

    // 2. Description Length
    const descLen = liveDesc.length;
    const descOptimal = descLen >= 120 && descLen <= 165;
    checks.push({
      id: 'desc-length',
      label: 'Description Length (120–165 chars)',
      passed: descOptimal,
      score: descOptimal ? 1 : 0,
      details: `${descLen} characters. ${descOptimal ? 'Optimal snippet length.' : descLen < 120 ? 'Too short; explain core findings.' : 'May truncate after ~160 chars.'}`
    });

    // 3. Focus Keyword in Title & Description
    const kw = (article.focusKeyword || '').toLowerCase().trim();
    if (kw) {
      const inTitle = liveTitle.toLowerCase().includes(kw);
      const inDesc = liveDesc.toLowerCase().includes(kw);
      checks.push({
        id: 'keyword-placement',
        label: `Focus Keyword "${article.focusKeyword}" in Title & Description`,
        passed: inTitle && inDesc,
        score: inTitle && inDesc ? 1 : (inTitle || inDesc ? 0.5 : 0),
        details: inTitle && inDesc
          ? 'Keyword appears in both title and snippet!'
          : inTitle
            ? 'Present in title, but missing in snippet description.'
            : inDesc
              ? 'Present in snippet, but recommended in headline title.'
              : 'Missing from both headline and snippet.'
      });
    } else {
      checks.push({
        id: 'keyword-placement',
        label: 'Focus Keyword Defined',
        passed: false,
        score: 0,
        details: 'Define a target academic keyword or search phrase for keyword audit.'
      });
    }

    // 4. Cover Image & Alt Text
    const hasCover = Boolean(article.coverImageUrl);
    const hasAlt = Boolean(article.coverImageAlt && article.coverImageAlt.trim().length >= 5);
    checks.push({
      id: 'cover-media',
      label: 'Cover Image & Descriptive Alt Text',
      passed: hasCover && hasAlt,
      score: hasCover && hasAlt ? 1 : hasCover ? 0.5 : 0,
      details: hasCover && hasAlt
        ? 'High quality social/search cover asset with accessible alt text.'
        : hasCover
          ? 'Cover image attached, but alt text is missing or too brief.'
          : 'No manuscript cover image provided.'
    });

    // 5. Heading Structure (Blocks)
    const headingBlocks = (article.blocks || []).filter(b => b.blockType === 'heading' || b.blockType === 'h2' || b.blockType === 'h3');
    const hasHeadings = headingBlocks.length >= 2;
    checks.push({
      id: 'heading-structure',
      label: 'Content Hierarchy (Subheadings in prose)',
      passed: hasHeadings,
      score: hasHeadings ? 1 : 0,
      details: hasHeadings
        ? `${headingBlocks.length} section headings organize the publication for crawlers.`
        : `Only ${headingBlocks.length} heading blocks found; add H2/H3 subheadings to structure your methodology and analysis.`
    });

    // 6. Robots & Canonical
    const isNoIndexed = Boolean(article.isNoIndex);
    checks.push({
      id: 'crawlability',
      label: 'Search Crawlability Status',
      passed: !isNoIndexed,
      score: !isNoIndexed ? 1 : 0,
      details: isNoIndexed
        ? 'WARNING: "noindex" is active. Google and crawlers will NOT index this article.'
        : 'Active (index, follow). Article will be discovered and listed in sitemaps.'
    });

    const totalPassed = checks.filter(c => c.passed).length;
    const totalScore = Math.round((checks.reduce((acc, c) => acc + c.score, 0) / checks.length) * 100);

    return {
      checks,
      totalPassed,
      totalCount: checks.length,
      percentage: totalScore
    };
  }, [liveTitle, liveDesc, article.focusKeyword, article.coverImageUrl, article.coverImageAlt, article.blocks, article.isNoIndex]);

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-6 transition-colors">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Editorial SEO & Social Studio
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                article.isNoIndex
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}>
                {article.isNoIndex ? 'noindex' : 'index, follow'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Deterministic 4-tier SEO fallbacks, rich schema generation, and live crawler simulation
            </p>
          </div>
        </div>

        {/* Regenerate Action */}
        <div className="flex items-center space-x-2">
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/60 transition-all disabled:opacity-50 cursor-pointer"
              title="Automatically refresh generated title, description, and keywords based on manuscript content"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'Regenerating...' : 'Regenerate SEO from Manuscript'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
        <button
          type="button"
          onClick={() => setActiveTab('serp')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'serp'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Search Engine (SERP)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'social'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Social Sharing (OG)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'preview'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Live Previews</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'audit'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
          <span>SEO Health ({audit.percentage}%)</span>
        </button>
      </div>

      {/* Tab 1: Search Engine (SERP) Controls */}
      {activeTab === 'serp' && (
        <div className="space-y-4">
          {/* SEO Meta Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  SEO Meta Title (Title tag)
                </label>
                {article.isSeoTitleCustom ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                    Custom Override Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <Sparkles className="w-2.5 h-2.5" />
                    Auto-Generated (Live Sync)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-mono font-medium ${
                  (article.seoTitle || liveTitle).length >= 45 && (article.seoTitle || liveTitle).length <= 65
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500'
                }`}>
                  {(article.seoTitle || liveTitle).length}/60 chars
                </span>
                {article.isSeoTitleCustom && (
                  <button
                    type="button"
                    onClick={() => onChange({ seoTitle: genTitle, isSeoTitleCustom: false })}
                    className="inline-flex items-center space-x-1 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer font-semibold"
                    title="Reset to live auto-generated title from manuscript headline"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Re-sync with Manuscript</span>
                  </button>
                )}
              </div>
            </div>
            <input
              type="text"
              placeholder={genTitle}
              value={article.seoTitle || ''}
              onChange={(e) => onChange({ seoTitle: e.target.value, isSeoTitleCustom: true })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
            />
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
              <span className="truncate max-w-md">
                <strong>Source:</strong> {!article.isSeoTitleCustom ? 'Live synchronized from manuscript headline' : 'User custom override'}
              </span>
            </div>
          </div>

          {/* SEO Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  SEO Meta Description (Snippet)
                </label>
                {article.isSeoDescCustom ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                    Custom Override Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <Sparkles className="w-2.5 h-2.5" />
                    Auto-Generated (Live Sync)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-mono font-medium ${
                  (article.seoDescription || liveDesc).length >= 120 && (article.seoDescription || liveDesc).length <= 165
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500'
                }`}>
                  {(article.seoDescription || liveDesc).length}/160 chars
                </span>
                {article.isSeoDescCustom && (
                  <button
                    type="button"
                    onClick={() => onChange({ seoDescription: genDesc, isSeoDescCustom: false })}
                    className="inline-flex items-center space-x-1 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer font-semibold"
                    title="Reset to live auto-generated description from manuscript excerpt"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Re-sync with Manuscript</span>
                  </button>
                )}
              </div>
            </div>
            <textarea
              placeholder={genDesc}
              value={article.seoDescription || ''}
              onChange={(e) => onChange({ seoDescription: e.target.value, isSeoDescCustom: true })}
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
            />
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
              <span className="truncate max-w-md">
                <strong>Source:</strong> {!article.isSeoDescCustom ? 'Live synchronized from manuscript excerpt' : 'User custom override'}
              </span>
            </div>
          </div>

          {/* Focus Keyword & Secondary Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Focus Academic Keyword / Phrase
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. quantum entanglement"
                  value={article.focusKeyword || ''}
                  onChange={(e) => onChange('focusKeyword', e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Used to audit keyword prominence in the title and description.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Secondary Keywords (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. quantum computing, qubits, decoherence"
                value={
                  Array.isArray(article.secondaryKeywords)
                    ? article.secondaryKeywords.join(', ')
                    : (article.secondaryKeywords || '')
                }
                onChange={(e) => {
                  const items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  onChange('secondaryKeywords', items);
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Saved in structured metadata for discovery and internal matching.
              </p>
            </div>
          </div>

          {/* Canonical URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Canonical URL (Self-referencing by default)
                </label>
                {article.isCanonicalCustom ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                    Custom Override Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <Sparkles className="w-2.5 h-2.5" />
                    Auto-Generated (Live Sync)
                  </span>
                )}
              </div>
              {article.isCanonicalCustom && (
                <button
                  type="button"
                  onClick={() => onChange({ canonicalUrl: genCanonical, isCanonicalCustom: false })}
                  className="inline-flex items-center space-x-1 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer font-semibold"
                  title="Reset to default self-referencing canonical URL"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Re-sync with URL</span>
                </button>
              )}
            </div>
            <input
              type="url"
              placeholder={genCanonical}
              value={article.canonicalUrl || ''}
              onChange={(e) => onChange({ canonicalUrl: e.target.value, isCanonicalCustom: true })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium font-mono text-[11px]"
            />
            <p className="text-[10px] text-slate-500 mt-1 truncate">
              <strong>Active Canonical:</strong> {liveCanonical}
            </p>
          </div>

          {/* Robots Directives & Structured Schema */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
              <span>Robots Directives & Schema.org Specification</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(article.isNoIndex)}
                  onChange={(e) => onChange('isNoIndex', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    noindex (Exclude from Google)
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block">
                    Instructs search engines not to index this publication.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(article.isNoFollow)}
                  onChange={(e) => onChange('isNoFollow', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    nofollow (Exclude Outbound Links)
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block">
                    Tells crawlers not to follow external hyperlinks in this article.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                JSON-LD Schema Type:
              </span>
              <select
                value={article.schemaType || 'ScholarlyArticle'}
                onChange={(e) => onChange('schemaType', e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="ScholarlyArticle">ScholarlyArticle (Academic & Empirical)</option>
                <option value="Article">Article (Standard Editorial)</option>
                <option value="NewsArticle">NewsArticle (Time-sensitive Analysis)</option>
                <option value="TechArticle">TechArticle (Technical & Specification)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Social Sharing (Open Graph / Twitter) */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-400">
            Social fields inherit directly from your SERP Title, Description, and Cover Image unless explicitly customized here.
          </div>

          {/* Social Title Override */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Open Graph Title (Social Card Headline)
                </label>
                {article.isOgTitleCustom ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                    Custom Override Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <Sparkles className="w-2.5 h-2.5" />
                    Auto-Generated (Live Sync)
                  </span>
                )}
              </div>
              {article.isOgTitleCustom && (
                <button
                  type="button"
                  onClick={() => onChange({ customOgTitle: liveTitle, isOgTitleCustom: false })}
                  className="inline-flex items-center space-x-1 text-[10px] text-blue-600 dark:text-blue-400 cursor-pointer font-semibold"
                  title="Reset to match SERP Title"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Re-sync with SERP Title</span>
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder={liveTitle}
              value={article.customOgTitle || ''}
              onChange={(e) => onChange({ customOgTitle: e.target.value, isOgTitleCustom: true })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
            />
          </div>

          {/* Social Description Override */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Open Graph Description (Social Card Snippet)
                </label>
                {article.isOgDescCustom ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                    Custom Override Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <Sparkles className="w-2.5 h-2.5" />
                    Auto-Generated (Live Sync)
                  </span>
                )}
              </div>
              {article.isOgDescCustom && (
                <button
                  type="button"
                  onClick={() => onChange({ customOgDescription: liveDesc, isOgDescCustom: false })}
                  className="inline-flex items-center space-x-1 text-[10px] text-blue-600 dark:text-blue-400 cursor-pointer font-semibold"
                  title="Reset to match SERP Description"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Re-sync with SERP Description</span>
                </button>
              )}
            </div>
            <textarea
              placeholder={liveDesc}
              value={article.customOgDescription || ''}
              onChange={(e) => onChange({ customOgDescription: e.target.value, isOgDescCustom: true })}
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
            />
          </div>

          {/* Social Image Override */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Custom Social Share Image URL (1200×630 recommended)
                </label>
                {article.isOgImageCustom ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                    Custom Override Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <Sparkles className="w-2.5 h-2.5" />
                    Auto-Generated (Live Sync)
                  </span>
                )}
              </div>
              {article.isOgImageCustom && (
                <button
                  type="button"
                  onClick={() => onChange({ customOgImage: genOgImage, isOgImageCustom: false })}
                  className="inline-flex items-center space-x-1 text-[10px] text-blue-600 dark:text-blue-400 cursor-pointer font-semibold"
                  title="Reset to match manuscript cover image"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Re-sync with Cover Image</span>
                </button>
              )}
            </div>
            <input
              type="url"
              placeholder={genOgImage}
              value={article.customOgImage || ''}
              onChange={(e) => onChange({ customOgImage: e.target.value, isOgImageCustom: true })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium font-mono text-[11px]"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Active image preview will appear in the Live Previews tab.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Live Previews */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setSerpDevice('desktop')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  serpDevice === 'desktop'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Google Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setSerpDevice('mobile')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  serpDevice === 'mobile'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Google Mobile</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setSocialPlatform('facebook')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  socialPlatform === 'facebook'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Facebook / LinkedIn Card
              </button>
              <button
                type="button"
                onClick={() => setSocialPlatform('twitter')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  socialPlatform === 'twitter'
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                X (Twitter) Card
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SERP Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Google Search Result ({serpDevice.toUpperCase()})
              </span>
              <div className={`p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-sans space-y-1.5 shadow-xs ${
                serpDevice === 'mobile' ? 'max-w-sm' : 'max-w-full'
              }`}>
                <div className="flex items-center space-x-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                    RF
                  </div>
                  <div className="truncate flex items-center space-x-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Research Factors</span>
                    <span>›</span>
                    <span>research</span>
                    <span>›</span>
                    <span className="text-slate-400 truncate">{article.slug || 'manuscript-title'}</span>
                  </div>
                </div>

                <h4 className="text-base text-[#1a0dab] dark:text-[#8ab4f8] font-normal hover:underline leading-snug cursor-pointer line-clamp-2">
                  {liveTitle}
                </h4>

                <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
                  <span className="text-slate-400">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} —{' '}
                  </span>
                  {liveDesc}
                </p>
              </div>
            </div>

            {/* Social Share Card Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {socialPlatform === 'facebook' ? 'Facebook / LinkedIn Card' : 'X (Twitter) Summary Card'}
              </span>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs max-w-md">
                {liveOgImage ? (
                  <div className="aspect-[1.91/1] w-full bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
                    <img
                      src={liveOgImage}
                      alt={liveOgTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-[1.91/1] w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    RESEARCHFACTORS.COM
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {liveOgTitle}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {liveOgDesc}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Real-Time SEO Quality Audit */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60">
            <div>
              <div className="text-sm font-bold text-blue-900 dark:text-blue-200">
                SEO Readiness Score: {audit.percentage}%
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {audit.totalPassed} of {audit.totalCount} automated technical criteria satisfied
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-blue-500 flex items-center justify-center font-bold text-sm text-blue-900 dark:text-blue-200">
              {audit.percentage}%
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {audit.checks.map((check) => (
              <div key={check.id} className="py-2.5 flex items-start space-x-3">
                <div className="mt-0.5">
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : check.score > 0 ? (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {check.label}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {check.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
