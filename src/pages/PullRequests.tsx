import React, { useState, useEffect } from 'react';
import EmptyState from '../components/EmptyState';
import { SkeletonPRCard, SkeletonChart } from '../components/Skeleton';
import { useDashboardStore } from '../store/store';

const PullRequests: React.FC = () => {
  const pullRequestsState = useDashboardStore((state) => state.pullRequests);
  const pullRequests = pullRequestsState?.list || [];
  
  const [isLoading, setIsLoading] = useState(true);
  const [isError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredPRs = pullRequests.filter((pr: any) => {
    const matchesSearch = pr.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pr.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pr.branch.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || pr.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="page-shell">
        <h1 style={{ marginBottom: 20 }}>Pull Requests</h1>

        <SkeletonChart barCount={7} height="160px" showLegend />

        <div
          className="glass-card"
          style={{ marginTop: 20 }}
          aria-busy="true"
          aria-label="Loading pull requests…"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="skeleton" style={{ width: 110, height: 13, display: 'block' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="skeleton" style={{ width: 80, height: 30, borderRadius: 20, display: 'block' }} />
              <span className="skeleton" style={{ width: 80, height: 30, borderRadius: 20, display: 'block' }} />
            </div>
          </div>
          <SkeletonPRCard count={6} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-empty-shell">
        <EmptyState
          variant="error"
          title="Error Loading Pull Requests"
          description="Something went wrong while fetching pull requests. Please retry or contact your administrator."
          actionLabel="Retry"
          onAction={() => window.location.reload()}
          secondaryLabel="View Logs"
          onSecondaryAction={() => console.warn('Navigate to logs…')}
        />
      </div>
    );
  }

  if (searchQuery.trim() && filteredPRs.length === 0) {
    return (
      <div className="page-empty-shell">
        <EmptyState
          variant="no-search"
          title="No Matching Pull Requests"
          description={`No pull requests match "${searchQuery}". Try adjusting your search terms.`}
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      </div>
    );
  }

  if (pullRequests.length === 0) {
    return (
      <div className="page-empty-shell">
        <EmptyState
          variant="no-data"
          title="No Pull Requests"
          description="There are no open pull requests right now. Push a branch and open a PR to start the code review process."
          actionLabel="Open Pull Request"
          onAction={() => console.warn('Open PR…')}
          secondaryLabel="View Merged PRs"
          onSecondaryAction={() => setFilter('merged')}
        />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Pull Requests</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <input 
            type="text" 
            className="form-input form-input-sm" 
            style={{ width: '220px', height: '32px', fontSize: '0.8rem' }}
            placeholder="Filter PRs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="form-input form-input-sm" 
            style={{ width: '120px', height: '32px', fontSize: '0.8rem' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="merged">Merged</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredPRs.map((pr: any) => (
          <div key={pr.id} className="pr-card glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="task-id" style={{ color: 'var(--text-muted)' }}>#{pr.number}</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>{pr.title}</h3>
                {pr.labels?.map((label: string) => (
                  <span key={label} className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{label}</span>
                ))}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Opened by <strong>{pr.author}</strong> from <span className="branch-tag" style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{pr.branch}</span> into <span className="branch-tag" style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{pr.base}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', display: 'flex', gap: 8 }}>
                <span style={{ color: '#22c55e' }}>+{pr.additions}</span>
                <span style={{ color: '#ef4444' }}>-{pr.deletions}</span>
              </div>
              <span className={`badge badge-${pr.ciStatus === 'passing' ? 'success' : pr.ciStatus === 'failing' ? 'danger' : 'warning'}`}>
                CI {pr.ciStatus}
              </span>
              <span className={`badge badge-${pr.status === 'merged' ? 'info' : pr.status === 'open' ? 'active' : 'neutral'}`}>
                {pr.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PullRequests;

