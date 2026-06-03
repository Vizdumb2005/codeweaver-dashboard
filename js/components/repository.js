/* ============================================================
   CoNinja Shadow Swarm — Repository Explorer Component
   Git-style repository navigation with file tree, commits, branches
   ============================================================ */

(function () {
  'use strict';

  const REPO_ICONS = {
    get folder() {
      return window.ninjaIcons ? window.ninjaIcons.get('folder') : '◈';
    },
    get file() {
      return window.ninjaIcons ? window.ninjaIcons.get('file') : '◈';
    },
    get js() {
      return window.ninjaIcons ? window.ninjaIcons.get('code') : '◈';
    },
    get ts() {
      return window.ninjaIcons ? window.ninjaIcons.get('code') : '◈';
    },
    get json() {
      return window.ninjaIcons ? window.ninjaIcons.get('file') : '◈';
    },
    get md() {
      return window.ninjaIcons ? window.ninjaIcons.get('documentation') : '◈';
    },
    get css() {
      return window.ninjaIcons ? window.ninjaIcons.get('gear') : '◈';
    },
    get html() {
      return window.ninjaIcons ? window.ninjaIcons.get('browser') : '◈';
    },
    get yml() {
      return window.ninjaIcons ? window.ninjaIcons.get('gear') : '◈️';
    },
    get yaml() {
      return window.ninjaIcons ? window.ninjaIcons.get('gear') : '◈️';
    },
    get dockerfile() {
      return window.ninjaIcons ? window.ninjaIcons.get('square') : '◈';
    },
    get git() {
      return window.ninjaIcons ? window.ninjaIcons.get('file') : '◈';
    },
  };

  function getFileIcon(filename) {
    if (!filename) return REPO_ICONS.file;
    const ext = filename.split('.').pop().toLowerCase();
    return REPO_ICONS[ext] || REPO_ICONS.file;
  }

  function getBranchBadgeClass(name, type) {
    if (!name) return 'badge-outline';
    if (name === 'main' || name === 'master') return 'badge-success';
    if (name.startsWith('release/') || type === 'release' || type === 'protected')
      return 'badge-warning';
    return 'badge-outline';
  }

  /* ── Render Repository Explorer ──────────────────────────── */
  window.renderRepository = function () {
    const container = document.getElementById('repository-container');
    if (!container) return;

    const repo = window.state.repository;
    const currentPR = window.state.pullRequests.selectedPR;

    container.innerHTML = `
      <div class="repo-layout">
        <!-- Sidebar: Branch selector + File tree -->
        <aside class="repo-sidebar">
          <div class="repo-branch-selector">
            <div class="selector-label">Branch</div>
            <select class="form-select" id="repo-branch-select">
              ${repo.branches
                .map(
                  (b) => `
                <option value="${b.name}" ${b.name === repo.currentBranch ? 'selected' : ''}>
                  ${b.type === 'protected' ? '◈' : b.type === 'hotfix' ? '◈' : '◈'} ${b.name}
                </option>
              `,
                )
                .join('')}
            </select>
          </div>
          
          <div class="repo-search-box">
            <input type="text" id="repo-file-search" placeholder="◈ Search files..." class="form-input">
          </div>

          <div class="repo-file-tree" id="repo-file-tree">
            ${renderFileTree(repo.fileTree)}
          </div>
        </aside>

        <!-- Main: Content view -->
        <main class="repo-main">
          <!-- Tabs: Code / Commits / Blame / History -->
          <div class="repo-tabs">
            <button class="repo-tab active" data-tab="code">◈ Code</button>
            <button class="repo-tab" data-tab="commits">◈ Commits</button>
            <button class="repo-tab" data-tab="blame">◈ Blame</button>
            <button class="repo-tab" data-tab="changes">◈ Changes</button>
          </div>

          <div class="repo-content">
            <div id="repo-view-code" class="repo-view active">
              ${renderCodeView(repo.selectedFile)}
            </div>
            <div id="repo-view-commits" class="repo-view">
              ${renderCommitsView(repo.commits)}
            </div>
            <div id="repo-view-blame" class="repo-view">
              ${renderBlameView(repo.selectedFile)}
            </div>
            <div id="repo-view-changes" class="repo-view">
              ${renderChangesView(repo.commits)}
            </div>
          </div>
        </main>

        <!-- Right: Commit history mini + Tags -->
        <aside class="repo-info-panel">
          <div class="repo-section">
            <h4>Recent Commits</h4>
            <div class="commit-list-mini">
              ${repo.commits
                .slice(0, 5)
                .map(
                  (c) => `
                <div class="commit-item-mini">
                  <div class="commit-msg" title="${c.message}">${c.message.substring(0, 40)}${c.message.length > 40 ? '...' : ''}</div>
                  <div class="commit-meta">
                    <span class="commit-author">${c.author}</span>
                    <span class="commit-time">${formatTime(c.timestamp)}</span>
                  </div>
                </div>
              `,
                )
                .join('')}
            </div>
          </div>

          <div class="repo-section">
            <h4>Tags</h4>
            <div class="tag-list">
              ${repo.tags
                .map(
                  (t) => `
                <div class="tag-item">
                  <span class="tag-name">◈️ ${t.name}</span>
                  <span class="tag-commit">${t.commit.substring(0, 7)}</span>
                </div>
              `,
                )
                .join('')}
            </div>
          </div>

          <div class="repo-section">
            <h4>Branch Info</h4>
            <div class="branch-stats">
              ${(() => {
                const branch = repo.branches.find((b) => b.name === repo.currentBranch);
                if (!branch) return '';
                return `
                  <div class="stat-row">
                    <span>Ahead</span>
                    <span class="stat-value ahead">+${branch.ahead}</span>
                  </div>
                  <div class="stat-row">
                    <span>Behind</span>
                    <span class="stat-value behind">-${branch.behind}</span>
                  </div>
                  <div class="stat-row">
                    <span>Type</span>
                    <span class="badge ${getBranchBadgeClass(branch.name, branch.type)}">${branch.type}</span>
                  </div>
                `;
              })()}
            </div>
          </div>
        </aside>
      </div>
    `;

    attachRepoListeners();
    injectRepoStyles();
  };

  function renderFileTree(tree, level = 0) {
    if (!tree || !tree.length) return '<div class="empty-state">No files</div>';

    return tree
      .map((node) => {
        const indent = level * 12;
        if (node.type === 'folder') {
          return `
          <div class="tree-folder" style="padding-left: ${indent}px;">
            <div class="tree-folder-header" data-path="${node.path}">
              <span class="tree-toggle">▼</span>
              <span class="tree-icon">${REPO_ICONS.folder}</span>
              <span class="tree-label">${node.path.split('/').pop()}</span>
            </div>
            <div class="tree-children">
              ${node.children ? renderFileTree(node.children, level + 1) : ''}
            </div>
          </div>
        `;
        } else {
          const isSelected = window.state.repository.selectedFile === node.path;
          return `
          <div class="tree-file ${isSelected ? 'selected' : ''}" data-path="${node.path}" style="padding-left: ${indent + 16}px;">
            <span class="tree-icon">${getFileIcon(node.path)}</span>
            <span class="tree-label">${node.path.split('/').pop()}</span>
          </div>
        `;
        }
      })
      .join('');
  }

  function renderCodeView(filePath) {
    if (!filePath) {
      return window.renderEmptyState(
        '◈',
        'Select a file',
        'Choose a file from the tree to view its contents',
      );
    }

    // Mock file content based on path
    const content = generateMockContent(filePath);
    const lines = content.split('\n');

    return `
      <div class="code-viewer">
        <div class="code-header">
          <span class="file-path">${filePath}</span>
          <div class="code-actions">
            <button class="btn btn-sm btn-outline" id="btn-blame">◈ Blame</button>
            <button class="btn btn-sm btn-outline" id="btn-history">◈ History</button>
            <button class="btn btn-sm btn-outline" id="btn-raw">◈ Raw</button>
          </div>
        </div>
        <div class="code-content">
          <table class="code-table">
            <tbody>
              ${lines
                .map(
                  (line, i) => `
                <tr>
                  <td class="line-num">${i + 1}</td>
                  <td class="line-content"><pre>${escapeHtml(line) || ' '}</pre></td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderCommitsView(commits) {
    if (!commits || !commits.length) {
      return window.renderEmptyState('◈', 'No commits', 'Commit history will appear here');
    }

    return `
      <div class="commits-list">
        ${commits
          .map(
            (c) => `
          <div class="commit-item">
            <div class="commit-avatar">${c.author.charAt(0)}</div>
            <div class="commit-content">
              <div class="commit-message">${c.message}</div>
              <div class="commit-meta">
                <span class="commit-author">${c.author}</span>
                <span class="commit-time">${formatTime(c.timestamp)}</span>
                <span class="commit-branch badge ${getBranchBadgeClass(c.branch)}">${c.branch}</span>
              </div>
            </div>
            <div class="commit-stats">
              <span class="additions">+${c.stats.additions}</span>
              <span class="deletions">-${c.stats.deletions}</span>
            </div>
            <div class="commit-hash">${c.id.substring(0, 7)}</div>
          </div>
        `,
          )
          .join('')}
      </div>
    `;
  }

  function renderBlameView(filePath) {
    if (!filePath) {
      return window.renderEmptyState(
        '◈',
        'Select a file',
        'Blame view shows who last modified each line',
      );
    }

    const blameData = window.state.repository.blameData[filePath] || [];
    const content = generateMockContent(filePath).split('\n');

    return `
      <div class="blame-viewer">
        <div class="blame-header">
          <span class="file-path">${filePath}</span>
        </div>
        <div class="blame-content">
          <table class="blame-table">
            <tbody>
              ${content
                .map((line, i) => {
                  const blame = blameData.find((b) => b.line === i + 1);
                  return `
                  <tr>
                    <td class="blame-info">
                      ${
                        blame
                          ? `
                        <span class="blame-author">${blame.author}</span>
                        <span class="blame-time">${formatTime(blame.timestamp)}</span>
                        <span class="blame-commit">${blame.commit.substring(0, 7)}</span>
                      `
                          : '<span class="blame-none">—</span>'
                      }
                    </td>
                    <td class="line-num">${i + 1}</td>
                    <td class="line-content"><pre>${escapeHtml(line) || ' '}</pre></td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderChangesView(commits) {
    const changedFiles = [];
    commits.forEach((c) => {
      if (!changedFiles.find((f) => f.path === 'src/services/email.ts')) {
        changedFiles.push({
          path: 'src/services/email.ts',
          additions: c.stats.additions,
          deletions: c.stats.deletions,
        });
      }
    });

    return `
      <div class="changes-view">
        <div class="changes-summary">
          <h4>Recent Changes</h4>
          <div class="changes-stats">
            <span class="additions">+${commits.reduce((sum, c) => sum + c.stats.additions, 0)} additions</span>
            <span class="deletions">-${commits.reduce((sum, c) => sum + c.stats.deletions, 0)} deletions</span>
          </div>
        </div>
        <div class="changed-files-list">
          ${changedFiles
            .map(
              (f) => `
            <div class="changed-file-item">
              <span class="file-status modified">M</span>
              <span class="file-path">${f.path}</span>
              <span class="file-stats">
                <span class="additions">+${f.additions}</span>
                <span class="deletions">-${f.deletions}</span>
              </span>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function generateMockContent(filePath) {
    if (filePath.includes('User.ts')) {
      return `import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

export class User extends Model {
  public id!: number;
  public email!: string;
  public password!: string;

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

User.init({
  email: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING }
}, { sequelize, tableName: 'users' });`;
    }
    if (filePath.includes('email.ts')) {
      return `import nodemailer from 'nodemailer';
import { RateLimiter } from 'express-rate-limit';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail(options: EmailOptions) {
  return transporter.sendMail(options);
}`;
    }
    return `// ${filePath}
// File content would be displayed here
// This is mock content for demonstration purposes`;
  }

  function attachRepoListeners() {
    // Branch selector
    const branchSelect = document.getElementById('repo-branch-select');
    if (branchSelect && !branchSelect.dataset.wired) {
      branchSelect.dataset.wired = '1';
      branchSelect.addEventListener('change', (e) => {
        window.dispatch('REPO_SELECT_BRANCH', { branch: e.target.value });
        window.renderRepository();
      });
    }

    // File tree selection
    document.querySelectorAll('.tree-file').forEach((file) => {
      file.addEventListener('click', () => {
        const path = file.dataset.path;
        window.dispatch('REPO_SELECT_FILE', { path });
        window.renderRepository();
      });
    });

    // Folder toggle
    document.querySelectorAll('.tree-folder-header').forEach((folder) => {
      folder.addEventListener('click', () => {
        const parent = folder.closest('.tree-folder');
        parent.classList.toggle('collapsed');
      });
    });

    // Tab switching
    document.querySelectorAll('.repo-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.repo-tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.repo-view').forEach((v) => v.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        document.getElementById(`repo-view-${tabName}`).classList.add('active');
      });
    });

    // Search
    const searchInput = document.getElementById('repo-file-search');
    if (searchInput && !searchInput.dataset.wired) {
      searchInput.dataset.wired = '1';
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.tree-file, .tree-folder').forEach((node) => {
          const label = node.querySelector('.tree-label').textContent.toLowerCase();
          node.style.display = label.includes(query) ? '' : 'none';
        });
      });
    }
  }

  function injectRepoStyles() {
    if (document.getElementById('repo-styles')) return;
    const style = document.createElement('style');
    style.id = 'repo-styles';
    style.textContent = `
      .repo-layout { display: grid; grid-template-columns: 260px 1fr 220px; gap: 16px; height: calc(100vh - 200px); }
      .repo-sidebar { background: rgba(255,255,255,0.02); border-radius: 12px; padding: 16px; overflow-y: auto; }
      .repo-branch-selector { margin-bottom: 12px; }
      .repo-branch-selector .selector-label { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; }
      .repo-branch-selector select { width: 100%; }
      .repo-search-box { margin-bottom: 12px; }
      .repo-search-box input { width: 100%; font-size: 0.8rem; }
      .repo-file-tree { font-size: 0.85rem; }
      .tree-folder, .tree-file { padding: 4px 8px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
      .tree-folder:hover, .tree-file:hover { background: rgba(255,115,0,0.1); }
      .tree-file.selected { background: rgba(255,115,0,0.2); }
      .tree-folder.collapsed .tree-children { display: none; }
      .tree-folder.collapsed .tree-toggle { transform: rotate(-90deg); }
      .tree-toggle { display: inline-block; transition: transform 0.2s; margin-right: 4px; font-size: 0.7rem; }
      .tree-icon { margin-right: 6px; }
      .tree-label { color: var(--text-primary); }
      
      .repo-main { display: flex; flex-direction: column; background: rgba(255,255,255,0.02); border-radius: 12px; overflow: hidden; }
      .repo-tabs { display: flex; gap: 4px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .repo-tab { padding: 8px 16px; border-radius: 8px; background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.85rem; transition: all 0.15s; }
      .repo-tab:hover { color: var(--text-primary); background: rgba(255,255,255,0.05); }
      .repo-tab.active { color: var(--accent-orange); background: rgba(255,115,0,0.1); }
      .repo-content { flex: 1; overflow-y: auto; padding: 16px; }
      .repo-view { display: none; }
      .repo-view.active { display: block; }
      
      .code-viewer, .blame-viewer { height: 100%; }
      .code-header, .blame-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .file-path { font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-cyan); }
      .code-table, .blame-table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.8rem; }
      .line-num { width: 40px; text-align: right; padding: 2px 12px; color: var(--text-muted); user-select: none; }
      .line-content { padding: 2px 8px; }
      .line-content pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
      
      .blame-info { width: 200px; padding: 2px 8px; border-right: 1px solid rgba(255,255,255,0.05); }
      .blame-author { display: block; font-size: 0.75rem; color: var(--text-primary); }
      .blame-time { font-size: 0.7rem; color: var(--text-muted); }
      .blame-commit { font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-cyan); }
      
      .commits-list { display: flex; flex-direction: column; gap: 12px; }
      .commit-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 10px; }
      .commit-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #ff7300, #ffb300); display: flex; align-items: center; justify-content: center; font-weight: 600; color: #fff; }
      .commit-content { flex: 1; }
      .commit-message { font-weight: 500; margin-bottom: 4px; }
      .commit-meta { font-size: 0.75rem; color: var(--text-muted); }
      .commit-stats { display: flex; gap: 8px; font-family: var(--font-mono); font-size: 0.8rem; }
      .commit-stats .additions { color: #4CAF50; }
      .commit-stats .deletions { color: #ef4444; }
      .commit-hash { font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-cyan); }
      
      .repo-info-panel { background: rgba(255,255,255,0.02); border-radius: 12px; padding: 16px; overflow-y: auto; }
      .repo-section { margin-bottom: 24px; }
      .repo-section h4 { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
      .commit-list-mini { display: flex; flex-direction: column; gap: 8px; }
      .commit-item-mini { padding: 8px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 0.75rem; }
      .commit-item-mini .commit-msg { color: var(--text-primary); margin-bottom: 4px; }
      .commit-item-mini .commit-meta { color: var(--text-muted); font-size: 0.7rem; }
      
      .tag-list { display: flex; flex-direction: column; gap: 6px; }
      .tag-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 0.75rem; }
      .tag-name { color: var(--text-primary); }
      .tag-commit { font-family: var(--font-mono); color: var(--text-muted); }
      
      .branch-stats { display: flex; flex-direction: column; gap: 8px; }
      .stat-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; }
      .stat-value.ahead { color: #4CAF50; }
      .stat-value.behind { color: #ef4444; }
      
      .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
      .empty-state-icon { font-size: 3rem; margin-bottom: 16px; }
    `;
    document.head.appendChild(style);
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  window.initRepository = function () {
    window.renderRepository();
  };

  console.warn('%c[CoNinja] Repository Explorer loaded ◈', 'color:#ff7300;font-weight:bold;');
})();
