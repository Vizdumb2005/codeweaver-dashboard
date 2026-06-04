/* ============================================================
   CoNinja Shadow Swarm — Pull Request / Review Center Component
   Git-style code review with diff viewer and inline comments
   ============================================================ */

(function () {
  'use strict';

  const STATUS_ICONS = {
    open: '◈',
    closed: '◈',
    merged: '◈',
  };

  const CI_ICONS = {
    passing: '◈',
    failing: '◈',
    pending: '⏳',
  };

  const REVIEW_ICONS = {
    approved: '◈',
    changes_requested: '◈️',
    commented: '◈',
    pending: '⏳',
  };

  // Mock code diff datasets per PR and file
  const MOCK_DIFFS = {
    42: {
      'src/api/auth.ts': {
        additions: 45,
        deletions: 12,
        lines: [
          { type: 'context', oldNum: 1, newNum: 1, content: 'import express from "express";' },
          { type: 'context', oldNum: 2, newNum: 2, content: 'import bcrypt from "bcrypt";' },
          { type: 'new', oldNum: null, newNum: 3, content: '+import jwt from "jsonwebtoken";' },
          { type: 'context', oldNum: 3, newNum: 4, content: 'const router = express.Router();' },
          {
            type: 'old',
            oldNum: 4,
            newNum: null,
            content: '-router.post("/login", async (req, res) => {',
          },
          {
            type: 'new',
            oldNum: null,
            newNum: 5,
            content: '+router.post("/login", async (req, res) => {',
          },
          {
            type: 'new',
            oldNum: null,
            newNum: 6,
            content: '+  const { username, password } = req.body;',
          },
          {
            type: 'new',
            oldNum: null,
            newNum: 7,
            content: '+  const user = await findUser(username);',
          },
          {
            type: 'new',
            oldNum: null,
            newNum: 8,
            content: '+  if (!user || !(await bcrypt.compare(password, user.hash))) {',
          },
          {
            type: 'new',
            oldNum: null,
            newNum: 9,
            content: '+    return res.status(401).json({ error: "Invalid credentials" });',
          },
          { type: 'new', oldNum: null, newNum: 10, content: '+  }' },
          {
            type: 'new',
            oldNum: null,
            newNum: 11,
            content:
              '+  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });',
          },
          { type: 'new', oldNum: null, newNum: 12, content: '+  return res.json({ token });' },
        ],
      },
      'src/models/User.ts': {
        additions: 12,
        deletions: 2,
        lines: [
          { type: 'context', oldNum: 10, newNum: 10, content: 'export interface User {' },
          { type: 'context', oldNum: 11, newNum: 11, content: '  id: string;' },
          { type: 'context', oldNum: 12, newNum: 12, content: '  username: string;' },
          { type: 'old', oldNum: 13, newNum: null, content: '-  passwordHash: string;' },
          { type: 'new', oldNum: null, newNum: 13, content: '+  hash: string;' },
          { type: 'new', oldNum: null, newNum: 14, content: '+  role: string;' },
          { type: 'context', oldNum: 14, newNum: 15, content: '}' },
        ],
      },
    },
    41: {
      'src/services/email.ts': {
        additions: 89,
        deletions: 0,
        lines: [
          {
            type: 'new',
            oldNum: null,
            newNum: 1,
            content: '+import nodemailer from "nodemailer";',
          },
          { type: 'new', oldNum: null, newNum: 2, content: '+' },
          { type: 'new', oldNum: null, newNum: 3, content: '+export class EmailService {' },
          {
            type: 'new',
            oldNum: null,
            newNum: 4,
            content: '+  private transporter: nodemailer.Transporter;',
          },
          { type: 'new', oldNum: null, newNum: 5, content: '+  constructor(config: any) {' },
          {
            type: 'new',
            oldNum: null,
            newNum: 6,
            content: '+    this.transporter = nodemailer.createTransport(config);',
          },
          { type: 'new', oldNum: null, newNum: 7, content: '+  }' },
          { type: 'new', oldNum: null, newNum: 8, content: '+}' },
        ],
      },
    },
    40: {
      'src/utils/auth.ts': {
        additions: 12,
        deletions: 8,
        lines: [
          {
            type: 'context',
            oldNum: 9,
            newNum: 9,
            content: 'export async function hashPassword(pwd: string) {',
          },
          {
            type: 'old',
            oldNum: 10,
            newNum: null,
            content: '-  const salt = await bcrypt.genSalt(10);',
          },
          { type: 'old', oldNum: 11, newNum: null, content: '-  return bcrypt.hash(pwd, salt);' },
          {
            type: 'new',
            oldNum: null,
            newNum: 10,
            content: '+  // Enforce secure rounds as per OWASP guidelines',
          },
          { type: 'new', oldNum: null, newNum: 11, content: '+  return bcrypt.hash(pwd, 12);' },
        ],
      },
    },
  };

  /* ── Render PR Center ───────────────────────────────────── */
  const _renderPullRequests = function () {
    const container = document.getElementById('pull-requests-container');
    if (!container) return;

    const prState = window.state.pullRequests;
    const selectedPR = prState.list.find((p) => p.id === prState.selectedPR);
    const compareModalHTML = prState.compareBranch
      ? renderBranchCompareModal(prState.compareBranch)
      : '';

    container.innerHTML = `
      <div class="pr-layout">
        ${!selectedPR ? renderPRListView(prState) : renderPRDetailView(selectedPR)}
      </div>
      ${compareModalHTML}
    `;

    attachPRListeners();
    injectPRStyles();
  };

  function renderBranchCompareModal(branchName) {
    const repoState = window.state.repository;
    const branch = repoState.branches.find((b) => b.name === branchName);
    if (!branch) return '';
    return `
      <div id="branch-compare-modal" class="modal-overlay" style="display: flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); backdrop-filter:blur(5px); justify-content:center; align-items:center; z-index:9999;">
        <div class="modal-card" style="max-width:550px; width:90%; padding: 24px; background:rgba(20, 16, 14, 0.95); border:1px solid var(--accent-orange); border-radius:16px; box-shadow: 0 24px 64px rgba(0,0,0,0.6);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:10px;">
            <h3 style="margin:0; font-size:1.1rem; color:var(--text-primary); display:flex; align-items:center; gap:8px;">◈ <span>Branch Comparison</span></h3>
            <button id="btn-close-compare" style="background:transparent; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;">&times;</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="display:flex; align-items:center; justify-content:space-around; background:rgba(255,255,255,0.02); padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
              <div style="text-align:center;">
                <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Source Branch</span>
                <div style="font-family:var(--font-mono); font-weight:600; color:var(--accent-orange); font-size:0.9rem; margin-top:4px;">${branch.name}</div>
              </div>
              <div style="font-size:1.2rem; color:var(--text-muted);">⇆</div>
              <div style="text-align:center;">
                <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Base Branch</span>
                <div style="font-family:var(--font-mono); font-weight:600; color:var(--accent-cyan); font-size:0.9rem; margin-top:4px;">main</div>
              </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div class="glass-card" style="padding:10px; border:1px solid rgba(255,255,255,0.04); border-radius:8px; text-align:center;">
                <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Commits Ahead</span>
                <div style="font-size:1.5rem; font-weight:700; color:#4CAF50; margin-top:4px;">+${branch.ahead}</div>
              </div>
              <div class="glass-card" style="padding:10px; border:1px solid rgba(255,255,255,0.04); border-radius:8px; text-align:center;">
                <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Commits Behind</span>
                <div style="font-size:1.5rem; font-weight:700; color:#ef4444; margin-top:4px;">-${branch.behind}</div>
              </div>
            </div>
            <div>
              <h4 style="margin:0 0 8px 0; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Modified Files Spec</h4>
              <div style="max-height:120px; overflow-y:auto; display:flex; flex-direction:column; gap:4px;">
                <div style="font-family:var(--font-mono); font-size:0.75rem; padding:6px 8px; background:rgba(255,255,255,0.02); border-radius:4px; display:flex; justify-content:space-between;">
                  <span>src/services/email.ts</span>
                  <span style="color:#4CAF50;">+89 -0</span>
                </div>
              </div>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px; border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
            <button class="btn btn-outline" id="btn-close-compare-footer">Close</button>
            <button class="btn btn-primary" id="btn-compare-propose" data-branch="${branch.name}">Propose Pull Request</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderBranchExplorer(repoState) {
    return `
      <div class="branch-explorer-section glass-card" style="padding:16px; border:1px solid rgba(255,255,255,0.05); border-radius:12px; background:rgba(255,255,255,0.01);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="margin:0; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Branch Explorer</h4>
          <button class="btn btn-xs btn-primary" id="btn-pr-create-branch">+ New Branch</button>
        </div>
        <div class="branch-list-container" style="display:flex; flex-direction:column; gap:8px; max-height: 250px; overflow-y: auto;">
          ${repoState.branches
            .map((b) => {
              const isProtected = b.name === 'main';
              const healthScore = isProtected ? 100 : Math.max(0, 100 - b.ahead * 2 - b.behind * 5);
              const healthText =
                healthScore >= 90 ? '◈ Healthy' : healthScore >= 70 ? '◈ Diverged' : '◈ Stale';
              return `
              <div class="branch-explorer-item" style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:8px;">
                <div style="display:flex; flex-direction:column; gap:2px; flex:1; min-width:0; margin-right:8px;">
                  <div style="display:flex; align-items:center; gap:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    <span style="font-family:var(--font-mono); font-size:0.78rem; font-weight:600; color:var(--text-secondary);">${b.name}</span>
                    ${isProtected ? '<span class="badge badge-purple" style="font-size:0.58rem; padding:1px 4px;">◈️ Protected</span>' : ''}
                  </div>
                  <span style="font-size:0.68rem; color:var(--text-muted);">${b.ahead} ahead, ${b.behind} behind • Health: ${healthText}</span>
                </div>
                <div style="display:flex; gap:4px; flex-shrink:0;">
                  <button class="btn btn-xs btn-outline btn-compare-branch" data-branch="${b.name}" style="padding: 2px 6px;">Compare</button>
                  ${!isProtected ? `<button class="btn btn-xs btn-danger btn-delete-branch" data-branch="${b.name}" style="padding: 2px 8px;" title="Delete branch" aria-label="Delete branch ${b.name}">×</button>` : ''}
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  function renderMergeQueue(prState) {
    const isSimulating = prState.isSimulatingMerge === true;
    return `
      <div class="merge-queue-section glass-card" style="padding:16px; border:1px solid rgba(255,255,255,0.05); border-radius:12px; background:rgba(255,255,255,0.01);">
        <h4 style="margin:0 0 12px 0; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Merge Queue</h4>
        ${
          prState.mergeQueue.length === 0
            ? `
          <div style="padding: 24px; text-align: center; color: var(--text-muted); border: 1px dashed rgba(255,255,255,0.03); border-radius: 8px; background: rgba(255,255,255,0.005);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); opacity: 0.4; display: inline-block; margin-bottom: 8px;">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <p style="font-size:0.75rem; color:var(--text-muted); margin: 0;">No queued pull requests.</p>
          </div>
        `
            : `
          <div class="merge-queue-list" style="display:flex; flex-direction:column; gap:8px;">
            ${prState.mergeQueue
              .map((item) => {
                const pr = prState.list.find((p) => p.id === item.id);
                const approvalCount = pr
                  ? pr.reviewers.filter((r) => r.status === 'approved').length
                  : 0;
                const hasBlockers = prState.list.some(
                  (p) => p.id === 41 && p.status === 'open' && p.conflicts,
                );
                const dependencyText = hasBlockers ? '◈️ Blocked by PR #41' : '◈ Ready to merge';
                return `
                <div class="queue-item" style="padding:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:8px; display:flex; flex-direction:column; gap:6px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:600; font-size:0.8rem; color:var(--text-primary);">#${item.priority} PR #${item.id}</span>
                    <span class="badge ${item.status === 'ready' && !hasBlockers ? 'badge-success' : 'badge-warning'}" style="font-size:0.65rem; padding: 1px 6px;">${item.status.toUpperCase()}</span>
                  </div>
                  <div style="font-size:0.72rem; color:var(--text-muted); line-height:1.4;">
                    <strong>Pipeline:</strong> ${dependencyText}<br>
                    <strong>Approvals:</strong> ${approvalCount} review gate pass
                  </div>
                  <div class="queue-checks" style="font-size:0.68rem; color:var(--text-secondary); display:flex; gap:8px; flex-wrap:wrap; margin-top:2px;">
                    <span>${item.checks.ci ? '◈' : '⏳'} CI</span>
                    <span>${item.checks.review ? '◈' : '⏳'} Review</span>
                    <span>${item.checks.security ? '◈' : '⏳'} Security</span>
                  </div>
                  <div style="margin-top:6px; display:flex; justify-content:flex-end;">
                    <button class="btn btn-xs btn-primary btn-simulate-merge" data-id="${item.id}" ${isSimulating || hasBlockers ? 'disabled' : ''}>
                      ${isSimulating ? '◈ Running Sim...' : '◈ Simulate Merge'}
                    </button>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        `
        }
      </div>
    `;
  }

  function renderChangedFileTree(filePaths, selectedFile, diffs) {
    const root = {};
    filePaths.forEach((path) => {
      const parts = path.split('/');
      let current = root;
      parts.forEach((part, i) => {
        if (!current[part]) {
          current[part] =
            i === parts.length - 1
              ? { type: 'file', path: path }
              : { type: 'folder', children: {} };
        }
        if (i < parts.length - 1) {
          current = current[part].children;
        }
      });
    });

    function renderNode(name, node, level = 0) {
      if (node.type === 'file') {
        const fileDiff = diffs[node.path];
        const isActive = node.path === selectedFile;
        return `
          <div class="file-link-item ${isActive ? 'active' : ''}" data-file-path="${node.path}" style="padding-left:${level * 12}px; margin-bottom:2px; cursor:pointer; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:6px; min-width:0; overflow:hidden;">
              <span class="file-status-marker m" style="font-size:0.62rem; flex-shrink:0;">M</span>
              <span class="file-path-text" style="font-size:0.75rem; font-family:var(--font-mono); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${name}</span>
            </div>
            <span class="file-diff-stats" style="font-size:0.65rem; color:var(--text-muted); flex-shrink:0; font-family:var(--font-mono);">+${fileDiff.additions} -${fileDiff.deletions}</span>
          </div>
        `;
      } else {
        const childrenKeys = Object.keys(node.children);
        return `
          <div class="tree-folder-node" style="padding-left:${level * 12}px; margin-top:4px; margin-bottom:2px; font-weight:600; font-size:0.78rem; color:var(--text-secondary); display:flex; align-items:center; gap:4px; cursor:default; user-select:none;">
            <span>◈</span>
            <span>${name}</span>
          </div>
          ${childrenKeys.map((k) => renderNode(k, node.children[k], level + 1)).join('')}
        `;
      }
    }

    const keys = Object.keys(root);
    return `
      <div class="changed-files-tree" style="display:flex; flex-direction:column; gap:4px;">
        ${keys.map((k) => renderNode(k, root[k])).join('')}
      </div>
    `;
  }

  function highlightDiffLine(lineContent, ext) {
    let cleanLine = lineContent;
    let isAdded = false;
    let isRemoved = false;
    if (lineContent.startsWith('+')) {
      cleanLine = lineContent.substring(1);
      isAdded = true;
    } else if (lineContent.startsWith('-')) {
      cleanLine = lineContent.substring(1);
      isRemoved = true;
    }

    let html = escapeHTML(cleanLine);

    if (ext === 'ts' || ext === 'js') {
      html = html
        .replace(
          /\b(import|export|from|class|interface|constructor|async|await|return|private|function|const|let|var|if|else|throw)\b/g,
          '<span class="token-keyword">$1</span>',
        )
        .replace(
          /\b(string|number|boolean|void|any|Promise|Router|Request|Response)\b/g,
          '<span class="token-type">$1</span>',
        )
        .replace(/"[^"]*"/g, '<span class="token-string">$&</span>')
        .replace(/'[^']*'/g, '<span class="token-string">$&</span>');
    }

    const prefix = isAdded ? '+' : isRemoved ? '-' : ' ';
    return `<span class="diff-prefix" style="opacity:0.4; margin-right:4px;">${prefix}</span>${html}`;
  }

  function renderPRListView(prState) {
    const filteredPRs = prState.list.filter((pr) => {
      if (prState.filter === 'all') return true;
      return pr.status === prState.filter;
    });

    return `
      <div class="pr-list-view" style="display: grid; grid-template-columns: 2.2fr 1fr; gap: 20px; height: 100%;">
        <div class="pr-list-main" style="display: flex; flex-direction: column; height: 100%;">
          <div class="pr-list-controls-header">
            <div class="pr-list-controls">
              <div class="pr-filter-tabs">
                <button class="filter-tab ${prState.filter === 'open' ? 'active' : ''}" data-filter="open">
                  ◈ Open (${prState.list.filter((p) => p.status === 'open').length})
                </button>
                <button class="filter-tab ${prState.filter === 'merged' ? 'active' : ''}" data-filter="merged">
                  ◈ Merged (${prState.list.filter((p) => p.status === 'merged').length})
                </button>
                <button class="filter-tab ${prState.filter === 'closed' ? 'active' : ''}" data-filter="closed">
                  ◈ Closed (${prState.list.filter((p) => p.status === 'closed').length})
                </button>
              </div>
              <button class="btn btn-primary" id="btn-new-pr">
                <span>+ Propose PR</span>
              </button>
            </div>
          </div>

          <div class="pr-list">
            ${
              filteredPRs.length === 0
                ? (typeof window.renderEmptyState === 'function'
                    ? window.renderEmptyState(
                        (window.emptyStatePresets && window.emptyStatePresets.pullRequests) || {
                          illustration: 'katana',
                          title: 'No pull requests',
                          description: 'Pull requests created by agents will appear here for review.',
                          secondaryLabel: 'View Branches',
                        }
                      )
                    : `
              <div class="empty-state-hint" style="padding:60px 40px; text-align:center; color:var(--text-muted); border: 1px dashed rgba(255,115,0,0.1); border-radius: 12px; background: rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">No Pull Requests</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">No pull requests found in this scope.</div>
              </div>
            `)
                : filteredPRs
                    .map(
                      (pr) => `
              <div class="pr-card" data-pr-id="${pr.id}" tabindex="0">
                <div class="pr-card-header">
                  <div class="pr-status-icon">${STATUS_ICONS[pr.status]}</div>
                  <div class="pr-info">
                    <div class="pr-title">${pr.title}</div>
                    <div class="pr-meta">
                      <span class="pr-number">#${pr.number}</span>
                      <span class="pr-author">by ${pr.author}</span>
                      <span class="pr-time">${formatTime(pr.createdAt)}</span>
                    </div>
                  </div>
                  <div class="pr-badges">
                    <span class="badge ${getCIBadgeClass(pr.ciStatus)}">${CI_ICONS[pr.ciStatus]} CI</span>
                    <span class="badge ${getReviewBadgeClass(pr.reviewStatus)}">${REVIEW_ICONS[pr.reviewStatus]} ${formatReviewStatus(pr.reviewStatus)}</span>
                    ${pr.conflicts ? '<span class="badge badge-error">◈️ Conflicts</span>' : ''}
                  </div>
                </div>
                <div class="pr-card-body">
                  <div class="pr-branches">
                    <span class="branch-badge">${pr.branch}</span>
                    <span class="branch-arrow">→</span>
                    <span class="branch-badge base">${pr.base}</span>
                  </div>
                  <div class="pr-stats">
                    <span class="stat additions">+${pr.additions}</span>
                    <span class="stat deletions">-${pr.deletions}</span>
                    <span class="stat comments">◈ ${pr.commentsList ? pr.commentsList.length : pr.comments}</span>
                  </div>
                </div>
                <div class="pr-card-footer">
                  <div class="pr-labels">
                    ${pr.labels.map((l) => `<span class="label-tag">${l}</span>`).join('')}
                  </div>
                  <div class="pr-reviewers">
                    ${pr.reviewers
                      .map(
                        (r) => `
                      <span class="reviewer-avatar" title="${r.user}: ${r.status}">${r.user.charAt(0)}</span>
                    `,
                      )
                      .join('')}
                  </div>
                </div>
              </div>
            `,
                    )
                    .join('')
            }
          </div>
        </div>

        <div class="pr-list-sidebar" style="display:flex; flex-direction:column; gap:16px; overflow-y:auto; padding-top:16px;">
          ${renderMergeQueue(prState)}
          ${renderBranchExplorer(window.state.repository)}
        </div>
      </div>
    `;
  }

  function renderPRDetailView(pr) {
    return `
      <div class="pr-detail-view">
        <div class="pr-detail-header">
          <button class="btn btn-outline btn-sm" id="btn-back-to-list">
            ← Back to list
          </button>
          <div class="pr-detail-title-row">
            <h2>${pr.title}</h2>
            <span class="pr-number">#${pr.number}</span>
          </div>
          <div class="pr-detail-meta">
            <span class="badge ${getReviewBadgeClass(pr.status)}">${STATUS_ICONS[pr.status]} ${pr.status}</span>
            <span class="pr-author">${pr.author}</span>
            <span class="pr-time">opened ${formatTime(pr.createdAt)}</span>
            <span class="pr-branch-info">
              <span class="branch-badge">${pr.branch}</span> → <span class="branch-badge">${pr.base}</span>
            </span>
          </div>
          <div class="pr-detail-actions">
            ${
              pr.status === 'open'
                ? `
              <button class="btn btn-success" id="btn-approve-pr" ${hasUserApproved(pr) ? 'disabled' : ''}>
                ◈ Approve
              </button>
              <button class="btn btn-warning" id="btn-request-changes">
                ◈️ Request Changes
              </button>
              ${
                !pr.conflicts
                  ? `
                <button class="btn btn-primary" id="btn-merge-pr">
                  ◈ Merge Pull Request
                </button>
              `
                  : `
                <button class="btn btn-primary" disabled title="Resolve conflicts first">
                  ◈️ Has Conflicts
                </button>
              `
              }
            `
                : ''
            }
          </div>
        </div>

        <div class="pr-detail-tabs">
          <button class="detail-tab active" data-tab="overview">◈ Conversation</button>
          <button class="detail-tab" data-tab="commits">◈ Commits</button>
          <button class="detail-tab" data-tab="files">◈ Files Changed</button>
          <button class="detail-tab" data-tab="checks">◈ Checks</button>
          ${pr.conflicts ? '<button class="detail-tab" data-tab="conflicts" style="color:#ef4444; font-weight:600;">◈ Conflicts</button>' : ''}
        </div>

        <div class="pr-detail-content">
          <div id="pr-tab-overview" class="pr-tab-content active">
            ${renderPROverview(pr)}
          </div>
          <div id="pr-tab-commits" class="pr-tab-content">
            ${renderPRCommits(pr)}
          </div>
          <div id="pr-tab-files" class="pr-tab-content">
            ${renderPRFiles(pr)}
          </div>
          <div id="pr-tab-checks" class="pr-tab-content">
            ${renderPRChecks(pr)}
          </div>
          ${
            pr.conflicts
              ? `
            <div id="pr-tab-conflicts" class="pr-tab-content">
              ${renderPRConflicts(pr)}
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  function renderPROverview(pr) {
    const commentsList = pr.commentsList || [];
    return `
      <div class="pr-conversation" style="display:grid; grid-template-columns:2.5fr 1fr; gap:20px; align-items:start;">
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div class="comment author-comment">
            <div class="comment-avatar">${pr.author.charAt(0)}</div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-author">${pr.author}</span>
                <span class="comment-time">${formatTime(pr.createdAt)}</span>
              </div>
              <div class="comment-body">
                <p>This PR implements the requested features and adheres to quality gates and security matrix checks.</p>
              </div>
            </div>
          </div>
          
          ${commentsList
            .map(
              (c) => `
            <div class="comment ${c.type === 'inline' ? 'inline-comment' : 'review-comment'}">
              <div class="comment-avatar">${c.author.charAt(0)}</div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">${c.author}</span>
                  <span class="comment-time">${formatTime(c.timestamp)}</span>
                  ${c.type === 'inline' ? `<span class="comment-file-link">${c.file.split('/').pop()}:L${c.line}</span>` : ''}
                </div>
                <div class="comment-body">
                  <p>${c.content}</p>
                </div>
              </div>
            </div>
          `,
            )
            .join('')}

          <div class="pr-comment-box">
            <textarea class="form-textarea" id="pr-general-comment" placeholder="Leave a general comment..."></textarea>
            <div class="comment-actions" style="margin-top:10px;">
              <button class="btn btn-primary" id="btn-post-comment">Comment</button>
            </div>
          </div>
        </div>

        <div class="pr-overview-sidebar" style="display:flex; flex-direction:column; gap:16px;">
          <div class="pr-review-checklist glass-card" style="padding:16px; border:1px solid rgba(255,255,255,0.05); border-radius:10px; background:rgba(255,255,255,0.01);">
            <h4 style="margin:0 0 10px 0; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Review Checklist</h4>
            <div class="checklist-items" style="display:flex; flex-direction:column; gap:8px; font-size:0.75rem; color:var(--text-secondary);">
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" checked disabled> Code adheres to style guides</label>
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" checked disabled> Security AST scan: PASS</label>
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" ${pr.ciStatus === 'passing' ? 'checked' : ''} disabled> Integration tests: PASS</label>
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" checked disabled> ADR architectural alignment</label>
            </div>
          </div>

          <div class="pr-review-summary glass-card" style="padding:16px; border:1px solid rgba(255,255,255,0.05); border-radius:10px; background:rgba(255,255,255,0.01);">
            <h4 style="margin:0 0 10px 0; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Review Sign-off</h4>
            <div style="display:flex; gap:12px; align-items:center;">
              <div style="font-size:1.6rem; font-weight:700; color:var(--accent-orange);">${pr.reviewers.filter((r) => r.status === 'approved').length}</div>
              <div style="font-size:0.72rem; color:var(--text-secondary); line-height:1.3;">
                Approvals count.<br>Required: 1 approval
              </div>
            </div>
            <div style="font-size:0.68rem; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.05); margin-top:10px; padding-top:8px;">
              ${pr.reviewers.map((r) => `<div><strong>${r.user}</strong>: ${r.status.toUpperCase()}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPRCommits(pr) {
    const commits = window.state.repository.commits.filter(
      (c) => c.branch === pr.branch || pr.branch === 'feature/auth-module',
    );
    const displayCommits =
      commits.length > 0 ? commits : window.state.repository.commits.slice(0, 3);
    return `
      <div class="pr-commits">
        ${displayCommits
          .map(
            (c) => `
          <div class="pr-commit-item">
            <div class="commit-checkbox">◈️</div>
            <div class="commit-message">${c.message}</div>
            <div class="commit-author">${c.author}</div>
            <div class="commit-time">${formatTime(c.timestamp)}</div>
            <div class="commit-hash">${c.id.substring(0, 7)}</div>
          </div>
        `,
          )
          .join('')}
      </div>
    `;
  }

  function renderPRFiles(pr) {
    const viewMode = window.state.pullRequests.diffView;
    const diffs = MOCK_DIFFS[pr.id] || {};
    const filePaths = Object.keys(diffs);

    // Choose active file
    if (!pr.selectedDiffFile && filePaths.length > 0) {
      pr.selectedDiffFile = filePaths[0];
    }
    const selectedFile = pr.selectedDiffFile;
    const activeDiff = diffs[selectedFile];

    return `
      <div class="pr-files-layout">
        <aside class="pr-files-sidebar">
          <h4>Changed Files</h4>
          <div class="file-list-links">
            ${renderChangedFileTree(filePaths, selectedFile, diffs)}
          </div>
        </aside>

        <main class="pr-files-main">
          <div class="files-header">
            <div class="files-stats">
              <span class="file-name-title">${selectedFile || 'Select a file'}</span>
              ${
                activeDiff
                  ? `
                <span class="additions">+${activeDiff.additions} additions</span>
                <span class="deletions">-${activeDiff.deletions} deletions</span>
              `
                  : ''
              }
            </div>
            <div class="diff-view-toggle">
              <button class="btn btn-sm ${viewMode === 'split' ? 'btn-primary' : 'btn-outline'}" data-view="split">Split</button>
              <button class="btn btn-sm ${viewMode === 'unified' ? 'btn-primary' : 'btn-outline'}" data-view="unified">Unified</button>
            </div>
          </div>

          <div class="file-diff-list">
            ${
              activeDiff
                ? `
              <div class="file-diff">
                <div class="diff-content ${viewMode}">
                  ${viewMode === 'split' ? renderSplitDiff(selectedFile, activeDiff, pr) : renderUnifiedDiff(selectedFile, activeDiff, pr)}
                </div>
              </div>
            `
                : '<p style="padding: 20px; text-align: center; color: var(--text-muted);">No diff available.</p>'
            }
          </div>
        </main>
      </div>
    `;
  }

  function renderSplitDiff(filePath, activeDiff, pr) {
    const ext = filePath.split('.').pop();
    return `
      <div class="split-diff-view">
        <div class="diff-side old">
          ${activeDiff.lines
            .map((line, i) => {
              if (line.type === 'new') {
                return '<div class="diff-line empty-placeholder"><span class="line-num"></span><span class="line-content"></span></div>';
              }
              return `
              <div class="diff-line old-only">
                <span class="line-num">${line.oldNum}</span>
                <span class="line-content">${highlightDiffLine(line.content, ext)}</span>
              </div>
            `;
            })
            .join('')}
        </div>
        <div class="diff-side new">
          ${activeDiff.lines
            .map((line, i) => {
              const hasComment =
                pr.commentsList &&
                pr.commentsList.find(
                  (c) => c.type === 'inline' && c.file === filePath && c.line === line.newNum,
                );
              if (line.type === 'old') {
                return '<div class="diff-line empty-placeholder"><span class="line-num"></span><span class="line-content"></span></div>';
              }
              return `
              <div class="diff-line-container">
                <div class="diff-line ${line.type === 'new' ? 'new-only' : 'context'}" data-line="${line.newNum}">
                  <span class="line-num">${line.newNum} <span class="add-inline-comment-btn">+</span></span>
                  <span class="line-content">${highlightDiffLine(line.content, ext)}</span>
                </div>
                ${
                  hasComment
                    ? `
                  <div class="inline-comment-block">
                    <div class="comment-author-badge">${hasComment.author.charAt(0)}</div>
                    <div class="comment-text-box">
                      <div class="comment-meta-info"><strong>${hasComment.author}</strong> - ${formatTime(hasComment.timestamp)}</div>
                      <div class="comment-txt">${hasComment.content}</div>
                    </div>
                  </div>
                `
                    : ''
                }
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  function renderUnifiedDiff(filePath, activeDiff, pr) {
    const ext = filePath.split('.').pop();
    return `
      <div class="unified-diff-view">
        ${activeDiff.lines
          .map((line, i) => {
            const hasComment =
              line.newNum &&
              pr.commentsList &&
              pr.commentsList.find(
                (c) => c.type === 'inline' && c.file === filePath && c.line === line.newNum,
              );
            return `
            <div class="diff-line-container">
              <div class="diff-line ${line.type}-only" data-line="${line.newNum || ''}">
                <span class="line-num old">${line.oldNum || ''}</span>
                <span class="line-num new">${line.newNum || ''} ${line.newNum ? '<span class="add-inline-comment-btn">+</span>' : ''}</span>
                <span class="line-content">${highlightDiffLine(line.content, ext)}</span>
              </div>
              ${
                hasComment
                  ? `
                <div class="inline-comment-block">
                  <div class="comment-author-badge">${hasComment.author.charAt(0)}</div>
                  <div class="comment-text-box">
                    <div class="comment-meta-info"><strong>${hasComment.author}</strong> - ${formatTime(hasComment.timestamp)}</div>
                    <div class="comment-txt">${hasComment.content}</div>
                  </div>
                </div>
              `
                  : ''
              }
            </div>
          `;
          })
          .join('')}
      </div>
    `;
  }

  function renderPRChecks(pr) {
    return `
      <div class="pr-checks">
        <div class="check-item success">
          <div class="check-icon">◈</div>
          <div class="check-info">
            <div class="check-name">Continuous Integration (CI)</div>
            <div class="check-desc">All 14 integration test assertions passed successfully.</div>
          </div>
          <div class="check-status">Passed</div>
        </div>
        <div class="check-item success">
          <div class="check-icon">◈</div>
          <div class="check-info">
            <div class="check-name">Stealth Guard Security Audit</div>
            <div class="check-desc">Static AST checks complete. 0 leak triggers found.</div>
          </div>
          <div class="check-status">Passed</div>
        </div>
        <div class="check-item success">
          <div class="check-icon">◈</div>
          <div class="check-info">
            <div class="check-name">Dojo Quality Gate</div>
            <div class="check-desc">Coverage: ${pr.id === 41 ? '82.0%' : '84.2%'} (Required: > 80.0%)</div>
          </div>
          <div class="check-status">Passed</div>
        </div>
      </div>
    `;
  }

  function renderPRConflicts(pr) {
    return `
      <div class="pr-conflicts-resolver" style="max-width:800px;">
        <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); padding:16px; border-radius:10px; margin-bottom:16px;">
          <h4 style="color:var(--accent-error); font-weight:600; margin:0 0 6px 0;">3-Way Merge Conflict Room</h4>
          <p style="font-size:0.8rem; color:var(--text-secondary); margin:0;">Compare Agent Code and Human Code side-by-side and select a resolution strategy to build the Merged Resolution.</p>
        </div>

        <div style="padding:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-bottom:none; border-top-left-radius:10px; border-top-right-radius:10px; display:flex; justify-content:space-between; align-items:center; border-left: 4px solid var(--accent-error);">
          <span style="font-family:var(--font-mono); font-size:0.82rem; font-weight:600;">src/services/email.ts</span>
          <span class="badge badge-error">1 conflict</span>
        </div>

        <!-- 3-Way Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; border:1px solid rgba(255,255,255,0.05); border-top:none; border-bottom-left-radius:10px; border-bottom-right-radius:10px; padding: 12px; background: rgba(0,0,0,0.15); border-left: 4px solid var(--accent-error);">
          <!-- Agent Code (Incoming) -->
          <div class="glass-card" style="padding: 12px; border: 1px solid rgba(255, 115, 0, 0.15); background: rgba(0, 0, 0, 0.2); border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="margin-bottom: 8px;">
              <div style="font-weight: 700; font-size: 0.78rem; color: var(--accent-orange); margin-bottom: 4px;">◈ Agent Code (Incoming feature/email-service)</div>
              <pre style="margin: 0; font-family: var(--font-mono); font-size: 0.72rem; padding: 10px; background: rgba(0,0,0,0.4); border-radius: 6px; overflow-x: auto; color: var(--text-secondary); white-space: pre-wrap; word-break: break-all;">${highlightDiffLine('+ // Custom timeout configurations injected', 'ts')}\n${highlightDiffLine('+ this.transporter = nodemailer.createTransport({ ...config, connectionTimeout: 30000 });', 'ts')}</pre>
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
              <button class="btn btn-xs btn-primary btn-resolve-incoming" data-pr-id="${pr.id}">Use Agent Code</button>
            </div>
          </div>

          <!-- Human Code (HEAD) -->
          <div class="glass-card" style="padding: 12px; border: 1px solid rgba(56, 189, 248, 0.15); background: rgba(0, 0, 0, 0.2); border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="margin-bottom: 8px;">
              <div style="font-weight: 700; font-size: 0.78rem; color: var(--accent-cyan); margin-bottom: 4px;">◈ Human Code (HEAD main)</div>
              <pre style="margin: 0; font-family: var(--font-mono); font-size: 0.72rem; padding: 10px; background: rgba(0,0,0,0.4); border-radius: 6px; overflow-x: auto; color: var(--text-secondary); white-space: pre-wrap; word-break: break-all;">${highlightDiffLine('this.transporter = nodemailer.createTransport(config);', 'ts')}</pre>
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
              <button class="btn btn-xs btn-outline btn-resolve-head" data-pr-id="${pr.id}" style="color: var(--accent-cyan); border-color: rgba(56, 189, 248, 0.3);">Use Human Code</button>
            </div>
          </div>
        </div>

        <!-- Merged Resolution and Pipeline -->
        <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:16px; margin-top:16px;">
          <div class="glass-card" style="padding:16px; border:1px solid rgba(255,255,255,0.05); border-radius:10px; display: flex; flex-direction: column; gap: 10px;">
            <h5 style="margin:0; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Merged Resolution</h5>
            <div id="resolution-live-preview" style="font-family:var(--font-mono); font-size:0.75rem; padding:12px; background:rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius:6px; color:#4CAF50; min-height:100px; white-space: pre-wrap; word-break: break-all;">Select a resolution strategy above to preview code changes.</div>
          </div>
          <div class="glass-card" style="padding:16px; border:1px solid rgba(255,255,255,0.05); border-radius:10px;">
            <h5 style="margin:0 0 10px 0; font-size:0.8rem; text-transform:uppercase; color:var(--text-muted);">Resolution Pipeline</h5>
            <div style="display:flex; flex-direction:column; gap:8px; font-size:0.75rem; color:var(--text-secondary);">
              <div>◈ 1. Conflict Detected: <span style="color:#4CAF50;">DONE</span></div>
              <div>◈ 2. Strategy Selection: <span style="color:var(--accent-orange);">PENDING</span></div>
              <div>◈ 3. Compiler Diagnostics: <span>LOCKED</span></div>
              <div>◈ 4. Finalize & Sign-off: <span>LOCKED</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function attachPRListeners() {
    const prState = window.state.pullRequests;
    const selectedPR = prState.list.find((p) => p.id === prState.selectedPR);

    // Branch explore action delete
    document.querySelectorAll('.btn-delete-branch').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const branch = btn.dataset.branch;
        window.showConfirmDialog(
          'Delete Branch',
          `Are you sure you want to delete branch "${branch}"? This cannot be undone.`,
          () => {
            window.dispatch('REPO_DELETE_BRANCH', { branch });
            window.renderPullRequests();
            window.showToast(`Branch ${branch} deleted`, 'warning');
          },
          true,
        );
      });
    });

    // Branch compare click
    document.querySelectorAll('.btn-compare-branch').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const branch = btn.dataset.branch;
        window.dispatch('PR_COMPARE_BRANCH', { branch });
        window.renderPullRequests();
      });
    });

    // Close Compare modal
    const closeCompare = document.getElementById('btn-close-compare');
    const closeCompareFooter = document.getElementById('btn-close-compare-footer');
    const closeCompareHandler = () => {
      window.dispatch('PR_COMPARE_BRANCH', { branch: null });
      window.renderPullRequests();
    };
    if (closeCompare) closeCompare.addEventListener('click', closeCompareHandler);
    if (closeCompareFooter) closeCompareFooter.addEventListener('click', closeCompareHandler);

    // Compare propose PR
    const comparePropose = document.getElementById('btn-compare-propose');
    if (comparePropose) {
      comparePropose.addEventListener('click', () => {
        const branch = comparePropose.dataset.branch;
        window.dispatch('PR_COMPARE_BRANCH', { branch: null });
        window.showConfirmDialog(
          'Propose PR',
          `Propose new pull request from branch "${branch}"?`,
          () => {
            window.dispatch('PR_CREATE', {
              title: `Feat: Merge updates from ${branch}`,
              branch: branch,
              additions: 12,
              deletions: 2,
              labels: ['feature'],
            });
            window.renderPullRequests();
            window.showToast('PR proposed successfully', 'success');
          },
        );
      });
    }

    // Branch create btn in PR explorer
    const createBranchBtn = document.getElementById('btn-pr-create-branch');
    if (createBranchBtn) {
      createBranchBtn.addEventListener('click', () => {
        window.showConfirmDialog(
          'Create Branch',
          `<div style="text-align:left;">
             <label style="font-size:0.75rem; color:var(--text-muted);">New Branch Name:</label>
             <input type="text" id="new-branch-input-dialog-pr" class="form-input text-xs" style="margin-top:6px; width:100%;" placeholder="e.g. feature/api-caching" required>
           </div>`,
          () => {
            const input = document.getElementById('new-branch-input-dialog-pr');
            if (input && input.value.trim()) {
              const name = input.value.trim();
              window.dispatch('REPO_CREATE_BRANCH', { name });
              window.renderPullRequests();
              window.showToast(`Branch ${name} created!`, 'success');
            }
          },
        );
        setTimeout(() => {
          const input = document.getElementById('new-branch-input-dialog-pr');
          if (input) input.focus();
        }, 100);
      });
    }

    // Simulate merge
    document.querySelectorAll('.btn-simulate-merge').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prId = parseInt(btn.dataset.id);
        window.dispatch('PR_SIMULATE_MERGE', { prId });
        window.renderPullRequests();
      });
    });

    // Filter tabs
    document.querySelectorAll('.pr-filter-tabs .filter-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        window.state.pullRequests.filter = tab.dataset.filter;
        window.renderPullRequests();
      });
    });

    // PR card click
    document.querySelectorAll('.pr-card').forEach((card) => {
      card.addEventListener('click', () => {
        const prId = parseInt(card.dataset.prId);
        window.dispatch('PR_SELECT', { prId });
        window.renderPullRequests();
      });
    });

    // Back button
    const backBtn = document.getElementById('btn-back-to-list');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.state.pullRequests.selectedPR = null;
        window.renderPullRequests();
      });
    }

    // Approve PR
    const approveBtn = document.getElementById('btn-approve-pr');
    if (approveBtn) {
      approveBtn.addEventListener('click', () => {
        if (selectedPR) {
          window.dispatch('PR_ADD_REVIEW', {
            prId: selectedPR.id,
            reviewer: 'You',
            status: 'approved',
          });
          window.dispatch('ADD_LOG', {
            agent: 'orchestrator',
            type: 'success',
            msg: `User APPROVED Pull Request #${selectedPR.number} (${selectedPR.title})`,
          });
          window.renderPullRequests();
          window.showToast('Pull Request approved!', 'success');
        }
      });
    }

    // Request Changes
    const changeBtn = document.getElementById('btn-request-changes');
    if (changeBtn) {
      changeBtn.addEventListener('click', () => {
        if (selectedPR) {
          window.dispatch('PR_ADD_REVIEW', {
            prId: selectedPR.id,
            reviewer: 'You',
            status: 'changes_requested',
          });
          window.dispatch('ADD_LOG', {
            agent: 'orchestrator',
            type: 'warning',
            msg: `User REQUESTED CHANGES on Pull Request #${selectedPR.number} (${selectedPR.title})`,
          });
          window.renderPullRequests();
          window.showToast('Changes requested', 'warning');
        }
      });
    }

    // Merge PR
    const mergeBtn = document.getElementById('btn-merge-pr');
    if (mergeBtn) {
      mergeBtn.addEventListener('click', () => {
        if (selectedPR) {
          window.showConfirmDialog(
            'Merge Pull Request',
            `Are you sure you want to merge PR #${selectedPR.number}: ${selectedPR.title}?`,
            () => {
              window.dispatch('PR_UPDATE_STATUS', { prId: selectedPR.id, status: 'merged' });
              window.state.pullRequests.selectedPR = null;
              window.triggerSmokePuff('pr-badge-count');
              window.renderPullRequests();
              window.showToast('Pull request merged!', 'success');
            },
          );
        }
      });
    }

    // Detail tabs
    document.querySelectorAll('.pr-detail-tabs .detail-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document
          .querySelectorAll('.pr-detail-tabs .detail-tab')
          .forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.pr-tab-content').forEach((c) => c.classList.remove('active'));
        tab.classList.add('active');
        const container = document.getElementById(`pr-tab-${tab.dataset.tab}`);
        if (container) container.classList.add('active');
      });
    });

    // File Link List navigation
    document.querySelectorAll('.file-link-item').forEach((item) => {
      item.addEventListener('click', () => {
        if (selectedPR) {
          selectedPR.selectedDiffFile = item.dataset.filePath;
          window.renderPullRequests();
          const fileTab = document.querySelector('[data-tab="files"]');
          if (fileTab) fileTab.click();
        }
      });
    });

    // General comment post
    const postCommentBtn = document.getElementById('btn-post-comment');
    if (postCommentBtn) {
      postCommentBtn.addEventListener('click', () => {
        const textVal = document.getElementById('pr-general-comment').value.trim();
        if (textVal && selectedPR) {
          if (!selectedPR.commentsList) selectedPR.commentsList = [];
          selectedPR.commentsList.push({
            id: `c_${Date.now()}`,
            author: 'You',
            content: textVal,
            timestamp: new Date().toISOString(),
            type: 'general',
          });
          document.getElementById('pr-general-comment').value = '';
          window.renderPullRequests();
          window.showToast('Comment posted', 'success');
        }
      });
    }

    // Diff view split/unified toggler
    document.querySelectorAll('.diff-view-toggle .btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.state.pullRequests.diffView = btn.dataset.view;
        window.renderPullRequests();
        const fileTab = document.querySelector('[data-tab="files"]');
        if (fileTab) fileTab.click();
      });
    });

    // Inline comment box trigger
    document.querySelectorAll('.diff-line .add-inline-comment-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const diffLine = btn.closest('.diff-line');
        const lineNum = diffLine.dataset.line;
        if (!lineNum) return;

        const sibling = diffLine.nextElementSibling;
        if (sibling && sibling.classList.contains('inline-comment-form-wrapper')) {
          sibling.remove();
          return;
        }

        const formWrapper = document.createElement('div');
        formWrapper.className = 'inline-comment-form-wrapper';
        formWrapper.innerHTML = `
          <textarea class="form-textarea text-xs inline-comment-input" placeholder="Type inline code review comment..."></textarea>
          <div style="text-align:right; margin-top:6px;">
            <button class="btn btn-xs btn-outline btn-inline-cancel">Cancel</button>
            <button class="btn btn-xs btn-primary btn-inline-submit">Add Comment</button>
          </div>
        `;
        diffLine.after(formWrapper);

        formWrapper.querySelector('.btn-inline-cancel').addEventListener('click', () => {
          formWrapper.remove();
        });

        formWrapper.querySelector('.btn-inline-submit').addEventListener('click', () => {
          const text = formWrapper.querySelector('.inline-comment-input').value.trim();
          if (text && selectedPR) {
            if (!selectedPR.commentsList) selectedPR.commentsList = [];
            selectedPR.commentsList.push({
              id: `c_${Date.now()}`,
              author: 'You',
              content: text,
              timestamp: new Date().toISOString(),
              type: 'inline',
              file: selectedPR.selectedDiffFile,
              line: parseInt(lineNum),
            });
            window.renderPullRequests();
            window.showToast('Inline comment added', 'success');
            const fileTab = document.querySelector('[data-tab="files"]');
            if (fileTab) fileTab.click();
          }
        });
      });
    });

    // Propose PR button click
    const btnNewPR = document.getElementById('btn-new-pr');
    if (btnNewPR) {
      btnNewPR.addEventListener('click', () => {
        window.showConfirmDialog(
          'Propose Pull Request',
          'Propose changes from <strong>feature/email-service</strong> to <strong>main</strong>?',
          () => {
            window.dispatch('PR_CREATE', {
              title: 'Feat: Integrate Nodemailer SMTP templates',
              branch: 'feature/email-service',
              additions: 89,
              deletions: 0,
              labels: ['feature', 'backend'],
            });
            window.renderPullRequests();
            window.showToast('PR proposed successfully', 'success');
          },
        );
      });
    }

    // Conflict resolution action click
    document.querySelectorAll('.btn-resolve-head, .btn-resolve-incoming').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prId = parseInt(btn.dataset.prId);
        const targetPr = window.state.pullRequests.list.find((p) => p.id === prId);
        const choice = btn.classList.contains('btn-resolve-head')
          ? 'HEAD (Current)'
          : 'Incoming (Feature)';

        // Show live preview resolution message
        const previewEl = document.getElementById('resolution-live-preview');
        if (previewEl) {
          const codeString =
            choice === 'HEAD (Current)'
              ? 'this.transporter = nodemailer.createTransport(config);'
              : '// Custom timeout configurations injected\nthis.transporter = nodemailer.createTransport({\n  ...config,\n  connectionTimeout: 30000\n});';
          previewEl.innerHTML = `
            <span style="color:#4CAF50; font-weight:600; display:block; margin-bottom:6px;">◈ Resolved using ${choice === 'HEAD (Current)' ? 'Human Code' : 'Agent Code'} (Draft):</span>
            <pre style="margin:0; font-family:var(--font-mono); font-size:0.75rem; color:var(--text-secondary); padding:8px; background:rgba(0,0,0,0.3); border-radius:4px; overflow-x:auto; white-space:pre-wrap; word-break:break-all;">${codeString}</pre>
          `;
        }

        window.showConfirmDialog(
          'Confirm Conflict Resolution',
          `Resolve conflicts using "${choice}" rules? This compiles structural changes.`,
          () => {
            if (targetPr) {
              targetPr.conflicts = false;
              window.dispatch('ADD_LOG', {
                agent: 'system',
                type: 'success',
                msg: `Conflict resolved in src/services/email.ts using ${choice} rules.`,
              });
              window.renderPullRequests();
              window.showToast(`Conflicts resolved using ${choice}`, 'success');
            }
          },
        );
      });
    });

    if (typeof window.wireEmptyStateActions === 'function') {
      window.wireEmptyStateActions(document.getElementById('pull-requests-container'));
    }
  }

  function hasUserApproved(pr) {
    return pr.reviewers.some((r) => r.user === 'You' && r.status === 'approved');
  }

  function getCIBadgeClass(status) {
    return status === 'passing'
      ? 'badge-success'
      : status === 'failing'
        ? 'badge-error'
        : 'badge-warning';
  }

  function getReviewBadgeClass(status) {
    const map = {
      open: 'badge-success',
      merged: 'badge-purple',
      changes_requested: 'badge-warning',
      approved: 'badge-success',
    };
    return map[status] || 'badge-outline';
  }

  function formatReviewStatus(status) {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function injectPRStyles() {
    if (document.getElementById('pr-styles-extended')) return;
    const style = document.createElement('style');
    style.id = 'pr-styles-extended';
    style.textContent = `
      .pr-layout { height: 100%; }
      .pr-list-view { display: flex; flex-direction: column; height: 100%; }
      .pr-list-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .pr-list-header h2 { margin: 0; }
      .pr-list-controls { display: flex; gap: 16px; align-items: center; }
      .pr-filter-tabs { display: flex; gap: 4px; }
      .filter-tab { padding: 8px 16px; border-radius: 20px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); cursor: pointer; font-size: 0.85rem; transition: all 0.15s; }
      .filter-tab:hover { border-color: var(--accent-orange); color: var(--text-primary); }
      .filter-tab.active { background: rgba(255,115,0,0.15); border-color: var(--accent-orange); color: var(--accent-orange); }
      
      .pr-list { flex: 1; overflow-y: auto; padding: 16px; }
      .pr-card { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; }
      .pr-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,115,0,0.3); transform: translateX(4px); }
      .pr-card-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
      .pr-status-icon { font-size: 1.2rem; }
      .pr-info { flex: 1; }
      .pr-title { font-weight: 600; font-size: 1rem; margin-bottom: 4px; color: var(--text-primary); }
      .pr-meta { font-size: 0.8rem; color: var(--text-muted); }
      .pr-number { color: var(--accent-cyan); }
      .pr-badges { display: flex; gap: 8px; flex-wrap: wrap; }
      
      .pr-card-body { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .pr-branches { display: flex; align-items: center; gap: 8px; }
      .branch-badge { padding: 4px 10px; background: rgba(255,115,0,0.1); border-radius: 12px; font-size: 0.8rem; font-family: var(--font-mono); color: var(--accent-orange); }
      .branch-badge.base { background: rgba(0,188,212,0.1); color: var(--accent-cyan); }
      .branch-arrow { color: var(--text-muted); }
      .pr-stats { display: flex; gap: 12px; font-family: var(--font-mono); font-size: 0.85rem; }
      .pr-stats .additions { color: #4CAF50; }
      .pr-stats .deletions { color: #ef4444; }
      
      .pr-card-footer { display: flex; justify-content: space-between; align-items: center; }
      .pr-labels { display: flex; gap: 6px; flex-wrap: wrap; }
      .label-tag { padding: 2px 8px; background: rgba(255,255,255,0.06); border-radius: 10px; font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); }
      .pr-reviewers { display: flex; }
      .reviewer-avatar { width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #9C27B0, #ff7300); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; margin-left: -6px; border: 2px solid #0d0b0a; }
      
      .pr-detail-view { display: flex; flex-direction: column; height: 100%; }
      .pr-detail-header { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .pr-detail-title-row { display: flex; align-items: center; gap: 12px; margin: 12px 0; }
      .pr-detail-title-row h2 { margin: 0; }
      .pr-detail-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
      .pr-status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; text-transform: uppercase; font-weight: 600; }
      .pr-status-badge.open { background: rgba(76,175,80,0.2); color: #4CAF50; }
      .pr-status-badge.merged { background: rgba(156,39,176,0.2); color: #9C27B0; }
      .pr-status-badge.closed { background: rgba(239,68,68,0.2); color: #ef4444; }
      .pr-detail-actions { display: flex; gap: 8px; }
      
      .pr-detail-tabs { display: flex; gap: 4px; padding: 0 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .detail-tab { padding: 12px 20px; background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--text-muted); cursor: pointer; font-size: 0.9rem; transition: all 0.15s; }
      .detail-tab:hover { color: var(--text-primary); }
      .detail-tab.active { color: var(--accent-orange); border-bottom-color: var(--accent-orange); }
      
      .pr-detail-content { flex: 1; overflow-y: auto; padding: 16px; }
      .pr-tab-content { display: none; }
      .pr-tab-content.active { display: block; }
      
      .pr-conversation { max-width: 800px; }
      .comment { display: flex; gap: 12px; margin-bottom: 16px; }
      .comment-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #ff7300, #ffb300); display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0; color: #fff; }
      .comment-content { flex: 1; background: rgba(255,255,255,0.03); border-radius: 12px; padding: 12px; border: 1px solid rgba(255,255,255,0.05); }
      .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .comment-author { font-weight: 600; }
      .comment-time { font-size: 0.75rem; color: var(--text-muted); }
      .comment-file-link { font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-cyan); margin-left: auto; }
      .comment-body p { margin: 0; font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); }
      .inline-comment { border-left: 3px solid var(--accent-orange); background: rgba(255,115,0,0.03); }
      
      .pr-comment-box { margin-top: 24px; padding: 16px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1); }
      
      /* Files Layout */
      .pr-files-layout { display: grid; grid-template-columns: 240px 1fr; gap: 16px; height: calc(100vh - 280px); }
      .pr-files-sidebar { background: rgba(255,255,255,0.02); border-radius: 8px; padding: 12px; border: 1px solid rgba(255,255,255,0.05); overflow-y: auto; }
      .pr-files-sidebar h4 { margin: 0 0 12px 0; font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; }
      .file-list-links { display: flex; flex-direction: column; gap: 4px; }
      .file-link-item { display: flex; flex-direction: column; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.15s; background: rgba(255,255,255,0.02); border: 1px solid transparent; }
      .file-link-item:hover { background: rgba(255,255,255,0.04); }
      .file-link-item.active { background: rgba(255,115,0,0.08); border-color: rgba(255,115,0,0.2); }
      .file-path-text { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 500; word-break: break-all; }
      .file-diff-stats { font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; }
      .file-status-marker { font-size: 0.7rem; font-weight: 700; width: 16px; height: 16px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; margin-right: 6px; }
      .file-status-marker.m { background: rgba(255,152,0,0.2); color: #ff9800; }
      
      .pr-files-main { background: rgba(255,255,255,0.01); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; display: flex; flex-direction: column; }
      .files-header { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05); }
      .file-name-title { font-family: var(--font-mono); font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
      .files-stats { display: flex; align-items: center; gap: 12px; }
      .files-stats .additions { color: #4CAF50; font-size: 0.8rem; }
      .files-stats .deletions { color: #ef4444; font-size: 0.8rem; }
      
      .file-diff-list { flex: 1; overflow-y: auto; background: rgba(0,0,0,0.2); }
      .diff-content { font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.5; }
      
      .split-diff-view { display: grid; grid-template-columns: 1fr 1fr; }
      .diff-side { min-width: 0; }
      .diff-side.old { border-right: 1px solid rgba(255,255,255,0.05); }
      
      .diff-line-container { display: flex; flex-direction: column; }
      .diff-line { display: flex; align-items: stretch; min-height: 22px; width: 100%; position: relative; }
      .diff-line:hover { background: rgba(255,255,255,0.03); }
      .diff-line .line-num { width: 50px; text-align: right; padding-right: 12px; color: var(--text-muted); background: rgba(255,255,255,0.02); user-select: none; font-size: 0.72rem; border-right: 1px solid rgba(255,255,255,0.03); position: relative; display: flex; align-items: center; justify-content: flex-end; }
      
      .diff-line .line-num .add-inline-comment-btn { display: none; cursor: pointer; width: 14px; height: 14px; background: var(--accent-orange); color: #fff; font-size: 0.65rem; border-radius: 3px; align-items: center; justify-content: center; position: absolute; left: 4px; top: 4px; font-weight: 700; line-height: 1; }
      .diff-line:hover .add-inline-comment-btn { display: inline-flex; }
      
      .diff-line .line-content { flex: 1; padding: 2px 8px; white-space: pre; word-break: break-all; overflow-x: auto; display: flex; align-items: center; }
      
      .diff-line.old-only { background: rgba(239,68,68,0.1); color: #ffbcbc; }
      .diff-line.new-only { background: rgba(76,175,80,0.1); color: #c4ffd4; }
      .diff-line.empty-placeholder { background: rgba(255,255,255,0.01); opacity: 0.2; }
      
      .unified-diff-view .line-num { width: 44px; }
      .unified-diff-view .line-num.old { border-right: none; }
      .unified-diff-view .line-num.new { border-right: 1px solid rgba(255,255,255,0.03); }
      
      .inline-comment-form-wrapper { padding: 12px; background: rgba(255,115,0,0.05); border: 1px solid rgba(255,115,0,0.2); border-radius: 6px; margin: 4px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
      .inline-comment-block { display: flex; gap: 8px; padding: 8px 12px; background: rgba(255,115,0,0.08); border-left: 3px solid var(--accent-orange); margin: 2px 12px; border-radius: 0 6px 6px 0; font-size: 0.76rem; }
      .comment-author-badge { width: 20px; height: 20px; border-radius: 50%; background: var(--accent-orange); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #fff; font-weight: 700; }
      .comment-text-box { flex: 1; }
      .comment-meta-info { color: var(--text-muted); font-size: 0.7rem; margin-bottom: 2px; }
      .comment-txt { color: var(--text-secondary); }
      
      .pr-commits { max-width: 800px; display: flex; flex-direction: column; gap: 8px; }
      .pr-commit-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.04); }
      .commit-message { flex: 1; font-weight: 500; font-size: 0.85rem; }
      .commit-author { font-size: 0.78rem; color: var(--text-secondary); }
      .commit-time { font-size: 0.75rem; color: var(--text-muted); }
      .commit-hash { font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-cyan); background: rgba(0,188,212,0.1); padding: 2px 6px; border-radius: 4px; }
      
      .pr-checks { max-width: 600px; display: flex; flex-direction: column; gap: 8px; }
      .check-item { display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 10px; border-left: 3px solid transparent; }
      .check-item.success { border-left-color: #4CAF50; }
      .check-icon { font-size: 1.2rem; }
      .check-info { flex: 1; }
      .check-name { font-weight: 600; font-size: 0.88rem; }
      .check-desc { font-size: 0.8rem; color: var(--text-muted); }
      .check-status { padding: 4px 12px; border-radius: 12px; background: rgba(76,175,80,0.15); color: #4CAF50; font-size: 0.75rem; }
    `;
    document.head.appendChild(style);
  }

  // Create debounced version for performance optimization (100ms delay)
  window.renderPullRequests = window.debounce
    ? window.debounce(_renderPullRequests, 100)
    : _renderPullRequests;

  window.initPullRequests = function () {
    window.renderPullRequests();
  };

  console.warn('%c[CoNinja] Pull Request Center loaded ◈', 'color:#ff7300;font-weight:bold;');
})();
