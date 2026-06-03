/* ============================================================
   CoNinja Shadow Swarm — Reusable Empty State Component
   ============================================================
   Every empty state should feel intentional, not abandoned.
   Provides illustration, title, description, primary action,
   and optional secondary action.
   ============================================================ */

(function () {
  'use strict';

  /* ── SVG Illustration Library ────────────────────────────── */
  window.emptyStateIllustrations = {
    // A kunai (throwing knife) resting on a scroll
    kunai: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:160px;height:128px;">
      <g opacity="0.15">
        <path d="M100 20 L108 70 L140 55 L115 80 L140 105 L108 90 L100 140 L92 90 L60 105 L85 80 L60 55 L92 70 Z" fill="#ff7300"/>
      </g>
      <g opacity="0.08">
        <rect x="55" y="60" width="90" height="40" rx="4" fill="#ff7300"/>
        <line x1="65" y1="72" x2="135" y2="72" stroke="#ff7300" stroke-width="2" opacity="0.3"/>
        <line x1="65" y1="82" x2="120" y2="82" stroke="#ff7300" stroke-width="2" opacity="0.2"/>
        <line x1="65" y1="92" x2="105" y2="92" stroke="#ff7300" stroke-width="2" opacity="0.15"/>
      </g>
      <text x="100" y="155" text-anchor="middle" fill="#ff7300" opacity="0.2" font-size="8" font-family="JetBrains Mono">忍</text>
    </svg>`,

    // Empty scroll
    scroll: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:160px;height:128px;">
      <g opacity="0.12">
        <rect x="40" y="40" width="120" height="80" rx="6" fill="none" stroke="#ff7300" stroke-width="2" stroke-dasharray="8 4"/>
        <line x1="55" y1="60" x2="145" y2="60" stroke="#ff7300" stroke-width="1.5" opacity="0.2"/>
        <line x1="55" y1="72" x2="130" y2="72" stroke="#ff7300" stroke-width="1.5" opacity="0.15"/>
        <line x1="55" y1="84" x2="115" y2="84" stroke="#ff7300" stroke-width="1.5" opacity="0.1"/>
        <line x1="55" y1="96" x2="100" y2="96" stroke="#ff7300" stroke-width="1.5" opacity="0.08"/>
      </g>
      <text x="100" y="155" text-anchor="middle" fill="#ff7300" opacity="0.2" font-size="8" font-family="JetBrains Mono">空</text>
    </svg>`,

    // Shield (for security/governance empty states)
    shield: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:160px;height:128px;">
      <g opacity="0.12">
        <path d="M100 25 L160 50 V100 C160 130 100 150 100 150 C100 150 40 130 40 100 V50 Z" fill="none" stroke="#ff7300" stroke-width="2"/>
        <path d="M100 45 L145 63 V98 C145 120 100 136 100 136 C100 136 55 120 55 98 V63 Z" fill="#ff7300" opacity="0.05"/>
      </g>
      <text x="100" y="155" text-anchor="middle" fill="#ff7300" opacity="0.2" font-size="8" font-family="JetBrains Mono">盾</text>
    </svg>`,

    // Network (for analytics/intelligence empty states)
    network: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:160px;height:128px;">
      <g opacity="0.12">
        <circle cx="100" cy="50" r="8" fill="#ff7300" opacity="0.2"/>
        <circle cx="55" cy="110" r="8" fill="#ff7300" opacity="0.2"/>
        <circle cx="145" cy="110" r="8" fill="#ff7300" opacity="0.2"/>
        <circle cx="100" cy="130" r="6" fill="#ff7300" opacity="0.1"/>
        <line x1="92" y1="56" x2="62" y2="104" stroke="#ff7300" stroke-width="1.5" opacity="0.15"/>
        <line x1="108" y1="56" x2="138" y2="104" stroke="#ff7300" stroke-width="1.5" opacity="0.15"/>
        <line x1="62" y1="110" x2="138" y2="110" stroke="#ff7300" stroke-width="1.5" opacity="0.15" stroke-dasharray="4 4"/>
        <line x1="62" y1="118" x2="95" y2="127" stroke="#ff7300" stroke-width="1" opacity="0.1"/>
        <line x1="138" y1="118" x2="105" y2="127" stroke="#ff7300" stroke-width="1" opacity="0.1"/>
      </g>
      <text x="100" y="155" text-anchor="middle" fill="#ff7300" opacity="0.2" font-size="8" font-family="JetBrains Mono">網</text>
    </svg>`,

    // Katana (for workbench/engineering empty states)
    katana: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:160px;height:128px;">
      <g opacity="0.12">
        <path d="M60 130 L150 40" stroke="#ff7300" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M150 40 L155 30" stroke="#ff7300" stroke-width="2" stroke-linecap="round"/>
        <path d="M55 135 L65 125" stroke="#ff7300" stroke-width="3" stroke-linecap="round"/>
        <rect x="48" y="128" width="18" height="6" rx="2" fill="#ff7300" opacity="0.2" transform="rotate(-45 57 131)"/>
      </g>
      <text x="100" y="155" text-anchor="middle" fill="#ff7300" opacity="0.2" font-size="8" font-family="JetBrains Mono">刀</text>
    </svg>`,

    // Radar (for monitoring/collaboration empty states)
    radar: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:160px;height:128px;">
      <g opacity="0.12">
        <circle cx="100" cy="80" r="50" fill="none" stroke="#ff7300" stroke-width="1.5"/>
        <circle cx="100" cy="80" r="35" fill="none" stroke="#ff7300" stroke-width="1" opacity="0.5"/>
        <circle cx="100" cy="80" r="20" fill="none" stroke="#ff7300" stroke-width="0.8" opacity="0.3"/>
        <line x1="100" y1="30" x2="100" y2="130" stroke="#ff7300" stroke-width="0.8" opacity="0.15"/>
        <line x1="50" y1="80" x2="150" y2="80" stroke="#ff7300" stroke-width="0.8" opacity="0.15"/>
        <path d="M100 80 L130 55" stroke="#ff7300" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
      </g>
      <text x="100" y="155" text-anchor="middle" fill="#ff7300" opacity="0.2" font-size="8" font-family="JetBrains Mono">探</text>
    </svg>`,

    // Cloud (for deployment/infrastructure empty states)
    cloud: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:160px;height:128px;">
      <g opacity="0.12">
        <path d="M60 100 C40 100 35 80 50 70 C45 50 65 40 80 48 C90 30 120 30 130 48 C155 42 165 65 150 80 C165 85 160 100 140 100 Z" fill="none" stroke="#ff7300" stroke-width="2"/>
        <line x1="85" y1="115" x2="80" y2="135" stroke="#ff7300" stroke-width="1.5" opacity="0.2" stroke-linecap="round"/>
        <line x1="100" y1="115" x2="100" y2="140" stroke="#ff7300" stroke-width="1.5" opacity="0.25" stroke-linecap="round"/>
        <line x1="115" y1="115" x2="120" y2="135" stroke="#ff7300" stroke-width="1.5" opacity="0.2" stroke-linecap="round"/>
      </g>
      <text x="100" y="155" text-anchor="middle" fill="#ff7300" opacity="0.2" font-size="8" font-family="JetBrains Mono">雲</text>
    </svg>`,

    // Kanji generic (for any remaining empty states)
    kanji: `<svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:160px;height:128px;">
      <g opacity="0.08">
        <circle cx="100" cy="75" r="55" fill="none" stroke="#ff7300" stroke-width="1.5" stroke-dasharray="6 4"/>
      </g>
      <text x="100" y="90" text-anchor="middle" fill="#ff7300" opacity="0.15" font-size="48" font-family="serif">忍</text>
      <text x="100" y="155" text-anchor="middle" fill="#ff7300" opacity="0.2" font-size="8" font-family="JetBrains Mono">empty</text>
    </svg>`,
  };

  /* ── Empty State Component ───────────────────────────────── */
  /**
   * Render a premium empty state.
   *
   * @param {Object} opts
   * @param {string}  opts.illustration  - Key from emptyStateIllustrations (kunai, scroll, shield, network, katana, radar, cloud, kanji)
   * @param {string}  opts.title         - Bold heading
   * @param {string}  opts.description   - Explanation text
   * @param {string}  opts.primaryLabel  - Primary action button text
   * @param {string}  opts.primaryAction - Function name or URL to call on click
   * @param {string}  [opts.secondaryLabel]  - Secondary action button text
   * @param {string}  [opts.secondaryAction] - Function name or URL for secondary action
   * @param {string}  [opts.size]        - 'sm' | 'md' (default md)
   * @returns {string} HTML string
   */
  // NOTE: renderEmptyState function has been consolidated in common.js to handle both
  // object-based and positional argument patterns. This prevents function duplication.
  // emptyState.js now focuses on illustration definitions and empty state utilities.

  /* ── Wire empty state action buttons ─────────────────────── */
  window.wireEmptyStateActions = function (container) {
    if (!container) return;
    container
      .querySelectorAll('.empty-state-primary, .empty-state-secondary')
      .forEach(function (btn) {
        btn.addEventListener('click', function () {
          const action = btn.getAttribute('data-action');
          if (!action) return;
          if (action.startsWith('tab:')) {
            const tab = action.replace('tab:', '');
            document.querySelectorAll(`.nav-item[data-tab="${tab}"]`).forEach(function (navBtn) {
              navBtn.click();
            });
          } else if (typeof window[action] === 'function') {
            window[action]();
          }
        });
      });
  };

  /* ── Pre-defined empty state configurations ──────────────── */
  window.emptyStatePresets = {
    projects: {
      illustration: 'cloud',
      title: 'No missions deployed',
      description: 'Create your first mission to begin autonomous engineering.',
      primaryLabel: 'Create Mission',
      primaryAction: 'showNewProjectWizard',
    },
    memory: {
      illustration: 'scroll',
      title: 'Memory vault is empty',
      description:
        'Accumulated knowledge from completed tasks will appear here as the swarm operates.',
      primaryLabel: 'Start a Mission',
      primaryAction: 'tab:swarm-graph',
    },
    workflow: {
      illustration: 'kanji',
      title: 'No active workflows',
      description: 'Define pipeline blueprints to orchestrate multi-stage jutsu sequences.',
      primaryLabel: 'Create Pipeline',
      primaryAction: 'showWorkflowWizard',
    },
    agentStudio: {
      illustration: 'network',
      title: 'Agent dojo is quiet',
      description: 'Custom agents will appear here as they are forged and deployed.',
      primaryLabel: 'Forge Agent',
      primaryAction: 'showAgentForgeModal',
    },
    repository: {
      illustration: 'katana',
      title: 'No repository connected',
      description: 'Connect a Git repository to explore code, commits, and branches.',
      primaryLabel: 'Connect Repo',
      primaryAction: 'showRepoConnectModal',
    },
    provenance: {
      illustration: 'shield',
      title: 'No provenance records',
      description: 'Audit trails will accumulate as agents execute tasks and make changes.',
      secondaryLabel: 'View Docs',
    },
    approvals: {
      illustration: 'kanji',
      title: 'No pending approvals',
      description: 'All governance requests have been resolved. New requests will appear here.',
      secondaryLabel: 'View History',
    },
    collaboration: {
      illustration: 'radar',
      title: 'No team activity yet',
      description: 'Real-time collaboration sessions will appear here when team members join.',
      primaryLabel: 'Start Session',
      primaryAction: 'tab:swarm-graph',
    },
    analytics: {
      illustration: 'network',
      title: 'Analytics awaiting data',
      description: 'Cost and quality metrics will populate as the swarm processes tasks.',
      secondaryLabel: 'View Dashboard',
    },
    ops: {
      illustration: 'cloud',
      title: 'No incidents recorded',
      description: 'System health events and incidents will be tracked here.',
      secondaryLabel: 'View Status',
    },
    testing: {
      illustration: 'kanji',
      title: 'Test suite not yet run',
      description: 'Run the test suite to see coverage, failures, and quality metrics.',
      primaryLabel: 'Run Tests',
      primaryAction: 'rerunAllTests',
    },
    security: {
      illustration: 'shield',
      title: 'Security scan not performed',
      description: 'Run a security scan to detect vulnerabilities, secrets, and dependency risks.',
      primaryLabel: 'Run Scan',
      primaryAction: 'runSecurityScan',
    },
    pullRequests: {
      illustration: 'katana',
      title: 'No pull requests',
      description: 'Pull requests created by agents will appear here for review.',
      secondaryLabel: 'View Branches',
    },
    debate: {
      illustration: 'kanji',
      title: 'No active debates',
      description:
        'Strategic debates between agents will appear here when they disagree on approach.',
      secondaryLabel: 'View Decrees',
    },
    intelligence: {
      illustration: 'network',
      title: 'Intelligence gathering idle',
      description: 'RAG indexes, vector embeddings, and knowledge graphs will populate here.',
      secondaryLabel: 'View Knowledge',
    },
    monitoring: {
      illustration: 'radar',
      title: 'Pulse monitor inactive',
      description: 'Real-time system health metrics will stream here once monitoring is active.',
      secondaryLabel: 'View Ops',
    },
    mcp: {
      illustration: 'cloud',
      title: 'No MCP servers registered',
      description: 'Model Context Protocol servers will appear here once connected.',
      primaryLabel: 'Register Server',
      primaryAction: 'showMCPRegisterModal',
    },
    notifications: {
      illustration: 'kanji',
      title: 'All caught up',
      description: 'No new notifications. Alerts and events will appear here as they occur.',
    },
  };
})();
