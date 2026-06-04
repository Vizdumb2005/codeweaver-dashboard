import React from 'react';

export type IconName = string | 'katana' | 'scroll' | 'shuriken' | 'torii';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  readonly name: IconName;
  readonly title?: string;
}

export const Icon: React.FC<IconProps> = ({ name, title, className = '', ...props }) => {
  const combinedClass = `jp-icon ${className}`.trim();
  const isDecorative = !props['aria-label'] && !title;

  const defaultProps: React.SVGProps<SVGSVGElement> = {
    'aria-hidden': isDecorative ? 'true' : undefined,
    className: combinedClass,
    fill: 'none',
    height: 18,
    role: props['aria-label'] ? 'img' : undefined,
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    width: 18,
    ...props,
  };

  const titleNode = title ? <title>{title}</title> : null;

  switch (name) {
    case 'shuriken':
      return (
        <svg {...defaultProps} fill='currentColor' stroke='none'>
          {titleNode}
          <path d='M12 2 L14 9 L21 7 L16 12 L21 17 L14 15 L12 22 L10 15 L3 17 L8 12 L3 7 L10 9 Z' />
        </svg>
      );
    case 'katana':
      return (
        <svg {...defaultProps}>
          {titleNode}
          <path d='M21 3 C17 7 6 18 3 21 C2.5 21.5 2.5 22.5 3 23 C3.5 23.5 4.5 23.5 5 23 C8 20 19 9 23 5 Z' />
          <path d='M5.5 17.5 L7.5 19.5' strokeWidth={2} />
          <path d='M3.5 20.5 L4.5 21.5' />
        </svg>
      );
    case 'torii':
      return (
        <svg {...defaultProps}>
          {titleNode}
          <path d='M2 5 h20' strokeWidth={2} />
          <path d='M3 8 h18' />
          <path d='M7 8 v14' strokeWidth={1.8} />
          <path d='M17 8 v14' strokeWidth={1.8} />
          <path d='M7 12 h10' />
          <path d='M6 22 h2' />
          <path d='M16 22 h2' />
        </svg>
      );
    case 'scroll':
      return (
        <svg {...defaultProps}>
          {titleNode}
          <path d='M16 8 H5 C3.3 8 2 9.3 2 11 C2 12.7 3.3 14 5 14 H19 C20.7 14 22 12.7 22 11 C22 9.3 20.7 8 19 8 H17' />
          <circle cx='5' cy='11' r='3' />
          <circle cx='19' cy='11' r='3' />
          <path d='M5 8 V4 C5 3.5 5.5 3 6 3 H18 C18.5 3 19 3.5 19 4 V8' />
          <path d='M5 14 V18 C5 18.5 5.5 19 6 19 H18 C18.5 19 19 18.5 19 18 V14' />
        </svg>
      );
    default:
      return (
        <svg {...defaultProps}>
          {titleNode}
          <circle cx='12' cy='12' r='10' />
        </svg>
      );
  }
};
