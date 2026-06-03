/* ============================================================
   CoNinja Shadow Swarm — Deployment Gate Component
   Release management, environment promotion, rollback controls
   ============================================================ */

(function () {
  'use strict';

  /* ── Internal state ──────────────────────────────────────── */
  let _selectedEnv = 'staging';
  let _deployInProgress = false;

  // Initialize pipeline stages target state
  if (!window.state.workflow) window.state.workflow = {};
  if (!window.state.workflow.stages) {
    window.state.workflow.stages = [
      { id: 'lint', name: 'Lint', status: 'completed', size: '1.2 KB' },
      { id: 'unit_tests', name: 'Unit Tests', status: 'completed', size: '24.5 KB' },
      { id: 'build', name: 'Build', status: 'active', size: '1.8 MB' },
      { id: 'e2e', name: 'E2E (Oni Tester)', status: 'pending', size: '—' },
      { id: 'staging', name: 'Staging', status: 'pending', size: '—' },
    ];
  }

  /* ── Environment configs ─────────────────────────────────── */
  const getEnvIcon = (key) => {
    const icons = { dev: 'codeFile', staging: 'star', production: 'lock' };
    return window.ninjaIcons ? window.ninjaIcons.get(icons[key] || 'diamond') : '◈';
  };

  const ENVIRONMENTS = {
    dev: {
      name: 'Development Dojo',
      icon: 'codeFile',
      color: '#6b7280',
      url: 'https://dev.taskmaster.internal',
      status: 'healthy',
      version: 'v1.2.3-dev.42',
      deployedAt: '2026-05-29 08:23:00',
      commit: 'a3f7d2e',
    },
    staging: {
      name: 'Shadow Staging',
      icon: 'star',
      color: '#ff7300',
      url: 'https://staging.taskmaster.app',
      status: 'healthy',
      version: 'v1.2.3-rc.7',
      deployedAt: '2026-05-28 14:15:00',
      commit: 'b8e9c4a',
    },
    production: {
      name: 'Production Temple',
      icon: 'lock',
      color: '#4CAF50',
      url: 'https://taskmaster.app',
      status: 'healthy',
      version: 'v1.2.2',
      deployedAt: '2026-05-25 09:00:00',
      commit: 'c1d5f8e',
    },
  };

  /* ── Deploy history ──────────────────────────────────────── */
  const DEPLOY_HISTORY = [
    {
      id: 'deploy-001',
      env: 'dev',
      version: 'v1.2.3-dev.42',
      commit: 'a3f7d2e',
      status: 'success',
      author: 'Chunin DevOps',
      started: '08:20:00',
      duration: '3m 12s',
    },
    {
      id: 'deploy-002',
      env: 'staging',
      version: 'v1.2.3-rc.7',
      commit: 'b8e9c4a',
      status: 'success',
      author: 'Sensei',
      started: '14:10:00',
      duration: '4m 45s',
    },
    {
      id: 'deploy-003',
      env: 'production',
      version: 'v1.2.2',
      commit: 'c1d5f8e',
      status: 'success',
      author: 'Chunin DevOps',
      started: '08:55:00',
      duration: '5m 20s',
    },
    {
      id: 'deploy-004',
      env: 'staging',
      version: 'v1.2.3-rc.6',
      commit: 'd2e5a7b',
      status: 'rolled-back',
      author: 'Chunin DevOps',
      started: '2026-05-27 16:30:00',
      duration: '2m 15s → Rolled back',
    },
    {
      id: 'deploy-005',
      env: 'dev',
      version: 'v1.2.3-dev.41',
      commit: 'f4c8e1d',
      status: 'success',
      author: 'Chunin DevOps',
      started: '2026-05-27 10:15:00',
      duration: '2m 48s',
    },
  ];

  /* ── Render deployment dashboard ─────────────────────────── */
  function renderDeployment() {
    const container = document.getElementById('deployment-container');
    if (!container) return;

    const ic = (name) => (window.ninjaIcons ? window.ninjaIcons.get(name) : '◈');

    container.innerHTML = `
      <div class="deployment-layout" style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:20px;">
        ${Object.entries(ENVIRONMENTS)
          .map(
            ([key, env]) => `
          <div class="glass-card env-card ${key === _selectedEnv ? 'active' : ''}" 
               data-env="${key}"
               style="cursor:pointer; border:${key === _selectedEnv ? `2px solid ${env.color}` : '1px solid rgba(255,255,255,0.06)'}; transition:all 0.2s ease;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.8rem;">${getEnvIcon(key)}</span>
                <div>
                  <div style="font-weight:700; font-size:0.95rem;">${env.name}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${env.url}</div>
                </div>
              </div>
              <span class="status-indicator-pulse ${env.status === 'healthy' ? 'online' : 'offline'}"></span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:8px; font-size:0.78rem;">
              <div style="background:rgba(0,0,0,0.3); padding:8px 10px; border-radius:6px;">
                <div style="color:var(--text-muted); margin-bottom:2px;">Version</div>
                <div style="font-weight:600; color:${env.color};">${env.version}</div>
              </div>
              <div style="background:rgba(0,0,0,0.3); padding:8px 10px; border-radius:6px;">
                <div style="color:var(--text-muted); margin-bottom:2px;">Commit</div>
                <div style="font-family:var(--font-mono); font-weight:600;">${env.commit}</div>
              </div>
            </div>
            <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06); font-size:0.75rem; color:var(--text-muted);">
              Deployed: ${env.deployedAt}
            </div>
          </div>
        `,
          )
          .join('')}
      </div>

      <div class="glass-card" style="margin-bottom:20px;">
        <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.3rem;">${ic('refresh')}</span>
            <div>
              <div style="font-weight:700; font-size:0.95rem;">Release Pipeline</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Promote builds through environments</div>
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-outline btn-sm" id="deploy-refresh-btn">${ic('refresh')} Refresh</button>
            ${getPromoteButton()}
          </div>
        </div>
        <div style="padding:20px;">
          <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
            ${['dev', 'staging', 'production']
              .map(
                (env, idx, arr) => `
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                  <div style="width:48px; height:48px; border-radius:50%; background:${env === _selectedEnv ? 'rgba(255,115,0,0.2)' : 'rgba(0,0,0,0.3)'}; 
                              border:2px solid ${env === _selectedEnv ? '#ff7300' : ENVIRONMENTS[env].color}; 
                              display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
                    ${getEnvIcon(env)}
                  </div>
                  <div style="font-size:0.75rem; font-weight:600; color:${env === _selectedEnv ? '#ff7300' : 'var(--text-secondary)'};">${ENVIRONMENTS[env].name}</div>
                </div>
                ${
                  idx < arr.length - 1
                    ? `
                  <div style="display:flex; align-items:center; color:var(--text-muted);">
                    <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                      <path d="M0 6h28M24 2l4 4-4 4" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                  </div>
                `
                    : ''
                }
              </div>
            `,
              )
              .join('')}
          </div>
          
          <div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:20px; border:1px solid rgba(255,115,0,0.1); position: relative; overflow: hidden;">
            <div style="font-weight:600; font-size:0.85rem; margin-bottom:16px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              ${window.ninjaIcons ? window.ninjaIcons.get('circle') : ''} Directed Acyclic Graph (DAG) Pipeline
            </div>
            
            <div class="dag-pipeline-wrapper" style="display: flex; align-items: center; justify-content: space-between; position: relative; padding: 10px 0; overflow-x: auto; gap: 12px;">
              <div style="position: absolute; top: 50%; left: 0; right: 0; height: 2px; background: rgba(255,115,0,0.15); z-index: 1;"></div>
              
              ${window.state.workflow.stages
                .map((stage) => {
                  let statusColor = 'var(--text-secondary)';
                  let nodeBorder = 'rgba(255,115,0,0.15)';
                  let nodeBg = 'rgba(0,0,0,0.4)';
                  let nodeClass = '';

                  if (stage.status === 'completed') {
                    statusColor = '#4CAF50';
                    nodeBorder = '#4CAF50';
                  } else if (stage.status === 'active') {
                    statusColor = 'var(--accent-orange)';
                    nodeBorder = 'var(--accent-orange)';
                    nodeBg = 'rgba(255,115,0,0.1)';
                    nodeClass = 'dag-node-active';
                  }

                  return `
                  <div class="dag-node ${nodeClass}" 
                       data-stage-id="${stage.id}"
                       style="position: relative; z-index: 2; cursor: pointer; background: ${nodeBg}; border: 2px solid ${nodeBorder}; border-radius: 20px; padding: 8px 16px; text-align: center; transition: all 0.25s ease;">
                    <div style="font-size: 0.78rem; font-weight: 600; color: ${statusColor};">${stage.name}</div>
                    <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px; text-transform: uppercase;">${stage.status}</div>
                  </div>
                `;
                })
                .join('')}
            </div>

            <div id="dag-detail-drawer" style="max-height: 0; overflow: hidden; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); background: rgba(255, 115, 0, 0.03); border-radius: 6px; margin-top: 16px; border: 0px solid rgba(255,115,0,0.1);"></div>
          </div>
        </div>
      </div>

      <div class="glass-card">
        <div style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="font-weight:700; font-size:0.95rem;">${ic('diamond')} Deployment Scrolls (History)</div>
        </div>
        <div style="overflow-x:auto;">
          <table class="provider-table" style="width:100%;">
            <thead>
              <tr>
                <th>Environment</th>
                <th>Version</th>
                <th>Commit</th>
                <th>Status</th>
                <th>Initiated By</th>
                <th>Started</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${DEPLOY_HISTORY.map(
                (deploy) => `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span>${getEnvIcon(deploy.env)}</span>
                      <span style="font-size:0.8rem;">${ENVIRONMENTS[deploy.env].name}</span>
                    </div>
                  </td>
                  <td style="font-family:var(--font-mono); font-size:0.78rem;">${deploy.version}</td>
                  <td style="font-family:var(--font-mono); font-size:0.78rem; color:var(--accent-cyan);">${deploy.commit}</td>
                  <td>
                    <span class="badge ${deploy.status === 'success' ? 'badge-success' : deploy.status === 'rolled-back' ? 'badge-warning' : 'badge-outline'}">
                      ${deploy.status === 'success' ? `${ic('check')} Success` : deploy.status === 'rolled-back' ? `${ic('revert')} Rolled Back` : deploy.status}
                    </span>
                  </td>
                  <td style="font-size:0.8rem;">${deploy.author}</td>
                  <td style="font-size:0.78rem; color:var(--text-muted);">${deploy.started}</td>
                  <td style="font-size:0.78rem; color:var(--text-muted);">${deploy.duration}</td>
                  <td>
                    ${
                      deploy.status === 'success'
                        ? `
                      <button class="btn btn-outline btn-sm" style="padding:2px 8px; font-size:0.7rem; color:#ef4444; border-color:rgba(239,68,68,0.3);" onclick="window.showToast('Rollback initiated for ${deploy.version}', 'warning')">${ic('revert')} Rollback</button>
                    `
                        : '-'
                    }
                  </td>
                </tr>
              `,
              ).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    attachListeners();
    injectStyles();
  }

  /* ── Get promote button with appropriate styling ────────────── */
  function getPromoteButton() {
    const ic = (name) => (window.ninjaIcons ? window.ninjaIcons.get(name) : '◈');
    if (_deployInProgress) {
      return `<button class="btn btn-outline btn-sm" disabled>${ic('clock')} Deploying...</button>`;
    }

    // Different styling based on target environment (audit #054)
    if (_selectedEnv === 'staging') {
      // Promote to Production - use danger/red styling
      return `<button class="btn btn-danger btn-sm" id="deploy-promote-btn">
        ${ic('lock')} Promote to Production
      </button>`;
    } else if (_selectedEnv === 'dev') {
      // Promote to Staging - standard primary
      return `<button class="btn btn-primary btn-sm" id="deploy-promote-btn">
        ${ic('star')} Promote to Staging
      </button>`;
    } else {
      // Redeploy current env - standard primary
      return `<button class="btn btn-primary btn-sm" id="deploy-promote-btn">
        ${ic('refresh')} Redeploy
      </button>`;
    }
  }

  /* ── Attach event listeners ──────────────────────────────── */
  function attachListeners() {
    document.querySelectorAll('.env-card').forEach((card) => {
      card.addEventListener('click', () => {
        _selectedEnv = card.dataset.env;
        renderDeployment();
      });
    });

    const promoteBtn = document.getElementById('deploy-promote-btn');
    if (promoteBtn) {
      promoteBtn.addEventListener('click', handleDeploy);
    }

    const refreshBtn = document.getElementById('deploy-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (typeof window.showToast === 'function')
          window.showToast('Refreshing deployment status...', 'info');
        renderDeployment();
      });
    }

    document.querySelectorAll('.dag-node').forEach((node) => {
      node.addEventListener('click', () => {
        const stageId = node.dataset.stageId;
        const stage = window.state.workflow.stages.find((s) => s.id === stageId);
        const drawer = document.getElementById('dag-detail-drawer');
        if (stage && drawer) {
          drawer.innerHTML = `
            <div style="padding: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,115,0,0.15); border-radius: 6px;">
              <div>
                <strong style="color: var(--text-primary); font-size: 0.85rem;">Stage Details: ${stage.name}</strong>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Status: <span style="text-transform: capitalize;">${stage.status}</span></div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.72rem; color: var(--text-muted);">Artifact Size</div>
                <strong style="font-family: var(--font-mono); font-size: 0.95rem; color: var(--accent-cyan);">${stage.size || '—'}</strong>
              </div>
            </div>
          `;
          drawer.style.maxHeight = '100px';
          drawer.style.borderWidth = '1px';
          drawer.style.padding = '8px 0';
        }
      });
    });
  }

  /* ── Handle deploy promotion ─────────────────────────────── */
  function handleDeploy() {
    if (_deployInProgress) return;

    _deployInProgress = true;
    renderDeployment();

    const targetEnv =
      _selectedEnv === 'dev' ? 'staging' : _selectedEnv === 'staging' ? 'production' : _selectedEnv;
    if (typeof window.showToast === 'function') {
      window.showToast(
        `Initiating deployment to ${ENVIRONMENTS[targetEnv]?.name || targetEnv}...`,
        _selectedEnv === 'staging' ? 'warning' : 'info',
      );
    }
    if (typeof window.addLog === 'function') {
      window.addLog(`Deployment initiated: ${_selectedEnv} → ${targetEnv}`, 'info');
    }

    setTimeout(() => {
      _deployInProgress = false;
      if (typeof window.showToast === 'function') {
        window.showToast(
          `Deployment to ${ENVIRONMENTS[targetEnv]?.name || targetEnv} completed successfully!`,
          'success',
        );
      }
      if (typeof window.dispatch === 'function') {
        window.dispatch('DEPLOYMENT_COMPLETE', {
          env: targetEnv,
          timestamp: new Date().toISOString(),
        });
      }
      renderDeployment();
    }, 3000);
  }

  /* ── Inject component styles ─────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('deployment-styles')) return;
    const style = document.createElement('style');
    style.id = 'deployment-styles';
    style.textContent = `
      .env-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
      .env-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
      .env-card.active { background: rgba(255,115,0,0.05); }
      
      .dag-node-active {
        animation: dag-pulse 1.5s infinite alternate ease-in-out;
      }
      @keyframes dag-pulse {
        0% { box-shadow: 0 0 4px var(--accent-orange); }
        100% { box-shadow: 0 0 14px var(--accent-orange); }
      }
      .dag-node:hover {
        transform: scale(1.05);
        box-shadow: 0 0 10px rgba(255, 115, 0, 0.25);
      }
    `;
    document.head.appendChild(style);
  }

  /* ── Expose to window ────────────────────────────────────── */
  window.renderDeployment = renderDeployment;
  window.initDeployment = function () {
    renderDeployment();
  };

  console.warn('%c[CoNinja] Deployment Gate loaded', 'color:#ff7300;font-weight:bold;');
})();
