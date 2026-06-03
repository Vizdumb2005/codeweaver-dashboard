// --- SWARM NEURAL KNOWLEDGE GRAPH (Force-Graph Explorer) ---
window.neuralGraphInstance = null;
window.neuralGraphData = {
  nodes: [
    {
      id: 'index.html',
      label: 'index.html',
      group: 'file',
      size: 95,
      summary:
        'Main HTML entry point. Hosts UI panels, sidebars, context panels, wizard dialogs, and dynamic RAG/MCP templates.',
      val: 12,
    },
    {
      id: 'app.js',
      label: 'app.js',
      group: 'file',
      size: 148,
      summary:
        'Core logic controller. Manages state synchronization, time-lapse engine, file loaders, terminal console simulator, and live agent telemetry.',
      val: 18,
    },
    {
      id: 'styles.css',
      label: 'styles.css',
      group: 'file',
      size: 75,
      summary:
        'Global styling rules. Themes dark glassmorphism, responsive stack layouts, neon orange accent colors, and custom scrollbar containers.',
      val: 10,
    },
    {
      id: 'db.sql',
      label: 'db.sql',
      group: 'file',
      size: 4,
      summary:
        'SQLite migrations schema database. Designs relational tables for credentials, logs, and backlog items.',
      val: 5,
    },
    {
      id: 'initExtendedSettings',
      label: 'initExtendedSettings()',
      group: 'func',
      size: 0,
      summary:
        'Binds click and input handlers for advanced settings: Proving grounds, Scroll tokens, Rollbacks, and Dojo sandbox boundaries.',
      val: 4,
    },
    {
      id: 'renderReport',
      label: 'renderReport()',
      group: 'func',
      size: 0,
      summary:
        'Constructs high-fidelity report views including A/B z-scores, CVE package warning alerts, and OWASP audit lists.',
      val: 4,
    },
    {
      id: 'runExtendedSimulationLoop',
      label: 'runExtendedSimulationLoop()',
      group: 'func',
      size: 0,
      summary:
        'Fires periodically to stream parallel console lines, run VRAM swapping telemetry, and update active hardware logs.',
      val: 4,
    },
    {
      id: 't_users',
      label: 'table: users',
      group: 'table',
      size: 0,
      summary:
        'Relational database schema storing system user logins, hashed tokens, and access tiers.',
      val: 6,
    },
    {
      id: 't_backlog',
      label: 'table: backlog',
      group: 'table',
      size: 0,
      summary: 'Tracks engineering goals, tasks descriptions, and current workflow node states.',
      val: 6,
    },
  ],
  links: [
    { source: 'app.js', target: 'index.html' },
    { source: 'styles.css', target: 'index.html' },
    { source: 'app.js', target: 'initExtendedSettings' },
    { source: 'app.js', target: 'renderReport' },
    { source: 'app.js', target: 'runExtendedSimulationLoop' },
    { source: 'db.sql', target: 't_users' },
    { source: 'db.sql', target: 't_backlog' },
    { source: 'app.js', target: 't_backlog' },
  ],
};

window.initNeuralGraph = function () {
  const canvasContainer = document.getElementById('neural-graph-canvas');
  if (!canvasContainer || window.neuralGraphInstance) return;

  if (typeof ForceGraph === 'undefined') {
    setTimeout(window.initNeuralGraph, 200);
    return;
  }

  document.getElementById('btn-graph-reset')?.addEventListener('click', () => {
    if (window.neuralGraphInstance) {
      window.neuralGraphInstance.centerAt(0, 0, 400);
      window.neuralGraphInstance.zoom(2.0, 400);
    }
  });

  document.getElementById('btn-graph-zoom-in')?.addEventListener('click', () => {
    if (window.neuralGraphInstance)
      window.neuralGraphInstance.zoom(window.neuralGraphInstance.zoom() * 1.3, 200);
  });

  document.getElementById('btn-graph-zoom-out')?.addEventListener('click', () => {
    if (window.neuralGraphInstance)
      window.neuralGraphInstance.zoom(window.neuralGraphInstance.zoom() / 1.3, 200);
  });

  document.getElementById('node-detail-close')?.addEventListener('click', () => {
    document.getElementById('node-detail-drawer')?.classList.remove('open');
  });

  const btnOpenEditor = document.getElementById('node-btn-open-editor');
  if (btnOpenEditor) {
    btnOpenEditor.onclick = () => {
      const path = btnOpenEditor.dataset.path;
      if (path) {
        window.switchTab('dojo-workbench');
        window.currentSelectedFile = path;
        window.loadSelectedFile();
        window.renderFileExplorer();
      }
    };
  }

  const width = canvasContainer.clientWidth || 800;
  const height = canvasContainer.clientHeight || 500;

  // Create custom tooltip element for node hover (fixes #038 - raw element ID leak)
  const tooltipEl = document.createElement('div');
  tooltipEl.id = 'neural-tooltip';
  tooltipEl.style.cssText =
    'position:fixed;background:rgba(8,6,5,0.95);color:#e8e0d8;padding:6px 12px;border-radius:6px;font-size:0.75rem;border:1px solid rgba(255,115,0,0.3);pointer-events:none;z-index:9999;font-family:system-ui;display:none;';
  document.body.appendChild(tooltipEl);

  const container = canvasContainer.parentElement;
  if (container && !container.querySelector('.graph-legend-panel')) {
    const legend = document.createElement('div');
    legend.className = 'graph-legend-panel';
    legend.style.cssText =
      'position:absolute; bottom:20px; left:20px; background:rgba(12,8,7,0.85); border:1px solid var(--border-color); padding:12px 16px; border-radius:8px; backdrop-filter:blur(8px); display:flex; flex-direction:column; gap:8px; font-size:0.75rem; font-family:var(--font-sans); color:var(--text-secondary); z-index:999;';
    legend.innerHTML = `
      <h4 style="margin:0 0 4px 0; color:var(--text-primary); font-size:0.8rem; font-weight:600;">Neural Legend</h4>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="width:10px; height:10px; border-radius:50%; background:#ff7300; display:inline-block;"></span>
        <span>Orchestrator</span>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="width:10px; height:10px; border-radius:50%; background:#00bcd4; display:inline-block;"></span>
        <span>Data Flow</span>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="width:10px; height:10px; border-radius:50%; background:#9c27b0; display:inline-block;"></span>
        <span>External Dependency</span>
      </div>
    `;
    container.appendChild(legend);
  }

  window.neuralGraphInstance = ForceGraph()(canvasContainer)
    .width(width)
    .height(height)
    .graphData(window.neuralGraphData)
    .nodeId('id')
    // Custom node label render - prevents ForceGraph default tooltip which leaks raw element IDs (#038)
    .nodeLabel('')
    .onNodeHover((node) => {
      if (node) {
        tooltipEl.textContent = node.label;
        tooltipEl.style.display = 'block';
        document.onmousemove = (e) => {
          tooltipEl.style.left = `${e.clientX + 14}px`;
          tooltipEl.style.top = `${e.clientY - 10}px`;
        };
      } else {
        tooltipEl.style.display = 'none';
        document.onmousemove = null;
      }
    })
    .nodeCanvasObject((node, ctx, globalScale) => {
      const label = node.label;
      const size = node.val ? Math.sqrt(node.val) * 4 : 4;

      // Draw node circle
      let color = '#00bcd4';
      if (node.group === 'file') color = '#ff7300';
      else if (node.group === 'func') color = '#9c27b0';

      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();

      // Draw node border
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();

      // Draw node label
      const fontSize = 11 / globalScale;
      ctx.font = `${fontSize}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
      ctx.fillText(label, node.x, node.y + size + 3);
    })
    .linkColor(() => 'rgba(255, 255, 255, 0.15)')
    .linkWidth(1.5)
    .onNodeClick((node) => {
      const drawer = document.getElementById('node-detail-drawer');
      if (drawer) {
        document.getElementById('node-detail-title').innerText = node.label;
        document.getElementById('node-meta-path').innerText = node.id;
        document.getElementById('node-meta-type').innerText = node.group;
        document.getElementById('node-meta-size').innerText = node.size ? `${node.size} KB` : '—';
        document.getElementById('node-detail-summary').innerText = node.summary;

        const btnOpen = document.getElementById('node-btn-open-editor');
        if (btnOpen) {
          if (node.group === 'file') {
            btnOpen.style.display = 'block';
            btnOpen.dataset.path = node.id;
          } else {
            btnOpen.style.display = 'none';
          }
        }

        drawer.classList.add('open');
      }
    });

  window.neuralGraphInstance.d3Force('charge').strength(-150);
  window.neuralGraphInstance.d3Force('link').distance(70);

  window.neuralGraphInstance.centerAt(0, 0);
  window.neuralGraphInstance.zoom(2.0);
};
