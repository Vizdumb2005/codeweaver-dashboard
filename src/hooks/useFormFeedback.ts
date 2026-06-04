/**
 * useFormFeedback – field-level validation + form submission state machine
 *
 * Usage:
 *   const { fields, setError, clearError, clearAll,
 *           isSubmitting, setSubmitting, submitState, setSubmitState } = useFormFeedback(['email','password']);
 *
 *   // In validate:
 *   setError('email', 'Invalid email address');
 *   clearError('email');
 *
 *   // Submission lifecycle:
 *   setSubmitting(true);
 *   // ... await API call ...
 *   setSubmitState('success');  // or 'error'
 *   setSubmitting(false);
 */

import { useCallback, useState } from 'react';

export type SubmitState = 'error' | 'idle' | 'loading' | 'success';

export interface FieldState {
  error: string;
  touched: boolean;
  valid: boolean;
}

export type FieldsRecord<K extends string> = Record<K, FieldState>;

export function useFormFeedback<K extends string>(fieldNames: readonly K[]) {
  const initial = Object.fromEntries(
    fieldNames.map((k) => [k, { error: '', touched: false, valid: false }]),
  ) as FieldsRecord<K>;

  const [fields, setFields] = useState<FieldsRecord<K>>(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const setError = useCallback((field: K, message: string) => {
    setFields((prev) => ({
      ...prev,
      [field]: { ...prev[field], error: message, touched: true, valid: false },
    }));
  }, []);

  const setValid = useCallback((field: K) => {
    setFields((prev) => ({
      ...prev,
      [field]: { ...prev[field], error: '', touched: true, valid: true },
    }));
  }, []);

  const clearError = useCallback((field: K) => {
    setFields((prev) => ({
      ...prev,
      [field]: { ...prev[field], error: '', valid: false },
    }));
  }, []);

  const touchField = useCallback((field: K) => {
    setFields((prev) => ({
      ...prev,
      [field]: { ...prev[field], touched: true },
    }));
  }, []);

  const clearAll = useCallback(() => {
    setFields(
      Object.fromEntries(
        fieldNames.map((k) => [k, { error: '', touched: false, valid: false }]),
      ) as FieldsRecord<K>,
    );
    setSubmitState('idle');
  }, [fieldNames]);

  /** Returns true if there are no field errors and all required fields are valid */
  const hasErrors = Object.values(fields).some((f) => (f as FieldState).error);

  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
    if (submitting) setSubmitState('loading');
  }, []);

  return {
    fields,
    setError,
    setValid,
    clearError,
    touchField,
    clearAll,
    hasErrors,
    isSubmitting,
    setSubmitting,
    submitState,
    setSubmitState,
  };
}
