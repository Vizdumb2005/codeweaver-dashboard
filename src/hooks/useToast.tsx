/**
 * useToast – global toast notification system
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast.success('Saved!');
 *   toast.error('Something went wrong', { description: 'Check your input.' });
 *   toast.loading('Submitting…');
 *   toast.dismiss(id);
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'error' | 'info' | 'loading' | 'success' | 'warning';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** ms before auto-dismiss; 0 = never (default for loading) */
  duration: number;
  /** true while the toast is animating out */
  dismissing: boolean;
}

export interface ToastOptions {
  description?: string;
  /** Auto-dismiss delay in ms. Defaults: success/info/warning=4000, error=6000, loading=0 */
  duration?: number;
  /** Supply an existing ID to update that toast in-place (e.g. resolve a loading toast) */
  id?: string;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD'; payload: ToastItem }
  | { type: 'UPDATE'; id: string; payload: Partial<ToastItem> }
  | { type: 'DISMISS'; id: string }
  | { type: 'REMOVE'; id: string };

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case 'ADD':
      return [action.payload, ...state].slice(0, 5); // cap at 5
    case 'UPDATE':
      return state.map((t) =>
        t.id === action.id ? { ...t, ...action.payload } : t,
      );
    case 'DISMISS':
      return state.map((t) =>
        t.id === action.id ? { ...t, dismissing: true } : t,
      );
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: ToastItem[];
  dispatch: React.Dispatch<Action>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, dispatch] = useReducer(reducer, []);
  return (
    <ToastContext.Provider value={{ toasts, dispatch }}>
      {children}
    </ToastContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
  loading: 0,
};

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  const { toasts, dispatch } = ctx;

  // Track dismiss timers so we can clear them on hover
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const scheduleRemove = useCallback(
    (id: string, delay: number) => {
      if (delay <= 0) return;
      const t = setTimeout(() => {
        dispatch({ type: 'DISMISS', id });
        setTimeout(() => dispatch({ type: 'REMOVE', id }), 350); // animation out
      }, delay);
      timers.current.set(id, t);
    },
    [dispatch],
  );

  const add = useCallback(
    (variant: ToastVariant, title: string, opts: ToastOptions = {}): string => {
      const id = opts.id ?? uid();
      const duration = opts.duration ?? DEFAULT_DURATION[variant];

      // If updating an existing toast
      if (opts.id && toasts.find((t) => t.id === opts.id)) {
        clearTimeout(timers.current.get(id));
        dispatch({
          type: 'UPDATE',
          id,
          payload: { variant, title, description: opts.description, duration, dismissing: false },
        });
        scheduleRemove(id, duration);
        return id;
      }

      dispatch({
        type: 'ADD',
        payload: { id, variant, title, description: opts.description, duration, dismissing: false },
      });
      scheduleRemove(id, duration);
      return id;
    },
    [toasts, dispatch, scheduleRemove],
  );

  const dismiss = useCallback(
    (id: string) => {
      clearTimeout(timers.current.get(id));
      dispatch({ type: 'DISMISS', id });
      setTimeout(() => dispatch({ type: 'REMOVE', id }), 350);
    },
    [dispatch],
  );

  const pauseTimer = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
  }, []);

  const resumeTimer = useCallback(
    (id: string, remaining: number) => {
      scheduleRemove(id, remaining);
    },
    [scheduleRemove],
  );

  return {
    toasts,
    dismiss,
    pauseTimer,
    resumeTimer,
    toast: {
      success: (title: string, opts?: ToastOptions) => add('success', title, opts),
      error: (title: string, opts?: ToastOptions) => add('error', title, opts),
      warning: (title: string, opts?: ToastOptions) => add('warning', title, opts),
      info: (title: string, opts?: ToastOptions) => add('info', title, opts),
      loading: (title: string, opts?: ToastOptions) => add('loading', title, opts),
      dismiss,
    },
  };
}
