import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { seoApi } from '../../services/seo.api.js';
import {
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FolderTree,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  Sliders,
  Filter,
  FileCode,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export default function SeoAuditPage() {
  const queryClient = useQueryClient();
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'SNIPPET' | 'IMAGE' | 'TITLE'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAlert, setActiveAlert] = useState(null);

  // 1. Fetch live operational SEO audit metrics
  const { data: auditData, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['admin-seo-audit'],
    queryFn: () => seoApi.getAudit(),
    staleTime: 1000 * 60 * 2
  });

  const metrics = auditData?.data?.metrics || {
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    indexableArticles: 0,
    noIndexArticles: 0,
    articlesWithMetadataRecord: 0,
    coveragePercentage: 100,
    totalCategories: 0,
    activeCategories: 0,
    emptyCategories: 0,
    slugHistoryRedirects: 0
  };

  const warnings = auditData?.data?.actionableWarnings || [];
  const sitemapUrls = auditData?.data?.sitemapUrls || {
    masterIndex: `${window.location.origin}/sitemap.xml`,
    articles: `${window.location.origin}/sitemaps/articles.xml`,
    categories: `${window.location.origin}/sitemaps/categories.xml`,
    pages: `${window.location.origin}/sitemaps/pages.xml`,
    robots: `${window.location.origin}/robots.txt`
  };

  // 2. Migration Mutation (Backfill missing baseline SEO records)
  const migrationMutation = useMutation({
    mutationFn: () => seoApi.migrateMissingSeo(),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-seo-audit']);
      setActiveAlert({
        type: 'success',
        message: `SEO Catalog Synced: Initialized ${res.data?.articlesInitialized || 0} articles, ${res.data?.categoriesInitialized || 0} categories, and ${res.data?.pagesInitialized || 0} static pages.`
      });
    },
    onError: (err) => {
      setActiveAlert({
        type: 'error',
        message: err.message || 'Failed to complete SEO catalog backfill.'
      });
    }
  });

  const handleCopy = (url, key) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Filtered warnings
  const filteredWarnings = warnings.filter(w => {
    const matchesSearch = !searchQuery ||
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.author && w.author.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'SNIPPET') {
      return w.issues.some(i => i.toLowerCase().includes('excerpt') || i.toLowerCase().includes('description'));
    }
    if (filterType === 'IMAGE') {
      return w.issues.some(i => i.toLowerCase().includes('image') || i.toLowerCase().includes('alt'));
    }
    if (filterType === 'TITLE') {
      return w.issues.some(i => i.toLowerCase().includes('title'));
    }
    return true;
  });

  return (
    <AdminLayout
      title="Search Engine Optimization & Indexing Governance"
      subtitle="Metadata coverage, automated XML sitemaps, robots.txt directives, and content audit diagnostics"
      actions={
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefetching ? 'Auditing...' : 'Re-run Audit'}</span>
          </button>

          <button
            type="button"
            onClick={() => migrationMutation.mutate()}
            disabled={migrationMutation.isPending}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${migrationMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{migrationMutation.isPending ? 'Syncing Catalog...' : 'Backfill Missing SEO'}</span>
          </button>
        </div>
      }
    >
      <Helmet>
        <title>SEO Governance & Audit — Research Factors Admin</title>
      </Helmet>

      {/* Alert Banner */}
      {activeAlert && (
        <div className={`p-4 rounded-xl mb-6 flex items-center justify-between text-xs font-medium ${
          activeAlert.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
            : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60'
        }`}>
          <div className="flex items-center space-x-2">
            {activeAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{activeAlert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveAlert(null)}
            className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Coverage Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Catalog SEO Coverage</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.coveragePercentage}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {metrics.articlesWithMetadataRecord} of {metrics.publishedArticles} published articles have persistent SEO records
          </p>
        </div>

        {/* Indexable Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Indexable in Google</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.indexableArticles}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {metrics.noIndexArticles > 0 ? `${metrics.noIndexArticles} flagged with noindex directive` : 'All published articles are indexable'}
          </p>
        </div>

        {/* Category Health */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Category Taxonomy</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <FolderTree className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.activeCategories} Active
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {metrics.emptyCategories > 0 ? `${metrics.emptyCategories} empty categories excluded from sitemaps` : 'All categories contain published articles'}
          </p>
        </div>

        {/* 301 URL Preservation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">301 Redirect Mappings</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.slugHistoryRedirects}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Legacy publication slugs automatically redirecting to preserve backlink authority
          </p>
        </div>
      </div>

      {/* XML Sitemaps & Search Console Central */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-xs mb-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Automated XML Sitemaps & Crawler Endpoints</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Compliant sitemap index, targeted sub-sitemaps, and dynamic robots.txt.
            </p>
          </div>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
          >
            <span>Open Google Search Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              name: 'Master Sitemap Index',
              key: 'master',
              url: sitemapUrls.masterIndex,
              desc: 'Submits all component sub-sitemaps to Google/Bing'
            },
            {
              name: 'Articles Sub-sitemap',
              key: 'articles',
              url: sitemapUrls.articles,
              desc: 'All indexable published publications'
            },
            {
              name: 'Categories Sub-sitemap',
              key: 'categories',
              url: sitemapUrls.categories,
              desc: 'Active research category hubs'
            },
            {
              name: 'Static Pages Sub-sitemap',
              key: 'pages',
              url: sitemapUrls.pages,
              desc: 'Home, about, contact, and legal pages'
            },
            {
              name: 'Robots.txt Directive',
              key: 'robots',
              url: sitemapUrls.robots,
              desc: 'Controls crawler access and declares sitemap location'
            }
          ].map((item) => (
            <div
              key={item.key}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col justify-between space-y-2"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {item.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {item.key === 'robots' ? 'TXT' : 'XML'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  {item.desc}
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                <input
                  type="text"
                  readOnly
                  value={item.url}
                  className="flex-1 text-[10px] font-mono px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 truncate"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(item.url, item.key)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="Copy URL"
                >
                  {copiedUrl === item.key ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  title="Open live endpoint"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Warnings & Editorial Diagnostics Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Editorial Diagnostics & Quality Warnings
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                {warnings.length} Flagged
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live checks on snippet length, headline clarity, and image metadata
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter Pills */}
            <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-[11px]">
              {[
                { id: 'ALL', label: 'All Issues' },
                { id: 'SNIPPET', label: 'Snippet' },
                { id: 'IMAGE', label: 'Image/Alt' },
                { id: 'TITLE', label: 'Title' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterType === tab.id
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search publication..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Running SEO audit scan across publication catalog...</p>
          </div>
        ) : filteredWarnings.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No SEO Quality Deficiencies Found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              All published articles in your catalog satisfy baseline search snippet lengths, cover image guidelines, and headline requirements.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/70">
                  <th className="py-3 px-6">Publication</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Author</th>
                  <th className="py-3 px-6">Detected Quality Deficiencies</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredWarnings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-6 font-medium text-slate-900 dark:text-slate-100 max-w-xs">
                      <div className="truncate font-semibold">{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        /rf/{item.categorySlug || (item.category ? item.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'research')}/{item.slug}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-slate-600 dark:text-slate-300">
                      {item.category || '—'}
                    </td>
                    <td className="py-3 px-6 text-slate-600 dark:text-slate-300">
                      {item.author || 'Editorial Staff'}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {item.issues.map((issue, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                            <span>{issue}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <Link
                        to={`/admin/editor/${item.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      >
                        <span>Fix in Editor</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
