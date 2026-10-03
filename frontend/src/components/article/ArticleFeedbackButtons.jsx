import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { recommendationsApi } from '../../services/recommendations.api.js';

export function ArticleFeedbackButtons({
  articleId,
  initialState = 'NONE',
  variant = 'compact', // 'compact' | 'card'
  onFeedbackChange = null
}) {
  const queryClient = useQueryClient();
  const [feedbackState, setFeedbackState] = useState(initialState);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state if initial state updates or load from API
  useEffect(() => {
    if (initialState && initialState !== 'NONE') {
      setFeedbackState(initialState);
    }
  }, [initialState]);

  // Passively fetch active feedback for this visitor/user if not initialized
  const { data: feedbackData } = useQuery({
    queryKey: ['article-feedback', articleId],
    queryFn: () => recommendationsApi.getArticleFeedback(articleId),
    enabled: Boolean(articleId && initialState === 'NONE'),
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (feedbackData?.data?.feedbackState) {
      setFeedbackState(feedbackData.data.feedbackState);
    }
  }, [feedbackData]);

  const handleToggle = async (type) => {
    if (!articleId || isUpdating) return;

    const previousState = feedbackState;
    const targetState = feedbackState === type ? 'NONE' : type;

    // 1. Optimistic UI update
    setFeedbackState(targetState);
    if (onFeedbackChange) {
      onFeedbackChange(targetState);
    }

    setIsUpdating(true);
    try {
      const res = await recommendationsApi.setArticleFeedback({
        articleId,
        feedbackType: type
      });

      const confirmedState = res?.data?.feedbackState || targetState;
      setFeedbackState(confirmedState);

      // Invalidate recommendation queries silently without layout shifts
      queryClient.invalidateQueries({ queryKey: ['article-recommendations', articleId] });
      queryClient.invalidateQueries({ queryKey: ['article-feedback', articleId] });
    } catch (err) {
      console.error('Feedback toggle failed, reverting state', err);
      setFeedbackState(previousState);
      if (onFeedbackChange) {
        onFeedbackChange(previousState);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const isLiked = feedbackState === 'LIKE';
  const isDisliked = feedbackState === 'DISLIKE';

  // Compact variant for ShareBar / Action Clusters
  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center space-x-1 select-none" role="group" aria-label="Article feedback">
        {/* Like Button */}
        <button
          type="button"
          onClick={() => handleToggle('LIKE')}
          disabled={isUpdating}
          aria-label={isLiked ? 'Remove helpful vote' : 'Mark research as helpful'}
          aria-pressed={isLiked}
          title={isLiked ? 'You marked this research as helpful' : 'Helpful research'}
          className={`inline-flex items-center justify-center space-x-1.5 h-9 px-3 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs active:scale-95 ${
            isLiked
              ? 'bg-rfblue text-white border-rfblue shadow-xs font-bold'
              : 'bg-paper hover:bg-paper-card border-paper-border text-ink-muted hover:text-ink-darkest hover:border-paper-border/80'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-xs font-semibold">{isLiked ? 'Liked' : 'Like'}</span>
        </button>

        {/* Dislike Button */}
        <button
          type="button"
          onClick={() => handleToggle('DISLIKE')}
          disabled={isUpdating}
          aria-label={isDisliked ? 'Remove unhelpful vote' : 'Mark research as unhelpful'}
          aria-pressed={isDisliked}
          title={isDisliked ? 'You marked this as unhelpful (suppressed from recommendations)' : 'Not relevant / unhelpful'}
          className={`inline-flex items-center justify-center space-x-1.5 h-9 px-3 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs active:scale-95 ${
            isDisliked
              ? 'bg-slate-700 dark:bg-slate-600 text-white border-slate-700 shadow-xs font-bold'
              : 'bg-paper hover:bg-paper-card border-paper-border text-ink-muted hover:text-ink-darkest hover:border-paper-border/80'
          }`}
        >
          <ThumbsDown className={`w-3.5 h-3.5 ${isDisliked ? 'fill-current' : ''}`} />
          <span className="text-xs font-semibold">{isDisliked ? 'Disliked' : 'Dislike'}</span>
        </button>
      </div>
    );
  }

  // Editorial Card Banner for bottom of article prose
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-paper-card border border-paper-border shadow-xs my-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="space-y-1 text-center sm:text-left">
        <h4 className="font-serif text-lg font-bold text-ink-darkest">
          Was this research valuable for your exploration?
        </h4>
        <p className="text-xs sm:text-sm text-ink-muted">
          Your feedback tunes personalized recommendations and editorial suggestions.
        </p>
      </div>

      <div className="flex items-center space-x-2.5 shrink-0">
        <button
          type="button"
          onClick={() => handleToggle('LIKE')}
          disabled={isUpdating}
          aria-label="Helpful research"
          aria-pressed={isLiked}
          className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-2xs active:scale-95 ${
            isLiked
              ? 'bg-rfblue text-white border-rfblue shadow-xs font-bold'
              : 'bg-paper hover:bg-slate-100 dark:hover:bg-slate-800 border-paper-border text-ink-darkest hover:border-paper-border/90'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          {/* <span>Helpful {isLiked && '✓'}</span> */}
        </button>

        <button
          type="button"
          onClick={() => handleToggle('DISLIKE')}
          disabled={isUpdating}
          aria-label="Not relevant"
          aria-pressed={isDisliked}
          className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-2xs active:scale-95 ${
            isDisliked
              ? 'bg-slate-700 text-white border-slate-700 shadow-xs font-bold'
              : 'bg-paper hover:bg-slate-100 dark:hover:bg-slate-800 border-paper-border text-ink-muted hover:text-ink-darkest hover:border-paper-border/90'
          }`}
        >
          <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-current' : ''}`} />
          {/* <span>Not Relevant {isDisliked && '✓'}</span> */}
        </button>
      </div>
    </div>
  );
}
