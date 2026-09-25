import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Trash2,
  Loader2
} from 'lucide-react';

const VARIANT_CONFIGS = {
  danger: {
    icon: Trash2,
    badgeBg: 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400',
    confirmBtn: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 active:bg-red-100 font-bold'
  },
  warning: {
    icon: AlertCircle,
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400',
    confirmBtn: 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 active:bg-amber-100 font-bold'
  },
  info: {
    icon: Info,
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400',
    confirmBtn: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 active:bg-blue-100 font-bold'
  },
  success: {
    icon: CheckCircle2,
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400',
    confirmBtn: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:bg-emerald-100 font-bold'
  }
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isAlert = false,
  isLoading = false,
  customIcon = null
}) {
  const confirmBtnRef = useRef(null);
  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.danger;
  const IconComponent = customIcon || config.icon;

  useEffect(() => {
    if (!isOpen) return;

    // Focus confirm button on mount after entrance animation starts
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 60);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!isLoading) onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isLoading]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-container"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop with Smooth Fade In/Out */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs"
            onClick={() => {
              if (!isLoading) onClose?.();
            }}
            aria-hidden="true"
          />

          {/* Centered Editorial Dialog Surface */}
          <motion.div
            key="modal-surface"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm sm:max-w-[390px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 transition-colors"
          >
            {/* Top Padded Body: Centered Badge, Title, Message */}
            <div className="pt-7 pb-6 px-6 text-center flex flex-col items-center">
              {/* Centered Circular Icon Badge */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border mx-auto mb-4 shadow-2xs ${config.badgeBg}`}
              >
                <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              {/* Centered Title */}
              <h3
                id="modal-title"
                className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight text-center mb-2 leading-snug"
              >
                {title || (isAlert ? 'Notice' : 'Please Confirm')}
              </h3>

              {/* Centered Message Description */}
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed text-center max-w-[320px] mx-auto">
                {typeof message === 'string' ? <p>{message}</p> : message}
              </div>
            </div>

            {/* Bottom Full-Bleed Action Grid */}
            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              {!isAlert ? (
                <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="w-full py-3.5 sm:py-4 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:bg-slate-200 dark:active:bg-slate-800 transition-colors disabled:opacity-50 text-center focus:outline-none"
                  >
                    {cancelText}
                  </button>

                  <button
                    ref={confirmBtnRef}
                    type="button"
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`w-full py-3.5 sm:py-4 px-4 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 text-center focus:outline-none ${config.confirmBtn}`}
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                    <span>{confirmText}</span>
                  </button>
                </div>
              ) : (
                <button
                  ref={confirmBtnRef}
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`w-full py-3.5 sm:py-4 px-4 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 text-center focus:outline-none ${config.confirmBtn}`}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                  <span>{confirmText}</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
