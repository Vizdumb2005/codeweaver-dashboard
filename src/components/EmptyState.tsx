import React from 'react';
import '../styles/empty-state.scss';

export type EmptyStateVariant = 'no-data' | 'no-search' | 'error' | 'unauthorized';

export interface EmptyStateProps {
  variant: EmptyStateVariant;
  title: string;
  description: string;
  /** Primary action button label */
  actionLabel?: string;
  onAction?: () => void;
  /** Secondary (ghost/outline) action button */
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  /** Override the illustration with a custom node */
  illustration?: React.ReactNode;
  className?: string;
}

// ─── Illustrations ────────────────────────────────────────────────────────────

const NoDataIllustration: React.FC = () => (
  <svg
    viewBox="0 0 200 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="empty-state-svg"
  >
    {/* Backdrop glow disc */}
    <ellipse cx="100" cy="155" rx="55" ry="8" fill="rgba(255,115,0,0.08)" />

    {/* Scroll / document body */}
    <rect
      x="52" y="38" width="96" height="110"
      rx="8"
      fill="rgba(255,115,0,0.06)"
      stroke="rgba(255,115,0,0.25)"
      strokeWidth="1.5"
    />

    {/* Scroll roll top */}
    <rect
      x="52" y="38" width="96" height="18"
      rx="8"
      fill="rgba(255,115,0,0.12)"
      stroke="rgba(255,115,0,0.25)"
      strokeWidth="1.5"
    />

    {/* Empty horizontal lines */}
    <line x1="68" y1="74" x2="132" y2="74" stroke="rgba(255,115,0,0.2)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="68" y1="88" x2="118" y2="88" stroke="rgba(255,115,0,0.15)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="68" y1="102" x2="124" y2="102" stroke="rgba(255,115,0,0.12)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="68" y1="116" x2="106" y2="116" stroke="rgba(255,115,0,0.10)" strokeWidth="1.5" strokeLinecap="round" />

    {/* "+" plus badge */}
    <circle cx="144" cy="44" r="14" fill="rgba(255,115,0,0.15)" stroke="rgba(255,115,0,0.4)" strokeWidth="1.5" />
    <line x1="144" y1="38" x2="144" y2="50" stroke="#ff7300" strokeWidth="2" strokeLinecap="round" />
    <line x1="138" y1="44" x2="150" y2="44" stroke="#ff7300" strokeWidth="2" strokeLinecap="round" />

    {/* Japanese kanji watermark */}
    <text
      x="100" y="148"
      textAnchor="middle"
      fill="rgba(255,115,0,0.18)"
      fontSize="9"
      fontFamily="'JetBrains Mono', monospace"
      fontWeight="600"
      letterSpacing="6"
    >
      忍 · 空
    </text>
  </svg>
);

const NoSearchIllustration: React.FC = () => (
  <svg
    viewBox="0 0 200 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="empty-state-svg"
  >
    <ellipse cx="100" cy="155" rx="55" ry="8" fill="rgba(255,179,0,0.07)" />

    {/* Magnifier circle */}
    <circle
      cx="90" cy="82"
      r="34"
      fill="rgba(255,179,0,0.06)"
      stroke="rgba(255,179,0,0.3)"
      strokeWidth="2"
    />
    {/* Inner shine */}
    <circle cx="80" cy="72" r="6" fill="rgba(255,179,0,0.12)" />

    {/* Handle */}
    <line
      x1="116" y1="108"
      x2="148" y2="140"
      stroke="rgba(255,179,0,0.45)"
      strokeWidth="6"
      strokeLinecap="round"
    />

    {/* X inside magnifier */}
    <line x1="79" y1="71" x2="101" y2="93" stroke="rgba(255,179,0,0.5)" strokeWidth="2" strokeLinecap="round" />
    <line x1="101" y1="71" x2="79" y2="93" stroke="rgba(255,179,0,0.5)" strokeWidth="2" strokeLinecap="round" />

    <text
      x="100" y="148"
      textAnchor="middle"
      fill="rgba(255,179,0,0.18)"
      fontSize="9"
      fontFamily="'JetBrains Mono', monospace"
      fontWeight="600"
      letterSpacing="6"
    >
      索 · 無
    </text>
  </svg>
);

const ErrorIllustration: React.FC = () => (
  <svg
    viewBox="0 0 200 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="empty-state-svg"
  >
    <ellipse cx="100" cy="155" rx="55" ry="8" fill="rgba(239,68,68,0.08)" />

    {/* Warning triangle */}
    <path
      d="M100 28 L168 145 H32 Z"
      fill="rgba(239,68,68,0.06)"
      stroke="rgba(239,68,68,0.35)"
      strokeWidth="2"
      strokeLinejoin="round"
    />

    {/* Inner triangle highlight */}
    <path
      d="M100 45 L154 138 H46 Z"
      fill="rgba(239,68,68,0.04)"
      stroke="rgba(239,68,68,0.12)"
      strokeWidth="1"
      strokeLinejoin="round"
    />

    {/* Exclamation stem */}
    <rect x="96" y="72" width="8" height="36" rx="4" fill="rgba(239,68,68,0.7)" />
    {/* Exclamation dot */}
    <circle cx="100" cy="122" r="5" fill="rgba(239,68,68,0.8)" />

    {/* Small lightning bolt decorations */}
    <path d="M40 55 L35 65 L42 65 L37 75" stroke="rgba(239,68,68,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M160 55 L155 65 L162 65 L157 75" stroke="rgba(239,68,68,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

    <text
      x="100" y="148"
      textAnchor="middle"
      fill="rgba(239,68,68,0.22)"
      fontSize="9"
      fontFamily="'JetBrains Mono', monospace"
      fontWeight="600"
      letterSpacing="6"
    >
      警 · 危
    </text>
  </svg>
);

const UnauthorizedIllustration: React.FC = () => (
  <svg
    viewBox="0 0 200 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="empty-state-svg"
  >
    <ellipse cx="100" cy="155" rx="55" ry="8" fill="rgba(255,115,0,0.07)" />

    {/* Lock body */}
    <rect
      x="62" y="88" width="76" height="56"
      rx="10"
      fill="rgba(255,115,0,0.08)"
      stroke="rgba(255,115,0,0.3)"
      strokeWidth="2"
    />

    {/* Lock shackle */}
    <path
      d="M76 88 V64 C76 47 124 47 124 64 V88"
      fill="none"
      stroke="rgba(255,115,0,0.35)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Keyhole circle */}
    <circle cx="100" cy="112" r="9" fill="rgba(255,115,0,0.25)" stroke="rgba(255,115,0,0.5)" strokeWidth="1.5" />
    {/* Keyhole stem */}
    <rect x="97" y="118" width="6" height="12" rx="3" fill="rgba(255,115,0,0.5)" />

    {/* Decorative dots */}
    <circle cx="58" cy="60" r="3" fill="rgba(255,115,0,0.12)" />
    <circle cx="142" cy="60" r="3" fill="rgba(255,115,0,0.12)" />
    <circle cx="50" cy="105" r="2" fill="rgba(255,115,0,0.08)" />
    <circle cx="150" cy="105" r="2" fill="rgba(255,115,0,0.08)" />

    <text
      x="100" y="148"
      textAnchor="middle"
      fill="rgba(255,115,0,0.18)"
      fontSize="9"
      fontFamily="'JetBrains Mono', monospace"
      fontWeight="600"
      letterSpacing="6"
    >
      鎖 · 禁
    </text>
  </svg>
);

// ─── Illustration map ─────────────────────────────────────────────────────────

const ILLUSTRATIONS: Record<EmptyStateVariant, React.ReactNode> = {
  'no-data':      <NoDataIllustration />,
  'no-search':    <NoSearchIllustration />,
  'error':        <ErrorIllustration />,
  'unauthorized': <UnauthorizedIllustration />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  illustration,
  className = '',
}) => {
  return (
    <div
      className={`empty-state empty-state--${variant} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      {/* Subtle radial ambient behind the card */}
      <span className="empty-state__ambient" aria-hidden="true" />

      <div className="empty-state__inner">
        {/* Illustration */}
        <div className="empty-state__illustration">
          {illustration ?? ILLUSTRATIONS[variant]}
        </div>

        {/* Text */}
        <h3 className="empty-state__title">{title}</h3>
        <p className="empty-state__description">{description}</p>

        {/* Actions */}
        {(actionLabel && onAction) || (secondaryLabel && onSecondaryAction) ? (
          <div className="empty-state__actions">
            {actionLabel && onAction && (
              <button
                className="btn btn-primary empty-state__btn-primary"
                onClick={onAction}
                type="button"
              >
                {actionLabel}
              </button>
            )}
            {secondaryLabel && onSecondaryAction && (
              <button
                className="btn btn-outline empty-state__btn-secondary"
                onClick={onSecondaryAction}
                type="button"
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EmptyState;
