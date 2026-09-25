import React, { useState } from 'react';
import { Share2, Bookmark, Twitter, Linkedin } from 'lucide-react';
import { generateShareableUrl, getShareLinks } from '../../utils/shareUrl.js';
import { ShareModal } from './ShareModal.jsx';

export function ShareBar({
  article = null,
  title = '',
  url = '',
  onBookmark,
  isBookmarked = false
}) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Normalize article entity for dynamic link and metadata resolution
  const articleEntity = article || {
    title: title || 'Research Publication',
    canonicalUrl: url || (typeof window !== 'undefined' ? window.location.href : '')
  };

  const resolvedTitle = article?.title || title || 'Research Publication';
  const shareUrl = url || generateShareableUrl(articleEntity);
  const shareLinks = getShareLinks({
    title: resolvedTitle,
    url: shareUrl,
    excerpt: article?.subtitle || article?.excerpt || ''
  });

  const handleOpenShareModal = () => {
    setIsShareModalOpen(true);
  };

  const shareTwitter = () => {
    window.open(shareLinks.twitter, '_blank', 'noopener,noreferrer');
  };

  const shareLinkedIn = () => {
    window.open(shareLinks.linkedin, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="flex items-center flex-wrap gap-2 text-xs font-semibold select-none">
        {/* Share Button (Opens Rich Share Modal) */}
        <button
          type="button"
          onClick={handleOpenShareModal}
          aria-label="Share and copy link"
          className="inline-flex items-center justify-center space-x-1.5 h-9 px-3.5 rounded-xl border border-paper-border bg-paper hover:bg-paper-card text-ink-muted hover:text-ink-darkest hover:border-paper-border/80 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
          title="Share article or generate public link"
        >
          <Share2 className="w-3.5 h-3.5 text-rfblue" />
          <span>Share</span>
        </button>

        {/* Quick Twitter / X */}
        <button
          type="button"
          onClick={shareTwitter}
          aria-label="Share on X (formerly Twitter)"
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-paper-border bg-paper hover:bg-paper-card text-ink-muted hover:text-ink-darkest hover:border-paper-border/80 transition-all duration-200 cursor-pointer shadow-2xs active:scale-95"
          title="Share on X (Twitter)"
        >
          <Twitter className="w-3.5 h-3.5" />
        </button>

        {/* Quick LinkedIn */}
        <button
          type="button"
          onClick={shareLinkedIn}
          aria-label="Share on LinkedIn"
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-paper-border bg-paper hover:bg-paper-card text-ink-muted hover:text-ink-darkest hover:border-paper-border/80 transition-all duration-200 cursor-pointer shadow-2xs active:scale-95"
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
            className={`inline-flex items-center justify-center space-x-1.5 h-9 px-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs active:scale-95 ${
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

      {/* Interactive Editorial Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        article={articleEntity}
        url={shareUrl}
      />
    </>
  );
}
