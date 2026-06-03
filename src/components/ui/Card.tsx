import React from 'react';

import { Badge } from './Badge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly variant?: 'glass' | 'metric' | 'task';
  readonly title?: string;
  readonly value?: number | string;
  readonly progress?: number;
  readonly priority?: number | string;
  readonly dragState?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'glass',
  title,
  value,
  progress,
  priority,
  dragState,
  className = '',
  children,
  ...props
}) => {
  let cardClass = '';

  if (variant === 'glass') {
    cardClass = 'glass-card';
  } else if (variant === 'task') {
    cardClass = `task-card ${dragState ? 'dragging' : ''}`;
  } else {
    cardClass = 'metric-card';
  }

  const combinedClass = `${cardClass} ${className}`.trim();

  return (
    <div className={combinedClass} {...props}>
      {variant === 'metric' && (
        <div className='metric-content'>
          {title ? <span className='title'>{title}</span> : null}
          {value !== undefined && <span className='value'>{value}</span>}
        </div>
      )}

      {variant === 'task' && (
        <div className='task-content'>
          {title ? <h4 className='task-title'>{title}</h4> : null}
          {children}
          {progress !== undefined && (
            <div className='progress-bar-container'>
              <div className='progress-bar-fill' style={{ width: `${progress}%` }} />
            </div>
          )}
          {priority !== undefined && <Badge variant='warning'>Priority: {priority}</Badge>}
        </div>
      )}

      {variant === 'glass' && children}
    </div>
  );
};
