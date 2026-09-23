import React, { useState } from 'react';
import { Share2, Bookmark, Check, Twitter, Linkedin } from 'lucide-react';

export function ShareBar({ title, url = typeof window !== 'undefined' ? window.location.href : '', onBookmark, isBookmarked = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const shareUrl = url || window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback if clipboard API is restricted
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const shareTwitter = () => {
    const shareUrl = url || window.location.href;
    const text = encodeURIComponent(`"${title}" on Research Factors`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  };

  const shareLinkedIn = () => {
    const shareUrl = url || window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-center flex-wrap gap-2 text-xs font-semibold select-none">
      {/* Copy Link Button */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy article link"
        className={`inline-flex items-center justify-center space-x-1.5 h-9 px-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs ${
          copied
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
            : 'bg-paper hover:bg-paper-card border-paper-border text-ink-muted hover:text-ink-darkest hover:border-paper-border/80'
        }`}
        title={copied ? 'Link copied to clipboard' : 'Copy link to clipboard'}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-200" />
            <span className="font-bold text-emerald-700 dark:text-emerald-300">Link Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </>
        )}
      </button>

      {/* Twitter / X */}
      <button
        type="button"
        onClick={shareTwitter}
        aria-label="Share on X (formerly Twitter)"
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-paper-border bg-paper hover:bg-paper-card text-ink-muted hover:text-ink-darkest hover:border-paper-border/80 transition-all duration-200 cursor-pointer shadow-2xs"
        title="Share on X (Twitter)"
      >
        <Twitter className="w-3.5 h-3.5" />
      </button>

      {/* LinkedIn */}
      <button
        type="button"
        onClick={shareLinkedIn}
        aria-label="Share on LinkedIn"
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-paper-border bg-paper hover:bg-paper-card text-ink-muted hover:text-ink-darkest hover:border-paper-border/80 transition-all duration-200 cursor-pointer shadow-2xs"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-3.5 h-3.5" />
      </button>

      {/* Bookmark Button */}
      {onBookmark && (
        <button
          type="button"
          onClick={onBookmark}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
          className={`inline-flex items-center justify-center space-x-1.5 h-9 px-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs ${
            isBookmarked
              ? 'bg-rfblue text-white border-rfblue shadow-xs font-bold'
              : 'bg-paper hover:bg-paper-card border-paper-border text-ink-muted hover:text-ink-darkest hover:border-paper-border/80'
          }`}
          title={isBookmarked ? 'Saved to your bookmarks' : 'Bookmark for later reading'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          <span>{isBookmarked ? 'Saved' : 'Save'}</span>
        </button>
      )}
    </div>
  );
}
