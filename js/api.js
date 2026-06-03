// ============================================================
// API Service Layer — Mock-ready, backend-compatible
// All data access goes through these functions.
// Swap mock implementations for real fetch() calls later.
// ============================================================

(function () {
  'use strict';

  // ── Simulated Network Delay ───────────────────────────────
  const DELAY_MS = 200; // realistic async delay

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms || DELAY_MS));
  }

  // ── Mock Data Adapters ───────────────────────────────────
  // These read from window.state but could call fetch() in future.

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // ── API Functions ─────────────────────────────────────────

  window.api = {
    /** Fetch project metadata */
    async fetchProject() {
      // TODO: Backend integration with ticket references (e.g. [CN-201])
      await delay();
      return {
        name: window.state.activeProject,
        status: window.state.systemStatus,
        budget: { spent: window.state.accumulatedCost, limit: window.state.dailyLimit },
        autonomy: window.state.autonomyLevel,
        llmRequests: window.state.llmRequests,
        autoFixes: window.state.autoFixes,
        avgConfidence: window.state.avgConfidence,
        testCoverage: window.state.testCoverage,
      };
    },

    /** Fetch all agents */
    async fetchAgents() {
      // TODO: Backend integration with ticket references (e.g. [CN-202])
      await delay();
      return clone(Object.values(window.state.agents));
    },

    /** Fetch a single agent by ID */
    async fetchAgent(agentId) {
      // TODO: Backend integration with ticket references (e.g. [CN-203])
      await delay();
      const agent = window.state.agents[agentId];
      if (!agent) throw new Error(`Agent not found: ${agentId}`);
      return clone(agent);
    },

    /** Fetch all tasks, optionally filtered by status */
    async fetchTasks(status) {
      // TODO: Backend integration with ticket references (e.g. [CN-204])
      await delay();
      let tasks = clone(window.state.tasks);
      if (status) {
        tasks = tasks.filter((t) => t.status === status);
      }
      return tasks;
    },

    /** Fetch a single task by ID */
    async fetchTask(taskId) {
      // TODO: Backend integration with ticket references (e.g. [CN-205])
      await delay();
      const task = window.state.tasks.find((t) => t.id === taskId);
      if (!task) throw new Error(`Task not found: ${taskId}`);
      return clone(task);
    },

    /** Update a task (status, progress, output, etc.)
     *  Returns the updated task.
     */
    async updateTask(taskId, updates) {
      // TODO: Backend integration with ticket references (e.g. [CN-206])
      await delay();
      const task = window.state.tasks.find((t) => t.id === taskId);
      if (!task) throw new Error(`Task not found: ${taskId}`);
      Object.assign(task, updates);
      // Trigger UI re-renders
      window.renderKanban();
      if (window.state.selectedTaskId === taskId) {
        window.selectTask(taskId);
      }
      return clone(task);
    },

    /** Update an agent's status */
    async updateAgentStatus(agentId, status, currentTaskId) {
      // TODO: Backend integration with ticket references (e.g. [CN-207])
      await delay(100);
      const agent = window.state.agents[agentId];
      if (!agent) throw new Error(`Agent not found: ${agentId}`);
      agent.status = status;
      if (currentTaskId !== undefined) {
        agent.currentTaskId = currentTaskId;
      }
      if (window.state.selectedAgentId === agentId) {
        window.selectAgent(agentId);
      }
      return clone(agent);
    },

    /** Fetch all decisions */
    async fetchDecisions() {
      await delay();
      return clone(window.state.decisions);
    },

    /** Resolve a decision (approve/override) */
    async resolveDecision(decisionId, approved) {
      await delay();
      window.dispatch('RESOLVE_DECISION', { decisionId, approved });
      return { success: true, decisionId, approved };
    },

    /** Fetch log entries, optionally filtered */
    async fetchLogs(filters) {
      await delay(100);
      let logs = clone(window.state.consoleLogs);
      if (filters) {
        if (filters.agent && filters.agent !== 'all') {
          logs = logs.filter((l) => l.agent === filters.agent);
        }
        if (filters.search) {
          const q = filters.search.toLowerCase();
          logs = logs.filter(
            (l) => l.msg.toLowerCase().includes(q) || l.agent.toLowerCase().includes(q),
          );
        }
        if (filters.limit) {
          logs = logs.slice(-filters.limit);
        }
      }
      return logs;
    },

    /** Add a log entry */
    async addLog(agent, type, msg) {
      await delay(50);
      window.addLog(agent, type, msg);
      return { success: true };
    },

    /** Clear all logs */
    async clearLogs() {
      await delay(100);
      window.state.consoleLogs = [];
      window.renderLogs();
      return { success: true };
    },

    /** Update a single setting value */
    async updateSetting(key, value) {
      await delay(50);
      window.dispatch('UPDATE_SETTING', { key, value });
      return { success: true, key, value };
    },

    /** Update multiple settings at once */
    async updateSettings(settingsObj) {
      await delay(100);
      Object.entries(settingsObj).forEach(([key, value]) => {
        window.dispatch('UPDATE_SETTING', { key, value });
      });
      return { success: true, updated: Object.keys(settingsObj).length };
    },

    /** Fetch current metrics (budget, requests, fixes, etc.) */
    async fetchMetrics() {
      await delay();
      return {
        accumulatedCost: window.state.accumulatedCost,
        dailyLimit: window.state.dailyLimit,
        llmRequests: window.state.llmRequests,
        autoFixes: window.state.autoFixes,
        avgConfidence: window.state.avgConfidence,
        testCoverage: window.state.testCoverage,
      };
    },

    /** Fetch MCP servers */
    async fetchMCPServers() {
      await delay();
      return clone(window.state.mcpServers);
    },

    /** Toggle an MCP server on/off */
    async toggleMCPServer(serverId, status) {
      await delay(150);
      window.dispatch('TOGGLE_MCP_SERVER', { serverId, status });
      return { success: true, serverId, status };
    },

    /** Add a new MCP server */
    async addMCPServer(serverData) {
      await delay(200);
      window.dispatch('ADD_MCP_SERVER', serverData);
      return { success: true, id: serverData.id };
    },

    /** Fetch RAG configuration documents */
    async fetchRAGDocs() {
      await delay();
      return clone(window.state.ragConfig);
    },

    /** Ingest a new RAG document */
    async ingestRAGDoc(filename) {
      await delay(300);
      const chunks = Math.floor(Math.random() * 30) + 8;
      window.dispatch('INGEST_RAG_DOC', {
        name: filename,
        size: `${Math.floor(Math.random() * 50) + 5} KB`,
        status: 'Indexing...',
        chunks,
      });
      // Simulate indexing completion
      setTimeout(() => {
        window.dispatch('UPDATE_RAG_DOC_STATUS', { name: filename, status: 'Indexed' });
      }, 2000);
      return { success: true, name: filename, chunks };
    },

    /** Fetch custom skills */
    async fetchCustomSkills() {
      await delay();
      return clone(window.state.customSkills);
    },

    /** Save an agent prompt */
    async savePrompt(role, prompt) {
      await delay(150);
      window.dispatch('SAVE_PROMPT', { role, prompt });
      return { success: true, role };
    },

    /** Forge a new custom skill */
    async forgeSkill(skillData) {
      await delay(200);
      window.dispatch('FORGE_SKILL', skillData);
      return { success: true, id: skillData.id };
    },

    /** Delete a custom skill */
    async deleteSkill(skillId) {
      await delay(100);
      window.dispatch('DELETE_SKILL', { id: skillId });
      return { success: true, id: skillId };
    },

    /** Generate a new project from a wizard prompt */
    async generateProject(promptText, answersText, vcsConfig) {
      await delay(500);
      const projectTitle =
        promptText.length > 30 ? `${promptText.substring(0, 27)}...` : promptText;
      const tasks = [
        {
          id: 'gen-01',
          title: 'Design Core Architecture',
          desc: 'Architect system based on provided requirements.',
          status: 'in_progress',
          assignee: 'architect',
          priority: 5,
          complexity: 'complex',
          duration: '1 min elapsed',
          attempts: '1 / 3',
          tags: ['#architecture'],
          deps: [],
          progress: 10,
          output: '',
        },
        {
          id: 'gen-02',
          title: 'Implement Backend Services',
          desc: 'Build core business logic and API endpoints.',
          status: 'backlog',
          assignee: 'coder1',
          priority: 4,
          complexity: 'medium',
          duration: 'Pending',
          attempts: '0 / 3',
          tags: ['#backend'],
          deps: ['gen-01'],
          output: '',
        },
        {
          id: 'gen-03',
          title: 'Build Frontend UI',
          desc: 'Create user interface components and state management.',
          status: 'backlog',
          assignee: 'coder2',
          priority: 3,
          complexity: 'medium',
          duration: 'Pending',
          attempts: '0 / 3',
          tags: ['#frontend'],
          deps: ['gen-01'],
          output: '',
        },
      ];
      window.dispatch('INIT_NEW_PROJECT', { projectTitle, tasks, vcsConfig });
      return { success: true, projectTitle, tasks };
    },

    // ── Agent Studio API ─────────────────────────────────
    agents: {
      async list() {
        await delay();
        return clone(Object.values(window.state.agents));
      },
      async get(id) {
        await delay();
        const a = window.state.agents[id];
        if (!a) throw new Error(`Agent not found: ${id}`);
        return clone(a);
      },
      async create(data) {
        await delay(300);
        const id = `agent-${Date.now()}`;
        const newAgent = { id, status: 'idle', currentTaskId: null, cost: 0, ...data };
        window.state.agents[id] = newAgent;
        window.addLog('system', 'success', `New shinobi [${data.name}] joined the clan.`);
        return clone(newAgent);
      },
      async update(id, updates) {
        await delay(200);
        const agent = window.state.agents[id];
        if (!agent) throw new Error(`Agent not found: ${id}`);
        Object.assign(agent, updates);
        if (window.state.selectedAgentId === id) window.selectAgent(id);
        return clone(agent);
      },
      async delete(id) {
        await delay(200);
        const agent = window.state.agents[id];
        if (!agent) throw new Error(`Agent not found: ${id}`);
        const name = agent.name;
        delete window.state.agents[id];
        window.addLog('system', 'warning', `Shinobi [${name}] has left the clan.`);
        return { success: true, id };
      },
      async getMetrics(id) {
        await delay();
        return {
          tasksCompleted: Math.floor(Math.random() * 50) + 5,
          successRate: Math.floor(Math.random() * 20) + 80,
          avgResponseTime: Math.floor(Math.random() * 2000) + 500,
          totalCost: (Math.random() * 2).toFixed(2),
          uptime: '99.2%',
        };
      },
    },

    // ── Workflow API ──────────────────────────────────────
    workflow: {
      async getPipeline() {
        await delay();
        return clone(window.state.workflow);
      },
      async updateStage(stageId, updates) {
        await delay(150);
        window.dispatch('WORKFLOW_UPDATE_STAGE', { stageId, updates });
        return { success: true };
      },
      async addApprovalGate(stageId) {
        await delay(200);
        const stage = window.state.workflow.stages.find((s) => s.id === stageId);
        if (stage) stage.approvalRequired = true;
        return { success: true };
      },
    },

    // ── Debate API ───────────────────────────────────────
    debate: {
      async getSessions() {
        await delay();
        return clone(window.state.debate.sessions);
      },
      async getSession(id) {
        await delay();
        const s = window.state.debate.sessions.find((s) => s.id === id);
        if (!s) throw new Error(`Session not found: ${id}`);
        return clone(s);
      },
      async createSession(data) {
        await delay(300);
        const id = `debate-${Date.now()}`;
        const session = {
          id,
          status: 'open',
          createdAt: new Date().toISOString(),
          decidedAt: null,
          winnerId: null,
          humanOverride: false,
          ...data,
        };
        window.state.debate.sessions.unshift(session);
        return clone(session);
      },
      async decide(sessionId, winnerId, rationale) {
        await delay(200);
        const s = window.state.debate.sessions.find((s) => s.id === sessionId);
        if (s) {
          s.winnerId = winnerId;
          s.rationale = rationale;
          s.status = 'decided';
          s.decidedAt = new Date().toISOString();
        }
        return { success: true };
      },
      async generateADR(sessionId) {
        await delay(500);
        const s = window.state.debate.sessions.find((s) => s.id === sessionId);
        if (s) s.adrGenerated = true;
        return {
          adr: `# ADR-${sessionId}\n\n## Status\nAccepted\n\n## Context\n${s?.title}\n\n## Decision\n${s?.rationale}\n\n## Consequences\nThis decision shapes the architecture going forward.`,
        };
      },
    },

    // ── Memory API ───────────────────────────────────────
    memory: {
      async getSettings() {
        await delay();
        return clone({
          vector: window.state.memory.vectorSettings,
          graph: window.state.memory.graphSettings,
        });
      },
      async search(query) {
        await delay(300);
        const results = [
          {
            id: `mr-${Date.now()}-1`,
            content: `${query} — Found in src/models/User.ts:42. bcrypt.hash called with strength 12.`,
            relevance: 0.94,
            source: 'src/models/User.ts',
            tags: ['#auth', '#security'],
          },
          {
            id: `mr-${Date.now()}-2`,
            content: `${query} — Referenced in docs/db-schema.md. User entity has email field with UNIQUE constraint.`,
            relevance: 0.87,
            source: 'docs/db-schema.md',
            tags: ['#db', '#schema'],
          },
        ];
        window.state.memory.searchResults = results;
        window.state.memory.searchQuery = query;
        return results;
      },
      async impact(changeDesc) {
        await delay(500);
        return {
          affectedFiles: [
            'src/models/User.ts',
            'src/controllers/auth.ts',
            'tests/integration/auth.test.ts',
          ],
          affectedTests: 6,
          riskLevel: 'medium',
          summary: `Changing ${changeDesc} affects 3 files and 6 tests. Risk: MEDIUM.`,
        };
      },
      async pin(entryId) {
        await delay(100);
        const entry = window.state.memory.pinnedEntries.find((e) => e.id === entryId);
        if (entry) entry.pinned = true;
        return { success: true };
      },
      async export() {
        await delay(800);
        return { success: true, exported: window.state.memory.totalEntries, format: 'jsonl' };
      },
    },

    // ── Testing API ──────────────────────────────────────
    testing: {
      async getSuites() {
        await delay();
        return clone(window.state.testing.suites);
      },
      async rerunSuite(suiteId) {
        await delay(200);
        const suite = window.state.testing.suites.find((s) => s.id === suiteId);
        if (suite) {
          suite.status = 'running';
          suite.passed = 0;
          suite.failed = 0;
          window.addLog('tester', 'info', `Kunai Tester: Rerunning suite [${suite.name}]...`);
          setTimeout(() => {
            suite.status = 'passed';
            suite.passed = suite.total;
            suite.failed = 0;
            suite.coverage = Math.min(suite.coverage + 5, 100);
            window.addLog(
              'tester',
              'success',
              `Suite [${suite.name}] — all ${suite.total} tests passed.`,
            );
          }, 3000);
        }
        return { success: true };
      },
      async rerunAll() {
        await delay(200);
        window.state.testing.runnerStatus = 'running';
        window.addLog('tester', 'info', 'Kunai Tester: Full test suite sweep initiated...');
        setTimeout(() => {
          window.state.testing.runnerStatus = 'idle';
          window.addLog('tester', 'success', 'All tests complete. Coverage: 87.2%');
        }, 5000);
        return { success: true };
      },
      async getCoverage() {
        await delay();
        return {
          overall: window.state.testing.overallCoverage,
          threshold: window.state.testing.coverageThreshold,
          byFile: [],
        };
      },
    },

    // ── Security API ─────────────────────────────────────
    security: {
      async getReport() {
        await delay();
        return clone(window.state.security);
      },
      async runScan() {
        await delay(200);
        window.dispatch('TRIGGER_SECURITY_SCAN');
        return { success: true, status: 'scanning' };
      },
      async getVulnerabilities() {
        await delay();
        return clone(window.state.security.vulnerabilities);
      },
      async approveAction(actionId) {
        await delay(200);
        window.addLog('security', 'success', `Security approval granted for action: ${actionId}`);
        return { success: true };
      },
      async patchVulnerability(vulnId) {
        await delay(1000);
        const v = window.state.security.vulnerabilities.find((v) => v.id === vulnId);
        if (v) v.status = 'patched';
        window.addLog('security', 'success', `Vulnerability ${vulnId} patched successfully.`);
        return { success: true };
      },
    },

    // ── Deployment API ───────────────────────────────────
    deployment: {
      async getEnvironments() {
        await delay();
        return clone(window.state.deployment.environments);
      },
      async deploy(envId, changelog) {
        await delay(200);
        window.dispatch('TRIGGER_DEPLOYMENT', { envId, changelog });
        return { success: true, status: 'deploying' };
      },
      async rollback(envId) {
        await delay(200);
        const env = window.state.deployment.environments.find((e) => e.id === envId);
        if (env) {
          window.addLog(
            'devops',
            'warning',
            `Chunin DevOps: Smoke bomb deployed! Rolling back ${env.name}...`,
          );
          setTimeout(() => {
            window.addLog(
              'devops',
              'success',
              `Rollback to previous version complete for ${env.name}.`,
            );
          }, 2000);
        }
        return { success: true };
      },
      async getHistory() {
        await delay();
        return clone(window.state.deployment.releaseHistory);
      },
    },

    // ── Monitoring API ───────────────────────────────────
    monitoring: {
      async getHealth() {
        await delay();
        return clone(window.state.monitoring.health);
      },
      async getCostHistory(range) {
        await delay();
        return clone(window.state.monitoring.costHistory);
      },
      async getErrors() {
        await delay();
        return clone(window.state.monitoring.errorLog);
      },
      async getAlerts() {
        await delay();
        return clone(window.state.monitoring.alerts);
      },
    },

    // ── Backup API ───────────────────────────────────────
    backup: {
      async list() {
        await delay();
        return clone(window.state.backup.snapshots);
      },
      async create(name) {
        await delay(500);
        window.dispatch('CREATE_BACKUP_SNAPSHOT', { name });
        return { success: true };
      },
      async restore(snapId) {
        await delay(1000);
        window.addLog('system', 'info', `Restoring snapshot: ${snapId}...`);
        setTimeout(
          () => window.addLog('system', 'success', 'Snapshot restored successfully.'),
          2000,
        );
        return { success: true };
      },
      async exportProject() {
        await delay(800);
        window.addLog('system', 'info', 'Exporting full project state...');
        return { success: true, filename: `coninja-export-${Date.now()}.json` };
      },
    },

    // ── Notifications API ────────────────────────────────
    notifications: {
      async list() {
        await delay();
        const notifs = Array.isArray(window.state.notifications)
          ? window.state.notifications
          : window.state.notifications?.items || [];
        return clone(notifs);
      },
      async markRead(id) {
        await delay(50);
        window.dispatch('MARK_NOTIF_READ', { id });
        return { success: true };
      },
      async markAllRead() {
        await delay(100);
        window.dispatch('MARK_ALL_NOTIFS_READ');
        return { success: true };
      },
      async dismiss(id) {
        await delay(50);
        if (Array.isArray(window.state.notifications)) {
          window.state.notifications = window.state.notifications.filter((n) => n.id !== id);
        } else if (window.state.notifications && window.state.notifications.items) {
          window.state.notifications.items = window.state.notifications.items.filter(
            (n) => n.id !== id,
          );
        }
        return { success: true };
      },
    },

    // ── Permissions API ──────────────────────────────────
    permissions: {
      async getRoles() {
        await delay();
        return clone(window.state.permissions.roles);
      },
      async getMatrix() {
        await delay();
        return clone(window.state.permissions.matrix);
      },
      async updateMatrix(roleId, permission, value) {
        await delay(150);
        if (window.state.permissions.matrix[roleId]) {
          window.state.permissions.matrix[roleId][permission] = value;
        }
        window.addLog('system', 'info', `Permissions updated: ${roleId} — ${permission}: ${value}`);
        return { success: true };
      },
    },

    // === NEW: Repository API ===
    repository: {
      async getBranches() {
        await delay();
        return clone(window.state.repository.branches);
      },
      async getCommits(branch) {
        await delay();
        let commits = clone(window.state.repository.commits);
        if (branch) commits = commits.filter((c) => c.branch === branch);
        return commits;
      },
      async getTags() {
        await delay();
        return clone(window.state.repository.tags);
      },
      async getFileTree() {
        await delay();
        return clone(window.state.repository.fileTree);
      },
      async getBlame(filePath) {
        await delay();
        return clone(window.state.repository.blameData[filePath] || []);
      },
      async search(query) {
        await delay(300);
        window.dispatch('REPO_SEARCH', { query });
        return clone(window.state.repository.searchResults);
      },
      async switchBranch(branchName) {
        await delay(200);
        window.dispatch('REPO_SELECT_BRANCH', { branch: branchName });
        return { success: true, branch: branchName };
      },
    },

    // === NEW: Pull Request API ===
    pullRequests: {
      async list(filter = 'all') {
        await delay();
        let prs = clone(window.state.pullRequests.list);
        if (filter !== 'all') prs = prs.filter((p) => p.status === filter);
        return prs;
      },
      async get(prId) {
        await delay();
        const pr = window.state.pullRequests.list.find((p) => p.id === prId);
        if (!pr) throw new Error(`PR not found: ${prId}`);
        return clone(pr);
      },
      async create(data) {
        await delay(300);
        window.dispatch('PR_CREATE', data);
        return { success: true };
      },
      async updateStatus(prId, status) {
        await delay(200);
        window.dispatch('PR_UPDATE_STATUS', { prId, status });
        return { success: true };
      },
      async addReview(prId, reviewer, status, comments) {
        await delay(200);
        window.dispatch('PR_ADD_REVIEW', { prId, reviewer, status, comments });
        return { success: true };
      },
      async getDiff(prId) {
        await delay(300);
        // Mock diff data
        return {
          files: [
            {
              path: 'src/services/email.ts',
              additions: 45,
              deletions: 3,
              hunks: [
                {
                  oldStart: 1,
                  oldLines: 10,
                  newStart: 1,
                  newLines: 15,
                  lines: [
                    { type: 'context', content: 'import nodemailer from "nodemailer";' },
                    {
                      type: 'add',
                      content: 'import { RateLimiter } from "express-rate-limit";',
                      newLine: 5,
                    },
                    { type: 'context', content: '' },
                  ],
                },
              ],
            },
          ],
        };
      },
    },

    // === NEW: Provenance API ===
    provenance: {
      async getTraces(filters = {}) {
        await delay();
        let traces = clone(window.state.provenance.traces);
        if (filters.agent && filters.agent !== 'all') {
          traces = traces.filter((t) => t.agentId === filters.agent);
        }
        if (filters.action && filters.action !== 'all') {
          traces = traces.filter((t) => t.action === filters.action);
        }
        return traces;
      },
      async getTrace(traceId) {
        await delay();
        const trace = window.state.provenance.traces.find((t) => t.id === traceId);
        if (!trace) throw new Error(`Trace not found: ${traceId}`);
        return clone(trace);
      },
      async replay(traceId) {
        await delay(500);
        window.addLog('system', 'info', `Replaying trace: ${traceId}`);
        return { success: true };
      },
    },

    // === NEW: Approvals API ===
    approvals: {
      async getQueue() {
        await delay();
        return clone(window.state.approvals.queue);
      },
      async getHistory() {
        await delay();
        return clone(window.state.approvals.history);
      },
      async request(data) {
        await delay(300);
        window.dispatch('APPROVAL_REQUEST', data);
        return { success: true };
      },
      async resolve(approvalId, approved, resolver) {
        await delay(200);
        window.dispatch('APPROVAL_RESOLVE', { approvalId, approved, resolver });
        return { success: true };
      },
    },

    // === NEW: Projects API ===
    projects: {
      async list() {
        await delay();
        return clone(window.state.projects.list);
      },
      async get(projectId) {
        await delay();
        const project = window.state.projects.list.find((p) => p.id === projectId);
        if (!project) throw new Error(`Project not found: ${projectId}`);
        return clone(project);
      },
      async create(data) {
        await delay(500);
        window.dispatch('PROJECT_CREATE', data);
        return { success: true };
      },
      async switch(projectId) {
        await delay(200);
        window.dispatch('PROJECT_SWITCH', { projectId });
        return { success: true };
      },
      async getTemplates() {
        await delay();
        return clone(window.state.projects.templates);
      },
    },

    // === NEW: Incidents API ===
    incidents: {
      async getActive() {
        await delay();
        return clone(window.state.incidents.active);
      },
      async getResolved() {
        await delay();
        return clone(window.state.incidents.resolved);
      },
      async create(data) {
        await delay(300);
        window.dispatch('INCIDENT_CREATE', data);
        return { success: true };
      },
      async resolve(incidentId, resolution) {
        await delay(200);
        window.dispatch('INCIDENT_RESOLVE', { incidentId, resolution });
        return { success: true };
      },
      async addTimelineEvent(incidentId, event, type) {
        await delay(100);
        window.dispatch('INCIDENT_UPDATE', { incidentId, event, type });
        return { success: true };
      },
      async getRunbooks() {
        await delay();
        return clone(window.state.incidents.runbooks);
      },
    },

    // === NEW: Feature Flags API ===
    featureFlags: {
      async list() {
        await delay();
        return clone(window.state.featureFlags.flags);
      },
      async update(flagId, updates) {
        await delay(200);
        window.dispatch('FLAG_UPDATE', { flagId, updates });
        return { success: true };
      },
      async toggle(flagId) {
        await delay(150);
        window.dispatch('FLAG_TOGGLE', { flagId });
        return { success: true };
      },
    },

    // === NEW: Secrets API ===
    secrets: {
      async getEnvVars() {
        await delay();
        return clone(window.state.secrets.envVars);
      },
      async getApiKeys() {
        await delay();
        return clone(window.state.secrets.apiKeys);
      },
      async rotate(secretId) {
        await delay(500);
        window.dispatch('SECRET_ROTATE', { secretId });
        return { success: true };
      },
      async create(type, data) {
        await delay(300);
        window.dispatch('SECRET_CREATE', { type, ...data });
        return { success: true };
      },
    },

    // === NEW: Collaboration API ===
    collaboration: {
      async getThreads() {
        await delay();
        return clone(window.state.collaboration.threads);
      },
      async getTeamActivity() {
        await delay();
        return clone(window.state.collaboration.teamActivity);
      },
      async createThread(data) {
        await delay(200);
        window.dispatch('THREAD_CREATE', data);
        return { success: true };
      },
      async postMessage(threadId, from, content) {
        await delay(150);
        window.dispatch('THREAD_MESSAGE', { threadId, from, content });
        return { success: true };
      },
    },

    // === NEW: Analytics API ===
    analytics: {
      async getCostByAgent() {
        await delay();
        return clone(window.state.analytics.costByAgent);
      },
      async getCostByTask() {
        await delay();
        return clone(window.state.analytics.costByTask);
      },
      async getQualityTrends() {
        await delay();
        return clone(window.state.analytics.qualityTrends);
      },
      async getMTTR() {
        await delay();
        return clone(window.state.analytics.mttr);
      },
    },

    // === NEW: Intelligence API ===
    intelligence: {
      async getDependencies() {
        await delay();
        return clone(window.state.intelligence.dependencies);
      },
      async getSymbols(query) {
        await delay();
        let symbols = clone(window.state.intelligence.symbols);
        if (query) symbols = symbols.filter((s) => s.name.includes(query));
        return symbols;
      },
      async analyzeImpact(target) {
        await delay(500);
        window.dispatch('IMPACT_ANALYZE', { target });
        return clone(window.state.intelligence.impactAnalysis);
      },
      async searchCode(query) {
        await delay(400);
        return [
          {
            type: 'file',
            path: 'src/services/email.ts',
            matches: [{ line: 45, content: 'async sendEmail(options: EmailOptions)' }],
          },
          { type: 'symbol', name: 'sendEmail', path: 'src/services/email.ts:45' },
        ].filter((r) => r.path.includes(query) || r.name?.includes(query));
      },
    },
  };

  // ── Backward compatibility aliases ───────────────────────
  window.fetchProject = window.api.fetchProject;
  window.fetchAgents = window.api.fetchAgents;
  window.fetchTasks = window.api.fetchTasks;
  window.updateTask = window.api.updateTask;
  window.fetchDecisions = window.api.fetchDecisions;
  window.fetchLogs = window.api.fetchLogs;
  window.updateSettings = window.api.updateSettings;
})();
