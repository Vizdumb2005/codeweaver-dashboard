// --- DYNAMIC RENDERING UTILITIES ---

// === PERFORMANCE UTILITIES ===
// Debounce function to prevent excessive render calls
window.debounce = function (func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for performance optimization
window.throttle = function (func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Create debounced versions of render functions to prevent excessive calls
window.createDebouncedRenderer = function (funcName, wait) {
  if (typeof window[funcName] === 'function') {
    const originalFunc = window[funcName];
    const debouncedFuncName = `debounced${funcName.charAt(0).toUpperCase() + funcName.slice(1)}`;
    window[debouncedFuncName] = window.debounce(originalFunc, wait || 100);
    return debouncedFuncName;
  }
  return null;
};

window.selectAgent = function (agentId) {
  window.state.selectedAgentId = agentId;
  const agent = window.state.agents[agentId];
  if (!agent) return; // Guard: prevent crash when agent not found

  // Show Agent Pane and Hide Task Pane
  const agentPane = document.getElementById('pane-agent-detail');
  const taskPane = document.getElementById('pane-task-detail');
  if (agentPane) agentPane.classList.add('active');
  if (taskPane) taskPane.classList.remove('active');

  // Update Detail UI
  const nameEl = document.getElementById('agent-detail-name');
  if (nameEl) nameEl.innerText = agent.name;

  let statusClass = 'status-idle';
  let statusText = 'Hidden';
  if (agent.status === 'thinking') {
    statusClass = 'status-thinking';
    statusText = 'Meditating';
  } else if (agent.status === 'coding') {
    statusClass = 'status-coding';
    statusText = 'Attacking';
  } else if (agent.status === 'watching') {
    statusClass = 'status-thinking';
    statusText = 'Scouting';
  } else if (agent.status === 'sleeping') {
    statusClass = 'status-idle';
    statusText = 'Hibernating';
  }

  const statusBadge = document.getElementById('agent-detail-status');
  statusBadge.innerText = statusText;
  statusBadge.className = `status-badge ${statusClass}`;

  const avatarRing = document.getElementById('agent-detail-avatar-ring');
  avatarRing.className = `avatar-ring ${agent.status !== 'idle' && agent.status !== 'sleeping' ? 'active-pulse' : ''}`;
  document.getElementById('agent-detail-avatar-inner').innerHTML = window.ninjaIcons
    ? window.ninjaIcons.get(agent.icon)
    : agent.icon;

  document.getElementById('agent-detail-objective').innerText = agent.objective;

  // Route / Ram / Cost
  document.getElementById('agent-detail-route').innerText = agent.route;
  document.getElementById('agent-detail-ram').innerText = agent.ram;
  document.getElementById('agent-detail-cost').innerText = `$${agent.cost.toFixed(2)}`;

  // Skills
  const skillsContainer = document.getElementById('agent-detail-skills');
  skillsContainer.innerHTML = '';
  agent.skills.forEach((skill) => {
    const span = document.createElement('span');
    span.className = 'skill-tag';
    span.innerText = skill;
    skillsContainer.appendChild(span);
  });

  // Active Task Card
  const taskCard = document.getElementById('agent-detail-task-card');
  if (taskCard) {
    if (agent.currentTaskId) {
      const task = window.state.tasks.find((t) => t.id === agent.currentTaskId);
      taskCard.style.display = 'flex';
      taskCard.classList.remove('is-empty');
      document.getElementById('agent-detail-task-title').innerText = task.title;
      document.getElementById('agent-detail-task-meta').innerText =
        `Priority ${task.priority} • ID: #${task.id}`;
    } else {
      taskCard.style.display = 'flex';
      taskCard.classList.add('is-empty');
      document.getElementById('agent-detail-task-title').innerText = 'No active scroll assigned';
      document.getElementById('agent-detail-task-meta').innerText = 'Awaiting next dispatch';
    }
  }

  // Update Persona temp details
  const personaSlider = document.getElementById('agent-persona-temp');
  const personaTempVal = document.getElementById('agent-persona-temp-val');
  const personaToneEl = document.getElementById('agent-persona-tone');
  if (personaSlider && personaTempVal && personaToneEl) {
    // Sync UI with state
    personaSlider.value = window.state.agentPersonaTemp;
    personaTempVal.innerText = window.state.agentPersonaTemp.toFixed(2);

    function getTone(temp) {
      if (temp <= 0.15) return 'Surgical';
      if (temp <= 0.35) return 'Analytical';
      if (temp <= 0.65) return 'Balanced';
      if (temp <= 0.95) return 'Expressive';
      if (temp <= 1.2) return 'Inventive';
      return 'Chaotic';
    }
    personaToneEl.innerText = getTone(window.state.agentPersonaTemp);
  }
};

window.selectTask = function (taskId) {
  window.state.selectedTaskId = taskId;
  const task = window.state.tasks.find((t) => t.id === taskId);
  if (!task) return; // Guard: prevent crash when task not found

  // Show Task Pane and Hide Agent Pane
  const agentPane = document.getElementById('pane-agent-detail');
  const taskPane = document.getElementById('pane-task-detail');
  if (agentPane) agentPane.classList.remove('active');
  if (taskPane) taskPane.classList.add('active');

  // Update Detail UI
  document.getElementById('task-detail-title').innerText = task.title;
  document.getElementById('task-detail-id').innerText = `ID: #${task.id}`;
  document.getElementById('task-detail-desc').innerText = task.desc;

  const colBadge = document.getElementById('task-detail-col-badge');
  colBadge.innerText = task.status.replace('_', ' ').toUpperCase();
  let badgeClass = 'badge-outline';
  if (task.status === 'in_progress') badgeClass = 'badge-purple';
  if (task.status === 'review') badgeClass = 'badge-warning';
  if (task.status === 'completed') badgeClass = 'badge-success';
  colBadge.className = `badge ${badgeClass}`;

  document.getElementById('task-detail-assignee').innerText =
    window.state.agents[task.assignee]?.name || 'Unassigned';
  document.getElementById('task-detail-priority').innerText = `${task.priority} / 5`;

  const complexityBadge = document.getElementById('task-detail-complexity');
  complexityBadge.innerHTML = `<span class="badge ${task.complexity === 'complex' ? 'badge-purple' : task.complexity === 'medium' ? 'badge-warning' : 'badge-outline'}">${task.complexity.toUpperCase()}</span>`;

  document.getElementById('task-detail-duration').innerText = task.duration;
  document.getElementById('task-detail-attempts').innerText = task.attempts;

  // Dependencies
  const depsContainer = document.getElementById('task-detail-deps');
  depsContainer.innerHTML = '';
  if (task.deps.length > 0) {
    task.deps.forEach((depId) => {
      const depTask = window.state.tasks.find((t) => t.id === depId);
      const span = document.createElement('span');
      span.className = 'badge badge-outline';
      span.innerText = depTask ? depTask.title : depId;
      depsContainer.appendChild(span);
    });
  } else {
    depsContainer.innerHTML = '<span class="text-muted text-xs">No dependencies</span>';
  }

  // Logs output
  const outputContainer = document.getElementById('task-detail-output');
  if (task.output) {
    outputContainer.innerText = task.output;
    outputContainer.style.color = '#FFB300'; // Amber gold
  } else {
    if (task.status === 'in_progress') {
      outputContainer.innerText = `[Attacking Scroll] Code compilation ongoing. Progress: ${task.progress}%...\n> Scanning package buffers\n> Injecting hooks`;
      outputContainer.style.color = '#ff7300'; // Samurai Orange
    } else {
      outputContainer.innerText =
        'Task is queued in backlog. Awaiting active workspace scheduling.';
      outputContainer.style.color = '#5e5248';
    }
  }
};

window.renderKanban = function (filter = 'all') {
  const kanbanBoard = document.getElementById('kanban-board');
  const lists = {
    backlog: document.getElementById('list-backlog'),
    in_progress: document.getElementById('list-in-progress'),
    review: document.getElementById('list-review'),
    completed: document.getElementById('list-completed'),
  };

  // Setup delegated event listeners once (prevents accumulation)
  if (kanbanBoard && !kanbanBoard.dataset.kanbanWired) {
    kanbanBoard.dataset.kanbanWired = '1';

    // Click delegation for task cards
    kanbanBoard.addEventListener('click', (e) => {
      const card = e.target.closest('.task-card');
      if (card) {
        const taskId = card.dataset.id;
        window.selectTask(taskId);
        document
          .querySelectorAll('.task-card')
          .forEach((c) => c.classList.remove('active-border-glow'));
        card.classList.add('active-border-glow');
      }
    });

    // Drag-start delegation
    kanbanBoard.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.task-card');
      if (card) {
        e.dataTransfer.setData('text/plain', card.dataset.id);
        card.style.opacity = '0.5';
      }
    });

    // Drag-end delegation
    kanbanBoard.addEventListener('dragend', (e) => {
      const card = e.target.closest('.task-card');
      if (card) {
        card.style.opacity = '1';
      }
    });
  }

  const counts = { backlog: 0, in_progress: 0, review: 0, completed: 0 };
  const activeTaskIds = [];

  const searchQ = window.state.taskSearchQuery || '';

  window.state.tasks.forEach((task) => {
    // Filter: tag pill — match against tags, assignee role, priority, or category
    let matchesFilter = true;
    if (filter !== 'all') {
      const f = filter.toLowerCase();
      const agentRole = (window.state.agents[task.assignee]?.name || '').toLowerCase();
      const taskCategory = (task.category || '').toLowerCase();
      matchesFilter =
        task.tags.some((tag) => tag.toLowerCase().includes(f)) ||
        agentRole.includes(f) ||
        taskCategory.includes(f) ||
        (task.priority && f === String(task.priority)) ||
        task.status.replace('_', '').includes(f);
    }

    // Filter: search text
    if (matchesFilter && searchQ) {
      matchesFilter =
        task.title.toLowerCase().includes(searchQ) ||
        task.desc.toLowerCase().includes(searchQ) ||
        task.tags.some((t) => t.toLowerCase().includes(searchQ));
    }

    if (matchesFilter) {
      counts[task.status]++;
      activeTaskIds.push(task.id);
    }

    // Find if card already exists
    let card = document.querySelector(`.task-card[data-id="${task.id}"]`);

    if (!matchesFilter) {
      if (card) card.remove();
      return;
    }

    const targetList = lists[task.status];
    if (!targetList) return;

    if (!card) {
      // Create new card
      card = document.createElement('div');
      card.className = 'task-card';
      card.setAttribute('draggable', 'true');
      card.dataset.id = task.id;

      targetList.appendChild(card);
      card.style.animation = 'card-appear 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    } else {
      // Move card if status changed
      if (card.parentElement !== targetList) {
        window.triggerSmokePuff(task.id);
        targetList.appendChild(card);

        card.style.animation = 'none';
        card.offsetHeight; // force reflow
        card.style.animation = 'card-appear 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      }
    }

    // Update border glow
    if (task.id === window.state.selectedTaskId) {
      card.classList.add('active-border-glow');
    } else {
      card.classList.remove('active-border-glow');
    }

    // Rebuild internal elements dynamically
    card.innerHTML = '';

    // Head
    const head = document.createElement('div');
    head.className = 'card-head';

    const title = document.createElement('span');
    title.className = 'task-title';
    title.innerText = task.title;
    title.title = task.title;
    head.appendChild(title);

    // Priority mark (Japanese culture shuriken SVG)
    const priorityIcon = document.createElement('span');
    priorityIcon.className = `priority-icon p${task.priority}`;
    priorityIcon.innerHTML = `
      <svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:middle;filter:drop-shadow(0 0 2px currentColor);">
        <path d="M12 2 L14 9 L21 7 L16 12 L21 17 L14 15 L12 22 L10 15 L3 17 L8 12 L3 7 L10 9 Z" fill="currentColor"/>
      </svg>
    `;
    head.appendChild(priorityIcon);
    card.appendChild(head);

    // Description
    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.innerText = task.desc.length > 75 ? `${task.desc.substring(0, 75)}...` : task.desc;
    card.appendChild(desc);

    // Progress bar for active task
    if (task.status === 'in_progress') {
      const progressContainer = document.createElement('div');
      progressContainer.className = 'card-progress-container';
      const progressFill = document.createElement('div');
      progressFill.className = 'card-progress-fill';
      progressFill.style.width = `${task.progress || 0}%`;
      progressContainer.appendChild(progressFill);
      card.appendChild(progressContainer);
    }

    // Foot
    const foot = document.createElement('div');
    foot.className = 'card-foot';

    // Tags
    const tags = document.createElement('div');
    tags.className = 'card-tags';
    task.tags.forEach((t) => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.innerText = t;
      tags.appendChild(span);
    });
    foot.appendChild(tags);

    // Assignee
    const assignee = document.createElement('div');
    assignee.className = 'card-assignee';
    const agent = window.state.agents[task.assignee];
    if (agent) {
      const avatar = document.createElement('span');
      avatar.className = 'avatar-icon';
      avatar.innerHTML = window.ninjaIcons ? window.ninjaIcons.get(agent.icon) : agent.icon;

      // Infinite Loop Breaker (Task 3.1)
      if (
        window.state.agentLoops &&
        window.state.agentLoops[agent.id] &&
        window.state.agentLoops[agent.id].looping
      ) {
        avatar.classList.add('loop-alert');
        avatar.title = 'Loop Intercept Triggered';
        avatar.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent selecting the card
          const errorString = window.state.agentLoops[agent.id].lastError;
          window.showConfirmDialog(
            'Loop Intercept',
            `Looping error detected for ${agent.name}:\n\n${errorString}`,
            () => {
              // Rollback logic
              if (typeof window.showToast === 'function') {
                window.showToast(`Rollback triggered for ${agent.name}`, 'info');
              }
              if (typeof window.addLog === 'function') {
                window.addLog(`Rollback triggered for agent ${agent.name}`, 'warn');
              }
              if (window.state.agentLoops[agent.id]) {
                window.state.agentLoops[agent.id].errorCount = 0;
                window.state.agentLoops[agent.id].looping = false;
              }
              window.renderKanban();
            },
            true, // Destructive styling
          );

          // Change button texts
          const cancelBtn = document.getElementById('cns-confirm-cancel');
          const okBtn = document.getElementById('cns-confirm-ok');
          if (cancelBtn) {
            cancelBtn.innerText = 'Give Hint';
            cancelBtn.className = 'btn btn-outline';
            cancelBtn.addEventListener('click', () => {
              if (typeof window.showToast === 'function') {
                window.showToast(`Hint dispatched to ${agent.name}`, 'success');
              }
              if (typeof window.addLog === 'function') {
                window.addLog(`Hint dispatched to agent ${agent.name}`, 'info');
              }
              if (window.state.agentLoops[agent.id]) {
                window.state.agentLoops[agent.id].errorCount = 0;
                window.state.agentLoops[agent.id].looping = false;
              }
              window.renderKanban();
            });
          }
          if (okBtn) {
            okBtn.innerText = 'Rollback';
          }
        });
      }

      assignee.appendChild(avatar);

      const name = document.createElement('span');
      name.innerText = agent.name.split(' ')[0];
      assignee.appendChild(name);
    }
    foot.appendChild(assignee);
    card.appendChild(foot);
  });

  // Remove elements that don't match the active selection/filter
  document.querySelectorAll('.task-card').forEach((card) => {
    if (!activeTaskIds.includes(card.dataset.id)) {
      card.remove();
    }
  });

  // Set counts
  document.getElementById('count-backlog').innerText = counts.backlog;
  document.getElementById('count-in-progress').innerText = counts.in_progress;
  document.getElementById('count-review').innerText = counts.review;
  document.getElementById('count-completed').innerText = counts.completed;

  // Sidebar counter
  document.getElementById('in-progress-count').innerText = counts.in_progress + counts.review;

  // Update roadmap progress indicator
  const totalTasks = counts.backlog + counts.in_progress + counts.review + counts.completed;
  const completedTasks = counts.completed;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const progressFill = document.getElementById('roadmap-progress-fill');
  const progressText = document.getElementById('roadmap-progress-text');
  if (progressFill) progressFill.style.width = `${progressPercent}%`;
  if (progressText)
    progressText.innerText = `${progressPercent}% Complete (${completedTasks}/${totalTasks})`;

  // Show empty state hints if no tasks in a column
  ['backlog', 'in_progress', 'review', 'completed'].forEach((col) => {
    const list = document.getElementById(`list-${col}`);
    if (!list) return;
    const existingEmpty = list.querySelector('.empty-state-hint');
    if (counts[col] === 0) {
      if (!existingEmpty) {
        const hint = document.createElement('div');
        hint.className = 'empty-state-hint';
        hint.style.cssText =
          'padding:20px;text-align:center;color:var(--text-muted);font-size:0.75rem;border:1px dashed rgba(255,115,0,0.15);border-radius:8px;margin:8px 0;background:rgba(255,115,0,0.01);';
        hint.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted);opacity:0.4;display:inline-block;margin-bottom:6px;animation:spin-shuriken 10s infinite linear;">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" fill="rgba(255,115,0,0.05)"></path>
          </svg>
          <div style="font-size:0.72rem;color:var(--text-muted);">${searchQ ? 'No matching scrolls' : 'No scrolls in column'}</div>
        `;
        list.appendChild(hint);
      }
    } else {
      if (existingEmpty) existingEmpty.remove();
    }
  });
};

window.renderDecisions = function () {
  const container = document.getElementById('decisions-container');
  container.innerHTML = '';

  let pendingCount = 0;

  window.state.decisions.forEach((decision) => {
    if (decision.status === 'proposed') pendingCount++;

    const card = document.createElement('div');
    card.className = `decision-card ${decision.status === 'proposed' ? 'pending' : ''}`;

    // Header
    const header = document.createElement('div');
    header.className = 'decision-header';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'decision-title-group';

    const title = document.createElement('h3');
    title.innerText = decision.title;
    title.title = decision.title;
    titleGroup.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'decision-meta';
    meta.innerHTML = `Proposed by: ${window.state.agents[decision.decidedBy]?.name || decision.decidedBy} <span class="decision-status-badge status-${decision.status}">${decision.status.toUpperCase()}</span>`;
    titleGroup.appendChild(meta);

    header.appendChild(titleGroup);

    // Confidence
    const confidence = document.createElement('div');
    confidence.className = 'decision-confidence';
    confidence.innerHTML = `
      <span class="confidence-val">${decision.confidence}%</span>
      <span class="confidence-label">Focus</span>
    `;
    header.appendChild(confidence);
    card.appendChild(header);

    // Description
    const desc = document.createElement('p');
    desc.className = 'decision-desc';
    desc.innerText = decision.desc;
    desc.title = decision.desc;
    card.appendChild(desc);

    // Alternatives Grid
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'decision-options';

    decision.alternatives.forEach((alt, idx) => {
      const isSelected = idx === decision.selectedAlternative;
      const optBox = document.createElement('div');
      optBox.className = `option-box ${isSelected ? 'selected' : ''}`;

      const checkIconSvg = isSelected
        ? `<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:14px;height:14px;vertical-align:middle;color:var(--accent-purple);margin-right:6px;">
             <path d="M12 3 C 6 3, 3 8, 3 13 C 3 18, 8 21, 13 21 C 18 21, 21 17, 21 12 C 21 8, 18 4.5, 14.5 4" fill="none"/>
             <path d="M9 12 l2 2 l4 -4" stroke="currentColor" stroke-linecap="round"/>
           </svg>`
        : `<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:middle;color:var(--text-muted);margin-right:6px;">
             <path d="M12 3 C 6 3, 3 8, 3 13 C 3 18, 8 21, 13 21 C 18 21, 21 17, 21 12 C 21 8, 18 4.5, 14.5 4"/>
           </svg>`;

      optBox.innerHTML = `
        <h4>
          ${checkIconSvg}
          <span>Option ${idx + 1}: ${alt.title}</span>
        </h4>
        <div class="pros-cons">
          <p style="color:var(--accent-cyan);margin-top:4px;"><strong>Pros:</strong> ${alt.pros}</p>
          <p style="color:var(--accent-error);margin-top:2px;"><strong>Cons:</strong> ${alt.cons}</p>
        </div>
      `;
      optionsGrid.appendChild(optBox);
    });
    card.appendChild(optionsGrid);

    // Rationale
    const rationale = document.createElement('div');
    rationale.className = 'decision-rationale';
    rationale.innerHTML = `<strong>Grandmaster Rationale:</strong> ${decision.rationale}`;
    card.appendChild(rationale);

    // Actions
    if (decision.status === 'proposed') {
      const actions = document.createElement('div');
      actions.className = 'decision-actions';

      const rejectBtn = document.createElement('button');
      rejectBtn.className = 'btn btn-outline btn-sm';
      rejectBtn.innerText = 'Override Decrees';
      rejectBtn.addEventListener('click', () => window.handleDecisionResolve(decision.id, false));
      actions.appendChild(rejectBtn);

      const approveBtn = document.createElement('button');
      approveBtn.className = 'btn btn-primary btn-sm';
      approveBtn.innerText = 'Enforce Decrees';
      approveBtn.addEventListener('click', () => window.handleDecisionResolve(decision.id, true));
      actions.appendChild(approveBtn);

      card.appendChild(actions);
    } else {
      const resolvedBanner = document.createElement('div');
      resolvedBanner.className = 'decision-actions';
      resolvedBanner.innerHTML = `<span style="font-size:0.75rem;color:var(--accent-cyan);font-weight:600;">
        <svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;color:var(--accent-cyan);">
          <rect x="3" y="3" width="18" height="18" rx="2" fill="rgba(255,179,0,0.1)"/>
          <path d="M8 12 l3 3 l5 -5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        Decree Enforced (Auto-Locked)
      </span>`;
      card.appendChild(resolvedBanner);
    }

    container.appendChild(card);
  });

  document.getElementById('pending-decisions-count').innerText = pendingCount;
  document.getElementById('pending-decisions-count').style.display =
    pendingCount > 0 ? 'inline-block' : 'none';
};

window.renderLogs = function () {
  const container = document.getElementById('console-lines-container');
  if (!container) return;
  container.innerHTML = '';

  const filteredLogs = [];
  window.state.consoleLogs.forEach((log) => {
    // Text search filter
    if (window.state.logSearchQuery) {
      const q = window.state.logSearchQuery.toLowerCase();
      const match = log.msg.toLowerCase().includes(q) || log.agent.toLowerCase().includes(q);
      if (!match) return;
    }

    // Agent dropdown filter
    if (window.state.logFilterAgent !== 'all') {
      if (window.state.logFilterAgent === 'coder') {
        if (log.agent !== 'coder' && log.agent !== 'coder1' && log.agent !== 'coder2') return;
      } else {
        if (log.agent !== window.state.logFilterAgent) return;
      }
    }

    filteredLogs.push(log);
  });

  if (filteredLogs.length === 0) {
    container.innerHTML = `
      <div class="empty-state empty-state-sm" role="status" aria-live="polite">
        <div class="empty-state-illustration">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted, #5e5248);">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <h3 class="empty-state-title">No stealth scrolls to display</h3>
        <p class="empty-state-description">Mission logs will appear here as shinobi agents complete tasks. Adjust filters or wait for new activity.</p>
      </div>
    `;
    return;
  }

  filteredLogs.forEach((log) => {
    const div = document.createElement('div');
    div.className = `console-line ${log.type === 'error' ? 'error' : log.type === 'success' ? 'success' : ''}`;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'timestamp';
    timeSpan.innerText = `[${log.time}]`;
    div.appendChild(timeSpan);

    const agentSpan = document.createElement('span');
    agentSpan.className = `agent ${log.agent.replace('-', '').toLowerCase()}`;
    agentSpan.innerText = `${log.agent.toUpperCase()}:`;
    div.appendChild(agentSpan);

    const msgSpan = document.createElement('span');
    msgSpan.className = 'message';
    msgSpan.innerText = log.msg;
    div.appendChild(msgSpan);

    container.appendChild(div);
  });

  // Auto scroll to bottom
  container.parentElement.scrollTop = container.parentElement.scrollHeight;
};
function ensureNavSectionsExpanded() {
  // Ensure all navigation sections are expanded when switching tabs
  // Note: Nav items are already buttons in HTML, no need to convert them
  document
    .querySelectorAll('.nav-section.collapsed')
    .forEach((s) => s.classList.remove('collapsed'));
}

// === STANDARDIZED TAB INITIALIZATION HELPER ===
// This helper ensures consistent initialization pattern across all tabs
// If both render and init functions exist, call init first then render
// If only one exists, call that one
// Both patterns are supported for backward compatibility
window.initTabComponent = function (tabId, renderFuncName, initFuncName) {
  try {
    const hasRender = typeof window[renderFuncName] === 'function';
    const hasInit = typeof window[initFuncName] === 'function';

    if (hasInit && hasRender) {
      // If both exist, call init first to set up HTML structure, then render
      window[initFuncName]();
      window[renderFuncName]();
    } else if (hasRender) {
      // Only render function exists (e.g., notifications)
      window[renderFuncName]();
    } else if (hasInit) {
      // Only init function exists (e.g., sandbox-multiplexer)
      window[initFuncName]();
    }
  } catch (e) {
    console.error(`[CoNinja] Error initializing ${tabId}:`, e);
    // Provide fallback UI for the tab container
    const container = document.getElementById(`${tabId}-container`);
    if (container) {
      container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);">Failed to load ${tabId.replace(/-/g, ' ')}. <button class="btn btn-outline btn-sm" onclick="window.switchTab('${tabId}')">Retry</button></div>`;
    }
  }
};

window.switchTab = function (tabId) {
  // 1b. Render Login tab view if user is not authenticated
  if (window.state && window.state.user && !window.state.user.isAuthenticated) {
    tabId = 'login';
  }
  window.state.activeTab = tabId;

  // Toggle active tab content
  document.querySelectorAll('.tab-content').forEach((tab) => {
    tab.classList.remove('active');
  });
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) {
    targetTab.classList.add('active');
  } else {
    console.warn(`[CoNinja] Tab element not found: tab-${tabId}`);
    return; // Prevent further processing if tab doesn't exist
  }

  if (tabId === 'login') {
    // Hide sidebar/header during login to focus experience
    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar');
    const timeline = document.querySelector('.timeline-playback-bar');
    const scopingScroll = document.querySelector('.scoping-scroll-overlay');
    if (sidebar) sidebar.style.display = 'none';
    if (topbar) topbar.style.display = 'none';
    if (timeline) timeline.style.display = 'none';
    if (scopingScroll) scopingScroll.style.display = 'none';

    // Render login form
    console.warn('[CoNinja UI] Switching to login tab...');
    if (typeof window.renderLoginScreen === 'function') {
      console.warn('[CoNinja UI] Calling renderLoginScreen...');
      window.renderLoginScreen();
    } else {
      console.warn('[CoNinja UI] Defining renderLoginScreen dynamically...');
      window.renderLoginScreen = function () {
        const container = document.getElementById('tab-login');
        if (container) {
          container.innerHTML = `
            <div class="login-wrapper" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#080605; font-family:'Outfit',sans-serif; color:#e8e0d8;">
              <div class="glass-card login-card" style="width:360px; padding:40px; border-radius:16px; border:1px solid rgba(255,115,0,0.25); background:rgba(255,255,255,0.03); box-shadow:0 8px 32px rgba(0,0,0,0.5);">
                <div style="text-align:center; margin-bottom:30px;">
                  <div style="font-size:3rem; margin-bottom:10px; animation:spin-shuriken 4s infinite linear;">◈</div>
                  <h2 style="font-size:1.8rem; font-weight:700; color:#ff7300; margin:0;">coNinja</h2>
                  <p style="font-size:0.8rem; color:#8a8a9a; margin:5px 0 0 0;">Enter the Shadow Swarm Dojo</p>
                </div>
                <form id="login-form" onsubmit="event.preventDefault(); window.dispatch('AUTH_LOGIN', {username: document.getElementById('login-username').value});">
                  <div class="form-group" style="margin-bottom:15px;">
                    <label for="login-username" style="display:block; font-size:0.8rem; color:#8a8a9a; margin-bottom:5px;">Shinobi Username</label>
                    <input type="text" id="login-username" class="form-input" style="width:100%; padding:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,115,0,0.15); border-radius:6px; color:#fff;" required value="test_shinobi">
                  </div>
                  <div class="form-group" style="margin-bottom:25px;">
                    <label for="login-password" style="display:block; font-size:0.8rem; color:#8a8a9a; margin-bottom:5px;">Jutsu Password</label>
                    <input type="password" id="login-password" class="form-input" style="width:100%; padding:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,115,0,0.15); border-radius:6px; color:#fff;" required value="secret_jutsu_123">
                  </div>
                  <button type="submit" class="btn btn-primary" style="width:100%; padding:12px; background:#ff7300; color:#fff; border:none; border-radius:6px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(255,115,0,0.35);">Unlock Nexus</button>
                </form>
              </div>
            </div>
          `;
        }
      };
      window.renderLoginScreen();
    }
    return;
  } else {
    // Restore topbar, sidebar, timeline & scoping scroll visibility if authenticated
    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar');
    const timeline = document.querySelector('.timeline-playback-bar');
    const scopingScroll = document.querySelector('.scoping-scroll-overlay');
    if (sidebar) sidebar.style.display = 'flex';
    if (topbar) topbar.style.display = 'flex';
    if (timeline) timeline.style.display = 'flex';
    if (scopingScroll) scopingScroll.style.display = 'block';
  }

  ensureNavSectionsExpanded();

  // Toggle active menu button
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active');
      const section = btn.closest('.nav-section');
      if (section) section.classList.remove('collapsed');
    }
  });

  // Render and initialize tabs dynamically
  if (tabId === 'mcp-registry') {
    try {
      if (typeof window.renderMCPRegistry === 'function') window.renderMCPRegistry();
      if (typeof window.initMCPRegistryForm === 'function') window.initMCPRegistryForm();
    } catch (e) {
      console.error('[CoNinja] MCP Registry init error:', e);
      const container = document.getElementById('mcp-registry-container');
      if (container) {
        container.innerHTML =
          '<div style="padding:40px;text-align:center;color:var(--text-muted);">Failed to load MCP Registry. <button class="btn btn-outline btn-sm" onclick="window.switchTab(\'mcp-registry\')">Retry</button></div>';
      }
    }
  }

  if (tabId === 'neural-graph') {
    try {
      setTimeout(() => {
        if (window.neuralGraphInstance) {
          const container = document.getElementById('neural-graph-canvas');
          if (container) {
            window.neuralGraphInstance.width(container.clientWidth);
            window.neuralGraphInstance.height(container.clientHeight);
            window.neuralGraphInstance.centerAt(0, 0);
          }
        } else {
          if (typeof window.initNeuralGraph === 'function') window.initNeuralGraph();
        }
      }, 150);
    } catch (e) {
      console.error('[CoNinja] Neural Graph init error:', e);
    }
  }

  if (tabId === 'sandbox-multiplexer') {
    window.initTabComponent(
      'sandbox-multiplexer',
      'renderSandboxMultiplexer',
      'initSandboxMultiplexer',
    );
  }

  // Start / Stop graph animation loops
  if (tabId === 'swarm-graph') {
    try {
      if (window.swarmGraph) {
        window.swarmGraph.resize();
        window.swarmGraph.start();
      } else if (typeof window.initSwarmGraph === 'function') {
        window.initSwarmGraph();
      }
    } catch (e) {
      console.error('[CoNinja] Swarm Graph init error:', e);
    }
  } else {
    try {
      if (window.swarmGraph) window.swarmGraph.stop();
    } catch (e) {
      console.error('[CoNinja] Swarm Graph stop error:', e);
    }
  }

  // Initialize Monaco and file explorers if entering the Dojo Workbench
  if (tabId === 'dojo-workbench') {
    window.initTabComponent('dojo-workbench', 'renderDojoWorkbench', 'initDojoWorkbench');
    try {
      if (window.editorInstance) {
        setTimeout(() => {
          window.editorInstance.layout();
        }, 100);
      }
    } catch (e) {
      console.error('[CoNinja] Dojo Workbench editor layout error:', e);
    }
  }

  // Initialize report rendering if entering Stealth Archives
  if (tabId === 'mission-reports') {
    try {
      // Special case: renderReport requires reportId parameter
      if (typeof window.renderReport === 'function') {
        window.renderReport(window.state.activeReportId);
      }
    } catch (e) {
      console.error('[CoNinja] Mission Reports render error:', e);
      const container = document.getElementById('mission-reports-container');
      if (container) {
        container.innerHTML =
          '<div style="padding:40px;text-align:center;color:var(--text-muted);">Failed to load Mission Reports. <button class="btn btn-outline btn-sm" onclick="window.switchTab(\'mission-reports\')">Retry</button></div>';
      }
    }
  }

  // Initialize sub-tabs rendering if entering Dojo Rules
  if (tabId === 'settings') {
    try {
      // Special case: renderSettingsSubtab requires subTab parameter
      if (typeof window.renderSettingsSubtab === 'function') {
        window.renderSettingsSubtab(window.state.activeSettingsTab);
      }
    } catch (e) {
      console.error('[CoNinja] Settings render error:', e);
      const container = document.getElementById('settings-container');
      if (container) {
        container.innerHTML =
          '<div style="padding:40px;text-align:center;color:var(--text-muted);">Failed to load Settings. <button class="btn btn-outline btn-sm" onclick="window.switchTab(\'settings\')">Retry</button></div>';
      }
    }
  }

  // Initialize new tab components
  // STANDARDIZED: Use helper function for consistent init/render pattern
  // Legacy comment: "Pattern: init sets up container HTML + event listeners, render fills content"

  if (tabId === 'agent-studio') {
    window.initTabComponent('agent-studio', 'renderAgentStudio', 'initAgentStudio');
  }

  if (tabId === 'workflow') {
    window.initTabComponent('workflow', 'renderWorkflow', 'initWorkflow');
  }

  if (tabId === 'debate') {
    window.initTabComponent('debate', 'renderDebate', 'initDebate');
  }

  if (tabId === 'memory') {
    window.initTabComponent('memory', 'renderMemory', 'initMemory');
  }

  if (tabId === 'testing') {
    window.initTabComponent('testing', 'renderTesting', 'initTesting');
  }

  if (tabId === 'security') {
    window.initTabComponent('security', 'renderSecurity', 'initSecurity');
  }

  // STANDARDIZED: All single-function tabs use initTabComponent
  if (tabId === 'deployment') {
    window.initTabComponent('deployment', 'renderDeployment', 'initDeployment');
  }

  if (tabId === 'monitoring') {
    window.initTabComponent('monitoring', 'renderMonitoring', 'initMonitoring');
  }

  if (tabId === 'notifications') {
    window.initTabComponent('notifications', 'renderNotifications', 'initNotifications');
  }

  if (tabId === 'repo-explorer') {
    window.initTabComponent('repo-explorer', 'renderRepoExplorer', 'initRepoExplorer');
  }

  if (tabId === 'pull-requests') {
    window.initTabComponent('pull-requests', 'renderPullRequests', 'initPullRequests');
  }

  if (tabId === 'approvals') {
    window.initTabComponent('approvals', 'renderApprovals', 'initApprovals');
  }

  if (tabId === 'ops-recovery') {
    window.initTabComponent('ops-recovery', 'renderOpsRecovery', 'initOpsRecovery');
  }

  if (tabId === 'projects') {
    window.initTabComponent('projects', 'renderProjects', 'initProjects');
  }

  if (tabId === 'provenance') {
    window.initTabComponent('provenance', 'renderProvenance', 'initProvenance');
  }

  // STANDARDIZED: Tabs with both render and init use single helper call
  if (tabId === 'collaboration') {
    window.initTabComponent('collaboration', 'renderCollaboration', 'initCollaboration');
  }

  if (tabId === 'analytics') {
    window.initTabComponent('analytics', 'renderAnalytics', 'initAnalytics');
  }

  if (tabId === 'intelligence') {
    window.initTabComponent('intelligence', 'renderIntelligence', 'initIntelligence');
  }

  if (tabId === 'triage') {
    window.initTabComponent('triage', 'renderTriage', 'initTriage');
  }

  if (typeof window.decorateNinjaIcons === 'function') {
    const tabEl = document.getElementById(`tab-${tabId}`);
    if (tabEl) window.decorateNinjaIcons(tabEl);
  }
};

const mockReports = {
  'ab-cta': {
    title: 'A/B Experiment: CTA Button Conversion Rate',
    type: 'ab',
    runDate: '2026-05-25',
    status: 'Complete',
    statusClass: 'badge-success',
    summary:
      'The orange gradient CTA (Variant B) outperformed the default ghost-outline button (Variant A) by a statistically significant margin.',
    variants: [
      {
        name: 'Variant A (Control) — Ghost Outline',
        sessions: 4820,
        conversions: 193,
        rate: '4.00%',
        lift: '—',
      },
      {
        name: 'Variant B (Test) — Orange Gradient Fill',
        sessions: 4891,
        conversions: 264,
        rate: '5.40%',
        lift: '+35.0% ↑',
      },
    ],
    stats: { zScore: '3.42', pValue: '0.0006', confidence: '99.9%', winner: 'Variant B' },
    recommendation:
      'Ship Variant B globally. The orange gradient CTA aligns with the Ninja brand palette and achieves significant uplift with p < 0.001 confidence.',
  },
  'ab-model': {
    title: 'A/B Experiment: Swarm Model Router Throughput',
    type: 'ab',
    runDate: '2026-05-27',
    status: 'Complete',
    statusClass: 'badge-success',
    summary:
      'Dynamic VRAM routing (Variant B) reduced average task turnaround time versus round-robin static assignment (Variant A).',
    variants: [
      {
        name: 'Variant A (Control) — Static Round-Robin Router',
        sessions: 320,
        conversions: 248,
        rate: '77.5% task success',
        lift: '—',
      },
      {
        name: 'Variant B (Test) — Dynamic VRAM-priority Router',
        sessions: 318,
        conversions: 291,
        rate: '91.5% task success',
        lift: '+18.1% ↑',
      },
    ],
    stats: { zScore: '4.17', pValue: '0.0000', confidence: '99.99%', winner: 'Variant B' },
    recommendation:
      'Enable VRAM-priority dynamic routing. Significant improvement in successful task completion rates observed.',
  },
  'ab-cache': {
    title: 'A/B Experiment: Query Caching Strategy',
    type: 'ab',
    runDate: '2026-05-28',
    status: 'Running',
    statusClass: 'badge-warning',
    summary:
      'Ongoing experiment comparing Redis semantic cache (Variant B) against in-process LRU cache (Variant A) for RAG query deduplication.',
    variants: [
      {
        name: 'Variant A (Control) — In-Process LRU Cache',
        sessions: 1240,
        conversions: 880,
        rate: '71.0% hit rate',
        lift: '—',
      },
      {
        name: 'Variant B (Test) — Redis Semantic Cache',
        sessions: 1253,
        conversions: 988,
        rate: '78.8% hit rate',
        lift: '+11.0% ↑',
      },
    ],
    stats: {
      zScore: '2.14',
      pValue: '0.032',
      confidence: '96.8%',
      winner: 'Pending (need 2000+ samples)',
    },
    recommendation:
      'Experiment still running. Early signals favour Redis semantic cache but require additional sample collection.',
  },
  'dep-weekly': {
    title: 'Dependency Sweep: Weekly Advisory Report',
    type: 'dependency',
    runDate: '2026-05-28',
    status: 'Complete',
    statusClass: 'badge-success',
    packages: [
      {
        name: 'express',
        current: '4.18.2',
        latest: '4.19.1',
        severity: 'Low',
        action: 'Update Recommended',
      },
      {
        name: 'jsonwebtoken',
        current: '8.5.1',
        latest: '9.0.2',
        severity: 'Medium',
        action: 'Update — API changes',
      },
      {
        name: 'nodemailer',
        current: '6.9.4',
        latest: '6.9.8',
        severity: 'Low',
        action: 'Patch — safe to bump',
      },
      {
        name: 'mongoose',
        current: '7.3.4',
        latest: '8.1.2',
        severity: 'High',
        action: 'Major — breaking schemas',
      },
      {
        name: 'jest',
        current: '29.5.0',
        latest: '29.7.0',
        severity: 'Low',
        action: 'Patch update',
      },
      {
        name: '@types/node',
        current: '20.3.0',
        latest: '20.11.0',
        severity: 'Low',
        action: 'Patch update',
      },
    ],
    summary:
      '6 packages reviewed. 1 high-severity major upgrade flagged (mongoose). 1 medium-severity JWT update available. 4 low-severity patches ready.',
  },
  'dep-semver': {
    title: 'Dependency Sweep: SemVer Lock Synchronization',
    type: 'dependency',
    runDate: '2026-05-26',
    status: 'Complete',
    statusClass: 'badge-success',
    packages: [
      {
        name: 'typescript',
        current: '5.1.6',
        latest: '5.4.2',
        severity: 'Low',
        action: 'Minor — safe to update',
      },
      {
        name: 'eslint',
        current: '8.44.0',
        latest: '8.57.0',
        severity: 'Low',
        action: 'Minor update',
      },
      {
        name: 'prettier',
        current: '3.0.0',
        latest: '3.2.5',
        severity: 'Low',
        action: 'Patch update',
      },
    ],
    summary:
      'Lock file synchronized. 3 development toolchain packages have pending minor/patch updates. No production dependency CVEs detected.',
  },
  'sec-owasp': {
    title: 'Security Audit: OWASP Top 10 Vulnerability Scan',
    type: 'security',
    runDate: '2026-05-28',
    status: 'Passed',
    statusClass: 'badge-success',
    findings: [
      {
        category: 'A01 — Broken Access Control',
        severity: 'None',
        status: '◈ Pass',
        detail: 'Role-based access gates enforced. JWT middleware validated.',
      },
      {
        category: 'A02 — Cryptographic Failures',
        severity: 'None',
        status: '◈ Pass',
        detail: 'bcrypt strength factor = 12. No plaintext credentials detected.',
      },
      {
        category: 'A03 — Injection (SQLi/XSS)',
        severity: 'Low',
        status: '◈️ Advisory',
        detail:
          '1 unescaped user input field found in /api/search. Parameterized queries recommended.',
      },
      {
        category: 'A04 — Insecure Design',
        severity: 'None',
        status: '◈ Pass',
        detail: 'Architecture review confirms threat model coverage.',
      },
      {
        category: 'A05 — Security Misconfiguration',
        severity: 'None',
        status: '◈ Pass',
        detail: 'All environment variables properly scoped. No debug routes exposed.',
      },
      {
        category: 'A06 — Vulnerable Components',
        severity: 'Medium',
        status: '◈️ Advisory',
        detail: 'jsonwebtoken 8.x has known algorithm confusion advisory. Update to 9.x.',
      },
      {
        category: 'A07 — Auth & Session Failures',
        severity: 'None',
        status: '◈ Pass',
        detail: 'Session token rotation on login/logout confirmed.',
      },
      {
        category: 'A08 — Software & Data Integrity',
        severity: 'None',
        status: '◈ Pass',
        detail: 'Subresource Integrity (SRI) hashes present for all CDN assets.',
      },
      {
        category: 'A09 — Security Logging Failures',
        severity: 'None',
        status: '◈ Pass',
        detail: 'Sentry error telemetry active. Auth failures logged to audit trail.',
      },
      {
        category: 'A10 — SSRF',
        severity: 'None',
        status: '◈ Pass',
        detail: 'No external URL resolution from user-controlled inputs detected.',
      },
    ],
    summary:
      'Overall risk: LOW. 2 advisory items flagged (non-blocking). 8 categories fully cleared.',
  },
  'sec-secrets': {
    title: 'Security Audit: Stealth Secrets Scanner',
    type: 'security',
    runDate: '2026-05-29',
    status: 'Passed',
    statusClass: 'badge-success',
    findings: [
      {
        category: 'API Keys — OpenAI Pattern',
        severity: 'None',
        status: '◈ Pass',
        detail: 'No OpenAI or Anthropic key patterns detected in codebase.',
      },
      {
        category: 'AWS Credentials',
        severity: 'None',
        status: '◈ Pass',
        detail: 'No AWS Access Key ID or Secret Access Key patterns found.',
      },
      {
        category: 'Database DSN Strings',
        severity: 'None',
        status: '◈ Pass',
        detail: 'All DB URIs loaded exclusively from process.env. No hardcoded strings.',
      },
      {
        category: 'Private Key Files (.pem/.key)',
        severity: 'None',
        status: '◈ Pass',
        detail: 'No private key files committed to version control.',
      },
      {
        category: 'JWT Secret Leaks',
        severity: 'None',
        status: '◈ Pass',
        detail: 'JWT_SECRET sourced from env. Not present in source or git history.',
      },
      {
        category: 'Webhook Tokens',
        severity: 'None',
        status: '◈ Pass',
        detail: 'No hardcoded webhook endpoints or tokens found in codebase.',
      },
    ],
    summary: 'Clean scan. 0 secrets detected across 48 scanned files and 1,240 lines of code.',
  },
};

window.renderReport = function (reportId) {
  window.state.activeReportId = reportId;
  const container = document.getElementById('report-view-container');
  if (!container) return;
  const report = mockReports[reportId];

  // Update active item in archive sidebar
  document.querySelectorAll('.archive-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.report === reportId);
  });

  if (!report) {
    container.innerHTML = `
      <div class="empty-state-container" style="padding: 60px 40px; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#report-glow)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px; filter: drop-shadow(0 0 8px rgba(255, 115, 0, 0.2));">
          <defs>
            <linearGradient id="report-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff7300" />
              <stop offset="100%" stop-color="#a855f7" />
            </linearGradient>
          </defs>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">Stealth Archives</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">Select a scroll from the sidebar to inspect execution reports.</div>
      </div>
    `;
    return;
  }

  if (report.type === 'ab') {
    container.innerHTML = `
      <div class="report-header">
        <div>
          <h3 class="report-title">◈ ${report.title}</h3>
          <div class="report-meta">Run: ${report.runDate} &nbsp;|&nbsp; <span class="badge ${report.statusClass}">${report.status}</span></div>
        </div>
      </div>
      <p class="report-summary">${report.summary}</p>

      <div class="ab-variants-grid">
        ${report.variants
          .map(
            (v, i) => `
          <div class="ab-variant-card ${i === 1 ? 'winner-variant' : ''}">
            <div class="ab-variant-name">${v.name}</div>
            <div class="ab-stats-row">
              <div class="ab-stat"><span class="ab-stat-val">${v.sessions.toLocaleString()}</span><span class="ab-stat-label">Sessions</span></div>
              <div class="ab-stat"><span class="ab-stat-val">${v.conversions.toLocaleString()}</span><span class="ab-stat-label">Conversions</span></div>
              <div class="ab-stat"><span class="ab-stat-val orange">${v.rate}</span><span class="ab-stat-label">Conv. Rate</span></div>
              <div class="ab-stat"><span class="ab-stat-val ${i === 1 ? 'lift-positive' : ''}">${v.lift}</span><span class="ab-stat-label">Lift</span></div>
            </div>
          </div>
        `,
          )
          .join('')}
      </div>

      <div class="stats-sig-bar">
        <div class="stat-sig-item"><span class="sig-label">Z-Score</span><span class="sig-val">${report.stats.zScore}</span></div>
        <div class="stat-sig-item"><span class="sig-label">P-Value</span><span class="sig-val">${report.stats.pValue}</span></div>
        <div class="stat-sig-item"><span class="sig-label">Confidence</span><span class="sig-val orange">${report.stats.confidence}</span></div>
        <div class="stat-sig-item"><span class="sig-label">Winner</span><span class="sig-val">${report.stats.winner}</span></div>
      </div>

      <div class="report-recommendation">
        <span class="rec-label">◈️ Grandmaster Recommendation:</span>
        <p>${report.recommendation}</p>
      </div>
    `;
  } else if (report.type === 'dependency') {
    container.innerHTML = `
      <div class="report-header">
        <div>
          <h3 class="report-title">◈ ${report.title}</h3>
          <div class="report-meta">Run: ${report.runDate} &nbsp;|&nbsp; <span class="badge ${report.statusClass}">${report.status}</span></div>
        </div>
      </div>
      <p class="report-summary">${report.summary}</p>

      <table class="provider-table report-table" style="width:100%; margin-top: 16px;">
        <thead>
          <tr>
            <th>Package</th>
            <th>Current</th>
            <th>Latest</th>
            <th>Severity</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${report.packages
            .map(
              (pkg) => `
            <tr>
              <td><code style="color:var(--accent-cyan); font-family:var(--font-mono); font-size:0.8rem;">${pkg.name}</code></td>
              <td style="font-family:var(--font-mono); font-size:0.78rem;">${pkg.current}</td>
              <td style="font-family:var(--font-mono); font-size:0.78rem; color:var(--accent-purple);">${pkg.latest}</td>
              <td><span class="badge ${pkg.severity === 'High' ? 'badge-purple' : pkg.severity === 'Medium' ? 'badge-warning' : 'badge-outline'}">${pkg.severity}</span></td>
              <td style="font-size:0.78rem; color:var(--text-secondary);">${pkg.action}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    `;
  } else if (report.type === 'security') {
    container.innerHTML = `
      <div class="report-header">
        <div>
          <h3 class="report-title">◈ ${report.title}</h3>
          <div class="report-meta">Run: ${report.runDate} &nbsp;|&nbsp; <span class="badge ${report.statusClass}">${report.status}</span></div>
        </div>
      </div>
      <p class="report-summary">${report.summary}</p>

      <table class="provider-table report-table" style="width:100%; margin-top: 16px;">
        <thead>
          <tr>
            <th>Category</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          ${report.findings
            .map(
              (f) => `
            <tr>
              <td style="font-size:0.78rem; font-weight:500;">${f.category}</td>
              <td><span class="badge ${f.severity === 'None' ? 'badge-success' : f.severity === 'Low' ? 'badge-outline' : f.severity === 'Medium' ? 'badge-warning' : 'badge-purple'}">${f.severity || 'None'}</span></td>
              <td style="font-size:0.78rem;">${f.status}</td>
              <td style="font-size:0.75rem; color:var(--text-secondary);">${f.detail}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    `;
  }
};

window.renderMCPRegistry = function () {
  const grid = document.getElementById('mcp-servers-grid');
  if (!grid) return;

  grid.innerHTML = window.state.mcpServers
    .map((srv) => {
      const isOnline = srv.status === 'active';
      return `
      <div class="glass-card mcp-node-card" style="padding:14px; border-radius:var(--radius-md);">
        <div class="mcp-node-header">
          <h4>◈ ${srv.name}</h4>
          <span class="badge ${isOnline ? 'badge-success' : 'badge-danger'}">${isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-bottom:8px; font-family:var(--font-mono); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          cmd: ${srv.command} ${srv.args || ''}
        </div>
        <div class="mcp-tools-list">
          ${srv.tools.map((tool) => `<span class="mcp-tool-badge">${tool}</span>`).join('')}
        </div>
      </div>
    `;
    })
    .join('');

  // Renders the matrix:
  const authMatrixBody = document.getElementById('mcp-auth-matrix-body');
  if (authMatrixBody) {
    const roles = Object.values(window.state.agents).map((agent) => ({
      key: agent.id,
      name: `◈ ${agent.name}`,
    }));
    const servers = [
      { id: 'sqlite', col: 'SQLite Database' },
      { id: 'github', col: 'GitHub Integration' },
      { id: 'puppeteer', col: 'Puppeteer Browser' },
      { id: 'brave-search', col: 'Brave Search API' },
    ];

    if (!window.state.mcpAuthMatrix) {
      window.state.mcpAuthMatrix = {
        orchestrator: { sqlite: true, github: true, puppeteer: false, 'brave-search': true },
        coder: { sqlite: true, github: true, puppeteer: true, 'brave-search': false },
        tester: { sqlite: false, github: false, puppeteer: true, 'brave-search': false },
        security: { sqlite: true, github: false, puppeteer: false, 'brave-search': false },
      };
    }

    authMatrixBody.innerHTML = roles
      .map((role) => {
        const auth =
          window.state.mcpAuthMatrix[role.key] ||
          window.state.mcpAuthMatrix[window.state.agents[role.key]?.role] ||
          {};
        return `
        <tr>
          <td style="font-weight: 600;">${role.name}</td>
          ${servers
            .map((srv) => {
              const checked = auth[srv.id] ? 'checked' : '';
              return `
              <td style="text-align:center;">
                <label class="switch" style="transform: scale(0.85); display: inline-block;">
                  <input type="checkbox" class="mcp-matrix-checkbox" data-role="${role.key}" data-server="${srv.id}" ${checked}>
                  <span class="slider-toggle"></span>
                </label>
              </td>
            `;
            })
            .join('')}
        </tr>
      `;
      })
      .join('');

    // Wire auth matrix checkbox listeners
    document.querySelectorAll('.mcp-matrix-checkbox').forEach((chk) => {
      chk.addEventListener('change', (e) => {
        const { role, server } = e.target.dataset;
        if (!window.state.mcpAuthMatrix[role]) {
          window.state.mcpAuthMatrix[role] = {};
        }
        window.state.mcpAuthMatrix[role][server] = e.target.checked;
        const srvName = window.state.mcpServers.find((s) => s.id === server)?.name || server;
        window.dispatch('ADD_LOG', {
          agent: 'system',
          type: 'info',
          msg: `Matrix Config: Access for role [${role}] on MCP [${srvName}] set to ${e.target.checked ? 'GRANTED' : 'REVOKED'}.`,
        });
      });
    });
  }
};

window.initMCPRegistryForm = function () {
  const form = document.getElementById('mcp-register-form');
  if (form && !form.dataset.wired) {
    form.dataset.wired = 'true';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('new-mcp-name').value;
      const transport = document.getElementById('new-mcp-transport').value;
      const command = document.getElementById('new-mcp-command').value;

      const newServer = {
        id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: name,
        command: transport === 'stdio' ? command.split(' ')[0] : 'SSE Endpoint',
        args: transport === 'stdio' ? command.split(' ').slice(1).join(' ') : command,
        status: 'active',
        tools: ['custom_mcp_tool'],
      };

      window.state.mcpServers.push(newServer);
      window.renderMCPRegistry();

      const ts = new Date().toTimeString().split(' ')[0];
      const logBox = document.getElementById('mcp-events-log');
      if (logBox) {
        logBox.innerHTML += `<div class="log-line text-success">[${ts}] Established stdio tunnel to ${name} successfully. Registered 1 tool.</div>`;
        logBox.scrollTop = logBox.scrollHeight;
      }

      window.dispatch('ADD_LOG', {
        agent: 'system',
        type: 'success',
        msg: `MCP Server Hub: Connected to [${name}] via SSE/Stdio. Registered tools: [custom_mcp_tool].`,
      });
      form.reset();
    });
  }
};

window.updateSidebarBadges = function () {
  const s = window.state;
  if (!s) return;

  // 1. Jutsu Roadmap (in progress & review tasks)
  if (s.tasks) {
    const roadmapCount = s.tasks.filter(
      (t) => t.status === 'in_progress' || t.status === 'review',
    ).length;
    const elRoadmap = document.getElementById('in-progress-count');
    if (elRoadmap) {
      elRoadmap.innerText = roadmapCount;
      elRoadmap.style.display = roadmapCount > 0 ? 'inline-block' : 'none';
    }
  }

  // 2. Council Decrees (pending decisions)
  if (s.decisions) {
    const decisionsCount = s.decisions.filter((d) => d.status === 'proposed').length;
    const elDecisions = document.getElementById('pending-decisions-count');
    if (elDecisions) {
      elDecisions.innerText = decisionsCount;
      elDecisions.style.display = decisionsCount > 0 ? 'inline-block' : 'none';
    }
  }

  // 3. Testing Grounds (failed test suites)
  if (s.testing && s.testing.suites) {
    const testFailures = s.testing.suites.filter((suite) => suite.status === 'failed').length;
    const elTests = document.getElementById('test-failures-count');
    if (elTests) {
      elTests.innerText = testFailures;
      elTests.style.display = testFailures > 0 ? 'inline-block' : 'none';
    }
  }

  // 4. Shadow Guard (open vulnerabilities)
  if (s.security && s.security.vulnerabilities) {
    const securityVulns = s.security.vulnerabilities.filter((v) => v.status === 'open').length;
    const elSecurity = document.getElementById('security-vulns-count');
    if (elSecurity) {
      elSecurity.innerText = securityVulns;
      elSecurity.style.display = securityVulns > 0 ? 'inline-block' : 'none';
    }
  }

  // 5. Notifications (unread notifications)
  if (s.notifications && s.notifications.items) {
    const unreadNotifs = s.notifications.items.filter((n) => !n.read).length;
    const elNotifs = document.getElementById('notif-badge-count');
    if (elNotifs) {
      elNotifs.innerText = unreadNotifs;
      elNotifs.style.display = unreadNotifs > 0 ? 'inline-flex' : 'none';
    }
  }

  // 6. Pull Requests (open PRs)
  if (s.pullRequests && s.pullRequests.list) {
    const openPRs = s.pullRequests.list.filter((p) => p.status === 'open').length;
    const elPRs = document.getElementById('pr-badge-count');
    if (elPRs) {
      elPRs.innerText = openPRs;
      elPRs.style.display = openPRs > 0 ? 'inline-block' : 'none';
    }
  }

  // 7. Approvals (pending approvals)
  if (s.approvals && s.approvals.queue) {
    const pendingApprovals = s.approvals.queue.filter((a) => a.status === 'pending').length;
    const elApprovals = document.getElementById('approval-badge-count');
    if (elApprovals) {
      elApprovals.innerText = pendingApprovals;
      elApprovals.style.display = pendingApprovals > 0 ? 'inline-block' : 'none';
    }
  }
};

/* ============================================================
   METRICS RENDERING
   ============================================================ */
// Note: This function preserves the static brand <h1> in index.html and explicitly guards against modifying it
window.renderMetrics = function () {
  // Guard: Never modify the brand heading - it already contains "coNinja" and should remain static
  const brandHeading = document.querySelector('.brand h1');
  if (brandHeading) {
    // Explicitly preserve the original content - do not set innerHTML or textContent
    // The brand heading is static HTML and should never be modified by JavaScript
  }

  // Update metrics elements
  const elFixes = document.getElementById('metrics-auto-fixes');
  if (elFixes) elFixes.innerText = window.state.autoFixes;
  const elRequests = document.getElementById('metrics-llm-requests');
  if (elRequests) elRequests.innerText = window.state.llmRequests;
  const elSpent = document.querySelector('.budget-spent');
  if (elSpent) {
    const isBudgetDepleted = window.state.accumulatedCost >= window.state.dailyLimit;
    elSpent.innerHTML = `$${window.state.accumulatedCost.toFixed(2)} <span class="budget-total">/ $${window.state.dailyLimit.toFixed(2)}</span>`;
    // Add alarm state when budget is depleted
    if (isBudgetDepleted) {
      elSpent.classList.add('budget-depleted');
      elSpent.classList.remove('text-orange', 'text-primary');
    } else {
      elSpent.classList.remove('budget-depleted');
    }
  }
  const elBar = document.querySelector('.budget-bar-fill');
  if (elBar) {
    const fillPercent = Math.min(
      (window.state.accumulatedCost / window.state.dailyLimit) * 100,
      100,
    );
    elBar.style.width = `${fillPercent}%`;
    // Make bar red when budget depleted
    if (window.state.accumulatedCost >= window.state.dailyLimit) {
      elBar.style.background = '#ef4444';
    } else {
      elBar.style.background = 'var(--accent-cyan)';
    }
  }
  const elBadge = document.querySelector('.budget-badge');
  if (elBadge) {
    if (window.state.accumulatedCost >= window.state.dailyLimit) {
      elBadge.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      elBadge.style.background = 'rgba(239, 68, 68, 0.05)';
    } else {
      elBadge.style.border = '1px solid rgba(255, 179, 0, 0.15)';
      elBadge.style.background = 'rgba(255, 179, 0, 0.05)';
    }
  }
};

/* ============================================================
   GLOBAL LOADER UTILITY
   ============================================================ */
window.showGlobalLoader = function (text = 'Loading...') {
  const loader = document.getElementById('global-loader');
  const textEl = loader?.querySelector('.loader-text');
  if (loader) {
    if (textEl) textEl.textContent = text;
    loader.classList.add('active');
  }
};

window.hideGlobalLoader = function () {
  const loader = document.getElementById('global-loader');
  if (loader) loader.classList.remove('active');
};

/* ============================================================
   SKELETON LOADER HELPERS
   ============================================================ */
window.renderSkeleton = function (type = 'text', count = 1) {
  const classes = {
    text: 'skeleton skeleton-text',
    title: 'skeleton skeleton-title',
    card: 'skeleton skeleton-card',
    circle: 'skeleton skeleton-circle',
    row: 'skeleton skeleton-row',
  };
  const className = classes[type] || classes.text;
  return Array(count).fill(`<div class="${className}"></div>`).join('');
};
