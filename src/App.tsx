import React, { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastViewport } from './components/ui/Toast';
import { useDashboardStore } from './store/store';

// Lazy loaded screens
const AgentStudio = lazy(() => import('./screens/AgentStudio'));
const JutsuRoadmap = lazy(() => import('./screens/JutsuRoadmap'));
const StealthScroll = lazy(() => import('./screens/StealthScroll'));
const DeployGate = lazy(() => import('./screens/DeployGate'));
const PullRequests = lazy(() => import('./screens/PullRequests'));
const CouncilDecrees = lazy(() => import('./screens/CouncilDecrees'));
const ShadowGuard = lazy(() => import('./screens/ShadowGuard'));
const ProjectManagement = lazy(() => import('./screens/ProjectManagement'));
const SettingsForm = lazy(() => import('./screens/SettingsForm'));
const WorkflowConfig = lazy(() => import('./screens/WorkflowConfig'));
const DebateArena = lazy(() => import('./screens/DebateArena'));
const MemoryVault = lazy(() => import('./screens/MemoryVault'));
const TestingSuite = lazy(() => import('./screens/TestingSuite'));
const SwarmMonitoring = lazy(() => import('./screens/SwarmMonitoring'));
const IntakeRegistry = lazy(() => import('./screens/IntakeRegistry'));
const RepositoryBrowser = lazy(() => import('./screens/RepositoryBrowser'));
const ProvenanceTracker = lazy(() => import('./screens/ProvenanceTracker'));
const ApprovalQueue = lazy(() => import('./screens/ApprovalQueue'));
const IncidentLog = lazy(() => import('./screens/IncidentLog'));
const FeatureFlagsConfig = lazy(() => import('./screens/FeatureFlagsConfig'));
const SecretVault = lazy(() => import('./screens/SecretVault'));
const CollaborationHub = lazy(() => import('./screens/CollaborationHub'));
const SwarmAnalytics = lazy(() => import('./screens/SwarmAnalytics'));
const IntelligenceGraph = lazy(() => import('./screens/IntelligenceGraph'));
const AppearanceSettings = lazy(() => import('./screens/AppearanceSettings'));
const NotificationCenter = lazy(() => import('./screens/NotificationCenter'));
const LlmProfileManager = lazy(() => import('./screens/LlmProfileManager'));
const KnowledgeBase = lazy(() => import('./screens/KnowledgeBase'));
const TaskBoard = lazy(() => import('./screens/TaskBoard'));

// Screen Registry to prevent unused local errors and enable dynamic loading
export const screensRegistry = {
  AgentStudio,
  JutsuRoadmap,
  StealthScroll,
  DeployGate,
  PullRequests,
  CouncilDecrees,
  ShadowGuard,
  ProjectManagement,
  SettingsForm,
  WorkflowConfig,
  DebateArena,
  MemoryVault,
  TestingSuite,
  SwarmMonitoring,
  IntakeRegistry,
  RepositoryBrowser,
  ProvenanceTracker,
  ApprovalQueue,
  IncidentLog,
  FeatureFlagsConfig,
  SecretVault,
  CollaborationHub,
  SwarmAnalytics,
  IntelligenceGraph,
  AppearanceSettings,
  NotificationCenter,
  LlmProfileManager,
  KnowledgeBase,
  TaskBoard
};
import { DevToolsPanel } from './components/DevToolsPanel';
import { useAuth, usePermission } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';

type ScreenType = 'dashboard' | 'jutsu-roadmap' | 'logs' | 'pull-requests' | 'settings';

const App: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const canViewDashboard = usePermission('view:dashboard');
  const canViewRoadmap = usePermission('view:roadmap');
  const canViewPRs = usePermission('view:pull-requests');
  const canViewLogs = usePermission('view:logs');
  const canViewSettings = usePermission('view:settings');

  const currentTab = useDashboardStore((state) => state.activeTab);
  const switchTab = useDashboardStore((state) => state.switchTab);

  const currentScreen: ScreenType =
    currentTab === 'jutsu-roadmap'
      ? 'jutsu-roadmap'
      : currentTab === 'pull-requests'
        ? 'pull-requests'
        : currentTab === 'logs'
          ? 'logs'
          : currentTab === 'settings'
            ? 'settings'
            : 'dashboard';

  const setCurrentScreen = (screen: ScreenType) => {
    switchTab(screen);
  };

  const LoadingFallback = () => (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 180, height: 28, borderRadius: 6, background: 'rgba(255, 255, 255, 0.05)' }} />
        <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 6, background: 'rgba(255, 255, 255, 0.05)' }} />
      </div>
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="skeleton" style={{ width: '40%', height: 18, borderRadius: 4, background: 'rgba(255, 255, 255, 0.05)' }} />
        <div className="skeleton" style={{ width: '80%', height: 14, borderRadius: 4, background: 'rgba(255, 255, 255, 0.05)' }} />
        <div className="skeleton" style={{ width: '60%', height: 14, borderRadius: 4, background: 'rgba(255, 255, 255, 0.05)' }} />
        <div className="skeleton" style={{ width: '90%', height: 14, borderRadius: 4, background: 'rgba(255, 255, 255, 0.05)' }} />
      </div>
    </div>
  );

  const renderScreen = () => {
    if (currentTab === 'login') {
      return <LoginPage />;
    }

    return (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          {(() => {
            switch (currentScreen) {
              case 'jutsu-roadmap':
                return <JutsuRoadmap />;
              case 'pull-requests':
                return <PullRequests />;
              case 'logs':
                return <StealthScroll />;
              case 'settings':
                return <SettingsForm />;
              default:
                return (
                  <div className='page-shell'>
                    <div className='glass-card' style={{ maxWidth: 520 }}>
                      <h2 style={{ marginBottom: 8 }}>Welcome to CodeWeaver Dashboard</h2>
                      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
                        Your Vite-powered agentic coding swarm is ready.{' '}
                        <span style={{ color: 'var(--text-muted)' }}>v{__APP_VERSION__}</span>
                      </p>
                    </div>
                  </div>
                );
            }
          })()}
        </Suspense>
      </ProtectedRoute>
    );
  };

  const navItem = (screen: ScreenType, label: string) => (
    <button
      onClick={() => setCurrentScreen(screen)}
      className={`nav-item ${currentScreen === screen ? 'active' : ''}`}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <ErrorBoundary tabId="main-dashboard">
      {/* Toast portal target */}
      <div id="toast-portal" />
      {/* Toast renderer */}
      <ToastViewport />

      <div className='min-h-screen' style={{ background: 'var(--bg-base)' }}>
        <header style={{
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-color)',
          backdropFilter: 'var(--glass-blur)',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {__APP_NAME__}
              <span style={{ marginLeft: 8, fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400, fontFamily: 'var(--font-mono)' }}>
                {__ENV__}
              </span>
            </h1>
            {isAuthenticated ? (
              <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {canViewDashboard && navItem('dashboard',     'Dashboard')}
                {canViewRoadmap && navItem('jutsu-roadmap', 'Jutsu Roadmap')}
                {canViewPRs && navItem('pull-requests', 'Pull Requests')}
                {canViewLogs && navItem('logs',          'Logs')}
                {canViewSettings && navItem('settings',      'Settings')}
                <button
                  onClick={logout}
                  className="nav-item"
                  style={{
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    marginLeft: '8px',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  type="button"
                >
                  Logout
                </button>
              </nav>
            ) : (
              <nav style={{ display: 'flex', gap: 4 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                  Secured Swarm Connection
                </span>
              </nav>
            )}
          </div>
        </header>

        <main>
          {renderScreen()}
        </main>
      </div>
      <DevToolsPanel />
    </ErrorBoundary>
  );
};

export default App;
