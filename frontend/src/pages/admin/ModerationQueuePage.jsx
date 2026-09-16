import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  EyeOff,
  Trash2,
  ShieldAlert,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { adminApi } from '../../services/admin.api.js';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';

export default function ModerationQueuePage() {
  const [processingId, setProcessingId] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-moderation-queue'],
    queryFn: () => adminApi.getModerationQueue()
  });

  const comments = data?.data || [];

  const handleModerate = async (commentId, action) => {
    setProcessingId(commentId);
    try {
      await adminApi.moderateComment(commentId, { action });
      refetch();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Moderation action failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Helmet>
        <title>Community Moderation Queue — Research Factors</title>
      </Helmet>

      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center space-x-3 mb-8">
          <Link to="/admin" className="p-1.5 text-ink-muted hover:text-ink transition-colors rounded-lg">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-rfblue">
              <ShieldAlert className="w-4 h-4" />
              <span>Backoffice</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-ink-darkest">
              Community Moderation Desk
            </h1>
          </div>
        </div>

        {/* Moderation Items */}
        {isLoading ? (
          <div className="py-20 flex justify-center items-center text-ink-muted">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Loading flagged comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-paper-border">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-serif font-bold text-ink-darkest">
              No Pending Reports
            </h3>
            <p className="text-xs text-ink-light mt-1 max-w-md mx-auto">
              All community peer responses are currently adhering to editorial standards.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-paper-border shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="font-bold text-ink-darkest">{item.author?.name}</span>
                    <span className="text-ink-light">on</span>
                    <Link
                      to={`/articles/${item.article?.slug}`}
                      className="font-medium text-rfblue hover:underline"
                    >
                      {item.article?.title}
                    </Link>
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold">
                      {item.reportCount} {item.reportCount === 1 ? 'Report' : 'Reports'}
                    </span>
                  </div>

                  <div
                    className="text-sm text-ink-muted leading-relaxed font-sans bg-paper p-3 rounded-xl border border-paper-border"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />

                  {/* Reports list */}
                  {item.reports && item.reports.length > 0 && (
                    <div className="text-xs text-ink-light space-y-1">
                      <span className="font-semibold text-[10px] uppercase tracking-wider text-ink-muted">
                        Flagged Reasons:
                      </span>
                      {item.reports.map((r, idx) => (
                        <p key={idx} className="text-[11px]">
                          • <strong className="text-red-700">{r.reason}</strong> by {r.reporter} {r.details && `("${r.details}")`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleModerate(item.id, 'APPROVE')}
                    disabled={processingId === item.id}
                    className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Keep Visible</span>
                  </button>

                  <button
                    onClick={() => handleModerate(item.id, 'REMOVE')}
                    disabled={processingId === item.id}
                    className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-paper text-ink-muted hover:text-ink border border-paper-border transition-colors"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </button>

                  <button
                    onClick={() => handleModerate(item.id, 'SPAM')}
                    disabled={processingId === item.id}
                    className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Spam</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
