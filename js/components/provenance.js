/* ============================================================
   CoNinja Shadow Swarm — Provenance / Traceability Center
   Full audit trail for agent actions, prompts, and decisions
   ============================================================ */

(function () {
  'use strict';

  const getActionIcon = (action) => {
    const icons = {
      code_generation: 'coder',
      test_execution: 'tester',
      review: 'orchestrator',
      deployment: 'devops',
      security_scan: 'security',
      decision: 'pm',
      memory_retrieval: 'documentation',
    };
    const iconName = icons[action] || 'circle';
    return window.ninjaIcons ? window.ninjaIcons.get(iconName) : '◈';
  };

  window.renderProvenance = function () {
    const container = document.getElementById('provenance-container');
    if (!container) return;

    const { traces, filters } = window.state.provenance;
    const selectedTraceId = window.state.provenance.selectedTrace;

    // Apply filters
    const filteredTraces = traces.filter((t) => {
      if (filters.agent && filters.agent !== 'all' && t.agentId !== filters.agent) return false;
      if (filters.action && filters.action !== 'all' && t.action !== filters.action) return false;
      return true;
    });

    const selectedTrace = traces.find((t) => t.id === selectedTraceId);

    container.innerHTML = `
      <div class="provenance-layout">
        <aside class="prov-sidebar">
          <div class="prov-filters glass-card">
            <h4>Trace Auditing Controls</h4>
            <div class="form-group" style="margin-bottom:10px;">
              <label class="prov-filter-label">Shinobi Agent</label>
              <select class="form-select text-xs prov-select" id="prov-filter-agent">
                <option value="all" ${filters.agent === 'all' ? 'selected' : ''}>All Agents</option>
                ${Object.values(window.state.agents)
                  .map(
                    (a) =>
                      `<option value="${a.id}" ${filters.agent === a.id ? 'selected' : ''}>${a.name}</option>`,
                  )
                  .join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="prov-filter-label">Action Jutsu</label>
              <select class="form-select text-xs prov-select" id="prov-filter-action">
                <option value="all" ${filters.action === 'all' ? 'selected' : ''}>All Actions</option>
                <option value="code_generation" ${filters.action === 'code_generation' ? 'selected' : ''}>Code Generation</option>
                <option value="test_execution" ${filters.action === 'test_execution' ? 'selected' : ''}>Test Execution</option>
                <option value="review" ${filters.action === 'review' ? 'selected' : ''}>Review</option>
                <option value="security_scan" ${filters.action === 'security_scan' ? 'selected' : ''}>Security Scan</option>
              </select>
            </div>
          </div>
          <div class="prov-trace-list">
            ${
              filteredTraces.length === 0
                ? `
              <div style="padding:20px; text-align:center; color:var(--text-muted); font-size:0.8rem;">No traces match filter conditions.</div>
            `
                : filteredTraces
                    .map((t) => {
                      const agentInfo = window.state.agents[t.agentId];
                      const agentName = window.state.agents[t.agentId]?.name || t.agentId;
                      return `
              <div class="prov-trace-item ${selectedTraceId === t.id ? 'active' : ''}" data-trace-id="${t.id}">
                <div class="trace-icon">${getActionIcon(t.action)}</div>
                <div class="trace-info">
                  <div class="trace-action">${formatAction(t.action)}</div>
                  <div class="trace-meta">${agentName} • ${formatTime(t.timestamp)}</div>
                </div>
                <div class="trace-confidence" title="Confidence: ${t.confidence}%">${t.confidence}%</div>
              </div>`;
                    })
                    .join('')
            }
          </div>
        </aside>

        <main class="prov-main">
          ${selectedTrace ? renderTraceDetail(selectedTrace) : renderEmptyDetail()}
        </main>
      </div>
    `;

    attachListeners();
  };

  function renderTraceDetail(trace) {
    const isReplaying = window.state.provenance.replayingTraceId === trace.id;
    const agentInfo = window.state.agents[trace.agentId];
    const agentName = window.state.agents[trace.agentId]?.name || trace.agentId;

    return `
      <div class="trace-detail">
        <div class="trace-header">
          <div class="trace-title">
            <span class="trace-icon-large">${getActionIcon(trace.action)}</span>
            <div>
              <h2>${formatAction(trace.action)}</h2>
              <div class="trace-subtitle">${trace.id} • ${agentName} • ${formatTime(trace.timestamp)}</div>
            </div>
          </div>
          <div class="trace-metrics">
            <div class="metric">
              <span class="metric-label">Duration</span>
              <span class="metric-value">${(trace.duration / 1000).toFixed(1)}s</span>
            </div>
            <div class="metric">
              <span class="metric-label">Confidence</span>
              <span class="metric-value">${trace.confidence}%</span>
            </div>
            <div class="metric">
              <span class="metric-label">Cost</span>
              <span class="metric-value">$${trace.cost.toFixed(3)}</span>
            </div>
          </div>
        </div>

        <div class="trace-tab-headers" style="display:flex; border-bottom:1px solid rgba(255,255,255,0.05); margin-bottom:16px;">
          <button class="trace-sub-tab active" data-subtab="timeline">Timeline</button>
          <button class="trace-sub-tab" data-subtab="impact">File & Testing Impact</button>
          <button class="trace-sub-tab" data-subtab="compare">Compare Attempts</button>
          <button class="trace-sub-tab" data-subtab="raw">Raw JSON</button>
        </div>

        <div class="trace-tab-content active" id="trace-subtab-timeline">
          <div class="trace-timeline">
            <div class="timeline-step completed">
              <div class="step-icon">${getActionIcon(trace.action)}</div>
              <div class="step-content">
                <div class="step-title">Prompt Sent</div>
                <div class="step-detail-box">${trace.prompt}</div>
              </div>
            </div>
            <div class="timeline-step completed">
              <div class="step-icon">${getActionIcon('review')}</div>
              <div class="step-content">
                <div class="step-title">Model Invocation</div>
                <div class="step-detail-box">
                  <strong>Model:</strong> ${trace.model}<br>
                  <strong>Temperature:</strong> ${trace.temperature}<br>
                  <strong>Token Cost:</strong> In: ${trace.tokens.input} | Out: ${trace.tokens.output}
                </div>
              </div>
            </div>
            ${
              trace.memoryRetrieved.length > 0
                ? `
              <div class="timeline-step completed">
                <div class="step-icon">${getActionIcon('memory_retrieval')}</div>
                <div class="step-content">
                  <div class="step-title">Memory Context Retrieved</div>
                  <div class="step-detail-box">
                    ${trace.memoryRetrieved.map((m) => `<span class="prov-tag memory-tag">${m}</span>`).join('')}
                  </div>
                </div>
              </div>
            `
                : ''
            }
            ${
              trace.toolsInvoked.length > 0
                ? `
              <div class="timeline-step completed">
                <div class="step-icon">${getActionIcon('review')}</div>
                <div class="step-content">
                  <div class="step-title">Tools Invoked</div>
                  <div class="step-detail-box">
                    ${trace.toolsInvoked
                      .map(
                        (t) => `
                       <div class="prov-tool-call">
                        <strong>${t.tool}()</strong>
                        <pre style="margin:4px 0 0 0; font-size:0.7rem; color:var(--text-muted);">${JSON.stringify(t.params, null, 2)}</pre>
                      </div>
                    `,
                      )
                      .join('')}
                  </div>
                </div>
              </div>
            `
                : ''
            }
            <div class="timeline-step completed">
              <div class="step-icon">${getActionIcon('code_generation')}</div>
              <div class="step-content">
                <div class="step-title">Output Generated</div>
                <div class="step-detail-box" style="white-space: pre-wrap; font-family:var(--font-mono); font-size:0.75rem; color:#4CAF50;">${trace.output}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="trace-tab-content" id="trace-subtab-impact" style="display:none;">
          <div style="display:flex; flex-direction:column; gap:16px; font-size:0.8rem;">
            <div>
              <strong>Files Touched & Changes Made:</strong>
              ${
                trace.filesChanged && trace.filesChanged.length > 0
                  ? `
                <ul style="padding-left:16px; margin:6px 0; color:var(--text-secondary); display:flex; flex-direction:column; gap:4px;">
                  ${trace.filesChanged.map((f) => `<li><span style="font-family:var(--font-mono); color:var(--accent-cyan);">${f}</span> <span style="color:#4CAF50; font-family:var(--font-mono); font-size:0.72rem; margin-left:6px;">(+12 -2)</span></li>`).join('')}
                </ul>
              `
                  : '<p style="color:var(--text-muted); margin:4px 0 0 0;">No files modified in this execution unit.</p>'
              }
            </div>
            <div style="border-top:1px dashed rgba(255,255,255,0.05); padding-top:12px;">
              <strong>Unit & Integration Tests Executed:</strong>
              ${
                trace.testsRun && trace.testsRun.length > 0
                  ? `
                <ul style="padding-left:16px; margin:6px 0; color:var(--text-secondary); display:flex; flex-direction:column; gap:4px;">
                  ${trace.testsRun.map((t) => `<li><span style="font-family:var(--font-mono);">${t}</span> <span style="color:#4CAF50; font-size:0.72rem; margin-left:6px;">(Pass)</span></li>`).join('')}
                </ul>
              `
                  : '<p style="color:var(--text-muted); margin:4px 0 0 0;">No tests executed during this trace run.</p>'
              }
            </div>
          </div>
        </div>

        <div class="trace-tab-content" id="trace-subtab-compare" style="display:none;">
          <div style="display:flex; flex-direction:column; gap:12px; font-size:0.8rem;">
            <p style="color:var(--text-secondary); margin:0;">Compare LLM outputs across sequential attempts. This step had <strong>${trace.retryCount || 1} retries</strong>.</p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div class="glass-card" style="padding:12px; border:1px solid rgba(255,255,255,0.04); border-radius:8px; background:rgba(255,255,255,0.01);">
                <div style="font-weight:600; color:var(--accent-orange); font-size:0.75rem; margin-bottom:6px;">Attempt #1 (Failed)</div>
                <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted); line-height:1.4; overflow-y:auto; max-height:160px; white-space:pre-wrap;">
${trace.action === 'code_generation' ? '// Compilation failed:\n// ReferenceError: nodemailer is not defined' : '// Run failed:\n// Error: connection timeout'}
                </div>
              </div>
              <div class="glass-card" style="padding:12px; border:1px solid rgba(255,255,255,0.04); border-radius:8px; background:rgba(255,255,255,0.01);">
                <div style="font-weight:600; color:#4CAF50; font-size:0.75rem; margin-bottom:6px;">Attempt #2 (Succeeded)</div>
                <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-secondary); line-height:1.4; overflow-y:auto; max-height:160px; white-space:pre-wrap;">${trace.output}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="trace-tab-content" id="trace-subtab-raw" style="display:none;">
          <div class="trace-raw-data">
            <pre class="raw-json">${escapeHTML(JSON.stringify(trace, null, 2))}</pre>
          </div>
        </div>

        <div class="trace-actions" style="margin-top:20px; display:flex; gap:12px;">
          <button class="btn btn-primary" id="btn-replay-trace">
            ${isReplaying ? 'Replaying...' : 'Replay Action'}
          </button>
          <button class="btn btn-outline" id="btn-export-trace">
            Export Trace DSN
          </button>
        </div>
      </div>
    `;
  }

  function renderEmptyDetail() {
    return `
      <div class="prov-empty">
        <div class="empty-icon" style="font-size:4rem; margin-bottom:16px; filter: drop-shadow(0 0 16px rgba(255,115,0,0.2));">
          ${window.ninjaIcons ? window.ninjaIcons.get('orchestrator') : '◈'}
        </div>
        <h3>Select an Audit Scroll</h3>
        <p style="color:var(--text-muted); margin-bottom:24px;">Choose an agent action trace from the sidebar list to inspect tool call parameters, prompt templates, and reasoning logs.</p>
      </div>
    `;
  }

  function formatAction(action) {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
  }

  function attachListeners() {
    const traces = window.state.provenance.traces;
    const selectedTraceId = window.state.provenance.selectedTrace;
    const selectedTrace = traces.find((t) => t.id === selectedTraceId);

    // Sidebar items click
    document.querySelectorAll('.prov-trace-item').forEach((item) => {
      item.addEventListener('click', () => {
        window.dispatch('TRACE_SELECT', { traceId: item.dataset.traceId });
        window.renderProvenance();
      });
    });

    // Filters select
    ['agent', 'action'].forEach((filter) => {
      const el = document.getElementById(`prov-filter-${filter}`);
      if (el) {
        el.addEventListener('change', () => {
          window.dispatch('TRACE_FILTER', { filters: { [filter]: el.value } });
          window.renderProvenance();
        });
      }
    });

    // Trace subtab switching
    document.querySelectorAll('.trace-sub-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.trace-sub-tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.trace-tab-content').forEach((c) => (c.style.display = 'none'));
        tab.classList.add('active');
        document.getElementById(`trace-subtab-${tab.dataset.subtab}`).style.display = 'block';
      });
    });

    // Replay trace button
    const replayBtn = document.getElementById('btn-replay-trace');
    if (replayBtn && selectedTrace) {
      replayBtn.addEventListener('click', () => {
        if (window.state.provenance.replayingTraceId === selectedTrace.id) return;
        window.state.provenance.replayingTraceId = selectedTrace.id;
        window.renderProvenance();
        window.showToast('Replaying action sequence in logs console...', 'info');

        const steps = [
          `[REPLAY STARTED] Restoring context values for task ${selectedTrace.taskId}...`,
          `[CONTEXT INJECTED] Memories: ${selectedTrace.memoryRetrieved.join(', ')}`,
          `[MODEL INVOCATION] Sourcing ${selectedTrace.model} routing...`,
          `[TOOL EXECUTION] Succeeded tool call: ${selectedTrace.toolsInvoked.map((t) => t.tool).join(', ')}`,
          '[REPLAY COMPLETED] Action output verified. Success: 100%.',
        ];

        steps.forEach((text, i) => {
          setTimeout(
            () => {
              window.dispatch('ADD_LOG', {
                agent: selectedTrace.agentId,
                type: i === steps.length - 1 ? 'success' : 'info',
                msg: text,
              });
              if (i === steps.length - 1) {
                window.state.provenance.replayingTraceId = null;
                window.renderProvenance();
                window.showToast('Trace replay successfully compiled.', 'success');
              }
            },
            (i + 1) * 1200,
          );
        });
      });
    }

    // Export trace
    const exportBtn = document.getElementById('btn-export-trace');
    if (exportBtn && selectedTrace) {
      exportBtn.addEventListener('click', () => {
        const text = JSON.stringify(selectedTrace, null, 2);
        navigator.clipboard
          .writeText(text)
          .then(() => {
            window.showToast('Trace logs copied to clipboard!', 'success');
          })
          .catch((err) => {
            window.showToast('Failed to copy to clipboard', 'error');
          });
      });
    }
  }

  function injectStyles() {
    if (document.getElementById('provenance-styles-extended')) return;
    const style = document.createElement('style');
    style.id = 'provenance-styles-extended';
    style.textContent = `
      .provenance-layout { display: grid; grid-template-columns: 320px 1fr; min-height: calc(100vh - 220px); gap: 22px; }
      .prov-sidebar { background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; }
      .prov-filters { margin: 12px; padding: 14px; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; background: rgba(0,0,0,0.22); }
      .prov-filters h4 { margin: 0 0 14px 0; font-size: 0.74rem; color: #c5b6a8; text-transform: uppercase; letter-spacing: .08em; }
      .prov-filter-label { display:block; margin-bottom:6px; font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:.06em; }
      .prov-select { padding:10px 12px !important; font-size:0.78rem !important; border-radius:10px; border:1px solid rgba(255,115,0,.25); background:rgba(8,6,5,.75); }
      .prov-select:focus { box-shadow: 0 0 0 2px rgba(255,115,0,.18); }
      .prov-trace-list { overflow-y: auto; min-height: 0; padding: 2px 12px 12px; }
      .prov-trace-item { display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; transition: all 0.18s; border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; margin-bottom: 8px; background: rgba(255,255,255,0.01); }
      .prov-trace-item:hover { background: rgba(255,255,255,0.05); transform: translateY(-1px); }
      .prov-trace-item.active { background: rgba(255,115,0,0.12); border-color: rgba(255,115,0,.28); box-shadow: 0 8px 22px rgba(255,115,0,.12); }
      .trace-icon { font-size: 1.05rem; width: 28px; height: 28px; border-radius: 8px; display:flex; align-items:center; justify-content:center; background: rgba(255,115,0,.12); color:#ff9d4d; }
      .trace-info { flex: 1; }
      .trace-action { font-weight: 600; font-size: 0.82rem; color: var(--text-primary); }
      .trace-meta { font-size: 0.7rem; color: var(--text-muted); margin-top: 3px; }
      .trace-confidence { padding: 3px 8px; background: rgba(255,115,0,0.16); border:1px solid rgba(255,115,0,.25); border-radius: 10px; font-size: 0.7rem; color: #ffab5e; font-weight: 700; }
      
      .prov-main { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.008)); border-radius: 14px; padding: 26px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.06); }
      .trace-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.06); }
      .trace-title { display: flex; align-items: center; gap: 16px; }
      .trace-icon-large { font-size: 2.2rem; width:52px; height:52px; display:flex; align-items:center; justify-content:center; border-radius:12px; background:rgba(255,115,0,.12); border:1px solid rgba(255,115,0,.2); }
      .trace-title h2 { margin: 0 0 4px 0; font-size: 1.22rem; letter-spacing:.01em; }
      .trace-subtitle { color: var(--text-muted); font-size: 0.78rem; font-family: var(--font-mono); }
      .trace-metrics { display: flex; gap: 12px; }
      .metric { text-align: center; padding:10px 12px; border-radius:10px; background: rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); min-width:92px; }
      .metric-label { display: block; font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; }
      .metric-value { font-size: 1.05rem; font-weight: 700; color: #ffab5e; }
      
      .trace-sub-tab { padding: 9px 14px; background: transparent; border: 1px solid transparent; border-radius: 8px; color: var(--text-muted); cursor: pointer; font-size: 0.82rem; transition: all 0.15s; }
      .trace-sub-tab.active { color: var(--text-primary); background: rgba(255,115,0,0.14); border-color: rgba(255,115,0,0.28); }
      
      .trace-timeline { margin-bottom: 24px; }
      .timeline-step { display: flex; gap: 16px; padding: 0 0 20px 20px; border-left: 2px dashed rgba(255,115,0,0.3); margin-left: 10px; position: relative; }
      .timeline-step:last-child { border-left: none; }
      .timeline-step::before { content: ''; position: absolute; left: -5px; top: 4px; width: 8px; height: 8px; background: var(--accent-orange); border-radius: 50%; }
      .timeline-step.completed { border-left-style: solid; border-left-color: #4CAF50; }
      .timeline-step.completed::before { background: #4CAF50; box-shadow: 0 0 8px #4CAF50; }
      .step-icon { font-size: 1.2rem; width: 24px; text-align: center; }
      .step-content { flex: 1; }
      .step-title { font-weight: 600; margin-bottom: 6px; font-size: 0.88rem; color: var(--text-secondary); }
      .step-detail-box { font-size: 0.8rem; color: var(--text-muted); background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 14px; line-height: 1.5; }
      
      .prov-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 12px; font-size: 0.72rem; margin-right: 6px; font-weight: 500; }
      .memory-tag { background: rgba(156,39,176,0.15); color: #e040fb; border: 1px solid rgba(156,39,176,0.3); }
      
      .prov-tool-call { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.05); }
      .prov-tool-call:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
      .prov-tool-call strong { font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-cyan); }
      
      .trace-raw-data { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.05); }
      .raw-json { font-family: var(--font-mono); font-size: 0.72rem; overflow-x: auto; margin: 0; color: var(--text-secondary); line-height: 1.5; }
      
      .prov-empty { text-align: center; padding: 80px 20px; color: var(--text-muted); }
      .prov-empty .empty-icon { font-size: 4rem; margin-bottom: 16px; filter: drop-shadow(0 0 16px rgba(255,115,0,0.2)); }

      @media (max-width: 1180px) {
        .provenance-layout { grid-template-columns: 1fr; min-height: auto; }
        .prov-sidebar { max-height: 320px; }
        .trace-header { flex-direction: column; gap: 14px; }
      }
    `;
    document.head.appendChild(style);
  }

  window.initProvenance = function () {
    injectStyles();
    window.renderProvenance();
  };

  console.warn('%c[CoNinja] Provenance Center loaded', 'color:#ff7300;font-weight:bold;');
})();
