/**
 * Skeleton – loading placeholder component
 *
 * Exposes:
 *   <Skeleton>                 — raw building block (single shimmer bar)
 *   <SkeletonTaskCard>         — mirrors the .task-card kanban layout
 *   <SkeletonAgentItem>        — mirrors the agent panel row (avatar + name + status)
 *   <SkeletonLogEntry>         — mirrors a .console-line row (timestamp + agent + message)
 *   <SkeletonChart>            — mirrors a chart panel (header + bars + legend)
 *   <SkeletonPRCard>           — mirrors a pull-request list row
 *
 * All variants accept a `count` prop to render multiple copies at once.
 * The underlying .skeleton class + skeleton-shimmer keyframes come from styles.css.
 */

import React from 'react';
import '../styles/skeleton.scss';

// ─── Base primitive ───────────────────────────────────────────────────────────

export interface SkeletonProps {
  /** Extra class names (e.g. "skeleton-text", "skeleton-title", "skeleton-circle") */
  className?: string;
  /** Inline width override, e.g. "60%" or "120px" */
  width?: string | number;
  /** Inline height override */
  height?: string | number;
  /** Border radius override */
  borderRadius?: string | number;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  borderRadius,
  style,
  'aria-label': ariaLabel,
}) => (
  <span
    className={`skeleton ${className}`.trim()}
    role="presentation"
    aria-hidden="true"
    aria-label={ariaLabel}
    style={{ width, height, borderRadius, display: 'block', ...style }}
  />
);

// ─── Helper ───────────────────────────────────────────────────────────────────

function repeat(count: number, render: (i: number) => React.ReactNode) {
  return Array.from({ length: count }, (_, i) => render(i));
}

// ─── Task Card ────────────────────────────────────────────────────────────────

export interface SkeletonTaskCardProps {
  /** Number of skeleton cards to render (default 4) */
  count?: number;
  /** Show a progress bar stripe on each card (default true) */
  showProgress?: boolean;
}

export const SkeletonTaskCard: React.FC<SkeletonTaskCardProps> = ({
  count = 4,
  showProgress = true,
}) => (
  <>
    {repeat(count, (i) => (
      <div
        key={i}
        className="skeleton-task-card task-card"
        aria-hidden="true"
        role="presentation"
      >
        {/* Card head – badge + priority icon */}
        <div className="skeleton-task-card__head">
          <Skeleton className="skeleton-task-card__badge" width="52px" height="18px" borderRadius="4px" />
          <Skeleton className="skeleton-circle" width="18px" height="18px" />
        </div>

        {/* Title */}
        <Skeleton className="skeleton-task-card__title skeleton-title" width="80%" height="14px" />

        {/* Description lines */}
        <Skeleton className="skeleton-text" width="100%" height="11px" />
        <Skeleton className="skeleton-text" width="70%" height="11px" />

        {/* Optional progress bar */}
        {showProgress && (
          <Skeleton className="skeleton-task-card__progress" width="100%" height="4px" borderRadius="10px" style={{ marginBottom: '10px' }} />
        )}

        {/* Card foot – tags + assignee */}
        <div className="skeleton-task-card__foot">
          <div className="skeleton-task-card__tags">
            <Skeleton width="40px" height="14px" borderRadius="4px" />
            <Skeleton width="52px" height="14px" borderRadius="4px" />
          </div>
          <div className="skeleton-task-card__assignee">
            <Skeleton className="skeleton-circle" width="14px" height="14px" />
            <Skeleton width="48px" height="11px" />
          </div>
        </div>
      </div>
    ))}
  </>
);

// ─── Agent List Item ──────────────────────────────────────────────────────────

export interface SkeletonAgentItemProps {
  count?: number;
}

export const SkeletonAgentItem: React.FC<SkeletonAgentItemProps> = ({
  count = 6,
}) => (
  <div className="skeleton-agent-list" role="presentation" aria-hidden="true">
    {repeat(count, (i) => (
      <div key={i} className="skeleton-agent-item">
        {/* Avatar ring */}
        <div className="skeleton-agent-item__avatar-wrap">
          <Skeleton className="skeleton-circle skeleton-agent-item__avatar" width="40px" height="40px" borderRadius="50%" />
          {/* Status dot */}
          <Skeleton className="skeleton-circle skeleton-agent-item__dot" width="10px" height="10px" />
        </div>

        {/* Name + role */}
        <div className="skeleton-agent-item__text">
          <Skeleton width="90px" height="13px" style={{ marginBottom: '6px' }} />
          <Skeleton width="60px" height="10px" />
        </div>

        {/* Right – status badge */}
        <Skeleton width="54px" height="18px" borderRadius="20px" style={{ marginLeft: 'auto' }} />
      </div>
    ))}
  </div>
);

// ─── Log Entry ────────────────────────────────────────────────────────────────

export interface SkeletonLogEntryProps {
  count?: number;
}

export const SkeletonLogEntry: React.FC<SkeletonLogEntryProps> = ({
  count = 12,
}) => (
  <div
    className="skeleton-log-list console-viewport"
    role="presentation"
    aria-hidden="true"
    aria-label="Loading log entries"
  >
    {repeat(count, (i) => (
      <div key={i} className="skeleton-log-entry console-line">
        {/* Timestamp */}
        <Skeleton
          className="skeleton-log-entry__time"
          width={`${52 + (i % 3) * 4}px`}
          height="10px"
          style={{ flexShrink: 0 }}
        />
        {/* Agent name */}
        <Skeleton
          className="skeleton-log-entry__agent"
          width={`${44 + (i % 4) * 6}px`}
          height="10px"
          style={{ flexShrink: 0 }}
        />
        {/* Message – varied widths for realism */}
        <Skeleton
          className="skeleton-log-entry__msg"
          width={`${30 + ((i * 17) % 55)}%`}
          height="10px"
        />
      </div>
    ))}
  </div>
);

// ─── Chart / Graph Area ───────────────────────────────────────────────────────

export interface SkeletonChartProps {
  /** Number of bars to render (default 7) */
  barCount?: number;
  /** Show a legend row below the chart (default true) */
  showLegend?: boolean;
  /** Height of the chart area (default '200px') */
  height?: string;
}

export const SkeletonChart: React.FC<SkeletonChartProps> = ({
  barCount = 7,
  showLegend = true,
  height = '200px',
}) => {
  // Pre-computed bar heights (vary for a realistic bar-chart silhouette)
  const barHeights = [55, 80, 40, 95, 65, 75, 50, 85, 45, 70];

  return (
    <div className="skeleton-chart glass-card" role="presentation" aria-hidden="true">
      {/* Chart header */}
      <div className="skeleton-chart__header">
        <Skeleton width="120px" height="15px" />
        <Skeleton width="72px" height="26px" borderRadius="20px" />
      </div>

      {/* Bar area */}
      <div className="skeleton-chart__body" style={{ height }}>
        {/* Y-axis ticks */}
        <div className="skeleton-chart__y-axis">
          {repeat(4, (i) => (
            <Skeleton key={i} width="24px" height="9px" />
          ))}
        </div>

        {/* Bars */}
        <div className="skeleton-chart__bars">
          {repeat(barCount, (i) => (
            <div key={i} className="skeleton-chart__bar-col">
              <Skeleton
                className="skeleton-chart__bar"
                width="100%"
                height={`${barHeights[i % barHeights.length]}%`}
                borderRadius="4px 4px 0 0"
              />
              {/* X-axis label */}
              <Skeleton width="24px" height="9px" style={{ margin: '6px auto 0' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="skeleton-chart__legend">
          {repeat(3, (i) => (
            <div key={i} className="skeleton-chart__legend-item">
              <Skeleton className="skeleton-circle" width="10px" height="10px" />
              <Skeleton width={`${40 + i * 14}px`} height="10px" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Pull Request Row ─────────────────────────────────────────────────────────

export interface SkeletonPRCardProps {
  count?: number;
}

export const SkeletonPRCard: React.FC<SkeletonPRCardProps> = ({
  count = 5,
}) => (
  <div className="skeleton-pr-list" role="presentation" aria-hidden="true">
    {repeat(count, (i) => (
      <div key={i} className="skeleton-pr-card">
        {/* Left – status dot + PR number */}
        <div className="skeleton-pr-card__left">
          <Skeleton className="skeleton-circle" width="10px" height="10px" />
          <Skeleton width="32px" height="12px" />
        </div>

        {/* Centre – title + meta */}
        <div className="skeleton-pr-card__centre">
          <Skeleton width={`${50 + ((i * 13) % 35)}%`} height="13px" style={{ marginBottom: '6px' }} />
          <div className="skeleton-pr-card__meta">
            <Skeleton width="64px" height="10px" />
            <Skeleton width="48px" height="10px" />
            <Skeleton width="56px" height="10px" />
          </div>
        </div>

        {/* Right – badges */}
        <div className="skeleton-pr-card__right">
          <Skeleton width="52px" height="18px" borderRadius="4px" />
          <Skeleton width="46px" height="18px" borderRadius="4px" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Convenience re-exports ───────────────────────────────────────────────────

export default Skeleton;
