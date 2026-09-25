import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articlesApi } from '../../services/articles.api.js';
import { normalizeMediaUrl } from '../../services/media.api.js';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { BlockRenderer } from '../../components/article/BlockRenderer.jsx';
import { DetailSkeleton } from '../../components/feedback/SkeletonLoader.jsx';
import {
  Clock,
  ChevronRight,
  ShieldCheck,
  Eye,
  ArrowLeft,
  X,
  AlertCircle
} from 'lucide-react';

export default function ArticlePreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    articlesApi.getDraft(id)
      .then(res => {
        if (res.data) {
          setDraft(res.data);
        } else {
          setError('Draft not found or access denied.');
        }
      })
      .catch(err => {
        setError(err.response?.data?.error?.message || err.message || 'Unable to load draft preview.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-paper text-ink">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <DetailSkeleton />
        </main>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen flex flex-col bg-paper text-ink">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="p-8 rounded-3xl bg-white border border-paper-border shadow-xs">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-ink-darkest mb-2">
              Preview Unavailable
            </h2>
            <p className="text-sm text-ink-muted mb-6">{error || 'Draft manuscript could not be retrieved.'}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => window.close()}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink border border-paper-border hover:bg-paper transition-all cursor-pointer"
              >
                Close Tab
              </button>
              <Link
                to={`/admin/editor/${id}`}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rfblue hover:bg-rfblue-700 transition-all cursor-pointer"
              >
                Return to Editor
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Helmet>
        <title>[Preview] {draft.title || 'Untitled Manuscript'} — Research Factors</title>
      </Helmet>

      {/* Sticky Production Simulation Banner */}
      <div className="sticky top-0 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center space-x-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-slate-950 animate-ping" />
          <Eye className="w-4 h-4 text-slate-950 ml-1" />
          <span>Live Preview • Status: {draft.status || 'DRAFT'} (Unpublished)</span>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to={`/admin/editor/${id}`}
            className="inline-flex items-center space-x-1 px-3 py-1 rounded-md bg-slate-950 text-white hover:bg-slate-800 transition-colors text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Editor</span>
          </Link>
          <button
            onClick={() => window.close()}
            className="p-1 hover:bg-amber-600 rounded text-slate-950 transition-colors cursor-pointer"
            title="Close Preview Tab"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Header />

      <main className="flex-1">
        <article className="pt-8 sm:pt-10 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Main Content Column */}
              <div className="lg:col-span-8 space-y-8 min-w-0">
                {/* 1. Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-xs sm:text-sm text-ink-light flex-wrap">
                  <Link to="/" className="hover:text-rfblue transition-colors">Home</Link>
                  <ChevronRight className="w-3.5 h-3.5" />
                  {draft.category ? (
                    <Link
                      to={`/categories/${draft.category.slug}`}
                      className="hover:text-rfblue font-medium text-ink-muted transition-colors"
                    >
                      {draft.category.name}
                    </Link>
                  ) : (
                    <Link to="/research" className="hover:text-rfblue transition-colors">
                      Research
                    </Link>
                  )}
                </nav>

                {/* 2. Format & Reading Time */}
                <div className="flex items-center space-x-3 text-xs sm:text-sm">
                  <Link
                    to={`/research?type=${draft.type || 'RESEARCH'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rfblue-50 hover:bg-rfblue-100 text-rfblue border border-rfblue-100 hover:border-rfblue-200 transition-colors cursor-pointer"
                    title={`Browse all ${draft.type || 'RESEARCH'} articles`}
                  >
                    {draft.type || 'RESEARCH'}
                  </Link>
                  <span className="flex items-center text-ink-light font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {draft.readingTimeMin || 1} min read
                  </span>
                </div>

                {/* 3. Title */}
                <h2 className="tracking-tight text-ink-darkest font-semibold">
                  {draft.title || 'Untitled Manuscript'}
                </h2>

                {/* 4. Subtitle / Thesis Statement */}
                {draft.subtitle && (
                  <p className="text-lead text-ink-muted">
                    {draft.subtitle}
                  </p>
                )}

                {/* 5. Author Header */}
                <div className="pt-6 border-t border-paper-border flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-full bg-rfblue-50 border border-rfblue-100 flex items-center justify-center text-rfblue font-bold text-base shrink-0">
                    {draft.author?.firstName?.[0] || 'A'}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-ink-darkest flex items-center">
                      {draft.author?.fullName || 'Research Author'}
                      <ShieldCheck className="w-4 h-4 text-rfblue ml-1.5" title="Author Verification" />
                    </h3>
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-ink-light mt-0.5">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>{draft.author?.authorProfile?.headline || 'Editorial Author'}</span>
                    </div>
                  </div>
                </div>

                {/* 6. Hero Cover Asset */}
                {draft.coverImageUrl && (
                  <figure className="my-8">
                    <div className="rounded-2xl overflow-hidden border border-paper-border shadow-md bg-paper max-h-[520px]">
                      <img
                        src={normalizeMediaUrl(draft.coverImageUrl)}
                        alt={draft.coverImageAlt || draft.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {draft.coverImageAlt && (
                      <figcaption className="text-center text-xs sm:text-sm text-ink-light mt-2.5 italic">
                        {draft.coverImageAlt}
                      </figcaption>
                    )}
                  </figure>
                )}

                {/* 7. Article Prose Blocks */}
                <div className="w-full">
                  <BlockRenderer blocks={draft.blocks || []} />
                </div>

                {/* 8. Topic Tags in Normal Form */}
                {draft.tags && draft.tags.length > 0 && (
                  <div className="pt-8 border-t border-paper-border">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-light block mb-3">
                      Tags:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {draft.tags.map((tag, idx) => {
                        const raw = typeof tag === 'string' ? tag : (tag.name || tag.slug || '');
                        const clean = String(raw).replace(/^#+/, '').trim();
                        let name = (typeof tag === 'object' && tag.name) ? tag.name : clean;
                        name = name.replace(/^#+/, '').trim();
                        if (name.includes('_') || (name.includes('-') && !name.includes(' '))) {
                          name = name.replace(/[-_]/g, ' ');
                        }
                        return (
                          <span
                            key={tag.id || idx}
                            className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#eef5f6] text-[#0f5466] border border-[#d6e7eb] shadow-2xs"
                          >
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 9. Author Biography */}
                <div className="p-6 sm:p-8 rounded-2xl bg-white border border-paper-border shadow-xs flex items-start space-x-5">
                  <div className="w-14 h-14 rounded-2xl bg-rfblue-50 text-rfblue flex items-center justify-center font-bold text-lg border border-rfblue-100 shrink-0">
                    {draft.author?.firstName?.[0] || 'A'}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-rfblue">
                      Author Biography
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-ink-darkest mt-0.5">
                      {draft.author?.fullName || 'Research Author'}
                    </h4>
                    <p className="text-xs sm:text-sm text-ink-light mt-0.5">
                      {draft.author?.authorProfile?.headline || 'Research Fellow'}
                    </p>
                    <p className="text-sm sm:text-base text-ink-muted mt-3 leading-relaxed">
                      {draft.author?.authorProfile?.biography || 'Contributor to Research Factors.'}
                    </p>
                  </div>
                </div>

                {/* 10. Preview Notice for Comments */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-paper-border text-center text-ink-muted text-sm">
                  <p className="font-semibold text-ink-darkest mb-1">Peer Review & Discourse</p>
                  <p className="text-xs">Community feedback and academic comments are enabled once the manuscript is approved and published.</p>
                </div>
              </div>

              {/* Sidebar Summary */}
              <div className="hidden lg:block lg:col-span-4 sticky top-24 space-y-6">
                {/* Sponsored Card Preview */}
                {draft.isSponsored && draft.sponsorName && (
                  <div className="p-6 rounded-2xl bg-white border border-paper-border shadow-xs space-y-3">
                    <span className="text-[11px] font-bold tracking-widest text-[#c25e34] uppercase block">
                      SPONSORED
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-darkest leading-snug">
                      {draft.sponsorName}
                    </h3>
                    {draft.sponsorDescription && (
                      <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                        {draft.sponsorDescription}
                      </p>
                    )}
                    {draft.sponsorUrl && (
                      <div className="pt-2">
                        <a
                          href={draft.sponsorUrl}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#c25e34] hover:bg-[#a94f29] transition-colors shadow-2xs"
                        >
                          Visit Sponsor
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6 rounded-2xl bg-white border border-paper-border shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-rfblue mb-3">
                    Manuscript Metadata
                  </h4>
                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-paper-border/60">
                      <dt className="text-ink-light">Format</dt>
                      <dd className="font-semibold text-ink-darkest">{draft.type || 'RESEARCH'}</dd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-paper-border/60">
                      <dt className="text-ink-light">Estimated Reading Time</dt>
                      <dd className="font-semibold text-ink-darkest">{draft.readingTimeMin || 1} min</dd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-paper-border/60">
                      <dt className="text-ink-light">Content Blocks</dt>
                      <dd className="font-semibold text-ink-darkest">{(draft.blocks || []).length} blocks</dd>
                    </div>
                    <div className="flex justify-between py-1">
                      <dt className="text-ink-light">Editorial Status</dt>
                      <dd className="font-semibold text-amber-700">{draft.status || 'DRAFT'}</dd>
                    </div>
                  </dl>
                  <div className="mt-5 pt-4 border-t border-paper-border">
                    <Link
                      to={`/admin/editor/${id}`}
                      className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rfblue hover:bg-rfblue-700 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Studio</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
