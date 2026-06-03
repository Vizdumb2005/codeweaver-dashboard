/* ============================================================
   CoNinja Shadow Swarm — Cost & Quality Analytics Dashboard
   Cost breakdown, quality trends, MTTR, delivery metrics, custom dashboards
   ============================================================ */

(function () {
  'use strict';

  // Fallback defaults for new stats
  if (!window.state.analytics.costByModel) {
    window.state.analytics.costByModel = [
      { name: 'Ollama: Llama-3.1-8B', cost: 5.42, requests: 189 },
      { name: 'Gemini 3.5 Flash', cost: 12.35, requests: 243 },
      { name: 'Ollama: Mistral-7B', cost: 2.12, requests: 94 },
      { name: 'Gemini 1.5 Pro', cost: 4.91, requests: 46 },
    ];
  }

  if (!window.state.analytics.costByProject) {
    window.state.analytics.costByProject = [
      { name: 'TaskMaster Marketplace', cost: 18.23, tasks: 8 },
      { name: 'Geodesic GPS Tracker', cost: 5.45, tasks: 4 },
      { name: 'Auth Microservice', cost: 1.12, tasks: 1 },
    ];
  }

  if (!window.state.analytics.deliveryMetrics) {
    window.state.analytics.deliveryMetrics = {
      cycleTime: '4.2 hrs',
      leadTime: '16.5 hrs',
      throughput: '14 PRs/wk',
      deployFrequency: '3.8 deploys/day',
    };
  }

  window.renderAnalytics = function () {
    const container = document.getElementById('analytics-container');
    if (!container) return;

    const {
      costByAgent,
      costByTask,
      qualityTrends,
      mttr,
      customDashboards,
      costByModel,
      costByProject,
      deliveryMetrics,
    } = window.state.analytics;
    const selectedRange = window.state.analyticsRange || '7d';
    const costTab = window.state.analyticsCostTab || 'agent';

    // Scale values based on range
    let scaleFactor = 1.0;
    if (selectedRange === '30d') scaleFactor = 4.2;
    if (selectedRange === '90d') scaleFactor = 12.8;

    container.innerHTML = `
      <div class="analytics-layout">
        <div class="analytics-controls-header">
          <div class="analytics-controls">
            <select class="form-select text-xs" id="analytics-range" style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); color:var(--text-primary); border-radius:6px; padding:6px 12px; cursor:pointer;">
              <option value="7d" ${selectedRange === '7d' ? 'selected' : ''}>Last 7 days</option>
              <option value="30d" ${selectedRange === '30d' ? 'selected' : ''}>Last 30 days</option>
              <option value="90d" ${selectedRange === '90d' ? 'selected' : ''}>Last 90 days</option>
            </select>
            <button class="btn btn-outline" id="btn-export-analytics">◈ Export JSON</button>
          </div>
          <div class="analytics-timestamp" id="analytics-timestamp">
            <span class="timestamp-icon">◷</span>
            <span class="timestamp-text">Updated ${new Date().toLocaleTimeString()}</span>
            <button class="btn btn-outline" id="btn-refresh-analytics" title="Refresh data">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          </div>
        </div>

        <div class="analytics-grid">
          <!-- Cost Breakdown Card with Tab Selector -->
          <div class="analytics-card wide">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
              <h3 style="margin:0;">Swarm Cost Analysis</h3>
              <div class="sub-tab-bar" style="display:flex; gap:8px;">
                <button class="btn btn-xs ${costTab === 'agent' ? 'btn-primary' : 'btn-outline'}" id="cost-tab-agent">By Agent</button>
                <button class="btn btn-xs ${costTab === 'model' ? 'btn-primary' : 'btn-outline'}" id="cost-tab-model">By Model</button>
                <button class="btn btn-xs ${costTab === 'project' ? 'btn-primary' : 'btn-outline'}" id="cost-tab-project">By Project</button>
              </div>
            </div>
            
            <div class="cost-chart">
              ${costTab === 'agent' ? renderCostByAgent(costByAgent, scaleFactor) : ''}
              ${costTab === 'model' ? renderCostByModel(costByModel, scaleFactor) : ''}
              ${costTab === 'project' ? renderCostByProject(costByProject, scaleFactor) : ''}
            </div>
          </div>

          <div class="analytics-card">
            <h3>Cost by Task</h3>
            <div class="task-cost-list">
              ${costByTask
                .map((t) => {
                  const scaledCost = t.cost * scaleFactor;
                  return `
                  <div class="task-cost-item">
                    <div class="task-name">${t.task}</div>
                    <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:4px;">
                      <span class="task-cost">$${scaledCost.toFixed(2)}</span>
                      <span class="task-duration">${t.duration}</span>
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>

          <!-- Quality Metrics Panel -->
          <div class="analytics-card wide">
            <h3>Quality Trends</h3>
            <div class="trends-chart">
              <div class="trend-legend">
                <span class="legend-item"><span class="dot test"></span>Test Pass %</span>
                <span class="legend-item"><span class="dot coverage"></span>Coverage %</span>
                <span class="legend-item"><span class="dot bugs"></span>Bugs Found</span>
              </div>
              <div class="trend-bars">
                ${qualityTrends
                  .map(
                    (t) => `
                  <div class="trend-day">
                    <div class="day-bars">
                      <div class="bar test" style="height: ${t.testPassRate}%" title="Pass Rate: ${t.testPassRate}%"></div>
                      <div class="bar coverage" style="height: ${t.coverage}%" title="Coverage: ${t.coverage}%"></div>
                      <div class="bar bugs" style="height: ${t.bugs * 12}%" title="Bugs: ${t.bugs}"></div>
                    </div>
                    <div class="day-label">${t.date.slice(5)}</div>
                  </div>
                `,
                  )
                  .join('')}
              </div>
            </div>
          </div>

          <!-- Reliability & Defect Escape Indicators -->
          <div class="analytics-card">
            <h3>Quality & Reliability Indices</h3>
            <div class="reliability-metrics" style="display:flex; flex-direction:column; gap:12px;">
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div class="metric-large">
                  <span class="metric-value">${mttr.avg}m</span>
                  <span class="metric-label">Avg MTTR</span>
                </div>
                <div class="metric-large">
                  <span class="metric-value" style="color:#4CAF50;">0</span>
                  <span class="metric-label">Escaped Defects</span>
                </div>
              </div>
              
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top:10px;">
                <div style="text-align:center;">
                  <span class="metric-value" style="font-size:1.25rem;">67.4%</span>
                  <span class="metric-label">Mutation Score</span>
                </div>
                <div style="text-align:center; border-left:1px solid rgba(255,255,255,0.05);">
                  <span class="metric-value" style="font-size:1.25rem; color:var(--accent-orange);">1</span>
                  <span class="metric-label">Regressions Caught</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Delivery Analytics Widget -->
          <div class="analytics-card">
            <h3>Delivery Velocity Metrics</h3>
            <div class="delivery-metrics-list" style="display:flex; flex-direction:column; gap:8px; font-size:0.8rem; margin-top:10px;">
              <div style="display:flex; justify-content:space-between; padding:8px; background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid rgba(255,255,255,0.04);">
                <span>Mean Cycle Time:</span>
                <strong style="color:var(--accent-cyan);">${deliveryMetrics.cycleTime}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; padding:8px; background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid rgba(255,255,255,0.04);">
                <span>Lead Time to Prod:</span>
                <strong style="color:var(--accent-cyan);">${deliveryMetrics.leadTime}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; padding:8px; background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid rgba(255,255,255,0.04);">
                <span>Throughput Rate:</span>
                <strong style="color:var(--accent-orange);">${deliveryMetrics.throughput}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; padding:8px; background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid rgba(255,255,255,0.04);">
                <span>Deployment Frequency:</span>
                <strong style="color:var(--accent-orange);">${deliveryMetrics.deployFrequency}</strong>
              </div>
            </div>
          </div>

          <div class="analytics-card">
            <h3>Custom KPI Dashboard</h3>
            <div class="custom-dashboards-list" style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px; max-height: 160px; overflow-y: auto;">
              ${
                customDashboards.length === 0
                  ? `
                <p style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:12px; background:rgba(0,0,0,0.1); border-radius:6px;">No custom KPI widgets compiled.</p>
              `
                  : customDashboards
                      .map(
                        (d) => `
                <div class="custom-kpi-item" style="padding:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; position:relative;">
                  <button class="btn-delete-kpi" data-id="${d.id}" style="position:absolute; right:8px; top:8px; background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:0.75rem;">◈</button>
                  <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">${d.name}</span>
                  <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:4px;">
                    <strong style="font-size:1.25rem; color:var(--accent-orange);">${d.value}</strong>
                    <span style="font-size:0.68rem; color:var(--accent-cyan); font-family:var(--font-mono);">${d.target}</span>
                  </div>
                </div>
              `,
                      )
                      .join('')
              }
            </div>
            <button class="btn btn-outline btn-sm" id="btn-forge-kpi" style="width:100%;">+ Forge Custom Card</button>
          </div>
        </div>
      </div>
    `;

    attachListeners();
    injectStyles();
  };

  function renderCostByAgent(costByAgent, scaleFactor) {
    return costByAgent
      .map((a) => {
        const scaledCost = a.cost * scaleFactor;
        const scaledTokens = Math.round(a.tokens * scaleFactor);
        const scaledRequests = Math.round(a.requests * scaleFactor);
        const maxScaled = 15 * scaleFactor;
        return `
        <div class="cost-bar-item">
          <div class="cost-bar-label">
            <span style="font-weight:600;">${a.agent}</span>
            <strong style="color:var(--accent-orange);">$${scaledCost.toFixed(2)}</strong>
          </div>
          <div class="cost-bar-track">
            <div class="cost-bar-fill" style="width: ${Math.min((scaledCost / maxScaled) * 100, 100)}%"></div>
          </div>
          <div class="cost-bar-meta">
            <span>${scaledTokens.toLocaleString()} tokens</span>
            <span>${scaledRequests} requests</span>
          </div>
        </div>
      `;
      })
      .join('');
  }

  function renderCostByModel(costByModel, scaleFactor) {
    return costByModel
      .map((m) => {
        const scaledCost = m.cost * scaleFactor;
        const scaledRequests = Math.round(m.requests * scaleFactor);
        const maxScaled = 15 * scaleFactor;
        return `
        <div class="cost-bar-item">
          <div class="cost-bar-label">
            <span style="font-weight:600; font-family:var(--font-mono); font-size:0.75rem;">${m.name}</span>
            <strong style="color:var(--accent-orange);">$${scaledCost.toFixed(2)}</strong>
          </div>
          <div class="cost-bar-track">
            <div class="cost-bar-fill" style="width: ${Math.min((scaledCost / maxScaled) * 100, 100)}%; background:var(--accent-cyan);"></div>
          </div>
          <div class="cost-bar-meta">
            <span>${scaledRequests} model calls</span>
          </div>
        </div>
      `;
      })
      .join('');
  }

  function renderCostByProject(costByProject, scaleFactor) {
    return costByProject
      .map((p) => {
        const scaledCost = p.cost * scaleFactor;
        const maxScaled = 25 * scaleFactor;
        return `
        <div class="cost-bar-item">
          <div class="cost-bar-label">
            <span style="font-weight:600;">${p.name}</span>
            <strong style="color:var(--accent-orange);">$${scaledCost.toFixed(2)}</strong>
          </div>
          <div class="cost-bar-track">
            <div class="cost-bar-fill" style="width: ${Math.min((scaledCost / maxScaled) * 100, 100)}%; background:var(--accent-cyan);"></div>
          </div>
          <div class="cost-bar-meta">
            <span>${p.tasks} active tasks</span>
          </div>
        </div>
      `;
      })
      .join('');
  }

  function attachListeners() {
    // Guard against duplicate listener attachment
    if (window._analyticsListenersWired) return;
    window._analyticsListenersWired = true;

    // Range switcher
    const rangeSelect = document.getElementById('analytics-range');
    if (rangeSelect) {
      rangeSelect.addEventListener('change', () => {
        window.state.analyticsRange = rangeSelect.value;
        window.renderAnalytics();
        window.showToast(`Analytics range shifted to ${rangeSelect.value}`, 'success');
      });
    }

    // Cost Breakdown Tabs
    const tabAgent = document.getElementById('cost-tab-agent');
    const tabModel = document.getElementById('cost-tab-model');
    const tabProj = document.getElementById('cost-tab-project');

    if (tabAgent && tabModel && tabProj) {
      tabAgent.addEventListener('click', () => {
        window.state.analyticsCostTab = 'agent';
        window.renderAnalytics();
      });
      tabModel.addEventListener('click', () => {
        window.state.analyticsCostTab = 'model';
        window.renderAnalytics();
      });
      tabProj.addEventListener('click', () => {
        window.state.analyticsCostTab = 'project';
        window.renderAnalytics();
      });
    }

    // Export JSON to clipboard
    const exportBtn = document.getElementById('btn-export-analytics');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const telemetryData = {
          project: window.state.project.name,
          range: window.state.analyticsRange || '7d',
          metrics: window.state.analytics,
          status: 'stable',
          timestamp: new Date().toISOString(),
        };

        navigator.clipboard.writeText(JSON.stringify(telemetryData, null, 2)).then(() => {
          window.showToast('Telemetry statistics copied to clipboard!', 'success');

          window.dispatch('ADD_LOG', {
            agent: 'system',
            type: 'info',
            msg: 'Telemetry JSON metrics report compiled and extracted.',
          });
        });
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('btn-refresh-analytics');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        const timestampEl = document.querySelector('.timestamp-text');
        if (timestampEl) {
          timestampEl.innerText = `Updated ${new Date().toLocaleTimeString()}`;
        }
        window.showToast('Analytics data refreshed', 'success');
      });
    }

    // Custom KPI Forge
    const forgeBtn = document.getElementById('btn-forge-kpi');
    if (forgeBtn) {
      forgeBtn.addEventListener('click', () => {
        window.showConfirmDialog(
          'Forge Custom KPI Telemetry',
          `<div style="text-align:left; display:flex; flex-direction:column; gap:8px;">
            <div>
              <label style="font-size:0.75rem; color:var(--text-muted);">KPI Name:</label>
              <input type="text" id="kpi-input-name" class="form-input text-xs" placeholder="e.g. Token Efficiency" style="width:100%; margin-top:4px;" required>
            </div>
            <div>
              <label style="font-size:0.75rem; color:var(--text-muted);">Current Value:</label>
              <input type="text" id="kpi-input-val" class="form-input text-xs" placeholder="e.g. 94.2%" style="width:100%; margin-top:4px;" required>
            </div>
            <div>
              <label style="font-size:0.75rem; color:var(--text-muted);">Target Threshold:</label>
              <input type="text" id="kpi-input-tgt" class="form-input text-xs" placeholder="e.g. > 90%" style="width:100%; margin-top:4px;">
            </div>
          </div>`,
          () => {
            const name = document.getElementById('kpi-input-name').value.trim();
            const val = document.getElementById('kpi-input-val').value.trim();
            const tgt = document.getElementById('kpi-input-tgt').value.trim() || 'N/A';

            if (name && val) {
              window.state.analytics.customDashboards.push({
                id: `kpi-${Date.now()}`,
                name,
                value: val,
                target: tgt,
              });

              window.dispatch('ADD_LOG', {
                agent: 'system',
                type: 'success',
                msg: `Forged custom KPI telemetry widget: "${name}" [${val}].`,
              });

              window.renderAnalytics();
              window.showToast(`KPI "${name}" added`, 'success');
            }
          },
        );
      });
    }

    // KPI delete
    document.querySelectorAll('.btn-delete-kpi').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        window.state.analytics.customDashboards = window.state.analytics.customDashboards.filter(
          (c) => c.id !== id,
        );
        window.renderAnalytics();
        window.showToast('KPI card deleted', 'warning');
      });
    });
  }

  function injectStyles() {
    if (document.getElementById('analytics-styles-extended')) return;
    const style = document.createElement('style');
    style.id = 'analytics-styles-extended';
    style.textContent = `
      .analytics-layout { display: flex; flex-direction: column; gap: 24px; }
      .analytics-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .analytics-controls { display: flex; gap: 12px; align-items: center; }
      #btn-refresh-analytics { width: 28px; height: 28px; padding: 0; min-width: 28px; border-radius: 6px; }
      
      .analytics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
      .analytics-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: var(--radius-lg); padding: 20px; }
      .analytics-card.wide { grid-column: span 2; }
      @media(max-width: 768px) { .analytics-card.wide { grid-column: span 1; } }
      .analytics-card h3 { margin: 0 0 16px 0; font-size: 0.95rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
      
      .cost-chart { display: flex; flex-direction: column; gap: 14px; }
      .cost-bar-item { display: flex; flex-direction: column; gap: 4px; }
      .cost-bar-label { display: flex; justify-content: space-between; font-size: 0.82rem; }
      .cost-bar-track { height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
      .cost-bar-fill { height: 100%; background: var(--accent-orange); border-radius: 4px; transition: width 0.3s ease; }
      .cost-bar-meta { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); }
      
      .task-cost-list { display: flex; flex-direction: column; gap: 10px; max-height: 240px; overflow-y: auto; }
      .task-cost-item { padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; }
      .task-name { font-size: 0.8rem; color: var(--text-secondary); font-weight: 500; }
      .task-cost { font-weight: 700; color: var(--accent-orange); font-size: 0.9rem; }
      .task-duration { font-size: 0.72rem; color: var(--text-muted); }
      
      .trends-chart { display: flex; flex-direction: column; gap: 16px; }
      .trend-legend { display: flex; gap: 16px; }
      .legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-secondary); }\n      .legend-item .dot { width: 8px; height: 8px; border-radius: 50%; }
      .dot.test { background: var(--accent-orange); }
      .dot.coverage { background: var(--accent-cyan); }
      .dot.bugs { background: var(--accent-warning, #ff9800); }
      
      .trend-bars { display: flex; justify-content: space-between; height: 160px; align-items: flex-end; padding-top: 10px; }
      .trend-day { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; }
      .day-bars { display: flex; gap: 4px; height: 120px; align-items: flex-end; width: 100%; justify-content: center; }
      .day-bars .bar { width: 8px; border-radius: 4px 4px 0 0; transition: height 0.3s; cursor: pointer; }
      .bar.test { background: var(--accent-orange); }
      .bar.coverage { background: var(--accent-cyan); }
      .bar.bugs { background: var(--accent-warning, #ff9800); }
      .day-label { font-size: 0.65rem; color: var(--text-secondary); }
      
      .reliability-metrics { padding: 10px 0; }
      .metric-large { text-align: center; margin-bottom: 16px; }
      .metric-large:last-child { margin-bottom: 0; }
      .metric-value { display: block; font-size: 2rem; font-weight: 700; color: var(--accent-orange); font-family: var(--font-mono); }
      .metric-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px; }
      .metric-trend { font-size: 0.72rem; font-weight: 600; }
      .metric-trend.improving { color: #4CAF50; }
      .metric-trend.worsening { color: #ef4444; }
      
      .deployment-stats { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
      .stat-row { display: flex; align-items: center; gap: 12px; font-size: 0.8rem; }
      .stat-row span:first-child { width: 80px; color: var(--text-muted); }
      .success-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
      .success-bar .fill { height: 100%; background: #4CAF50; border-radius: 3px; }
    `;
    document.head.appendChild(style);
  }

  window.initAnalytics = function () {
    window.renderAnalytics();
  };

  console.warn('%c[CoNinja] Telemetry Analytics loaded ◈', 'color:#ff7300;font-weight:bold;');
})();
