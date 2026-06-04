import React, { useState } from 'react';
import { useDashboardStore } from '../store/store';
import { featureFlags } from '../utils/flags';

export const DevToolsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'state' | 'actions'>('state');

  // Grab state & actions from store
  const store = useDashboardStore();

  if (__ENV__ !== 'development') {
    return null;
  }

  // Prettify objects for rendering
  const renderJSON = (data: any) => {
    return (
      <pre style={{
        margin: 0,
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '6px',
        overflowX: 'auto',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono, monospace)',
        color: '#10b981',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  const handleToggleAuth = () => {
    if (store.user.isAuthenticated) {
      store.logout();
    } else {
      store.login({
        username: 'dev_ninja',
        role: 'Jonin',
        clan: 'Dev Swarm',
        avatar: '⚡',
      });
    }
  };

  const handleAddMockLog = (type: string) => {
    const messages: Record<string, string> = {
      info: 'Developer initiated heartbeat log diagnostic.',
      warning: 'Resource consumption approaching alert threshold.',
      error: 'Simulation Error: Failed to resolve address registry lookup.',
      success: 'Database query pool optimized in 14ms.'
    };
    store.addLog('dev-tools', type, messages[type] || 'Generic dev event triggered.');
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'rotate(135deg) scale(0.9)' : 'scale(1)',
        }}
        title="Toggle Swarm DevTools"
      >
        🛠️
      </button>

      {/* Slide-out Drawer Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '380px',
          height: '100vh',
          zIndex: 9998,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
              Swarm DevTools
            </h3>
            <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              State Inspector & Actions
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.2rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          {(['state', 'actions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px',
                background: 'transparent',
                border: 'none',
                color: activeTab === tab ? '#3b82f6' : '#94a3b8',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                fontWeight: 600,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'state' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                  User Session
                </h4>
                {renderJSON(store.user)}
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Feature Flags
                </h4>
                {renderJSON(featureFlags)}
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                  System Metrics
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                }}>
                  <div>Status: <span style={{ color: '#10b981' }}>{store.systemStatus}</span></div>
                  <div>Autonomy: <span style={{ color: '#8b5cf6' }}>{store.autonomyLevel}</span></div>
                  <div>HW Profile: <span style={{ color: '#3b82f6' }}>{store.hardwareProfile}</span></div>
                  <div>Cost: <span>${store.accumulatedCost.toFixed(2)}</span></div>
                  <div>Tasks Total: <span>{store.tasks.length}</span></div>
                  <div>Logs Count: <span>{store.consoleLogs.length}</span></div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Project Info
                </h4>
                {renderJSON(store.project)}
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Authentication Mock
                </h4>
                <button
                  onClick={handleToggleAuth}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: store.user.isAuthenticated ? '#ef4444' : '#10b981',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {store.user.isAuthenticated ? 'Force Logout' : 'Force Login (Dev Ninja)'}
                </button>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Inject Mock Logs
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {(['info', 'success', 'warning', 'error'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleAddMockLog(type)}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#3b82f6',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      + {type} log
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                  System Configuration
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <select
                    value={store.systemStatus}
                    onChange={(e) => store.updateSystemStatus(e.target.value)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <option value="active">System: Active</option>
                    <option value="degraded">System: Degraded</option>
                    <option value="maintenance">System: Maintenance</option>
                  </select>

                  <select
                    value={store.autonomyLevel}
                    onChange={(e) => store.updateSetting('autonomyLevel', e.target.value)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <option value="advisory">Autonomy: Advisory</option>
                    <option value="semi-autonomous">Autonomy: Semi-Autonomous</option>
                    <option value="fully-autonomous">Autonomy: Fully-Autonomous</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(0, 0, 0, 0.2)',
          fontSize: '0.7rem',
          color: '#64748b',
          textAlign: 'center'
        }}>
          Vite Environment Mode: <strong>{__ENV__}</strong>
        </div>
      </div>
    </>
  );
};
