/* ============================================================
   CoNinja Shadow Swarm — Workflow Pipeline Component
   Visual pipeline editor, dependency chain, escalation rules
   ============================================================ */

(function () {
  'use strict';

  /* ── Default workflow state (used if window.state.workflow is absent) ── */
  const DEFAULT_WORKFLOW = {
    stages: [
      {
        id: 'intake',
        name: 'Intake Scroll',
        color: '#00BCD4',
        approvalRequired: false,
        tasks: ['Receive requirements', 'Parse user story', 'Create task manifest'],
        rollbackCheckpoint: true,
      },
      {
        id: 'design',
        name: 'Architecture Design',
        color: '#9C27B0',
        approvalRequired: true,
        tasks: ['System blueprint', 'API contract', 'DB schema review'],
        rollbackCheckpoint: true,
      },
      {
        id: 'implementation',
        name: 'Code Forge',
        color: '#ff7300',
        approvalRequired: false,
        tasks: ['Implement features', 'Write unit tests', 'Code review'],
        rollbackCheckpoint: true,
      },
      {
        id: 'testing',
        name: 'Testing Dojo',
        color: '#4CAF50',
        approvalRequired: true,
        tasks: ['Run unit tests', 'E2E test suite', 'Performance profiling'],
        rollbackCheckpoint: true,
      },
      {
        id: 'security',
        name: 'Shadow Audit',
        color: '#ef4444',
        approvalRequired: true,
        tasks: ['Vuln scan', 'Dependency audit', 'Penetration test'],
        rollbackCheckpoint: false,
      },
      {
        id: 'deployment',
        name: 'Shadow Deploy',
        color: '#4CAF50',
        approvalRequired: true,
        tasks: ['Build artifact', 'Deploy to staging', 'Smoke tests', 'Production release'],
        rollbackCheckpoint: true,
      },
    ],
    dependencies: [
      { from: 'intake', to: 'design' },
      { from: 'design', to: 'implementation' },
      { from: 'implementation', to: 'testing' },
      { from: 'testing', to: 'security' },
      { from: 'security', to: 'deployment' },
    ],
    escalation: {
      timeout: 30,
      notify: 'lead',
      fallbackAgent: 'agent-001',
    },
    autonomyPolicy: 'advisory',
    retry: {
      maxRetries: 3,
      backoffSeconds: 15,
    },
  };

  /* ── Helpers ─────────────────────────────────────────────── */
  function getWorkflow() {
    return window.state && window.state.workflow ? window.state.workflow : DEFAULT_WORKFLOW;
  }

  function dispatchWorkflow(action, payload) {
    if (typeof window.dispatch === 'function') {
      window.dispatch(action, payload);
    }
  }

  function toast(msg, type) {
    if (typeof window.showToast === 'function') window.showToast(msg, type || 'success');
  }

  /* ── Pipeline Overview Stats ─────────────────────────────── */
  function buildPipelineStats(wf) {
    const gateCount = wf.stages.filter((s) => s.approvalRequired).length;
    const depCount = (wf.dependencies || []).length;
    const autonomyMap = { full: '◈ Full', advisory: '◈ Advisory', approval: '◈ Gated' };
    const autonomyDisp = autonomyMap[wf.autonomyPolicy] || wf.autonomyPolicy || '—';

    const cards = [
      { label: 'Total Stages', value: wf.stages.length, icon: '◈️', color: 'var(--accent-cyan)' },
      { label: 'Approval Gates', value: gateCount, icon: '◈', color: 'var(--accent-orange)' },
      { label: 'Active Dependencies', value: depCount, icon: '◈', color: 'var(--accent-purple)' },
      { label: 'Autonomy Level', value: autonomyDisp, icon: '◈', color: 'var(--accent-green)' },
    ];

    return `
      <div class="wf-stat-bar">
        ${cards
          .map(
            (c) => `
          <div class="wf-stat-card glass-card">
            <div class="wf-stat-icon" style="color:${c.color};">${c.icon}</div>
            <div class="wf-stat-value" style="color:${c.color};">${c.value}</div>
            <div class="wf-stat-label">${c.label}</div>
          </div>`,
          )
          .join('')}
      </div>`;
  }

  /* ── Visual Pipeline Editor ──────────────────────────────── */
  function buildStageCard(stage, index) {
    const gateIcon = stage.approvalRequired ? '◈' : '◈';
    const gateLabel = stage.approvalRequired ? 'Approval Required' : 'Auto-proceed';
    const taskItems = (stage.tasks || [])
      .slice(0, 4)
      .map((t) => `<li class="wf-stage-task-item">▸ ${t}</li>`)
      .join('');
    const moreCount = (stage.tasks || []).length - 4;
    const moreLine =
      moreCount > 0 ? `<li class="wf-stage-task-more">+${moreCount} more scrolls…</li>` : '';
    const arrowNext =
      index < getWorkflow().stages.length - 1 ? '<div class="wf-stage-arrow">→</div>' : '';

    return `
      <div class="wf-stage-col" data-stage-id="${stage.id}">
        <div class="wf-stage-card glass-card" draggable="true">
          <div class="wf-stage-accent-bar" style="background:${stage.color};"></div>
          <div class="wf-stage-header">
            <span style="display:flex; align-items:center;">
              <span class="wf-stage-drag-handle">
                <svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="width:12px; height:12px;">
                  <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
                  <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
                </svg>
              </span>
              <span class="wf-stage-name">${stage.name}</span>
            </span>
            <span class="wf-stage-gate-badge ${stage.approvalRequired ? 'gate-locked' : 'gate-open'}"
              title="${gateLabel}">${gateIcon}</span>
          </div>
          <ul class="wf-stage-task-list">
            ${taskItems}${moreLine}
          </ul>
          <div class="wf-stage-footer">
            <label class="wf-gate-toggle-label">
              <input type="checkbox" class="wf-gate-toggle" data-stage-id="${stage.id}"
                ${stage.approvalRequired ? 'checked' : ''} />
              <span>Gate</span>
            </label>
            <span class="wf-task-count">${(stage.tasks || []).length} tasks</span>
          </div>
        </div>
        ${arrowNext}
      </div>`;
  }

  function buildPipelineEditor(wf) {
    return `
      <div class="wf-pipeline-section glass-card">
        <div class="panel-header" style="padding-bottom:14px;">
          <h3 class="wf-section-title">◈️ Pipeline Stages</h3>
          <button id="wf-add-stage-btn" class="btn btn-sm btn-outline">+ Add Stage</button>
        </div>
        <div class="wf-pipeline-scroll">
          <div class="wf-pipeline-track">
            ${wf.stages.map((s, i) => buildStageCard(s, i)).join('')}
          </div>
        </div>
      </div>`;
  }

  /* ── Dependency Chain Panel ──────────────────────────────── */
  function buildDependencyChain(wf) {
    const deps = wf.dependencies || [];
    if (!deps.length) return '';

    const chain = [];
    /* Build ordered chain from first dep */
    let cursor = deps[0] ? deps[0].from : null;
    const visited = new Set();
    while (cursor && !visited.has(cursor)) {
      visited.add(cursor);
      chain.push(cursor);
      const next = deps.find((d) => d.from === cursor);
      cursor = next ? next.to : null;
    }
    if (cursor && !visited.has(cursor)) chain.push(cursor);

    const chainHtml = chain
      .map((id, i) => {
        const stage = wf.stages.find((s) => s.id === id);
        const name = stage ? stage.name : id;
        const color = stage ? stage.color : '#aaa';
        const arrow = i < chain.length - 1 ? '<span class="wf-dep-arrow">→</span>' : '';
        return `<span class="wf-dep-node" style="border-color:${color};color:${color};">${name}</span>${arrow}`;
      })
      .join('');

    return `
      <div class="wf-panel-card glass-card">
        <div class="panel-header" style="padding-bottom:12px;">
          <h3 class="wf-section-title">◈ Dependency Chain</h3>
        </div>
        <div class="wf-dep-chain">${chainHtml}</div>
        <p class="wf-dep-hint">Stages execute sequentially. Each depends on the successful completion of the prior stage.</p>
      </div>`;
  }

  /* ── Escalation Rules Card ───────────────────────────────── */
  function buildEscalationCard(wf) {
    const esc = wf.escalation || {};
    const agents =
      window.state && window.state.agents && window.state.agents.list
        ? window.state.agents.list
        : [
            { id: 'agent-001', name: 'Ryū Orchestrator' },
            { id: 'agent-002', name: 'Kage Coder' },
          ];

    return `
      <div class="wf-panel-card glass-card">
        <div class="panel-header" style="padding-bottom:12px;">
          <h3 class="wf-section-title">◈ Escalation Rules</h3>
        </div>
        <div class="wf-settings-grid">
          <div class="setting-row wf-setting-row">
            <label class="wf-setting-label" for="wf-esc-timeout">${window.ninjaIcons ? window.ninjaIcons.get('clock') : ''} Timeout (minutes)</label>
            <input type="number" id="wf-esc-timeout" class="form-input wf-num-input"
              value="${esc.timeout || 30}" min="1" max="1440" step="1" />
          </div>
          <div class="setting-row wf-setting-row">
            <label class="wf-setting-label" for="wf-esc-notify">◈ Notify</label>
            <select id="wf-esc-notify" class="form-select">
              <option value="lead"  ${esc.notify === 'lead' ? 'selected' : ''}>Lead Sensei</option>
              <option value="all"   ${esc.notify === 'all' ? 'selected' : ''}>All Dojo Members</option>
              <option value="slack" ${esc.notify === 'slack' ? 'selected' : ''}>Slack Channel</option>
              <option value="email" ${esc.notify === 'email' ? 'selected' : ''}>Email</option>
            </select>
          </div>
          <div class="setting-row wf-setting-row">
            <label class="wf-setting-label" for="wf-esc-agent">◈ Fallback Agent</label>
            <select id="wf-esc-agent" class="form-select">
              ${agents.map((a) => `<option value="${a.id}" ${esc.fallbackAgent === a.id ? 'selected' : ''}>${a.name || a.id}</option>`).join('')}
            </select>
          </div>
          <div class="wf-save-row">
            <button id="wf-esc-save" class="btn btn-sm btn-primary">Save Escalation Rules</button>
          </div>
        </div>
      </div>`;
  }

  /* ── Autonomy Policy Card ────────────────────────────────── */
  function buildAutonomyCard(wf) {
    const policy = wf.autonomyPolicy || 'advisory';
    const options = [
      {
        value: 'full',
        icon: '◈',
        label: 'Full Autonomy',
        desc: 'Agents execute without Sensei approval',
      },
      {
        value: 'advisory',
        icon: '◈',
        label: 'Advisory Mode',
        desc: 'Agents suggest, Sensei confirms at gates',
      },
      {
        value: 'approval',
        icon: '◈',
        label: 'Approval at Each Gate',
        desc: 'Every stage requires explicit sign-off',
      },
    ];

    return `
      <div class="wf-panel-card glass-card">
        <div class="panel-header" style="padding-bottom:12px;">
          <h3 class="wf-section-title">◈ Autonomy Policy</h3>
        </div>
        <div class="wf-autonomy-options">
          ${options
            .map(
              (o) => `
            <label class="wf-autonomy-opt ${policy === o.value ? 'wf-autonomy-selected' : ''}" data-value="${o.value}">
              <input type="radio" name="wf-autonomy" class="wf-autonomy-radio" value="${o.value}"
                ${policy === o.value ? 'checked' : ''} />
              <span class="wf-autonomy-icon">${o.icon}</span>
              <div class="wf-autonomy-text">
                <span class="wf-autonomy-label">${o.label}</span>
                <span class="wf-autonomy-desc">${o.desc}</span>
              </div>
            </label>`,
            )
            .join('')}
        </div>
      </div>`;
  }

  /* ── Retry Strategy Card ─────────────────────────────────── */
  function buildRetryCard(wf) {
    const retry = wf.retry || {};
    const maxR = retry.maxRetries || 3;
    const backR = retry.backoffSeconds || 15;

    return `
      <div class="wf-panel-card glass-card">
        <div class="panel-header" style="padding-bottom:12px;">
          <h3 class="wf-section-title">◈️ Retry Strategy</h3>
        </div>
        <div class="wf-settings-grid">
          <div class="setting-row wf-setting-row">
            <label class="wf-setting-label" for="wf-retry-max">◈ Max Retries: <span id="wf-retry-display">${maxR}</span></label>
            <input type="range" id="wf-retry-max" class="slider" min="0" max="10" step="1" value="${maxR}" />
          </div>
          <div class="setting-row wf-setting-row">
            <label class="wf-setting-label" for="wf-retry-backoff">${window.ninjaIcons ? window.ninjaIcons.get('clock') : ''} Backoff (seconds)</label>
            <input type="number" id="wf-retry-backoff" class="form-input wf-num-input"
              value="${backR}" min="1" max="3600" step="1" />
          </div>
          <div class="wf-save-row">
            <button id="wf-retry-save" class="btn btn-sm btn-primary">Save Retry Config</button>
          </div>
        </div>
      </div>`;
  }

  /* ── Rollback Checkpoints Card ───────────────────────────── */
  function buildRollbackCard(wf) {
    return `
      <div class="wf-panel-card glass-card">
        <div class="panel-header" style="padding-bottom:12px;">
          <h3 class="wf-section-title">${window.ninjaIcons ? window.ninjaIcons.get('rewind') : ''} Rollback Checkpoints</h3>
          <span class="badge badge-outline" style="font-size:0.72rem;">Shadows the pipeline</span>
        </div>
        <div class="wf-rollback-list">
          ${wf.stages
            .map(
              (s) => `
            <div class="wf-rollback-row">
              <div class="wf-rollback-stage-info">
                <div class="wf-rollback-dot" style="background:${s.color};"></div>
                <span class="wf-rollback-name">${s.name}</span>
              </div>
              <label class="switch" aria-label="Rollback checkpoint for ${s.name}">
                <input type="checkbox" class="wf-rollback-toggle" data-stage-id="${s.id}"
                  ${s.rollbackCheckpoint ? 'checked' : ''} />
                <span class="slider round"></span>
              </label>
            </div>`,
            )
            .join('')}
        </div>
      </div>`;
  }

  /* ── Main Render ─────────────────────────────────────────── */
  window.renderWorkflow = function () {
    const container = document.getElementById('workflow-container');
    if (!container) {
      console.warn('[CoNinja] #workflow-container not found');
      return;
    }

    const wf = getWorkflow();

    if (!wf || !wf.stages || wf.stages.length === 0) {
      if (typeof window.renderEmptyState === 'function') {
        const preset = (window.emptyStatePresets && window.emptyStatePresets.workflow) || {
          illustration: 'kanji',
          title: 'No active workflows',
          description: 'Define pipeline blueprints to orchestrate multi-stage jutsu sequences.',
          primaryLabel: 'Create Pipeline',
          primaryAction: 'showWorkflowWizard',
        };
        container.innerHTML = window.renderEmptyState(preset);
        if (typeof window.wireEmptyStateActions === 'function') {
          window.wireEmptyStateActions(container);
        }
      } else {
        container.innerHTML = '<div style="padding:40px; text-align:center;">No active workflows.</div>';
      }
      return;
    }

    container.innerHTML = `
      <div class="wf-wrapper">
        <div class="wf-content">
          ${buildPipelineStats(wf)}
        ${buildPipelineEditor(wf)}
        ${buildDependencyChain(wf)}

        <div class="wf-two-col">
          ${buildEscalationCard(wf)}
          ${buildAutonomyCard(wf)}
        </div>

        <div class="wf-two-col">
          ${buildRetryCard(wf)}
          ${buildRollbackCard(wf)}
        </div>
      </div>`;

    attachWorkflowListeners();
  };

  /* ── Event Wiring ────────────────────────────────────────── */
  function attachWorkflowListeners() {
    const container = document.getElementById('workflow-container');
    if (!container) return;

    /* Drag and drop stages */
    container.querySelectorAll('.wf-stage-card').forEach((card) => {
      card.addEventListener('dragstart', (e) => {
        const stageId = card.closest('.wf-stage-col').dataset.stageId;
        e.dataTransfer.setData('text/plain', stageId);
        card.style.opacity = '0.5';
      });
      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
        container
          .querySelectorAll('.wf-stage-card')
          .forEach((c) => c.classList.remove('drag-over'));
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const draggedStageId = e.dataTransfer.getData('text/plain');
        const targetStageId = card.closest('.wf-stage-col').dataset.stageId;
        if (draggedStageId && targetStageId && draggedStageId !== targetStageId) {
          const wf = getWorkflow();
          const draggedIndex = wf.stages.findIndex((s) => s.id === draggedStageId);
          const targetIndex = wf.stages.findIndex((s) => s.id === targetStageId);
          if (draggedIndex !== -1 && targetIndex !== -1) {
            const [removed] = wf.stages.splice(draggedIndex, 1);
            wf.stages.splice(targetIndex, 0, removed);
            // Re-order sequential dependency relations
            wf.dependencies = [];
            for (let i = 0; i < wf.stages.length - 1; i++) {
              wf.dependencies.push({ from: wf.stages[i].id, to: wf.stages[i + 1].id });
            }
            dispatchWorkflow('WORKFLOW_UPDATE_STAGE', { stageId: targetStageId, updates: {} }); // Notify state store if active
            toast('Stage position updated', 'success');
            window.renderWorkflow();
          }
        }
      });
    });

    /* Approval gate toggles */
    container.querySelectorAll('.wf-gate-toggle').forEach((toggle) => {
      toggle.addEventListener('change', () => {
        const stageId = toggle.dataset.stageId;
        const checked = toggle.checked;
        dispatchWorkflow('SET_STAGE_GATE', { stageId, approvalRequired: checked });
        const badgeEl =
          container.querySelector(
            `.wf-stage-card[data-stage-id="${stageId}"] .wf-stage-gate-badge`,
          ) || container.querySelector(`[data-stage-id="${stageId}"] .wf-stage-gate-badge`);
        if (badgeEl) {
          badgeEl.textContent = checked ? '◈' : '◈';
          badgeEl.className = `wf-stage-gate-badge ${checked ? 'gate-locked' : 'gate-open'}`;
        }
        toast(`Stage gate ${checked ? 'sealed ◈' : 'opened ◈'}`, checked ? 'warning' : 'info');
      });
    });

    /* Autonomy policy */
    container.querySelectorAll('.wf-autonomy-radio').forEach((radio) => {
      radio.addEventListener('change', () => {
        container
          .querySelectorAll('.wf-autonomy-opt')
          .forEach((opt) => opt.classList.remove('wf-autonomy-selected'));
        const label = radio.closest('.wf-autonomy-opt');
        if (label) label.classList.add('wf-autonomy-selected');
        dispatchWorkflow('SET_AUTONOMY_POLICY', { policy: radio.value });
        toast(`◈ Autonomy policy updated: ${radio.value}`, 'success');
      });
    });

    /* Retry slider display */
    const retrySlider = container.querySelector('#wf-retry-max');
    const retryDisp = container.querySelector('#wf-retry-display');
    if (retrySlider && retryDisp) {
      retrySlider.addEventListener('input', () => {
        retryDisp.textContent = retrySlider.value;
      });
    }

    /* Retry save */
    const retrySave = container.querySelector('#wf-retry-save');
    if (retrySave) {
      retrySave.addEventListener('click', () => {
        const max = parseInt((container.querySelector('#wf-retry-max') || {}).value || 3);
        const backoff = parseInt((container.querySelector('#wf-retry-backoff') || {}).value || 15);
        dispatchWorkflow('SET_RETRY_CONFIG', { maxRetries: max, backoffSeconds: backoff });
        toast(`◈️ Retry strategy sealed: max ${max}, backoff ${backoff}s`, 'success');
      });
    }

    /* Escalation save */
    const escSave = container.querySelector('#wf-esc-save');
    if (escSave) {
      escSave.addEventListener('click', () => {
        const timeout = parseInt((container.querySelector('#wf-esc-timeout') || {}).value || 30);
        const notify = (container.querySelector('#wf-esc-notify') || {}).value || 'lead';
        const fallback = (container.querySelector('#wf-esc-agent') || {}).value || '';
        dispatchWorkflow('SET_ESCALATION', { timeout, notify, fallbackAgent: fallback });
        toast('◈ Escalation rules updated', 'success');
      });
    }

    /* Rollback toggles */
    container.querySelectorAll('.wf-rollback-toggle').forEach((toggle) => {
      toggle.addEventListener('change', () => {
        const stageId = toggle.dataset.stageId;
        dispatchWorkflow('SET_ROLLBACK_CHECKPOINT', { stageId, enabled: toggle.checked });
        toast(
          `${window.ninjaIcons ? window.ninjaIcons.get('rewind') : ''} Rollback checkpoint ${toggle.checked ? 'enabled' : 'disabled'} for stage`,
          toggle.checked ? 'success' : 'warning',
        );
      });
    });

    /* Add stage button */
    const addStageBtn = container.querySelector('#wf-add-stage-btn');
    if (addStageBtn) {
      addStageBtn.addEventListener('click', () => {
        const stageName = prompt('Enter the name of the new pipeline stage:');
        if (!stageName || !stageName.trim()) return;
        const newStage = {
          id: `stage-${Date.now()}`,
          name: stageName.trim(),
          color: '#ff7300',
          approvalRequired: false,
          tasks: [],
          rollbackCheckpoint: false,
        };
        dispatchWorkflow('ADD_STAGE', newStage);
        toast(`◈️ Stage "${stageName}" added to the pipeline`, 'success');
        window.renderWorkflow();
      });
    }
  }

  window.initWorkflow = function () {
    window.renderWorkflow();
  };

  /* ── Inject Styles ───────────────────────────────────────── */
  if (!document.getElementById('cns-workflow-styles')) {
    const style = document.createElement('style');
    style.id = 'cns-workflow-styles';
    style.textContent = `
      .wf-wrapper { display: flex; flex-direction: column; gap: 20px; padding: 4px 0; }
      .wf-heading { font-size: 1.4rem; font-weight: 800; margin: 0; background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

      /* Stat Bar */
      .wf-stat-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
      @media (max-width: 900px) { .wf-stat-bar { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 520px) { .wf-stat-bar { grid-template-columns: 1fr; } }
      .wf-stat-card { padding: var(--space-xl); display: flex; flex-direction: column; align-items: flex-start; gap: 4px; border-radius: var(--radius-lg); }
      .wf-stat-icon { font-size: 1.5rem; margin-bottom: 4px; }
      .wf-stat-value { font-size: 1.8rem; font-weight: 800; line-height: 1; }
      .wf-stat-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; }

      /* Pipeline Section */
      .wf-pipeline-section { border-radius: 16px; padding: 18px; }
      .wf-section-title { font-size: 1rem; font-weight: 700; margin: 0; }
      .wf-pipeline-scroll { overflow-x: auto; padding-bottom: 8px; }
      .wf-pipeline-track { display: flex; gap: 0; align-items: stretch; min-width: max-content; }

      /* Stage Column */
      .wf-stage-col { display: flex; align-items: center; gap: 0; }
      .wf-stage-card {
        width: 200px; border-radius: 14px; overflow: hidden;
        display: flex; flex-direction: column;
        padding: 0; flex-shrink: 0;
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        cursor: grab;
      }
      .wf-stage-card:active { cursor: grabbing; }
      .wf-stage-card.drag-over { border-color: var(--accent-orange, #ff7300) !important; box-shadow: 0 0 15px rgba(255,115,0,0.2) !important; }
      .wf-stage-card:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,0.3); }
      .wf-stage-drag-handle { display: inline-flex; align-items: center; cursor: grab; opacity: 0.4; color: var(--text-secondary); margin-right: 6px; }
      .wf-stage-drag-handle:hover { opacity: 0.8; }
      .wf-stage-drag-handle svg { width: 12px; height: 12px; display: block; }
      .wf-stage-accent-bar { height: 4px; width: 100%; flex-shrink: 0; }
      .wf-stage-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 8px; gap: 6px; }
      .wf-stage-name { font-weight: 700; font-size: 0.84rem; line-height: 1.3; }
      .wf-stage-gate-badge { font-size: 1rem; flex-shrink: 0; cursor: default; }
      .gate-locked { filter: drop-shadow(0 0 4px rgba(255,115,0,0.5)); }
      .gate-open   { opacity: 0.5; }
      .wf-stage-task-list { list-style: none; padding: 0 14px; margin: 0 0 8px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
      .wf-stage-task-item { font-size: 0.74rem; color: var(--text-muted); line-height: 1.4; }
      .wf-stage-task-more { font-size: 0.72rem; color: var(--accent-orange); font-style: italic; }
      .wf-stage-footer { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px 12px; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06)); }
      .wf-gate-toggle-label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.74rem; color: var(--text-muted); }
      .wf-gate-toggle { accent-color: var(--accent-orange); width: 14px; height: 14px; }
      .wf-task-count { font-size: 0.72rem; color: var(--text-muted); }

      /* Stage Arrow */
      .wf-stage-arrow { font-size: 1.4rem; color: var(--text-muted); padding: 0 8px; flex-shrink: 0; opacity: 0.5; }

      /* Dependency Chain */
      .wf-panel-card { border-radius: 16px; padding: 18px; }
      .wf-dep-chain { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 10px; }
      .wf-dep-node { border: 1px solid; border-radius: 8px; padding: 4px 12px; font-size: 0.8rem; font-weight: 600; }
      .wf-dep-arrow { font-size: 1.1rem; color: var(--text-muted); }
      .wf-dep-hint { font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; margin: 0; }

      /* Two-Column Layout */
      .wf-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      @media (max-width: 820px) { .wf-two-col { grid-template-columns: 1fr; } }

      /* Settings Grid */
      .wf-settings-grid { display: flex; flex-direction: column; gap: 14px; }
      .wf-setting-row { display: flex; flex-direction: column; gap: 6px; }
      .wf-setting-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
      .wf-num-input { max-width: 120px; }
      .wf-save-row { padding-top: 4px; }

      /* Autonomy Options */
      .wf-autonomy-options { display: flex; flex-direction: column; gap: 10px; }
      .wf-autonomy-opt {
        display: flex; align-items: center; gap: 12px; padding: 12px 14px;
        border: 1px solid var(--border-subtle, rgba(255,255,255,0.07));
        border-radius: 12px; cursor: pointer;
        transition: border-color 0.2s ease, background 0.2s ease;
      }
      .wf-autonomy-opt:hover { border-color: rgba(255,115,0,0.3); background: rgba(255,115,0,0.05); }
      .wf-autonomy-selected { border-color: rgba(255,115,0,0.5) !important; background: rgba(255,115,0,0.1) !important; }
      .wf-autonomy-radio { display: none; }
      .wf-autonomy-icon { font-size: 1.4rem; flex-shrink: 0; }
      .wf-autonomy-text { display: flex; flex-direction: column; gap: 2px; }
      .wf-autonomy-label { font-size: 0.9rem; font-weight: 700; }
      .wf-autonomy-desc { font-size: 0.76rem; color: var(--text-muted); }

      /* Rollback */
      .wf-rollback-list { display: flex; flex-direction: column; gap: 10px; }
      .wf-rollback-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.05)); }
      .wf-rollback-row:last-child { border-bottom: none; }
      .wf-rollback-stage-info { display: flex; align-items: center; gap: 10px; }
      .wf-rollback-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
      .wf-rollback-name { font-size: 0.86rem; font-weight: 500; }

      /* Slider / Switch — ensure these exist even without global CSS */
      .slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: rgba(255,255,255,0.1);
        outline: none;
        cursor: pointer;
      }
      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px; height: 18px;
        border-radius: 50%;
        background: var(--accent-orange, #ff7300);
        cursor: pointer;
        box-shadow: 0 0 8px rgba(255,115,0,0.5);
      }
      .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
      .switch input { opacity: 0; width: 0; height: 0; }
      .switch .slider.round {
        position: absolute; cursor: pointer;
        inset: 0; border-radius: 24px;
        background: rgba(255,255,255,0.1);
        transition: 0.25s ease;
        width: auto; height: auto;
      }
      .switch .slider.round:before {
        content: ''; position: absolute;
        height: 18px; width: 18px;
        left: 3px; bottom: 3px;
        border-radius: 50%;
        background: #fff;
        transition: 0.25s ease;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      .switch input:checked + .slider.round { background: var(--accent-orange, #ff7300); }
      .switch input:checked + .slider.round:before { transform: translateX(20px); }
    `;
    document.head.appendChild(style);
  }

  console.warn('%c[CoNinja] Workflow Pipeline loaded ◈️', 'color:#00BCD4;font-weight:bold;');
})();
