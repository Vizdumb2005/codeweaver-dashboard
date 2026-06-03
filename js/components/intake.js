/* ============================================================
   CoNinja Shadow Swarm — Mission Intake Component
   Project requests, requirements gathering, mission queue
   ============================================================ */

(function () {
  'use strict';

  /* ── Mock intake requests ────────────────────────────────── */
  const INTAKE_REQUESTS = [
    {
      id: 'REQ-001',
      title: 'E-commerce Checkout Flow',
      requester: 'Product Team',
      priority: 'high',
      status: 'analyzing',
      created: '2026-05-29 09:00',
      description:
        'Build a complete checkout flow with Stripe integration, cart persistence, and order management.',
      estimatedTasks: 12,
      estimatedCost: '$2.50',
    },
    {
      id: 'REQ-002',
      title: 'User Dashboard Analytics',
      requester: 'Growth Team',
      priority: 'medium',
      status: 'queued',
      created: '2026-05-28 16:30',
      description:
        'Create analytics dashboard showing user engagement metrics, retention curves, and funnel analysis.',
      estimatedTasks: 8,
      estimatedCost: '$1.80',
    },
    {
      id: 'REQ-003',
      title: 'Mobile API Optimization',
      requester: 'Mobile Team',
      priority: 'high',
      status: 'approved',
      created: '2026-05-27 11:15',
      description:
        'Optimize API endpoints for mobile app - reduce payload sizes, add compression, implement pagination.',
      estimatedTasks: 6,
      estimatedCost: '$1.20',
    },
    {
      id: 'REQ-004',
      title: 'Notification Service',
      requester: 'Platform Team',
      priority: 'low',
      status: 'draft',
      created: '2026-05-26 14:00',
      description:
        'Build multi-channel notification service supporting email, SMS, push, and in-app notifications.',
      estimatedTasks: 15,
      estimatedCost: '$3.50',
    },
  ];

  /* ── Priority badge styles ───────────────────────────────── */
  const PRIORITY_BADGES = {
    high: { cls: 'badge-purple', label: 'High' },
    medium: { cls: 'badge-warning', label: 'Medium' },
    low: { cls: 'badge-outline', label: 'Low' },
  };

  /* ── Status badge styles ─────────────────────────────────── */
  const STATUS_BADGES = {
    draft: { cls: 'badge-outline', label: '◈ Draft' },
    analyzing: { cls: 'badge', label: '◈ Analyzing' },
    queued: { cls: 'badge-warning', label: '⏳ Queued' },
    approved: { cls: 'badge-success', label: '◈ Approved' },
    rejected: { cls: 'badge-purple', label: '◈ Rejected' },
  };

  /* ── Render intake dashboard ─────────────────────────────── */
  function renderIntake() {
    const container = document.getElementById('intake-container');
    if (!container) {
      console.warn('[Intake] No intake-container found, skipping render');
      return;
    }

    const analyzing = INTAKE_REQUESTS.filter((r) => r.status === 'analyzing');
    const queued = INTAKE_REQUESTS.filter((r) => r.status === 'queued');
    const approved = INTAKE_REQUESTS.filter((r) => r.status === 'approved');

    container.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:20px;">
        <div class="glass-card" style="text-align:center; padding:20px;">
          <div style="font-size:2rem; margin-bottom:8px;">◈</div>
          <div style="font-size:1.8rem; font-weight:800; color:#ff7300;">${INTAKE_REQUESTS.length}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">Total Requests</div>
        </div>
        <div class="glass-card" style="text-align:center; padding:20px;">
          <div style="font-size:2rem; margin-bottom:8px;">◈</div>
          <div style="font-size:1.8rem; font-weight:800; color:#00BCD4;">${analyzing.length}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">Under Analysis</div>
        </div>
        <div class="glass-card" style="text-align:center; padding:20px;">
          <div style="font-size:2rem; margin-bottom:8px;">⏳</div>
          <div style="font-size:1.8rem; font-weight:800; color:#ff9800;">${queued.length}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">In Queue</div>
        </div>
        <div class="glass-card" style="text-align:center; padding:20px;">
          <div style="font-size:2rem; margin-bottom:8px;">◈</div>
          <div style="font-size:1.8rem; font-weight:800; color:#4CAF50;">${approved.length}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">Approved</div>
        </div>
      </div>

      <div class="glass-card">
        <div style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.2rem;">◈</span>
            <div style="font-weight:700; font-size:0.95rem;">Mission Requests Queue</div>
          </div>
          <button class="btn btn-primary btn-sm" id="intake-new-request-btn">
            <svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Request
          </button>
        </div>
        <div style="overflow-x:auto;">
          <table class="provider-table" style="width:100%;">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mission Title</th>
                <th>Requester</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Est. Tasks</th>
                <th>Est. Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${INTAKE_REQUESTS.map(
                (req) => `
                <tr>
                  <td style="font-family:var(--font-mono); font-size:0.8rem; color:var(--accent-cyan);">${req.id}</td>
                  <td style="font-weight:500;">${req.title}</td>
                  <td style="font-size:0.8rem;">${req.requester}</td>
                  <td><span class="badge ${PRIORITY_BADGES[req.priority].cls}">${PRIORITY_BADGES[req.priority].label}</span></td>
                  <td><span class="badge ${STATUS_BADGES[req.status].cls}">${STATUS_BADGES[req.status].label}</span></td>
                  <td style="font-size:0.78rem; color:var(--text-muted);">${req.created}</td>
                  <td style="text-align:center;">${req.estimatedTasks}</td>
                  <td style="font-weight:600; color:#ff7300;">${req.estimatedCost}</td>
                  <td>
                    <button class="btn btn-outline btn-sm" style="padding:2px 8px; font-size:0.7rem;" onclick="window.viewIntakeRequest('${req.id}')">View</button>
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
  }

  /* ── View request detail ─────────────────────────────────── */
  window.viewIntakeRequest = function (requestId) {
    const req = INTAKE_REQUESTS.find((r) => r.id === requestId);
    if (!req) return;

    if (typeof window.showConfirmDialog === 'function') {
      window.showConfirmDialog(
        `◈ ${req.id}: ${req.title}`,
        `<div style="text-align:left; line-height:1.6;">
          <p><strong>Requester:</strong> ${req.requester}</p>
          <p><strong>Priority:</strong> ${PRIORITY_BADGES[req.priority].label}</p>
          <p><strong>Status:</strong> ${STATUS_BADGES[req.status].label}</p>
          <p><strong>Created:</strong> ${req.created}</p>
          <hr style="border-color:rgba(255,255,255,0.1); margin:12px 0;">
          <p><strong>Description:</strong></p>
          <p style="color:var(--text-secondary);">${req.description}</p>
          <hr style="border-color:rgba(255,255,255,0.1); margin:12px 0;">
          <p><strong>Estimated Tasks:</strong> ${req.estimatedTasks}</p>
          <p><strong>Estimated Cost:</strong> <span style="color:#ff7300;">${req.estimatedCost}</span></p>
        </div>`,
        () => {
          if (typeof window.showToast === 'function') {
            window.showToast(`Request ${req.id} approved for execution`, 'success');
          }
        },
        'Approve Mission',
        'Close',
      );
    }
  };

  /* ── Attach event listeners ──────────────────────────────── */
  function attachListeners() {
    const newBtn = document.getElementById('intake-new-request-btn');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        if (typeof window.showToast === 'function') {
          window.showToast('Opening mission request form...', 'info');
        }
        const modal = document.getElementById('project-wizard-modal');
        if (modal) {
          modal.classList.add('active');
          if (typeof window.resetWizard === 'function') window.resetWizard();
        }
      });
    }
  }

  /* ── Expose to window ────────────────────────────────────── */
  window.renderIntake = renderIntake;
  window.initIntake = function () {
    renderIntake();
  };

  console.warn('%c[CoNinja] Mission Intake loaded ◈', 'color:#ff7300;font-weight:bold;');
})();
