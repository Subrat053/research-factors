import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  Mail,
  Share2,
  Smartphone
} from 'lucide-react';
import { generateShareableUrl, copyToClipboard, getShareLinks } from '../../utils/shareUrl.js';

export function ShareModal({
  isOpen,
  onClose,
  article,
  url: customUrl = null
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const inputRef = useRef(null);

  // Generate dynamic canonical public URL
  const shareUrl = customUrl || generateShareableUrl(article);
  const shareLinks = getShareLinks({
    title: article?.title || 'Research Factors Publication',
    url: shareUrl,
    excerpt: article?.subtitle || article?.excerpt || ''
  });

  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  // Handle Escape key to dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset copy feedback on close
  useEffect(() => {
    if (!isOpen) {
      setCopiedLink(false);
    }
  }, [isOpen]);

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: article?.title || 'Research Factors Publication',
        text: article?.subtitle || article?.excerpt || 'Read this empirical research on Research Factors.',
        url: shareUrl
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed:', err);
      }
    }
  };

  const handleOpenChannel = (href) => {
    window.open(href, '_blank', 'noopener,noreferrer,width=640,height=520');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
        >
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto bg-white dark:bg-slate-900 rounded-3xl border border-paper-border dark:border-slate-800 shadow-2xl p-5 sm:p-6 md:p-7 text-ink dark:text-slate-100 z-10"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
              <div className="min-w-0 pr-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rfblue-50 dark:bg-rfblue-950/60 text-rfblue dark:text-blue-400 border border-rfblue-100 dark:border-rfblue-900/60 mb-2">
                  <Share2 className="w-3 h-3" />
                  <span>Share</span>
                </div>
                <h3
                  id="share-modal-title"
                  className="text-base sm:text-lg md:text-xl font-bold font-serif text-ink-darkest dark:text-white tracking-tight leading-snug line-clamp-2"
                >
                  {article?.title || 'Share this research publication'}
                </h3>
                <p className="text-xs sm:text-sm text-ink-light dark:text-slate-400 mt-1">
                  Share this peer-reviewed research and findings with your network.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close share dialog"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dynamic Public URL Input Box */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-xs font-semibold text-ink-muted dark:text-slate-300 mb-1.5">
                Public Shareable Link
              </label>
              <div className="flex items-center rounded-2xl border border-paper-border dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/80 p-1.5 transition-all focus-within:border-rfblue focus-within:ring-2 focus-within:ring-rfblue/15 gap-1.5 min-w-0">
                <input
                  ref={inputRef}
                  type="text"
                  readOnly
                  value={shareUrl}
                  onClick={(e) => e.target.select()}
                  aria-label="Generated shareable URL"
                  className="flex-1 min-w-0 bg-transparent px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-mono text-ink-darkest dark:text-slate-100 focus:outline-none select-all truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer shadow-xs active:scale-95 ${
                    copiedLink
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-rfblue hover:bg-rfblue-700 text-white'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 animate-in zoom-in-75" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Share Platforms Grid with Proper Official Icons */}
            <div className="mb-5 sm:mb-6">
              <span className="block text-xs font-semibold text-ink-muted dark:text-slate-300 mb-2.5">
                Direct Channels
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {/* X (Twitter) */}
                <button
                  type="button"
                  onClick={() => handleOpenChannel(shareLinks.twitter)}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-paper-border dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition-all hover:border-[#1DA1F2]/40 hover:text-[#1DA1F2] cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#1DA1F2] text-white flex items-center justify-center shrink-0 shadow-xs shadow-[#1DA1F2]/20">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">X (Twitter)</span>
                </button>

                {/* LinkedIn */}
                <button
                  type="button"
                  onClick={() => handleOpenChannel(shareLinks.linkedin)}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-paper-border dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition-all hover:border-[#0A66C2]/40 hover:text-[#0A66C2] cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center shrink-0 shadow-xs shadow-[#0A66C2]/20">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">LinkedIn</span>
                </button>

                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleOpenChannel(shareLinks.whatsapp)}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-paper-border dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition-all hover:border-[#25D366]/40 hover:text-[#25D366] cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs shadow-[#25D366]/20">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">WhatsApp</span>
                </button>

                {/* Reddit */}
                <button
                  type="button"
                  onClick={() => handleOpenChannel(shareLinks.reddit)}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-paper-border dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition-all hover:border-[#FF4500]/40 hover:text-[#FF4500] cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#FF4500] text-white flex items-center justify-center shrink-0 shadow-xs shadow-[#FF4500]/20">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Reddit</span>
                </button>
              </div>
            </div>

            {/* Bottom Utility Row (Device Native Share & Email) */}
            <div className="pt-4 border-t border-paper-border dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-ink-darkest dark:text-slate-200 transition-colors shadow-2xs cursor-pointer active:scale-95"
                >
                  <Smartphone className="w-3.5 h-3.5 text-rfblue" />
                  <span>Share via Device...</span>
                </button>
              )}

              <a
                href={shareLinks.email}
                className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-paper-border dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-ink-darkest dark:text-slate-200 transition-colors shadow-2xs active:scale-95 ${
                  canNativeShare ? 'flex-1' : 'w-full'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-rfblue" />
                <span>Share via Email</span>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
