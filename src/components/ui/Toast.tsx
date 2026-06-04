/**
 * Toast – rendered notification with icon, progress bar, and dismiss button.
 * ToastViewport – fixed container that hosts all toasts (renders via portal).
 *
 * Import <ToastProvider> at app root, then use useToast() anywhere.
 */

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import '../../styles/toast.scss';
import { ToastItem, ToastVariant, useToast } from '../../hooks/useToast';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg className="toast__icon toast__icon--success" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      {/* Animated checkmark path */}
      <path
        className="toast__check-path"
        d="M5.5 10.5 L8.5 13.5 L14.5 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  error: (
    <svg className="toast__icon toast__icon--error" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="7" x2="13" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="7" x2="7" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg className="toast__icon toast__icon--warning" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2 L18 17 H2 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="1" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg className="toast__icon toast__icon--info" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="9" x2="10" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="6.5" r="1" fill="currentColor" />
    </svg>
  ),
  loading: (
    <svg className="toast__icon toast__icon--loading" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M10 2 A8 8 0 0 1 18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

// ─── Single Toast ─────────────────────────────────────────────────────────────

interface SingleToastProps {
  item: ToastItem;
}

const SingleToast: React.FC<SingleToastProps> = ({ item }) => {
  const { dismiss, pauseTimer, resumeTimer } = useToast();
  const [progress, setProgress] = useState(100);
  const startRef = useRef<number>(Date.now());
  const pausedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (item.duration <= 0) return;
    startRef.current = Date.now();

    const tick = () => {
      if (pausedAtRef.current !== null) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / item.duration) * 100);
      setProgress(pct);
      if (pct > 0) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [item.duration]);

  const handleMouseEnter = () => {
    pausedAtRef.current = Date.now();
    pauseTimer(item.id);
  };

  const handleMouseLeave = () => {
    if (pausedAtRef.current !== null) {
      const pausedDuration = Date.now() - pausedAtRef.current;
      startRef.current += pausedDuration;
      pausedAtRef.current = null;
      resumeTimer(item.id, (progress / 100) * item.duration);
    }
  };

  return (
    <div
      className={`toast toast--${item.variant} ${item.dismissing ? 'toast--out' : 'toast--in'}`}
      role={item.variant === 'error' ? 'alert' : 'status'}
      aria-live={item.variant === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left accent bar */}
      <span className="toast__accent" aria-hidden="true" />

      {/* Icon */}
      <span className="toast__icon-wrap">{ICONS[item.variant]}</span>

      {/* Content */}
      <div className="toast__content">
        <p className="toast__title">{item.title}</p>
        {item.description && (
          <p className="toast__description">{item.description}</p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        className="toast__close"
        onClick={() => dismiss(item.id)}
        aria-label="Dismiss notification"
        type="button"
      >
        <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Progress bar */}
      {item.duration > 0 && (
        <div className="toast__progress-track" aria-hidden="true">
          <div
            className="toast__progress-fill"
            style={{ width: `${progress}%`, transition: 'none' }}
          />
        </div>
      )}
    </div>
  );
};

// ─── Viewport (portal) ────────────────────────────────────────────────────────

export const ToastViewport: React.FC = () => {
  const { toasts } = useToast();
  const container = document.getElementById('toast-portal') ?? document.body;

  return ReactDOM.createPortal(
    <div
      className="toast-viewport"
      aria-label="Notifications"
      role="region"
    >
      {toasts.map((t) => (
        <SingleToast key={t.id} item={t} />
      ))}
    </div>,
    container,
  );
};

export default ToastViewport;
