import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDashboardStore } from '../store/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const switchTab = useDashboardStore((state) => state.switchTab);
  const currentTab = useDashboardStore((state) => state.activeTab);
  const [isDetermining, setIsDetermining] = useState(true);

  useEffect(() => {
    // Simulate determining/validating token status briefly
    const timer = setTimeout(() => {
      setIsDetermining(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isDetermining && !isAuthenticated) {
      console.warn(`[ProtectedRoute] Access denied to tab "${currentTab}". Redirecting to login.`);
      
      // Save the intended tab/view to redirect back after login
      if (currentTab && currentTab !== 'login') {
        sessionStorage.setItem('auth_return_tab', currentTab);
      }
      
      switchTab('login');
    }
  }, [isAuthenticated, isDetermining, switchTab, currentTab]);

  if (isDetermining) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        gap: '16px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid rgba(255, 255, 255, 0.05)',
          borderTopColor: '#3b82f6',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
          Authenticating Swarm Credentials...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
