// ============================================================
// INBOUND TRIAGE INBOX COMPONENT
// ============================================================

window.state.triageInbox = window.state.triageInbox || [
  {
    id: 'tr-01',
    source: 'Sentry',
    event: 'Database connection pool exhausted',
    details:
      'FATAL: connection limit exceeded for non-replication connection roles. Max connections reached: 100. Stacktrace:\n  at pg.Pool.connect (node_modules/pg/lib/pool.js:12:5)\n  at processTicksAndRejections (node:internal/process/task_queues:95:5)',
    timestamp: '10 mins ago',
    severity: 'critical',
    tag: 'P0 Critical',
    badgeClass: 'badge-danger',
    status: 'pending',
  },
  {
    id: 'tr-02',
    source: 'Webhook',
    event: 'Stripe signature verification failed',
    details:
      'Failed validation on event payload. Check signing secret key matches environment parameter configuration. Signature: t=1622629124,v1=abc',
    timestamp: '24 mins ago',
    severity: 'high',
    tag: 'P1 High',
    badgeClass: 'badge-warning',
    status: 'pending',
  },
  {
    id: 'tr-03',
    source: 'Sentry',
    event: "TypeError: Cannot read properties of undefined (reading 'map')",
    details:
      'Occurred inside client product display rendering logic. Data stream loaded with empty dataset array. Stacktrace:\n  at ProductGrid.render (src/components/ProductGrid.js:45:21)',
    timestamp: '1 hour ago',
    severity: 'medium',
    tag: 'P2 Medium',
    badgeClass: 'badge-outline',
    status: 'pending',
  },
];

window.state.selectedTriageLogId = window.state.selectedTriageLogId || 'tr-01';

window.initTriage = function () {
  window.renderTriage();
};

window.renderTriage = function () {
  const container = document.getElementById('triage-container');
  if (!container) return;

  const logs = window.state.triageInbox;
  const activeLogId = window.state.selectedTriageLogId;
  const activeLog = logs.find((l) => l.id === activeLogId) || logs[0];

  if (logs.length === 0) {
    container.innerHTML = `
      <div style="grid-column: span 2; padding: 40px; text-align: center; color: var(--text-muted);">
        <h3>All clear! Triage Inbox is empty.</h3>
        <p style="margin-top: 10px; font-size: 0.85rem;">No active exceptions or webhook errors are currently queued.</p>
      </div>
    `;
    return;
  }

  const logsHtml = logs
    .map((log) => {
      const isActive = activeLog && log.id === activeLog.id;
      return `
      <div class="triage-log-card ${isActive ? 'active' : ''}" onclick="window.selectTriageLog('${log.id}')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <span style="font-weight: 600; font-size: 0.8rem; color: var(--accent-purple);">${log.source}</span>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${log.timestamp}</span>
        </div>
        <div style="font-weight: 500; font-size: 0.82rem; margin-bottom: 8px; line-height: 1.3;">${log.event}</div>
        <div>
          <span class="badge ${log.badgeClass || 'badge-outline'}">${log.tag}</span>
        </div>
      </div>
    `;
    })
    .join('');

  let detailHtml = '';
  if (activeLog) {
    detailHtml = `
      <div style="border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-md); margin-bottom: var(--space-md);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; font-size: 0.9rem; color: var(--accent-purple);">${activeLog.source} Telemetry Log</span>
          <span class="badge ${activeLog.badgeClass || 'badge-outline'}">${activeLog.tag}</span>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 600; line-height: 1.4; color: var(--text-primary);">${activeLog.event}</h3>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Received ${activeLog.timestamp}</div>
      </div>
      
      <div style="flex: 1; min-height: 0; display: flex; flex-direction: column;">
        <label style="font-weight: 600; font-size: 0.78rem; display: block; margin-bottom: 6px; color: var(--text-secondary);">Stacktrace & Payload</label>
        <pre style="flex: 1; background: var(--bg-panel-dark); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; font-family: var(--font-mono); font-size: 0.75rem; color: #a5b4fc; overflow: auto; white-space: pre-wrap; word-break: break-all;">${activeLog.details}</pre>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: var(--space-md);">
        <button class="btn btn-primary btn-sm" onclick="window.triagePushToBacklog('${activeLog.id}')" style="width: 100%;">Push to Backlog</button>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline btn-sm" onclick="window.triageReject('${activeLog.id}')" style="flex: 1;">Reject</button>
          <button class="btn btn-outline btn-sm" onclick="window.triageRequestIntel('${activeLog.id}')" style="flex: 1;">Request Agent Intel</button>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="triage-logs-col">${logsHtml}</div>
    <div class="triage-detail-col">${detailHtml}</div>
  `;
};

window.selectTriageLog = function (id) {
  window.state.selectedTriageLogId = id;
  window.renderTriage();
};

window.triagePushToBacklog = function (id) {
  const logs = window.state.triageInbox;
  const log = logs.find((l) => l.id === id);
  if (!log) return;

  const newTask = {
    id: `task-${Date.now().toString().slice(-4)}`,
    title: `Fix: ${log.event}`,
    desc: log.details,
    status: 'backlog',
    assignee: 'coder1',
    priority: log.severity === 'critical' ? 5 : log.severity === 'high' ? 4 : 3,
    complexity: 'medium',
    duration: 'Pending allocation',
    attempts: '0 / 3',
    tags: ['#bug', log.source.toLowerCase()],
    deps: [],
    output: '',
  };

  window.state.tasks.push(newTask);
  window.state.triageInbox = window.state.triageInbox.filter((l) => l.id !== id);

  if (window.state.triageInbox.length > 0) {
    window.state.selectedTriageLogId = window.state.triageInbox[0].id;
  } else {
    window.state.selectedTriageLogId = null;
  }

  window.addLog('system', 'success', `Pushed log issue as task [${newTask.id}] to backlog.`);

  if (typeof window.renderKanban === 'function') window.renderKanban();
  window.renderTriage();
};

window.triageReject = function (id) {
  const log = window.state.triageInbox.find((l) => l.id === id);
  if (!log) return;

  window.state.triageInbox = window.state.triageInbox.filter((l) => l.id !== id);

  if (window.state.triageInbox.length > 0) {
    window.state.selectedTriageLogId = window.state.triageInbox[0].id;
  } else {
    window.state.selectedTriageLogId = null;
  }

  window.addLog('system', 'info', `Rejected live exception telemetry: ${log.event}`);
  window.renderTriage();
};

window.triageRequestIntel = function (id) {
  const log = window.state.triageInbox.find((l) => l.id === id);
  if (!log) return;

  window.addLog(
    'system',
    'info',
    `Dispatched Recon Scout agent to inspect diagnostics for exception: ${log.event}`,
  );
};
