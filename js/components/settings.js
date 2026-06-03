// ============================================================
// DOJO RULES — SETTINGS SUB-TAB RENDERER
// ============================================================

window.renderSettingsSubtab = function (tabId) {
  window.state.activeSettingsTab = tabId;

  // Toggle active s-tab button
  document.querySelectorAll('.settings-tabs .s-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.sTab === tabId);
  });

  // Toggle active s-pane-view
  document.querySelectorAll('.settings-content .s-pane-view').forEach((pane) => {
    pane.classList.remove('active');
  });
  const targetPane = document.getElementById(`s-content-${tabId}`);
  if (targetPane) targetPane.classList.add('active');

  // Populate dynamic content per pane
  const renderers = {
    general: window.renderGeneralPane,
    models: window.renderModelsPane,
    'llm-providers': window.renderLLMProvidersPane,
    'agent-studio-settings': window.renderAgentStudioSettingsPane,
    'workflow-settings': window.renderWorkflowSettingsPane,
    'debate-settings': window.renderDebateSettingsPane,
    mcp: window.renderMCPPane,
    'prompts-skills': window.renderPromptsSkillsPane,
    rag: window.renderRAGPane,
    'testing-qa': window.renderTestingQAPane,
    'deploy-ops': window.renderDeployOpsPane,
    'runtime-net': window.renderRuntimePane,
    'notifications-integrations': window.renderNotificationsPane,
    'repo-connect': window.renderRepoConnectPane,
    'iam-ecosystem': window.renderIAMEcosystemPane,
  };
  if (renderers[tabId]) renderers[tabId]();
};

window.renderModelsPane = function () {
  const tbody = document.getElementById('models-allocation-list');
  if (!tbody) return;

  const roles = [
    { key: 'orchestrator', label: 'Sensei (Orchestrator)' },
    { key: 'architect', label: 'Grandmaster (Architect)' },
    { key: 'coder1', label: 'Jutsu Coder (BE)' },
    { key: 'coder2', label: 'Genjutsu Coder (FE)' },
    { key: 'tester', label: 'Kunai Tester' },
    { key: 'security', label: 'Stealth Auditor' },
    { key: 'devops', label: 'Chunin DevOps' },
    { key: 'documentation', label: 'Scroll Keeper' },
    { key: 'performance', label: 'Taijutsu Engineer' },
    { key: 'hunter', label: 'Stealth Scout' },
    { key: 'updater', label: 'Patch Chunin' },
  ];

  tbody.innerHTML = roles
    .map((r) => {
      const agent = window.state.agents[r.key];
      const currentModel = agent ? agent.route : '—';
      const isLocal = currentModel.includes('Ollama');
      const isActive = agent && agent.status !== 'idle' && agent.status !== 'sleeping';

      return `
      <tr>
        <td style="font-weight:500;">${agent && window.ninjaIcons ? window.ninjaIcons.get(agent.icon) : window.ninjaIcons ? window.ninjaIcons.get('square') : ''} ${r.label}</td>
        <td>
          <select class="form-select text-xs model-role-select" data-agent="${r.key}" style="padding: 4px 8px; font-size:0.75rem;">
            ${window.state.availableLocalModels.map((m) => `<option value="${m}" ${m === currentModel ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </td>
        <td><span class="badge badge-outline provider-type ${isLocal ? 'local' : 'cloud'}">${isLocal ? 'Ollama Local' : 'Cloud API'}</span></td>
        <td>
          <span class="status-indicator-pulse ${isActive ? 'online' : 'offline'}" style="display:inline-block; margin-right:6px;"></span>
          <span style="font-size:0.75rem; color:var(--text-secondary);">${agent ? agent.ram : '—'}</span>
        </td>
      </tr>
    `;
    })
    .join('');

  // Attach change listeners to model select dropdowns
  tbody.querySelectorAll('.model-role-select').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      const agentKey = e.target.dataset.agent;
      const newModel = e.target.value;
      if (window.state.agents[agentKey]) {
        const oldModel = window.state.agents[agentKey].route;
        window.state.agents[agentKey].route = newModel;
        window.addLog(
          'system',
          'info',
          `Model reassigned: ${window.state.agents[agentKey].name} → ${newModel} (was ${oldModel}). VRAM rebalancing...`,
        );
        // Animate VRAM bar
        window.updateVRAMBar();
      }
    });
  });

  window.updateVRAMBar();
};

window.updateVRAMBar = function () {
  const usedFill = document.getElementById('vram-bar-fill');
  const usedText = document.getElementById('vram-used-text');
  if (!usedFill || !usedText) return;

  // Calculate simulated VRAM based on active local models
  let totalVRAM = 0;
  Object.values(window.state.agents).forEach((agent) => {
    if (agent.status !== 'idle' && agent.status !== 'sleeping') {
      if (agent.route.includes('8B') || agent.route.includes('7B')) totalVRAM += 5.5;
      else if (agent.route.includes('6.7B')) totalVRAM += 4.8;
      else if (
        agent.route.includes('Cloud') ||
        agent.route.includes('Flash') ||
        agent.route.includes('Pro')
      )
        totalVRAM += 0.2;
    }
  });

  const maxVRAM = 24.0;
  const usedGB = Math.min(totalVRAM, maxVRAM).toFixed(1);
  const pct = Math.min((totalVRAM / maxVRAM) * 100, 100);
  usedFill.style.width = `${pct}%`;
  usedFill.style.background =
    pct > 85
      ? 'linear-gradient(90deg, #ef4444, #ff7300)'
      : 'linear-gradient(90deg, #ff7300, #ffb300)';
  usedText.innerText = `${usedGB} GB / ${maxVRAM} GB`;
};

window.renderMCPPane = function () {
  const tbody = document.getElementById('mcp-servers-list');
  const toolsList = document.getElementById('mcp-tools-list');

  if (tbody) {
    tbody.innerHTML = window.state.mcpServers
      .map(
        (srv) => `
      <tr>
        <td style="font-family:var(--font-mono); font-size:0.78rem; color:var(--accent-cyan);">${srv.id}</td>
        <td style="font-size:0.75rem;">${srv.tools.join(', ')}</td>
        <td>
          <span class="badge ${srv.status === 'active' ? 'badge-success' : 'badge-outline'}">${srv.status}</span>
        </td>
        <td>
          <label class="switch" style="transform:scale(0.8); transform-origin:left center;">
            <input type="checkbox" class="mcp-server-toggle" data-id="${srv.id}" ${srv.status === 'active' ? 'checked' : ''}>
            <span class="slider-toggle"></span>
          </label>
        </td>
      </tr>
    `,
      )
      .join('');

    // Attach toggle listeners
    tbody.querySelectorAll('.mcp-server-toggle').forEach((toggle) => {
      toggle.addEventListener('change', (e) => {
        const srvId = e.target.dataset.id;
        const srv = window.state.mcpServers.find((s) => s.id === srvId);
        if (srv) {
          srv.status = e.target.checked ? 'active' : 'inactive';
          window.addLog(
            'system',
            'info',
            `MCP Server [${srvId}] ${e.target.checked ? 'MOUNTED' : 'UNMOUNTED'}.`,
          );
          window.renderMCPPane();
        }
      });
    });
  }

  if (toolsList) {
    const activeTools = window.state.mcpServers
      .filter((s) => s.status === 'active')
      .flatMap((s) =>
        s.tools.map(
          (t) =>
            `<div class="tool-item">${s.id}:<span style="color:var(--accent-purple); margin-left:4px;">${t}</span></div>`,
        ),
      );
    toolsList.innerHTML = activeTools.length
      ? activeTools.join('')
      : '<div style="color:var(--text-muted); font-size:0.75rem;">No active MCP servers mounted.</div>';
  }

  // MCP form submit
  const mcpForm = document.getElementById('mcp-server-form');
  if (mcpForm && !mcpForm.dataset.wired) {
    mcpForm.dataset.wired = '1';
    document.getElementById('mcp-server-submit').addEventListener('click', () => {
      const id = document.getElementById('mcp-server-id').value.trim();
      const cmd = document.getElementById('mcp-server-cmd').value.trim();
      const args = document.getElementById('mcp-server-args').value.trim();
      if (!id || !cmd) {
        alert('Enter a Server ID and Command.');
        return;
      }
      window.state.mcpServers.push({
        id,
        name: id,
        command: cmd,
        args,
        status: 'active',
        tools: ['custom_tool'],
      });
      window.addLog('system', 'success', `MCP Server [${id}] mounted. Command: ${cmd}`);
      document.getElementById('mcp-server-id').value = '';
      document.getElementById('mcp-server-cmd').value = '';
      document.getElementById('mcp-server-args').value = '';
      window.renderMCPPane();
    });
  }
};

window.renderPromptsSkillsPane = function () {
  // Load prompt for current selected agent
  const agentSelect = document.getElementById('prompt-agent-select');
  const promptTA = document.getElementById('prompt-textarea');
  if (agentSelect && promptTA) {
    promptTA.value = window.state.agentPrompts[agentSelect.value] || '';

    if (!agentSelect.dataset.wired) {
      agentSelect.dataset.wired = '1';
      agentSelect.addEventListener('change', () => {
        promptTA.value = window.state.agentPrompts[agentSelect.value] || '';
      });
    }
  }

  // Save prompt
  const saveBtn = document.getElementById('prompt-save-btn');
  if (saveBtn && !saveBtn.dataset.wired) {
    saveBtn.dataset.wired = '1';
    saveBtn.addEventListener('click', () => {
      const role = agentSelect.value;
      window.state.agentPrompts[role] = promptTA.value;
      window.addLog('system', 'success', `Stealth instruction scroll updated for ${role}.`);
      saveBtn.innerText = 'Inscribed ◈';
      setTimeout(() => {
        saveBtn.innerText = 'Inscribe Prompt Scroll';
      }, 1500);
    });
  }

  // Render custom skills list
  window.renderCustomSkillsList();

  // Skill forge form
  const skillForm = document.getElementById('skill-forge-form');
  if (skillForm && !skillForm.dataset.wired) {
    skillForm.dataset.wired = '1';
    document.getElementById('skill-forge-submit').addEventListener('click', () => {
      const id = document.getElementById('skill-id').value.trim();
      const desc = document.getElementById('skill-desc').value.trim();
      const prompt = document.getElementById('skill-prompt').value.trim();
      if (!id || !desc) {
        alert('Enter a Skill ID and description.');
        return;
      }
      window.state.customSkills.push({ id, desc, prompt });
      window.addLog(
        'system',
        'success',
        `Custom Jutsu Skill [${id}] forged and added to the Skill Archives.`,
      );
      document.getElementById('skill-id').value = '';
      document.getElementById('skill-desc').value = '';
      document.getElementById('skill-prompt').value = '';
      window.renderCustomSkillsList();
    });
  }
};

window.renderCustomSkillsList = function () {
  const container = document.getElementById('custom-skills-list');
  if (!container) return;
  container.innerHTML =
    window.state.customSkills
      .map(
        (skill) => `
    <div class="skill-tag-card" style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:rgba(255,115,0,0.06); border:1px solid rgba(255,115,0,0.15); border-radius:6px; margin-bottom:6px;">
      <div>
        <div style="font-size:0.78rem; font-weight:600; color:var(--accent-purple);">${skill.id}</div>
        <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:2px;">${skill.desc}</div>
      </div>
      <button class="btn btn-outline btn-sm skill-delete-btn" data-id="${skill.id}" style="padding:2px 8px; font-size:0.7rem;">◈️</button>
    </div>
  `,
      )
      .join('') ||
    '<div style="color:var(--text-muted); font-size:0.75rem;">No custom skills forged yet.</div>';

  container.querySelectorAll('.skill-delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      window.state.customSkills = window.state.customSkills.filter((s) => s.id !== id);
      window.renderCustomSkillsList();
    });
  });
};

window.renderRAGPane = function () {
  const ragChunkSlider = document.getElementById('rag-chunk-size');
  const ragChunkVal = document.getElementById('rag-chunk-size-val');
  if (ragChunkSlider && ragChunkVal && !ragChunkSlider.dataset.wired) {
    ragChunkSlider.dataset.wired = '1';
    ragChunkSlider.addEventListener('input', (e) => {
      ragChunkVal.innerText = e.target.value;
    });
  }
  const ragOverlapSlider = document.getElementById('rag-chunk-overlap');
  const ragOverlapVal = document.getElementById('rag-chunk-overlap-val');
  if (ragOverlapSlider && ragOverlapVal && !ragOverlapSlider.dataset.wired) {
    ragOverlapSlider.dataset.wired = '1';
    ragOverlapSlider.addEventListener('input', (e) => {
      ragOverlapVal.innerText = e.target.value;
    });
  }

  // RAG document ingest
  const ragIngestBtn = document.getElementById('rag-ingest-submit');
  if (ragIngestBtn && !ragIngestBtn.dataset.wired) {
    ragIngestBtn.dataset.wired = '1';
    ragIngestBtn.addEventListener('click', () => {
      const filename = document.getElementById('rag-filename').value.trim();
      if (!filename) {
        alert('Enter a scroll filename to ingest.');
        return;
      }
      const chunks = Math.floor(Math.random() * 30) + 8;
      window.state.ragConfig.push({
        name: filename,
        size: `${Math.floor(Math.random() * 50) + 5} KB`,
        status: 'Indexing...',
        chunks,
      });
      window.renderRAGDocsList();
      const ts = new Date().toTimeString().split(' ')[0];
      window.addLog('system', 'info', `RAG ingestion started: ${filename} (${chunks} chunks)...`);
      document.getElementById('rag-filename').value = '';
      setTimeout(() => {
        const doc = window.state.ragConfig.find((d) => d.name === filename);
        if (doc) doc.status = 'Indexed';
        window.renderRAGDocsList();
        window.addLog(
          'system',
          'success',
          `RAG Vectorization complete: ${filename}. ${chunks} chunks indexed.`,
        );
      }, 2000);
    });
  }

  // RAG drag drop box
  const dragBox = document.getElementById('rag-drag-drop-box');
  if (dragBox && !dragBox.dataset.wired) {
    dragBox.dataset.wired = '1';
    dragBox.addEventListener('click', () => {
      document.getElementById('rag-filename').value =
        `project_spec_${Date.now().toString().slice(-4)}.md`;
    });
    dragBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragBox.style.borderColor = 'var(--accent-purple)';
    });
    dragBox.addEventListener('dragleave', () => {
      dragBox.style.borderColor = 'rgba(255,115,0,0.25)';
    });
    dragBox.addEventListener('drop', (e) => {
      e.preventDefault();
      dragBox.style.borderColor = 'rgba(255,115,0,0.25)';
      const files = e.dataTransfer.files;
      if (files.length) document.getElementById('rag-filename').value = files[0].name;
    });
  }

  window.renderRAGDocsList();
};

window.renderRAGDocsList = function () {
  const tbody = document.getElementById('rag-documents-list');
  if (!tbody) return;
  tbody.innerHTML =
    window.state.ragConfig
      .map(
        (doc) => `
    <tr>
      <td style="font-family:var(--font-mono); font-size:0.78rem; color:var(--accent-cyan);">${doc.name}</td>
      <td style="font-size:0.78rem;">${doc.size}</td>
      <td><span class="badge ${doc.status === 'Indexed' ? 'badge-success' : 'badge-warning'}">${doc.status}</span></td>
      <td style="font-size:0.75rem;">${doc.chunks} chunks</td>
    </tr>
  `,
      )
      .join('') ||
    '<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:16px;">No scrolls indexed yet.</td></tr>';
};

window.renderRuntimePane = function () {
  // Wire runtime-specific controls
  wireSlider('settings-temp', 'settings-temp-val', (v) => v);
  wireSlider('settings-context', 'settings-context-val', (v) => v);
  wireSlider(
    'daily-limit-slider-new',
    'daily-limit-val-new',
    (v) => `$${parseFloat(v).toFixed(2)}`,
  );
  wireSlider('alert-threshold-slider-new', 'alert-threshold-val-new', (v) => `${v}%`);
  wireSlider('settings-release-chakra', 'settings-release-chakra-val', (v) => v);
  wireSlider('settings-scroll-tokens', 'settings-scroll-tokens-val', (v) => v);
  wireSlider('settings-ast-limit', null, (v) => v);
};

// General Settings Pane
window.renderGeneralPane = function () {
  const projectNameInput = document.getElementById('project-name-input');
  const projectDescInput = document.getElementById('project-desc-input');
  const timezoneSelect = document.getElementById('project-timezone');

  if (projectNameInput) {
    projectNameInput.value = window.state.project?.name || 'Untitled Project';
    wireInput(projectNameInput, 'project.name');
  }
  if (projectDescInput) {
    projectDescInput.value = window.state.project?.description || '';
    wireInput(projectDescInput, 'project.description');
  }
  if (timezoneSelect) {
    timezoneSelect.value = window.state.project?.timezone || 'UTC';
    wireSelect(timezoneSelect, 'project.timezone');
  }

  // Appearance settings
  const densitySelect = document.getElementById('settings-density');
  const animToggle = document.getElementById('settings-animations-toggle');
  const sidebarToggle = document.getElementById('settings-sidebar-collapse');

  if (densitySelect) {
    densitySelect.value = window.state.appearance?.density || 'comfortable';
    wireSelect(densitySelect, 'appearance.density');
  }
  if (animToggle) {
    animToggle.checked = window.state.appearance?.motionEnabled !== false;
    wireToggle(animToggle, 'appearance.motionEnabled');
  }
  if (sidebarToggle) {
    sidebarToggle.checked = window.state.appearance?.sidebarCollapsed || false;
    wireToggle(sidebarToggle, 'appearance.sidebarCollapsed');
  }

  // Autosave settings
  const autosaveToggle = document.getElementById('settings-autosave-toggle');
  const confirmToggle = document.getElementById('settings-confirm-destructive');

  if (autosaveToggle) {
    autosaveToggle.checked = window.state.settings?.autosave !== false;
    wireToggle(autosaveToggle, 'settings.autosave');
  }
  if (confirmToggle) {
    confirmToggle.checked = window.state.settings?.confirmDestructive !== false;
    wireToggle(confirmToggle, 'settings.confirmDestructive');
  }

  wireSlider('settings-autosave-interval', 'settings-autosave-interval-val', (v) => `${v}s`);

  // Keyboard shortcuts
  const shortcutsToggle = document.getElementById('settings-shortcuts-toggle');
  if (shortcutsToggle) {
    shortcutsToggle.checked = window.state.ui?.shortcuts !== false;
    wireToggle(shortcutsToggle, 'ui.shortcuts');
  }
};

// LLM Providers Pane
window.renderLLMProvidersPane = function () {
  wireInput(document.getElementById('gemini-api-key'), 'integrations.gemini.apiKey');
  wireInput(document.getElementById('openai-api-key'), 'integrations.openai.apiKey');
  wireInput(document.getElementById('anthropic-api-key'), 'integrations.anthropic.apiKey');

  wireSlider('llm-rate-limit', 'llm-rate-limit-val', (v) => v);

  const circuitToggle = document.getElementById('llm-circuit-breaker');
  const failoverToggle = document.getElementById('llm-failover');

  if (circuitToggle) {
    circuitToggle.checked = window.state.llm?.circuitBreaker !== false;
    wireToggle(circuitToggle, 'llm.circuitBreaker');
  }
  if (failoverToggle) {
    failoverToggle.checked = window.state.llm?.failover !== false;
    wireToggle(failoverToggle, 'llm.failover');
  }
};

// Agent Studio Settings Pane
window.renderAgentStudioSettingsPane = function () {
  wireSlider('agent-default-temp', 'agent-default-temp-val', (v) => parseFloat(v).toFixed(2));
  wireSlider('agent-default-context', 'agent-default-context-val', (v) => v);
  wireSlider('agent-default-retries', 'agent-default-retries-val', (v) => v);
};

// Workflow Settings Pane
window.renderWorkflowSettingsPane = function () {
  const autonomySelect = document.getElementById('workflow-autonomy-policy');
  const autoPromoteToggle = document.getElementById('workflow-auto-promote');
  const rollbackToggle = document.getElementById('workflow-enable-rollback');

  if (autonomySelect) {
    autonomySelect.value = window.state.workflow?.autonomyPolicy || 'advisory';
    wireSelect(autonomySelect, 'workflow.autonomyPolicy');
  }
  if (autoPromoteToggle) {
    autoPromoteToggle.checked = window.state.workflow?.autoPromote !== false;
    wireToggle(autoPromoteToggle, 'workflow.autoPromote');
  }
  if (rollbackToggle) {
    rollbackToggle.checked = window.state.workflow?.enableRollback !== false;
    wireToggle(rollbackToggle, 'workflow.enableRollback');
  }

  wireSlider('workflow-max-retries', 'workflow-max-retries-val', (v) => v);
  wireSlider('workflow-backoff', 'workflow-backoff-val', (v) => `${v}x`);
};

// Debate Settings Pane
window.renderDebateSettingsPane = function () {
  wireSlider('debate-confidence-threshold', 'debate-confidence-threshold-val', (v) => `${v}%`);

  const adrToggle = document.getElementById('debate-auto-adr');
  const overrideToggle = document.getElementById('debate-human-override');

  if (adrToggle) {
    adrToggle.checked = window.state.debate?.autoADR !== false;
    wireToggle(adrToggle, 'debate.autoADR');
  }
  if (overrideToggle) {
    overrideToggle.checked = window.state.debate?.humanOverride || false;
    wireToggle(overrideToggle, 'debate.humanOverride');
  }
};

// Testing/QA Pane
window.renderTestingQAPane = function () {
  const stanceRadios = document.querySelectorAll('input[name="testing-stance"]');
  stanceRadios.forEach((radio) => {
    radio.checked = radio.value === (window.state.tddStance || 'genin');
    radio.addEventListener('change', () => {
      if (radio.checked) window.store.setState('tddStance', radio.value);
    });
  });

  const mutationToggle = document.getElementById('testing-mutation-toggle');
  if (mutationToggle) {
    mutationToggle.checked = window.state.mutationTesting || false;
    wireToggle(mutationToggle, 'mutationTesting');
  }

  wireSlider('testing-coverage-gate', 'testing-coverage-gate-val', (v) => `${v}%`);

  const blockToggle = document.getElementById('security-block-critical');
  const secretToggle = document.getElementById('security-secret-scan');
  const auditToggle = document.getElementById('security-dep-audit');

  if (blockToggle) {
    blockToggle.checked = window.state.security?.blockCritical !== false;
    wireToggle(blockToggle, 'security.blockCritical');
  }
  if (secretToggle) {
    secretToggle.checked = window.state.security?.secretScan !== false;
    wireToggle(secretToggle, 'security.secretScan');
  }
  if (auditToggle) {
    auditToggle.checked = window.state.security?.depAudit !== false;
    wireToggle(auditToggle, 'security.depAudit');
  }
};

// Deploy/Ops Pane
window.renderDeployOpsPane = function () {
  const midnightToggle = document.getElementById('deploy-midnight');
  const rollbackToggle = document.getElementById('deploy-auto-rollback');

  if (midnightToggle) {
    midnightToggle.checked = window.state.midnightDeploy !== false;
    wireToggle(midnightToggle, 'midnightDeploy');
  }
  if (rollbackToggle) {
    rollbackToggle.checked = window.state.autoRollback !== false;
    wireToggle(rollbackToggle, 'autoRollback');
  }

  wireSlider('deploy-release-chakra', 'deploy-release-chakra-val', (v) => v);
};

// Notifications/Integrations Pane
window.renderNotificationsPane = function () {
  wireToggle(document.getElementById('notif-task-complete'), 'notifications.taskComplete');
  wireToggle(document.getElementById('notif-decisions'), 'notifications.decisions');
  wireToggle(document.getElementById('notif-security'), 'notifications.security');

  // GitHub
  wireToggle(document.getElementById('github-enabled'), 'integrations.github.enabled');
  wireInput(document.getElementById('github-token'), 'integrations.github.token');
  wireInput(document.getElementById('github-repo'), 'integrations.github.repo');

  // Slack
  wireToggle(document.getElementById('slack-enabled'), 'integrations.slack.enabled');
  wireInput(document.getElementById('slack-webhook'), 'integrations.slack.webhookUrl');
  wireInput(document.getElementById('slack-channel'), 'integrations.slack.channel');

  // Jira
  wireToggle(document.getElementById('jira-enabled'), 'integrations.jira.enabled');
  wireInput(document.getElementById('jira-base'), 'integrations.jira.baseUrl');
  wireInput(document.getElementById('jira-project'), 'integrations.jira.projectKey');
  wireInput(document.getElementById('jira-api-token'), 'integrations.jira.apiToken');
};

window.renderRepoConnectPane = function () {
  if (!window.state.integrations) window.state.integrations = {};
  if (!window.state.integrations.vcs) {
    window.state.integrations.vcs = {
      provider: null,
      localPath: '',
      branch: 'main',
      ignoreRules: '',
    };
  }

  // OAuth buttons
  const oauthButtons = document.querySelectorAll('.oauth-btn');
  oauthButtons.forEach((btn) => {
    const provider = btn.dataset.provider;
    btn.classList.toggle('active', window.state.integrations.vcs.provider === provider);

    if (!btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => {
        window.state.integrations.vcs.provider = provider;
        window.addLog(
          'system',
          'info',
          `VCS OAuth Authentication initialized for ${provider}. Waiting for authorization handshakes...`,
        );
        document.querySelectorAll('.oauth-btn').forEach((b) => {
          b.classList.toggle('active', b.dataset.provider === provider);
        });
      });
    }
  });

  // Local Dropzone
  const dropzone = document.getElementById('local-dropzone');
  const dropzoneStatus = document.getElementById('local-dropzone-status');

  function updateDropzoneStatus() {
    if (dropzoneStatus) {
      if (window.state.integrations.vcs.localPath) {
        dropzoneStatus.innerText = `Mapped Path: ${window.state.integrations.vcs.localPath}`;
        dropzoneStatus.style.display = 'block';
      } else {
        dropzoneStatus.style.display = 'none';
      }
    }
  }

  updateDropzoneStatus();

  if (dropzone && !dropzone.dataset.wired) {
    dropzone.dataset.wired = '1';

    dropzone.addEventListener('click', () => {
      const path = prompt(
        'Enter local directory path:',
        window.state.integrations.vcs.localPath ||
          'C:/Users/viren/Downloads/Kimi_Agent_Autonomous Coding Agent Swarm',
      );
      if (path !== null) {
        window.state.integrations.vcs.localPath = path.trim();
        window.addLog(
          'system',
          'info',
          `Workspace root directory mapped to local path: ${window.state.integrations.vcs.localPath}`,
        );
        updateDropzoneStatus();
      }
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragging');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragging');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragging');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const path = files[0].path || `/workspace/${files[0].name}`;
        window.state.integrations.vcs.localPath = path;
        window.addLog(
          'system',
          'info',
          `Workspace root directory mapped via drag-and-drop: ${path}`,
        );
        updateDropzoneStatus();
      }
    });
  }

  // Branch & Ignore form inputs
  const branchSelect = document.getElementById('vcs-branch-select');
  const ignoreInput = document.getElementById('vcs-ignore-input');

  if (branchSelect) {
    branchSelect.value = window.state.integrations.vcs.branch || 'main';
  }
  if (ignoreInput) {
    ignoreInput.value = window.state.integrations.vcs.ignoreRules || '';
  }

  const form = document.getElementById('vcs-config-form');
  if (form && !form.dataset.wired) {
    form.dataset.wired = '1';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.state.integrations.vcs.branch = branchSelect ? branchSelect.value : 'main';
      window.state.integrations.vcs.ignoreRules = ignoreInput ? ignoreInput.value.trim() : '';
      window.addLog(
        'system',
        'success',
        `Repository Synchronization Connection established successfully! Branch Target: ${window.state.integrations.vcs.branch}, Ignore rules: [${window.state.integrations.vcs.ignoreRules}]`,
      );
    });
  }
};

window.renderIAMEcosystemPane = function () {
  if (!window.state.permissions) window.state.permissions = {};
  if (!window.state.permissions.roles) {
    window.state.permissions.roles = [
      {
        id: 'admin',
        name: 'Shadow Master',
        desc: 'Full control over all swarm operations',
        color: '#ff7300',
        members: 1,
      },
      {
        id: 'developer',
        name: 'Chunin Coder',
        desc: 'Can code, review and approve PRs. No deployment access.',
        color: '#9C27B0',
        members: 3,
      },
      {
        id: 'viewer',
        name: 'Scout Observer',
        desc: 'Read-only access to all screens and logs.',
        color: '#00BCD4',
        members: 5,
      },
    ];
  }

  window.state.permissions.roles.forEach((role) => {
    if (!role.permissions) {
      if (role.id === 'admin' || role.name === 'Shadow Master') {
        role.permissions = {
          approvePR: true,
          deploy: true,
          manageSecrets: true,
          modifyPrompts: true,
        };
      } else if (role.id === 'developer' || role.name === 'Chunin Coder') {
        role.permissions = {
          approvePR: true,
          deploy: false,
          manageSecrets: false,
          modifyPrompts: false,
        };
      } else {
        role.permissions = {
          approvePR: false,
          deploy: false,
          manageSecrets: false,
          modifyPrompts: false,
        };
      }
    }
  });

  // Render role permissions grid table
  const matrixBody = document.getElementById('iam-matrix-body');
  if (matrixBody) {
    matrixBody.innerHTML = window.state.permissions.roles
      .map((role) => {
        const p = role.permissions;
        return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 8px; font-weight: 500; color: var(--text-primary);">${role.name}</td>
          <td style="padding: 8px; text-align: center;">
            <input type="checkbox" class="role-perm-cb" data-role="${role.id}" data-perm="approvePR" ${p.approvePR ? 'checked' : ''}>
          </td>
          <td style="padding: 8px; text-align: center;">
            <input type="checkbox" class="role-perm-cb" data-role="${role.id}" data-perm="deploy" ${p.deploy ? 'checked' : ''}>
          </td>
          <td style="padding: 8px; text-align: center;">
            <input type="checkbox" class="role-perm-cb" data-role="${role.id}" data-perm="manageSecrets" ${p.manageSecrets ? 'checked' : ''}>
          </td>
          <td style="padding: 8px; text-align: center;">
            <input type="checkbox" class="role-perm-cb" data-role="${role.id}" data-perm="modifyPrompts" ${p.modifyPrompts ? 'checked' : ''}>
          </td>
        </tr>
      `;
      })
      .join('');

    matrixBody.querySelectorAll('.role-perm-cb').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        const roleId = e.target.dataset.role;
        const perm = e.target.dataset.perm;
        const isChecked = e.target.checked;
        const role = window.state.permissions.roles.find((r) => r.id === roleId);
        if (role) {
          role.permissions[perm] = isChecked;
          if (window.state.permissions.matrix && window.state.permissions.matrix[roleId]) {
            const keyMap = {
              approvePR: 'canApprove',
              deploy: 'canDeploy',
              manageSecrets: 'canManageSecrets',
              modifyPrompts: 'canModifyPrompts',
            };
            const matrixKey = keyMap[perm] || perm;
            window.state.permissions.matrix[roleId][matrixKey] = isChecked;
          }
          window.addLog(
            'system',
            'info',
            `Updated capability matrix: [${role.name}] ${perm} set to ${isChecked}.`,
          );
        }
      });
    });
  }

  // Ecosystem inputs
  const ecoAnthropic = document.getElementById('eco-anthropic-key');
  const ecoOpenai = document.getElementById('eco-openai-key');
  const ecoSlack = document.getElementById('eco-slack-webhook');

  if (ecoAnthropic) {
    if (!window.state.integrations.anthropic) window.state.integrations.anthropic = {};
    ecoAnthropic.value = window.state.integrations.anthropic.apiKey || '';
    ecoAnthropic.addEventListener('change', () => {
      window.state.integrations.anthropic.apiKey = ecoAnthropic.value;
      window.addLog('system', 'info', 'Anthropic API key updated.');
    });
  }
  if (ecoOpenai) {
    if (!window.state.integrations.openai) window.state.integrations.openai = {};
    ecoOpenai.value = window.state.integrations.openai.apiKey || '';
    ecoOpenai.addEventListener('change', () => {
      window.state.integrations.openai.apiKey = ecoOpenai.value;
      window.addLog('system', 'info', 'OpenAI API key updated.');
    });
  }
  if (ecoSlack) {
    if (!window.state.integrations.slack) window.state.integrations.slack = {};
    ecoSlack.value = window.state.integrations.slack.webhookUrl || '';
    ecoSlack.addEventListener('change', () => {
      window.state.integrations.slack.webhookUrl = ecoSlack.value;
      window.addLog('system', 'info', 'Slack webhook URL updated.');
    });
  }

  // Double-safe password toggle wiring
  document.querySelectorAll('#s-content-iam-ecosystem .password-toggle').forEach((btn) => {
    if (!btn.dataset.wiredToggle) {
      btn.dataset.wiredToggle = '1';
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        const iconEye = btn.querySelector('.icon-eye');
        const iconEyeOff = btn.querySelector('.icon-eye-off');
        if (!input) return;

        if (input.type === 'password') {
          input.type = 'text';
          if (iconEye) iconEye.style.display = 'none';
          if (iconEyeOff) iconEyeOff.style.display = 'block';
        } else {
          input.type = 'password';
          if (iconEye) iconEye.style.display = 'block';
          if (iconEyeOff) iconEyeOff.style.display = 'none';
        }
      });
    }
  });
};

// Helper functions for wiring inputs
function wireInput(el, statePath) {
  if (!el) return;
  if (el.dataset.wired) return;
  el.dataset.wired = '1';

  const val = statePath.split('.').reduce((obj, key) => obj?.[key], window.state);
  if (val !== undefined) el.value = val;

  el.addEventListener('change', () => {
    window.store.setState(statePath, el.value);
    window.addLog('system', 'info', `Setting updated: ${statePath}`);
  });
}

function wireSelect(el, statePath) {
  if (!el) return;
  if (el.dataset.wired) return;
  el.dataset.wired = '1';

  const val = statePath.split('.').reduce((obj, key) => obj?.[key], window.state);
  if (val !== undefined) el.value = val;

  el.addEventListener('change', () => {
    window.store.setState(statePath, el.value);
    window.addLog('system', 'info', `Setting updated: ${statePath}`);
  });
}

function wireToggle(el, statePath) {
  if (!el) return;
  if (el.dataset.wired) return;
  el.dataset.wired = '1';

  const val = statePath.split('.').reduce((obj, key) => obj?.[key], window.state);
  if (val !== undefined) el.checked = val;

  el.addEventListener('change', () => {
    window.store.setState(statePath, el.checked);
    window.addLog('system', 'info', `Setting updated: ${statePath} = ${el.checked}`);
  });
}

function wireSlider(id, valId, formatter) {
  const slider = document.getElementById(id);
  const valEl = valId ? document.getElementById(valId) : null;
  if (!slider) return;
  if (slider.dataset.wired) return;
  slider.dataset.wired = '1';

  slider.addEventListener('input', () => {
    const val = slider.value;
    if (valEl) valEl.innerText = formatter ? formatter(val) : val;
  });

  slider.addEventListener('change', () => {
    window.addLog('system', 'info', `Setting updated: ${id} = ${slider.value}`);
  });
}

// === Yin/Yang Persona Balance Label Construction ===
// Function to construct Yin/Yang labels with proper colon-space separator
// Fixes bug condition: isBugCondition_LabelDuplication — label textContent matches /^(Yin|Yang)(\w+)$/ (no separator)
// Expected behavior: "Yin: Precise" and "Yang: Creative" with separator
window.getYinYangLabel = function (tone, isYin) {
  return isYin ? `Yin: ${tone}` : `Yang: ${tone}`;
};

// Update persona pole labels with proper formatting
window.updatePersonaPoleLabels = function () {
  const yinPole = document.querySelector('.persona-pole.yin');
  const yangPole = document.querySelector('.persona-pole.yang');

  if (yinPole && yangPole) {
    const currentTone = window.getPersonaTone
      ? window.getPersonaTone(window.state.agentPersonaTemp)
      : 'Balanced';

    // Construct labels with proper colon-space separator
    const yinLabel = window.getYinYangLabel(currentTone, true);
    const yangLabel = window.getYinYangLabel(currentTone, false);

    // Update the small elements within the persona poles
    const yinSmall = yinPole.querySelector('small');
    const yangSmall = yangPole.querySelector('small');

    if (yinSmall && yangSmall) {
      yinSmall.textContent = currentTone;
      yangSmall.textContent = currentTone;
    }
  }
};
