// SHINOBI DEBATE CHAMBER — Multi-Criteria Decision Engine
// ============================================================

window.initDebate = function () {
  const container = document.getElementById('debate-container');
  if (!container) return;

  // Guard against duplicate initialization
  if (container.dataset.debateWired) return;
  container.dataset.debateWired = '1';

  container.innerHTML = `
    <div class="debate-layout" style="display:grid; grid-template-columns:280px 1fr; gap:20px; height:100%; min-height:0;">

      <!-- SIDEBAR: Sessions List -->
      <div class="glass-card debate-sidebar" style="display:flex; flex-direction:column; overflow:hidden; padding:0;">
        <div class="panel-header" style="padding:16px 20px; border-bottom:1px solid var(--border-subtle); display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.1rem;">◈️</span>
            <span style="font-weight:700; font-size:0.9rem; letter-spacing:0.05em;">DEBATE SCROLLS</span>
          </div>
          <button id="debate-new-session-btn" class="btn btn-primary btn-sm" style="font-size:0.7rem; padding:4px 10px;">+ New</button>
        </div>
        <div id="debate-sessions-list" style="flex:1; overflow-y:auto; padding:12px;"></div>
      </div>

      <!-- MAIN: Session Detail -->
      <div id="debate-main-view" style="overflow-y:auto; display:flex; flex-direction:column; gap:16px;">
        <div id="debate-empty-state" class="glass-card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:400px; text-align:center; gap:16px;">
          <div style="font-size:4rem;">◈️</div>
          <div style="font-size:1.2rem; font-weight:700; color:var(--text-primary);">Select a Debate Scroll</div>
          <div style="font-size:0.85rem; color:var(--text-muted); max-width:320px;">Choose a debate session from the sidebar or create a new one to begin multi-criteria decision analysis.</div>
          <button class="btn btn-primary" onclick="document.getElementById('debate-new-session-btn').click()">◈️ Open New Debate</button>
        </div>
        <div id="debate-session-detail" style="display:none; flex-direction:column; gap:16px;"></div>
      </div>
    </div>

    <!-- NEW DEBATE MODAL -->
    <div id="debate-new-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(8px); z-index:9999; align-items:center; justify-content:center;">
      <div class="glass-card" style="width:580px; max-width:95vw; max-height:90vh; overflow-y:auto; padding:28px; border:1px solid rgba(255,115,0,0.3);">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.5rem;">◈️</span>
            <div>
              <div style="font-weight:800; font-size:1.05rem; letter-spacing:0.05em;">NEW DEBATE SCROLL</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Define criteria and alternatives for multi-weighted decision</div>
            </div>
          </div>
          <button id="debate-modal-close" class="btn btn-outline btn-sm">◈</button>
        </div>

        <div style="margin-bottom:16px;">
          <label style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; display:block; margin-bottom:6px;">Debate Title</label>
          <input id="debate-new-title" class="form-input" placeholder="e.g. Auth Strategy: JWT vs Session Cookies" style="width:100%;">
        </div>

        <div style="margin-bottom:16px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <label style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em;">Criteria</label>
            <button id="debate-add-criteria-btn" class="btn btn-outline btn-sm" style="font-size:0.7rem;">+ Add Criterion</button>
          </div>
          <div id="debate-criteria-inputs" style="display:flex; flex-direction:column; gap:8px;"></div>
        </div>

        <div style="margin-bottom:24px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <label style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em;">Alternatives</label>
            <button id="debate-add-alt-btn" class="btn btn-outline btn-sm" style="font-size:0.7rem;">+ Add Alternative</button>
          </div>
          <div id="debate-alt-inputs" style="display:flex; flex-direction:column; gap:8px;"></div>
        </div>

        <div style="display:flex; gap:12px; justify-content:flex-end;">
          <button id="debate-modal-cancel" class="btn btn-outline">Cancel</button>
          <button id="debate-create-btn" class="btn btn-primary">◈️ Open Debate Session</button>
        </div>
      </div>
    </div>
  `;

  window.renderDebate();
  _wireDebateModal();
};

window.renderDebate = function () {
  _renderDebateSessionsList();
  const activeId = window.state.debate.activeSessionId;
  if (activeId) {
    _showDebateSession(activeId);
  } else {
    const emptyEl = document.getElementById('debate-empty-state');
    const detailEl = document.getElementById('debate-session-detail');
    if (emptyEl) emptyEl.style.display = 'flex';
    if (detailEl) detailEl.style.display = 'none';
  }
};

// ── Sessions Sidebar ──────────────────────────────────────────

function _renderDebateSessionsList() {
  const list = document.getElementById('debate-sessions-list');
  if (!list) return;

  const sessions = (window.state.debate && window.state.debate.sessions) || [];
  if (sessions.length === 0) {
    list.innerHTML =
      '<div style="color:var(--text-muted); font-size:0.78rem; text-align:center; padding:24px 0;">No debates yet. Open a new scroll.</div>';
    return;
  }

  list.innerHTML = sessions
    .map((s) => {
      const isActive = s.id === window.state.debate.activeSessionId;
      const statusBadge =
        {
          open: '<span class="badge badge-warning" style="font-size:0.65rem;">Proposed</span>',
          proposed: '<span class="badge badge-warning" style="font-size:0.65rem;">Proposed</span>',
          decided: '<span class="badge badge-success" style="font-size:0.65rem;">Decided</span>',
          approved: '<span class="badge badge-success" style="font-size:0.65rem;">Approved</span>',
          overridden:
            '<span class="badge badge-danger" style="font-size:0.65rem;">Overridden</span>',
          rejected: '<span class="badge badge-danger" style="font-size:0.65rem;">Rejected</span>',
          archived: '<span class="badge badge-outline" style="font-size:0.65rem;">Archived</span>',
        }[s.status] ||
        `<span class="badge badge-outline" style="font-size:0.65rem;">${s.status}</span>`;

      const date = s.createdAt
        ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '';

      return `
      <div class="debate-session-item" data-id="${s.id}" style="
        padding:12px 14px; border-radius:8px; cursor:pointer; margin-bottom:6px;
        border:1px solid ${isActive ? 'rgba(255,115,0,0.4)' : 'var(--border-subtle)'};
        background:${isActive ? 'rgba(255,115,0,0.1)' : 'rgba(255,255,255,0.02)'};
        transition:all 0.2s;
      ">
        <div style="font-size:0.82rem; font-weight:600; color:${isActive ? 'var(--accent-orange)' : 'var(--text-primary)'}; margin-bottom:4px; line-height:1.3;">${s.title}</div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:6px;">
          ${statusBadge}
          <span style="font-size:0.68rem; color:var(--text-muted);">${date}</span>
        </div>
        <div style="font-size:0.68rem; color:var(--text-muted); margin-top:4px;">${s.alternatives ? s.alternatives.length : 0} alternatives · ${s.criteria ? s.criteria.length : 0} criteria</div>
      </div>
    `;
    })
    .join('');

  list.querySelectorAll('.debate-session-item').forEach((item) => {
    item.addEventListener('click', () => {
      window.state.debate.activeSessionId = item.dataset.id;
      window.renderDebate();
    });
    item.addEventListener('mouseenter', () => {
      if (item.dataset.id !== window.state.debate.activeSessionId) {
        item.style.background = 'rgba(255,115,0,0.05)';
        item.style.borderColor = 'rgba(255,115,0,0.2)';
      }
    });
    item.addEventListener('mouseleave', () => {
      if (item.dataset.id !== window.state.debate.activeSessionId) {
        item.style.background = 'rgba(255,255,255,0.02)';
        item.style.borderColor = 'var(--border-subtle)';
      }
    });
  });
}

// ── Session Detail View ───────────────────────────────────────

function _showDebateSession(sessionId) {
  const session = (window.state.debate.sessions || []).find((s) => s.id === sessionId);
  const emptyEl = document.getElementById('debate-empty-state');
  const detailEl = document.getElementById('debate-session-detail');

  if (!session) {
    if (emptyEl) emptyEl.style.display = 'flex';
    if (detailEl) detailEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (!detailEl) return;
  detailEl.style.display = 'flex';

  // Compute weighted totals
  const totalWeights = session.criteria.reduce((s, c) => s + (c.weight || 0), 0);
  const scores = {};
  session.alternatives.forEach((alt) => {
    let total = 0;
    session.criteria.forEach((c) => {
      total += (alt.scores[c.id] || 0) * (c.weight / (totalWeights || 1));
    });
    scores[alt.id] = Math.round(total * 10) / 10;
  });

  const maxScore = Math.max(...Object.values(scores), 1);
  const winnerId = session.winnerId || Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0];

  const statusBadge =
    {
      open: '<span class="badge badge-warning">Proposed</span>',
      proposed: '<span class="badge badge-warning">Proposed</span>',
      decided: '<span class="badge badge-success">Decided</span>',
      approved: '<span class="badge badge-success">Approved</span>',
      overridden: '<span class="badge badge-danger">Overridden</span>',
      rejected: '<span class="badge badge-danger">Rejected</span>',
      archived: '<span class="badge badge-outline">Archived</span>',
    }[session.status] || `<span class="badge badge-outline">${session.status}</span>`;

  detailEl.innerHTML = `
    <!-- HEADER -->
    <div class="glass-card" style="padding:20px 24px;">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap;">
        <div>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <span style="font-size:1.3rem;">◈️</span>
            <h2 style="font-size:1.05rem; font-weight:800; color:var(--text-primary); margin:0; letter-spacing:0.03em;">${session.title}</h2>
          </div>
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            ${statusBadge}
            <span style="font-size:0.75rem; color:var(--text-muted);">Created: ${session.createdAt ? new Date(session.createdAt).toLocaleString() : '—'}</span>
            ${session.decidedAt ? `<span style="font-size:0.75rem; color:var(--text-muted);">Decided: ${new Date(session.decidedAt).toLocaleString()}</span>` : ''}
            ${session.humanOverride ? '<span class="badge badge-warning">Human Override</span>' : ''}
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-shrink:0;">
          ${
            session.status === 'open'
              ? `
            <button class="btn btn-primary btn-sm" onclick="_debateSelectWinner('${session.id}')">◈ Select Winner</button>
            <button class="btn btn-outline btn-sm" onclick="_debateHumanOverride('${session.id}')">◈ Human Override</button>
          `
              : ''
          }
          ${
            session.status !== 'open'
              ? `
            <button class="btn btn-outline btn-sm" onclick="_debateReopen('${session.id}')">◈ Reopen Debate</button>
          `
              : ''
          }
        </div>
      </div>
    </div>

    <!-- CRITERIA MATRIX -->
    <div class="glass-card" style="padding:20px 24px;">
      <div class="panel-header" style="margin-bottom:16px;">
        <span style="font-size:1rem;">◈️</span>
        <span style="font-weight:700; font-size:0.88rem; letter-spacing:0.05em;">WEIGHTED CRITERIA MATRIX</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-subtle);">
              <th style="text-align:left; padding:8px 12px; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em; width:40%;">Criterion</th>
              <th style="text-align:left; padding:8px 12px; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em;">Weight</th>
              <th style="padding:8px 12px; width:60px;"></th>
            </tr>
          </thead>
          <tbody id="debate-criteria-matrix-body">
            ${session.criteria
              .map(
                (c) => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:10px 12px; font-size:0.85rem; font-weight:500;">${c.name}</td>
                <td style="padding:10px 12px;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <input type="range" class="slider" min="0" max="1" step="0.05" value="${c.weight}"
                      style="width:120px;" data-criteria-id="${c.id}" data-session-id="${session.id}" onchange="_updateCriteriaWeight(this)">
                    <span style="font-size:0.82rem; color:var(--accent-orange); min-width:28px;" id="cw-val-${c.id}">${c.weight}</span>
                  </div>
                </td>
                <td style="padding:10px 12px;">
                  <button class="btn btn-outline btn-sm" style="font-size:0.68rem; padding:2px 8px;"
                    onclick="_saveCriteriaWeight('${session.id}', '${c.id}')">Save</button>
                </td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- SCORING MATRIX -->
    <div class="glass-card" style="padding:20px 24px;">
      <div class="panel-header" style="margin-bottom:16px;">
        <span style="font-size:1rem;">◈</span>
        <span style="font-weight:700; font-size:0.88rem; letter-spacing:0.05em;">SCORING MATRIX</span>
        <span style="font-size:0.72rem; color:var(--text-muted); margin-left:auto;">Scores 0–100 per criterion</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-subtle);">
              <th style="text-align:left; padding:8px 12px; color:var(--text-muted); text-transform:uppercase; font-size:0.72rem; letter-spacing:0.06em;">Criterion / Weight</th>
              ${session.alternatives
                .map(
                  (alt) => `
                <th style="text-align:center; padding:8px 12px; color:${alt.id === winnerId ? 'var(--accent-orange)' : 'var(--text-muted)'}; font-size:0.75rem; letter-spacing:0.05em;">
                  ${alt.id === winnerId ? '◈ ' : ''}${alt.title}
                </th>
              `,
                )
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${session.criteria
              .map(
                (c) => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:10px 12px;">
                  <div style="font-weight:500;">${c.name}</div>
                  <div style="font-size:0.68rem; color:var(--text-muted); margin-top:2px;">w=${c.weight}</div>
                </td>
                ${session.alternatives
                  .map((alt) => {
                    const score = alt.scores[c.id] || 0;
                    const weightedScore = Math.round(score * c.weight * 10) / 10;
                    return `
                    <td style="text-align:center; padding:10px 12px;">
                      <div style="font-size:0.9rem; font-weight:700; color:${score >= 80 ? 'var(--accent-green)' : score >= 50 ? 'var(--accent-orange)' : '#ef4444'};">${score}</div>
                      <div style="font-size:0.65rem; color:var(--text-muted);">w.score: ${weightedScore}</div>
                    </td>
                  `;
                  })
                  .join('')}
              </tr>
            `,
              )
              .join('')}
            <tr style="background:rgba(255,115,0,0.06); border-top:2px solid rgba(255,115,0,0.3);">
              <td style="padding:10px 12px; font-weight:700; color:var(--accent-orange); font-size:0.82rem;">WEIGHTED TOTAL</td>
              ${session.alternatives
                .map(
                  (alt) => `
                <td style="text-align:center; padding:10px 12px;">
                  <div style="font-size:1.1rem; font-weight:800; color:${alt.id === winnerId ? 'var(--accent-orange)' : 'var(--text-primary)'};">
                    ${scores[alt.id] || 0}
                  </div>
                  ${alt.id === winnerId ? '<div style="font-size:0.65rem; color:var(--accent-orange); margin-top:2px;">◆ WINNER</div>' : ''}
                </td>
              `,
                )
                .join('')}
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SCORE BAR CHART -->
    <div class="glass-card" style="padding:20px 24px;">
      <div class="panel-header" style="margin-bottom:20px;">
        <span style="font-size:1rem;">◈</span>
        <span style="font-weight:700; font-size:0.88rem; letter-spacing:0.05em;">SCORE VISUALIZATION</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${session.alternatives
          .map((alt) => {
            const score = scores[alt.id] || 0;
            const pct = Math.round((score / maxScore) * 100);
            const isWinner = alt.id === winnerId;
            return `
            <div>
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  ${isWinner ? '<span style="font-size:0.9rem;">◈</span>' : '<span style="font-size:0.9rem; opacity:0.4;">◈️</span>'}
                  <span style="font-size:0.85rem; font-weight:${isWinner ? '700' : '400'}; color:${isWinner ? 'var(--accent-orange)' : 'var(--text-primary)'};">${alt.title}</span>
                </div>
                <span style="font-size:0.88rem; font-weight:700; color:${isWinner ? 'var(--accent-orange)' : 'var(--text-secondary)'};">${score}</span>
              </div>
              <div style="height:10px; background:rgba(255,255,255,0.06); border-radius:8px; overflow:hidden; ${isWinner ? 'box-shadow:0 0 12px rgba(255,115,0,0.4);' : ''}">
                <div style="height:100%; width:${pct}%; border-radius:8px; transition:width 0.8s ease;
                  background:${
                    isWinner
                      ? 'linear-gradient(90deg, var(--accent-orange), #ffb300)'
                      : 'linear-gradient(90deg, rgba(0,188,212,0.5), rgba(0,188,212,0.3))'
                  };
                "></div>
              </div>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>

    <!-- RATIONALE -->
    ${
      session.rationale
        ? `
    <div class="glass-card" style="padding:20px 24px;">
      <div class="panel-header" style="margin-bottom:14px;">
        <span>◈</span>
        <span style="font-weight:700; font-size:0.88rem; letter-spacing:0.05em;">DECISION RATIONALE</span>
      </div>
      <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.7; margin:0;">${session.rationale}</p>
    </div>`
        : ''
    }

    <!-- DISSENTING VIEWS -->
    ${
      session.dissentingViews
        ? `
    <div class="glass-card" style="padding:0;">
      <button class="debate-dissent-toggle" onclick="this.parentElement.querySelector('.dissent-body').style.display = this.parentElement.querySelector('.dissent-body').style.display === 'none' ? 'block' : 'none'"
        style="width:100%; padding:16px 20px; background:transparent; border:none; cursor:pointer; display:flex; align-items:center; gap:8px; color:var(--text-primary);">
        <span>◈️</span>
        <span style="font-weight:700; font-size:0.88rem; letter-spacing:0.05em;">DISSENTING VIEWS</span>
        <span style="margin-left:auto; font-size:0.75rem; color:var(--text-muted);">Click to expand ▼</span>
      </button>
      <div class="dissent-body" style="display:none; padding:16px 20px; border-top:1px solid var(--border-subtle);">
        <p style="font-size:0.83rem; color:var(--text-secondary); line-height:1.7; margin:0;">${session.dissentingViews}</p>
      </div>
    </div>`
        : ''
    }

    <!-- ADR SECTION -->
    <div class="glass-card" style="padding:20px 24px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
        <div class="panel-header" style="margin:0;">
          <span>◈</span>
          <span style="font-weight:700; font-size:0.88rem; letter-spacing:0.05em;">ARCHITECTURE DECISION RECORD</span>
        </div>
        ${
          !session.adrGenerated
            ? `
          <button class="btn btn-purple btn-sm" onclick="_generateDebateADR('${session.id}')">Generate ADR</button>
        `
            : '<span class="badge badge-success">ADR Generated</span>'
        }
      </div>
      ${
        session.adrGenerated
          ? `
        <pre style="background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:8px; padding:16px; font-family:var(--font-mono); font-size:0.75rem; color:var(--accent-cyan); overflow-x:auto; line-height:1.6; white-space:pre-wrap;"># ADR-${session.id}

## ${session.title}

**Status**: ${session.status}
**Date**: ${session.decidedAt || session.createdAt || 'N/A'}

## Decision

${session.rationale || 'No rationale recorded.'}

## Alternatives Considered

${(session.alternatives || []).map((a) => `- **${a.title}** — Weighted Score: ${scores[a.id] || 0}`).join('\n')}

## Outcome

Winner: **${(session.alternatives || []).find((a) => a.id === winnerId)?.title || 'Undecided'}**
        </pre>
      `
          : '<div style="color:var(--text-muted); font-size:0.82rem;">ADR not yet generated. Click "Generate ADR" to produce a structured Architecture Decision Record.</div>'
      }
    </div>
  `;

  // Wire range sliders for live updates
  detailEl.querySelectorAll('input[type="range"][data-criteria-id]').forEach((slider) => {
    slider.addEventListener('input', () => {
      const valEl = document.getElementById(`cw-val-${slider.dataset.criteriaId}`);
      if (valEl) valEl.textContent = slider.value;
    });
  });
}

// ── Helper Action Functions ──────────────────────────────────

window._updateCriteriaWeight = function (slider) {
  const valEl = document.getElementById(`cw-val-${slider.dataset.criteriaId}`);
  if (valEl) valEl.textContent = parseFloat(slider.value).toFixed(2);
};

window._saveCriteriaWeight = function (sessionId, criteriaId) {
  const session = (window.state.debate.sessions || []).find((s) => s.id === sessionId);
  const slider = document.querySelector(`input[data-criteria-id="${criteriaId}"]`);
  if (!session || !slider) return;
  const criterion = session.criteria.find((c) => c.id === criteriaId);
  if (criterion) {
    criterion.weight = parseFloat(slider.value);
    window.addLog(
      'system',
      'info',
      `Debate criterion "${criterion.name}" weight updated to ${criterion.weight}`,
    );
    window.showToast && window.showToast('Weight saved', 'success');
    _showDebateSession(sessionId);
  }
};

window._debateSelectWinner = function (sessionId) {
  const session = (window.state.debate.sessions || []).find((s) => s.id === sessionId);
  if (!session) return;

  // Calculate winner by weighted score
  const totalWeights = session.criteria.reduce((s, c) => s + (c.weight || 0), 0) || 1;
  let bestId = null,
    bestScore = -1;
  session.alternatives.forEach((alt) => {
    let score = 0;
    session.criteria.forEach((c) => {
      score += (alt.scores[c.id] || 0) * (c.weight / totalWeights);
    });
    if (score > bestScore) {
      bestScore = score;
      bestId = alt.id;
    }
  });

  session.winnerId = bestId;
  session.status = 'decided';
  session.decidedAt = new Date().toISOString();
  window.addLog(
    'system',
    'success',
    `Debate "${session.title}" decided. Winner: ${session.alternatives.find((a) => a.id === bestId)?.title}`,
  );
  window.showToast && window.showToast('Winner selected!', 'success');
  window.renderDebate();
};

window._debateHumanOverride = function (sessionId) {
  const session = (window.state.debate.sessions || []).find((s) => s.id === sessionId);
  if (!session) return;
  session.status = 'overridden';
  session.humanOverride = true;
  session.decidedAt = new Date().toISOString();
  window.addLog('system', 'warning', `Human override applied to debate "${session.title}"`);
  window.renderDebate();
};

window._debateReopen = function (sessionId) {
  const session = (window.state.debate.sessions || []).find((s) => s.id === sessionId);
  if (!session) return;
  session.status = 'open';
  session.decidedAt = null;
  window.addLog('system', 'info', `Debate "${session.title}" reopened`);
  window.renderDebate();
};

window._generateDebateADR = function (sessionId) {
  const session = (window.state.debate.sessions || []).find((s) => s.id === sessionId);
  if (!session) return;
  window.addLog('system', 'info', `Generating ADR scroll for debate "${session.title}"...`);
  setTimeout(() => {
    session.adrGenerated = true;
    window.addLog('system', 'success', `ADR scroll generated for "${session.title}"`);
    window.showToast && window.showToast('ADR Generated!', 'success');
    _showDebateSession(sessionId);
  }, 900);
};

// ── Modal Wiring ─────────────────────────────────────────────

function _wireDebateModal() {
  // Guard against duplicate listener wiring
  if (window._debateModalWired) return;
  window._debateModalWired = true;

  const modal = document.getElementById('debate-new-modal');
  const openBtn = document.getElementById('debate-new-session-btn');
  const closeBtn = document.getElementById('debate-modal-close');
  const cancelBtn = document.getElementById('debate-modal-cancel');
  const createBtn = document.getElementById('debate-create-btn');
  const addCriteriaBtn = document.getElementById('debate-add-criteria-btn');
  const addAltBtn = document.getElementById('debate-add-alt-btn');

  if (!modal) return;

  const openModal = () => {
    modal.style.display = 'flex';
    _renderModalCriteria();
    _renderModalAlts();
  };
  const closeModal = () => {
    modal.style.display = 'none';
  };

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Default criteria
  window._modalCriteria = [
    { name: 'Performance', weight: 0.3 },
    { name: 'Cost', weight: 0.25 },
  ];
  window._modalAlts = ['Option A', 'Option B'];

  if (addCriteriaBtn)
    addCriteriaBtn.addEventListener('click', () => {
      window._modalCriteria.push({ name: '', weight: 0.2 });
      _renderModalCriteria();
    });

  if (addAltBtn)
    addAltBtn.addEventListener('click', () => {
      window._modalAlts.push('');
      _renderModalAlts();
    });

  if (createBtn)
    createBtn.addEventListener('click', () => {
      const title = (document.getElementById('debate-new-title') || {}).value?.trim();
      if (!title) {
        alert('Please enter a debate title.');
        return;
      }

      // Collect criteria from inputs
      const criteriaInputs = document.querySelectorAll(
        '#debate-criteria-inputs .debate-criteria-row',
      );
      const criteria = [];
      criteriaInputs.forEach((row, i) => {
        const nameEl = row.querySelector('.crit-name');
        const weightEl = row.querySelector('.crit-weight');
        const name = nameEl ? nameEl.value.trim() : '';
        if (name)
          criteria.push({
            id: `c${Date.now()}-${i}`,
            name,
            weight: parseFloat(weightEl?.value || 0.2),
          });
      });

      const altInputs = document.querySelectorAll('#debate-alt-inputs .debate-alt-row');
      const alternatives = [];
      altInputs.forEach((row, i) => {
        const nameEl = row.querySelector('.alt-name');
        const name = nameEl ? nameEl.value.trim() : '';
        if (name) {
          const scores = {};
          criteria.forEach((c) => {
            scores[c.id] = 50;
          });
          alternatives.push({ id: `a${Date.now()}-${i}`, title: name, scores });
        }
      });

      if (criteria.length < 1) {
        alert('Add at least one criterion.');
        return;
      }
      if (alternatives.length < 2) {
        alert('Add at least 2 alternatives.');
        return;
      }

      const newSession = {
        id: `debate-${Date.now()}`,
        title,
        status: 'open',
        createdAt: new Date().toISOString(),
        decidedAt: null,
        criteria,
        alternatives,
        winnerId: null,
        rationale: '',
        adrGenerated: false,
        dissentingViews: '',
        humanOverride: false,
      };

      if (!window.state.debate.sessions) window.state.debate.sessions = [];
      window.state.debate.sessions.unshift(newSession);
      window.state.debate.activeSessionId = newSession.id;
      window.addLog(
        'system',
        'success',
        `New debate opened: "${title}" with ${alternatives.length} alternatives`,
      );
      closeModal();
      window.renderDebate();
    });
}

function _renderModalCriteria() {
  const container = document.getElementById('debate-criteria-inputs');
  if (!container) return;
  container.innerHTML = (window._modalCriteria || [])
    .map(
      (c, i) => `
    <div class="debate-criteria-row" style="display:flex; gap:8px; align-items:center;">
      <input class="form-input crit-name" value="${c.name}" placeholder="Criterion name" style="flex:1;">
      <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
        <label style="font-size:0.72rem; color:var(--text-muted);">Weight</label>
        <input class="form-input crit-weight" type="number" value="${c.weight}" min="0" max="1" step="0.05" style="width:68px;">
      </div>
      <button style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:0.9rem; padding:4px 6px;"
        onclick="window._modalCriteria.splice(${i},1); _renderModalCriteria();">◈</button>
    </div>
  `,
    )
    .join('');
}

function _renderModalAlts() {
  const container = document.getElementById('debate-alt-inputs');
  if (!container) return;
  container.innerHTML = (window._modalAlts || [])
    .map(
      (a, i) => `
    <div class="debate-alt-row" style="display:flex; gap:8px; align-items:center;">
      <input class="form-input alt-name" value="${a}" placeholder="Alternative name" style="flex:1;">
      <button style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:0.9rem; padding:4px 6px;"
        onclick="window._modalAlts.splice(${i},1); _renderModalAlts();">◈</button>
    </div>
  `,
    )
    .join('');
}
