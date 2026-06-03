// ============================================================
// SHADOW MEMORY VAULT — Vector, Graph & Retention Engine
// ============================================================

window.initMemory = function () {
  const container = document.getElementById('memory-container');
  if (!container) return;

  container.innerHTML = `
    <!-- STATS ROW -->
    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px;">
      <div class="glass-card" style="padding:16px 20px; text-align:center; border:1px solid rgba(255,115,0,0.2);">
        <div style="font-size:1.8rem; font-weight:800; color:var(--accent-orange);" id="memory-stat-total">${(window.state.memory && window.state.memory.totalEntries) || 1247}</div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px; text-transform:uppercase; letter-spacing:0.08em;">Total Entries</div>
        <div style="font-size:0.68rem; color:var(--accent-green); margin-top:6px;">↑ 12 today</div>
      </div>
      <div class="glass-card" style="padding:16px 20px; text-align:center; border:1px solid rgba(0,188,212,0.2);">
        <div style="font-size:1.8rem; font-weight:800; color:var(--accent-cyan);" id="memory-stat-indexed">${(window.state.memory && window.state.memory.indexedFiles) || 48}</div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px; text-transform:uppercase; letter-spacing:0.08em;">Indexed Files</div>
        <div style="font-size:0.68rem; color:var(--text-muted); margin-top:6px;">Chroma Vector DB</div>
      </div>
      <div class="glass-card" style="padding:16px 20px; text-align:center; border:1px solid rgba(156,39,176,0.2);">
        <div style="font-size:1.8rem; font-weight:800; color:var(--accent-purple);" id="memory-stat-pinned">${window.state.memory && window.state.memory.pinnedEntries ? window.state.memory.pinnedEntries.length : 2}</div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px; text-transform:uppercase; letter-spacing:0.08em;">Pinned Entries</div>
        <div style="font-size:0.68rem; color:var(--text-muted); margin-top:6px;">Critical knowledge</div>
      </div>
      <div class="glass-card" style="padding:16px 20px; text-align:center; border:1px solid rgba(76,175,80,0.2);">
        <div style="font-size:1.8rem; font-weight:800; color:var(--accent-green);" id="memory-stat-rules">${window.state.memory && window.state.memory.retentionRules ? window.state.memory.retentionRules.length : 3}</div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px; text-transform:uppercase; letter-spacing:0.08em;">Retention Rules</div>
        <div style="font-size:0.68rem; color:var(--text-muted); margin-top:6px;">Active policies</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 380px; gap:20px; align-items:start;">
      <div style="display:flex; flex-direction:column; gap:16px;">

        <!-- MEMORY SEARCH -->
        <div class="glass-card" style="padding:20px 24px;">
          <div class="panel-header" style="margin-bottom:16px;">
            <span>${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''}</span>
            <span style="font-weight:700; font-size:0.88rem; letter-spacing:0.05em;">VECTOR MEMORY SEARCH</span>
          </div>
          <div style="display:flex; gap:10px; margin-bottom:16px;">
            <input id="memory-search-input" class="form-input" placeholder="Search memory scrolls... e.g. 'authentication architecture'" style="flex:1;">
            <button id="memory-search-btn" class="btn btn-primary" style="flex-shrink:0;">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} Search</button>
          </div>
          <div id="memory-search-results"></div>
        </div>

        <!-- PINNED ENTRIES -->
        <div class="glass-card" style="padding:20px 24px;">
          <div class="panel-header" style="margin-bottom:16px;">
            <span>${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''}</span>
            <span style="font-weight:700; font-size:0.88rem; letter-spacing:0.05em;">PINNED MEMORY ENTRIES</span>
            <span class="badge badge-purple" style="margin-left:auto; font-size:0.68rem;" id="pinned-count-badge">${window.state.memory && window.state.memory.pinnedEntries ? window.state.memory.pinnedEntries.length : 0}</span>
          </div>
          <div id="memory-pinned-list"></div>
        </div>

        <!-- IMPACT ANALYSIS -->
        <div class="glass-card" style="padding:20px 24px;">
          <div class="panel-header" style="margin-bottom:16px;">
            <span>${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''}</span>
            <span style="font-weight:700; font-size:0.88rem; letter-spacing:0.05em;">IMPACT ANALYSIS TOOL</span>
          </div>
          <div style="margin-bottom:12px;">
            <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:6px;">Describe the code change:</label>
            <textarea id="memory-impact-input" class="form-input" rows="3" style="width:100%; resize:vertical;"
              placeholder="e.g. Replace Nodemailer with SendGrid for email delivery..."></textarea>
          </div>
          <button id="memory-impact-btn" class="btn btn-outline" style="margin-bottom:16px;">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} Analyze Impact</button>
          <div id="memory-impact-results"></div>
        </div>

        <!-- RETENTION RULES -->
        <div class="glass-card" style="padding:20px 24px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
            <div class="panel-header" style="margin:0;">
              <span>${window.ninjaIcons ? window.ninjaIcons.get('hourglass') : ''}</span>
              <span style="font-weight:700; font-size:0.88rem; letter-spacing:0.05em;">RETENTION POLICIES</span>
            </div>
            <button id="memory-add-rule-btn" class="btn btn-outline btn-sm" style="font-size:0.72rem;">+ Add Rule</button>
          </div>
          <div id="memory-retention-list"></div>
        </div>

      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">

        <!-- VECTOR SETTINGS -->
        <div class="glass-card" style="padding:20px 24px;">
          <div class="panel-header" style="margin-bottom:16px;">
            <span>${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''}</span>
            <span style="font-weight:700; font-size:0.88rem; letter-spacing:0.05em;">VECTOR SETTINGS</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div class="setting-row">
              <label style="font-size:0.78rem; color:var(--text-muted);">Engine</label>
              <select class="form-select" id="mem-vs-engine" style="font-size:0.78rem;">
                <option value="chroma" ${window.state.memory?.vectorSettings?.engine === 'chroma' ? 'selected' : ''}>Chroma</option>
                <option value="pinecone" ${window.state.memory?.vectorSettings?.engine === 'pinecone' ? 'selected' : ''}>Pinecone</option>
                <option value="weaviate">Weaviate</option>
                <option value="qdrant">Qdrant</option>
              </select>
            </div>
            <div class="setting-row">
              <label style="font-size:0.78rem; color:var(--text-muted);">Embedding Model</label>
              <select class="form-select" id="mem-vs-model" style="font-size:0.78rem;">
                <option value="all-minilm" ${window.state.memory?.vectorSettings?.embeddingModel === 'all-minilm' ? 'selected' : ''}>all-MiniLM-L6-v2</option>
                <option value="ada-002">text-embedding-ada-002</option>
                <option value="e5-large">e5-large-v2</option>
              </select>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <label style="font-size:0.75rem; color:var(--text-muted);">Chunk Size</label>
                <span style="font-size:0.75rem; color:var(--accent-orange);" id="mem-chunk-val">${window.state.memory?.vectorSettings?.chunkSize || 500}</span>
              </div>
              <input type="range" class="slider" id="mem-chunk-slider" min="100" max="2000" step="50" value="${window.state.memory?.vectorSettings?.chunkSize || 500}">
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <label style="font-size:0.75rem; color:var(--text-muted);">Chunk Overlap</label>
                <span style="font-size:0.75rem; color:var(--accent-orange);" id="mem-overlap-val">${window.state.memory?.vectorSettings?.chunkOverlap || 50}</span>
              </div>
              <input type="range" class="slider" id="mem-overlap-slider" min="0" max="500" step="10" value="${window.state.memory?.vectorSettings?.chunkOverlap || 50}">
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <label style="font-size:0.75rem; color:var(--text-muted);">Similarity Threshold</label>
                <span style="font-size:0.75rem; color:var(--accent-orange);" id="mem-thresh-val">${window.state.memory?.vectorSettings?.similarityThreshold || 0.75}</span>
              </div>
              <input type="range" class="slider" id="mem-thresh-slider" min="0" max="1" step="0.05" value="${window.state.memory?.vectorSettings?.similarityThreshold || 0.75}">
            </div>
            <button class="btn btn-outline btn-sm" onclick="_saveVectorSettings()" style="font-size:0.72rem; margin-top:4px;">Save Vector Settings</button>
          </div>
        </div>

        <!-- GRAPH SETTINGS -->
        <div class="glass-card" style="padding:20px 24px;">
          <div class="panel-header" style="margin-bottom:16px;">
            <span>${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''}</span>
            <span style="font-weight:700; font-size:0.88rem; letter-spacing:0.05em;">GRAPH SETTINGS</span>
          </div>
          <div style="margin-bottom:12px;">
            <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:8px;">Node Types</label>
            <div style="display:flex; flex-wrap:wrap; gap:6px;" id="mem-graph-node-types">
              ${['file', 'function', 'class', 'module', 'schema', 'test', 'config']
                .map((nt) => {
                  const active = (
                    window.state.memory?.graphSettings?.nodeTypes || [
                      'file',
                      'function',
                      'class',
                      'module',
                      'schema',
                    ]
                  ).includes(nt);
                  return `<label style="display:flex; align-items:center; gap:4px; font-size:0.75rem; cursor:pointer;">
                  <input type="checkbox" data-node-type="${nt}" ${active ? 'checked' : ''} style="accent-color:var(--accent-orange);">
                  ${nt}
                </label>`;
                })
                .join('')}
            </div>
          </div>
          <div style="margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <label style="font-size:0.75rem; color:var(--text-muted);">Traversal Depth</label>
              <span style="font-size:0.75rem; color:var(--accent-orange);" id="mem-depth-val">${window.state.memory?.graphSettings?.maxDepth || 5}</span>
            </div>
            <input type="range" class="slider" id="mem-depth-slider" min="1" max="10" step="1" value="${window.state.memory?.graphSettings?.maxDepth || 5}">
          </div>
          <div class="setting-row" style="margin-bottom:12px;">
            <label style="font-size:0.75rem; color:var(--text-muted);">Traversal Mode</label>
            <select class="form-select" id="mem-traversal-mode" style="font-size:0.78rem;">
              <option value="bfs" ${window.state.memory?.graphSettings?.traversalMode === 'bfs' ? 'selected' : ''}>BFS (Breadth-first)</option>
              <option value="dfs" ${window.state.memory?.graphSettings?.traversalMode === 'dfs' ? 'selected' : ''}>DFS (Depth-first)</option>
              <option value="dijkstra">Dijkstra (Weighted)</option>
            </select>
          </div>
          <button class="btn btn-outline btn-sm" onclick="_saveGraphSettings()" style="font-size:0.72rem;">Save Graph Settings</button>
        </div>

        <!-- EXPORT / IMPORT -->
        <div class="glass-card" style="padding:20px 24px;">
          <div class="panel-header" style="margin-bottom:16px;">
            <span>${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''}</span>
            <span style="font-weight:700; font-size:0.88rem; letter-spacing:0.05em;">EXPORT / IMPORT</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <button class="btn btn-primary btn-sm" onclick="_memoryExport()" style="width:100%;">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} Export Memory Vault</button>
            <div>
              <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:6px;">Import Memory Archive</label>
              <input type="file" id="memory-import-file" accept=".json,.zip" style="font-size:0.75rem; color:var(--text-secondary); width:100%;">
            </div>
            <button class="btn btn-outline btn-sm" onclick="_memoryImport()" style="width:100%;">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} Import Vault</button>
          </div>
        </div>

      </div>
    </div>
  `;

  window.renderMemory();
  _wireMemoryEvents();
};

window.renderMemory = function () {
  const list = document.getElementById('memory-pinned-list');
  if (!list) {
    window.initMemory();
    return;
  }
  _renderPinnedEntries();
  _renderRetentionRules();
};

// ── Pinned Entries ─────────────────────────────────────────────

function _renderPinnedEntries() {
  const list = document.getElementById('memory-pinned-list');
  const badge = document.getElementById('pinned-count-badge');
  if (!list) return;

  const entries = (window.state.memory && window.state.memory.pinnedEntries) || [];
  if (badge) badge.textContent = entries.length;

  const pinnedStat = document.getElementById('memory-stat-pinned');
  if (pinnedStat) pinnedStat.textContent = entries.length;

  if (entries.length === 0) {
    list.innerHTML =
      '<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding:16px 0;">No pinned memory entries.</div>';
    return;
  }

  list.innerHTML = entries
    .map(
      (entry) => `
    <div class="memory-pin-card" style="
      padding:14px 16px; border-radius:8px; margin-bottom:10px;
      background:rgba(156,39,176,0.06); border:1px solid rgba(156,39,176,0.2);
      transition:all 0.2s;
    ">
      <div style="font-size:0.83rem; color:var(--text-primary); line-height:1.5; margin-bottom:8px;">${entry.content}</div>
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
        <div style="display:flex; gap:4px; flex-wrap:wrap; align-items:center;">
          ${(entry.tags || []).map((t) => `<span class="badge badge-purple" style="font-size:0.65rem;">${t}</span>`).join('')}
          <span style="font-size:0.68rem; color:var(--text-muted); margin-left:4px;">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} ${entry.created || '—'}</span>
        </div>
        <button class="btn btn-outline btn-sm memory-unpin-btn" data-id="${entry.id}"
          style="font-size:0.68rem; padding:2px 8px; color:#ef4444; border-color:rgba(239,68,68,0.3);">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} Unpin</button>
      </div>
    </div>
  `,
    )
    .join('');

  list.querySelectorAll('.memory-unpin-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (window.state.memory && window.state.memory.pinnedEntries) {
        window.state.memory.pinnedEntries = window.state.memory.pinnedEntries.filter(
          (e) => e.id !== id,
        );
        window.addLog('system', 'info', 'Memory entry unpinned.');
        _renderPinnedEntries();
      }
    });
  });
}

// ── Search ─────────────────────────────────────────────────────

function _runMemorySearch() {
  const query = (document.getElementById('memory-search-input') || {}).value?.trim();
  if (!query) return;

  const resultsEl = document.getElementById('memory-search-results');
  if (!resultsEl) return;

  resultsEl.innerHTML = `<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding:12px;">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} Searching vector space...</div>`;

  setTimeout(() => {
    const mockResults = [
      {
        id: 'sr1',
        content: `Authentication architecture: JWT tokens validated via RS256 key pair. Refresh token stored in httpOnly cookie. Related to query: "${query}"`,
        relevance: 94,
        source: 'src/utils/auth.ts',
        tags: ['#auth', '#security'],
      },
      {
        id: 'sr2',
        content:
          'PostgreSQL schema decisions. Primary key strategy: UUID v4 for user entities. Cascade deletes enabled on task → subtask relations.',
        relevance: 78,
        source: 'docs/db-schema.md',
        tags: ['#db', '#architecture'],
      },
      {
        id: 'sr3',
        content:
          'Email service Nodemailer configuration. SMTP transport with TLS on port 1025 for local dev. Production uses SendGrid adapter.',
        relevance: 61,
        source: 'src/services/email.ts',
        tags: ['#email', '#backend'],
      },
    ];

    resultsEl.innerHTML = mockResults
      .map(
        (r) => `
      <div style="padding:12px 14px; border-radius:8px; margin-bottom:8px; background:rgba(255,115,0,0.05); border:1px solid rgba(255,115,0,0.15);">
        <div style="font-size:0.82rem; color:var(--text-primary); line-height:1.5; margin-bottom:8px;">${r.content}</div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap;">
          <div style="flex:1; min-width:120px;">
            <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
              <div style="height:100%; width:${r.relevance}%; background:linear-gradient(90deg, var(--accent-orange), #ffb300); border-radius:4px;"></div>
            </div>
            <div style="font-size:0.65rem; color:var(--accent-orange); margin-top:3px;">Relevance: ${r.relevance}%</div>
          </div>
          <span style="font-size:0.68rem; color:var(--accent-cyan); font-family:var(--font-mono);">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} ${r.source}</span>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            ${(r.tags || []).map((t) => `<span class="badge badge-outline" style="font-size:0.62rem;">${t}</span>`).join('')}
          </div>
          <button class="btn btn-outline btn-sm memory-pin-result" data-content="${r.content.replace(/"/g, '"')}" data-source="${r.source}"
            style="font-size:0.65rem; padding:2px 8px;">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} Pin</button>
        </div>
      </div>
    `,
      )
      .join('');

    resultsEl.querySelectorAll('.memory-pin-result').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!window.state.memory.pinnedEntries) window.state.memory.pinnedEntries = [];
        window.state.memory.pinnedEntries.push({
          id: `pin-${Date.now()}`,
          content: btn.dataset.content,
          pinned: true,
          created: new Date().toISOString().split('T')[0],
          tags: ['#search-result'],
        });
        window.addLog('system', 'success', 'Memory entry pinned from search result.');
        _renderPinnedEntries();
        btn.textContent = `${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} Pinned`;
        btn.disabled = true;
      });
    });
  }, 700);
}

// ── Impact Analysis ────────────────────────────────────────────

function _runImpactAnalysis() {
  const input = (document.getElementById('memory-impact-input') || {}).value?.trim();
  if (!input) {
    alert('Describe the code change to analyze.');
    return;
  }

  const resultsEl = document.getElementById('memory-impact-results');
  if (!resultsEl) return;

  resultsEl.innerHTML = `<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding:12px;">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} Analyzing impact on codebase...</div>`;

  setTimeout(() => {
    const riskColors = {
      low: 'var(--accent-green)',
      medium: 'var(--accent-orange)',
      high: '#ef4444',
    };
    const risk = input.length > 80 ? 'high' : input.length > 40 ? 'medium' : 'low';
    const riskBadge = `<span style="font-size:0.75rem; font-weight:700; color:${riskColors[risk]}; background:${riskColors[risk]}22; padding:2px 10px; border-radius:12px; border:1px solid ${riskColors[risk]}55;">${risk.toUpperCase()} RISK</span>`;

    resultsEl.innerHTML = `
      <div style="background:rgba(0,0,0,0.2); border-radius:8px; padding:16px; border:1px solid var(--border-subtle);">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <span style="font-size:0.82rem; font-weight:600;">Impact Report</span>
          ${riskBadge}
        </div>
        <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.6; margin-bottom:12px;">
          Analyzing change: <em style="color:var(--accent-orange);">"${input.substring(0, 80)}${input.length > 80 ? '…' : ''}"</em>
        </div>
        <div style="margin-bottom:10px;">
          <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em;">Affected Files</div>
          <div style="display:flex; flex-direction:column; gap:3px;">
            ${[
              'src/services/email.ts',
              'src/controllers/auth.ts',
              'tests/integration/email.test.ts',
              'src/utils/mailer.ts',
            ]
              .map(
                (f) =>
                  `<div style="font-family:var(--font-mono); font-size:0.72rem; color:var(--accent-cyan); padding:3px 8px; background:rgba(0,188,212,0.06); border-radius:4px;">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} ${f}</div>`,
              )
              .join('')}
          </div>
        </div>
        <div style="display:flex; gap:16px; font-size:0.78rem; color:var(--text-secondary);">
          <div>${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} <strong style="color:var(--text-primary);">3</strong> affected tests</div>
          <div>${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''} <strong style="color:var(--text-primary);">4</strong> affected files</div>
        </div>
      </div>
    `;
  }, 800);
}

// ── Retention Rules ────────────────────────────────────────────

function _renderRetentionRules() {
  const list = document.getElementById('memory-retention-list');
  if (!list) return;

  const rules = (window.state.memory && window.state.memory.retentionRules) || [];
  const statEl = document.getElementById('memory-stat-rules');
  if (statEl) statEl.textContent = rules.length;

  if (rules.length === 0) {
    list.innerHTML =
      '<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding:12px;">No retention rules configured.</div>';
    return;
  }

  const priorityBadge = (p) =>
    ({
      high: 'badge-orange',
      medium: 'badge-warning',
      low: 'badge-outline',
    })[p] || 'badge-outline';

  list.innerHTML = `
    <div style="overflow-x:auto;">
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
        <thead>
          <tr style="border-bottom:1px solid var(--border-subtle);">
            <th style="text-align:left; padding:8px 10px; color:var(--text-muted); font-size:0.72rem; text-transform:uppercase;">Rule</th>
            <th style="text-align:left; padding:8px 10px; color:var(--text-muted); font-size:0.72rem; text-transform:uppercase;">Max Age</th>
            <th style="text-align:left; padding:8px 10px; color:var(--text-muted); font-size:0.72rem; text-transform:uppercase;">Priority</th>
            <th style="text-align:center; padding:8px 10px; color:var(--text-muted); font-size:0.72rem; text-transform:uppercase;">Auto</th>
            <th style="padding:8px 10px;"></th>
          </tr>
        </thead>
        <tbody>
          ${rules
            .map(
              (rule) => `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
              <td style="padding:10px 10px; font-weight:500;">${rule.name}</td>
              <td style="padding:10px 10px; font-family:var(--font-mono); color:var(--accent-cyan);">${rule.maxAge}</td>
              <td style="padding:10px 10px;"><span class="badge ${priorityBadge(rule.priority)}" style="font-size:0.65rem;">${rule.priority}</span></td>
              <td style="padding:10px 10px; text-align:center;">
                <label class="switch" style="transform:scale(0.75); transform-origin:center;">
                  <input type="checkbox" class="retention-auto-toggle" data-id="${rule.id}" ${rule.auto ? 'checked' : ''}>
                  <span class="slider-toggle"></span>
                </label>
              </td>
              <td style="padding:10px 10px; text-align:right;">
                <button class="btn btn-outline btn-sm retention-remove-btn" data-id="${rule.id}"
                  style="font-size:0.65rem; padding:2px 7px; color:#ef4444; border-color:rgba(239,68,68,0.3);">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''}</button>
              </td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  list.querySelectorAll('.retention-auto-toggle').forEach((toggle) => {
    toggle.addEventListener('change', () => {
      const rule = (window.state.memory.retentionRules || []).find(
        (r) => r.id === toggle.dataset.id,
      );
      if (rule) {
        rule.auto = toggle.checked;
        window.addLog(
          'system',
          'info',
          `Retention rule "${rule.name}" auto-mode ${toggle.checked ? 'enabled' : 'disabled'}.`,
        );
      }
    });
  });

  list.querySelectorAll('.retention-remove-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (window.state.memory && window.state.memory.retentionRules) {
        window.state.memory.retentionRules = window.state.memory.retentionRules.filter(
          (r) => r.id !== btn.dataset.id,
        );
        _renderRetentionRules();
        window.addLog('system', 'info', 'Retention rule removed.');
      }
    });
  });
}

// ── Settings Savers ───────────────────────────────────────────

window._saveVectorSettings = function () {
  if (!window.state.memory) return;
  const engine = (document.getElementById('mem-vs-engine') || {}).value;
  const model = (document.getElementById('mem-vs-model') || {}).value;
  const chunk = parseInt((document.getElementById('mem-chunk-slider') || {}).value || 500);
  const overlap = parseInt((document.getElementById('mem-overlap-slider') || {}).value || 50);
  const thresh = parseFloat((document.getElementById('mem-thresh-slider') || {}).value || 0.75);
  window.state.memory.vectorSettings = {
    engine,
    embeddingModel: model,
    chunkSize: chunk,
    chunkOverlap: overlap,
    similarityThreshold: thresh,
  };
  window.addLog('system', 'success', `Vector settings saved. Engine: ${engine}, Model: ${model}`);
  window.showToast && window.showToast('Vector settings saved!', 'success');
};

window._saveGraphSettings = function () {
  if (!window.state.memory) return;
  const checkboxes = document.querySelectorAll('#mem-graph-node-types input[type="checkbox"]');
  const nodeTypes = Array.from(checkboxes)
    .filter((c) => c.checked)
    .map((c) => c.dataset.nodeType);
  const depth = parseInt((document.getElementById('mem-depth-slider') || {}).value || 5);
  const mode = (document.getElementById('mem-traversal-mode') || {}).value;
  window.state.memory.graphSettings = { nodeTypes, maxDepth: depth, traversalMode: mode };
  window.addLog('system', 'success', `Graph settings saved. Depth: ${depth}, Mode: ${mode}`);
  window.showToast && window.showToast('Graph settings saved!', 'success');
};

window._memoryExport = function () {
  window.addLog('system', 'info', 'Memory vault export initiated...');
  setTimeout(() => {
    window.addLog('system', 'success', 'Memory vault exported: coninja-memory-vault.json (2.3 MB)');
    window.showToast && window.showToast('Export complete!', 'success');
  }, 1000);
};

window._memoryImport = function () {
  const fileInput = document.getElementById('memory-import-file');
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    window.addLog('system', 'info', `Importing memory vault: ${fileInput.files[0].name}...`);
    setTimeout(() => {
      window.addLog('system', 'success', `Memory vault imported: ${fileInput.files[0].name}`);
      window.showToast && window.showToast('Import complete!', 'success');
    }, 1200);
  } else {
    alert('Please select a memory vault file to import.');
  }
};

// ── Event Wiring ──────────────────────────────────────────────

function _wireMemoryEvents() {
  const searchBtn = document.getElementById('memory-search-btn');
  if (searchBtn) searchBtn.addEventListener('click', _runMemorySearch);

  const searchInput = document.getElementById('memory-search-input');
  if (searchInput)
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') _runMemorySearch();
    });

  const impactBtn = document.getElementById('memory-impact-btn');
  if (impactBtn) impactBtn.addEventListener('click', _runImpactAnalysis);

  const addRuleBtn = document.getElementById('memory-add-rule-btn');
  if (addRuleBtn)
    addRuleBtn.addEventListener('click', () => {
      if (!window.state.memory.retentionRules) window.state.memory.retentionRules = [];
      window.state.memory.retentionRules.push({
        id: `r${Date.now()}`,
        name: 'Custom Rule',
        maxAge: '14d',
        priority: 'medium',
        auto: true,
      });
      _renderRetentionRules();
      window.addLog('system', 'info', 'New retention rule added.');
    });

  // Slider live updates
  const wireSlider = (sliderId, valId, digits) => {
    const slider = document.getElementById(sliderId);
    const val = document.getElementById(valId);
    if (slider && val)
      slider.addEventListener('input', () => {
        val.textContent = digits ? parseFloat(slider.value).toFixed(digits) : slider.value;
      });
  };
  wireSlider('mem-chunk-slider', 'mem-chunk-val', 0);
  wireSlider('mem-overlap-slider', 'mem-overlap-val', 0);
  wireSlider('mem-thresh-slider', 'mem-thresh-val', 2);
  wireSlider('mem-depth-slider', 'mem-depth-val', 0);
}
