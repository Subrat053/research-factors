import React, { useState } from 'react';
import { Share2, Bookmark, Check, Twitter, Linkedin } from 'lucide-react';

export function ShareBar({ title, url = window.location.href, onBookmark, isBookmarked = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`"${title}" on Research Factors`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Copy Link Button */}
      <button
        onClick={handleCopy}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-paper-border bg-white hover:bg-paper text-xs font-semibold text-ink-muted transition-colors shadow-xs"
        title="Copy article link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-rfblue" />
            <span className="text-rfblue">Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </>
        )}
      </button>

      {/* Twitter/X */}
      <button
        onClick={shareTwitter}
        className="p-1.5 rounded-lg border border-paper-border bg-white hover:bg-paper text-ink-muted hover:text-ink transition-colors shadow-xs"
        title="Share on X / Twitter"
      >
        <Twitter className="w-3.5 h-3.5" />
      </button>

      {/* LinkedIn */}
      <button
        onClick={shareLinkedIn}
        className="p-1.5 rounded-lg border border-paper-border bg-white hover:bg-paper text-ink-muted hover:text-ink transition-colors shadow-xs"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-3.5 h-3.5" />
      </button>

      {/* Bookmark Button */}
      {onBookmark && (
        <button
          onClick={onBookmark}
          className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold shadow-xs ${
            isBookmarked
              ? 'bg-rfblue text-white border-rfblue'
              : 'bg-white border-paper-border text-ink-muted hover:bg-paper'
          }`}
          title={isBookmarked ? 'Saved to Bookmarks' : 'Bookmark for later'}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>{isBookmarked ? 'Saved' : 'Save'}</span>
        </button>
      )}
    </div>
  );
}
