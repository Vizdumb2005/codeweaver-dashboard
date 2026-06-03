/* eslint-disable react/jsx-closing-bracket-location */
import React, { useState } from 'react';

export interface Option {
  readonly label: string;
  readonly value: number | string;
}

export interface FormInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  'type'
> {
  readonly options?: readonly Option[];
  readonly type?: 'password' | 'select' | 'text' | 'textarea';
}

export const FormInput = React.forwardRef<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  FormInputProps
>(({ type = 'text', options, className = '', ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = React.useCallback((): void => {
    setShowPassword((prev) => !prev);
  }, []);

  const baseClass = 'form-input';
  const combinedClass = `${baseClass} ${className}`.trim();

  if (type === 'select') {
    const selectProps = props as React.SelectHTMLAttributes<HTMLSelectElement>;
    return (
      <select
        ref={ref as React.Ref<HTMLSelectElement>}
        className={`form-select ${className}`.trim()}
        {...selectProps}
      >
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (type === 'textarea') {
    const textareaProps = props as React.TextareaHTMLAttributes<HTMLTextAreaElement>;
    return (
      <textarea
        ref={ref as React.Ref<HTMLTextAreaElement>}
        className={combinedClass}
        {...textareaProps}
      />
    );
  }

  if (type === 'password') {
    const inputProps = props as React.InputHTMLAttributes<HTMLInputElement>;
    return (
      <div className='password-input-container' style={{ position: 'relative', width: '100%' }}>
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          className={combinedClass}
          type={showPassword ? 'text' : 'password'}
          {...inputProps}
          style={{ paddingRight: '40px', ...inputProps.style }}
        />
        <button
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className='password-toggle'
          onClick={handleTogglePassword}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          type='button'
        >
          {showPassword ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
    );
  }

  const inputProps = props as React.InputHTMLAttributes<HTMLInputElement>;
  return (
    <input
      ref={ref as React.Ref<HTMLInputElement>}
      className={combinedClass}
      type={type}
      {...inputProps}
    />
  );
});

FormInput.displayName = 'FormInput';
