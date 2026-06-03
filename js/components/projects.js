/* ============================================================
   CoNinja Shadow Swarm — Multi-Project Workspace Manager
   Project switching, template instantiation, cloning, archiving
   ============================================================ */

(function () {
  'use strict';

  const STATUS_ICONS = {
    active: window.ninjaIcons ? window.ninjaIcons.get('star') : '',
    archived: window.ninjaIcons ? window.ninjaIcons.get('revert') : '',
    paused: window.ninjaIcons ? window.ninjaIcons.get('revert') : '',
  };

  window.renderProjects = function () {
    const container = document.getElementById('projects-container');
    if (!container) return;

    const { list, current, templates, viewMode, filter } = window.state.projects;

    // Source badge mapping
    function getSourceBadge(p) {
      if (!p.source || p.source === 'new') return '';
      const label = p.source === 'git' ? 'Git' : 'Local';
      const color = p.source === 'git' ? '#3b82f6' : '#22c55e';
      return `<span style="display:inline-block;font-size:0.6rem;padding:1px 6px;border-radius:8px;background:${color}22;color:${color};border:1px solid ${color}44;margin-left:6px;">${label}</span>`;
    }

    const filtered = list.filter((p) => {
      if (filter === 'all') return true;
      if (filter === 'active') return p.status === 'active';
      if (filter === 'archived') return p.status === 'archived';
      if (filter === 'starred') return p.starred;
      return true;
    });

    // Compute portfolio stats
    const activeProjects = list.filter((p) => p.status === 'active');
    const averageHealth =
      activeProjects.length > 0
        ? Math.round(activeProjects.reduce((sum, p) => sum + p.health, 0) / activeProjects.length)
        : 100;
    const totalCostToday = activeProjects.reduce((sum, p) => sum + p.costToday, 0);

    container.innerHTML = `
      <div class="projects-layout">
        <div class="projects-controls-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <div class="projects-controls" style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <div class="filter-tabs">
              <button class="filter-tab ${filter === 'all' ? 'active' : ''}" data-filter="all">All</button>
              <button class="filter-tab ${filter === 'active' ? 'active' : ''}" data-filter="active">Active</button>
              <button class="filter-tab ${filter === 'starred' ? 'active' : ''}" data-filter="starred"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>Starred</button>
              <button class="filter-tab ${filter === 'archived' ? 'active' : ''}" data-filter="archived">Archived</button>
            </div>
            <div class="view-toggle" style="display:flex; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; overflow:hidden;">
              <button class="btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}" data-view="grid" style="border:none; border-radius:0;">⊞</button>
              <button class="btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}" data-view="list" style="border:none; border-radius:0;">${window.ninjaIcons ? window.ninjaIcons.get('star') : ''}</button>
            </div>
            <button class="btn btn-primary" id="btn-new-project">
              <span>+ Inscribe Scroll</span>
            </button>
          </div>
        </div>

        <!-- Portfolio Dashboard Header Widget -->
        <div class="portfolio-dashboard" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; margin-bottom:24px;">
          <div class="glass-card stat-card" style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; text-align:center;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Average Swarm Health</span>
            <strong style="display:block; font-size:1.6rem; color:#4CAF50; margin-top:4px;">${averageHealth}%</strong>
          </div>
          <div class="glass-card stat-card" style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; text-align:center;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Portfolio Cost Today</span>
            <strong style="display:block; font-size:1.6rem; color:var(--accent-orange); margin-top:4px;">$${totalCostToday.toFixed(2)}</strong>
          </div>
          <div class="glass-card stat-card" style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; text-align:center;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Swarm Velocity</span>
            <strong style="display:block; font-size:1.6rem; color:var(--accent-cyan); margin-top:4px;">94.2 commits/wk</strong>
          </div>
          <div class="glass-card stat-card" style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; text-align:center;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Active Alerts</span>
            <strong style="display:block; font-size:1.6rem; color:#ef4444; margin-top:4px;">${window.state.incidents.active.length} Active</strong>
          </div>
        </div>

        <div class="projects-content ${viewMode}">
          ${
            filtered.length === 0
              ? `
            <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">No workspaces match active filters.</div>
          `
              : filtered
                  .map(
                    (p) => `
            <div class="project-card ${p.id === current ? 'active' : ''} ${p.status === 'archived' ? 'archived' : ''}" data-project-id="${p.id}">
              <div class="project-card-header">
                <div class="project-status-title" style="display:flex; align-items:center; gap:8px;">
                  <span class="project-status-icon">${STATUS_ICONS[p.status]}</span>
                  <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:600;">${p.status}</span>
                </div>
                <div class="project-star ${p.starred ? 'starred' : ''}" data-id="${p.id}" title="${p.starred ? 'Unstar' : 'Star'} project" aria-label="${p.starred ? 'Unstar' : 'Star'} project">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="${p.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
              </div>
              <div class="project-body">
                 <h3 class="project-name">${p.name}${getSourceBadge(p)}</h3>
                 <p class="project-desc">${p.description || 'No description scroll inscribed.'}</p>
                 <div class="project-tags">
                   ${p.tags.map((t) => `<span class="tag">${t}</span>`).join('')}
                 </div>
                 <!-- Project health progress bar -->
                 <div class="card-progress-container" role="progressbar" aria-valuenow="${p.health}" aria-valuemin="0" aria-valuemax="100">
                   <div class="card-progress-fill" style="width:${p.health}%"></div>
                 </div>
              </div>
              <div class="project-metrics">
                <div class="metric">
                  <span class="metric-label">Health</span>
                  <span class="metric-value" style="color: ${getHealthColor(p.health)}">${p.health}%</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Today</span>
                  <span class="metric-value">$${p.costToday.toFixed(2)}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Members</span>
                  <span class="metric-value">${p.members}</span>
                </div>
              </div>
              <div class="project-footer">
                <span class="last-activity">${formatTime(p.lastActivity)}</span>
                <div class="project-footer-actions">
                  <button class="btn btn-xs btn-outline btn-clone-project" data-id="${p.id}" title="Clone Project">${window.ninjaIcons ? window.ninjaIcons.get('star') : ''}</button>
                  ${
                    p.status === 'active'
                      ? `
                    <button class="btn btn-xs btn-outline btn-archive-project" data-id="${p.id}" title="Archive Project">${window.ninjaIcons ? window.ninjaIcons.get('revert') : ''}</button>
                  `
                      : `
                    <button class="btn btn-xs btn-outline btn-restore-project" data-id="${p.id}" title="Restore Project" aria-label="Restore project">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      Restore
                    </button>
                  `
                  }
                  ${
                    p.id === current
                      ? '<span class="current-badge">Active</span>'
                      : '<button class="btn btn-xs btn-primary switch-btn">Switch</button>'
                  }
                </div>
              </div>
            </div>
          `,
                  )
                  .join('')
          }
        </div>

        <div class="project-templates">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; margin-top:32px;">
            <h3 style="margin:0;">Instantiate Shinobi Blueprints</h3>
            <button class="btn btn-outline btn-xs" id="btn-create-custom-template">+ Create Custom Template</button>
          </div>
          <div class="templates-grid">
            ${templates
              .map(
                (t) => `
              <div class="template-card">
                <div class="template-icon">${window.ninjaIcons ? window.ninjaIcons.get('star') : ''}</div>
                <div class="template-name">${t.name}</div>
                <div class="template-desc">${t.description}</div>
                <div class="template-stack">${t.stack.map((s) => `<span class="stack-tag">${s}</span>`).join('')}</div>
                <button class="btn btn-sm btn-primary btn-use-template" data-template-id="${t.id}">Instantiate</button>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- New Project Modal -->
      <div id="new-project-modal" class="modal-overlay" style="display: none;">
        <div class="modal-card" style="max-width:400px; padding: 24px;">
          <div class="modal-header" style="margin-bottom:16px;">
            <h3>Inscribe New Mission Scroll</h3>
            <button class="modal-close" id="btn-cancel-project" style="background:transparent; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;">&times;</button>
          </div>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
            <div class="form-group">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block;">Mission Name:</label>
              <input type="text" id="new-project-name" class="form-input text-xs" style="width:100%;" placeholder="e.g. Shadow Cache Node" required>
            </div>
            <div class="form-group">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block;">Description Scope Scope:</label>
              <textarea id="new-project-desc" class="form-textarea text-xs" style="width:100%; min-height:80px;" placeholder="Outline the objective..."></textarea>
            </div>
            <div class="form-group">
              <label style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; display:block;">Tags (comma-separated):</label>
              <input type="text" id="new-project-tags" class="form-input text-xs" style="width:100%;" placeholder="e.g. backend, caching">
            </div>
          </div>
          <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px;">
            <button class="btn btn-outline" id="btn-cancel-project-footer">Cancel</button>
            <button class="btn btn-primary" id="btn-create-project">Forge Workspace</button>
          </div>
        </div>
      </div>
    `;

    attachListeners();
    injectStyles();
  };

  function getHealthColor(health) {
    if (health >= 90) return '#4CAF50';
    if (health >= 70) return '#ff9800';
    return '#ef4444';
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

  function attachListeners() {
    // Filter tabs
    document.querySelectorAll('.filter-tabs .filter-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        window.state.projects.filter = tab.dataset.filter;
        window.renderProjects();
      });
    });

    // View toggle
    document.querySelectorAll('.view-toggle .btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.state.projects.viewMode = btn.dataset.view;
        window.renderProjects();
      });
    });

    // Switch active project
    document.querySelectorAll('.project-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.switch-btn')) return;
        if (
          e.target.closest('.btn-clone-project') ||
          e.target.closest('.btn-archive-project') ||
          e.target.closest('.btn-restore-project') ||
          e.target.closest('.project-star')
        )
          return;
        switchProject(card.dataset.projectId);
      });
    });

    document.querySelectorAll('.switch-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.closest('.project-card').dataset.projectId;
        switchProject(id);
      });
    });

    function switchProject(id) {
      if (id !== window.state.projects.current) {
        window.dispatch('PROJECT_SWITCH', { projectId: id });

        const proj = window.state.projects.list.find((p) => p.id === id);
        window.dispatch('ADD_LOG', {
          agent: 'system',
          type: 'info',
          msg: `Switched target coordinates to workspace: "${proj.name}"`,
        });

        window.triggerSmokePuff('current-project-name');
        window.renderProjects();
        window.showToast(`Active coordinates switched to ${proj.name}`, 'success');

        const nameEl = document.getElementById('current-project-name');
        if (nameEl) nameEl.textContent = proj.name;
      }
    }

    // Star toggle
    document.querySelectorAll('.project-star').forEach((star) => {
      star.addEventListener('click', (e) => {
        e.stopPropagation();
        window.dispatch('PROJECT_STAR', { projectId: star.dataset.id });
        window.renderProjects();
      });
    });

    // Clone project
    document.querySelectorAll('.btn-clone-project').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const target = window.state.projects.list.find((p) => p.id === id);
        if (target) {
          window.showConfirmDialog(
            'Fork Workspace',
            `Create a clone of "${target.name}"? This forks active agent history and code nodes.`,
            () => {
              const name = `${target.name} Copy`;
              window.dispatch('PROJECT_CREATE', {
                name: name,
                description: `Clone of ${target.name}. ${target.description}`,
                tags: [...target.tags, 'cloned'],
              });
              window.dispatch('ADD_LOG', {
                agent: 'system',
                type: 'success',
                msg: `Cloned coordinates successfully: "${target.name}" -> "${name}"`,
              });
              window.renderProjects();
              window.showToast(`Cloned project: ${name}`, 'success');
            },
          );
        }
      });
    });

    // Archive project
    document.querySelectorAll('.btn-archive-project').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const target = window.state.projects.list.find((p) => p.id === id);
        if (target) {
          window.showConfirmDialog(
            'Archive Workspace',
            `Archive project coordinates for "${target.name}"? This freezes active shinobi logs.`,
            () => {
              target.status = 'archived';
              window.dispatch('ADD_LOG', {
                agent: 'system',
                type: 'warning',
                msg: `Archived project scroll: "${target.name}"`,
              });
              window.renderProjects();
              window.showToast(`Archived project: ${target.name}`, 'warning');
            },
          );
        }
      });
    });

    // Restore project
    document.querySelectorAll('.btn-restore-project').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const target = window.state.projects.list.find((p) => p.id === id);
        if (target) {
          target.status = 'active';
          window.dispatch('ADD_LOG', {
            agent: 'system',
            type: 'success',
            msg: `Restored coordinates to active swarm scopes: "${target.name}"`,
          });
          window.renderProjects();
          window.showToast(`Restored project: ${target.name}`, 'success');
        }
      });
    });

    // New project modal
    const newBtn = document.getElementById('btn-new-project');
    const modal = document.getElementById('new-project-modal');
    const cancelBtn = document.getElementById('btn-cancel-project');
    const cancelBtnFooter = document.getElementById('btn-cancel-project-footer');
    const createBtn = document.getElementById('btn-create-project');

    if (newBtn && modal) {
      newBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
      });
    }

    const closeNewProjModal = () => {
      if (modal) modal.style.display = 'none';
      document.getElementById('new-project-name').value = '';
      document.getElementById('new-project-desc').value = '';
      document.getElementById('new-project-tags').value = '';
    };

    if (cancelBtn) cancelBtn.addEventListener('click', closeNewProjModal);
    if (cancelBtnFooter) cancelBtnFooter.addEventListener('click', closeNewProjModal);

    if (createBtn) {
      createBtn.addEventListener('click', () => {
        const name = document.getElementById('new-project-name').value.trim();
        const desc = document.getElementById('new-project-desc').value.trim();
        const rawTags = document.getElementById('new-project-tags').value.trim();
        const tags = rawTags ? rawTags.split(',').map((s) => s.trim()) : [];
        if (name) {
          window.dispatch('PROJECT_CREATE', { name, description: desc, tags });

          const lastProj = window.state.projects.list[window.state.projects.list.length - 1];
          window.dispatch('PROJECT_SWITCH', { projectId: lastProj.id });

          window.dispatch('ADD_LOG', {
            agent: 'system',
            type: 'success',
            msg: `Forged new mission workspace scroll: "${name}"`,
          });

          closeNewProjModal();
          window.renderProjects();
          window.showToast(`Created project: ${name}`, 'success');

          const nameEl = document.getElementById('current-project-name');
          if (nameEl) nameEl.textContent = name;
        }
      });
    }

    // Instantiate from template click
    document.querySelectorAll('.btn-use-template').forEach((btn) => {
      btn.addEventListener('click', () => {
        const templateId = btn.dataset.templateId;
        const template = window.state.projects.templates.find((t) => t.id === templateId);
        if (template) {
          window.showConfirmDialog(
            'Instantiate Blueprint',
            `Create a new project workspace based on the "${template.name}" blueprint?`,
            () => {
              const name = `My ${template.name}`;
              window.dispatch('PROJECT_CREATE', {
                name: name,
                description: `Instantiated from template: ${template.name}. Stack: ${template.stack.join(', ')}`,
                tags: [...template.stack, 'blueprint'],
              });

              const lastProj = window.state.projects.list[window.state.projects.list.length - 1];
              window.dispatch('PROJECT_SWITCH', { projectId: lastProj.id });

              window.dispatch('ADD_LOG', {
                agent: 'system',
                type: 'success',
                msg: `Instantiated blueprint: "${template.name}" into active workspace "${name}"`,
              });

              window.renderProjects();
              window.showToast('Project workspace instantiated successfully!', 'success');

              const nameEl = document.getElementById('current-project-name');
              if (nameEl) nameEl.textContent = name;
            },
          );
        }
      });
    });

    // Create Custom Template
    const createTemplateBtn = document.getElementById('btn-create-custom-template');
    if (createTemplateBtn) {
      createTemplateBtn.addEventListener('click', () => {
        window.showConfirmDialog(
          'Forge Custom Template',
          `<div style="text-align:left; display:flex; flex-direction:column; gap:8px;">
             <div>
               <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Template Name:</label>
               <input type="text" id="tmpl-input-name" class="form-input text-xs" style="width:100%;" placeholder="e.g. Microservice Stack" required>
             </div>
             <div>
               <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Description:</label>
               <input type="text" id="tmpl-input-desc" class="form-input text-xs" style="width:100%;" placeholder="e.g. Express server + Redis caching">
             </div>
             <div>
               <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Stack Tags (comma-separated):</label>
               <input type="text" id="tmpl-input-stack" class="form-input text-xs" style="width:100%;" placeholder="e.g. express, typescript, redis">
             </div>
           </div>`,
          () => {
            const name = document.getElementById('tmpl-input-name').value.trim();
            const desc = document.getElementById('tmpl-input-desc').value.trim();
            const stackRaw = document.getElementById('tmpl-input-stack').value.trim();
            const stack = stackRaw ? stackRaw.split(',').map((s) => s.trim()) : [];

            if (name) {
              window.state.projects.templates.push({
                id: `tmpl-${Date.now()}`,
                name,
                description: desc || 'Custom instantiated project blueprint',
                stack,
              });

              window.dispatch('ADD_LOG', {
                agent: 'system',
                type: 'success',
                msg: `Forged custom project blueprint: "${name}".`,
              });

              window.renderProjects();
              window.showToast(`Template "${name}" created!`, 'success');
            }
          },
        );
      });
    }
  }

  function injectStyles() {
    if (document.getElementById('projects-styles-extended')) return;
    const style = document.createElement('style');
    style.id = 'projects-styles-extended';
    style.textContent = `
      .projects-layout { max-width: 1200px; margin: 0 auto; }
      .projects-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .projects-controls { display: flex; gap: 12px; align-items: center; }
      .filter-tabs { display: flex; gap: 4px; }
      .filter-tab { padding: 8px 16px; border-radius: 20px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); cursor: pointer; font-size: 0.85rem; transition: all 0.15s; }
      .filter-tab:hover { border-color: var(--accent-orange); color: var(--text-primary); }
      .filter-tab.active { background: rgba(255,115,0,0.15); border-color: var(--accent-orange); color: var(--accent-orange); }
      
      .projects-content { display: grid; gap: 20px; margin-bottom: 32px; }
      .projects-content.grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
      .projects-content.list { grid-template-columns: 1fr; }\n      @media (max-width: 768px) { .projects-content.grid { grid-template-columns: 1fr; } }\n      @media (min-width: 769px) and (max-width: 1200px) { .projects-content.grid { grid-template-columns: repeat(2, 1fr); } }\n      @media (min-width: 1400px) { .projects-content.grid { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); } }
      .projects-content.list .project-card { display: grid; grid-template-columns: 1fr auto auto auto; align-items: center; gap: 20px; }
      .projects-content.list .project-body { display: flex; gap: 16px; align-items: center; }
      .projects-content.list .project-desc { display: none; }
      .projects-content.list .project-metrics { border: none; margin: 0; padding: 0; }
      
      .project-card { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; border: 2px solid transparent; cursor: pointer; transition: all 0.15s; border: 1px solid rgba(255,255,255,0.05); }
      .project-card:hover { background: rgba(255,255,255,0.05); transform: translateY(-2px); border-color: rgba(255,115,0,0.2); }
      .project-card.active { border-color: var(--accent-orange); background: rgba(255,115,0,0.05); }
      .project-card.archived { opacity: 0.55; }
      .project-card-header { display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center; }
      .project-star { cursor: pointer; opacity: 0.25; transition: all 0.15s; font-size: 0.9rem; }
      .project-star.starred { opacity: 1; filter: drop-shadow(0 0 4px var(--accent-orange)); }
      .project-star:hover { opacity: 0.8; }
      .project-name { margin: 0 0 8px 0; font-size: 1.1rem; color: var(--text-primary); }
      .project-desc { color: var(--text-muted); font-size: 0.82rem; margin-bottom: 12px; line-height: 1.5; }
      .project-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
      .project-tags .tag { padding: 2px 8px; background: rgba(255,255,255,0.06); border-radius: 10px; font-size: 0.65rem; color: var(--text-secondary); }
      .project-metrics { display: flex; gap: 24px; margin-bottom: 16px; padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
      .project-metrics .metric { text-align: center; }
      .project-metrics .metric-label { display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
      .project-metrics .metric-value { font-size: 1.1rem; font-weight: 700; color: var(--accent-orange); margin-top: 2px; }
      .project-footer { display: flex; justify-content: space-between; align-items: center; }
      .last-activity { font-size: 0.75rem; color: var(--text-muted); }
      .project-footer-actions { display: flex; gap: 6px; align-items: center; }
      .current-badge { padding: 4px 12px; background: rgba(255,115,0,0.15); color: var(--accent-orange); border-radius: 12px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(255,115,0,0.25); }
      
      .project-templates h3 { margin: 32px 0 16px 0; font-size: 1.05rem; }
      .templates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
      .template-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; padding: 20px; text-align: center; transition: all 0.15s; }
      .template-card:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,115,0,0.2); }
      .template-icon { font-size: 2rem; margin-bottom: 12px; }
      .template-name { font-weight: 600; margin-bottom: 8px; font-size: 0.95rem; }
      .template-desc { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4; height: 40px; overflow: hidden; }
      .template-stack { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; margin-bottom: 16px; }
      .stack-tag { padding: 2px 6px; background: rgba(255,115,0,0.1); border-radius: 6px; font-size: 0.65rem; color: var(--accent-orange); font-family: var(--font-mono); }
      
      .modal-card { background: var(--surface-glass, rgba(8,6,5,0.85)); backdrop-filter: blur(20px); border: 1px solid rgba(255,115,0,0.3); border-radius: 16px; box-shadow: 0 24px 64px rgba(0,0,0,0.6); }
    `;
    document.head.appendChild(style);
  }

  window.initProjects = function () {
    window.renderProjects();
  };

  console.warn(
    `%c[CoNinja] Project Manager loaded ${window.ninjaIcons ? window.ninjaIcons.get('star') : ''}`,
    'color:#ff7300;font-weight:bold;',
  );
})();
