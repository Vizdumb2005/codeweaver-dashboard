import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly variant?: 'active' | 'error' | 'info' | 'neutral' | 'success' | 'warning';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  className = '',
  children,
  ...props
}) => {
  const combinedClass = `badge badge-${variant} ${className}`.trim();
  return (
    <span className={combinedClass} {...props}>
      {children}
    </span>
  );
};
