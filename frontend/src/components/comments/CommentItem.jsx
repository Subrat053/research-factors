import React, { useState } from 'react';
import { Heart, Reply, Flag, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const CommentItem = ({
  comment,
  onLike,
  onReply,
  onReport,
  onDelete,
  isReply = false
}) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('SPAM');
  const [reportDetails, setReportDetails] = useState('');
  const [reportedSuccessfully, setReportedSuccessfully] = useState(false);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    try {
      await onReply(comment.id, replyText);
      setReplyText('');
      setShowReplyForm(false);
    } catch {
      // Handled in parent
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await onReport(comment.id, { reason: reportReason, details: reportDetails });
      setReportedSuccessfully(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportedSuccessfully(false);
      }, 1500);
    } catch {
      // Handled in parent
    }
  };

  const isAuthor = user && comment.author?.id === user.id;
  const canDelete = isAuthor || user?.permissions?.includes('comment.moderate');

  return (
    <div className={`group py-4 ${isReply ? 'ml-8 pl-4 border-l-2 border-slate-100 dark:border-zinc-800' : 'border-b border-slate-100 dark:border-zinc-800/80'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/50 flex items-center justify-center text-xs font-semibold text-brand-700 dark:text-brand-300 overflow-hidden shrink-0">
            {comment.author?.avatarUrl ? (
              <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-full h-full object-cover" />
            ) : (
              comment.author?.name?.charAt(0) || 'U'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-slate-900 dark:text-slate-100">{comment.author?.name || 'Researcher'}</span>
              <span className="text-xs text-slate-400">
                {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {user && !isAuthor && (
            <button
              onClick={() => setShowReportModal(true)}
              className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
              title="Report response"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
              title="Delete response"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: comment.content }}
      />

      {/* Bottom bar: like count & reply toggle */}
      <div className="mt-3 flex items-center gap-4 text-xs font-medium text-slate-500">
        <button
          onClick={() => onLike(comment.id)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
            comment.hasLiked
              ? 'text-red-600 bg-red-50 dark:bg-red-950/30'
              : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${comment.hasLiked ? 'fill-current' : ''}`} />
          <span>{comment.likeCount || 0}</span>
        </button>

        {/* Only top level comments allow replies (Depth <= 1 rule) */}
        {!isReply && user && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>
        )}
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="mt-4 pl-4 border-l-2 border-brand-500">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.author?.name || 'this response'}...`}
            rows={2}
            className="w-full text-sm p-2.5 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
            required
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReply || !replyText.trim()}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors disabled:opacity-50"
            >
              {submittingReply ? 'Replying...' : 'Post Reply'}
            </button>
          </div>
        </form>
      )}

      {/* Direct 1-level Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReply={onReply}
              onReport={onReport}
              onDelete={onDelete}
              isReply={true}
            />
          ))}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-zinc-800">
            {reportedSuccessfully ? (
              <div className="text-center py-4">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">Report Submitted</h4>
                <p className="text-xs text-slate-500 mt-1">Our editorial moderation team will investigate this response.</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit}>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Report Response</h4>
                <p className="text-xs text-slate-500 mb-4">Select the reason why this response violates platform guidelines:</p>
                <div className="space-y-2 mb-4">
                  {['SPAM', 'OFFENSIVE', 'HARASSMENT', 'MISINFORMATION', 'OTHER'].map(reason => (
                    <label key={reason} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason}
                        checked={reportReason === reason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <span>{reason.charAt(0) + reason.slice(1).toLowerCase()}</span>
                    </label>
                  ))}
                </div>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Optional context or explanation..."
                  rows={2}
                  className="w-full text-xs p-2 rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white mb-4 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
