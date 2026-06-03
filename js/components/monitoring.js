/* ============================================================
   CoNinja Shadow Swarm — Pulse Monitor Component
   Real-time metrics, health dashboards, cost tracking
   ============================================================ */

(function () {
  'use strict';

  /* ── Time range selection ────────────────────────────────── */
  let _timeRange = '7d';

  /* ── Mock metrics data ───────────────────────────────────── */
  const METRICS_DATA = {
    '24h': {
      requests: {
        value: 12420,
        change: '+12%',
        spark: [40, 55, 48, 62, 58, 70, 65, 80, 75, 90, 85, 95],
      },
      errors: { value: 42, change: '-8%', rate: '0.34%' },
      latency: { value: '142ms', change: '-15ms', p95: '280ms', p99: '420ms' },
      cost: { value: '$1.24', change: '+$0.12', projected: '$1.50' },
      agents: { active: 6, tasks: 48, avgUptime: '99.2%' },
    },
    '7d': {
      requests: {
        value: 89450,
        change: '+18%',
        spark: [45, 52, 48, 60, 65, 72, 68, 75, 82, 78, 85, 90],
      },
      errors: { value: 312, change: '-5%', rate: '0.35%' },
      latency: { value: '148ms', change: '-8ms', p95: '295ms', p99: '450ms' },
      cost: { value: '$4.89', change: '+$0.82', projected: '$5.00' },
      agents: { active: 6, tasks: 342, avgUptime: '99.1%' },
    },
    '30d': {
      requests: {
        value: 385200,
        change: '+24%',
        spark: [38, 45, 52, 48, 55, 62, 58, 65, 72, 68, 75, 82],
      },
      errors: { value: 1420, change: '-12%', rate: '0.37%' },
      latency: { value: '152ms', change: '-18ms', p95: '310ms', p99: '480ms' },
      cost: { value: '$5.00', change: '+$0.42', projected: '$5.00' },
      agents: { active: 6, tasks: 1248, avgUptime: '99.1%' },
    },
  };

  /* ── Agent activity data (canonical names) ─────────────────── */
  const getAgentIcon = (id) => {
    const agent = window.state.agents[id];
    if (window.ninjaIcons && agent) return window.ninjaIcons.get(agent.icon || 'circle');
    return window.ninjaIcons ? window.ninjaIcons.get('circle') : '◈';
  };

  const AGENT_ACTIVITY = [
    {
      id: 'orchestrator',
      status: 'active',
      tasks: 148,
      success: 96,
      cost: '$0.12',
      lastActive: '2m ago',
    },
    { id: 'coder1', status: 'coding', tasks: 312, success: 94, cost: '$0.45', lastActive: 'Now' },
    {
      id: 'tester',
      status: 'thinking',
      tasks: 89,
      success: 99,
      cost: '$0.08',
      lastActive: '5m ago',
    },
    {
      id: 'security',
      status: 'idle',
      tasks: 45,
      success: 100,
      cost: '$0.03',
      lastActive: '1h ago',
    },
    {
      id: 'devops',
      status: 'watching',
      tasks: 201,
      success: 97,
      cost: '$0.16',
      lastActive: '12m ago',
    },
    {
      id: 'architect',
      status: 'idle',
      tasks: 67,
      success: 95,
      cost: '$0.05',
      lastActive: '2h ago',
    },
  ];

  /* ── Render monitoring dashboard ─────────────────────────── */
  function renderMonitoring() {
    const container = document.getElementById('monitoring-container');
    if (!container) return;

    const data = METRICS_DATA[_timeRange];
    const ic = (name) => (window.ninjaIcons ? window.ninjaIcons.get(name) : '◈');

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2 style="font-size:1.1rem; font-weight:700;">Pulse Monitor — Runtime Health</h2>
        <select class="form-select" id="monitoring-range-select" style="font-size:0.78rem; padding:4px 8px;">
          <option value="24h" ${_timeRange === '24h' ? 'selected' : ''}>Last 24 hours</option>
          <option value="7d" ${_timeRange === '7d' ? 'selected' : ''}>Last 7 days</option>
          <option value="30d" ${_timeRange === '30d' ? 'selected' : ''}>Last 30 days</option>
        </select>
      </div>

      <div class="monitoring-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:20px;">
        <div class="glass-card metric-tile">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px;">
            <div>
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Total Requests</div>
              <div style="font-size:1.6rem; font-weight:800; margin-top:4px;">${data.requests.value.toLocaleString()}</div>
            </div>
            <span style="font-size:1.4rem;">${ic('browser')}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge badge-success">${data.requests.change}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">vs previous ${_timeRange}</span>
          </div>
          <svg viewBox="0 0 120 30" style="width:100%; height:30px; margin-top:12px;">
            <polyline fill="none" stroke="#4CAF50" stroke-width="2" 
              points="${data.requests.spark.map((v, i) => `${i * 10},${30 - v / 4}`).join(' ')}"/>
          </svg>
        </div>

        <div class="glass-card metric-tile">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px;">
            <div>
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Error Rate</div>
              <div style="font-size:1.6rem; font-weight:800; margin-top:4px;">${data.errors.rate}</div>
            </div>
            <span style="font-size:1.4rem; color:var(--accent-error);">${ic('circle')}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge badge-success">${data.errors.change}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">${data.errors.value} errors</span>
          </div>
          <div style="margin-top:12px; height:6px; background:rgba(0,0,0,0.3); border-radius:3px; overflow:hidden;">
            <div style="width:${parseFloat(data.errors.rate) * 20}%; height:100%; background:#4CAF50; border-radius:3px;"></div>
          </div>
        </div>

        <div class="glass-card metric-tile">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px;">
            <div>
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Avg Latency</div>
              <div style="font-size:1.6rem; font-weight:800; margin-top:4px;">${data.latency.value}</div>
            </div>
            <span style="font-size:1.4rem;">${ic('clock')}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="badge badge-success">${data.latency.change}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">P95: ${data.latency.p95}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">P99: ${data.latency.p99}</span>
          </div>
          <div style="margin-top:12px; display:flex; gap:4px;">
            <div style="flex:1; height:4px; background:#4CAF50; border-radius:2px;"></div>
            <div style="flex:1; height:4px; background:#4CAF50; border-radius:2px;"></div>
            <div style="flex:1; height:4px; background:#4CAF50; border-radius:2px;"></div>
            <div style="flex:1; height:4px; background:#ff7300; border-radius:2px;"></div>
          </div>
        </div>

        <div class="glass-card metric-tile">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px;">
            <div>
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Swarm Cost</div>
              <div style="font-size:1.6rem; font-weight:800; margin-top:4px;">${data.cost.value}</div>
            </div>
            <span style="font-size:1.4rem;">${ic('diamond')}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge ${data.cost.change.startsWith('+') ? 'badge-warning' : 'badge-success'}">${data.cost.change}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">proj: ${data.cost.projected}</span>
          </div>
          <div style="margin-top:12px; display:flex; align-items:center; gap:8px;">
            <div style="flex:1; height:6px; background:rgba(0,0,0,0.3); border-radius:3px; overflow:hidden;">
              <div style="width:${(parseFloat(data.cost.value.replace('$', '')) / 5) * 100}%; height:100%; background:#ff7300; border-radius:3px;"></div>
            </div>
            <span style="font-size:0.7rem; color:var(--text-muted);">of $5</span>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:2fr 1fr; gap:16px;">
        <div class="glass-card">
          <div style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.2rem;">${ic('orchestrator')}</span>
              <div style="font-weight:700; font-size:0.95rem;">Agent Activity Monitor</div>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted);">
              ${data.agents.active} active • ${data.agents.tasks} tasks • ${data.agents.avgUptime} uptime
            </div>
          </div>
          <div style="padding:16px;">
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:12px;">
              ${AGENT_ACTIVITY.map((agent) => {
                const agentInfo = window.state.agents[agent.id];
                const name = agentInfo
                  ? agentInfo.name
                  : window.getAgentDisplayName
                    ? window.getAgentDisplayName(agent.id)
                    : agent.id;
                const statusDot =
                  agent.status === 'active' || agent.status === 'coding'
                    ? 'online'
                    : agent.status === 'thinking'
                      ? ''
                      : agent.status === 'idle'
                        ? ''
                        : 'offline';
                return `
                <div style="background:rgba(0,0,0,0.25); border-radius:10px; padding:14px; border:1px solid rgba(255,255,255,0.04); display:flex; align-items:center; gap:12px;">
                  <div style="font-size:2rem;">${getAgentIcon(agent.id)}</div>
                  <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                      <span style="font-weight:600; font-size:0.88rem;">${name}</span>
                      <span class="status-indicator-pulse ${statusDot}"></span>
                    </div>
                    <div style="display:flex; gap:12px; font-size:0.75rem; color:var(--text-muted);">
                      <span>${agent.tasks} tasks</span>
                      <span>${agent.success}% success</span>
                      <span style="color:#ff7300;">${agent.cost}</span>
                    </div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:0.75rem; color:var(--text-muted);">${agent.lastActive}</div>
                    <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">${agent.status}</div>
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="glass-card">
          <div style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="font-weight:700; font-size:0.95rem;">${ic('star')} Active Alerts</div>
          </div>
          <div style="padding:16px;">
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div style="display:flex; align-items:flex-start; gap:10px; padding:12px; background:rgba(255,115,0,0.08); border-radius:8px; border-left:3px solid #ff7300;">
                <span>${ic('star')}</span>
                <div style="flex:1;">
                  <div style="font-size:0.8rem; font-weight:600;">High Memory Usage</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">Kage Coder using 78% VRAM</div>
                </div>
                <span style="font-size:0.7rem; color:var(--text-muted);">2m</span>
              </div>
              <div style="display:flex; align-items:flex-start; gap:10px; padding:12px; background:rgba(76,175,80,0.08); border-radius:8px; border-left:3px solid #4CAF50;">
                <span>${ic('check')}</span>
                <div style="flex:1;">
                  <div style="font-size:0.8rem; font-weight:600;">Deployment Complete</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">Staging v1.2.3-rc.7 live</div>
                </div>
                <span style="font-size:0.7rem; color:var(--text-muted);">15m</span>
              </div>
              <div style="display:flex; align-items:flex-start; gap:10px; padding:12px; background:rgba(0,188,212,0.08); border-radius:8px; border-left:3px solid #00BCD4;">
                <span>${ic('info')}</span>
                <div style="flex:1;">
                  <div style="font-size:0.8rem; font-weight:600;">Model Swapped</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">Sensei switched to GPT-4o</div>
                </div>
                <span style="font-size:0.7rem; color:var(--text-muted);">1h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    attachListeners();
    injectStyles();
  }

  /* ── Attach event listeners ──────────────────────────────── */
  function attachListeners() {
    const rangeSelect = document.getElementById('monitoring-range-select');
    if (rangeSelect) {
      rangeSelect.addEventListener('change', (e) => {
        _timeRange = e.target.value;
        renderMonitoring();
      });
    }
  }

  /* ── Inject component styles ─────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('monitoring-styles')) return;
    const style = document.createElement('style');
    style.id = 'monitoring-styles';
    style.textContent = `
      .metric-tile { transition: transform 0.15s ease; }
      .metric-tile:hover { transform: translateY(-2px); }
    `;
    document.head.appendChild(style);
  }

  /* ── Expose to window ────────────────────────────────────── */
  window.renderMonitoring = renderMonitoring;
  window.initMonitoring = function () {
    renderMonitoring();
  };

  console.warn('%c[CoNinja] Pulse Monitor loaded', 'color:#ff7300;font-weight:bold;');
})();
