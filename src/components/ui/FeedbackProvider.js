'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import styles from './FeedbackProvider.module.css';

const FeedbackContext = createContext(null);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    return {
      alert: async (msg) => { window.alert(msg); },
      confirm: async (msg) => window.confirm(msg),
      toast: (msg) => { console.log('Toast:', msg); }
    };
  }
  return context;
}

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null); // { type: 'alert' | 'confirm', message, title, resolve, variant: 'primary' | 'danger' }

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const confirm = useCallback((message, title = 'Confirm Action', variant = 'danger') => {
    return new Promise((resolve) => {
      setDialog({
        type: 'confirm',
        message,
        title,
        resolve,
        variant,
      });
    });
  }, []);

  const alert = useCallback((message, title = 'Alert') => {
    return new Promise((resolve) => {
      setDialog({
        type: 'alert',
        message,
        title,
        resolve,
        variant: 'primary',
      });
    });
  }, []);

  const handleClose = () => {
    if (dialog) {
      dialog.resolve(false);
      setDialog(null);
    }
  };

  const handleConfirm = () => {
    if (dialog) {
      dialog.resolve(true);
      setDialog(null);
    }
  };

  // Support pressing Enter key to quickly confirm/close dialog
  useEffect(() => {
    if (!dialog) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialog]);

  return (
    <FeedbackContext.Provider value={{ toast, confirm, alert }}>
      {children}
      
      {/* Toast container */}
      <div className={styles.toastContainer}>
        {toasts.map((t) => {
          let typeClass = styles.toastSuccess;
          if (t.type === 'error') typeClass = styles.toastError;
          else if (t.type === 'info') typeClass = styles.toastInfo;
          else if (t.type === 'warning') typeClass = styles.toastWarning;

          return (
            <div key={t.id} className={`${styles.toast} ${typeClass}`}>
              {t.message}
            </div>
          );
        })}
      </div>

      {/* Alert / Confirm Dialog Modal */}
      {dialog && (
        <Modal
          title={dialog.title}
          open={true}
          onClose={handleClose}
        >
          <div className={styles.dialogBody}>
            {dialog.message}
          </div>
          <div className={styles.dialogActions}>
            {dialog.type === 'confirm' && (
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
            )}
            <Button
              variant={dialog.variant}
              onClick={handleConfirm}
              autoFocus
            >
              {dialog.type === 'confirm' ? 'Confirm' : 'OK'}
            </Button>
          </div>
        </Modal>
      )}
    </FeedbackContext.Provider>
  );
}
