import React from 'react';

const ShadowGuard: React.FC = () => {
  return (
    <div className="page-shell">
      <div className="glass-card" style={{ padding: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 700 }}>ShadowGuard</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
          Backend integration - Ticket #301
        </p>
      </div>
    </div>
  );
};

export default ShadowGuard;
