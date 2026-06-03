/* ============================================================
   CoNinja Shadow Swarm — Canonical Data & Identity Registry
   ============================================================
   Single source of truth for ALL entity names, statuses,
   labels, and metrics. Every component MUST reference these
   instead of hardcoded values.
   ============================================================ */

(function () {
  'use strict';

  /* ── Agent Registry ─────────────────────────────────────── */
  window.canonicalAgents = [
    {
      id: 'sensei',
      name: 'Sensei',
      japanese: '先生',
      role: 'Orchestrator',
      description:
        'Strategic orchestrator. Assigns missions, reviews outcomes, coordinates the clan.',
      color: '#ff7300',
      model: 'Claude 3.5 Sonnet',
      icon: 'dojo',
      status: 'active',
    },
    {
      id: 'kage-coder',
      name: 'Kage Coder',
      japanese: '影コーダー',
      role: 'Senior Engineer',
      description: 'Elite shinobi specializing in full-stack implementation with shadow precision.',
      color: '#4ecdc4',
      model: 'Claude 3.5 Sonnet',
      icon: 'katana',
      status: 'active',
    },
    {
      id: 'oni-tester',
      name: 'Oni Tester',
      japanese: '鬼テスター',
      role: 'Quality Specialist',
      description: 'Relentless QA warrior. Hunts bugs like demons in the night.',
      color: '#ff6b6b',
      model: 'GPT-4o',
      icon: 'flask',
      status: 'active',
    },
    {
      id: 'kunoichi-security',
      name: 'Kunoichi',
      japanese: 'くノ一',
      role: 'Security Auditor',
      description:
        'Shadow guard. Scans for vulnerabilities, secrets leaks, and dependency threats.',
      color: '#a78bfa',
      model: 'Claude 3.5 Haiku',
      icon: 'shield',
      status: 'idle',
    },
    {
      id: 'tsuchi-devops',
      name: 'Tsuchi',
      japanese: '土',
      role: 'DevOps Engineer',
      description:
        'Infrastructure shinobi. Manages deployments, CI/CD pipelines, and environment health.',
      color: '#f59e0b',
      model: 'GPT-4o Mini',
      icon: 'rocket',
      status: 'active',
    },
    {
      id: 'hana-architect',
      name: 'Hana',
      japanese: '花',
      role: 'Solutions Architect',
      description: 'Designs system blueprints, data models, and architectural decisions.',
      color: '#ec4899',
      model: 'Claude 3.5 Sonnet',
      icon: 'blueprint',
      status: 'meditating',
    },
    {
      id: 'stealth-scout',
      name: 'Stealth Scout',
      japanese: '偵察忍',
      role: 'Research Analyst',
      description: 'Reconnaissance specialist. Gathers intel from external APIs and documentation.',
      color: '#22c55e',
      model: 'GPT-4o Mini',
      icon: 'radar',
      status: 'idle',
    },
    {
      id: 'debt-chunin',
      name: 'Debt Chunin',
      japanese: '負債中忍',
      role: 'Technical Debt Manager',
      description: 'Tracks and resolves technical debt, refactoring legacy code with precision.',
      color: '#6366f1',
      model: 'Claude 3.5 Haiku',
      icon: 'refactor',
      status: 'idle',
    },
  ];

  /* ── Status Registry ────────────────────────────────────── */
  window.canonicalStatuses = {
    agent: {
      active: { label: 'Active', class: 'status-active', dot: 'dot-active' },
      meditating: { label: 'Meditating', class: 'status-meditating', dot: 'dot-thinking' },
      idle: { label: 'Idle', class: 'status-idle', dot: 'dot-idle' },
      error: { label: 'Error', class: 'status-error', dot: 'dot-error' },
      offline: { label: 'Offline', class: 'status-offline', dot: 'dot-offline' },
    },
    task: {
      backlog: { label: 'Backlog', class: 'badge-neutral', color: '#6b7280' },
      in_progress: { label: 'In Progress', class: 'badge-active', color: '#ff7300' },
      review: { label: 'In Review', class: 'badge-warning', color: '#f59e0b' },
      completed: { label: 'Completed', class: 'badge-success', color: '#22c55e' },
      failed: { label: 'Failed', class: 'badge-danger', color: '#ef4444' },
      blocked: { label: 'Blocked', class: 'badge-danger', color: '#ef4444' },
    },
    project: {
      active: { label: 'Active', class: 'badge-success', color: '#22c55e' },
      paused: { label: 'Paused', class: 'badge-warning', color: '#f59e0b' },
      archived: { label: 'Archived', class: 'badge-neutral', color: '#6b7280' },
    },
    deployment: {
      deployed: { label: 'Deployed', class: 'badge-success', color: '#22c55e' },
      promoting: { label: 'Promoting', class: 'badge-warning', color: '#f59e0b' },
      pending: { label: 'Pending', class: 'badge-neutral', color: '#6b7280' },
      failed: { label: 'Failed', class: 'badge-danger', color: '#ef4444' },
    },
    notification: {
      success: { label: 'Success', class: 'badge-success' },
      warning: { label: 'Warning', class: 'badge-warning' },
      error: { label: 'Error', class: 'badge-danger' },
      info: { label: 'Info', class: 'badge-info' },
    },
  };

  /* ── Canonical Labels ───────────────────────────────────── */
  window.canonicalLabels = {
    // Navigation labels (single source of truth)
    nav: {
      'swarm-graph': 'Shinobi Clan',
      'task-board': 'Jutsu Roadmap',
      'logs-console': 'Stealth Scroll',
      notifications: 'Notifications',
      projects: 'Projects',
      collaboration: 'Collaboration',
      'dojo-workbench': 'Dojo Workbench',
      'repo-explorer': 'Repository',
      'pull-requests': 'Pull Requests',
      workflow: 'Workflow Forge',
      'agent-studio': 'Agent Studio',
      testing: 'Testing Grounds',
      'neural-graph': 'Neural Graph',
      memory: 'Memory Vault',
      intelligence: 'Intelligence Hub',
      'mission-reports': 'Stealth Archives',
      analytics: 'Analytics',
      'ops-recovery': 'Ops & Recovery',
      monitoring: 'Pulse Monitor',
      deployment: 'Deploy Gate',
      'sandbox-multiplexer': 'Sandbox Multiplexer',
      approvals: 'Approvals',
      'decision-log': 'Council Decrees',
      debate: 'Debate Center',
      security: 'Shadow Guard',
      provenance: 'Provenance',
      'mcp-registry': 'MCP Registry',
      settings: 'Dojo Rules',
    },
    // Section groups
    sections: {
      mission_control: 'Mission Control',
      engineering: 'Engineering',
      intelligence: 'Intelligence',
      operations: 'Operations',
      governance: 'Governance',
      infrastructure: 'Infrastructure',
    },
    // Metric display labels
    metrics: {
      llm_requests: 'Ki Manifests',
      auto_fixes: 'Shadow Deflects',
      confidence: 'Shinobi Focus',
      test_coverage: 'Jutsu Accuracy',
      tasks_total: 'Total Jutsu',
      tasks_active: 'Active Missions',
      agents_active: 'Active Shinobi',
      cost_spent: 'Silver Spent',
      cost_budget: 'Silver Budget',
    },
  };

  /* ── Canonical Metrics Registry ──────────────────────────── */
  window.canonicalMetrics = {
    defaults: {
      llm_requests: 412,
      auto_fixes: 24,
      confidence: 91,
      test_coverage: 84.2,
      tasks_total: 12,
      tasks_active: 3,
      agents_active: 6,
      cost_spent: 1.42,
      cost_budget: 5.0,
    },
    update(key, value) {
      if (this.defaults.hasOwnProperty(key)) {
        this.defaults[key] = value;
      }
    },
    get(key) {
      return this.defaults[key] !== undefined ? this.defaults[key] : 0;
    },
  };

  /* ── Helper: Get agent by ID ────────────────────────────── */
  window.getCanonicalAgent = function (agentId) {
    return window.canonicalAgents.find((a) => a.id === agentId) || null;
  };

  /* ── Helper: Get agent display name ─────────────────────── */
  window.getAgentDisplayName = function (agentId) {
    const agent = window.getCanonicalAgent(agentId);
    return agent ? agent.name : agentId || 'Unknown Shinobi';
  };

  /* ── Helper: Get status display ─────────────────────────── */
  window.getStatusDisplay = function (type, status) {
    const registry = window.canonicalStatuses[type];
    if (!registry) return { label: status, class: 'badge-neutral', color: '#6b7280' };
    return registry[status] || { label: status, class: 'badge-neutral', color: '#6b7280' };
  };

  /* ── Helper: Get nav label ──────────────────────────────── */
  window.getNavLabel = function (tabId) {
    return window.canonicalLabels.nav[tabId] || tabId;
  };

  /* ── Helper: Format metric ──────────────────────────────── */
  window.formatMetric = function (key, value) {
    if (value === undefined) value = window.canonicalMetrics.get(key);
    if (typeof value === 'number') {
      if (key.includes('cost')) return `$${value.toFixed(2)}`;
      if (key.includes('coverage') || key.includes('confidence')) return `${value.toFixed(1)}%`;
      return value.toLocaleString();
    }
    return String(value);
  };

  /* ── Register canonical data in state ────────────────────── */
  window.canonicalInit = function () {
    // Ensure state has canonical references
    // Note: window.state.agents is an OBJECT keyed by ID, not an array
    if (window.state && window.state.agents && typeof window.state.agents === 'object') {
      Object.keys(window.state.agents).forEach(function (key) {
        const agent = window.state.agents[key];
        const canonical = window.getCanonicalAgent(agent.id || key);
        if (canonical) {
          agent.name = canonical.name;
          agent.role = canonical.role;
          agent.color = canonical.color;
          agent.model = canonical.model;
        }
      });
    }
  };
})();
