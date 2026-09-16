import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Send,
  Loader2,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { adminApi } from '../../services/admin.api.js';
import { BlockRenderer } from '../../components/article/BlockRenderer.jsx';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';

export default function ArticleReviewQueuePage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('PENDING_REVIEW');
  const [activeArticle, setActiveArticle] = useState(null);
  const [reviewAction, setReviewAction] = useState('PUBLISH'); // 'PUBLISH', 'APPROVE', 'REJECT'
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-review-queue', selectedStatus],
    queryFn: () => adminApi.getReviewQueue({ status: selectedStatus === 'ALL' ? undefined : selectedStatus })
  });

  const articles = data?.data || [];

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!activeArticle) return;

    setProcessing(true);
    try {
      await adminApi.reviewArticle(activeArticle.id, {
        action: reviewAction,
        feedback: feedbackNotes,
        isFeatured
      });
      alert(`Article successfully updated: ${reviewAction}`);
      setActiveArticle(null);
      setFeedbackNotes('');
      setIsFeatured(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Review action failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Helmet>
        <title>Editorial Review Queue — Research Factors</title>
      </Helmet>

      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center space-x-3 mb-6">
          <Link to="/admin" className="p-1.5 text-ink-muted hover:text-ink transition-colors rounded-lg">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-rfblue">
              Backoffice
            </span>
            <h1 className="text-3xl font-serif font-bold text-ink-darkest">
              Editorial Review Desk
            </h1>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-2 pb-4 mb-6 border-b border-paper-border overflow-x-auto">
          {['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ALL'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                selectedStatus === st
                  ? 'bg-ink-darkest text-white shadow-xs'
                  : 'bg-white border border-paper-border text-ink-muted hover:text-ink'
              }`}
            >
              {st === 'PENDING_REVIEW' ? 'Pending Review' :
               st === 'APPROVED' ? 'Approved' :
               st === 'REJECTED' ? 'Returned with Feedback' : 'All Manuscripts'}
            </button>
          ))}
        </div>

        {/* Manuscripts Table */}
        <div className="bg-white rounded-3xl border border-paper-border shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex justify-center items-center text-ink-muted">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm">Fetching review queue...</span>
            </div>
          ) : articles.length === 0 ? (
            <div className="py-20 text-center text-ink-muted">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-serif font-bold text-ink-darkest">
                Review Queue Clear
              </p>
              <p className="text-xs text-ink-light mt-1">
                No manuscripts currently match the selected status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper border-b border-paper-border text-ink-light uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Manuscript</th>
                    <th className="px-6 py-3 font-semibold">Field</th>
                    <th className="px-6 py-3 font-semibold">Author</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-border">
                  {articles.map(article => (
                    <tr key={article.id} className="hover:bg-paper/50 transition-colors">
                      <td className="px-6 py-4 max-w-sm">
                        <p className="font-bold text-ink-darkest truncate">{article.title}</p>
                        <p className="text-ink-muted text-[11px] truncate mt-0.5">{article.excerpt}</p>
                      </td>
                      <td className="px-6 py-4 text-ink-muted">
                        {article.category?.name || 'General'}
                      </td>
                      <td className="px-6 py-4 text-ink">
                        {article.author?.fullName || 'Researcher'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            article.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' :
                            article.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-700' :
                            article.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {article.status}
                          </span>
                          {article.isFeatured && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setActiveArticle(article);
                            setIsFeatured(Boolean(article.isFeatured));
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rfblue hover:bg-rfblue-700 text-white font-semibold text-xs shadow-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review & Inspection Modal */}
        {activeArticle && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-paper-border overflow-hidden">
              {/* Modal Header */}
              <div className="px-8 py-5 border-b border-paper-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rfblue">
                    Editorial Review Modal
                  </span>
                  <h3 className="text-lg font-bold font-serif text-ink-darkest">
                    {activeArticle.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveArticle(null)}
                  className="p-1.5 text-ink-light hover:text-ink rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body: Manuscript Prose Preview */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                <div className="p-4 bg-paper rounded-2xl border border-paper-border flex items-center justify-between text-xs text-ink-muted">
                  <span>Author: <strong>{activeArticle.author?.fullName}</strong></span>
                  <span>Category: <strong>{activeArticle.category?.name}</strong></span>
                  <span>Reading Time: <strong>{activeArticle.readingTimeMin} min</strong></span>
                </div>

                <div className="prose max-w-none">
                  <p className="text-sm italic text-ink-muted border-l-2 border-rfblue pl-3">
                    {activeArticle.excerpt}
                  </p>
                  <BlockRenderer blocks={activeArticle.blocks} />
                </div>
              </div>

              {/* Modal Footer: Action Form */}
              <form onSubmit={handleReviewSubmit} className="px-8 py-5 border-t border-paper-border bg-paper flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder="Feedback / internal editorial notes..."
                    className="w-full text-xs p-2.5 rounded-xl border border-paper-border bg-white text-ink focus:outline-none focus:ring-1 focus:ring-rfblue"
                  />
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <label className="flex items-center space-x-1.5 text-xs font-semibold text-ink cursor-pointer select-none px-2 py-1 rounded-lg border border-paper-border bg-white hover:bg-paper">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded text-rfblue focus:ring-rfblue w-3.5 h-3.5 border-paper-border"
                    />
                    <span>Featured</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => { setReviewAction('REJECT'); }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      reviewAction === 'REJECT' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-paper-border text-red-600 hover:bg-red-50'
                    }`}
                  >
                    Reject with Notes
                  </button>

                  <button
                    type="button"
                    onClick={() => { setReviewAction('APPROVE'); }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      reviewAction === 'APPROVE' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-paper-border text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    Approve
                  </button>

                  <button
                    type="submit"
                    disabled={processing}
                    onClick={() => { setReviewAction('PUBLISH'); }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-rfblue hover:bg-rfblue-700 text-white shadow-xs transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Publish Live'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
