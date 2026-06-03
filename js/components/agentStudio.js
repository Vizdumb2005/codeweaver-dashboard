/* ============================================================
   CoNinja Shadow Swarm — Agent Studio Component
   Full agent management screen: grid, drawer, create modal
   ============================================================ */

(function () {
  'use strict';

  /* ── Internal state ──────────────────────────────────────── */
  let _filterRole = 'all';
  let _filterStatus = 'all';
  let _filterSearch = '';
  let _drawerAgent = null;

  /* ── Role → emoji mapping ────────────────────────────────── */
  const ROLE_ICONS = {
    orchestrator: '◈',
    coder: '◈',
    tester: '◈',
    security: '◈️',
    devops: '◈️',
    architect: '◈',
    documentation: '◈',
    performance: '◈',
    default: '◈',
  };

  /* ── Status color coding ─────────────────────────────────── */
  const STATUS_BADGE = {
    coding: { label: 'Coding', cls: 'badge-orange' },
    thinking: { label: 'Thinking', cls: 'badge-purple' },
    idle: { label: 'Idle', cls: 'badge-outline' },
    watching: { label: 'Watching', cls: 'badge' },
    sleeping: { label: 'Sleeping', cls: 'badge-outline' },
    active: { label: 'Active', cls: 'badge-success' },
    error: { label: 'Error', cls: 'badge-warning' },
  };

  /* ── Fallback mock agents (if state has none) ────────────── */
  const MOCK_AGENTS = [
    {
      id: 'agent-001',
      name: 'Ryū Orchestrator',
      role: 'orchestrator',
      status: 'active',
      icon: '◈',
      currentTask: 'Coordinating the shadow deployment jutsu',
      route: 'gpt-4o',
      cost: '$0.42',
      skills: ['planning', 'delegation', 'monitoring', 'optimization'],
      objective: 'Coordinate all agents to achieve the mission.',
      metrics: { tasksCompleted: 148, successRate: 96, avgResponseTime: '1.2s' },
      model: 'gpt-4o',
      temperature: 0.7,
      memoryScope: 'global',
      contextLimit: 128000,
      toolPermissions: { read_file: true, write_file: false, execute: false, web_search: true },
    },
    {
      id: 'agent-002',
      name: 'Kage Coder',
      role: 'coder',
      status: 'coding',
      icon: '◈',
      currentTask: 'Writing the auth middleware scroll',
      route: 'claude-3-5-sonnet',
      cost: '$1.18',
      skills: ['typescript', 'python', 'refactoring', 'unit-tests', 'api-design'],
      objective: 'Implement high-quality, maintainable code.',
      metrics: { tasksCompleted: 312, successRate: 94, avgResponseTime: '3.4s' },
      model: 'claude-3-5-sonnet',
      temperature: 0.4,
      memoryScope: 'project',
      contextLimit: 200000,
      toolPermissions: { read_file: true, write_file: true, execute: true, web_search: false },
    },
    {
      id: 'agent-003',
      name: 'Oni Tester',
      role: 'tester',
      status: 'thinking',
      icon: '◈',
      currentTask: 'Analyzing edge cases in payment flow',
      route: 'gemini-1.5-pro',
      cost: '$0.21',
      skills: ['e2e-testing', 'unit-testing', 'regression', 'load-testing'],
      objective: 'Ensure all scrolls are defect-free before deployment.',
      metrics: { tasksCompleted: 89, successRate: 99, avgResponseTime: '2.1s' },
      model: 'gemini-1.5-pro',
      temperature: 0.2,
      memoryScope: 'task-specific',
      contextLimit: 32000,
      toolPermissions: { read_file: true, write_file: false, execute: true, web_search: false },
    },
    {
      id: 'agent-004',
      name: 'Kunoichi Security',
      role: 'security',
      status: 'idle',
      icon: '◈️',
      currentTask: null,
      route: 'gpt-4o',
      cost: '$0.08',
      skills: ['vuln-scanning', 'pentest', 'owasp', 'dependency-audit'],
      objective: 'Guard the dojo from all malicious scrolls.',
      metrics: { tasksCompleted: 45, successRate: 100, avgResponseTime: '4.7s' },
      model: 'gpt-4o',
      temperature: 0.1,
      memoryScope: 'global',
      contextLimit: 128000,
      toolPermissions: { read_file: true, write_file: false, execute: true, web_search: true },
    },
    {
      id: 'agent-005',
      name: 'Tsuchi DevOps',
      role: 'devops',
      status: 'watching',
      icon: '◈️',
      currentTask: 'Monitoring pipeline heartbeat',
      route: 'claude-3-haiku',
      cost: '$0.03',
      skills: ['ci-cd', 'docker', 'k8s', 'terraform', 'monitoring'],
      objective: 'Keep the shadow pipeline flowing without interruption.',
      metrics: { tasksCompleted: 201, successRate: 97, avgResponseTime: '0.9s' },
      model: 'claude-3-haiku',
      temperature: 0.3,
      memoryScope: 'project',
      contextLimit: 200000,
      toolPermissions: { read_file: true, write_file: true, execute: true, web_search: true },
    },
    {
      id: 'agent-006',
      name: 'Hana Architect',
      role: 'architect',
      status: 'idle',
      icon: '◈',
      currentTask: null,
      route: 'gpt-4o',
      cost: '$0.55',
      skills: ['system-design', 'ddd', 'microservices', 'db-schema'],
      objective: 'Design scalable, elegant dojo blueprints.',
      metrics: { tasksCompleted: 37, successRate: 95, avgResponseTime: '5.2s' },
      model: 'gpt-4o',
      temperature: 0.6,
      memoryScope: 'global',
      contextLimit: 128000,
      toolPermissions: { read_file: true, write_file: false, execute: false, web_search: true },
    },
  ];

  /* ── Helpers ─────────────────────────────────────────────── */
  function toNumberCost(value) {
    if (typeof value === 'number' && isFinite(value)) return value;
    if (typeof value === 'string') {
      const n = parseFloat(value.replace(/[^0-9.]/g, ''));
      return isNaN(n) ? 0 : n;
    }
    return 0;
  }

  function formatCost(value) {
    return `$${toNumberCost(value).toFixed(2)}`;
  }

  function getAgents() {
    const s = window.state;
    if (s && s.agents && Array.isArray(s.agents.list) && s.agents.list.length) return s.agents.list;
    if (s && s.agents && typeof s.agents === 'object' && !Array.isArray(s.agents)) {
      const vals = Object.values(s.agents);
      if (vals.length) return vals;
    }
    return MOCK_AGENTS;
  }

  function getStats(agents) {
    const totalCost = agents.reduce((sum, a) => sum + toNumberCost(a.cost), 0);
    return {
      total: agents.length,
      active: agents.filter((a) => ['active', 'coding', 'thinking', 'watching'].includes(a.status))
        .length,
      idle: agents.filter((a) => ['idle', 'sleeping'].includes(a.status)).length,
      cost: formatCost(totalCost),
    };
  }

  function filteredAgents() {
    return getAgents().filter((a) => {
      const roleOk = _filterRole === 'all' || (a.role || '').toLowerCase() === _filterRole;
      const statusOk = _filterStatus === 'all' || (a.status || '').toLowerCase() === _filterStatus;
      const q = _filterSearch.toLowerCase();
      const searchOk =
        !q || (a.name || '').toLowerCase().includes(q) || (a.role || '').toLowerCase().includes(q);
      return roleOk && statusOk && searchOk;
    });
  }

  function buildStatCards(stats) {
    const cards = [
      { label: 'Total Agents', value: stats.total, icon: '◈', color: 'var(--accent-orange)' },
      { label: 'Active Now', value: stats.active, icon: '◈', color: 'var(--accent-green)' },
      { label: 'Idle Shinobi', value: stats.idle, icon: '◈', color: 'var(--accent-cyan)' },
      { label: 'Total Cost', value: stats.cost, icon: '◈', color: 'var(--accent-purple)' },
    ];
    return `
      <div class="as-stat-bar">
        ${cards
          .map(
            (c) => `
          <div class="as-stat-card glass-card">
            <div class="as-stat-icon" style="color:${c.color};">${c.icon}</div>
            <div class="as-stat-value" style="color:${c.color};">${c.value}</div>
            <div class="as-stat-label">${c.label}</div>
          </div>`,
          )
          .join('')}
      </div>`;
  }

  function buildFilterRow() {
    return `
      <div class="as-filter-row glass-card">
        <select id="as-role-filter" class="form-select" aria-label="Filter by role">
          <option value="all">All Roles</option>
          <option value="orchestrator">◈ Orchestrator</option>
          <option value="coder">◈ Coder</option>
          <option value="tester">◈ Tester</option>
          <option value="security">◈️ Security</option>
          <option value="devops">◈️ DevOps</option>
          <option value="architect">◈ Architect</option>
          <option value="documentation">◈ Documentation</option>
          <option value="performance">◈ Performance</option>
        </select>
        <select id="as-status-filter" class="form-select" aria-label="Filter by status">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="coding">Coding</option>
          <option value="thinking">Thinking</option>
          <option value="watching">Watching</option>
          <option value="idle">Idle</option>
          <option value="sleeping">Sleeping</option>
        </select>
        <input id="as-search-input" type="text" class="form-input" placeholder="◈ Search shinobi…" value="${_filterSearch}" aria-label="Search agents" style="flex:1;min-width:160px;" />
        <button id="agent-studio-create-btn" class="btn btn-primary">
          <span>+ Deploy Agent</span>
        </button>
      </div>`;
  }

  function buildSkillPills(skills, max) {
    max = max || 3;
    if (!Array.isArray(skills) || !skills.length)
      return '<span style="color:var(--text-muted);font-size:0.78rem;">No jutsu</span>';
    const shown = skills.slice(0, max);
    const rest = skills.length - shown.length;
    const pills = shown.map((s) => `<span class="as-skill-pill">${s}</span>`).join('');
    const more = rest > 0 ? `<span class="as-skill-pill as-skill-more">+${rest}</span>` : '';
    return pills + more;
  }

  function getAgentIcon(agent) {
    if (window.ninjaIcons) {
      return window.ninjaIcons.get(agent.icon || agent.role || 'circle');
    }
    return agent.icon || ROLE_ICONS[(agent.role || '').toLowerCase()] || ROLE_ICONS.default || '◈';
  }

  function buildAgentCard(agent) {
    const statusMeta = STATUS_BADGE[agent.status] || { label: agent.status, cls: 'badge-outline' };
    const isActive = ['active', 'coding', 'thinking', 'watching'].includes(agent.status);
    const icon = getAgentIcon(agent);
    const task =
      agent.currentTask || '<span style="color:var(--text-muted)">No active scroll</span>';
    const costLabel = formatCost(agent.cost);

    return `
      <div class="as-agent-card glass-card" data-agent-id="${agent.id}" tabindex="0" role="article" aria-label="Agent ${agent.name}">
        <div class="as-card-header">
          <div class="as-agent-icon-wrap${isActive ? ' as-icon-active' : ''}">
            <span class="as-agent-icon">${icon}</span>
            ${isActive ? '<span class="as-pulse-ring"></span>' : ''}
          </div>
          <div class="as-agent-meta">
            <div class="as-agent-name">${agent.name}</div>
            <div class="as-agent-role">${(agent.role || '').charAt(0).toUpperCase() + (agent.role || '').slice(1)}</div>
          </div>
          <span class="badge ${statusMeta.cls} as-status-badge">${statusMeta.label}</span>
        </div>
        <div class="as-card-task">
          <span class="as-task-label">◈ Current:</span>
          <span class="as-task-value">${task}</span>
        </div>
        <div class="as-card-meta-row">
          <span class="as-meta-item">◈ ${agent.route || agent.model || 'Unknown'}</span>
          <span class="as-meta-item as-cost">${costLabel}</span>
        </div>
        <div class="as-card-skills">${buildSkillPills(agent.skills, 3)}</div>
        <div class="as-card-actions">
          <button class="btn btn-sm btn-outline as-btn-view" data-agent-id="${agent.id}" title="Details">${window.ninjaIcons ? window.ninjaIcons.get('info') : '◈'} Details</button>
          <button class="btn btn-sm btn-outline as-btn-clone" data-agent-id="${agent.id}" title="Clone">${window.ninjaIcons ? window.ninjaIcons.get('star') : '◈'} Clone</button>
          <button class="btn btn-sm btn-outline as-btn-edit" data-agent-id="${agent.id}" title="Configure">${window.ninjaIcons ? window.ninjaIcons.get('gear') : '◈'}</button>
          <button class="btn btn-sm as-btn-delete" data-agent-id="${agent.id}" style="color:var(--accent-error);border-color:rgba(239,68,68,0.3);" title="Dissolve">${window.ninjaIcons ? window.ninjaIcons.get('close') : '◈'}</button>
        </div>
      </div>`;
  }

  function buildAgentGrid() {
    const agents = filteredAgents();
    if (!agents.length) {
      return `<div id="as-agent-grid" class="as-agent-grid">${
        window.renderEmptyState
          ? window.renderEmptyState({
              illustration: 'network',
              title: 'No shinobi found',
              description: 'Adjust your filters or deploy a new agent to the dojo.',
              primaryLabel: 'Deploy Agent',
              primaryAction: 'showCreateModal',
            })
          : '<p style="color:var(--text-muted);text-align:center;padding:40px;">No agents found.</p>'
      }</div>`;
    }
    return `<div id="as-agent-grid" class="as-agent-grid">${agents.map(buildAgentCard).join('')}</div>`;
  }

  function renderAgentStudioLoading(container) {
    if (!container) return;
    if (window.renderEmptyState) {
      container.innerHTML = window.renderEmptyState({
        illustration: 'network',
        title: 'Loading Agent Studio',
        description: 'Preparing the agent registry and telemetry feeds.',
      });
    } else {
      container.innerHTML =
        '<div style="padding:40px;text-align:center;color:var(--text-muted);">Loading Agent Studio…</div>';
    }
  }

  /* ── Agent Detail Drawer ─────────────────────────────────── */
  function buildDrawer(agent) {
    if (!agent) return '';
    const tools = agent.toolPermissions || {};
    const toolList = ['read_file', 'write_file', 'execute', 'web_search'];
    return `
      <div id="as-drawer" class="as-drawer glass-card" role="complementary" aria-label="Agent Details">
        <div class="as-drawer-header">
          <div class="as-drawer-title">
            <span class="as-drawer-icon">${getAgentIcon(agent)}</span>
            <div>
              <div class="as-drawer-name">${agent.name}</div>
              <div class="as-drawer-role">${(agent.role || '').charAt(0).toUpperCase() + (agent.role || '').slice(1)}</div>
            </div>
          </div>
          <button id="as-drawer-close" class="btn btn-sm btn-outline" aria-label="Close drawer">◈</button>
        </div>

        <div class="as-drawer-section">
          <div class="as-drawer-label">Objective</div>
          <p class="as-drawer-objective">${agent.objective || 'No objective defined.'}</p>
        </div>

        <div class="as-drawer-section">
          <div class="as-drawer-label">◈ Performance Metrics</div>
          <div class="as-metrics-grid">
            <div class="as-metric-card">
              <div class="as-metric-val">${(agent.metrics || {}).tasksCompleted || 0}</div>
              <div class="as-metric-key">Scrolls Completed</div>
            </div>
            <div class="as-metric-card">
              <div class="as-metric-val">${(agent.metrics || {}).successRate || 0}%</div>
              <div class="as-metric-key">Success Rate</div>
            </div>
            <div class="as-metric-card">
              <div class="as-metric-val">${(agent.metrics || {}).avgResponseTime || '—'}</div>
              <div class="as-metric-key">Avg Response</div>
            </div>
          </div>
        </div>

        <div class="as-drawer-section">
          <label class="as-drawer-label" for="as-drawer-model">◈ Model Assignment</label>
          <select id="as-drawer-model" class="form-select" data-agent-id="${agent.id}">
            ${[
              'gpt-4o',
              'gpt-4-turbo',
              'claude-3-5-sonnet',
              'claude-3-haiku',
              'gemini-1.5-pro',
              'gemini-flash',
            ]
              .map(
                (m) => `<option value="${m}" ${agent.model === m ? 'selected' : ''}>${m}</option>`,
              )
              .join('')}
          </select>
        </div>

        <div class="as-drawer-section">
          <label class="as-drawer-label" for="as-drawer-temp">◈️ Temperature: <span id="as-temp-display">${(agent.temperature || 0.7).toFixed(1)}</span></label>
          <input type="range" id="as-drawer-temp" class="slider" min="0" max="1.5" step="0.1"
            value="${agent.temperature || 0.7}" data-agent-id="${agent.id}" />
        </div>

        <div class="as-drawer-section">
          <div class="as-drawer-label">◈ Jutsu (Skills)</div>
          <div class="as-drawer-skills">
            ${(agent.skills || []).map((s) => `<span class="as-skill-pill">${s}</span>`).join('') || '<span style="color:var(--text-muted)">None</span>'}
          </div>
        </div>

        <div class="as-drawer-section">
          <label class="as-drawer-label" for="as-drawer-memory">◈ Memory Scope</label>
          <select id="as-drawer-memory" class="form-select" data-agent-id="${agent.id}">
            ${['global', 'project', 'task-specific']
              .map(
                (m) =>
                  `<option value="${m}" ${agent.memoryScope === m ? 'selected' : ''}>${m.charAt(0).toUpperCase() + m.slice(1)}</option>`,
              )
              .join('')}
          </select>
        </div>

        <div class="as-drawer-section">
          <div class="as-drawer-label">◈ Tool Permissions</div>
          <div class="as-tool-perms">
            ${toolList
              .map(
                (t) => `
              <label class="as-perm-row">
                <input type="checkbox" class="as-perm-check" data-agent-id="${agent.id}" data-tool="${t}"
                  ${tools[t] ? 'checked' : ''} />
                <span class="as-perm-label">${t.replace(/_/g, ' ')}</span>
              </label>`,
              )
              .join('')}
          </div>
        </div>

        <div class="as-drawer-section">
          <label class="as-drawer-label" for="as-drawer-ctx">◈ Context Limit (tokens)</label>
          <input type="number" id="as-drawer-ctx" class="form-input" value="${agent.contextLimit || 128000}"
            min="4000" max="2000000" step="1000" data-agent-id="${agent.id}" />
        </div>

        <div class="as-drawer-actions">
          <button id="as-drawer-save" class="btn btn-primary" data-agent-id="${agent.id}">◈ Save Changes</button>
        </div>
      </div>`;
  }

  function showDrawer(agent) {
    _drawerAgent = agent;
    const existing = document.getElementById('as-drawer');
    if (existing) existing.parentNode.removeChild(existing);

    const container = document.getElementById('agent-studio-container');
    if (!container) return;

    container.insertAdjacentHTML('beforeend', buildDrawer(agent));
    requestAnimationFrame(() => {
      const drawer = document.getElementById('as-drawer');
      if (drawer) drawer.classList.add('as-drawer-open');
    });
    wireDrawer();
  }

  function closeDrawer() {
    const drawer = document.getElementById('as-drawer');
    if (!drawer) return;
    drawer.classList.remove('as-drawer-open');
    setTimeout(() => {
      if (drawer.parentNode) drawer.parentNode.removeChild(drawer);
    }, 340);
    _drawerAgent = null;
  }

  function wireDrawer() {
    const closeBtn = document.getElementById('as-drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    const temp = document.getElementById('as-drawer-temp');
    const tempDisp = document.getElementById('as-temp-display');
    if (temp && tempDisp) {
      temp.addEventListener('input', () => {
        tempDisp.textContent = parseFloat(temp.value).toFixed(1);
      });
    }

    const saveBtn = document.getElementById('as-drawer-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (typeof window.showToast === 'function')
          window.showToast('◈ Agent configuration sealed in the scroll', 'success');
        if (typeof window.dispatch === 'function') {
          const agentId = saveBtn.dataset.agentId;
          const model = (document.getElementById('as-drawer-model') || {}).value;
          const tempV = parseFloat((document.getElementById('as-drawer-temp') || {}).value || 0.7);
          const memV = (document.getElementById('as-drawer-memory') || {}).value;
          const ctxV = parseInt((document.getElementById('as-drawer-ctx') || {}).value || 128000);
          window.dispatch('UPDATE_AGENT', {
            id: agentId,
            model,
            temperature: tempV,
            memoryScope: memV,
            contextLimit: ctxV,
          });
        }
      });
    }
  }

  /* ── Create Agent Modal ──────────────────────────────────── */
  const EMOJI_OPTS = ['◈', '◈', '◈', '◈', '◈️', '◈️', '◈', '◈', '◈', '◈'];

  function showCreateModal() {
    if (document.getElementById('as-create-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'as-create-modal-overlay';
    overlay.innerHTML = `
      <div class="cns-confirm-backdrop" id="as-modal-backdrop"></div>
      <div class="as-create-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="as-modal-title">
        <div class="as-modal-header">
          <h2 id="as-modal-title">◈️ Deploy New Shinobi</h2>
          <button id="as-modal-close" class="btn btn-sm btn-outline" aria-label="Close">◈</button>
        </div>
        <div class="as-modal-body">
          <div class="as-modal-field">
            <label class="as-drawer-label" for="as-new-name">Agent Name</label>
            <input id="as-new-name" type="text" class="form-input" placeholder="e.g. Shadow Coder Kai" />
          </div>
          <div class="as-modal-field">
            <label class="as-drawer-label" for="as-new-role">Role</label>
            <select id="as-new-role" class="form-select">
              <option value="coder">◈ Coder</option>
              <option value="tester">◈ Tester</option>
              <option value="orchestrator">◈ Orchestrator</option>
              <option value="security">◈️ Security</option>
              <option value="devops">◈️ DevOps</option>
              <option value="architect">◈ Architect</option>
              <option value="documentation">◈ Documentation</option>
              <option value="performance">◈ Performance</option>
            </select>
          </div>
          <div class="as-modal-field">
            <label class="as-drawer-label">Icon</label>
            <div class="as-emoji-picker" id="as-emoji-picker">
              ${EMOJI_OPTS.map(
                (e, i) => `
                <button class="as-emoji-opt${i === 0 ? ' selected' : ''}" data-emoji="${e}"
                  type="button" aria-label="${e}" aria-pressed="${i === 0}">${e}</button>`,
              ).join('')}
            </div>
          </div>
          <div class="as-modal-field">
            <label class="as-drawer-label" for="as-new-model">Model</label>
            <select id="as-new-model" class="form-select">
              ${['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro', 'claude-3-haiku', 'gemini-flash']
                .map((m) => `<option value="${m}">${m}</option>`)
                .join('')}
            </select>
          </div>
          <div class="as-modal-field">
            <label class="as-drawer-label" for="as-new-objective">Objective</label>
            <textarea id="as-new-objective" class="form-input" rows="3" placeholder="Describe the shinobi's mission…"></textarea>
          </div>
          <div class="as-modal-field">
            <label class="as-drawer-label" for="as-new-skills">Jutsu / Skills (comma-separated)</label>
            <input id="as-new-skills" type="text" class="form-input" placeholder="e.g. typescript, testing, refactoring" />
          </div>
        </div>
        <div class="as-modal-footer">
          <button id="as-modal-cancel" class="btn btn-outline">Cancel</button>
          <button id="as-modal-submit" class="btn btn-primary">◈️ Deploy Agent</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('cns-confirm-visible'));

    const close = () => {
      overlay.classList.remove('cns-confirm-visible');
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 280);
    };

    const backdrop = overlay.querySelector('#as-modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', close);
    const closeBtn = overlay.querySelector('#as-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', close);
    const cancelBtn = overlay.querySelector('#as-modal-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', close);

    /* Emoji picker */
    const pickerEl = overlay.querySelector('#as-emoji-picker');
    if (pickerEl) {
      pickerEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.as-emoji-opt');
        if (!btn) return;
        pickerEl.querySelectorAll('.as-emoji-opt').forEach((b) => {
          b.classList.remove('selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
      });
    }

    const submitBtn = overlay.querySelector('#as-modal-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const name = (overlay.querySelector('#as-new-name') || {}).value || '';
        const role = (overlay.querySelector('#as-new-role') || {}).value || 'coder';
        const model = (overlay.querySelector('#as-new-model') || {}).value || 'gpt-4o';
        const objective = (overlay.querySelector('#as-new-objective') || {}).value || '';
        const skillsRaw = (overlay.querySelector('#as-new-skills') || {}).value || '';
        const iconBtn = overlay.querySelector('.as-emoji-opt.selected');
        const icon = iconBtn ? iconBtn.dataset.emoji : '◈';

        if (!name.trim()) {
          if (typeof window.showToast === 'function')
            window.showToast('Agent name is required', 'warning');
          return;
        }

        const newAgent = {
          id: `agent-${Date.now()}`,
          name: name.trim(),
          role,
          model,
          icon,
          objective: objective.trim(),
          skills: skillsRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          status: 'idle',
          cost: '$0.00',
          currentTask: null,
          temperature: 0.7,
          memoryScope: 'project',
          contextLimit: 128000,
          toolPermissions: {
            read_file: true,
            write_file: false,
            execute: false,
            web_search: false,
          },
          metrics: { tasksCompleted: 0, successRate: 100, avgResponseTime: '—' },
        };

        if (
          typeof window.api !== 'undefined' &&
          window.api.agents &&
          typeof window.api.agents.create === 'function'
        ) {
          window.api.agents.create(newAgent);
        } else if (typeof window.dispatch === 'function') {
          window.dispatch('CREATE_AGENT', newAgent);
        }

        if (typeof window.showToast === 'function')
          window.showToast(`◈ ${name} deployed to the dojo!`, 'success');
        if (typeof window.addLog === 'function')
          window.addLog(`Agent "${name}" deployed`, 'success');

        close();
        window.renderAgentStudio();
      });
    }
  }

  /* ── Main Render ─────────────────────────────────────────── */
  window.renderAgentStudio = function () {
    const container = document.getElementById('agent-studio-container');
    if (!container) {
      console.warn('[CoNinja] #agent-studio-container not found');
      return;
    }

    const loading =
      window.state &&
      (window.state.agentsLoading || (window.state.agents && window.state.agents.loading));
    if (!window.state || loading) {
      renderAgentStudioLoading(container);
      return;
    }

    const agents = getAgents();
    if (!agents || !agents.length) {
      if (
        window.renderEmptyState &&
        window.emptyStatePresets &&
        window.emptyStatePresets.agentStudio
      ) {
        container.innerHTML = window.renderEmptyState(window.emptyStatePresets.agentStudio);
        if (typeof window.wireEmptyStateActions === 'function')
          window.wireEmptyStateActions(container);
      } else {
        container.innerHTML =
          '<div style="padding:40px;text-align:center;color:var(--text-muted);">No agents available.</div>';
      }
      return;
    }

    const stats = getStats(agents);

    container.innerHTML = `
      <div class="as-wrapper">
        <div class="as-content">
          ${buildStatCards(stats)}
          
          <!-- VRAM Shift Queue & Lifecycle visualizer -->
          <div class="glass-card VRAM-shift-card" style="margin-bottom: 16px; padding: 18px; border: 1px solid rgba(255, 115, 0, 0.2);">
            <div style="font-weight: 600; font-size: 0.9rem; color: var(--accent-orange); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
              <span>◈ VRAM Shift Queue &amp; Hardware Orchestrator</span>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">Max capacity: 6.0 GB VRAM</span>
            </div>

            <!-- VRAM segregation display -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
              <div style="background: rgba(46, 125, 50, 0.05); border: 1px solid rgba(76, 175, 80, 0.2); border-radius: 8px; padding: 12px;">
                <div style="font-size: 0.75rem; font-weight: 700; color: #4CAF50; text-transform: uppercase; margin-bottom: 8px;">◈ Loaded in VRAM (Active)</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;" id="vram-active-agents">
                  ${
                    agents
                      .filter((a) =>
                        ['active', 'coding', 'thinking', 'watching'].includes(a.status),
                      )
                      .map(
                        (a) => `
                    <span class="badge badge-success" style="font-size:0.7rem; font-family: var(--font-mono);">${a.name} (Q8_0: ~1.8GB)</span>
                  `,
                      )
                      .join('') ||
                    '<span style="color:var(--text-muted); font-size:0.7rem;">None loaded</span>'
                  }
                </div>
              </div>
              
              <div style="background: rgba(255, 115, 0, 0.05); border: 1px solid rgba(255, 115, 0, 0.15); border-radius: 8px; padding: 12px;">
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-orange); text-transform: uppercase; margin-bottom: 8px;">◈ Swap Space (Sleeping)</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;" id="vram-swapped-agents">
                  ${
                    agents
                      .filter((a) => ['sleeping', 'idle'].includes(a.status))
                      .map(
                        (a) => `
                    <span class="badge badge-outline" style="font-size:0.7rem; font-family: var(--font-mono); color: var(--text-secondary); border-color: rgba(255,255,255,0.08);">${a.name} (Q4_K_M: ~0.9GB)</span>
                  `,
                      )
                      .join('') ||
                    '<span style="color:var(--text-muted); font-size:0.7rem;">None swapped</span>'
                  }
                </div>
              </div>
            </div>

            <!-- Gantt Chart -->
            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;">
              <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px;">Model Load Lifecycle &amp; Swap Timeline</div>
              <div style="display: flex; flex-direction: row; gap: 8px; overflow-x: auto; padding-bottom: 6px;">
                <div style="flex: 1; min-width: 140px; background: rgba(76,175,80,0.1); border-left: 3px solid #4CAF50; padding: 8px; border-radius: 4px;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: #4CAF50;">Q8_0 Execution Phase</div>
                  <div style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 4px;">0s - 15s (1.8GB VRAM)</div>
                </div>
                <div style="flex: 1; min-width: 140px; background: rgba(255,115,0,0.1); border-left: 3px solid var(--accent-orange); padding: 8px; border-radius: 4px;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-orange);">Swap Out &amp; Quantize</div>
                  <div style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 4px;">15s - 18s (Compressing)</div>
                </div>
                <div style="flex: 1; min-width: 140px; background: rgba(255,179,0,0.1); border-left: 3px solid #FFB300; padding: 8px; border-radius: 4px;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: #FFB300;">Q4_K_M Disk Swap</div>
                  <div style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 4px;">18s - 30s (0.9GB Disk RAM)</div>
                </div>
              </div>
            </div>
          </div>

          ${buildFilterRow()}
          ${buildAgentGrid()}
      </div>`;

    /* Restore filter values */

    const roleF = container.querySelector('#as-role-filter');
    if (roleF) roleF.value = _filterRole;
    const statF = container.querySelector('#as-status-filter');
    if (statF) statF.value = _filterStatus;

    window.initAgentStudio();
  };

  /* ── Event Wiring ────────────────────────────────────────── */
  window.initAgentStudio = function () {
    const container = document.getElementById('agent-studio-container');
    if (!container) return;

    /* Filters */
    const roleF = container.querySelector('#as-role-filter');
    if (roleF)
      roleF.addEventListener('change', () => {
        _filterRole = roleF.value;
        _refreshGrid();
      });

    const statF = container.querySelector('#as-status-filter');
    if (statF)
      statF.addEventListener('change', () => {
        _filterStatus = statF.value;
        _refreshGrid();
      });

    const searchF = container.querySelector('#as-search-input');
    if (searchF) {
      let debounce;
      searchF.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          _filterSearch = searchF.value;
          _refreshGrid();
        }, 250);
      });
    }

    /* Create button */
    const createBtn = container.querySelector('#agent-studio-create-btn');
    if (createBtn) createBtn.addEventListener('click', showCreateModal);

    /* Agent grid delegated events */
    const grid = container.querySelector('#as-agent-grid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.as-btn-view');
        const cloneBtn = e.target.closest('.as-btn-clone');
        const editBtn = e.target.closest('.as-btn-edit');
        const deleteBtn = e.target.closest('.as-btn-delete');

        if (viewBtn) {
          const id = viewBtn.dataset.agentId;
          const a = getAgents().find((x) => x.id === id);
          if (a) showDrawer(a);
          return;
        }
        if (cloneBtn) {
          const id = cloneBtn.dataset.agentId;
          const a = getAgents().find((x) => x.id === id);
          if (a && typeof window.showToast === 'function')
            window.showToast(
              `${String.fromCharCode(9672)} ${a.name} clone deployed to the dojo`,
              'success',
            );
          if (a && typeof window.dispatch === 'function')
            window.dispatch('CLONE_AGENT', { sourceId: id });
          return;
        }
        if (editBtn) {
          const id = editBtn.dataset.agentId;
          const a = getAgents().find((x) => x.id === id);
          if (a) showDrawer(a);
          return;
        }
        if (deleteBtn) {
          const id = deleteBtn.dataset.agentId;
          const a = getAgents().find((x) => x.id === id);
          if (!a) return;
          if (typeof window.showConfirmDialog === 'function') {
            window.showConfirmDialog(
              'Delete Agent',
              `Permanently dissolve ${a.name} from the shadow swarm? This jutsu cannot be reversed.`,
              () => {
                if (typeof window.dispatch === 'function') window.dispatch('DELETE_AGENT', { id });
                if (typeof window.showToast === 'function')
                  window.showToast(`◈️ ${a.name} has been dissolved`, 'warning');
                if (typeof window.addLog === 'function')
                  window.addLog(`Agent "${a.name}" deleted`, 'warn');
                window.renderAgentStudio();
              },
              true,
            );
          }
        }
      });
    }
  };

  function _refreshGrid() {
    const grid = document.getElementById('as-agent-grid');
    if (!grid) {
      window.renderAgentStudio();
      return;
    }
    const agents = filteredAgents();
    if (!agents.length) {
      grid.innerHTML = window.renderEmptyState
        ? window.renderEmptyState('◈', 'No Matches', 'Try adjusting your filters, Sensei.')
        : '<p style="color:var(--text-muted);text-align:center;padding:40px;">No agents match your filters.</p>';
    } else {
      grid.innerHTML = agents.map(buildAgentCard).join('');
    }
    window.initAgentStudio();
  }

  /* ── Inject Styles ───────────────────────────────────────── */
  if (!document.getElementById('cns-agent-studio-styles')) {
    const style = document.createElement('style');
    style.id = 'cns-agent-studio-styles';
    style.textContent = `
      .as-wrapper { display: flex; flex-direction: column; gap: 18px; padding: 4px 6px 20px 0; height: 100%; overflow-y: auto; }
      .as-heading { font-size: 1.4rem; font-weight: 800; margin: 0; background: linear-gradient(135deg, var(--accent-orange), var(--accent-cyan)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

      /* Stat Bar */
      .as-stat-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
      @media (max-width: 900px) { .as-stat-bar { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 520px) { .as-stat-bar { grid-template-columns: 1fr; } }
      .as-stat-card { padding: 18px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; border-radius: var(--radius-lg); }
      .as-stat-icon { font-size: 1.6rem; margin-bottom: 4px; }
      .as-stat-value { font-size: 1.8rem; font-weight: 800; line-height: 1; }
      .as-stat-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; }

      /* Filter Row */
      .as-filter-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; padding: 14px 18px; border-radius: var(--radius-lg); }

      /* Agent Grid */
      .as-agent-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      @media (max-width: 1100px) { .as-agent-grid { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 700px)  { .as-agent-grid { grid-template-columns: 1fr; } }

      /* Agent Card */
      .as-agent-card { border-radius: var(--radius-lg); padding: 12px 14px; display: flex; flex-direction: column; justify-content: space-between; height: 210px; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
      .as-agent-card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(255,115,0,0.12); border-color: rgba(255,115,0,0.35); }
      .as-card-header { display: flex; align-items: center; gap: 8px; }
      .as-agent-icon-wrap { position: relative; width: 36px; height: 36px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
      .as-agent-icon { font-size: 1.2rem; line-height: 1; position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; }
      .as-agent-icon svg { width: 20px; height: 20px; stroke: currentColor; fill: none; }
      .as-pulse-ring {
        position: absolute; inset: -3px; border-radius: 50%;
        border: 1.5px solid var(--accent-orange);
        animation: as-pulse-ring 2s ease-out infinite;
        opacity: 0.7;
      }
      @keyframes as-pulse-ring {
        0%   { transform: scale(0.85); opacity: 0.8; }
        70%  { transform: scale(1.2); opacity: 0; }
        100% { transform: scale(0.85); opacity: 0; }
      }
      .as-agent-meta { flex: 1; min-width: 0; }
      .as-agent-name { font-weight: 700; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .as-agent-role { font-size: 0.72rem; color: var(--text-muted); margin-top: 1px; }
      .as-status-badge { flex-shrink: 0; font-size: 0.65rem; padding: 2px 6px; }

      .as-card-task { font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 4px; align-items: flex-start; line-height: 1.35; margin-bottom: 2px; }
      .as-task-label { flex-shrink: 0; font-weight: 600; }
      .as-task-value { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }

      .as-card-meta-row { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); }
      .as-cost { color: var(--accent-orange); font-weight: 600; }

      .as-card-skills { display: flex; flex-wrap: wrap; gap: 4px; overflow: hidden; height: 22px; }
      .as-skill-pill { background: rgba(255,115,0,0.1); border: 1px solid rgba(255,115,0,0.2); color: var(--accent-orange); border-radius: 100px; padding: 1px 8px; font-size: 0.68rem; font-weight: 500; }
      .as-skill-more { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: var(--text-muted); }

      .as-card-actions { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px; }
      .as-card-actions .btn { padding: 3px 6px; font-size: 0.65rem; border-radius: 4px; }

      /* Drawer */
      .as-drawer {
        position: fixed; top: 0; right: 0; bottom: 0;
        width: 380px; max-width: 95vw;
        border-radius: 0; border-right: none;
        border-top-left-radius: 20px; border-bottom-left-radius: 20px;
        z-index: 8000; overflow-y: auto;
        padding: 24px;
        transform: translateX(100%);
        transition: transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94);
        display: flex; flex-direction: column; gap: 20px;
        border: 1px solid rgba(255,115,0,0.2);
        box-shadow: -12px 0 48px rgba(0,0,0,0.4);
      }
      .as-drawer.as-drawer-open { transform: translateX(0); }
      .as-drawer-header { display: flex; align-items: center; justify-content: space-between; }
      .as-drawer-title { display: flex; align-items: center; gap: 12px; }
      .as-drawer-icon { font-size: 2rem; }
      .as-drawer-name { font-weight: 700; font-size: 1.05rem; }
      .as-drawer-role { font-size: 0.8rem; color: var(--text-muted); }
      .as-drawer-section { display: flex; flex-direction: column; gap: 10px; padding-top: 12px; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06)); }
      .as-drawer-label { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
      .as-drawer-objective { font-size: 0.86rem; color: var(--text-muted); line-height: 1.5; margin: 0; }
      .as-metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .as-metric-card { background: rgba(255,115,0,0.07); border: 1px solid rgba(255,115,0,0.15); border-radius: var(--radius-md); padding: 12px 8px; text-align: center; }
      .as-metric-val { font-size: 1.2rem; font-weight: 800; color: var(--accent-orange); }
      .as-metric-key { font-size: 0.68rem; color: var(--text-muted); margin-top: 4px; }
      .as-drawer-skills { display: flex; flex-wrap: wrap; gap: 6px; }
      .as-tool-perms { display: flex; flex-direction: column; gap: 8px; }
      .as-perm-row { display: flex; align-items: center; gap: 10px; cursor: pointer; }
      .as-perm-check { width: 16px; height: 16px; accent-color: var(--accent-orange); cursor: pointer; }
      .as-perm-label { font-size: 0.85rem; }
      .as-drawer-actions { padding-top: 12px; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06)); }

      /* Create Modal */
      .as-create-modal {
        position: relative; z-index: 1; width: min(520px, 92vw);
        border-radius: 20px; padding: 28px 28px 24px;
        border: 1px solid rgba(255,115,0,0.25);
        box-shadow: 0 24px 64px rgba(0,0,0,0.5);
        max-height: 88vh; overflow-y: auto;
      }
      .as-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
      .as-modal-header h2 { font-size: 1.1rem; font-weight: 700; margin: 0; }
      .as-modal-body { display: flex; flex-direction: column; gap: 16px; }
      .as-modal-field { display: flex; flex-direction: column; gap: 6px; }
      .as-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 20px; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06)); margin-top: 8px; }
      .as-emoji-picker { display: flex; flex-wrap: wrap; gap: 8px; }
      .as-emoji-opt {
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
        border-radius: var(--radius-md); padding: 8px 10px; font-size: 1.4rem; cursor: pointer;
        transition: all 0.15s ease;
      }
      .as-emoji-opt:hover { background: rgba(255,115,0,0.15); border-color: rgba(255,115,0,0.4); }
      .as-emoji-opt.selected { background: rgba(255,115,0,0.2); border-color: var(--accent-orange); box-shadow: 0 0 0 2px rgba(255,115,0,0.3); }
    `;
    document.head.appendChild(style);
  }

  console.warn('%c[CoNinja] Agent Studio loaded ◈', 'color:#ff7300;font-weight:bold;');
})();
