import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Check, ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '../../services/articles.api.js';
import { recommendationsApi } from '../../services/recommendations.api.js';
import { isPopupDismissed, recordPopupDismissal } from '../../utils/visitor.js';
import { resolveCategoryArt, getDynamicCategoryTheme } from '../../utils/categoryTheme.js';

/**
 * Context-Aware Interest Explorer Popup
 * - Smooth entrance with cubic-bezier transition curves
 * - Crisp Flaticon illustrations for every category
 * - Text >= 14px with responsive visual hierarchy
 * - Context-aware category clustering (current topic + expansion)
 * - Supports automatic reading trigger or manual on-demand opening
 */
export function InterestExplorerPopup({
  currentCategoryId = null,
  currentCategoryName = null,
  isTriggered = false,
  isOpen = false,
  forceOpen = false,
  onClose = null,
  onDismiss = null,
  className = ''
}) {
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Fetch dynamic categories
  useEffect(() => {
    let isMounted = true;
    articlesApi.getCategories().then((res) => {
      if (!isMounted) return;
      const cats = Array.isArray(res) ? res : res?.data || [];
      const activeCats = cats.filter((c) => c.isActive !== false);
      setCategories(activeCats);
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch saved interests when opened manually or pre-selecting current category
  useEffect(() => {
    let isMounted = true;

    if (isOpen || forceOpen) {
      setIsVisible(true);
      recommendationsApi.getVisitorInterests().then((res) => {
        if (!isMounted) return;
        const saved = res?.data || [];
        if (Array.isArray(saved) && saved.length > 0) {
          setSelectedIds(saved.map((item) => item.categoryId || item.category?.id).filter(Boolean));
        } else if (currentCategoryId) {
          setSelectedIds([currentCategoryId]);
        }
      }).catch(() => {
        if (currentCategoryId && isMounted) {
          setSelectedIds([currentCategoryId]);
        }
      });
    } else if (isOpen === false && (forceOpen === false || forceOpen === undefined)) {
      if (!isTriggered) {
        setIsVisible(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, forceOpen, currentCategoryId, isTriggered]);

  // Handle dwell / engagement auto-trigger visibility
  useEffect(() => {
    if (isOpen || forceOpen) return;
    if (!isTriggered || isPopupDismissed()) return;

    if (currentCategoryId) {
      setSelectedIds([currentCategoryId]);
    }

    // Small delay to ensure smooth paint
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [isTriggered, isOpen, forceOpen, currentCategoryId]);

  const toggleCategory = (catId) => {
    setHasInteracted(true);
    setSelectedIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (!isOpen && !forceOpen) {
      recordPopupDismissal();
    }
    if (onClose) onClose();
    if (onDismiss) onDismiss();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await recommendationsApi.setInterests(selectedIds);
      setIsSuccess(true);
      if (!isOpen && !forceOpen) {
        recordPopupDismissal();
      }

      // Track event
      recommendationsApi.trackEvent({
        eventType: 'INTEREST_SELECTED',
        metadata: { selectedCount: selectedIds.length }
      });

      // Instantly invalidate TanStack queries so feeds update immediately
      queryClient.invalidateQueries({ queryKey: ['personalized-feed'] });
      queryClient.invalidateQueries({ queryKey: ['visitor-interests'] });
      queryClient.invalidateQueries({ queryKey: ['article-recommendations'] });

      setTimeout(() => {
        setIsVisible(false);
        setIsSuccess(false);
        if (onClose) onClose();
        if (onDismiss) onDismiss();
      }, 1200);
    } catch {
      handleDismiss();
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCat = currentCategoryId
    ? categories.find((c) => c.id === currentCategoryId || c.slug === currentCategoryId)
    : null;
  const otherCats = categories.filter((c) => !currentCat || c.id !== currentCat.id);

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="interest-explorer-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Backdrop Dimmer with subtle blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={handleDismiss}
            aria-hidden="true"
          />

          {/* Centered Modal Card (Pure White Editorial Card) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className={`relative w-full max-w-lg my-auto overflow-hidden rounded-3xl bg-white border border-paper-border shadow-2xl p-6 sm:p-7 z-10 ${className}`}
          >
            {/* Soft Ambient Radial Highlight */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-rfblue/5 rounded-full blur-3xl"
            />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-xl text-ink-light hover:text-ink hover:bg-paper transition-colors cursor-pointer"
              aria-label="Dismiss personalization prompt"
            >
              <X className="w-5 h-5 text-current" />
            </button>

            {/* Content View or Success State */}
            {isSuccess ? (
              <div className="py-6 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-ink-darkest">
                  {selectedIds.length === 0 ? 'Preferences Updated' : 'Preferences Saved'}
                </h3>
                <p className="text-sm text-ink-muted max-w-xs">
                  {selectedIds.length === 0
                    ? 'Your research feed has been reset to explore all peer-reviewed disciplines.'
                    : 'Your research feed and journey rails are now calibrated to your focus areas.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header */}
                <div className="pr-8 space-y-1">
                  <h2
                    id="interest-explorer-title"
                    className="text-base sm:text-lg font-bold text-ink-darkest tracking-tight"
                  >
                    {currentCategoryName
                      ? `Exploring ${currentCategoryName}?`
                      : 'What would you like to research?'}
                  </h2>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    Select topics you frequently track to receive tailored analysis, cross-format comparisons, and verified research.
                  </p>
                </div>

                {/* Category Options with Flaticon Artwork */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {/* Context Article's Category if present */}
                  {currentCat && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-ink-light uppercase tracking-wider">
                        Currently Reading
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCategory(currentCat.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                          selectedIds.includes(currentCat.id)
                            ? 'border-rfblue bg-rfblue-50 text-rfblue shadow-2xs'
                            : 'border-paper-border bg-paper hover:bg-paper-warm text-ink'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={resolveCategoryArt(currentCat)}
                            alt=""
                            className="w-6 h-6 object-contain shrink-0"
                            loading="lazy"
                          />
                          <span className="truncate text-sm font-semibold">{currentCat.name}</span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            selectedIds.includes(currentCat.id)
                              ? 'bg-rfblue border-rfblue text-white'
                              : 'border-paper-border bg-white'
                          }`}
                        >
                          {selectedIds.includes(currentCat.id) && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Other Topics */}
                  <div className="space-y-1.5">
                    {currentCat && (
                      <div className="text-xs font-bold text-ink-light uppercase tracking-wider">
                        Explore More Fields
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {otherCats.slice(0, 8).map((cat) => {
                        const isSelected = selectedIds.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-sm font-medium transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'border-rfblue bg-rfblue-50 text-rfblue font-semibold shadow-2xs'
                                : 'border-paper-border bg-paper hover:bg-paper-warm text-ink'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-1">
                              <img
                                src={resolveCategoryArt(cat)}
                                alt=""
                                className="w-5 h-5 object-contain shrink-0"
                                loading="lazy"
                              />
                              <span className="truncate text-sm">{cat.name}</span>
                            </div>
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-rfblue border-rfblue text-white'
                                  : 'border-paper-border bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 flex items-center justify-between gap-3 border-t border-paper-border">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-sm font-semibold text-ink-muted hover:text-ink px-2.5 py-1.5 transition-colors cursor-pointer"
                  >
                    Maybe later
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rfblue hover:bg-rfblue-700 text-white text-sm font-semibold shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <span>Save Preferences</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
