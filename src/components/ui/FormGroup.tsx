/* eslint-disable react/jsx-closing-bracket-location */
import React from 'react';

export interface FormGroupProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  /** Inline field-level error message. Triggers error styling. */
  readonly error?: string;
  /** Field label */
  readonly label?: string;
  /** Mark field as successfully validated */
  readonly valid?: boolean;
  /** htmlFor — links the label to an input id */
  readonly htmlFor?: string;
  /** Optional hint text shown below the field when there is no error */
  readonly hint?: string;
}

const CheckIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M2 7.5 L5.5 11 L12 4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  error,
  valid,
  htmlFor,
  hint,
  children,
  className = '',
}) => {
  const groupClass = [
    'form-group',
    error ? 'has-error' : '',
    valid && !error ? 'is-valid' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={groupClass}>
      {label && (
        <label className="form-label" htmlFor={htmlFor}>
          {label}
          {/* Spring-in checkmark next to label when field is valid */}
          <span className="form-valid-icon" aria-hidden="true">
            <CheckIcon />
          </span>
        </label>
      )}

      {children}

      {/* Inline error — replaces hint when present */}
      {error ? (
        <span
          className="form-error"
          role="alert"
          aria-live="polite"
          id={htmlFor ? `${htmlFor}-error` : undefined}
        >
          {error}
        </span>
      ) : hint ? (
        <span
          className="form-hint"
          style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 'var(--space-xs)', display: 'block' }}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
};
