// --- GLOBAL EVENT LISTENERS & NAVIGATION ---

window.initNavigation = function () {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.dispatch('SWITCH_TAB', btn.dataset.tab);
    });
  });

  // Kanban filters
  document.querySelectorAll('.filter-pills .pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pills .pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      window.renderKanban(pill.dataset.filter);
    });
  });
};

window.initGlobalControls = function () {
  // Global pauseBtn
  const pauseBtn = document.getElementById('global-pause-btn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      const targetStatus = window.state.systemStatus === 'active' ? 'paused' : 'active';
      window.dispatch('UPDATE_SYSTEM_STATUS', targetStatus);
    });
  }

  // Settings Sliders (legacy IDs — guarded for null safety)
  const dailySlider = document.getElementById('daily-limit-slider');
  const dailyVal = document.getElementById('daily-limit-val');
  if (dailySlider && dailyVal) {
    dailySlider.addEventListener('input', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'dailyLimit', value: parseInt(e.target.value) });
    });
  }

  const thresholdSlider = document.getElementById('alert-threshold-slider');
  const thresholdVal = document.getElementById('alert-threshold-val');
  if (thresholdSlider && thresholdVal) {
    thresholdSlider.addEventListener('input', (e) => {
      window.dispatch('UPDATE_SETTING', {
        key: 'alertThreshold',
        value: parseInt(e.target.value) / 100,
      });
    });
  }

  // Settings Autonomy radio selection (legacy — new name is autonomy-level-new)
  document.querySelectorAll("input[name='autonomy-level']").forEach((radio) => {
    radio.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'autonomyLevel', value: e.target.value });
      window.dispatch('ADD_LOG', {
        agent: 'system',
        type: 'info',
        msg: `Stealth permit rules updated to: ${e.target.value.toUpperCase()}`,
      });
    });
  });

  // Log Search and Filter inputs
  const searchInput = document.getElementById('log-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'logSearchQuery', value: e.target.value.trim() });
    });
  }

  const filterSelect = document.getElementById('log-filter-agent');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'logFilterAgent', value: e.target.value });
    });
  }

  // Task board search
  const taskSearchInput = document.getElementById('task-search-input');
  if (taskSearchInput) {
    taskSearchInput.addEventListener('input', (e) => {
      window.state.taskSearchQuery = e.target.value.trim().toLowerCase();
      window.renderKanban(
        document.querySelector('.filter-pills .pill.active')?.dataset?.filter || 'all',
      );
    });
  }

  // Console clear with toast notification
  const clearConsoleBtn = document.getElementById('console-clear-btn');
  if (clearConsoleBtn) {
    clearConsoleBtn.addEventListener('click', () => {
      window.dispatch('CLEAR_LOGS');
      if (typeof window.showToast === 'function') {
        window.showToast('Stealth scroll wiped clean', 'warning');
      }
    });
  }

  const toggleConsoleBtn = document.getElementById('console-toggle-btn');
  if (toggleConsoleBtn) {
    toggleConsoleBtn.addEventListener('click', () => {
      window.dispatch('UPDATE_SETTING', { key: 'streamLogs', value: !window.state.streamLogs });
    });
  }

  // Always-On Engine Toggle listeners
  const hunterToggle = document.getElementById('settings-hunter-toggle');
  if (hunterToggle) {
    hunterToggle.addEventListener('change', (e) => {
      const active = e.target.checked;
      window.dispatch('UPDATE_SETTING', {
        key: 'agents.hunter.status',
        value: active ? 'watching' : 'idle',
      });
      window.dispatch('ADD_LOG', {
        agent: 'hunter',
        type: active ? 'success' : 'error',
        msg: `Stealth Scout: Autonomous telemetry hunting ${active ? 'ENABLED' : 'DISABLED'}.`,
      });
    });
  }

  const updaterToggle = document.getElementById('settings-updater-toggle');
  if (updaterToggle) {
    updaterToggle.addEventListener('change', (e) => {
      const active = e.target.checked;
      window.dispatch('UPDATE_SETTING', {
        key: 'agents.updater.status',
        value: active ? 'idle' : 'sleeping',
      });
      window.dispatch('ADD_LOG', {
        agent: 'updater',
        type: active ? 'success' : 'error',
        msg: `Debt Chunin: Cron sweep updates scheduler ${active ? 'ENABLED' : 'DISABLED'}.`,
      });
    });
  }

  const refactorToggle = document.getElementById('settings-refactor-toggle');
  if (refactorToggle) {
    refactorToggle.addEventListener('change', (e) => {
      const active = e.target.checked;
      window.dispatch('ADD_LOG', {
        agent: 'orchestrator',
        type: active ? 'success' : 'info',
        msg: `Sensei: Background refactoring idle sweeps ${active ? 'ENABLED' : 'DISABLED'}.`,
      });
    });
  }

  const sentryInput = document.getElementById('settings-sentry-url');
  if (sentryInput) {
    sentryInput.addEventListener('change', (e) => {
      const val = e.target.value.trim();
      window.dispatch('ADD_LOG', {
        agent: 'hunter',
        type: 'info',
        msg: `Stealth Scout: Sentry target coordinates updated to ${val}`,
      });
    });
  }

  const datadogInput = document.getElementById('settings-datadog-key');
  if (datadogInput) {
    datadogInput.addEventListener('change', (e) => {
      window.dispatch('ADD_LOG', {
        agent: 'hunter',
        type: 'info',
        msg: 'Stealth Scout: Datadog authentication keys re-scrambled.',
      });
    });
  }
};

// --- DRAG AND DROP HANDLERS ---
window.initDragAndDrop = function () {
  const cols = document.querySelectorAll('.kanban-col');

  cols.forEach((col) => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.style.backgroundColor = 'rgba(255, 115, 0, 0.04)';
    });

    col.addEventListener('dragleave', (e) => {
      col.style.backgroundColor = 'rgba(8, 6, 5, 0.45)';
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.style.backgroundColor = 'rgba(8, 6, 5, 0.45)';

      const taskId = e.dataTransfer.getData('text/plain');
      const targetColId = col.id.replace('col-', '').replace('-', '_'); // backlog, in_progress, review, completed

      const task = window.state.tasks.find((t) => t.id === taskId);
      if (task && task.status !== targetColId) {
        // Log transition
        window.dispatch('ADD_LOG', {
          agent: 'system',
          type: 'info',
          msg: `Scroll #${task.id} (${task.title}) drag-moved from [${task.status.toUpperCase()}] to [${targetColId.toUpperCase()}] by User.`,
        });

        // Remove task assignment from agents if completed/backlog
        if (targetColId === 'completed' || targetColId === 'backlog') {
          const agentKey = Object.keys(window.state.agents).find(
            (k) => window.state.agents[k].currentTaskId === task.id,
          );
          if (agentKey) {
            window.dispatch('UPDATE_AGENT_STATUS', {
              agentId: agentKey,
              status: 'idle',
              currentTaskId: null,
            });
          }
        }

        window.dispatch('UPDATE_TASK', {
          taskId: task.id,
          updates: { status: targetColId },
        });

        // Trigger Smoke Puff visual effect on card!
        window.triggerSmokePuff(task.id);
      }
    });
  });
};

// ============================================================
// SETTINGS EVENT BINDINGS
// ============================================================
window.initSettingsSubTabs = function () {
  document.querySelectorAll('.settings-tabs .s-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.renderSettingsSubtab(btn.dataset.sTab);
    });
  });

  // Settings sub-tab sliders
  const tempSlider = document.getElementById('settings-temp');
  const tempVal = document.getElementById('settings-temp-val');
  if (tempSlider && tempVal) {
    tempSlider.addEventListener('input', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'temperature', value: parseFloat(e.target.value) });
    });
  }

  const contextSlider = document.getElementById('settings-context');
  const contextVal = document.getElementById('settings-context-val');
  if (contextSlider && contextVal) {
    contextSlider.addEventListener('input', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'contextLength', value: parseInt(e.target.value) });
    });
  }

  const dailySliderNew = document.getElementById('daily-limit-slider-new');
  const dailyValNew = document.getElementById('daily-limit-val-new');
  if (dailySliderNew && dailyValNew) {
    dailySliderNew.addEventListener('input', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'dailyLimit', value: parseInt(e.target.value) });
    });
  }

  const alertSliderNew = document.getElementById('alert-threshold-slider-new');
  const alertValNew = document.getElementById('alert-threshold-val-new');
  if (alertSliderNew && alertValNew) {
    alertSliderNew.addEventListener('input', (e) => {
      window.dispatch('UPDATE_SETTING', {
        key: 'alertThreshold',
        value: parseInt(e.target.value) / 100,
      });
    });
  }

  // Autonomy radio (new)
  document.querySelectorAll("input[name='autonomy-level-new']").forEach((radio) => {
    radio.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'autonomyLevel', value: e.target.value });
      window.addLog('system', 'info', `Stealth permit updated to: ${e.target.value.toUpperCase()}`);
    });
  });

  // VRAM swap toggle
  const vramToggle = document.getElementById('settings-vram-swap-toggle');
  if (vramToggle) {
    vramToggle.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'vramSwapEnabled', value: e.target.checked });
      window.addLog(
        'system',
        'info',
        `Dynamic VRAM swapping ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`,
      );
    });
  }

  // Proxy toggle enable/disable input
  const proxyToggle = document.getElementById('settings-proxy-toggle');
  const proxyHostInput = document.getElementById('settings-proxy-host');
  if (proxyToggle && proxyHostInput) {
    proxyToggle.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'proxyEnabled', value: e.target.checked });
    });
  }
};

window.initArchiveSidebar = function () {
  document.querySelectorAll('.archive-item').forEach((item) => {
    item.addEventListener('click', () => {
      window.renderReport(item.dataset.report);
    });
  });
};

// ============================================================
// EXTENDED SETTINGS — 365-Day Operations Event Listeners
// ============================================================
window.initExtendedSettings = function () {
  const log = (msg, type = 'info') => {
    window.dispatch('ADD_LOG', { agent: 'system', type, msg });
  };

  // ─── Proving Grounds ─────────────────────────────────────
  document.querySelectorAll("input[name='tdd-stance']").forEach((radio) => {
    radio.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'tddStance', value: e.target.value });
      const label =
        e.target.value === 'jonin' ? 'Jonin Stance (Strict TDD)' : 'Genin Stance (Code-First)';
      log(`◈️ Proving Grounds: TDD stance set to [${label}].`);
    });
  });

  const mutationToggle = document.getElementById('settings-mutation-toggle');
  if (mutationToggle) {
    mutationToggle.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'mutationTesting', value: e.target.checked });
      log(
        `◈ Mutation Trial of Fire: ${e.target.checked ? 'ENABLED — bug injection active.' : 'DISABLED.'}`,
        e.target.checked ? 'success' : 'info',
      );
    });
  }

  const coverageSlider = document.getElementById('settings-coverage-gate');
  const coverageVal = document.getElementById('settings-coverage-gate-val');
  if (coverageSlider && coverageVal) {
    coverageSlider.addEventListener('input', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'coverageGate', value: parseInt(e.target.value) });
    });
    coverageSlider.addEventListener('change', (e) => {
      log(`◈️ Iron Body Shield: Minimum coverage gate set to ${window.state.coverageGate}%.`);
    });
  }

  // ─── Scroll Archive ───────────────────────────────────────
  const tokenSlider = document.getElementById('settings-scroll-tokens');
  const tokenVal = document.getElementById('settings-scroll-tokens-val');
  if (tokenSlider && tokenVal) {
    tokenSlider.addEventListener('input', (e) => {
      window.dispatch('UPDATE_SETTING', {
        key: 'scrollTokenLimit',
        value: parseInt(e.target.value),
      });
    });
    tokenSlider.addEventListener('change', (e) => {
      log(
        `◈ Scroll Slicing Technique: Context token limit set to ${window.state.scrollTokenLimit} tokens.`,
      );
    });
  }

  const memorySelect = document.getElementById('settings-memory-pruning');
  if (memorySelect) {
    memorySelect.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'memoryPruning', value: e.target.value });
      const labels = {
        daily: 'Daily Meditation',
        weekly: 'Weekly Retrospective',
        eidetic: 'Eidetic Memory',
      };
      log(`◈ Memory Pruning cycle changed to: ${labels[e.target.value]}.`);
    });
  }

  // ─── Shadow Strike Protocols ──────────────────────────────
  const midnightToggle = document.getElementById('settings-midnight-deploy');
  if (midnightToggle) {
    midnightToggle.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'midnightDeploy', value: e.target.checked });
      log(
        `◈ Midnight Strike Automations: Off-hours deployments ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`,
        e.target.checked ? 'success' : 'error',
      );
    });
  }

  const rollbackToggle = document.getElementById('settings-auto-rollback');
  if (rollbackToggle) {
    rollbackToggle.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'autoRollback', value: e.target.checked });
      log(
        `◈ Smoke Bomb Retreat: Auto-rollback on 5xx ${e.target.checked ? 'ARMED' : 'DISARMED'}.`,
        e.target.checked ? 'success' : 'error',
      );
    });
  }

  const chakraSlider = document.getElementById('settings-release-chakra');
  const chakraVal = document.getElementById('settings-release-chakra-val');
  if (chakraSlider && chakraVal) {
    chakraSlider.addEventListener('input', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'releaseChakra', value: parseInt(e.target.value) });
    });
    chakraSlider.addEventListener('change', (e) => {
      log(
        `◈ Release Chakra gate set to ${window.state.releaseChakra} completed task${window.state.releaseChakra > 1 ? 's' : ''}.`,
      );
    });
  }

  // ─── Dojo Seals ───────────────────────────────────────────
  document.querySelectorAll("input[name='execution-seal']").forEach((radio) => {
    radio.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'executionSeal', value: e.target.value });
      const sealLabel = {
        code_only: 'Level 1 — Code Only',
        trusted_docker: 'Level 2 — Trusted Docker',
        unsealed: 'Level 3 — UNSEALED ◈️',
      };
      const type = e.target.value === 'unsealed' ? 'error' : 'info';
      log(`◈ Dojo Seals execution level changed to: ${sealLabel[e.target.value]}`, type);
    });
  });

  const astInput = document.getElementById('settings-ast-limit');
  if (astInput) {
    astInput.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', {
        key: 'astEditLimit',
        value: parseInt(e.target.value) || 80,
      });
      log(
        `◈ Rabbit-Hole Detection: Hard reset triggers after ${window.state.astEditLimit} AST edits.`,
      );
    });
  }

  // ─── Nightwalker Protocols ────────────────────────────────
  const idleSelect = document.getElementById('settings-idle-focus');
  if (idleSelect) {
    idleSelect.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'idleFocus', value: e.target.value });
      const labels = {
        performance: 'Taijutsu Training (Performance Optimization)',
        documentation: 'Scroll Scribing (Documentation)',
        hibernate: 'Hibernation (Save Compute)',
      };
      log(`◈ Nightwalker Protocol updated: Idle focus → ${labels[e.target.value]}.`);
    });
  }

  // ─── Agent Persona Tuner (Yin-Yang Balance slider) ────────
  const personaSlider = document.getElementById('agent-persona-temp');
  const personaTempVal = document.getElementById('agent-persona-temp-val');
  const personaToneEl = document.getElementById('agent-persona-tone');

  if (personaSlider && personaTempVal && personaToneEl) {
    personaSlider.addEventListener('input', (e) => {
      const t = parseFloat(e.target.value);
      window.dispatch('UPDATE_SETTING', { key: 'agentPersonaTemp', value: t });
    });
    personaSlider.addEventListener('change', (e) => {
      const agent = window.state.agents[window.state.selectedAgentId];
      const agentName = agent ? agent.name : 'selected agent';
      const getTone = (temp) => {
        if (temp <= 0.15) return 'Surgical';
        if (temp <= 0.35) return 'Analytical';
        if (temp <= 0.65) return 'Balanced';
        if (temp <= 0.95) return 'Expressive';
        if (temp <= 1.2) return 'Inventive';
        return 'Chaotic';
      };
      log(
        `◈️ Yin-Yang Balance: ${agentName} persona temp set to ${window.state.agentPersonaTemp.toFixed(2)} [${getTone(window.state.agentPersonaTemp)}].`,
      );
    });
  }

  // ─── VRAM Hibernation & Quantization Matrix ─────────────────
  const aggressiveToggle = document.getElementById('settings-aggressive-unload');
  if (aggressiveToggle) {
    aggressiveToggle.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'aggressiveUnload', value: e.target.checked });
      log(
        `◈ VRAM Hibernation: Aggressive model unloading ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`,
      );
    });
  }

  const maxModelsSlider = document.getElementById('settings-max-models');
  const maxModelsVal = document.getElementById('settings-max-models-val');
  if (maxModelsSlider && maxModelsVal) {
    maxModelsSlider.addEventListener('input', (e) => {
      window.dispatch('UPDATE_SETTING', {
        key: 'maxConcurrentModels',
        value: parseInt(e.target.value),
      });
    });
    maxModelsSlider.addEventListener('change', (e) => {
      log(
        `◈ VRAM Limit: Max concurrent local models set to [${window.state.maxConcurrentModels}].`,
      );
    });
  }

  ['quant-sensei', 'quant-coder', 'quant-tester'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', (e) => {
        const role = id.split('-')[1];
        window.dispatch('UPDATE_SETTING', {
          key: `quantizationMatrix.${role}`,
          value: e.target.value,
        });
        log(
          `◈️ Quantization Strategy: Assigned [${e.target.value}] to ${role.toUpperCase()} tasks.`,
        );
      });
    }
  });

  // ─── Kill Switch & Blast Radius ──────────────────────────────
  const sandboxDirInput = document.getElementById('settings-sandbox-dir');
  if (sandboxDirInput) {
    sandboxDirInput.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', {
        key: 'sandboxDir',
        value: e.target.value || '/workspace',
      });
      log(`◈ Sandbox Boundary: Root directory restricted to [${window.state.sandboxDir}].`);
    });
  }

  const sandboxNetSelect = document.getElementById('settings-sandbox-network');
  if (sandboxNetSelect) {
    sandboxNetSelect.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'sandboxNetLevel', value: e.target.value });
      const labels = {
        isolated: 'Isolated LAN',
        none: 'Air-Gapped (No Network)',
        unrestricted: 'Unrestricted Cloud',
      };
      log(`◈ Sandbox Network Stance: Changed to [${labels[e.target.value]}].`);
    });
  }

  const watchdogToggle = document.getElementById('settings-watchdog-toggle');
  if (watchdogToggle) {
    watchdogToggle.addEventListener('change', (e) => {
      window.dispatch('UPDATE_SETTING', { key: 'watchdogEnabled', value: e.target.checked });
      log(
        `◈ AST Escape Watchdog: ${e.target.checked ? 'ARMED — preventing host file escape.' : 'DISARMED ◈️'}`,
        e.target.checked ? 'success' : 'error',
      );
    });
  }
};

// --- OMNI-JUTSU COMMAND PALETTE (TASK 4.1) ---
(function () {
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCommandPalette();
    }
  });

  function openCommandPalette() {
    if (document.getElementById('omni-command-palette')) return;

    const palette = document.createElement('div');
    palette.id = 'omni-command-palette';
    palette.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    palette.innerHTML = `
      <div class="glass-card" style="width: 600px; max-width: 90%; background: rgba(15, 10, 8, 0.95); border: 1px solid var(--accent-cyan); border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.8), 0 0 15px rgba(6,182,212,0.2); padding: 20px; box-sizing: border-box;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--accent-cyan); font-family: var(--font-mono); margin-bottom: 12px; display: flex; justify-content: space-between;">
          <span>◈ Omni-Jutsu Command Palette ◈</span>
          <span>Esc to Close</span>
        </div>
        <input type="text" id="palette-input" placeholder="Type a command (e.g. > pause coder1)..." style="width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 12px 16px; color: var(--text-primary); font-family: var(--font-mono); font-size: 1.1rem; outline: none; box-sizing: border-box; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);">
        <div style="margin-top: 12px; font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">
          Supported commands: <code style="color: var(--text-secondary);">> pause [agent_id]</code>
        </div>
      </div>
    `;

    document.body.appendChild(palette);

    const input = document.getElementById('palette-input');
    if (input) {
      input.focus();

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closePalette();
        } else if (e.key === 'Enter') {
          const val = input.value;
          const handled = executePaletteCommand(val);
          if (handled) {
            closePalette();
          }
        }
      });
    }

    palette.addEventListener('click', (e) => {
      if (e.target === palette) {
        closePalette();
      }
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closePalette();
      }
    };
    window.addEventListener('keydown', escHandler);

    function closePalette() {
      palette.remove();
      window.removeEventListener('keydown', escHandler);
    }
  }

  function executePaletteCommand(val) {
    const clean = val.trim();
    const pauseMatch = clean.match(/^>\s*pause\s+(\w+)/i);
    if (pauseMatch) {
      const target = pauseMatch[1].toLowerCase();
      if (window.state && window.state.agents && window.state.agents[target]) {
        window.dispatch('UPDATE_AGENT_STATUS', { agentId: target, status: 'idle' });
        if (typeof window.addLog === 'function') {
          window.addLog(
            'system',
            'warning',
            `Agent ${target} status set to IDLE via command palette.`,
          );
        }
        if (typeof window.showToast === 'function') {
          window.showToast(`Paused agent: ${target}`, 'info');
        }
        return true;
      } else {
        if (typeof window.showToast === 'function') {
          window.showToast(`Unknown agent: ${target}`, 'error');
        }
      }
      return true;
    }
    return false;
  }
})();
