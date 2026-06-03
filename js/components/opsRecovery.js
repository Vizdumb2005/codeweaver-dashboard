/* ============================================================
   CoNinja Shadow Swarm — Ops Recovery & Release Control
   Incidents, feature flags, secrets, backups, runbooks, release trains
   ============================================================ */

(function () {
  'use strict';

  const SEVERITY_ICONS = {
    critical: window.ninjaIcons ? window.ninjaIcons.get('circle') : '●',
    high: window.ninjaIcons ? window.ninjaIcons.get('circle') : '●',
    medium: window.ninjaIcons ? window.ninjaIcons.get('circle') : '●',
    low: window.ninjaIcons ? window.ninjaIcons.get('circle') : '●',
  };

  // State local fallbacks for resiliency
  if (!window.state.incidents.postmortems) {
    window.state.incidents.postmortems = [
      {
        id: 'pm-001',
        title: 'SMTP Timeout Outage',
        rootCause: 'Third-party SMTP relay connection pool exhaustion due to traffic spikes.',
        contributingFactors: [
          'Low SMTP timeout limit (10s)',
          'Missing cache for repeated notification digests',
        ],
        lessonsLearned:
          'Always wrap notifications in asynchronous worker queues and enforce retry backoffs.',
        tasks: [
          { desc: 'Increase Nodemailer SMTP timeout configuration to 30s', done: true },
          { desc: 'Implement notification queue worker threads', done: false },
          { desc: 'Setup redundant Mailgun fallback SMTP relay', done: false },
        ],
      },
    ];
  }

  if (!window.state.secrets.auditLog) {
    window.state.secrets.auditLog = [
      {
        timestamp: '2026-05-29T15:00:00Z',
        actor: 'Stealth Auditor',
        action: 'Rotated key DATABASE_URL',
        scope: 'production',
      },
      {
        timestamp: '2026-05-29T14:30:00Z',
        actor: 'Chunin DevOps',
        action: 'Accessed key SendGrid API',
        scope: 'production',
      },
      {
        timestamp: '2026-05-28T18:15:00Z',
        actor: 'Sensei',
        action: 'Created key JWT_SECRET',
        scope: 'all',
      },
    ];
  }

  // Performance optimization: Use debounced rendering to prevent excessive calls
  const _renderOpsRecovery = function () {
    const container = document.getElementById('ops-recovery-container');
    if (!container) return;

    const { incidents, featureFlags, secrets } = window.state;
    const activeTab = window.state.opsActiveTab || 'incidents';

    container.innerHTML = `
      <div class="ops-layout">
        <div class="ops-tabs">
          <button class="ops-tab ${activeTab === 'incidents' ? 'active' : ''}" data-tab="incidents">
            ◈ Incidents & Postmortems (${incidents.active.length})
          </button>
          <button class="ops-tab ${activeTab === 'releases' ? 'active' : ''}" data-tab="releases">
            ◈ Release Controls
          </button>
          <button class="ops-tab ${activeTab === 'flags' ? 'active' : ''}" data-tab="flags">
            ◈ Feature Flags
          </button>
          <button class="ops-tab ${activeTab === 'secrets' ? 'active' : ''}" data-tab="secrets">
            ◈ Secrets Vault
          </button>
          <button class="ops-tab ${activeTab === 'backups' ? 'active' : ''}" data-tab="backups">
            ◈ Backups & Rollbacks
          </button>
          <button class="ops-tab ${activeTab === 'runbooks' ? 'active' : ''}" data-tab="runbooks">
            ◈ Recovery Runbooks
          </button>
        </div>

        <div class="ops-content">
          ${activeTab === 'incidents' ? renderIncidentsTab(incidents) : ''}
          ${activeTab === 'releases' ? renderReleasesTab() : ''}
          ${activeTab === 'flags' ? renderFeatureFlags(featureFlags) : ''}
          ${activeTab === 'secrets' ? renderSecretsTab(secrets) : ''}
          ${activeTab === 'backups' ? renderBackupsTab() : ''}
          ${activeTab === 'runbooks' ? renderRunbooks(incidents.runbooks) : ''}
        </div>
      </div>
    `;

    attachListeners();
    injectStyles();
  };

  function renderIncidentsTab(incidents) {
    const subTab = window.state.opsIncidentsSubTab || 'active';
    return `
      <div class="incidents-view-wrapper">
        <div class="sub-tab-bar" style="margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px; display:flex; gap:12px;">
          <button class="btn btn-xs ${subTab === 'active' ? 'btn-primary' : 'btn-outline'}" id="subtab-inc-active">Active Stream</button>
          <button class="btn btn-xs ${subTab === 'postmortems' ? 'btn-primary' : 'btn-outline'}" id="subtab-inc-pms">Postmortem Catalog</button>
        </div>

        ${
          subTab === 'active'
            ? `
          <div class="incidents-view">
            <div class="incidents-section">
              <h3>Active Incidents</h3>
              ${
                incidents.active.length === 0
                  ? `
                <div class="empty-state-hint" style="padding: 40px; text-align:center; color:var(--text-muted); background:rgba(255,255,255,0.02); border-radius:8px;">
                  <span style="font-size: 2rem; display:block; margin-bottom:8px;">◈</span>
                  No active incidents. Host environment is stable and healthy.
                </div>
              `
                  : `
                <div class="incident-list">
                  ${incidents.active
                    .map(
                      (i) => `
                    <div class="incident-card severity-${i.severity}">
                      <div class="incident-header">
                        <span class="severity-icon">${SEVERITY_ICONS[i.severity]}</span>
                        <span class="incident-title">${i.title}</span>
                        ${i.status === 'investigating' ? '<span class="badge badge-warning">INVESTIGATING</span>' : i.status === 'resolved' ? '<span class="badge badge-success">RESOLVED</span>' : `<span class="badge badge-outline">${i.status.toUpperCase()}</span>`}
                      </div>
                      <div class="incident-body">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.8rem; margin-bottom:12px;">
                          <div><strong>Service:</strong> <span style="color:var(--accent-cyan); font-family:var(--font-mono);">${i.affectedService}</span></div>
                          <div><strong>Impact Scope:</strong> <span style="color:var(--accent-error);">${i.impact.toUpperCase()}</span></div>
                          <div><strong>Assigned Shinobi:</strong> <span>${i.assignedTo}</span></div>
                          <div><strong>Started At:</strong> <span>${new Date(i.startedAt).toLocaleTimeString()}</span></div>
                        </div>
                        <div style="font-size:0.8rem; margin-bottom:12px;">
                          <strong>Symptoms:</strong>
                          <ul style="margin:4px 0; padding-left:16px; color:var(--text-muted);">
                            ${i.symptoms.map((s) => `<li>${s}</li>`).join('')}
                          </ul>
                        </div>
                      </div>
                      
                      <div class="incident-timeline">
                        <h5>Timeline Log</h5>
                        ${i.timeline
                          .map(
                            (e) => `
                          <div class="timeline-event">
                            <span class="event-time">${new Date(e.time).toLocaleTimeString()}</span>
                            <span class="event-type ${e.type.toLowerCase()}">${e.type.toUpperCase()}</span>
                            <span class="event-desc">${e.event}</span>
                          </div>
                        `,
                          )
                          .join('')}
                      </div>
                      <div class="incident-actions" style="margin-top:12px;">
                        <button class="btn btn-primary btn-sm" data-action="resolve" data-id="${i.id}">◈ Resolve Incident</button>
                        <button class="btn btn-danger btn-sm" data-action="escalate" data-id="${i.id}">◈ Escalate Threat</button>
                      </div>
                    </div>
                  `,
                    )
                    .join('')}
                </div>
              `
              }
            </div>

            <div class="incidents-section incidents-sidebar">
              <h3>Resolved Incidents History</h3>
              <div class="resolved-list">
                ${
                  incidents.resolved.length === 0
                    ? `
                  <p style="font-size:0.75rem; color:var(--text-muted); padding:10px;">No historical incidents catalogued.</p>
                `
                    : incidents.resolved
                        .slice(0, 5)
                        .map(
                          (i) => `
                  <div class="resolved-item">
                    <span class="severity-icon">◈</span>
                    <div class="resolved-info">
                      <div class="resolved-title" style="font-weight:600;">${i.title}</div>
                      <div class="resolved-meta" style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                        Resolved in ${formatDuration(i.startedAt, i.resolvedAt)} • Resolution: "${i.resolution}"
                      </div>
                    </div>
                  </div>
                `,
                        )
                        .join('')
                }
              </div>
            </div>
          </div>
        `
            : renderPostmortems(incidents.postmortems)
        }
      </div>
    `;
  }

  function renderPostmortems(pms) {
    return `
      <div class="postmortems-container" style="max-width:900px;">
        <h3>Root Cause Analysis Reports (RCAs)</h3>
        <div class="pm-list" style="display:flex; flex-direction:column; gap:16px; margin-top:12px;">
          ${pms
            .map(
              (pm) => `
            <div class="glass-card pm-card" style="padding:20px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h4 style="color:var(--accent-orange); margin:0;">${pm.title}</h4>
                <span class="badge badge-outline">ID: ${pm.id}</span>
              </div>
              <div style="font-size:0.82rem; margin-bottom:12px; line-height:1.5;">
                <p><strong>Root Cause:</strong> <span style="color:var(--text-secondary);">${pm.rootCause}</span></p>
                <p style="margin-top:6px;"><strong>Contributing Factors:</strong></p>
                <ul style="padding-left:18px; color:var(--text-muted); margin-top:4px;">
                  ${pm.contributingFactors.map((cf) => `<li>${cf}</li>`).join('')}
                </ul>
                <p style="margin-top:6px;"><strong>Lessons Learned:</strong> <span style="color:var(--accent-cyan); font-style:italic;">${pm.lessonsLearned}</span></p>
              </div>
              
              <div class="pm-tasks-checklist" style="border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
                <h5 style="margin:0 0 8px 0; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">Preventative Action Checklist</h5>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${pm.tasks
                    .map(
                      (t, idx) => `
                    <div style="display:flex; align-items:center; gap:8px; font-size:0.78rem;">
                      <input type="checkbox" class="pm-task-chk" data-pm-id="${pm.id}" data-task-idx="${idx}" ${t.done ? 'checked' : ''}>
                      <span style="color:${t.done ? 'var(--text-muted)' : 'var(--text-primary)'}; text-decoration:${t.done ? 'line-through' : 'none'};">${t.desc}</span>
                    </div>
                  `,
                    )
                    .join('')}
                </div>
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function renderReleasesTab() {
    const environments = window.state.deployment.environments;
    const prodEnv = environments.find((e) => e.id === 'production') || { version: 'v0.4.1' };
    const stagingEnv = environments.find((e) => e.id === 'staging') || { version: 'v0.4.2' };
    const canaryPercentage = window.state.canaryPercentage || 25;

    return `
      <div class="releases-view" style="max-width: 900px;">
        <h3>Release Management & Train Dashboard</h3>
        
        <div class="releases-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:16px;">
          <!-- Release train specs -->
          <div class="glass-card" style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px;">
            <h4 style="margin:0 0 12px 0;">◈ Active Release Trains</h4>
            <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; justify-content:space-between;">
                <span>Staging Environment:</span>
                <strong style="color:var(--accent-orange);">${stagingEnv.version}</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span>Production Environment:</span>
                <strong style="color:var(--accent-orange);">${prodEnv.version}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-top:12px; border-top:1px solid rgba(255,255,255,0.05); padding-top:8px;">
                <span>Release Frequency:</span>
                <span style="color:var(--text-secondary);">Daily (Midnight Trigger)</span>
              </div>
            </div>
          </div>

          <!-- Canary Rollout Controls -->
          <div class="glass-card" style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px;">
            <h4 style="margin:0 0 12px 0;">◈ Production Canary Rollout</h4>
            <div style="margin: 12px 0;">
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span>Traffic Allocation:</span>
                <strong style="color:var(--accent-cyan);">${canaryPercentage}% Canary</strong>
              </div>
              <input type="range" min="0" max="100" value="${canaryPercentage}" id="canary-rollout-slider" style="width:100%;">
              <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); margin-top:4px;">
                <span>0% (Off)</span>
                <span>50% (Half load)</span>
                <span>100% (Full production)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Release Notes Generator -->
        <div class="glass-card" style="padding:20px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; margin-top:20px;">
          <h4 style="margin:0 0 8px 0;">◈ Release Notes Compiler</h4>
          <p style="color:var(--text-muted); font-size:0.78rem; margin-bottom:14px;">Collect recent commits on features, hotfixes, and security patches to compile a changelog report.</p>
          <button class="btn btn-primary" id="btn-compile-release-notes">Compile Release Scroll</button>
          
          <div id="release-notes-preview" style="display:none; margin-top:16px; padding:16px; background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.05); border-radius:8px; font-family:var(--font-mono); font-size:0.75rem; color:var(--text-secondary); max-height:200px; overflow-y:auto;">
          </div>
        </div>
      </div>
    `;
  }

  function renderFeatureFlags(featureFlags) {
    return `
      <div class="flags-view">
        <div class="flags-header">
          <div>
            <h3>Stealth Feature Toggles</h3>
            <p style="color:var(--text-muted); font-size:0.78rem; margin-top:4px;">Perform canary rollouts and control active system flags.</p>
          </div>
          <button class="btn btn-primary" id="btn-create-flag">+ New Flag</button>
        </div>
        <div class="flags-list">
          ${featureFlags.flags
            .map(
              (f) => `
            <div class="flag-card ${f.status}">
              <div class="flag-header">
                <div class="flag-info">
                  <span class="flag-name">${f.name}</span>
                  <span class="flag-desc" style="color:var(--text-muted); font-size:0.8rem; margin-top:2px; display:block;">${f.description}</span>
                </div>
                <label class="switch">
                  <input type="checkbox" class="flag-toggle-checkbox" ${f.status === 'enabled' ? 'checked' : ''} data-flag-id="${f.id}">
                  <span class="slider-toggle"></span>
                </label>
              </div>
              <div class="flag-rollout" style="margin: 12px 0;">
                <div class="rollout-label-row" style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                  <span>Canary Rollout:</span>
                  <strong style="color:var(--accent-orange);">${f.rollout}%</strong>
                </div>
                <input type="range" min="0" max="100" value="${f.rollout}" class="rollout-slider" data-flag-id="${f.id}" style="width:100%;">
              </div>
              <div class="flag-environments" style="display:flex; gap:6px;">
                ${Object.entries(f.environments)
                  .map(
                    ([env, val]) => `
                  <span class="env-badge ${val === 100 ? 'enabled' : val > 0 ? 'partial' : 'disabled'}">${env}: ${val}%</span>
                `,
                  )
                  .join('')}
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function renderSecretsTab(secrets) {
    const scopeTab = window.state.secretsScopeTab || 'all';
    const showMasked = window.state.secretsShowMasked || false;

    // Filter vars by scope
    const filteredEnvVars = secrets.envVars.filter((s) => {
      if (scopeTab === 'all') return true;
      return s.scope === scopeTab || s.scope === 'all';
    });

    return `
      <div class="secrets-view">
        <div class="secrets-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; gap:16px; flex-wrap:wrap;">
          <div style="flex:1; min-width:200px;">
            <h3 style="margin-bottom:4px;">Secrets & Environment Manager</h3>
            <p style="color:var(--text-muted); font-size:0.78rem; margin:0;">Rotatable environment keys and third-party credential vaults.</p>
          </div>
          <div style="display:flex; gap:8px; flex-shrink:0;">
            <button class="btn btn-outline btn-xs" id="btn-toggle-mask-secrets">
              ${showMasked ? '◈ Hide Secrets' : '◈ Show Secrets'}
            </button>
            <button class="btn btn-primary btn-xs" id="btn-create-secret">+ Add Secret</button>
          </div>
        </div>

        <div class="sub-tab-bar" style="margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px; display:flex; gap:8px;">
          ${['all', 'local', 'dev', 'staging', 'production']
            .map(
              (s) => `
            <button class="filter-tab ${scopeTab === s ? 'active' : ''}" data-scope="${s}" style="padding: 4px 10px; border-radius: 12px; font-size:0.75rem; background:transparent; border:1px solid rgba(255,255,255,0.1); color:var(--text-muted); cursor:pointer;">
              ${s.toUpperCase()}
            </button>
          `,
            )
            .join('')}
        </div>

        <div class="secrets-grid-layout" style="display:grid; grid-template-columns: 1fr 320px; gap:20px; align-items:start;">
          <div class="secrets-left-panel">
            <div class="secrets-section">
              <h4>Environment Variables</h4>
              <div class="secrets-list">
                ${
                  filteredEnvVars.length === 0
                    ? `
                  <p style="font-size:0.75rem; color:var(--text-muted); padding:10px;">No env variables defined for this scope.</p>
                `
                    : filteredEnvVars
                        .map(
                          (s) => `
                  <div class="secret-item">
                    <div class="secret-info" style="flex:1;">
                      <span class="secret-key">${s.key}</span>
                      <span class="secret-scope" style="margin-top:2px; display:block; font-size:0.72rem; color:var(--text-muted);">Scope: [${s.scope.toUpperCase()}] ${s.lastRotated ? `• Rotated: ${formatDate(s.lastRotated)}` : '• Never Rotated'}</span>
                    </div>
                    <div class="secret-value" style="font-family:var(--font-mono); font-size:0.8rem; color:${showMasked ? 'var(--accent-orange)' : 'var(--text-muted)'}; background:rgba(0,0,0,0.2); padding:4px 8px; border-radius:4px;">
                      ${showMasked ? (s.value.includes('••') ? `env_secret_val_${s.key.toLowerCase()}` : s.value) : s.value}
                    </div>
                    <div class="secret-actions">
                      <button class="btn btn-sm btn-outline btn-rotate-secret" data-id="${s.id}" data-type="env">◈ Rotate</button>
                    </div>
                  </div>
                `,
                        )
                        .join('')
                }
              </div>
            </div>

            <div class="secrets-section" style="margin-top:24px;">
              <h4>Third-Party API Keys</h4>
              <div class="secrets-list">
                ${secrets.apiKeys
                  .map(
                    (k) => `
                  <div class="secret-item">
                    <div class="secret-info" style="flex:1;">
                      <span class="secret-key">${k.name}</span>
                      <span class="secret-scope" style="margin-top:2px; display:block; font-size:0.72rem; color:var(--text-muted);">Status: ${k.status.toUpperCase()} ${k.lastUsed ? `• Last Used: ${formatDate(k.lastUsed)}` : ''}</span>
                    </div>
                    <div class="secret-value" style="font-family:var(--font-mono); font-size:0.8rem; color:${showMasked ? 'var(--accent-orange)' : 'var(--text-muted)'}; background:rgba(0,0,0,0.2); padding:4px 8px; border-radius:4px;">
                      ${showMasked ? `sg_sk_live_${k.name.toLowerCase().replace(/ /g, '_')}_9102` : k.key}
                    </div>
                    <div class="secret-actions">
                      <button class="btn btn-sm btn-outline btn-rotate-secret" data-id="${k.id}" data-type="key">◈ Rotate</button>
                    </div>
                  </div>
                `,
                  )
                  .join('')}
              </div>
            </div>
          </div>

          <!-- Safety audit trail -->
          <div class="glass-card safety-audit-panel" style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px;">
            <h4 style="margin:0 0 12px 0;">◈️ Access Audit Trail</h4>
            <div style="display:flex; flex-direction:column; gap:8px; max-height: 380px; overflow-y:auto;">
              ${secrets.auditLog
                .map(
                  (log) => `
                <div style="padding:8px; background:rgba(0,0,0,0.15); border-radius:6px; border:1px solid rgba(255,255,255,0.03); font-size:0.75rem;">
                  <div style="display:flex; justify-content:space-between; color:var(--text-muted); font-size:0.68rem; margin-bottom:4px;">
                    <span>${log.actor}</span>
                    <span>${new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style="color:var(--text-secondary); word-break:break-all;">${log.action}</div>
                  <span class="badge badge-outline" style="font-size:0.6rem; padding: 1px 4px; margin-top:4px; display:inline-block;">[${log.scope.toUpperCase()}]</span>
                </div>
              `,
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderBackupsTab() {
    const snapshots = window.state.backup.snapshots;
    const history = window.state.deployment.releaseHistory;
    const scrubberValue =
      window.state.backup.scrubberValue !== undefined ? window.state.backup.scrubberValue : 24;

    // Helper to get closest snapshot ID
    let initialSnapId = 'N/A';
    if (snapshots && snapshots.length > 0) {
      const hoursAgo = 24 - scrubberValue;
      const targetTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      let closest = snapshots[0];
      let minDiff = Math.abs(new Date(closest.created) - targetTime);
      for (let i = 1; i < snapshots.length; i++) {
        const diff = Math.abs(new Date(snapshots[i].created) - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = snapshots[i];
        }
      }
      initialSnapId = closest.id;
    }

    return `
      <div class="backups-view">
        <div class="backups-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <h3>System Recovery Snapshots</h3>
            <p style="color:var(--text-muted); font-size:0.78rem; margin-top:4px;">Restore points containing database schema structures and agent scopes.</p>
          </div>
          <button class="btn btn-primary" id="btn-create-snapshot">+ Create Snapshot</button>
        </div>
        
        <!-- Container Time Machine Scrubber -->
        <div class="glass-card time-machine-card" style="padding:20px; margin-bottom:20px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; position:relative;">
          <h4 style="margin:0 0 12px 0; color:var(--accent-cyan); display:flex; align-items:center; gap:8px;">
            <span>⏳</span> Container Time Machine (Undo Engine)
          </h4>
          <p style="color:var(--text-muted); font-size:0.78rem; margin-bottom:20px;">
            Drag the continuous scrubber to scrub through the sandbox states of the last 24 hours.
          </p>
          
          <div class="scrubber-wrapper" style="position:relative; margin: 30px 10px 20px 10px;">
            <div id="scrubber-tooltip" class="scrubber-tooltip">
              ${initialSnapId}
            </div>
            <input type="range" id="time-machine-scrubber" min="0" max="24" value="${scrubberValue}" step="0.1" style="width:100%; -webkit-appearance:none; height:6px; border-radius:3px; background:rgba(255,255,255,0.1); outline:none;">
            <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); margin-top:8px;">
              <span>24 Hours Ago</span>
              <span>12 Hours Ago</span>
              <span>Now (Live Container)</span>
            </div>
          </div>
          
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.05); padding-top:16px; margin-top:16px;">
            <span style="font-size:0.78rem; color:var(--text-muted);">
              Target Snapshot: <strong id="selected-snap-display" style="color:var(--accent-cyan); font-family:var(--font-mono);">${initialSnapId}</strong>
            </span>
            <button class="btn btn-danger btn-sm" id="btn-physically-restore" style="box-shadow: 0 0 10px rgba(239,68,68,0.2);">
              ◈ Physically Restore Sandbox
            </button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 340px; gap:20px; align-items:start;">
          <div class="backups-list">
            ${
              snapshots.length === 0
                ? `
              <p style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:24px;">No restore snapshots compiled.</p>
            `
                : snapshots
                    .map(
                      (s) => `
              <div class="backup-item" style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:8px; margin-bottom:6px;">
                <div class="backup-info">
                  <span class="backup-name" style="font-weight:600; display:block;">${s.name}</span>
                  <span class="backup-meta" style="font-size:0.72rem; color:var(--text-muted); margin-top:2px; display:block;">
                    Type: ${s.type.toUpperCase()} • Size: ${s.size} • Compiled: ${formatDate(s.created)}
                  </span>
                </div>
                <div class="backup-actions">
                  <button class="btn btn-sm btn-outline btn-restore-snapshot" data-id="${s.id}">↩️ Restore</button>
                  <button class="btn btn-sm btn-outline btn-export-snapshot" data-id="${s.id}">◈ Export</button>
                </div>
              </div>
            `,
                    )
                    .join('')
            }
          </div>

          <!-- Rollback simulation panel -->
          <div class="glass-card" style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px;">
            <h4 style="margin:0 0 8px 0;">↩️ Rollback Safety Simulator</h4>
            <p style="color:var(--text-muted); font-size:0.75rem; margin-bottom:12px;">Trigger a safe check rollback simulation to check dependency constraints.</p>
            
            <div style="font-size:0.8rem; margin-bottom:12px;">
              <label style="font-size:0.72rem; color:var(--text-muted); display:block; margin-bottom:4px;">Target Version to Revert to:</label>
              <select id="simulate-rollback-version" class="form-input text-xs" style="width:100%;">
                ${history.map((rel) => `<option value="${rel.version}">${rel.version} (${rel.status.toUpperCase()})</option>`).join('')}
              </select>
            </div>
            
            <button class="btn btn-outline btn-xs" id="btn-run-rollback-simulation" style="width:100%;">Simulate Rollback</button>
            <div id="rollback-simulation-results" style="display:none; font-size:0.75rem; margin-top:12px; padding:10px; background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.15); border-radius:6px; color:var(--accent-orange);">
              <strong>◈️ Rollback Assessment Warnings:</strong>
              <ul style="padding-left:16px; margin:4px 0; color:var(--text-secondary);">
                <li>PostgreSQL schema migrations on user tables cannot be automatically retrofitted.</li>
                <li>Budget limits will revert to $5.00 threshold settings.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderRunbooks(runbooks) {
    return `
      <div class="runbooks-view">
        <div class="runbooks-header" style="margin-bottom:16px;">
          <h3>Disaster Recovery Runbooks</h3>
          <p style="color:var(--text-muted); font-size:0.78rem; margin-top:4px;">Automated standard operational scripts to clear infrastructure exceptions.</p>
        </div>
        <div class="runbooks-list">
          ${runbooks
            .map(
              (r) => `
            <div class="runbook-card">
              <div class="runbook-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span class="runbook-title" style="font-weight:600; font-size:0.95rem; color:var(--text-primary);">${r.title}</span>
                <span class="runbook-steps badge badge-outline">${r.steps.length} steps</span>
              </div>
              <div class="runbook-steps-list">
                ${r.steps
                  .map(
                    (step, i) => `
                  <div class="runbook-step" style="display:flex; align-items:flex-start; gap:8px; margin-bottom:6px; font-size:0.8rem;">
                    <span class="step-num">${i + 1}</span>
                    <span class="step-desc" style="color:var(--text-secondary); margin-top:2px;">${step}</span>
                  </div>
                `,
                  )
                  .join('')}
              </div>
              <div class="runbook-actions" style="margin-top:14px; border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
                <button class="btn btn-sm btn-primary btn-execute-runbook" data-id="${r.id}">▶️ Execute Runbook</button>
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function formatDuration(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.floor((e - s) / 1000 / 60);
    if (diff < 1) return 'less than a minute';
    if (diff < 60) return `${diff}m`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  }

  function formatDate(isoString) {
    if (!isoString) return 'Never';
    return new Date(isoString).toLocaleString();
  }

  function attachListeners() {
    // Container Time Machine (Undo Engine) Listeners
    const scrubber = document.getElementById('time-machine-scrubber');
    const tooltip = document.getElementById('scrubber-tooltip');
    const display = document.getElementById('selected-snap-display');
    if (scrubber && tooltip && display) {
      const updatePosition = () => {
        const val = parseFloat(scrubber.value);
        window.state.backup.scrubberValue = val;
        const pct = val / 24;
        tooltip.style.left = `calc(${pct * 100}% - ${(pct - 0.5) * 16}px)`;

        const snaps = window.state.backup.snapshots || [];
        if (snaps.length > 0) {
          const hoursAgo = 24 - val;
          const targetTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
          let closest = snaps[0];
          let minDiff = Math.abs(new Date(closest.created) - targetTime);
          for (let i = 1; i < snaps.length; i++) {
            const diff = Math.abs(new Date(snaps[i].created) - targetTime);
            if (diff < minDiff) {
              minDiff = diff;
              closest = snaps[i];
            }
          }
          tooltip.textContent = closest.id;
          display.textContent = closest.id;
        } else {
          tooltip.textContent = 'N/A';
          display.textContent = 'N/A';
        }
      };

      scrubber.addEventListener('input', updatePosition);
      updatePosition();
    }

    const btnPhysRestore = document.getElementById('btn-physically-restore');
    if (btnPhysRestore) {
      btnPhysRestore.addEventListener('click', () => {
        window.state.testCoverage = 0;
        window.addLog('devops', 'warning', 'Reverted container filesystem');
        if (typeof window.renderMetrics === 'function') window.renderMetrics();
        window.renderOpsRecovery();
        window.showToast('Sandbox physically restored!', 'warning');
      });
    }

    // Guard against duplicate listener attachment
    if (window._opsRecoveryListenersWired) return;
    window._opsRecoveryListenersWired = true;

    // Tab switching
    document.querySelectorAll('.ops-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        window.state.opsActiveTab = tab.dataset.tab;
        window.renderOpsRecovery();
      });
    });

    // Sub-tab toggles inside Incidents
    const btnSubActive = document.getElementById('subtab-inc-active');
    const btnSubPms = document.getElementById('subtab-inc-pms');
    if (btnSubActive && btnSubPms) {
      btnSubActive.addEventListener('click', () => {
        window.state.opsIncidentsSubTab = 'active';
        window.renderOpsRecovery();
      });
      btnSubPms.addEventListener('click', () => {
        window.state.opsIncidentsSubTab = 'postmortems';
        window.renderOpsRecovery();
      });
    }

    // Postmortem task check
    document.querySelectorAll('.pm-task-chk').forEach((chk) => {
      chk.addEventListener('change', () => {
        const pmId = chk.dataset.pmId;
        const taskIdx = parseInt(chk.dataset.taskIdx);
        const pm = window.state.incidents.postmortems.find((p) => p.id === pmId);
        if (pm && pm.tasks[taskIdx]) {
          pm.tasks[taskIdx].done = chk.checked;
          window.dispatch('ADD_LOG', {
            agent: 'system',
            type: 'info',
            msg: `RCA [${pmId}] Preventative task updated: "${pm.tasks[taskIdx].desc}" - ${chk.checked ? 'CLOSED' : 'OPEN'}`,
          });
          window.renderOpsRecovery();
        }
      });
    });

    // Canary rollout slider
    const canarySlider = document.getElementById('canary-rollout-slider');
    if (canarySlider) {
      canarySlider.addEventListener('change', () => {
        const val = parseInt(canarySlider.value);
        window.state.canaryPercentage = val;
        window.dispatch('ADD_LOG', {
          agent: 'devops',
          type: 'info',
          msg: `Chunin DevOps: Adjusted production canary load distribution index to: ${val}%`,
        });
        window.renderOpsRecovery();
      });
    }

    // Compile release notes
    const btnCompileNotes = document.getElementById('btn-compile-release-notes');
    const previewNotes = document.getElementById('release-notes-preview');
    if (btnCompileNotes && previewNotes) {
      btnCompileNotes.addEventListener('click', () => {
        const commits = window.state.repository.commits || [];
        const items = commits
          .map((c) => `<li>[${c.id.slice(0, 7)}] - ${c.message} (${c.author})</li>`)
          .join('\n');
        const content = `
          <h4>Shadow Swarm Release Train Notes</h4>
          <p>Version Train: staging/v0.4.2 → production/v0.4.3</p>
          <ul>
            ${items}
          </ul>
        `;
        previewNotes.innerHTML = content;
        previewNotes.style.display = 'block';
        window.dispatch('ADD_LOG', {
          agent: 'system',
          type: 'success',
          msg: 'Release train changelog scroll successfully compiled.',
        });
        window.showToast('Release scroll compiled successfully!', 'success');
      });
    }

    // Secrets scope tab selection
    document.querySelectorAll('.secrets-view .filter-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        window.state.secretsScopeTab = tab.dataset.scope;
        window.renderOpsRecovery();
      });
    });

    // Toggle Secret value mask
    const maskBtn = document.getElementById('btn-toggle-mask-secrets');
    if (maskBtn) {
      maskBtn.addEventListener('click', () => {
        window.state.secretsShowMasked = !(window.state.secretsShowMasked || false);
        window.renderOpsRecovery();
      });
    }

    // Create Secret button
    const createSecBtn = document.getElementById('btn-create-secret');
    if (createSecBtn) {
      createSecBtn.addEventListener('click', () => {
        window.showConfirmDialog(
          'Forge Secret Key',
          `<div style="text-align:left; display:flex; flex-direction:column; gap:8px;">
             <div>
               <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Secret Name/Key:</label>
               <input type="text" id="sec-input-key" class="form-input text-xs" placeholder="e.g. STRIPE_API_SECRET" style="width:100%;" required>
             </div>
             <div>
               <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Scope Scope Target:</label>
               <select id="sec-input-scope" class="form-input text-xs" style="width:100%;">
                 <option value="production">Production Only</option>
                 <option value="staging">Staging Dojo</option>
                 <option value="local">Local sandbox</option>
                 <option value="all">All environments</option>
               </select>
             </div>
             <div>
               <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Raw Token Value:</label>
               <input type="password" id="sec-input-val" class="form-input text-xs" placeholder="Secret Token Key Value" style="width:100%;" required>
             </div>
           </div>`,
          () => {
            const key = document.getElementById('sec-input-key').value.trim();
            const scope = document.getElementById('sec-input-scope').value;
            const val = document.getElementById('sec-input-val').value.trim();

            if (key && val) {
              window.state.secrets.envVars.push({
                id: `env-${Date.now()}`,
                key: key,
                value: '••••••••',
                scope: scope,
                lastRotated: new Date().toISOString(),
              });

              window.state.secrets.auditLog.unshift({
                timestamp: new Date().toISOString(),
                actor: 'You',
                action: `Created environment key: ${key}`,
                scope: scope,
              });

              window.dispatch('ADD_LOG', {
                agent: 'security',
                type: 'success',
                msg: `Stealth Auditor: Injected secure environment parameter variable: "${key}" targeting [${scope}].`,
              });

              window.renderOpsRecovery();
              window.showToast(`Secret "${key}" created`, 'success');
            }
          },
        );
      });
    }

    // Rollback simulation
    const rollbackSimBtn = document.getElementById('btn-run-rollback-simulation');
    const rollbackSimResults = document.getElementById('rollback-simulation-results');
    if (rollbackSimBtn && rollbackSimResults) {
      rollbackSimBtn.addEventListener('click', () => {
        const ver = document.getElementById('simulate-rollback-version').value;
        window.dispatch('ADD_LOG', {
          agent: 'devops',
          type: 'info',
          msg: `[ROLLBACK SIMULATOR] Initiated dry-run rollback validation checking dependencies targeting: ${ver}...`,
        });

        rollbackSimResults.style.display = 'block';
        setTimeout(() => {
          window.dispatch('ADD_LOG', {
            agent: 'devops',
            type: 'warning',
            msg: '[ROLLBACK SIMULATOR] Assessment Warnings resolved: Schema integrity requires caution.',
          });
          window.showToast('Rollback simulation checks complete', 'warning');
        }, 1200);
      });
    }

    // Feature Flag Toggle Switch
    document.querySelectorAll('.flag-toggle-checkbox').forEach((toggle) => {
      toggle.addEventListener('change', () => {
        const flagId = toggle.dataset.flagId;
        window.dispatch('FLAG_TOGGLE', { flagId });

        const flag = window.state.featureFlags.flags.find((f) => f.id === flagId);
        window.dispatch('ADD_LOG', {
          agent: 'system',
          type: flag.status === 'enabled' ? 'success' : 'error',
          msg: `Feature flag "${flag.name}" toggled to [${flag.status.toUpperCase()}] rollout coordinates.`,
        });
        window.renderOpsRecovery();
        window.showToast(`Flag "${flag.name}" toggled`, 'success');
      });
    });

    // Feature Flag Rollout Slider
    document.querySelectorAll('.rollout-slider').forEach((slider) => {
      slider.addEventListener('change', () => {
        const flagId = slider.dataset.flagId;
        const val = parseInt(slider.value);
        window.dispatch('FLAG_UPDATE', {
          flagId,
          updates: { rollout: val },
        });

        const flag = window.state.featureFlags.flags.find((f) => f.id === flagId);
        window.dispatch('ADD_LOG', {
          agent: 'system',
          type: 'info',
          msg: `Canary rollout target for feature flag "${flag.name}" adjusted to: ${val}%`,
        });
        window.renderOpsRecovery();
      });
    });

    // Secrets rotation
    document.querySelectorAll('.btn-rotate-secret').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const type = btn.dataset.type;

        window.showConfirmDialog(
          'Rotate Secret Token',
          `Rotate security signature key for: "${id}"? This re-allocates encryption parameters.`,
          () => {
            window.dispatch('SECRET_ROTATE', { secretId: id });

            const secret =
              type === 'env'
                ? window.state.secrets.envVars.find((s) => s.id === id)
                : window.state.secrets.apiKeys.find((s) => s.id === id);

            window.state.secrets.auditLog.unshift({
              timestamp: new Date().toISOString(),
              actor: 'Stealth Auditor',
              action: `Rotated key credentials for: ${secret.key || secret.name}`,
              scope: secret.scope || 'all',
            });

            window.dispatch('ADD_LOG', {
              agent: 'security',
              type: 'success',
              msg: `Stealth Auditor: Re-rotated cryptographic keys for DSN coordinate "${secret.key || secret.name}".`,
            });

            window.renderOpsRecovery();
            window.showToast('Secret key re-rotated', 'success');
          },
        );
      });
    });

    // Incident resolution
    document.querySelectorAll('[data-action="resolve"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const incident = window.state.incidents.active.find((i) => i.id === id);

        window.showConfirmDialog(
          'Resolve Incident',
          `Declare incident cleared: "${incident.title}"?`,
          () => {
            window.dispatch('INCIDENT_RESOLVE', {
              incidentId: id,
              resolution: 'Incident cleared by operator command.',
            });
            window.renderOpsRecovery();
            window.showToast('Incident cleared successfully', 'success');
          },
        );
      });
    });

    // Incident escalation
    document.querySelectorAll('[data-action="escalate"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const incident = window.state.incidents.active.find((i) => i.id === id);
        if (incident && incident.severity !== 'critical') {
          const severities = ['low', 'medium', 'high', 'critical'];
          const currentIdx = severities.indexOf(incident.severity);
          const nextSev = severities[currentIdx + 1] || 'critical';

          incident.severity = nextSev;
          incident.timeline.push({
            time: new Date().toISOString(),
            event: `Threat level escalated to [${nextSev.toUpperCase()}] by Operator.`,
            type: 'escalation',
          });

          window.dispatch('ADD_LOG', {
            agent: 'system',
            type: 'error',
            msg: `CRITICAL LEVEL THREAT: Escalated incident "${incident.title}" to [${nextSev.toUpperCase()}] severity.`,
          });

          window.dispatch('ADD_NOTIFICATION', {
            type: 'error',
            title: 'Threat Escalation',
            message: `Incident "${incident.title}" raised to ${nextSev.toUpperCase()}`,
          });

          window.renderOpsRecovery();
          window.showToast(`Incident escalated to ${nextSev.toUpperCase()}`, 'warning');
        }
      });
    });

    // Create backup snapshot
    const createSnapBtn = document.getElementById('btn-create-snapshot');
    if (createSnapBtn) {
      createSnapBtn.addEventListener('click', () => {
        window.showConfirmDialog(
          'Compile Restore Snapshot',
          `<div style="text-align:left;">
             <label style="font-size:0.75rem; color:var(--text-muted);">Snapshot Label:</label>
             <input type="text" id="snapshot-input-name" class="form-input text-xs" style="margin-top:6px; width:100%;" placeholder="e.g. Save-Pre-DB-Migration" required>
           </div>`,
          () => {
            const input = document.getElementById('snapshot-input-name');
            const name = input
              ? input.value.trim()
              : `Manual Save ${new Date().toLocaleTimeString()}`;
            window.dispatch('CREATE_BACKUP_SNAPSHOT', { name });
            window.renderOpsRecovery();
          },
        );
        setTimeout(() => {
          const input = document.getElementById('snapshot-input-name');
          if (input) input.focus();
        }, 100);
      });
    }

    // Restore Backup Snapshot
    document.querySelectorAll('.btn-restore-snapshot').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const snap = window.state.backup.snapshots.find((s) => s.id === id);
        if (snap) {
          window.showConfirmDialog(
            'Restore System Snapshot',
            `Restore coordinates to point: "${snap.name}"? This rolls back current code coverage stats and resets daily cost tracking to mock levels.`,
            () => {
              window.state.testCoverage = 80.0;
              window.state.accumulatedCost = 0.5;

              window.dispatch('ADD_LOG', {
                agent: 'system',
                type: 'success',
                msg: `RESTORE COMPLETE: Code base snapshot restored successfully from: "${snap.name}". Sync complete.`,
              });

              if (typeof window.renderMetrics === 'function') window.renderMetrics();
              window.renderOpsRecovery();
              window.showToast('System snapshot restored successfully!', 'success');
            },
          );
        }
      });
    });

    // Export Backup Snapshot
    document.querySelectorAll('.btn-export-snapshot').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const snap = window.state.backup.snapshots.find((s) => s.id === id);
        if (snap) {
          navigator.clipboard.writeText(JSON.stringify(snap, null, 2)).then(() => {
            window.showToast('Snapshot export JSON copied to clipboard!', 'success');
          });
        }
      });
    });

    // Execute runbook
    document.querySelectorAll('.btn-execute-runbook').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const runbook = window.state.incidents.runbooks.find((r) => r.id === id);
        if (runbook) {
          window.showToast(`Executing Runbook: "${runbook.title}"`, 'info');

          runbook.steps.forEach((step, idx) => {
            setTimeout(
              () => {
                window.dispatch('ADD_LOG', {
                  agent: 'devops',
                  type: 'info',
                  msg: `[RUNBOOK EXEC] Step ${idx + 1}/${runbook.steps.length}: ${step}`,
                });

                if (idx === runbook.steps.length - 1) {
                  const matchingInc = window.state.incidents.active.find(
                    (i) =>
                      (runbook.id === 'rb-001' && i.affectedService === 'db') ||
                      (runbook.id === 'rb-002' && i.affectedService === 'auth-service'),
                  );

                  if (matchingInc) {
                    window.dispatch('INCIDENT_RESOLVE', {
                      incidentId: matchingInc.id,
                      resolution: `Cleared by automated recovery runbook: ${runbook.title}`,
                    });
                  }

                  window.dispatch('ADD_LOG', {
                    agent: 'devops',
                    type: 'success',
                    msg: '[RUNBOOK SUCCESS] Automated recovery execution completed successfully.',
                  });

                  window.renderOpsRecovery();
                  window.showToast('Runbook execution complete! Incident cleared.', 'success');
                }
              },
              (idx + 1) * 1200,
            );
          });
        }
      });
    });

    // Create flag button
    const btnCreateFlag = document.getElementById('btn-create-flag');
    if (btnCreateFlag) {
      btnCreateFlag.addEventListener('click', () => {
        window.showConfirmDialog(
          'Forge Feature Flag',
          `<div style="text-align:left; display:flex; flex-direction:column; gap:8px;">
             <div>
               <label style="font-size:0.75rem; color:var(--text-muted);">Flag Key:</label>
               <input type="text" id="flag-input-key" class="form-input text-xs" style="margin-top:4px; width:100%;" placeholder="e.g. experimental-search" required>
             </div>
             <div>
               <label style="font-size:0.75rem; color:var(--text-muted);">Description:</label>
               <input type="text" id="flag-input-desc" class="form-input text-xs" style="margin-top:4px; width:100%;" placeholder="e.g. Enables semantic searching API">
             </div>
           </div>`,
          () => {
            const keyEl = document.getElementById('flag-input-key');
            const descEl = document.getElementById('flag-input-desc');
            const key = keyEl ? keyEl.value.trim() : '';
            const desc = descEl ? descEl.value.trim() : '';
            if (key) {
              window.state.featureFlags.flags.push({
                id: `ff-${Date.now()}`,
                name: key,
                description: desc || 'Custom feature toggle',
                status: 'disabled',
                rollout: 0,
                environments: { staging: 0, production: 0 },
              });

              window.dispatch('ADD_LOG', {
                agent: 'system',
                type: 'success',
                msg: `Forged new feature flag: "${key}" (rollout: 0%).`,
              });

              window.renderOpsRecovery();
              window.showToast(`Flag "${key}" created`, 'success');
            }
          },
        );
        setTimeout(() => {
          const input = document.getElementById('flag-input-key');
          if (input) input.focus();
        }, 100);
      });
    }
  }

  function injectStyles() {
    if (document.getElementById('ops-styles-extended')) return;
    const style = document.createElement('style');
    style.id = 'ops-styles-extended';
    style.textContent = `
      .ops-layout { display: flex; flex-direction: column; height: 100%; }
      .ops-tabs { display: flex; gap: 4px; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.1); flex-wrap: wrap; }
      .ops-tab { padding: 10px 16px; border-radius: 8px; background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.85rem; transition: all 0.15s; }
      .ops-tab:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
      .ops-tab.active { background: rgba(255,115,0,0.15); color: var(--accent-orange); }
      .ops-content { flex: 1; overflow-y: auto; padding: 20px; }
      
      .incidents-view { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
      .incidents-sidebar { position: sticky; top: 20px; max-height: calc(100vh - 200px); overflow-y: auto; }
      @media (max-width: 1280px) { 
        .incidents-view { grid-template-columns: 1fr; } 
        .incidents-sidebar { position: static; order: -1; max-height: none; }
        .incident-body > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
      }
      .incidents-section h3 { margin-bottom: 16px; font-size: 1rem; }
      
      .incident-card { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid; }
      .incident-card.severity-critical { border-left-color: #ef4444; }
      .incident-card.severity-high { border-left-color: #ff9800; }
      .incident-card.severity-medium { border-left-color: #ffeb3b; }
      .incident-card.severity-low { border-left-color: #4CAF50; }
      .incident-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .severity-icon { font-size: 1.3rem; }
      .incident-title { flex: 1; font-weight: 600; font-size: 1rem; color: var(--text-primary); }

      .incident-timeline { margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.05); }
      .incident-timeline h5 { margin: 0 0 8px 0; font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; }
      .timeline-event { display: flex; gap: 10px; font-size: 0.78rem; margin-bottom: 6px; }
      .event-time { color: var(--text-muted); min-width: 64px; }
      .event-type { font-size: 0.65rem; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
      .event-type.alert { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); }
      .event-type.info { background: rgba(6, 182, 212, 0.15); color: #06b6d4; border: 1px solid rgba(6, 182, 212, 0.25); }
      .event-type.warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25); }
      .event-type.success { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.25); }
      .event-desc { color: var(--text-secondary); }
      
      .resolved-list { display: flex; flex-direction: column; gap: 6px; }
      .resolved-item { display: flex; gap: 10px; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.04); }
      
      .flags-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .flags-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
      .flag-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; transition: transform 0.2s; }
      .flag-card:hover { transform: translateY(-2px); border-color: rgba(255,115,0,0.2); }
      .flag-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
      .flag-name { display: block; font-weight: 600; font-size: 1rem; color: var(--text-primary); }
      .flag-environments { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
      .env-badge { padding: 2px 8px; border-radius: 10px; font-size: 0.72rem; font-weight: 600; }
      .env-badge.enabled { background: rgba(76,175,80,0.15); color: #4CAF50; }
      .env-badge.partial { background: rgba(255,152,0,0.15); color: #ff9800; }
      .env-badge.disabled { background: rgba(239,68,68,0.15); color: #ef4444; }
      
      .secrets-list { display: flex; flex-direction: column; gap: 8px; }
      .secret-item { display: flex; align-items: center; gap: 16px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px solid rgba(255,255,255,0.04); }
      .secret-key { font-family: var(--font-mono); font-weight: 600; font-size: 0.85rem; color: var(--text-secondary); }
      
      .runbooks-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
      .runbook-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; transition: transform 0.2s; }
      .runbook-card:hover { transform: translateY(-2px); border-color: rgba(255,115,0,0.2); }
      .runbook-step { display: flex; gap: 8px; margin-bottom: 6px; }
      .step-num { width: 20px; height: 20px; background: rgba(255,115,0,0.15); border: 1px solid rgba(255,115,0,0.25); color: var(--accent-orange); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; flex-shrink: 0; font-weight: 700; }
      
      /* Scrubber Styles */
      .scrubber-tooltip {
        position: absolute;
        bottom: 100%;
        transform: translateX(-50%);
        margin-bottom: 10px;
        background: var(--accent-cyan);
        color: #000;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-family: var(--font-mono);
        white-space: nowrap;
        pointer-events: none;
        font-weight: bold;
        box-shadow: 0 4px 10px rgba(6,182,212,0.3);
        transition: left 0.05s ease-out;
      }
      .scrubber-tooltip::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 5px;
        border-style: solid;
        border-color: var(--accent-cyan) transparent transparent transparent;
      }
      #time-machine-scrubber::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--accent-cyan);
        cursor: pointer;
        box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
      }
      #time-machine-scrubber::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--accent-cyan);
        cursor: pointer;
        border: none;
        box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
      }
    `;
    document.head.appendChild(style);
  }

  // Create debounced version for performance optimization (100ms delay)
  window.renderOpsRecovery = window.debounce
    ? window.debounce(_renderOpsRecovery, 100)
    : _renderOpsRecovery;

  window.initOpsRecovery = function () {
    window.renderOpsRecovery();
  };

  console.warn('%c[CoNinja] Ops Recovery loaded ◈', 'color:#ff7300;font-weight:bold;');
})();
