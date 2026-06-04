import React, { useState, useEffect } from 'react';
import EmptyState from '../components/EmptyState';
import { SkeletonLogEntry, SkeletonAgentItem } from '../components/Skeleton';
import { useDashboardStore } from '../store/store';

const Logs: React.FC = () => {
  const logs = useDashboardStore((state) => state.consoleLogs);
  const addLog = useDashboardStore((state) => state.addLog);
  const clearLogs = useDashboardStore((state) => state.clearLogs);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isError] = useState(false);
  const [isUnauthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch = log.msg.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAgent = agentFilter === 'all' || log.agent === agentFilter;
    return matchesSearch && matchesAgent;
  });

  const uniqueAgents = Array.from(new Set(logs.map((l: any) => l.agent)));

  if (isLoading) {
    return (
      <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1>System Logs</h1>

        {/* Two-column layout: agent list on the left, log stream on the right */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, flex: 1 }}>
          {/* Agent sidebar skeleton */}
          <div
            className="glass-card"
            aria-busy="true"
            aria-label="Loading agents…"
            style={{ padding: '16px 12px' }}
          >
            <div style={{ marginBottom: 12 }}>
              <span className="skeleton" style={{ width: 80, height: 10, display: 'block', marginBottom: 12 }} />
            </div>
            <SkeletonAgentItem count={6} />
          </div>

          {/* Console log stream skeleton */}
          <div aria-busy="true" aria-label="Loading log entries…">
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span className="skeleton" style={{ flex: 1, height: 34, borderRadius: 6, display: 'block' }} />
              <span className="skeleton" style={{ width: 90, height: 34, borderRadius: 6, display: 'block' }} />
              <span className="skeleton" style={{ width: 36, height: 34, borderRadius: 6, display: 'block' }} />
            </div>
            <SkeletonLogEntry count={16} />
          </div>
        </div>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="page-empty-shell">
        <EmptyState
          variant="unauthorized"
          title="Access Restricted"
          description="You don't have permission to view system logs. Contact your administrator to request access."
          actionLabel="Request Access"
          onAction={() => console.warn('Request access…')}
          secondaryLabel="Go Back"
          onSecondaryAction={() => history.back()}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-empty-shell">
        <EmptyState
          variant="error"
          title="Failed to Load Logs"
          description="An error occurred while retrieving system logs. The log service may be temporarily unavailable."
          actionLabel="Retry"
          onAction={() => window.location.reload()}
          secondaryLabel="Check Status"
          onSecondaryAction={() => console.warn('Check status…')}
        />
      </div>
    );
  }

  if (searchQuery.trim() && filteredLogs.length === 0) {
    return (
      <div className="page-empty-shell">
        <EmptyState
          variant="no-search"
          title="No Log Entries Found"
          description={`No logs match "${searchQuery}". Try a different keyword or expand the time range.`}
          actionLabel="Clear Filter"
          onAction={() => { setSearchQuery(''); setAgentFilter('all'); }}
        />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="page-empty-shell">
        <EmptyState
          variant="no-data"
          title="No Logs Available"
          description="The system hasn't generated any log entries yet. Logs will appear here automatically once activity is recorded."
          actionLabel="Simulate Activity"
          onAction={() => addLog('system', 'info', 'User initiated manual sync log entry.')}
          secondaryLabel="Configure Log Level"
          onSecondaryAction={() => console.warn('Configure log level…')}
        />
      </div>
    );
  }

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1>System Logs</h1>
        <button className="btn btn-outline btn-sm" onClick={clearLogs}>Clear Logs</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, height: 'calc(100vh - 220px)' }}>
        {/* Filters */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Shinobi Swarm</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button 
              className={`btn btn-sm ${agentFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              onClick={() => setAgentFilter('all')}
            >
              All Threads
            </button>
            {uniqueAgents.map((agent: string) => (
              <button 
                key={agent}
                className={`btn btn-sm ${agentFilter === agent ? 'btn-primary' : 'btn-outline'}`}
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                onClick={() => setAgentFilter(agent)}
              >
                {agent}
              </button>
            ))}
          </div>
        </div>

        {/* Console stream */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: '#080605', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          {/* Search bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input 
              type="text" 
              className="form-input" 
              style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
              placeholder="Search console logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', lineHeight: 1.6, padding: '8px', color: '#c5b5a5' }}>
            {filteredLogs.map((log: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.02)', padding: '4px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span>
                <span style={{ color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#22c55e' : '#ff7300', fontWeight: 600 }}>
                  [{log.agent}]
                </span>
                <span style={{ color: log.type === 'error' ? '#ef4444' : 'inherit' }}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;

