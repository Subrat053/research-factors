import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, AlertCircle, Loader2 } from 'lucide-react';
import { commentsApi } from '../../services/comments.api';
import { CommentItem } from './CommentItem';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const CommentSection = ({ articleId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await commentsApi.getComments(articleId);
      setComments(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (articleId) {
      fetchComments();
    }
  }, [articleId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await commentsApi.createComment(articleId, { content: newCommentText });
      setComments(prev => [res.data, ...prev]);
      setNewCommentText('');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const res = await commentsApi.toggleLike(commentId);
      const { liked, likeCount } = res.data;

      setComments(prev =>
        prev.map(c => {
          if (c.id === commentId) {
            return { ...c, hasLiked: liked, likeCount };
          }
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: c.replies.map(r => r.id === commentId ? { ...r, hasLiked: liked, likeCount } : r)
            };
          }
          return c;
        })
      );
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Please sign in to like this response');
      }
    }
  };

  const handleReplyComment = async (parentId, replyContent) => {
    const res = await commentsApi.createComment(articleId, {
      content: replyContent,
      parentId
    });

    setComments(prev =>
      prev.map(c => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), res.data]
          };
        }
        return c;
      })
    );
  };

  const handleReportComment = async (commentId, data) => {
    await commentsApi.reportComment(commentId, data);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this response?')) return;

    try {
      await commentsApi.deleteComment(commentId);
      setComments(prev =>
        prev
          .filter(c => c.id !== commentId)
          .map(c => ({
            ...c,
            replies: (c.replies || []).filter(r => r.id !== commentId)
          }))
      );
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete response');
    }
  };

  return (
    <section className="mt-16 pt-12 border-t border-slate-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
            Responses ({comments.length})
          </h3>
        </div>
      </div>

      {/* Post comment form */}
      {user ? (
        <form onSubmit={handlePostComment} className="mb-10">
          <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm focus-within:border-brand-500 transition-colors">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Contribute to the research discourse..."
              rows={3}
              className="w-full text-sm font-sans bg-transparent focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              required
            />
            <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-xs text-slate-400">
                Supports standard markup (bold, italic, links, code)
              </span>
              <button
                type="submit"
                disabled={submitting || !newCommentText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Publish Response</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-10 p-6 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Join the conversation. Sign in to contribute peer feedback and questions.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-100 rounded-lg transition-colors"
          >
            Sign In to Respond
          </Link>
        </div>
      )}

      {/* Comment listing */}
      {loading ? (
        <div className="py-8 flex justify-center items-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Loading responses...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-10 text-center text-slate-400">
          <p className="text-sm">No responses yet. Be the first to share your perspective!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={handleLikeComment}
              onReply={handleReplyComment}
              onReport={handleReportComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}
    </section>
  );
};
