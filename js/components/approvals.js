/* ============================================================
   CoNinja Shadow Swarm — Human Approval Governance Center
   Queue-based approval system for deployments, security, costs
   ============================================================ */

(function () {
  'use strict';

  const getTypeIcon = (type) => {
    const map = {
      deployment: 'lock',
      security: 'shield',
      cost: 'diamond',
      architecture: 'square',
      destructive: 'alert',
      rollback: 'revert',
      model_switch: 'refresh',
    };
    const iconName = map[type] || 'diamond';
    return window.ninjaIcons ? window.ninjaIcons.get(iconName) : '◈';
  };

  const RISK_COLORS = {
    low: '#4CAF50',
    medium: '#ff9800',
    high: '#ef4444',
    critical: '#9c27b0',
  };

  function getRiskScore(level) {
    if (level === 'low') return 15;
    if (level === 'medium') return 48;
    if (level === 'high') return 82;
    return 98;
  }

  function getRiskPercent(level) {
    if (level === 'low') return 15;
    if (level === 'medium') return 48;
    if (level === 'high') return 82;
    return 98;
  }

  function getRiskImpactDescription(level) {
    if (level === 'low') return 'Negligible (VRAM threshold adjustments)';
    if (level === 'medium') return 'Moderate (Staging/Routine provider changes)';
    if (level === 'high') return 'Significant (Schema change / API interruption)';
    return 'Severe (Potential downtime on Production services)';
  }

  function getEscalationChain(type) {
    if (type === 'cost') return 'Requester → Sensei';
    if (type === 'deployment' || type === 'rollback') return 'Requester → DevOps → Shadow Master';
    if (type === 'security') return 'Stealth Auditor → Grandmaster → Shadow Master';
    return 'Requester → Grandmaster → Council';
  }

  function getStatusIcon() {
    return window.ninjaIcons ? window.ninjaIcons.get('check') : '◈';
  }

  window.renderApprovals = function () {
    const container = document.getElementById('approvals-container');
    if (!container) return;

    const { queue, history, delegationRules } = window.state.approvals;
    const pendingCount = queue.filter((a) => a.status === 'pending').length;
    const ic = (n) => (window.ninjaIcons ? window.ninjaIcons.get(n) : '◈');

    container.innerHTML = `
      <div class="approvals-layout">
        <div class="approvals-stats-header">
          <div class="approval-stats">
            <div class="stat-card">
              <span class="stat-value pending" id="queue-pending-count">${pendingCount}</span>
              <span class="stat-label">Pending</span>
            </div>
            <div class="stat-card">
              <span class="stat-value approved">${history.filter((h) => h.status === 'approved').length}</span>
              <span class="stat-label">Approved</span>
            </div>
            <div class="stat-card">
              <span class="stat-value rejected">${history.filter((h) => h.status === 'rejected').length}</span>
              <span class="stat-label">Rejected</span>
            </div>
          </div>
        </div>

        <div class="approvals-grid-main">
          <div class="approvals-queue-section">
            <h3>Approval Requests Queue</h3>
            ${
              queue.length === 0
                ? `
              <div class="empty-queue" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; text-align:center; background:rgba(255,255,255,0.01); border:1px dashed var(--border-color); border-radius:var(--radius-lg); margin-top:12px;">
                <div class="empty-icon" style="margin-bottom: 12px; color: #4CAF50;">
                  <svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px;">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 12 15 16 10"/>
                  </svg>
                </div>
                <p style="font-size:0.85rem; color:var(--text-muted);">No pending approvals. Swarm is fully autonomous!</p>
              </div>
            `
                : `
              <div class="approvals-table-container">
                <table class="approvals-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Request</th>
                      <th>Risk</th>
                      <th>Requester</th>
                      <th>Deadline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${queue
                      .map(
                        (a) => `
                      <tr class="approval-row risk-${a.riskLevel}" data-id="${a.id}">
                        <td class="cell-type">
                          <span class="type-icon">${getTypeIcon(a.type)}</span>
                          <span class="type-name">${formatType(a.type)}</span>
                        </td>
                        <td class="cell-title">
                          <div class="approval-title">${a.title}</div>
                          <div class="approval-desc">${a.description}</div>
                          ${a.affectedSystems ? `<div class="affected-systems">${a.affectedSystems.join(', ')}</div>` : ''}
                        </td>
                        <td class="cell-risk">
                          <span class="risk-badge" style="background: ${RISK_COLORS[a.riskLevel]}20; color: ${RISK_COLORS[a.riskLevel]}">
                            ${a.riskLevel.toUpperCase()}
                          </span>
                        </td>
                        <td class="cell-requester">
                          <span>${a.requester}</span>
                          <span class="reviewer-tag">${a.assignedReviewer || 'Unassigned'}</span>
                        </td>
                        <td class="cell-deadline">
                          ${a.deadline ? `<span class="deadline ${getDeadlineClass(a.deadline)}">${getDeadlineLabel(a.deadline)}${formatDeadline(a.deadline) !== 'OVERDUE' ? `: ${formatDeadline(a.deadline)}` : ''}</span>` : '<span class="no-deadline">—</span>'}
                        </td>
                        <td class="cell-actions">
                          <button class="btn btn-success btn-xs" data-action="approve" data-id="${a.id}" title="Approve">${ic('check')}</button>
                          <button class="btn btn-danger btn-xs" data-action="reject" data-id="${a.id}" title="Reject">${ic('circle')}</button>
                          <button class="btn btn-outline btn-xs" data-action="defer" data-id="${a.id}" title="Defer">${ic('pause')}</button>
                        </td>
                      </tr>
                    `,
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
              <div class="queue-list" style="display:none;">
                ${queue
                  .map(
                    (a) => `
                  <div class="approval-card risk-${a.riskLevel}" data-id="${a.id}">
                    <div class="approval-card-header">
                      <div class="approval-type">
                        <span class="type-icon">${getTypeIcon(a.type)}</span>
                        <span class="type-name">${formatType(a.type)}</span>
                      </div>
                      <div class="approval-risk">
                        <span class="risk-badge" style="background: ${RISK_COLORS[a.riskLevel]}20; color: ${RISK_COLORS[a.riskLevel]}">
                          ${a.riskLevel.toUpperCase()} RISK
                        </span>
                      </div>
                    </div>
                    <div class="approval-body">
                      <div class="approval-title">${a.title}</div>
                      <div class="approval-desc">${a.description}</div>
                      
                      <div class="risk-analysis-container" style="margin: 12px 0; padding: 12px; background: rgba(0,0,0,0.15); border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.03);">
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">
                          <span>Risk Score Index:</span>
                          <span style="font-weight:700; color:${RISK_COLORS[a.riskLevel]}">${getRiskScore(a.riskLevel)}/100</span>
                        </div>
                        <div class="risk-meter-bar" style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                          <div style="height:100%; width:${getRiskPercent(a.riskLevel)}%; background:${RISK_COLORS[a.riskLevel]}"></div>
                        </div>
                        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:6px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px;">
                          <span>Impact: <strong style="color:var(--text-secondary);">${getRiskImpactDescription(a.riskLevel)}</strong></span>
                          <span>Chain: <strong style="color:var(--text-secondary);">${getEscalationChain(a.type)}</strong></span>
                        </div>
                      </div>

                      <div class="approval-details-box">
                        <div class="detail-row"><strong>Affected Systems:</strong> <span>${a.affectedSystems.join(', ')}</span></div>
                        ${
                          a.changes && a.changes.commits
                            ? `
                          <div class="detail-row"><strong>Scope Changes:</strong> <span>${a.changes.commits} commits, ${a.changes.files} files (+${a.changes.additions}/-${a.changes.deletions})</span></div>
                        `
                            : ''
                        }
                        ${
                          a.changes && a.changes.oldLimit
                            ? `
                          <div class="detail-row"><strong>Threshold Delta:</strong> <span>$${a.changes.oldLimit.toFixed(2)} → $${a.changes.newLimit.toFixed(2)}</span></div>
                        `
                            : ''
                        }
                        ${
                          a.changes && a.changes.table
                            ? `
                          <div class="detail-row"><strong>Target Table:</strong> <span>${a.changes.table}</span></div>
                          <div class="detail-row"><strong>Migration script:</strong> <span style="font-family:var(--font-mono); font-size:0.75rem;">${a.changes.migrationFile}</span></div>
                          <div class="detail-row"><strong>Safety Index:</strong> <span style="color:#4CAF50; font-weight:600;">${a.changes.safetyIndex}/100</span></div>
                        `
                            : ''
                        }
                        ${
                          a.changes && a.changes.fromVersion
                            ? `
                          <div class="detail-row"><strong>Rollback:</strong> <span>${a.changes.fromVersion} → ${a.changes.toVersion}</span></div>
                          <div class="detail-row"><strong>Reason:</strong> <span style="color:var(--accent-error);">${a.changes.triggerReason}</span></div>
                        `
                            : ''
                        }
                        ${
                          a.changes && a.changes.oldProvider
                            ? `
                          <div class="detail-row"><strong>Switch Route:</strong> <span>${a.changes.oldProvider} → ${a.changes.newProvider}</span></div>
                        `
                            : ''
                        }
                      </div>
                    </div>

                    <div class="approval-meta" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                      <span class="requester">${ic('diamond')} Sourced by ${a.requester}</span>
                      <span class="requested">${formatTime(a.requestedAt)}</span>
                      <div class="reviewer-assignment">
                        <button class="btn btn-outline btn-xs btn-assign-reviewer" data-id="${a.id}" style="padding: 2px 8px; font-size: 0.7rem;">
                          ${ic('diamond')} Reviewer: ${a.assignedReviewer || 'Unassigned'}
                        </button>
                      </div>
                      ${a.deadline ? `<span class="deadline ${getDeadlineClass(a.deadline)}" style="font-size: 0.72rem;">${ic('clock')} ${getDeadlineLabel(a.deadline)}${formatDeadline(a.deadline) !== 'OVERDUE' ? `: ${formatDeadline(a.deadline)}` : ''}</span>` : ''}
                    </div>

                    <div class="approval-actions" style="margin-top: 12px;">
                      <button class="btn btn-success btn-sm" data-action="approve" data-id="${a.id}">${ic('check')} Enforce</button>
                      <button class="btn btn-danger btn-sm" data-action="reject" data-id="${a.id}">${ic('circle')} Reject</button>
                      <button class="btn btn-outline btn-sm" data-action="defer" data-id="${a.id}">${ic('pause')} Defer</button>
                    </div>
                  </div>
                `,
                  )
                  .join('')}
              </div>
            `
            }
          </div>

          <div class="approvals-sidebar-panel">
            <div class="glass-card delegation-rules" style="margin-bottom: 16px;">
              <h3>Delegation Rules Matrix</h3>
              <div class="rules-list">
                ${delegationRules
                  .map(
                    (r, i) => `
                  <div class="rule-item">
                    <div class="rule-info">
                      <span class="rule-type">${getTypeIcon(r.type)} ${formatType(r.type)}</span>
                      <span class="rule-env">on [${r.env}]</span>
                    </div>
                    <div class="rule-requirements">
                      ${r.autoApprove ? `<span class="rule-auto">${ic('check')} Auto</span>` : `<span class="rule-manual">${ic('circle')} Manual</span>`}
                      ${r.maxRisk ? `<span class="max-risk" style="font-size:0.65rem; color:var(--text-muted); border:1px solid rgba(255,255,255,0.05); border-radius:4px; padding:1px 4px;">Risk ≤ ${r.maxRisk}</span>` : ''}
                    </div>
                  </div>
                `,
                  )
                  .join('')}
              </div>
              <button class="btn btn-outline btn-xs" id="btn-add-delegation-rule" style="width:100%; margin-top:12px;">+ Add Delegation Rule</button>
            </div>

            <div class="glass-card history-card">
              <h3>Governance History Trail</h3>
              <div class="history-list">
                ${
                  history.length === 0
                    ? `
                  <div style="display:flex; flex-direction:column; align-items:center; padding:24px; text-align:center;">
                    <svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;height:40px;color:var(--text-muted);margin-bottom:12px;">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    <p style="font-size:0.75rem; color:var(--text-muted);">No historical records compiled.</p>
                    <p style="font-size:0.7rem; color:var(--text-muted); margin-top:4px;">Approved or rejected actions will appear here.</p>
                  </div>
                `
                    : history
                        .slice(0, 8)
                        .map(
                          (h) => `
                  <div class="history-item ${h.status}">
                    <span class="history-icon">${h.status === 'approved' ? ic('check') : ic('circle')}</span>
                    <div class="history-info">
                      <div class="history-title">${h.title}</div>
                      <div class="history-meta">${formatType(h.type)} • Resolved by ${h.resolvedBy || h.approvedBy || 'System'}</div>
                    </div>
                  </div>
                `,
                        )
                        .join('')
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Re-check notification badges
    const badge = document.getElementById('approval-badge-count');
    if (badge) {
      badge.textContent = pendingCount;
      badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }

    attachListeners();
    injectStyles();
  };

  function formatType(type) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  }

  function formatDeadline(deadline) {
    const date = new Date(deadline);
    const now = new Date();
    const diff = Math.floor((date - now) / 1000 / 60);
    if (diff < 0) return 'OVERDUE';
    if (diff < 60) return `${diff}m left`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h left`;
    return `${Math.floor(diff / 1440)}d left`;
  }

  function getDeadlineClass(deadline) {
    const date = new Date(deadline);
    const now = new Date();
    const diff = Math.floor((date - now) / 1000 / 60);
    if (diff < 0) return 'deadline-overdue';
    if (diff < 240) return 'deadline-soon'; // 4 hours = due soon
    return 'deadline-normal';
  }

  function getDeadlineLabel(deadline) {
    const date = new Date(deadline);
    const now = new Date();
    const diff = Math.floor((date - now) / 1000 / 60);
    if (diff < 0) return '⚠ OVERDUE';
    if (diff < 240) return '⏰ DUE SOON';
    return 'Due';
  }

  function attachListeners() {
    // Add delegation rules
    const addRuleBtn = document.getElementById('btn-add-delegation-rule');
    if (addRuleBtn) {
      addRuleBtn.addEventListener('click', () => {
        window.showConfirmDialog(
          'Inscribe Delegation Rule',
          `<div style="text-align:left; display:flex; flex-direction:column; gap:8px;">
             <div>
               <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Operation Type:</label>
               <select id="rule-input-type" class="form-input text-xs" style="width:100%;">
                 <option value="deployment">Deployment</option>
                 <option value="security">Security Exceptions</option>
                 <option value="cost">Budget Thresholds</option>
                 <option value="architecture">Architecture Changes</option>
                 <option value="rollback">Rollbacks</option>
                 <option value="model_switch">Provider Switches</option>
               </select>
             </div>
             <div>
               <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Environment Scope:</label>
               <select id="rule-input-env" class="form-input text-xs" style="width:100%;">
                 <option value="staging">Staging Dojo</option>
                 <option value="production">Production Shadow</option>
                 <option value="local">Local sandbox</option>
               </select>
             </div>
             <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
               <input type="checkbox" id="rule-input-auto" class="form-checkbox">
               <label for="rule-input-auto" style="font-size:0.75rem; color:var(--text-secondary); cursor:pointer;">Auto-approve operations</label>
             </div>
           </div>`,
          () => {
            const type = document.getElementById('rule-input-type').value;
            const env = document.getElementById('rule-input-env').value;
            const autoApprove = document.getElementById('rule-input-auto').checked;

            window.state.approvals.delegationRules.push({
              type,
              env,
              autoApprove,
              maxRisk: autoApprove ? 'low' : null,
            });

            window.dispatch('ADD_LOG', {
              agent: 'orchestrator',
              type: 'success',
              msg: `Configured delegation rule: Auto-Approve=${autoApprove} for ${type} on [${env}].`,
            });
            window.renderApprovals();
            window.showToast('Delegation rules updated!', 'success');
          },
        );
      });
    }

    // Reviewer Assignment
    document.querySelectorAll('.btn-assign-reviewer').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const approval = window.state.approvals.queue.find((a) => a.id === id);
        if (!approval) return;

        const activeAgents = Object.values(window.state.agents);
        const optionsHtml = activeAgents
          .map((ag) => `<option value="${ag.name}">${ag.name} (${ag.role})</option>`)
          .join('');

        window.showConfirmDialog(
          'Assign Reviewer',
          `<div style="text-align:left;">
             <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Select Shinobi Reviewer:</label>
             <select id="assign-reviewer-select" class="form-input text-xs" style="width:100%;">
               ${optionsHtml}
             </select>
           </div>`,
          () => {
            const select = document.getElementById('assign-reviewer-select');
            const selectedReviewer = select ? select.value : 'Sensei';
            approval.assignedReviewer = selectedReviewer;

            window.dispatch('ADD_LOG', {
              agent: 'system',
              type: 'info',
              msg: `DELEGATED review authority for "${approval.title}" to ${selectedReviewer}.`,
            });
            window.renderApprovals();
            window.showToast(`Review delegated to ${selectedReviewer}`, 'success');
          },
        );
      });
    });

    document.querySelectorAll('.approval-actions .btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const approval = window.state.approvals.queue.find((a) => a.id === id);
        if (!approval) return;

        if (action === 'approve') {
          window.showConfirmDialog(
            'Enforce Request',
            `Approve and execute: "${approval.title}"?`,
            () => {
              executeApprovalSideEffects(approval);
              window.dispatch('APPROVAL_RESOLVE', {
                approvalId: id,
                approved: true,
                resolver: 'You',
              });
              window.renderApprovals();
              window.showToast('Decree enforced!', 'success');
            },
          );
        } else if (action === 'reject') {
          window.showConfirmDialog(
            'Reject Proposal',
            `Are you sure you want to reject: "${approval.title}"?`,
            () => {
              window.dispatch('APPROVAL_RESOLVE', {
                approvalId: id,
                approved: false,
                resolver: 'You',
              });
              window.dispatch('ADD_LOG', {
                agent: 'orchestrator',
                type: 'error',
                msg: `REJECTED proposed action: "${approval.title}"`,
              });
              window.renderApprovals();
              window.showToast('Decree rejected', 'warning');
            },
            true,
          );
        } else if (action === 'defer') {
          window.showToast(`Deferred approval request: ${approval.title}`, 'info');
          window.dispatch('ADD_LOG', {
            agent: 'orchestrator',
            type: 'info',
            msg: `DEFERRED proposed decision: "${approval.title}"`,
          });
        }
      });
    });
  }

  // Executes state store changes based on what was approved
  function executeApprovalSideEffects(approval) {
    // 1. Cost limit increases
    if (approval.type === 'cost' && approval.changes && approval.changes.newLimit) {
      window.dispatch('UPDATE_SETTING', { key: 'dailyLimit', value: approval.changes.newLimit });
      window.dispatch('ADD_LOG', {
        agent: 'system',
        type: 'success',
        msg: `Daily VRAM limit threshold raised to $${approval.changes.newLimit.toFixed(2)}`,
      });
      if (typeof window.renderMetrics === 'function') window.renderMetrics();
    }

    // 2. Deployments
    if (approval.type === 'deployment') {
      window.dispatch('TRIGGER_DEPLOYMENT', {
        envId: 'production',
        version: 'v0.4.2',
        changelog: approval.description,
      });
      window.dispatch('ADD_LOG', {
        agent: 'devops',
        type: 'info',
        msg: 'Chunin DevOps: Triggered release pipeline setup for v0.4.2.',
      });
    }

    // 3. Security switches
    if (approval.type === 'security') {
      window.state.security.score = 94;
      window.dispatch('ADD_LOG', {
        agent: 'security',
        type: 'success',
        msg: 'Stealth Auditor: Re-aligned algorithm to ES256. Code base security score elevated to 94/100.',
      });
      if (typeof window.renderSecurity === 'function') window.renderSecurity();
    }

    // 4. Architecture / Migration
    if (approval.type === 'architecture') {
      window.dispatch('ADD_LOG', {
        agent: 'architect',
        type: 'info',
        msg: 'Grandmaster (Arch): Commenced workspace migration transaction logic on production-db...',
      });
      setTimeout(() => {
        window.dispatch('ADD_LOG', {
          agent: 'system',
          type: 'success',
          msg: 'MIGRATION SUCCESS: Schema updated. Table "workspaces" cascade rules applied.',
        });
      }, 1200);
    }

    // 5. Rollback
    if (approval.type === 'rollback') {
      const targetVersion = approval.changes?.toVersion || 'v0.4.1';
      window.dispatch('ADD_LOG', {
        agent: 'devops',
        type: 'error',
        msg: `Chunin DevOps: ROLLBACK INITIATED. Reverting deployment state to ${targetVersion}...`,
      });

      const prodEnv = window.state.deployment.environments.find((e) => e.id === 'production');
      if (prodEnv) {
        prodEnv.version = targetVersion;
        prodEnv.healthScore = 100;
      }

      setTimeout(() => {
        window.dispatch('ADD_LOG', {
          agent: 'system',
          type: 'success',
          msg: `ROLLBACK COMPLETE: Production Shadow reverted to ${targetVersion} successfully.`,
        });
        if (typeof window.renderOpsRecovery === 'function') window.renderOpsRecovery();
      }, 1500);
    }

    // 6. Provider switch / model_switch
    if (approval.type === 'model_switch') {
      const newProvider = approval.changes?.newProvider || 'Gemini 1.5 Pro';
      window.state.agents.coder1.route = newProvider;
      window.dispatch('ADD_LOG', {
        agent: 'orchestrator',
        type: 'success',
        msg: `Swarm rebalancing complete: Jutsu Coder BE re-assigned base route to ${newProvider}.`,
      });
      if (typeof window.renderSwarmGraph === 'function') window.renderSwarmGraph();
    }
  }

  function injectStyles() {
    if (document.getElementById('approvals-styles-extended')) return;
    const style = document.createElement('style');
    style.id = 'approvals-styles-extended';
    style.textContent = `
      .approvals-layout { max-width: 100%; margin: 0 auto; height: 100%; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; padding-right: 6px; }
      .approvals-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .approval-stats { display: flex; gap: 16px; }
      .stat-card { text-align: center; padding: 12px 20px; background: rgba(255,255,255,0.03); border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.05); }
      .stat-value { display: block; font-size: 1.6rem; font-weight: 700; }
      .stat-value.pending { color: #ff9800; }
      .stat-value.approved { color: #4CAF50; }
      .stat-value.rejected { color: #ef4444; }
      .stat-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; }
      
      .approvals-grid-main { display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; min-width: 0; }
      .approvals-queue-section { min-width: 0; }
      .approvals-queue-section h3 { margin-bottom: 16px; font-size: 1rem; }
      
      .empty-queue { text-align: center; padding: 60px; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: var(--radius-lg); border: 1px dashed rgba(255,255,255,0.1); }
      .empty-queue .empty-icon { font-size: 3rem; margin-bottom: 16px; }
      
      .queue-list { display: flex; flex-direction: column; gap: 16px; }
      
      .approvals-table-container { overflow-x: auto; width: 100%; }
      .approvals-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
      .approvals-table th { text-align: left; padding: 8px 10px; background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border-color); font-weight: 600; color: var(--text-secondary); text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.05em; }
      .approvals-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
      .approvals-table tbody tr { transition: background-color 0.2s; }
      .approvals-table tbody tr:hover { background: rgba(255,255,255,0.02); }
      .approvals-table tbody tr.risk-high { border-left: 3px solid #ef4444; }
      .approvals-table tbody tr.risk-critical { border-left: 3px solid #9c27b0; }
      .approvals-table tbody tr.risk-medium { border-left: 3px solid #ff9800; }
      .approvals-table tbody tr.risk-low { border-left: 3px solid #4CAF50; }
      .cell-type { white-space: nowrap; }
      .cell-type .type-icon { margin-right: 6px; }
      .cell-type .type-name { font-weight: 500; }
      .cell-title .approval-title { font-weight: 600; margin-bottom: 4px; }
      .cell-title .approval-desc { color: var(--text-muted); font-size: 0.8rem; margin-bottom: 4px; }
      .cell-title .affected-systems { font-size: 0.75rem; color: var(--text-secondary); font-family: var(--font-mono); }
      .cell-risk { text-align: center; }
      .cell-requester { font-size: 0.8rem; }
      .cell-requester .reviewer-tag { display: block; font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
      .cell-deadline { white-space: nowrap; }
      .cell-deadline .no-deadline { color: var(--text-muted); }
      .cell-actions { white-space: nowrap; }
      .cell-actions .btn { padding: 4px 8px; margin-right: 4px; }
      .approval-card { background: rgba(255,255,255,0.03); border-radius: var(--radius-lg); padding: 20px; border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid; transition: transform 0.2s; }
      .approval-card:hover { transform: translateY(-2px); border-color: rgba(255,115,0,0.25); }
      .approval-card.risk-low { border-left-color: #4CAF50; }
      .approval-card.risk-medium { border-left-color: #ff9800; }
      .approval-card.risk-high { border-left-color: #ef4444; }
      .approval-card.risk-critical { border-left-color: #9c27b0; }
      
      .approval-card-header { display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center; }
      .approval-type { display: flex; align-items: center; gap: 8px; }
      .type-icon { font-size: 1.2rem; }
      .type-name { font-weight: 600; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; }
      .risk-badge { padding: 2px 10px; border-radius: 10px; font-size: 0.65rem; font-weight: 700; }
      .approval-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 6px; color: var(--text-primary); }
      .approval-desc { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 14px; line-height: 1.5; }
      
      .approval-details-box { background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.04); border-radius: var(--radius-md); padding: 12px; margin-bottom: 14px; font-size: 0.8rem; }
      .detail-row { display: flex; margin-bottom: 6px; }
      .detail-row:last-child { margin-bottom: 0; }
      .detail-row strong { width: 120px; color: var(--text-muted); }
      .detail-row span { flex: 1; color: var(--text-secondary); }
      
      .approval-meta { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 16px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; }
      .overdue-blink { animation: red-flash 1.5s infinite; color: #ef4444 !important; font-weight: 500; }
      .deadline-overdue { animation: red-flash 1.5s infinite; color: #ef4444 !important; font-weight: 600; background: rgba(239,68,68,0.1); padding: 2px 8px; border-radius: 4px; }
      .deadline-soon { color: #ff9800 !important; font-weight: 600; background: rgba(255,152,0,0.1); padding: 2px 8px; border-radius: 4px; }
      .deadline-normal { color: var(--text-muted) !important; }
      
      @keyframes red-flash {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .approval-actions { display: flex; gap: 8px; }
      
      .delegation-rules, .history-card { background: rgba(255,255,255,0.02); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.05); }
      .delegation-rules h3, .history-card h3 { margin: 0 0 16px 0; font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; }
      
      .rules-list { display: flex; flex-direction: column; gap: 8px; }
      .rule-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); font-size: 0.8rem; }
      .rule-info { display: flex; gap: 8px; align-items: center; }
      .rule-type { font-weight: 600; color: var(--text-secondary); }
      .rule-env { color: var(--text-muted); font-size: 0.75rem; }
      .rule-auto { padding: 2px 8px; background: rgba(76,175,80,0.15); color: #4CAF50; border-radius: 10px; font-size: 0.7rem; font-weight: 600; }
      .rule-manual { padding: 2px 8px; background: rgba(255,152,0,0.15); color: #ff9800; border-radius: 10px; font-size: 0.7rem; font-weight: 600; }
      .rule-requirements { display: flex; align-items: center; gap: 6px; }
      
      .history-list { display: flex; flex-direction: column; gap: 6px; }
      .history-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border-left: 3px solid; font-size: 0.8rem; }
      .history-item.approved { border-left-color: #4CAF50; }
      .history-item.rejected { border-left-color: #ef4444; }
      .history-icon { font-size: 1.1rem; }
      .history-info { flex: 1; }
      .history-title { font-weight: 600; color: var(--text-secondary); }
      .history-meta { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; }
    `;
    document.head.appendChild(style);
  }

  window.initApprovals = function () {
    window.renderApprovals();
  };

  console.warn('%c[CoNinja] Approval Governance loaded', 'color:#ff7300;font-weight:bold;');
})();
