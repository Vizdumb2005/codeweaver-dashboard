/* eslint-disable react/jsx-closing-bracket-location */
import React from 'react';

export interface FormGroupProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly error?: string;
  readonly label?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({ label, error, children, className = '' }) => {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label ? <label className='form-label'>{label}</label> : null}
      {children}
      {error ? (
        <span
          className='form-error'
          style={{
            color: 'var(--accent-error)',
            display: 'block',
            fontSize: '0.75rem',
            marginTop: 'var(--space-xs)',
          }}
        >
          {error}
        </span>
      ) : null}
    </div>
  );
};
