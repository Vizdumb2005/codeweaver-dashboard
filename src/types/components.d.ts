// Component Prop Types

import { ReactNode } from 'react';

export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  'data-testid'?: string;
}

export interface ChildrenProps extends BaseProps {
  children?: ReactNode;
}

export interface ButtonProps extends ChildrenProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

export interface InputProps extends BaseProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';
  disabled?: boolean;
  readOnly?: boolean;
  label?: string;
  error?: string;
  hint?: string;
}
