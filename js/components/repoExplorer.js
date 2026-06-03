/* ============================================================
   CoNinja Shadow Swarm — Repository Explorer Component
   File tree, branch selector, search, commit history, blame view
   ============================================================ */

(function () {
  'use strict';

  const FILE_ICONS = {
    folder: '▣',
    ts: '⟡',
    js: '⋄',
    json: '≣',
    md: '◈',
    css: '◫',
    html: '⌘',
    default: '□',
  };

  // Expanded folders in state
  const expandedFolders = new Set(['src', 'src/api', 'src/models', 'src/services']);

  // Complete mock files code dataset
  const MOCK_FILE_CONTENTS = {
    'src/api/auth.ts': [
      'import express from "express";',
      'import bcrypt from "bcrypt";',
      'import jwt from "jsonwebtoken";',
      'import { User } from "../models/User";',
      '',
      'const router = express.Router();',
      '',
      'export async function authenticate(req: express.Request, res: express.Response) {',
      '  const { username, password } = req.body;',
      '  const user = await User.findOne({ username });',
      '  ',
      '  if (!user || !(await bcrypt.compare(password, user.hash))) {',
      '    return res.status(401).json({ error: "Unauthorized access" });',
      '  }',
      '  ',
      '  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: "8h" });',
      '  return res.json({ token, role: user.role });',
      '}',
    ],
    'src/api/users.ts': [
      'import express from "express";',
      'import { User } from "../models/User";',
      'import { authenticateJWT } from "../middleware/auth";',
      '',
      'const router = express.Router();',
      '',
      'router.get("/me", authenticateJWT, async (req, res) => {',
      '  const user = await User.findById(req.user.id);',
      '  if (!user) return res.status(404).end();',
      '  return res.json(user);',
      '});',
    ],
    'src/models/User.ts': [
      'import mongoose from "mongoose";',
      '',
      'const UserSchema = new mongoose.Schema({',
      '  username: { type: String, required: true, unique: true },',
      '  hash: { type: String, required: true },',
      '  role: { type: String, default: "ninja" },',
      '  createdAt: { type: Date, default: Date.now }',
      '});',
      '',
      'export const User = mongoose.model("User", UserSchema);',
    ],
    'src/models/Session.ts': [
      'import mongoose from "mongoose";',
      '',
      'const SessionSchema = new mongoose.Schema({',
      '  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },',
      '  token: { type: String, required: true },',
      '  expiresAt: { type: Date, required: true }',
      '});',
      '',
      'export const Session = mongoose.model("Session", SessionSchema);',
    ],
    'src/services/email.ts': [
      'import nodemailer from "nodemailer";',
      '',
      'export interface EmailOptions {',
      '  to: string;',
      '  subject: string;',
      '  body: string;',
      '}',
      '',
      'export class EmailService {',
      '  private transporter: nodemailer.Transporter;',
      '',
      '  constructor(config: any) {',
      '    this.transporter = nodemailer.createTransport(config);',
      '  }',
      '',
      '  async sendEmail(options: EmailOptions): Promise<void> {',
      '    await this.transporter.sendMail({',
      '      to: options.to,',
      '      subject: options.subject,',
      '      html: options.body',
      '    });',
      '  }',
      '}',
    ],
    'tests/integration/auth.test.ts': [
      'import request from "supertest";',
      'import { app } from "../../src/app";',
      '',
      'describe("Auth Endpoints", () => {',
      '  it("should block unauthenticated profiles", async () => {',
      '    const res = await request(app).get("/api/users/me");',
      '    expect(res.status).toBe(401);',
      '  });',
      '});',
    ],
    'docs/db-schema.md': [
      '# Database Schema Blueprint',
      '',
      '## Entities:',
      '- **User**: Accounts table representing developers and shinobis.',
      '- **Session**: Active tokens representing user session lines.',
      '- **Workspace**: Active projects scopes.',
    ],
  };

  const MOCK_BLAME = {
    'src/models/User.ts': [
      { commit: 'a1b2c3d', author: 'Jutsu Coder', date: '2026-05-29' },
      { commit: 'a1b2c3d', author: 'Jutsu Coder', date: '2026-05-29' },
      { commit: 'a1b2c3d', author: 'Jutsu Coder', date: '2026-05-29' },
      { commit: 'a1b2c3d', author: 'Jutsu Coder', date: '2026-05-29' },
      { commit: 'e4f5g6h', author: 'Stealth Auditor', date: '2026-05-29' },
      { commit: 'a1b2c3d', author: 'Jutsu Coder', date: '2026-05-29' },
      { commit: 'a1b2c3d', author: 'Jutsu Coder', date: '2026-05-29' },
      { commit: 'a1b2c3d', author: 'Jutsu Coder', date: '2026-05-29' },
      { commit: 'a1b2c3d', author: 'Jutsu Coder', date: '2026-05-29' },
      { commit: 'a1b2c3d', author: 'Jutsu Coder', date: '2026-05-29' },
    ],
  };

  const _renderRepoExplorer = function () {
    const container = document.getElementById('repo-explorer-container');
    if (!container) return;

    const repoState = window.state.repository;
    const activeTab = repoState.activeTab || 'files';

    container.innerHTML = `
      <div class="repo-layout">
        <aside class="repo-sidebar">
          <div class="branch-selector">
            <select class="form-select" id="branch-select">
              ${repoState.branches
                .map(
                  (b) => `
                <option value="${b.name}" ${b.name === repoState.currentBranch ? 'selected' : ''}>
                  ${b.name === 'main' ? '◉' : '◌'} ${b.name}
                </option>
              `,
                )
                .join('')}
            </select>
            <button class="btn btn-sm btn-outline" id="btn-new-branch" title="Create Branch" aria-label="Create Branch">+</button>
          </div>

          <div class="repo-tabs">
            <button class="repo-tab ${activeTab === 'files' ? 'active' : ''}" data-tab="files">▣ Files</button>
            <button class="repo-tab ${activeTab === 'commits' ? 'active' : ''}" data-tab="commits">◈ Commits</button>
            <button class="repo-tab ${activeTab === 'branches' ? 'active' : ''}" data-tab="branches">◌ Branches</button>
            <button class="repo-tab ${activeTab === 'search' ? 'active' : ''}" data-tab="search">⌕ Search</button>
          </div>

          <div class="repo-sidebar-content">
            ${activeTab === 'files' ? renderFileTree(repoState.fileTree) : ''}
            ${activeTab === 'commits' ? renderCommitList(repoState.commits) : ''}
            ${activeTab === 'branches' ? renderBranchList(repoState.branches, repoState.tags) : ''}
            ${activeTab === 'search' ? renderSearchPanel() : ''}
          </div>
        </aside>

        <main class="repo-main">
          ${repoState.selectedFile ? renderFileView(repoState) : renderRepoOverview(repoState)}
        </main>
      </div>
    `;

    attachListeners();
    injectStyles();
  };

  function renderFileTree(tree, level = 0, parentPath = '') {
    return `
      <div class="file-tree" style="padding-left: ${level > 0 ? 12 : 0}px;">
        ${tree
          .map((node) => {
            const isFolder = node.type === 'folder';
            const isExpanded = expandedFolders.has(node.path);
            if (level > 0 && parentPath && !expandedFolders.has(parentPath)) {
              return '';
            }
            return `
            <div class="tree-node-wrapper">
              <div class="tree-node ${node.type} ${isFolder && isExpanded ? 'expanded' : ''}" data-path="${node.path}">
                <span class="node-icon">${getFileIcon(node)}</span>
                <span class="node-name">${node.path.split('/').pop()}</span>
                ${node.type === 'file' && node.size ? `<span class="node-size">${formatBytes(node.size)}</span>` : ''}
              </div>
              ${isFolder && isExpanded && node.children ? renderFileTree(node.children, level + 1, node.path) : ''}
            </div>
          `;
          })
          .join('')}
      </div>
    `;
  }

  function renderCommitList(commits) {
    const filterAuthor = window.state.repository.commitFilterAuthor || 'all';
    const searchQuery = (window.state.repository.commitSearchQuery || '').toLowerCase();

    const filtered = commits.filter((c) => {
      if (filterAuthor !== 'all' && c.author !== filterAuthor) return false;
      if (searchQuery && !c.message.toLowerCase().includes(searchQuery)) return false;
      return true;
    });

    const authors = [...new Set(commits.map((c) => c.author))];

    return `
      <div class="commit-tab-view" style="display:flex; flex-direction:column; gap:10px;">
        <div class="commit-filters" style="display:flex; flex-direction:column; gap:6px; background:rgba(255,255,255,0.01); padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.04);">
          <input type="text" id="commit-search" class="form-input text-xs" style="width:100%;" placeholder="Search commits..." value="${window.state.repository.commitSearchQuery || ''}">
          <select id="commit-author-filter" class="form-select text-xs" style="width:100%; padding:4px;">
            <option value="all" ${filterAuthor === 'all' ? 'selected' : ''}>All Authors</option>
            ${authors.map((a) => `<option value="${a}" ${filterAuthor === a ? 'selected' : ''}>${a}</option>`).join('')}
          </select>
        </div>
        <div class="commit-timeline-graph" style="position:relative; display:flex; flex-direction:column; gap:8px; padding-left: 8px;">
          ${
            filtered.length === 0
              ? `
            <p style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:12px;">No commits found.</p>
          `
              : filtered
                  .map(
                    (c, idx) => `
            <div class="commit-item" data-commit="${c.id}" style="display:flex; gap:10px; position:relative; padding-left:14px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.04); padding:10px;">
              <span style="position:absolute; left:-4px; top:14px; width:8px; height:8px; background:var(--accent-orange); border-radius:50%; box-shadow:0 0 6px var(--accent-orange); z-index: 2;"></span>
              ${idx < filtered.length - 1 ? '<span style="position:absolute; left:-1px; top:22px; width:2px; height:calc(100% - 10px); background:rgba(255,115,0,0.25); z-index: 1;"></span>' : ''}
              
              <div style="flex:1;">
                <div class="commit-message" style="font-weight:600; font-size:0.8rem; color: var(--text-primary);">${c.message}</div>
                <div class="commit-meta" style="font-size:0.7rem; color:var(--text-muted); display:flex; justify-content:space-between; margin-top:4px;">
                  <span>${c.author} • ${formatTime(c.timestamp)}</span>
                  <span class="commit-hash" style="color:var(--accent-cyan); font-family:var(--font-mono);">${c.id.substring(0, 7)}</span>
                </div>
              </div>
            </div>
          `,
                  )
                  .join('')
          }
        </div>
      </div>
    `;
  }

  function renderBranchList(branches, tags) {
    tags = tags || [];
    return `
      <div class="branch-view-lists">
        <h4>Branches</h4>
        <div class="branch-list" style="margin-bottom: 20px;">
          ${branches
            .map((b) => {
              const isStale = b.name === 'feature/email-service' || b.behind > 2;
              return `
              <div class="branch-item ${b.name === window.state.repository.currentBranch ? 'current' : ''}" data-branch="${b.name}">
                <span class="branch-icon">${b.name === 'main' ? '◉' : '◌'}</span>
                <div class="branch-info" style="flex:1;">
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span class="branch-name">${b.name}</span>
                    ${isStale ? '<span class="badge badge-error" style="font-size:0.55rem; padding:1px 4px;">◈️ Stale</span>' : ''}
                  </div>
                  <span class="branch-meta">${b.ahead} ahead, ${b.behind} behind</span>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <h4 style="margin:0;">Releases & Tags</h4>
        </div>
        <div class="tag-list">
          ${tags
            .map(
              (t) => `
            <div class="tag-item" style="display:flex; flex-direction:column; gap:4px; padding:10px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="tag-icon">◈️</span>
                <span class="tag-name" style="font-weight:600; color:var(--accent-orange); font-size:0.8rem;">${t.name}</span>
              </div>
              <span class="tag-desc" style="font-size:0.72rem; color:var(--text-muted);">${t.message}</span>
              <button class="btn btn-xs btn-outline btn-view-changelog" data-tag="${t.name}" style="align-self:flex-start; margin-top:4px; padding:2px 6px;">View Changelog</button>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function renderSearchPanel() {
    const q = window.state.repository.searchQuery || '';
    const results = window.state.repository.searchResults || [];
    const searchType = window.state.repository.searchType || 'all';

    return `
      <div class="search-panel">
        <input type="text" class="form-input text-xs" id="repo-search-input" placeholder="Search files, symbols..." value="${q}">
        <div class="search-type-selector" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; margin-bottom:12px; margin-top:6px;">
          <button class="btn btn-xs ${searchType === 'all' ? 'btn-primary' : 'btn-outline'}" data-type="all" style="font-size:0.65rem;">All</button>
          <button class="btn btn-xs ${searchType === 'semantic' ? 'btn-primary' : 'btn-outline'}" data-type="semantic" style="font-size:0.65rem;">Semantic</button>
          <button class="btn btn-xs ${searchType === 'symbol' ? 'btn-primary' : 'btn-outline'}" data-type="symbol" style="font-size:0.65rem;">Symbols</button>
        </div>
        
        <div class="search-results-list">
          ${
            q === ''
              ? `
            <p style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:12px;">Type a query to search the codebase.</p>
          `
              : results.length === 0
                ? `
            <p style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:12px;">No results found.</p>
          `
                : results
                    .map((r) => {
                      if (searchType === 'symbol' && r.type !== 'symbol') return '';
                      if (searchType === 'semantic' && r.type !== 'semantic') return '';
                      return `
              <div class="search-result-item" data-path="${r.path}" style="padding:8px; background:rgba(255,255,255,0.02); border-radius:6px; margin-bottom:4px; cursor:pointer; display:flex; align-items:center; gap:8px;">
                <span class="badge ${r.type === 'symbol' ? 'badge-purple' : r.type === 'semantic' ? 'badge-orange' : 'badge-outline'}" style="font-size:0.65rem;">${r.type}</span>
                <div class="result-info" style="flex:1; min-width:0;">
                  <div class="result-title" style="font-size:0.78rem; font-weight:600; color:var(--text-secondary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${r.type === 'symbol' ? r.name : r.path.split('/').pop()}</div>
                  <div class="result-path" style="font-size:0.65rem; color:var(--text-muted); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${r.path}</div>
                </div>
              </div>
            `;
                    })
                    .join('')
          }
        </div>
      </div>
    `;
  }

  function renderFileView(repoState) {
    const filePath = repoState.selectedFile;
    const fileName = filePath.split('/').pop();
    const ext = fileName.split('.').pop();
    const lines = MOCK_FILE_CONTENTS[filePath] || [
      '// File content preview is unavailable for binary or empty scrolls.',
      '// Select an active code file from the files tree.',
    ];

    const showBlame = repoState.showBlame === true;
    const showIntel = repoState.showIntel === true;
    const blameData =
      MOCK_BLAME[filePath] ||
      Array(lines.length).fill({ commit: 'a1b2c3d', author: 'Jutsu Coder', date: '2026-05-29' });
    const intelTab = repoState.intelActiveSub || 'ref';

    return `
      <div class="file-view" style="display:flex; flex-direction:column; height:100%;">
        <div class="file-view-header">
          <div class="file-breadcrumbs">
            <span class="breadcrumb-root">◈</span>
            ${filePath
              .split('/')
              .map(
                (p, i, arr) => `
              <span class="breadcrumb-item">${p}</span>
              ${i < arr.length - 1 ? '<span class="breadcrumb-sep">/</span>' : ''}
            `,
              )
              .join('')}
          </div>
          <div class="file-actions">
            <button class="btn btn-sm ${showIntel ? 'btn-primary' : 'btn-outline'}" id="btn-intel-toggle">◈ Intel</button>
            <button class="btn btn-sm ${showBlame ? 'btn-primary' : 'btn-outline'}" id="btn-blame-toggle">◈ Blame</button>
            <button class="btn btn-sm btn-outline" id="btn-history-toggle">◈ History</button>
            <button class="btn btn-sm btn-outline" id="btn-close-file" aria-label="Close file">◈</button>
          </div>
        </div>

        <div style="display:flex; flex:1; overflow:hidden;">
          <div class="file-content" style="flex:1; overflow:auto;">
            <div class="code-view ${showBlame ? 'with-blame' : ''}">
              ${lines
                .map((line, i) => {
                  const b = blameData[i] ||
                    blameData[blameData.length - 1] || {
                      commit: 'a1b2c3d',
                      author: 'Unknown',
                      date: '2026-05-29',
                    };
                  return `
                  <div class="code-line">
                    ${
                      showBlame
                        ? `
                      <span class="blame-col" title="Author: ${b.author} | Date: ${b.date}">
                        <span class="blame-hash">${b.commit.substring(0, 7)}</span>
                        <span class="blame-author">${b.author.split(' ')[0]}</span>
                      </span>
                    `
                        : ''
                    }
                    <span class="line-num">${i + 1}</span>
                    <span class="line-content">${highlightCode(line, ext)}</span>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>

          ${
            showIntel
              ? `
            <div class="file-intel-panel glass-card" style="width: 260px; border-left:1px solid rgba(255,255,255,0.05); padding: 12px; background:rgba(20,16,14,0.4); overflow-y:auto; font-size:0.75rem; display:flex; flex-direction:column; gap:12px;">
              <h4 style="margin: 0; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted);">File Intelligence</h4>
              <div style="display:flex; gap:6px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px;">
                <button class="intel-sub-tab ${intelTab === 'ref' ? 'active' : ''}" data-sub="ref" style="background:transparent; border:none; color:${intelTab === 'ref' ? 'var(--accent-orange)' : 'var(--text-muted)'}; font-size:0.72rem; font-weight:600; cursor:pointer;">Usages</button>
                <button class="intel-sub-tab ${intelTab === 'callers' ? 'active' : ''}" data-sub="callers" style="background:transparent; border:none; color:${intelTab === 'callers' ? 'var(--accent-orange)' : 'var(--text-muted)'}; font-size:0.72rem; font-weight:600; cursor:pointer;">Callers</button>
                <button class="intel-sub-tab ${intelTab === 'callees' ? 'active' : ''}" data-sub="callees" style="background:transparent; border:none; color:${intelTab === 'callees' ? 'var(--accent-orange)' : 'var(--text-muted)'}; font-size:0.72rem; font-weight:600; cursor:pointer;">Callees</button>
              </div>
              <div class="intel-sub-content">
                ${
                  intelTab === 'ref'
                    ? `
                  <strong>Usages & References (3):</strong>
                  <div style="margin-top:6px; color:var(--text-secondary); display:flex; flex-direction:column; gap:4px; font-family:var(--font-mono); font-size:0.7rem;">
                    <div>src/api/auth.ts:29<br><span style="color:var(--text-muted);">import { User } from "../models/User"</span></div>
                    <div>src/api/users.ts:2<br><span style="color:var(--text-muted);">import { User } from "../models/User"</span></div>
                  </div>
                `
                    : ''
                }
                ${
                  intelTab === 'callers'
                    ? `
                  <strong>Invoked by (Callers):</strong>
                  <div style="margin-top:6px; color:var(--text-secondary); display:flex; flex-direction:column; gap:4px; font-family:var(--font-mono); font-size:0.7rem;">
                    <div>app.ts Line 12<br><span style="color:var(--text-muted);">import routers</span></div>
                  </div>
                `
                    : ''
                }
                ${
                  intelTab === 'callees'
                    ? `
                  <strong>Invokes (Callees):</strong>
                  <div style="margin-top:6px; color:var(--text-secondary); display:flex; flex-direction:column; gap:4px; font-family:var(--font-mono); font-size:0.7rem;">
                    <div>mongoose.model()</div>
                    <div>mongoose.Schema()</div>
                  </div>
                `
                    : ''
                }
              </div>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  function renderRepoOverview(repoState) {
    const fileCount = countFiles(repoState.fileTree);
    const commitsCount = repoState.commits.length;
    const branchesCount = repoState.branches.length;
    const tagsCount = repoState.tags ? repoState.tags.length : 0;

    return `
      <div class="repo-overview" style="padding:32px;">
        <h3 style="margin-bottom:8px; font-size:1.3rem;">◈ Codebase Overview</h3>
        <p style="color:var(--text-muted); font-size:0.8rem; margin-bottom:24px;">Active Branch: <span style="color:var(--accent-orange); font-weight:600;">${repoState.currentBranch.replace(/^Active Branch:\s*/i, '')}</span></p>

        <div class="repo-stats" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:32px;">
          <div class="stat-card" style="padding:16px; background:rgba(255,255,255,0.03); border-radius:10px; text-align:center; border:1px solid rgba(255,255,255,0.04);">
            <span class="stat-icon" style="font-size:1.4rem; display:block; margin-bottom:4px;">◈</span>
            <div class="stat-value" style="font-size:1.5rem; font-weight:700; color:var(--accent-orange);">${fileCount}</div>
            <div class="stat-label" style="font-size:0.72rem; color:var(--text-muted);">Total Files</div>
          </div>
          <div class="stat-card" style="padding:16px; background:rgba(255,255,255,0.03); border-radius:10px; text-align:center; border:1px solid rgba(255,255,255,0.04);">
            <span class="stat-icon" style="font-size:1.4rem; display:block; margin-bottom:4px;">◈</span>
            <div class="stat-value" style="font-size:1.5rem; font-weight:700; color:var(--accent-orange);">${branchesCount}</div>
            <div class="stat-label" style="font-size:0.72rem; color:var(--text-muted);">Branches</div>
          </div>
          <div class="stat-card" style="padding:16px; background:rgba(255,255,255,0.03); border-radius:10px; text-align:center; border:1px solid rgba(255,255,255,0.04);">
            <span class="stat-icon" style="font-size:1.4rem; display:block; margin-bottom:4px;">◈</span>
            <div class="stat-value" style="font-size:1.5rem; font-weight:700; color:var(--accent-orange);">${commitsCount}</div>
            <div class="stat-label" style="font-size:0.72rem; color:var(--text-muted);">Commits</div>
          </div>
          <div class="stat-card" style="padding:16px; background:rgba(255,255,255,0.03); border-radius:10px; text-align:center; border:1px solid rgba(255,255,255,0.04);">
            <span class="stat-icon" style="font-size:1.4rem; display:block; margin-bottom:4px;">◈️</span>
            <div class="stat-value" style="font-size:1.5rem; font-weight:700; color:var(--accent-orange);">${tagsCount}</div>
            <div class="stat-label" style="font-size:0.72rem; color:var(--text-muted);">Release Tags</div>
          </div>
        </div>

        <div class="recent-activity" style="margin-top:24px;">
          <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:12px;">Recent Activity Log</h4>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${repoState.commits
              .slice(0, 3)
              .map(
                (c) => `
              <div class="activity-item" style="display:flex; align-items:center; gap:12px; padding:12px; background:rgba(255,255,255,0.02); border-radius:8px; font-size:0.8rem;">
                <span class="activity-icon" style="color:var(--accent-orange); font-size:1.1rem;">◈</span>
                <div style="flex:1;">
                  <strong>${c.author}</strong> pushed commit <span style="font-family:var(--font-mono); color:var(--accent-cyan); font-size:0.75rem;">${c.id.substring(0, 7)}</span> to <span>${c.branch}</span>
                  <div style="color:var(--text-secondary); margin-top:2px;">"${c.message}"</div>
                </div>
                <span class="activity-time" style="font-size:0.72rem; color:var(--text-muted);">${formatTime(c.timestamp)}</span>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>

        <div style="margin-top:40px; padding:30px 20px; border:1px dashed rgba(255,115,0,0.15); border-radius:12px; text-align:center; background:rgba(255,115,0,0.01); display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted); opacity:0.4; display:inline-block; margin-bottom:8px; animation:spin-shuriken 15s infinite linear;">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" fill="rgba(255,115,0,0.05)"></path>
          </svg>
          <div style="font-size:0.78rem; color:var(--text-muted);">Select a file from the tree to view its content or Git blame annotations.</div>
        </div>
      </div>
    `;
  }

  function highlightCode(line, ext) {
    let html = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (ext === 'ts' || ext === 'js') {
      html = html
        .replace(
          /\b(import|export|from|class|interface|constructor|async|await|return|private|function|const|let|await)\b/g,
          '<span class="token-keyword">$1</span>',
        )
        .replace(
          /\b(string|number|boolean|void|any|Promise|Router|Request|Response)\b/g,
          '<span class="token-type">$1</span>',
        )
        .replace(/"[^"]*"/g, '<span class="token-string">$&</span>')
        .replace(/'[^']*'/g, '<span class="token-string">$&</span>');
    }
    return html;
  }

  function getFileIcon(node) {
    if (node.type === 'folder') return FILE_ICONS.folder;
    const ext = node.path.split('.').pop();
    return FILE_ICONS[ext] || FILE_ICONS.default;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  function countFiles(tree) {
    let count = 0;
    tree.forEach((node) => {
      if (node.type === 'file') count++;
      if (node.type === 'folder' && node.children) count += countFiles(node.children);
    });
    return count;
  }

  function attachListeners() {
    // Branch selector
    const branchSelect = document.getElementById('branch-select');
    if (branchSelect) {
      branchSelect.addEventListener('change', () => {
        window.dispatch('REPO_SELECT_BRANCH', { branch: branchSelect.value });
        window.renderRepoExplorer();
      });
    }

    // Expand / collapse folders and select files
    document.querySelectorAll('.tree-node').forEach((node) => {
      node.addEventListener('click', () => {
        const path = node.dataset.path;
        if (node.classList.contains('folder')) {
          if (expandedFolders.has(path)) {
            expandedFolders.delete(path);
          } else {
            expandedFolders.add(path);
          }
          window.renderRepoExplorer();
        } else {
          window.dispatch('REPO_SELECT_FILE', { path });
          window.renderRepoExplorer();
        }
      });
    });

    // Sidebar tabs
    document.querySelectorAll('.repo-sidebar .repo-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        window.state.repository.activeTab = tab.dataset.tab;
        window.renderRepoExplorer();
      });
    });

    // Close file button
    const closeBtn = document.getElementById('btn-close-file');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        window.state.repository.selectedFile = null;
        window.renderRepoExplorer();
      });
    }

    // Toggle Blame
    const blameBtn = document.getElementById('btn-blame-toggle');
    if (blameBtn) {
      blameBtn.addEventListener('click', () => {
        window.state.repository.showBlame = !window.state.repository.showBlame;
        window.renderRepoExplorer();
      });
    }

    // Toggle Intel
    const intelBtn = document.getElementById('btn-intel-toggle');
    if (intelBtn) {
      intelBtn.addEventListener('click', () => {
        window.state.repository.showIntel = !window.state.repository.showIntel;
        window.renderRepoExplorer();
      });
    }

    // Intel subtabs
    document.querySelectorAll('.intel-sub-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        window.state.repository.intelActiveSub = tab.dataset.sub;
        window.renderRepoExplorer();
      });
    });

    // Toggle History Tab
    const histBtn = document.getElementById('btn-history-toggle');
    if (histBtn) {
      histBtn.addEventListener('click', () => {
        window.state.repository.activeTab = 'commits';
        window.renderRepoExplorer();
      });
    }

    // Search Panel input
    const searchInput = document.getElementById('repo-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        window.state.repository.searchQuery = query;

        const results = [];
        if (query) {
          Object.entries(MOCK_FILE_CONTENTS).forEach(([path, lines]) => {
            if (path.toLowerCase().includes(query)) {
              results.push({ type: 'file', path });
            }
            lines.forEach((line, i) => {
              if (line.toLowerCase().includes(query)) {
                results.push({ type: 'symbol', name: `Line ${i + 1}: ${line.trim()}`, path });
              }
            });
          });
          // Mock semantic search results if semantic is selected or by default
          if (query.includes('auth') || query.includes('pass')) {
            results.push({
              type: 'semantic',
              name: 'Authentication routing configurations',
              path: 'src/api/auth.ts',
            });
            results.push({
              type: 'semantic',
              name: 'Cryptographic hash compliance checks',
              path: 'docs/db-schema.md',
            });
          }
        }
        window.state.repository.searchResults = results.slice(0, 15);
        window.renderRepoExplorer();
        const box = document.getElementById('repo-search-input');
        if (box) {
          box.focus();
          box.setSelectionRange(box.value.length, box.value.length);
        }
      });
    }

    // Search type buttons
    document.querySelectorAll('.search-type-selector .btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.state.repository.searchType = btn.dataset.type;
        window.renderRepoExplorer();
      });
    });

    // Search Result click
    document.querySelectorAll('.search-result-item').forEach((item) => {
      item.addEventListener('click', () => {
        const path = item.dataset.path;
        window.dispatch('REPO_SELECT_FILE', { path });
        window.renderRepoExplorer();
      });
    });

    // Commit search input
    const commitSearch = document.getElementById('commit-search');
    if (commitSearch) {
      commitSearch.addEventListener('input', (e) => {
        window.state.repository.commitSearchQuery = e.target.value.trim();
        window.renderRepoExplorer();
        const focusEl = document.getElementById('commit-search');
        if (focusEl) {
          focusEl.focus();
          focusEl.setSelectionRange(focusEl.value.length, focusEl.value.length);
        }
      });
    }

    // Commit author filter
    const commitAuthorFilter = document.getElementById('commit-author-filter');
    if (commitAuthorFilter) {
      commitAuthorFilter.addEventListener('change', () => {
        window.state.repository.commitFilterAuthor = commitAuthorFilter.value;
        window.renderRepoExplorer();
      });
    }

    // Tag changelog button
    document.querySelectorAll('.btn-view-changelog').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tagName = btn.dataset.tag;
        const tag = window.state.repository.tags.find((t) => t.name === tagName);
        window.showConfirmDialog(
          `Release Log — ${tagName}`,
          `<div style="text-align:left; font-size:0.8rem; line-height:1.4;">
             <strong>Commit Hash:</strong> <span style="font-family:var(--font-mono); color:var(--accent-cyan);">${tag.commit.substring(0, 7)}</span><br>
             <strong>Compiled Date:</strong> ${new Date(tag.created).toLocaleString()}<br><br>
             <strong>Changelog Description:</strong><br>
             <p style="color:var(--text-secondary); margin:4px 0 0 0;">${tag.message}</p>
           </div>`,
          () => {}, // close
          false,
          'Close',
        );
      });
    });

    // Create branch popup
    const newBranchBtn = document.getElementById('btn-new-branch');
    if (newBranchBtn) {
      newBranchBtn.addEventListener('click', () => {
        window.showConfirmDialog(
          'Create Branch',
          `<div style="text-align:left;">
             <label style="font-size:0.75rem; color:var(--text-muted);">New Branch Name:</label>
             <input type="text" id="new-branch-input-dialog" class="form-input text-xs" style="margin-top:6px; width:100%;" placeholder="e.g. feature/api-caching" required>
           </div>`,
          () => {
            const input = document.getElementById('new-branch-input-dialog');
            if (input && input.value.trim()) {
              const name = input.value.trim();
              window.dispatch('REPO_CREATE_BRANCH', { name });
              window.state.repository.currentBranch = name;
              window.renderRepoExplorer();
              window.showToast(`Branch ${name} created!`, 'success');
            }
          },
        );
        setTimeout(() => {
          const input = document.getElementById('new-branch-input-dialog');
          if (input) input.focus();
        }, 100);
      });
    }
  }

  function injectStyles() {
    if (document.getElementById('repo-styles-extended')) return;
    const style = document.createElement('style');
    style.id = 'repo-styles-extended';
    style.textContent = `
      .repo-layout { display: grid; grid-template-columns: 280px 1fr; height: calc(100vh - 200px); gap: 16px; }
      .repo-sidebar { background: rgba(255,255,255,0.02); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
      .branch-selector { display: flex; gap: 8px; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.01); }
      .branch-selector select { flex: 1; }
      .repo-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.1); }
      .repo-tab { flex: 1; padding: 12px 6px; background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.75rem; transition: all 0.15s; }
      .repo-tab:hover { color: var(--text-primary); }
      .repo-tab.active { color: var(--accent-orange); border-bottom: 2px solid var(--accent-orange); background: rgba(255,115,0,0.04); }
      .repo-sidebar-content { flex: 1; overflow-y: auto; padding: 12px; }
      
      .file-tree { font-size: 0.82rem; }
      .tree-node-wrapper { margin-bottom: 2px; }
      .tree-node { display: flex; align-items: center; gap: 8px; padding: 6px 8px; cursor: pointer; border-radius: 6px; transition: all 0.15s; border: 1px solid transparent; }
      .tree-node:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
      .tree-node.folder { font-weight: 600; color: var(--text-secondary); }
      .tree-node.folder::after { content: '▶'; margin-left: auto; font-size: 0.6rem; transform: rotate(0deg); transition: transform 0.15s; opacity: 0.5; }
      .tree-node.folder.expanded::after { transform: rotate(90deg); }
      .node-icon { font-size: 0.95rem; }
      .node-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .node-size { font-size: 0.7rem; color: var(--text-muted); }
      
      .commit-list { display: flex; flex-direction: column; gap: 6px; }
      .commit-item { padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; cursor: pointer; transition: all 0.15s; border: 1px solid rgba(255,255,255,0.04); }
      .commit-item:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,115,0,0.25); }
      .commit-message { font-weight: 500; font-size: 0.8rem; line-height: 1.4; }
      .commit-meta { font-size: 0.7rem; color: var(--text-muted); display: flex; gap: 8px; margin-top: 4px; }
      
      .branch-view-lists h4 { font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); margin: 0 0 10px 0; }
      .branch-list, .tag-list { display: flex; flex-direction: column; gap: 4px; }
      .branch-item, .tag-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid transparent; font-size: 0.8rem; }
      .branch-item.current { background: rgba(255,115,0,0.08); border-color: rgba(255,115,0,0.25); }
      .branch-name, .tag-name { font-weight: 600; display: block; }
      .branch-meta, .tag-desc { font-size: 0.7rem; color: var(--text-muted); }
      .branch-icon, .tag-icon { font-size: 1rem; }
      
      .search-panel input { width: 100%; margin-bottom: 8px; }
      .search-results-list { display: flex; flex-direction: column; gap: 6px; }
      .search-result-item { display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 6px; cursor: pointer; border: 1px solid transparent; }
      .search-result-item:hover { background: rgba(255,255,255,0.04); border-color: var(--accent-orange); }
      .result-title { font-size: 0.8rem; font-weight: 600; font-family: var(--font-mono); }
      .result-path { font-size: 0.7rem; color: var(--text-muted); }
      
      .repo-main { background: rgba(255,255,255,0.01); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; }
      .repo-overview { padding: 32px; }
      .repo-overview h3 { margin-bottom: 8px; font-size: 1.3rem; }
      .repo-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
      .stat-card { padding: 16px; background: rgba(255,255,255,0.03); border-radius: 10px; text-align: center; border: 1px solid rgba(255,255,255,0.04); }
      .stat-icon { font-size: 1.4rem; display: block; margin-bottom: 4px; }
      .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--accent-orange); }
      .stat-label { font-size: 0.72rem; color: var(--text-muted); }
      .recent-activity h4 { font-size: 0.85rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; }
      .activity-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 8px; font-size: 0.8rem; }
      .activity-time { font-size: 0.72rem; color: var(--text-muted); }
      
      .file-view { display: flex; flex-direction: column; height: 100%; }
      .file-view-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.01); }
      .file-breadcrumbs { display: flex; align-items: center; gap: 4px; font-size: 0.82rem; }
      .breadcrumb-item { color: var(--text-secondary); font-family: var(--font-mono); }
      .breadcrumb-sep { color: var(--text-muted); }
      .file-actions { display: flex; gap: 8px; }
      
      .file-content { flex: 1; overflow: auto; padding: 16px; background: rgba(0,0,0,0.25); }
      .code-view { font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.6; }
      .code-line { display: flex; min-height: 22px; }
      .code-line:hover { background: rgba(255,255,255,0.03); }
      .line-num { width: 44px; text-align: right; padding-right: 12px; color: var(--text-muted); user-select: none; border-right: 1px solid rgba(255,255,255,0.03); margin-right: 12px; }
      .line-content { flex: 1; white-space: pre; word-break: break-all; }
      .token-keyword { color: #ff7300; }
      .token-type { color: #00bcd4; }
      .token-string { color: #4caf50; }
      
      /* Blame Column style */
      .code-view.with-blame .code-line { display: flex; }
      .blame-col { display: flex; gap: 8px; font-size: 0.7rem; color: var(--text-muted); width: 140px; flex-shrink: 0; background: rgba(255,255,255,0.02); padding-right: 8px; user-select: none; border-right: 1px solid rgba(255,255,255,0.03); margin-right: 8px; align-items: center; }
      .blame-hash { color: var(--accent-cyan); font-family: var(--font-mono); }
      .blame-author { font-weight: 500; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    `;
    document.head.appendChild(style);
  }

  // Create debounced version for performance optimization (100ms delay)
  window.renderRepoExplorer = window.debounce
    ? window.debounce(_renderRepoExplorer, 100)
    : _renderRepoExplorer;

  window.initRepoExplorer = function () {
    window.renderRepoExplorer();
  };

  console.warn('%c[CoNinja] Repository Explorer loaded ◈', 'color:#ff7300;font-weight:bold;');
})();
