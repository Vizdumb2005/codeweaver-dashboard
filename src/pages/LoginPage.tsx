import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDashboardStore } from '../store/store';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const switchTab = useDashboardStore((state) => state.switchTab);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Chunin');
  const [clan, setClan] = useState('Shadow Clan');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setTimeout(async () => {
      try {
        await login({
          username: username.trim(),
          role,
          clan,
          avatar: '⚡',
        });
        
        const returnTab = sessionStorage.getItem('auth_return_tab');
        if (returnTab) {
          sessionStorage.removeItem('auth_return_tab');
          switchTab(returnTab);
        } else {
          switchTab('dashboard');
        }
      } catch (err) {
        console.error('[Login] Failed to sign in:', err);
      } finally {
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '24px',
    }}>
      <div className="glass-card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '32px',
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '2.5rem' }}>🌌</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '12px', marginBottom: '4px' }}>
            CodeWeaver Swarm
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Establish a secure connection with the agent collective
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Codename
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. shinobi_coder"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Swarm Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            >
              <option value="Genin">Genin (Junior Swarm Node)</option>
              <option value="Chunin">Chunin (Standard Operator)</option>
              <option value="Jonin">Jonin (Lead Architect)</option>
              <option value="Kage">Kage (Swarm Overlord)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Clan Registry
            </label>
            <input
              type="text"
              value={clan}
              onChange={(e) => setClan(e.target.value)}
              placeholder="Shadow Clan"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              marginTop: '10px',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.2)',
              opacity: loading || !username.trim() ? 0.7 : 1,
            }}
          >
            {loading ? 'Decrypting Seals...' : 'Access Swarm Control'}
          </button>
        </form>
      </div>
    </div>
  );
};
