/* ============================================================
   CoNinja Shadow Swarm — Repository Intelligence Component
   Dependency graph, symbol search, impact analysis, call graphs, circular dependency detection
   ============================================================ */

(function () {
  'use strict';

  // Resilient state check
  if (!window.state.intelligence.callGraph) {
    window.state.intelligence.callGraph = {
      selectedFunction: 'authenticate',
      functions: {
        authenticate: {
          callers: [
            'src/api/auth.ts:LoginController',
            'src/middleware/session.ts:SessionMiddleware',
          ],
          callees: ['src/models/User.ts:User.findOne', 'npm:bcrypt.compare', 'npm:jwt.sign'],
        },
        sendEmail: {
          callers: ['src/services/auth.ts:sendWelcomeEmail', 'src/api/users.ts:registerUser'],
          callees: ['npm:nodemailer.createTransport', 'src/config/smtp.json'],
        },
        findOne: {
          callers: ['src/services/auth.ts:authenticate', 'src/api/users.ts:getUserProfile'],
          callees: ['database:postgres.query'],
        },
      },
    };
  }

  if (!window.state.intelligence.hasCircularDependency) {
    window.state.intelligence.hasCircularDependency = true;
  }

  if (window.state.intelligence.zoom === undefined) {
    window.state.intelligence.zoom = 1.0;
  }
  if (window.state.intelligence.pan === undefined) {
    window.state.intelligence.pan = { x: 0, y: 0 };
  }

  window.renderIntelligence = function () {
    const container = document.getElementById('intelligence-container');
    if (!container) return;

    const { dependencies, symbols, impactAnalysis, callGraph, hasCircularDependency } =
      window.state.intelligence;
    const activeTab = window.state.intelActiveTab || 'dependencies';
    const searchQuery = window.state.intelSearchQuery || '';

    container.innerHTML = `
      <div class="intel-layout">
        <div class="intel-controls">
          <div class="intel-search" style="position:relative; display:flex; align-items:center;">
            ${window.ninjaIcons ? `<span style="position:absolute; left:12px; color:var(--text-muted); display:flex; align-items:center; pointer-events:none;">${window.ninjaIcons.get('diamond')}</span>` : ''}
            <input type="text" id="intel-search" class="form-input" placeholder="Search symbols or files..." value="${searchQuery}" style="${window.ninjaIcons ? 'padding-left:36px;' : ''} width:100%;">
          </div>
        </div>

        <div class="intel-tabs">
          <button class="intel-tab ${activeTab === 'dependencies' ? 'active' : ''}" data-tab="dependencies">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} Dependencies & Call Graph</button>
          <button class="intel-tab ${activeTab === 'symbols' ? 'active' : ''}" data-tab="symbols">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} Symbols</button>
          <button class="intel-tab ${activeTab === 'impact' ? 'active' : ''}" data-tab="impact">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} Impact Analysis & Refactor Plan</button>
        </div>

        <div class="intel-content">
          <div id="intel-view-dependencies" class="intel-view ${activeTab === 'dependencies' ? 'active' : ''}">
            ${
              hasCircularDependency
                ? `
              <!-- Circular Dependency Warnings Alert -->
              <div class="circular-dependency-alert" style="margin-bottom:16px; padding:12px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; display:flex; align-items:center; gap:12px; font-size:0.8rem; color:var(--accent-error);">
                <span>${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} <strong>Circular Dependency Detected:</strong> auth-service → user-model → auth-service</span>
                <button class="btn btn-xs btn-outline" id="btn-resolve-circular" style="margin-left:auto; border-color:rgba(239,68,68,0.3); color:var(--text-primary); cursor:pointer;">Resolve Circle</button>
              </div>
            `
                : ''
            }
            
            <div class="deps-view">
              ${renderDependencies(dependencies)}
              
              <!-- Call Graph Explorer Widget -->
              <div class="glass-card call-graph-explorer" style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px;">
                <h4 style="margin:0 0 12px 0;">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} Call Graph Explorer</h4>
                <div style="font-size:0.8rem; margin-bottom:12px;">
                  <label style="font-size:0.72rem; color:var(--text-muted); display:block; margin-bottom:4px;">Target Function:</label>
                  <select id="callgraph-func-select" class="form-input text-xs" style="width:100%;">
                    <option value="authenticate" ${callGraph.selectedFunction === 'authenticate' ? 'selected' : ''}>authenticate()</option>
                    <option value="sendEmail" ${callGraph.selectedFunction === 'sendEmail' ? 'selected' : ''}>sendEmail()</option>
                    <option value="findOne" ${callGraph.selectedFunction === 'findOne' ? 'selected' : ''}>findOne()</option>
                  </select>
                </div>
                
                ${renderCallGraphDetails(callGraph)}
              </div>
            </div>
          </div>
          
          <div id="intel-view-symbols" class="intel-view ${activeTab === 'symbols' ? 'active' : ''}">
            ${renderSymbols(symbols)}
          </div>
          
          <div id="intel-view-impact" class="intel-view ${activeTab === 'impact' ? 'active' : ''}">
            ${renderImpact(impactAnalysis)}
          </div>
        </div>
      </div>
    `;

    attachListeners();
    injectStyles();
  };

  function renderDependencies(deps) {
    const query = (window.state.intelSearchQuery || '').trim().toLowerCase();

    const coords = {
      'user-model': { x: 50, y: 70 },
      'auth-service': { x: 20, y: 30 },
      'email-service': { x: 80, y: 30 },
    };

    const zoom = window.state.intelligence.zoom || 1.0;
    const pan = window.state.intelligence.pan || { x: 0, y: 0 };

    return `
      <div style="display:flex; flex-direction:column; gap:16px; width:100%;">
        <div class="deps-graph" style="position:relative; overflow:hidden;">
          <!-- Controls toolbar -->
          <div class="graph-controls" style="position:absolute; top:12px; left:12px; z-index:10; display:flex; gap:4px; background:rgba(8,6,5,0.85); padding:6px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(8px); pointer-events:auto;">
            <button class="btn btn-outline btn-xs" id="graph-zoom-in" title="Zoom In" style="padding:4px 8px; font-weight:bold; font-size:0.75rem;">+</button>
            <button class="btn btn-outline btn-xs" id="graph-zoom-out" title="Zoom Out" style="padding:4px 8px; font-weight:bold; font-size:0.75rem;">-</button>
            <button class="btn btn-outline btn-xs" id="graph-pan-left" title="Pan Left" style="padding:4px 6px; font-size:0.7rem;">←</button>
            <button class="btn btn-outline btn-xs" id="graph-pan-up" title="Pan Up" style="padding:4px 6px; font-size:0.7rem;">↑</button>
            <button class="btn btn-outline btn-xs" id="graph-pan-down" title="Pan Down" style="padding:4px 6px; font-size:0.7rem;">↓</button>
            <button class="btn btn-outline btn-xs" id="graph-pan-right" title="Pan Right" style="padding:4px 6px; font-size:0.7rem;">→</button>
            <button class="btn btn-outline btn-xs" id="graph-reset" title="Reset View" style="padding:4px 8px; font-size:0.7rem;">Reset</button>
          </div>

          <div class="graph-viewport" id="graph-viewport-area" style="overflow:hidden; height:410px; width:100%; position:relative; cursor:grab; pointer-events:auto;">
            <div class="graph-nodes" id="graph-nodes-container" style="position:relative; width:100%; height:100%; transform-origin:center center; transform: translate(${pan.x}px, ${pan.y}px) scale(${zoom}); transition:transform 0.15s ease-out; pointer-events:none;">
              ${deps.nodes
                .map((n) => {
                  const matches =
                    !query ||
                    n.name.toLowerCase().includes(query) ||
                    n.file.toLowerCase().includes(query);
                  const pos = coords[n.id] || { x: 40, y: 40 };
                  return `
                  <div class="dep-node ${n.type} ${matches ? 'highlight' : 'fade'}" style="left: ${pos.x}%; top: ${pos.y}%; pointer-events:auto;">
                    <span class="node-icon">${getNodeIcon(n.type)}</span>
                    <span class="node-name">${n.name}</span>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>
          <div class="graph-legend">
            <span class="legend-item"><span class="dot model"></span>Model</span>
            <span class="legend-item"><span class="dot service"></span>Service</span>
            <span class="legend-item"><span class="dot module"></span>Module</span>
          </div>
        </div>
        <div class="deps-list">
          <h4>Dependency Edges</h4>
          ${deps.edges
            .map((e) => {
              const matches =
                !query ||
                e.from.toLowerCase().includes(query) ||
                e.to.toLowerCase().includes(query);
              return `
              <div class="dep-edge ${matches ? 'highlight' : 'fade'}">
                <span class="edge-from">${e.from}</span>
                <span class="edge-arrow">→</span>
                <span class="edge-to">${e.to}</span>
                <span class="edge-type">${e.type}</span>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  function renderCallGraphDetails(callGraph) {
    const fnData = callGraph.functions[callGraph.selectedFunction] || { callers: [], callees: [] };
    const diamondIcon = window.ninjaIcons ? window.ninjaIcons.get('diamond') : '◈';
    return `
      <div class="callgraph-tree" style="display:flex; flex-direction:column; gap:10px; font-size:0.75rem;">
        <div class="callgraph-section">
          <strong style="color:var(--accent-orange); display:block; margin-bottom:4px;">Incoming Calls (Callers)</strong>
          ${
            fnData.callers.length === 0
              ? '<span style="color:var(--text-muted);">None</span>'
              : fnData.callers
                  .map(
                    (c) => `
            <div class="callgraph-entry" style="padding:4px 8px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:4px; margin-bottom:2px; font-family:var(--font-mono); color:var(--text-secondary);">
              ${diamondIcon} ${c}
            </div>
          `,
                  )
                  .join('')
          }
        </div>
        <div class="callgraph-section" style="margin-top:8px;">
          <strong style="color:var(--accent-cyan); display:block; margin-bottom:4px;">Outgoing Calls (Callees)</strong>
          ${
            fnData.callees.length === 0
              ? '<span style="color:var(--text-muted);">None</span>'
              : fnData.callees
                  .map((c) => {
                    const formatted = c.startsWith('npm:')
                      ? `<span class="badge badge-outline" style="font-size:0.65rem; margin-right:4px; vertical-align:middle; text-transform:none;">npm</span>${c.substring(4)}`
                      : c;
                    return `
              <div class="callgraph-entry" style="padding:4px 8px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:4px; margin-bottom:2px; font-family:var(--font-mono); color:var(--text-secondary);">
                ${diamondIcon} ${formatted}
              </div>
            `;
                  })
                  .join('')
          }
        </div>
      </div>
    `;
  }

  function renderSymbols(symbols) {
    const query = (window.state.intelSearchQuery || '').trim().toLowerCase();
    const filtered = symbols.filter(
      (s) => !query || s.name.toLowerCase().includes(query) || s.file.toLowerCase().includes(query),
    );

    if (filtered.length === 0) {
      return `
        <div style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.8rem;">
          No matching symbols indexed in active branch.
        </div>
      `;
    }

    return `
      <div class="symbols-view">
        <div class="symbols-list">
          ${filtered
            .map(
              (s) => `
            <div class="symbol-item">
              <span class="symbol-icon">${getSymbolIcon(s.type)}</span>
              <div class="symbol-info">
                <span class="symbol-name">${s.name}</span>
                <span class="symbol-location">${s.file}:${s.line}</span>
              </div>
              <span class="symbol-type badge badge-outline">${s.type}</span>
              <button class="btn btn-sm btn-outline analyze-btn" data-symbol="${s.name}">Analyze Impact</button>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function renderImpact(analysis) {
    const diamondIcon = window.ninjaIcons ? window.ninjaIcons.get('diamond') : '◈';
    const clockIcon = window.ninjaIcons ? window.ninjaIcons.get('clock') : '⏱️';
    if (!analysis) {
      return `
        <div class="impact-empty">
          <div class="empty-icon">${diamondIcon}</div>
          <h3>Change Blast Radius Simulation</h3>
          <p style="color:var(--text-muted); font-size:0.8rem; margin:8px auto 20px; max-width:400px;">Select an indexed codebase symbol from the Symbols tab and trigger analysis to simulate dependency breakages.</p>
          <button class="btn btn-primary" id="demo-impact">Run Demo Analysis</button>
        </div>
      `;
    }

    return `
      <div class="impact-view-wrapper" style="display:flex; flex-direction:column; gap:20px;">
        <div class="impact-view">
          <div class="impact-header">
            <div>
              <h3 style="font-weight:600; font-size:1.1rem; color:var(--text-primary);">Impact Target: <span style="color:var(--accent-orange); font-family:var(--font-mono);">${analysis.target}</span></h3>
              <span style="font-size:0.72rem; color:var(--text-muted);">Simulation executed at ${new Date(analysis.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="impact-summary" style="display:flex; gap:10px; align-items:center;">
              <span class="impact-risk risk-${analysis.riskLevel}">${analysis.riskLevel.toUpperCase()} RISK</span>
              <span class="impact-time badge badge-outline">${clockIcon} MTTR: ${analysis.estimatedTime}</span>
            </div>
          </div>
          
          <div class="impact-stats">
            <div class="impact-stat">
              <span class="stat-num">${analysis.affectedFiles.length}</span>
              <span class="stat-label">Affected Files</span>
            </div>
            <div class="impact-stat">
              <span class="stat-num">${analysis.affectedTests}</span>
              <span class="stat-label">Broken Tests</span>
            </div>
            <div class="impact-stat">
              <span class="stat-num" style="text-transform:capitalize;">${analysis.blastRadius}</span>
              <span class="stat-label">Blast Radius</span>
            </div>
          </div>

          <div class="impact-files">
            <h4>Expected Blast Damage Zone</h4>
            ${analysis.affectedFiles
              .map(
                (f) => `
              <div class="affected-file">
                <span class="file-icon">${diamondIcon}</span>
                <span class="file-path">${f}</span>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>

        <!-- Refactor Planner Checklist -->
        <div class="glass-card refactor-planner" style="padding:20px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; max-width:800px;">
          <h3 style="color:var(--accent-cyan); font-size:1rem; margin:0 0 12px 0;">${diamondIcon} Shinobi Refactor Planner Checklist</h3>
          <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:12px;">Checkoff requirements to apply structural migrations targeting the target symbol safely.</p>
          
          <div style="display:flex; flex-direction:column; gap:8px; font-size:0.8rem; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" id="refactor-chk-1" checked>
              <span>Verify static lint checks on affected files: <strong>PASS</strong></span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" id="refactor-chk-2">
              <span>Refactor all calling endpoints mapping parameters in Express routers</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" id="refactor-chk-3">
              <span>Execute auth integration tests suite <code>ts-01</code> to confirm zero regressions</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" id="refactor-chk-4">
              <span>Submit automated pull request proposal to <code>feature/auth-module</code></span>
            </div>
          </div>
          
          <button class="btn btn-primary" id="btn-execute-refactor-plan">Execute Refactor Mission</button>
        </div>
      </div>
    `;
  }

  function getNodeIcon(type) {
    return window.ninjaIcons ? window.ninjaIcons.get('diamond') : '◈';
  }

  function getSymbolIcon(type) {
    return window.ninjaIcons ? window.ninjaIcons.get('diamond') : '◈';
  }

  function attachListeners() {
    // Resolve circular dependency
    const btnResolveCircular = document.getElementById('btn-resolve-circular');
    if (btnResolveCircular) {
      btnResolveCircular.addEventListener('click', () => {
        window.state.intelligence.hasCircularDependency = false;

        window.dispatch('ADD_LOG', {
          agent: 'architect',
          type: 'success',
          msg: 'Refactor Intelligence: Broke circular cycle chain. Abstracted auth provider interface dependencies.',
        });

        window.renderIntelligence();
        window.showToast('Circular dependency resolved!', 'success');
      });
    }

    // Callgraph select change
    const callgraphSelect = document.getElementById('callgraph-func-select');
    if (callgraphSelect) {
      callgraphSelect.addEventListener('change', () => {
        window.state.intelligence.callGraph.selectedFunction = callgraphSelect.value;
        window.renderIntelligence();
      });
    }

    // Execute refactor plan
    const btnExecuteRefactor = document.getElementById('btn-execute-refactor-plan');
    if (btnExecuteRefactor) {
      btnExecuteRefactor.addEventListener('click', () => {
        const c1 = document.getElementById('refactor-chk-1')?.checked;
        const c2 = document.getElementById('refactor-chk-2')?.checked;
        const c3 = document.getElementById('refactor-chk-3')?.checked;
        const c4 = document.getElementById('refactor-chk-4')?.checked;

        if (!c2 || !c3 || !c4) {
          window.showToast(
            'Please check off all plan items before deploying the refactor!',
            'warning',
          );
          return;
        }

        window.dispatch('ADD_LOG', {
          agent: 'coder1',
          type: 'info',
          msg: 'Jutsu Coder BE: Initiating automatic refactor migration routine...',
        });

        setTimeout(() => {
          window.dispatch('ADD_LOG', {
            agent: 'system',
            type: 'success',
            msg: 'REFACTOR COMPLETE: All usages and integration tests validated successfully.',
          });
          window.showToast('Refactor mission completed successfully!', 'success');
        }, 1500);
      });
    }

    // Tab switching
    document.querySelectorAll('.intel-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        window.state.intelActiveTab = tab.dataset.tab;
        window.renderIntelligence();
      });
    });

    // Analyze button
    document.querySelectorAll('.analyze-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const symbol = btn.dataset.symbol;
        window.dispatch('IMPACT_ANALYZE', { target: symbol });
        window.state.intelActiveTab = 'impact';
        window.renderIntelligence();
        window.showToast(`Impact analysis complete for ${symbol}`, 'success');

        window.dispatch('ADD_LOG', {
          agent: 'architect',
          type: 'success',
          msg: `Refactor Intelligence: Computed impact blast radius coordinates for change targeting: "${symbol}".`,
        });
      });
    });

    // Demo Analysis button
    const demoBtn = document.getElementById('demo-impact');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        window.dispatch('IMPACT_ANALYZE', { target: 'User Model' });
        window.state.intelActiveTab = 'impact';
        window.renderIntelligence();
        window.showToast('Demo impact analysis complete', 'success');
      });
    }

    // Search bar event
    const searchInput = document.getElementById('intel-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        window.state.intelSearchQuery = searchInput.value;
        window.renderIntelligence();
        const input = document.getElementById('intel-search');
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      });
    }

    // Helper function to update graph transform
    const updateGraphTransform = () => {
      const el = document.getElementById('graph-nodes-container');
      if (el) {
        const zoom = window.state.intelligence.zoom || 1.0;
        const pan = window.state.intelligence.pan || { x: 0, y: 0 };
        el.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
      }
    };

    // Zoom buttons
    const zoomIn = document.getElementById('graph-zoom-in');
    const zoomOut = document.getElementById('graph-zoom-out');
    if (zoomIn) {
      zoomIn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.state.intelligence.zoom = Math.min(
          (window.state.intelligence.zoom || 1.0) + 0.1,
          2.5,
        );
        updateGraphTransform();
      });
    }
    if (zoomOut) {
      zoomOut.addEventListener('click', (e) => {
        e.stopPropagation();
        window.state.intelligence.zoom = Math.max(
          (window.state.intelligence.zoom || 1.0) - 0.1,
          0.4,
        );
        updateGraphTransform();
      });
    }

    // Navigation/Pan buttons
    const panLeft = document.getElementById('graph-pan-left');
    const panRight = document.getElementById('graph-pan-right');
    const panUp = document.getElementById('graph-pan-up');
    const panDown = document.getElementById('graph-pan-down');
    const reset = document.getElementById('graph-reset');

    if (panLeft) {
      panLeft.addEventListener('click', (e) => {
        e.stopPropagation();
        window.state.intelligence.pan.x -= 40;
        updateGraphTransform();
      });
    }
    if (panRight) {
      panRight.addEventListener('click', (e) => {
        e.stopPropagation();
        window.state.intelligence.pan.x += 40;
        updateGraphTransform();
      });
    }
    if (panUp) {
      panUp.addEventListener('click', (e) => {
        e.stopPropagation();
        window.state.intelligence.pan.y -= 40;
        updateGraphTransform();
      });
    }
    if (panDown) {
      panDown.addEventListener('click', (e) => {
        e.stopPropagation();
        window.state.intelligence.pan.y += 40;
        updateGraphTransform();
      });
    }
    if (reset) {
      reset.addEventListener('click', (e) => {
        e.stopPropagation();
        window.state.intelligence.zoom = 1.0;
        window.state.intelligence.pan = { x: 0, y: 0 };
        updateGraphTransform();
      });
    }

    // Drag-to-pan logic on the viewport area
    const viewport = document.getElementById('graph-viewport-area');
    if (viewport) {
      let isDragging = false;
      let startX, startY;

      viewport.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || e.target.closest('.graph-controls')) return;
        isDragging = true;
        viewport.style.cursor = 'grabbing';
        startX = e.clientX - (window.state.intelligence.pan.x || 0);
        startY = e.clientY - (window.state.intelligence.pan.y || 0);
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        window.state.intelligence.pan.x = e.clientX - startX;
        window.state.intelligence.pan.y = e.clientY - startY;
        updateGraphTransform();
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          if (viewport) viewport.style.cursor = 'grab';
        }
      });
    }
  }

  function injectStyles() {
    if (document.getElementById('intel-styles-extended')) return;
    const style = document.createElement('style');
    style.id = 'intel-styles-extended';
    style.textContent = `
      .intel-layout { display: flex; flex-direction: column; height: 100%; max-width: 100%; margin: 0 auto; }
      .intel-header { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 20px 22px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .intel-search { width: 380px; max-width: 45%; }
      .intel-tabs { display: flex; gap: 10px; padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.1); flex-wrap: wrap; }
      .intel-tab { padding: 10px 20px; border-radius: 8px; background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.82rem; font-weight: 600; }
      .intel-tab:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
      .intel-tab.active { background: rgba(255,115,0,0.15); color: var(--accent-orange); }
      .intel-content { flex: 1; overflow-y: auto; padding: 26px 22px; }
      .intel-view { display: none; }
      .intel-view.active { display: block; }
      
      .deps-view { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; min-width: 0; }
      .deps-graph { background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; min-height: 520px; position: relative; }
      .graph-nodes { position: relative; height: 410px; }
      
      .dep-node { position: absolute; padding: 14px 20px; background: rgba(255,115,0,0.08); border: 1px solid rgba(255,115,0,0.2); border-radius: 10px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.25s ease; max-width: 230px; }
      .node-name { line-height: 1.25; }
      .dep-node:hover { transform: scale(1.05); box-shadow: 0 0 12px rgba(255,115,0,0.25); border-color: var(--accent-orange); }
      .dep-node.model { background: rgba(33,150,243,0.08); border-color: rgba(33,150,243,0.2); }
      .dep-node.service { background: rgba(76,175,80,0.08); border-color: rgba(76,175,80,0.2); }
      .dep-node.module { background: rgba(156,39,176,0.08); border-color: rgba(156,39,176,0.2); }
      
      .dep-node.fade, .dep-edge.fade { opacity: 0.25; filter: blur(0.5px); }
      .dep-node.highlight { border-color: var(--accent-orange); box-shadow: 0 0 10px rgba(255,115,0,0.3); }
      .dep-edge.highlight { border-color: var(--accent-orange); background: rgba(255,115,0,0.05); }

      .graph-legend { display: flex; gap: 16px; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; }
      .legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted); }
      .legend-item .dot { width: 10px; height: 10px; border-radius: 50%; }
      .dot.model { background: #2196F3; }
      .dot.service { background: #4CAF50; }
      .dot.module { background: #9C27B0; }
      
      .deps-list h4 { margin: 0 0 16px 0; font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
      .dep-edge { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; margin-bottom: 8px; transition: all 0.2s; flex-wrap: wrap; }
      .edge-from { font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-secondary); }
      .edge-arrow { color: var(--accent-orange); font-weight: bold; }
      .edge-to { font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-secondary); overflow-wrap: anywhere; word-break: break-word; }
      .edge-type { margin-left: auto; font-size: 0.68rem; color: var(--text-muted); padding: 1px 6px; background: rgba(255,255,255,0.05); border-radius: 4px; text-transform: uppercase; }
      .callgraph-entry { white-space: normal; overflow-wrap: anywhere; word-break: break-word; }

      @media (max-width: 1200px) {
        .deps-view { grid-template-columns: 1fr; }
        .intel-search { max-width: 100%; width: 100%; }
      }
      
      .symbols-list { display: flex; flex-direction: column; gap: 8px; max-width: 900px; }
      .symbol-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; }
      .symbol-icon { font-size: 1.2rem; }
      .symbol-info { flex: 1; }
      .symbol-name { display: block; font-family: var(--font-mono); font-weight: 600; font-size: 0.85rem; color: var(--text-primary); }
      .symbol-location { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
      .symbol-type { font-size: 0.68rem; text-transform: uppercase; }
      
      .impact-empty { text-align: center; padding: 80px 20px; background: rgba(0,0,0,0.1); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.05); max-width: 600px; margin: 20px auto; }
      .impact-empty .empty-icon { font-size: 3.5rem; margin-bottom: 12px; }
      .impact-view { max-width: 800px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; padding: 24px; }
      .impact-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .impact-risk { padding: 4px 12px; border-radius: 12px; font-weight: 700; font-size: 0.72rem; border: 1px solid; }
      .impact-risk.risk-low { background: rgba(76,175,80,0.1); color: #4CAF50; border-color: rgba(76,175,80,0.2); }
      .impact-risk.risk-medium { background: rgba(255,152,0,0.1); color: #ff9800; border-color: rgba(255,152,0,0.2); }
      .impact-risk.risk-high { background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.2); }
      
      .impact-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
      .impact-stat { text-align: center; padding: 16px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; }
      .impact-stat .stat-num { display: block; font-size: 2.2rem; font-weight: 700; color: var(--accent-orange); font-family: var(--font-mono); }
      .impact-stat .stat-label { color: var(--text-muted); font-size: 0.75rem; margin-top: 4px; text-transform: uppercase; font-weight: 600; }
      .impact-files h4 { margin: 0 0 12px 0; font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
      .affected-file { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(239,68,68,0.04); border: 1px solid rgba(239,68,68,0.12); border-left: 3px solid #ef4444; border-radius: 6px; margin-bottom: 6px; }
      .affected-file .file-path { font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-secondary); }
    `;
    document.head.appendChild(style);
  }

  window.initIntelligence = function () {
    window.renderIntelligence();
  };

  console.warn('%c[CoNinja] Intelligence loaded', 'color:#ff7300;font-weight:bold;');
})();
