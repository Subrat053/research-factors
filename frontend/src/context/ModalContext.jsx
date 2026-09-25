import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ConfirmationModal } from '../components/common/ConfirmationModal.jsx';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    isAlert: false,
    isLoading: false,
    customIcon: null
  });

  const resolverRef = useRef(null);
  const callbacksRef = useRef({ onConfirm: null, onCancel: null });

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      callbacksRef.current = {
        onConfirm: options.onConfirm || null,
        onCancel: options.onCancel || null
      };

      setModalState({
        isOpen: true,
        title: options.title || 'Please Confirm',
        message: options.message || 'Are you sure you want to proceed?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'danger',
        isAlert: false,
        isLoading: false,
        customIcon: options.customIcon || null
      });
    });
  }, []);

  const alert = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      callbacksRef.current = {
        onConfirm: options.onConfirm || null,
        onCancel: null
      };

      const title = typeof options === 'string' ? 'Notice' : (options.title || 'Notice');
      const message = typeof options === 'string' ? options : (options.message || '');
      const variant = typeof options === 'object' ? (options.variant || 'info') : 'info';
      const confirmText = typeof options === 'object' ? (options.confirmText || 'OK') : 'OK';

      setModalState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText: 'Cancel',
        variant,
        isAlert: true,
        isLoading: false,
        customIcon: typeof options === 'object' ? options.customIcon : null
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    callbacksRef.current.onCancel?.();
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  const handleConfirm = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    callbacksRef.current.onConfirm?.();
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ModalContext.Provider value={{ confirm, alert }}>
      {children}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        variant={modalState.variant}
        isAlert={modalState.isAlert}
        isLoading={modalState.isLoading}
        customIcon={modalState.customIcon}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

export function useConfirm() {
  const { confirm } = useModal();
  return confirm;
}

export function useAlert() {
  const { alert } = useModal();
  return alert;
}
