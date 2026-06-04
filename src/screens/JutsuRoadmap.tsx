import React, { useState, useEffect } from 'react';
import EmptyState from '../components/EmptyState';
import { SkeletonTaskCard } from '../components/Skeleton';
import { useDashboardStore } from '../store/store';

const JutsuRoadmap: React.FC = () => {
  const tasks = useDashboardStore((state) => state.tasks);
  const [isLoading, setIsLoading] = useState(true);
  const [isError] = useState(false);

  // Simulate async data fetch
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);


  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="header-actions" style={{ marginBottom: '16px' }}>
          <h1>Jutsu Roadmap</h1>
        </div>
        {/* Kanban-style skeleton: 4 columns × 4 cards */}
        <div className="kanban-board" aria-busy="true" aria-label="Loading tasks…">
          {[0, 1, 2, 3].map((col) => (
            <div key={col} className="kanban-col">
              {/* Column header */}
              <div className="col-header">
                <div className="col-header-main" style={{ gap: 10 }}>
                  <span className="skeleton skeleton-circle" style={{ width: 10, height: 10 }} />
                  <span className="skeleton" style={{ width: 70, height: 12, display: 'block' }} />
                </div>
                <span className="skeleton" style={{ width: 22, height: 18, borderRadius: 4, display: 'block' }} />
              </div>
              {/* Task cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                <SkeletonTaskCard count={3 + (col % 2)} showProgress={col === 1} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-empty-shell">
        <EmptyState
          variant="error"
          title="Failed to Load Roadmap"
          description="We couldn't fetch your jutsu tasks. Check your connection or try again."
          actionLabel="Retry"
          onAction={() => window.location.reload()}
          secondaryLabel="Go Back"
          onSecondaryAction={() => history.back()}
        />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="page-empty-shell">
        <EmptyState
          variant="no-data"
          title="No Jutsu Tasks Yet"
          description="Your ninja roadmap is empty. Create your first task to start tracking skills and progress on your path to mastery."
          actionLabel="Create First Task"
          onAction={() => console.warn('Creating first jutsu task…')}
          secondaryLabel="Import Tasks"
          onSecondaryAction={() => console.warn('Import tasks…')}
        />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="header-actions" style={{ marginBottom: '16px' }}>
        <h1>Jutsu Roadmap</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {tasks.map((task: any) => (
          <div key={task.id} className="task-card glass-card" style={{ padding: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className={`badge badge-${task.priority >= 4 ? 'danger' : 'warning'}`}>{task.complexity}</span>
              <span className="task-duration" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.duration}</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>{task.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '12px' }}>{task.desc}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assignee: <strong>{task.assignee}</strong></span>
              <span className={`badge badge-${task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'active' : 'neutral'}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JutsuRoadmap;

