// --- DOJO WORKBENCH WORKSPACE LOGIC ---
window.editorInstance = null;
window.workbenchInitialized = false;
window.terminalLines = [];
window.currentSelectedFile = 'README.md';

// Mock database files for both developer projects
window.projectFiles = {
  taskmaster: {
    'README.md':
      '# coNinja TaskMaster Swarm\n\nActive Mission: Build a real-time marketplace MVP with secure authentication, Nodemailer alerts, and multi-stage Docker deployment.\n\n## Dojo Blueprint Parameters\n*   Primary DB: PostgreSQL\n*   Cache Layer: Redis Cluster\n*   Email Service: Nodemailer / SMTP\n*   Autonomous Level: Advisory Scroll',

    'src/services/email.ts':
      "import nodemailer from 'nodemailer';\n\nexport interface MailOptions {\n  to: string;\n  subject: string;\n  text: string;\n}\n\n// Sensei council approved SMTP local proxy relay\nexport class EmailService {\n  private transporter = nodemailer.createTransport({\n    host: process.env.SMTP_HOST || 'localhost',\n    port: parseInt(process.env.SMTP_PORT || '1025'),\n    secure: false\n  });\n\n  async sendAlert(options: MailOptions): Promise<void> {\n    try {\n      await this.transporter.sendMail({\n        from: '\"coNinja Swarm\" <swarm@coninja.io>',\n        to: options.to,\n        subject: `[Shinobi Alert] ${options.subject}`,\n        text: options.text\n      });\n      console.warn(`[Email Sent] Message dispatched to ${options.to}`);\n    } catch (err) {\n      console.error('Mail dispatch failed:', err);\n    }\n  }\n}",

    'src/models/User.ts':
      "import { Schema, model } from 'mongoose';\n\nexport interface IUser {\n  ninjaName: string;\n  email: string;\n  pwdHash: string;\n  kiRank: string;\n}\n\nconst UserSchema = new Schema<IUser>({\n  ninjaName: { type: String, required: true, unique: true },\n  email: { type: String, required: true, unique: true },\n  pwdHash: { type: String, required: true },\n  kiRank: { type: String, default: 'Genin' }\n});\n\nexport const User = model<IUser>('User', UserSchema);",

    'tests/auth.test.ts':
      "import request from 'supertest';\nimport { app } from '../app';\n\ndescribe('Stealth Credential Integration Checks', () => {\n  it('asserts valid logins pass code gates', async () => {\n    const res = await request(app)\n      .post('/api/auth/login')\n      .send({ email: 'genin@coninja.io', password: 'hash_strength_12' });\n    expect(res.status).toBe(200);\n    expect(res.body.token).toBeDefined();\n  });\n\n  it('throws 401 for unauthorized shadow infiltrations', async () => {\n    const res = await request(app)\n      .post('/api/auth/login')\n      .send({ email: 'spy@samurai.gov', password: 'wrong' });\n    expect(res.status).toBe(401);\n  });\n});",

    'docker-compose.yml':
      'version: \'3.8\'\n\nservices:\n  dojo-server:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      - SMTP_PORT=1025\n      - DB_URI=postgresql://admin:scrolls@db:5432/coninja\n    depends_on:\n      - db\n      - redis\n\n  db:\n    image: postgres:14-alpine\n    environment:\n      POSTGRES_USER: admin\n      POSTGRES_PASSWORD: scrolls\n      POSTGRES_DB: coninja\n    ports:\n      - "5432:5432"\n\n  redis:\n    image: redis:6-alpine\n    ports:\n      - "6379:6379"',
  },
  fitness: {
    'README.md':
      '# coNinja Fitness Sync Swarm\n\nActive Mission: Develop an offline GPS route tracking application with IndexedDB cache buffering and calorie metrics computation.\n\n## Dojo Blueprint Parameters\n*   Local Cache: IndexedDB\n*   Mapping Target: SVG Vector Paths\n*   Sync Mode: Background Web-Worker',

    'src/services/gps.ts':
      'export interface Coordinate {\n  lat: number;\n  lng: number;\n  timestamp: number;\n}\n\nexport class GPSRouteTracker {\n  // Calculates geodesic distance using Haversine formula\n  calculateDistance(p1: Coordinate, p2: Coordinate): number {\n    const R = 6371e3; // Earth radius in meters\n    const phi1 = (p1.lat * Math.PI) / 180;\n    const phi2 = (p2.lat * Math.PI) / 180;\n    const deltaPhi = ((p2.lat - p1.lat) * Math.PI) / 180;\n    const deltaLambda = ((p2.lng - p1.lng) * Math.PI) / 180;\n\n    const a =\n      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +\n      Math.cos(phi1) * Math.cos(phi2) *\n      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);\n    \n    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));\n    return R * c; // distance in meters\n  }\n}',

    'src/models/Workout.ts':
      'export interface IWorkout {\n  id: string;\n  userId: string;\n  startTime: string;\n  route: { lat: number; lng: number }[];\n  distance: number;\n  calories: number;\n  isSynced: boolean;\n}',

    'src/config/indexeddb.ts':
      "export class LocalCacheDB {\n  private dbName = 'coNinjaFitnessCache';\n\n  async initDB(): Promise<IDBDatabase> {\n    return new Promise((resolve, reject) => {\n      const req = indexedDB.open(this.dbName, 1);\n      req.onupgradeneeded = () => {\n        const db = req.result;\n        db.createObjectStore('workouts', { keyPath: 'id' });\n      };\n      req.onsuccess = () => resolve(req.result);\n      req.onerror = () => reject(req.error);\n    });\n  }\n}",

    'tests/route.test.ts':
      "import { GPSRouteTracker } from '../src/services/gps';\n\ndescribe('GPS Geodesic Routing Assertions', () => {\n  const tracker = new GPSRouteTracker();\n\n  it('evaluates distance along coordinates', () => {\n    const p1 = { lat: 35.6895, lng: 139.6917, timestamp: 0 }; // Tokyo\n    const p2 = { lat: 35.6586, lng: 139.7454, timestamp: 300 }; // Tokyo Tower\n    const meters = tracker.calculateDistance(p1, p2);\n    expect(meters).toBeGreaterThan(4000);\n    expect(meters).toBeLessThan(5000);\n  });\n});",
  },
};

window.getActiveProjectKey = function () {
  return window.state.activeProject.toLowerCase().includes('fitness') ? 'fitness' : 'taskmaster';
};

window.initDojoWorkbench = function () {
  if (!window.state.agentLoops) {
    window.state.agentLoops = {};
  }
  // Inject workbench styles

  if (!document.getElementById('cns-workbench-styles')) {
    const style = document.createElement('style');
    style.id = 'cns-workbench-styles';
    style.textContent = `
      .panel-tab-header { overflow-x: auto; scrollbar-width: thin; }
      @media (max-width: 1280px) {
        .workbench-editor-panel { min-width: 0; flex: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  if (window.workbenchInitialized) {
    window.renderFileExplorer();
    window.renderBlueprint();
    window.renderChecklist();
    window.renderBrowserPreview();
    return;
  }

  window.workbenchInitialized = true;

  // Navigation tabs inside the workbench sidebar
  document.querySelectorAll('.workbench-tabs .w-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document
        .querySelectorAll('.workbench-tabs .w-tab')
        .forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const paneId = tab.dataset.wTab;
      document.querySelectorAll('.workbench-tab-content .w-pane-view').forEach((pane) => {
        pane.classList.remove('active');
      });
      document.getElementById(`w-content-${paneId}`).classList.add('active');
    });
  });

  // Start terminal logs
  window.initTerminalLogs();

  // Load Monaco editor instance
  window.initMonacoEditor();

  // Render sub components
  window.renderFileExplorer();
  window.renderBlueprint();
  window.renderChecklist();
  window.renderBrowserPreview();

  // Initialize resizer and collapse toggle for sidebar
  window.initSidebarResizer();

  // Toggle between Editor and Browser panels
  const workspaceContainer = document.getElementById('workbench-workspace-container');
  const showBrowserBtn = document.getElementById('workbench-show-browser-btn');
  const showEditorBtn = document.getElementById('workbench-show-editor-btn');

  if (workspaceContainer && showBrowserBtn && showEditorBtn) {
    showBrowserBtn.addEventListener('click', () => {
      workspaceContainer.classList.remove('view-editor');
      workspaceContainer.classList.add('view-browser');
    });

    showEditorBtn.addEventListener('click', () => {
      workspaceContainer.classList.remove('view-browser');
      workspaceContainer.classList.add('view-editor');
      if (window.editorInstance) {
        window.editorInstance.layout();
        setTimeout(() => {
          window.editorInstance.layout();
        }, 150);
      }
    });
  }
};

window.initSidebarResizer = function () {
  const sidebar = document.querySelector('.workbench-sidebar');
  const resizer = document.getElementById('workbench-sidebar-resizer');
  const collapseBtn = document.getElementById('sidebar-collapse-btn');

  if (!sidebar || !resizer || !collapseBtn) return;

  let isDragging = false;

  // 1. Drag to resize logic
  resizer.addEventListener('mousedown', (e) => {
    // Avoid triggering drag when clicking the collapse button inside the resizer
    if (e.target === collapseBtn) return;

    isDragging = true;
    resizer.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const startX = e.clientX;
    const startWidth = sidebar.getBoundingClientRect().width;

    function onMouseMove(e) {
      if (!isDragging) return;
      const currentX = e.clientX;
      const deltaX = currentX - startX;
      let newWidth = startWidth + deltaX;

      // Min/Max bounds
      if (newWidth < 150) {
        // Auto-collapse if dragged too small
        sidebar.classList.add('collapsed');
        newWidth = 0;
      } else {
        sidebar.classList.remove('collapsed');
        if (newWidth > 500) newWidth = 500;
      }

      sidebar.style.width = `${newWidth}px`;
    }

    function onMouseUp() {
      isDragging = false;
      resizer.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (window.editorInstance) {
        window.editorInstance.layout();
      }
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  // 2. Click to collapse logic
  collapseBtn.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    if (isCollapsed) {
      sidebar.style.width = '0px';
    } else {
      sidebar.style.width = '280px'; // Default size
    }
    if (window.editorInstance) {
      setTimeout(() => {
        window.editorInstance.layout();
      }, 100);
      setTimeout(() => {
        window.editorInstance.layout();
      }, 350);
    }
  });
};

window.initMonacoEditor = function () {
  if (typeof require === 'undefined') {
    setTimeout(window.initMonacoEditor, 100);
    return;
  }

  require.config({
    paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' },
  });
  require(['vs/editor/editor.main'], function () {
    // Define the custom ninja stealth theme!
    monaco.editor.defineTheme('coNinja-stealth', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'f8fafc', background: '0c0806' },
        { token: 'comment', foreground: '5e5248', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7300', fontStyle: 'bold' },
        { token: 'string', foreground: 'ffb300' },
        { token: 'number', foreground: 'ff9d4d' },
        { token: 'regexp', foreground: 'ffa04d' },
        { token: 'type', foreground: '38bdf8' },
        { token: 'class', foreground: '38bdf8', fontStyle: 'bold' },
        { token: 'function', foreground: 'ff9d4d' },
        { token: 'variable', foreground: 'cbd5e1' },
      ],
      colors: {
        'editor.background': '#0c0806',
        'editor.foreground': '#f8fafc',
        'editor.lineHighlightBackground': '#150d0a',
        'editorCursor.foreground': '#ff7300',
        'editor.selectionBackground': '#ff730033',
        'editor.inactiveSelectionBackground': '#ff73001a',
        'editorLineNumber.foreground': '#5e5248',
        'editorLineNumber.activeForeground': '#ff7300',
      },
    });

    window.editorInstance = monaco.editor.create(
      document.getElementById('monaco-editor-container'),
      {
        value: '',
        language: 'markdown',
        theme: 'coNinja-stealth',
        automaticLayout: true,
        readOnly: true,
        fontFamily: 'JetBrains Mono',
        fontSize: 12,
        minimap: { enabled: false },
      },
    );

    window.loadSelectedFile();
  });
};

window.loadSelectedFile = function () {
  if (!window.editorInstance) return;

  const projectKey = window.getActiveProjectKey();
  const files = window.projectFiles[projectKey];
  const fileContent = files[window.currentSelectedFile] || '';

  // Infer language
  let lang = 'javascript';
  if (window.currentSelectedFile.endsWith('.ts')) lang = 'typescript';
  else if (window.currentSelectedFile.endsWith('.md')) lang = 'markdown';
  else if (window.currentSelectedFile.endsWith('.yml')) lang = 'yaml';

  const model = monaco.editor.createModel(fileContent, lang);
  window.editorInstance.setModel(model);

  document.getElementById('active-file-path').innerText =
    `~/dojo/${projectKey}/${window.currentSelectedFile}`;
};

window.renderFileExplorer = function () {
  const explorer = document.getElementById('workbench-file-tree');
  explorer.innerHTML = '';

  const projectKey = window.getActiveProjectKey();
  let files = Object.keys(window.projectFiles[projectKey]);
  if (
    projectKey === 'taskmaster' &&
    window.state &&
    window.state.repository &&
    Array.isArray(window.state.repository.fileTree)
  ) {
    const flattenTree = (nodes, base = '') =>
      nodes.flatMap((node) => {
        const path = base ? `${base}/${node.path.split('/').pop()}` : node.path;
        if (node.type === 'file') return [path];
        if (node.children) return flattenTree(node.children, path);
        return [];
      });
    const repoFiles = flattenTree(window.state.repository.fileTree).filter(Boolean);
    if (repoFiles.length) files = [...new Set(['README.md', ...repoFiles])];
  }

  files.forEach((filename) => {
    const isActive = filename === window.currentSelectedFile;
    const item = document.createElement('div');
    item.className = `file-tree-item ${isActive ? 'active' : ''}`;

    // Choose icon
    let iconName = 'file';
    if (filename.endsWith('.js') || filename.endsWith('.ts')) iconName = 'code';
    else if (filename.endsWith('.json')) iconName = 'file';
    else if (filename.endsWith('.md')) iconName = 'documentation';
    else if (filename.endsWith('.css')) iconName = 'gear';
    else if (filename.endsWith('.html')) iconName = 'browser';
    else if (filename.endsWith('.yml') || filename.endsWith('.yaml')) iconName = 'gear';
    else if (filename.toLowerCase().includes('dockerfile')) iconName = 'square';

    const iconSvg = window.ninjaIcons ? window.ninjaIcons.get(iconName) : '⋄';
    item.innerHTML = `<span aria-hidden="true" style="display:inline-flex; align-items:center;">${iconSvg}</span> <span>${filename}</span>`;
    item.addEventListener('click', () => {
      window.currentSelectedFile = filename;
      document.querySelectorAll('.file-tree-item').forEach((el) => el.classList.remove('active'));
      item.classList.add('active');
      window.loadSelectedFile();
    });

    explorer.appendChild(item);
  });
};

window.renderBlueprint = function () {
  const blueprint = document.getElementById('workbench-blueprint-view');
  const projectKey = window.getActiveProjectKey();

  if (projectKey === 'taskmaster') {
    blueprint.innerHTML = `
      <div class="blueprint-viewer">
        <h3>◈️ Mission Blueprint</h3>
        <p>Swarm layout for <strong>TaskMaster Marketplace MVP</strong></p>
        <hr style="border-color:rgba(255,115,0,0.1); margin: 8px 0;">
        <ul>
          <li><strong>Autonomy Permits</strong>: level-1 (advisory scroll) active.</li>
          <li><strong>Provider Target</strong>: Google Gemini 1.5 Pro relays.</li>
          <li><strong>Dojo stack</strong>: pgSQL relations with Nodemailer SMTP.</li>
        </ul>
      </div>
    `;
  } else {
    blueprint.innerHTML = `
      <div class="blueprint-viewer">
        <h3>◈️ Mission Blueprint</h3>
        <p>Swarm layout for <strong>GPS Fitness App</strong></p>
        <hr style="border-color:rgba(255,115,0,0.1); margin: 8px 0;">
        <ul>
          <li><strong>Offline Permits</strong>: IndexedDB cache database lock.</li>
          <li><strong>Render Output</strong>: SVG path drawing modules.</li>
          <li><strong>Ki router</strong>: Ollama local chunk models.</li>
        </ul>
      </div>
    `;
  }
};

window.renderChecklist = function () {
  const container = document.getElementById('workbench-checklist-view');
  container.innerHTML = '';

  window.state.tasks.forEach((task) => {
    const item = document.createElement('div');
    const isCompleted = task.status === 'completed';
    const isInProgress = task.status === 'in_progress' || task.status === 'review';

    item.className = `checklist-item ${isCompleted ? 'checked' : isInProgress ? 'in-progress' : ''}`;

    // Checkbox icon
    let boxContent = '';
    if (isCompleted) {
      boxContent =
        '<svg viewBox="0 0 100 100" style="width:10px;height:10px;animation:spin-shuriken 3s infinite linear;" class="shuriken-spin-svg"><path d="M50 0 L58 35 L93 25 L65 48 L93 75 L58 65 L50 100 L42 65 L7 75 L35 48 L7 25 L42 35 Z" fill="currentColor"/></svg>';
    } else if (isInProgress) {
      boxContent =
        '<span class="vortex-spin" style="display:inline-block;animation:spin-shuriken 4s infinite linear;font-size:8px;line-height:1;">◈</span>';
    }

    item.innerHTML = `
      <div class="ninja-checkbox">${boxContent}</div>
      <div class="checklist-item-text">${task.title}</div>
    `;

    item.onclick = () => {
      // Toggle task status
      if (task.status === 'completed') {
        task.status = 'backlog';
        const agent = Object.values(window.state.agents).find((a) => a.currentTaskId === task.id);
        if (agent) {
          agent.status = 'idle';
          agent.currentTaskId = null;
        }
      } else {
        task.status = 'completed';
        window.triggerSmokePuff(task.id);
      }

      // Update panels
      window.renderChecklist();
      window.renderKanban();
      window.renderDecisions();
      window.renderLogs();
      if (window.state.selectedTaskId === task.id) window.selectTask(task.id);
    };

    container.appendChild(item);
  });
};

window.renderBrowserPreview = function () {
  const container = document.getElementById('browser-viewport');
  const projectKey = window.getActiveProjectKey();

  const urlBar = document.getElementById('browser-url-bar');
  urlBar.value = `http://localhost:3000/${projectKey === 'fitness' ? 'fitness-sync' : 'taskmaster-app'}`;

  if (projectKey === 'taskmaster') {
    container.innerHTML = `
      <div class="ninja-browser-preview">
        <div class="preview-navbar">
          <div class="preview-logo">◈ coNinja TaskMaster</div>
          <div class="preview-nav-links">
            <span class="preview-nav-link active">Dashboard</span>
            <span class="preview-nav-link">Swarm</span>
          </div>
        </div>
        <div class="preview-grid">
          <div class="preview-card">
            <span class="preview-card-title">Completed Scrolls</span>
            <span class="preview-card-value orange" id="browser-val-completed">12</span>
          </div>
          <div class="preview-card">
            <span class="preview-card-title">System Focus</span>
            <span class="preview-card-value">91%</span>
          </div>
          <div class="preview-card">
            <span class="preview-card-title">Node Load</span>
            <span class="preview-card-value">0.12s</span>
          </div>
        </div>
        <div class="preview-list">
          <span class="preview-list-title">Active Swarm Activity</span>
          <div class="preview-list-item">
            <span>◈️ Output: Compiled Session serializer</span>
            <span style="color:#ffb300;">100% SUCCESS</span>
          </div>
          <div class="preview-list-item">
            <span>◈ Chunin DevOps: Deploying sandbox container</span>
            <span style="color:#ff7300;">RUNNING</span>
          </div>
        </div>
      </div>
    `;
    const valCompleted = document.getElementById('browser-val-completed');
    if (valCompleted) {
      valCompleted.innerText = window.state.tasks.filter((t) => t.status === 'completed').length;
    }
  } else {
    container.innerHTML = `
      <div class="ninja-browser-preview">
        <div class="preview-navbar">
          <div class="preview-logo">◈ coNinja Fitness Sync</div>
          <div class="preview-nav-links">
            <span class="preview-nav-link active">Route Tracker</span>
            <span class="preview-nav-link">History</span>
          </div>
        </div>
        <div class="fitness-map-preview">
          <svg width="100%" height="100%" viewBox="0 0 400 120" style="position:absolute;top:0;left:0;">
            <path d="M20 100 Q 100 20, 200 80 T 380 40" class="fitness-path-stroke"/>
            <circle cx="20" cy="100" r="5" fill="#ff7300"/>
            <circle cx="380" cy="40" r="5" fill="#FFB300"/>
          </svg>
          <div style="position:absolute;bottom:8px;left:8px;font-size:0.65rem;color:var(--text-secondary);background:rgba(0,0,0,0.6);padding:2px 6px;border-radius:4px;">
            GPS Path coordinates lock (Tokyo Route #7)
          </div>
        </div>
        <div class="preview-grid">
          <div class="preview-card">
            <span class="preview-card-title">Distance Run</span>
            <span class="preview-card-value orange">4.82 km</span>
          </div>
          <div class="preview-card">
            <span class="preview-card-title">IndexedDB Sync Queue</span>
            <span class="preview-card-value">0 items</span>
          </div>
          <div class="preview-card">
            <span class="preview-card-title">Ki Calorie Burn</span>
            <span class="preview-card-value">312 kcal</span>
          </div>
        </div>
      </div>
    `;
  }
};

window.initTerminalLogs = function () {
  const terminal = document.getElementById('workbench-terminal-body');
  if (!terminal) return;

  terminal.innerHTML = '';
  const projectKey = window.getActiveProjectKey();

  if (projectKey === 'taskmaster') {
    window.terminalLines = [
      { type: 'prompt', text: 'shinobi@coninja:~$ npm run dev' },
      { type: 'system', text: '[system] Starting local Swarm watchers on Port 3000...' },
      { type: 'compiler', text: '[compiler] Compiling src/services/email.ts...' },
      { type: 'compiler', text: '[compiler] Compilation complete in 1.4s.' },
      { type: 'system', text: '[system] Loading pgSQL configurations from /config/...' },
      { type: 'test-pass', text: '[test-pass] jest tests/auth.test.ts' },
      { type: 'test-pass', text: '  ◈ asserts credentials login succeeds (14ms)' },
      { type: 'test-pass', text: '  ◈ rejects invalid attempts with 401 code (9ms)' },
      { type: 'system', text: '[system] Watcher status: Listening for file changes...' },
    ];
  } else {
    window.terminalLines = [
      { type: 'prompt', text: 'shinobi@coninja:~$ npm run test' },
      { type: 'system', text: '[system] Commenced test suite validation check...' },
      { type: 'compiler', text: '[compiler] Compiling src/services/gps.ts...' },
      { type: 'compiler', text: '[compiler] Compiling tests/route.test.ts...' },
      { type: 'test-pass', text: '[test-pass] jest tests/route.test.ts' },
      { type: 'test-pass', text: '  ◈ evaluates geodesic route distances (42ms)' },
      { type: 'test-pass', text: '  ◈ validates IndexedDB write operations (18ms)' },
      { type: 'system', text: '[system] All checks successfully satisfied!' },
    ];
  }

  window.terminalLines.forEach((line) => {
    window.appendTerminalLine(line.type, line.text);
  });
};

window.appendTerminalLine = function (type, text) {
  const container = document.getElementById('workbench-terminal-body');
  if (!container) return;

  const div = document.createElement('div');
  div.className = `term-line ${type}`;
  div.innerText = text;
  container.appendChild(div);

  container.scrollTop = container.scrollHeight;
};

// --- SHADOW VEIL FOCUS MODE (TASK 4.3) ---
(function () {
  let dimTimeout = null;
  let isDimmed = false;

  function applyDimming() {
    const targets = document.querySelectorAll('.sidebar, .topbar, .context-panel');
    targets.forEach((el) => {
      el.style.transition = 'opacity 0.5s ease, filter 0.5s ease';
      el.style.opacity = '0.15';
      el.style.filter = 'grayscale(100%)';
    });
    isDimmed = true;
  }

  function revertDimming() {
    if (dimTimeout) {
      clearTimeout(dimTimeout);
      dimTimeout = null;
    }
    if (isDimmed) {
      const targets = document.querySelectorAll('.sidebar, .topbar, .context-panel');
      targets.forEach((el) => {
        el.style.opacity = '';
        el.style.filter = '';
      });
      isDimmed = false;
    }
  }

  function setupListeners() {
    const elements = document.querySelectorAll('.code-view, .multiplexer-terminal');
    elements.forEach((el) => {
      if (el._focusModeWired) return;
      el._focusModeWired = true;

      el.addEventListener('mouseenter', () => {
        revertDimming();
        dimTimeout = setTimeout(applyDimming, 3000);
      });

      el.addEventListener('mouseleave', () => {
        revertDimming();
      });

      el.addEventListener('mousemove', () => {
        if (isDimmed) {
          revertDimming();
          dimTimeout = setTimeout(applyDimming, 3000);
        }
      });
    });
  }

  // Setup initial triggers
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', setupListeners);
  } else {
    setupListeners();
  }

  // Re-bind when new elements are hovered
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest && e.target.closest('.code-view, .multiplexer-terminal');
    if (target && !target._focusModeWired) {
      setupListeners();
    }
  });

  // Revert instantly on mousemove outside targeted coordinates
  window.addEventListener('mousemove', (e) => {
    const inside = e.target.closest && e.target.closest('.code-view, .multiplexer-terminal');
    if (!inside && isDimmed) {
      revertDimming();
    }
  });
})();
