import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { ArticleCard } from './ArticleCard.jsx';

export function FeaturedArticlesCarousel({
  articles = [],
  autoSlide = true,
  autoSlideInterval = 4000
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [timerKey, setTimerKey] = useState(0);
  const isDraggingRef = useRef(false);
  const animationTimerRef = useRef(null);

  // Safeguard against duplicate keys and layout glitches if only 2 articles are available
  const effectiveArticles = useMemo(() => {
    if (articles.length === 2) {
      return [
        articles[0],
        articles[1],
        { ...articles[0], id: `${articles[0].id}-dup` },
        { ...articles[1], id: `${articles[1].id}-dup` }
      ];
    }
    return articles;
  }, [articles]);

  const total = effectiveArticles.length;

  const getIndex = useCallback(
    (index) => {
      if (total === 0) return 0;
      return ((index % total) + total) % total;
    },
    [total]
  );

  const resetTimer = useCallback(() => {
    setTimerKey((k) => k + 1);
  }, []);

  const triggerSlide = useCallback((dir, nextIndex) => {
    setDirection(dir);
    setIsAnimating(true);
    setActiveIndex(nextIndex);

    // Hard fallback timeout: ensure isAnimating never stays stuck even if Framer Motion skips onAnimationComplete
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    animationTimerRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 450);
  }, []);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    triggerSlide(1, (prev) => prev + 1);
    resetTimer();
  }, [total, triggerSlide, resetTimer]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    triggerSlide(-1, (prev) => prev - 1);
    resetTimer();
  }, [total, triggerSlide, resetTimer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Pause auto-sliding if tab is hidden in background
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Robust Auto-slide timer: advances every autoSlideInterval reliably
  useEffect(() => {
    if (!autoSlide || total <= 1 || !isVisible) {
      return;
    }

    const interval = setInterval(() => {
      if (isDraggingRef.current) return;
      triggerSlide(1, (prev) => prev + 1);
    }, autoSlideInterval);

    return () => {
      clearInterval(interval);
    };
  }, [autoSlide, autoSlideInterval, total, isVisible, timerKey, triggerSlide]);

  // Clean up animation fallback timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, []);

  // Spring transition parameters
  const springTransition = useMemo(
    () => ({
      type: 'spring',
      stiffness: 240,
      damping: 28,
      mass: 0.8
    }),
    []
  );

  // Position states: Center card at 100% scale (z:30), side cards flanking at 86% scale (z:10)
  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? '120%' : '-120%',
      scale: 0.78,
      opacity: 0,
      zIndex: 1
    }),
    left: {
      x: '-78%',
      scale: 0.86,
      opacity: 0.7,
      zIndex: 10,
      cursor: 'pointer'
    },
    center: {
      x: '0%',
      scale: 1,
      opacity: 1,
      zIndex: 30,
      cursor: 'default'
    },
    right: {
      x: '78%',
      scale: 0.86,
      opacity: 0.7,
      zIndex: 10,
      cursor: 'pointer'
    },
    exit: (dir) => ({
      x: dir > 0 ? '-120%' : '120%',
      scale: 0.78,
      opacity: 0,
      zIndex: 1
    })
  };

  if (!articles || articles.length === 0) return null;

  // Single card fallback if only 1 article is available
  if (articles.length === 1) {
    return (
      <section className="py-16 border-b border-paper-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-darkest">
              <Award className="w-4 h-4 text-rfblue" />
              <span>Featured Research</span>
            </div>
          </div>
          <div className="w-full max-w-[800px] mx-auto h-[460px] sm:h-[440px] md:h-[370px] lg:h-[390px]">
            <ArticleCard article={articles[0]} variant="featured" />
          </div>
        </div>
      </section>
    );
  }

  // Exactly 3 visible position slots: -1 (Left), 0 (Center), +1 (Right)
  const visiblePositions = [-1, 0, 1];

  return (
    <section
      className="py-14 sm:py-16 lg:py-20 border-b border-paper-border bg-white overflow-hidden"
      aria-label="Featured Research Carousel"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Title and Carousel Controls */}
        <div className="flex items-center justify-between mb-6 pb-2">
          <div className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-darkest">
            <Award className="w-4 h-4 text-rfblue" />
            <span>Featured Research</span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Active Position Indicator */}
            <span className="text-xs font-semibold text-ink-muted font-mono tabular-nums">
              {(getIndex(activeIndex) % articles.length) + 1} / {articles.length}
            </span>

            {/* Previous and Next Navigation Buttons */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handlePrev}
                disabled={isAnimating}
                className="w-8 h-8 rounded-lg border border-paper-border bg-white flex items-center justify-center text-ink hover:bg-paper hover:text-rfblue transition-colors shadow-2xs disabled:opacity-50"
                aria-label="Previous featured article"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={isAnimating}
                className="w-8 h-8 rounded-lg border border-paper-border bg-white flex items-center justify-center text-ink hover:bg-paper hover:text-rfblue transition-colors shadow-2xs disabled:opacity-50"
                aria-label="Next featured article"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3-Card Center-Focused Carousel Stage */}
        <div className="relative w-full overflow-hidden py-4 sm:py-6 flex items-center justify-center h-[520px] sm:h-[480px] md:h-[410px] lg:h-[430px]">
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              {visiblePositions.map((pos) => {
                const itemIndex = getIndex(activeIndex + pos);
                const item = effectiveArticles[itemIndex];
                const role = pos === -1 ? 'left' : pos === 0 ? 'center' : 'right';

                return (
                  <motion.div
                    key={item.id}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate={role}
                    exit="exit"
                    transition={springTransition}
                    onAnimationComplete={() => {
                      if (pos === 0) {
                        setIsAnimating(false);
                        if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
                      }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.15}
                    onDragStart={() => {
                      isDraggingRef.current = true;
                    }}
                    onDragEnd={(e, info) => {
                      isDraggingRef.current = false;
                      if (info.offset.x < -40) handleNext();
                      else if (info.offset.x > 40) handlePrev();
                    }}
                    onClick={() => {
                      if (pos === -1) handlePrev();
                      if (pos === 1) handleNext();
                    }}
                    className={`absolute w-[92vw] max-w-[420px] h-[460px] sm:h-[440px] md:w-[680px] md:max-w-none md:h-[370px] lg:w-[800px] lg:h-[390px] select-none flex flex-col justify-center ${
                      pos === 0
                        ? 'shadow-xl rounded-2xl z-30 ring-1 ring-slate-200/80'
                        : 'shadow-md rounded-2xl z-10 hover:opacity-90'
                    }`}
                  >
                    {/* Semi-transparent tint on side cards to soften contrast and emphasize center */}
                    <div className="relative w-full h-full">
                      {pos !== 0 && (
                        <div
                          className="absolute inset-0 bg-slate-900/10 hover:bg-slate-900/5 rounded-2xl z-20 transition-colors cursor-pointer"
                          aria-hidden="true"
                        />
                      )}
                      {/* Preserved existing ArticleCard component */}
                      <ArticleCard article={item} variant="featured" />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Carousel Pagination Indicator Dots */}
        <div className="flex items-center justify-center space-x-2 mt-4 sm:mt-6">
          {articles.map((_, i) => {
            const currentDisplayIndex = getIndex(activeIndex) % articles.length;
            const isActive = currentDisplayIndex === i;

            return (
              <button
                key={i}
                disabled={isAnimating}
                onClick={() => {
                  if (isActive) return;
                  const diff = i - currentDisplayIndex;
                  triggerSlide(diff > 0 ? 1 : -1, (prev) => prev + diff);
                  resetTimer();
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-6 bg-rfblue'
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
