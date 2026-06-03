// Approve/Reject Decision actions
window.handleDecisionResolve = function (decisionId, approved) {
  window.dispatch('RESOLVE_DECISION', { decisionId, approved });
};

// --- REAL-TIME SIMULATION LOOP ---
window.runSimulationLoop = function () {
  setInterval(() => {
    if (window.state.systemStatus !== 'active' || !window.state.streamLogs) return;

    const timestamp = new Date().toTimeString().split(' ')[0];

    // 1. Task Progress Increments
    const activeTask = window.state.tasks.find((t) => t.status === 'in_progress');
    if (activeTask) {
      const currentProgress = activeTask.progress === undefined ? 0 : activeTask.progress;
      const nextProgress = Math.min(currentProgress + Math.floor(Math.random() * 8) + 4, 100);

      if (nextProgress >= 100) {
        window.dispatch('UPDATE_TASK', {
          taskId: activeTask.id,
          updates: {
            progress: 100,
            status: 'review',
            output:
              '[Jutsu Build Completed]\nCompiled target modules successfully.\nTesting review queued.',
          },
        });

        // Trigger smoke puff
        window.triggerSmokePuff(activeTask.id);

        // Push logs
        window.dispatch('ADD_LOG', {
          time: timestamp,
          agent: activeTask.assignee,
          type: 'success',
          msg: `Completed coding Jutsu scroll: ${activeTask.title}. Submitting for verification testing.`,
        });

        // Set assignee agent to idle
        window.dispatch('UPDATE_AGENT_STATUS', {
          agentId: activeTask.assignee,
          status: 'idle',
          currentTaskId: null,
        });

        // Trigger testing review
        const reviewTask = window.state.tasks.find((t) => t.status === 'review');
        window.dispatch('UPDATE_AGENT_STATUS', {
          agentId: 'tester',
          status: 'coding',
          currentTaskId: reviewTask ? reviewTask.id : null,
        });

        window.dispatch('ADD_LOG', {
          time: timestamp,
          agent: 'tester',
          type: 'info',
          msg: 'Kunai Tester: Dispatched automated integration test suits on module changes.',
        });
      } else {
        window.dispatch('UPDATE_TASK', {
          taskId: activeTask.id,
          updates: { progress: nextProgress },
        });

        // Periodic code edits logs
        if (Math.random() > 0.6) {
          const files = [
            'src/services/email.ts',
            'src/config/smtp.json',
            'src/controllers/notify.ts',
          ];
          const file = files[Math.floor(Math.random() * files.length)];
          window.dispatch('ADD_LOG', {
            time: timestamp,
            agent: activeTask.assignee,
            type: 'info',
            msg: `${window.state.agents[activeTask.assignee].name} patching code block in ${file}...`,
          });
        }
      }
    }

    // 2. Testing Review Progress
    const reviewTask = window.state.tasks.find((t) => t.status === 'review');
    if (reviewTask && window.state.agents.tester.status === 'coding') {
      // Simulate tests passing
      if (Math.random() > 0.8) {
        window.dispatch('UPDATE_TASK', {
          taskId: reviewTask.id,
          updates: {
            status: 'completed',
            output:
              '[Automated Integration Test Run]\nRunning: auth.test.ts\nSpecs: 12 tests passed, 0 failed\nCoverage: 87.5% lines covered.\nStealth check requested.',
          },
        });

        // Trigger smoke puff
        window.triggerSmokePuff(reviewTask.id);

        window.dispatch('ADD_LOG', {
          time: timestamp,
          agent: 'tester',
          type: 'success',
          msg: `Integration tests passed successfully for: ${reviewTask.title}.`,
        });

        window.dispatch('UPDATE_AGENT_STATUS', {
          agentId: 'tester',
          status: 'idle',
          currentTaskId: null,
        });

        // Security check dispatch
        window.dispatch('UPDATE_AGENT_STATUS', {
          agentId: 'security',
          status: 'thinking',
        });
        window.dispatch('ADD_LOG', {
          time: timestamp,
          agent: 'security',
          type: 'info',
          msg: 'Stealth Auditor started dependency check & OWASP credential vulnerability scans...',
        });

        setTimeout(() => {
          const tsVal = new Date().toTimeString().split(' ')[0];
          window.dispatch('UPDATE_AGENT_STATUS', {
            agentId: 'security',
            status: 'idle',
          });
          window.dispatch('ADD_LOG', {
            time: tsVal,
            agent: 'security',
            type: 'success',
            msg: 'Stealth Auditor checks completed. 0 vulnerabilities detected.',
          });

          if (Math.random() > 0.8) {
            window.dispatch('UPDATE_METRICS', {
              autoFixes: window.state.autoFixes + 1,
            });
          }
        }, 3000);
      } else {
        // Test runner logging
        if (Math.random() > 0.7) {
          window.dispatch('ADD_LOG', {
            time: timestamp,
            agent: 'tester',
            type: 'info',
            msg: `Kunai Tester: Executing integration spec [${Math.floor(Math.random() * 8) + 2} / 12]...`,
          });
        }
      }
    }

    // 3. Backlog dispatch (if coder is idle and database decision resolved)
    if (
      !window.state.tasks.some((t) => t.status === 'in_progress') &&
      window.state.decisions.find((d) => d.id === 'decision-01').status === 'decided'
    ) {
      const backlogTask = window.state.tasks.find((t) => t.status === 'backlog');
      if (backlogTask) {
        const matchingAgentKey = Object.keys(window.state.agents).find((key) => {
          const a = window.state.agents[key];
          return a.role === backlogTask.assignee && a.status === 'idle';
        });

        if (matchingAgentKey) {
          const agent = window.state.agents[matchingAgentKey];
          window.dispatch('UPDATE_TASK', {
            taskId: backlogTask.id,
            updates: {
              status: 'in_progress',
              progress: 0,
              duration: 'Active: 1 min elapsed',
            },
          });
          window.dispatch('UPDATE_AGENT_STATUS', {
            agentId: matchingAgentKey,
            status: 'coding',
            currentTaskId: backlogTask.id,
          });

          window.dispatch('ADD_LOG', {
            time: timestamp,
            agent: 'orchestrator',
            type: 'info',
            msg: `Sensei dispatched Task #${backlogTask.id} (${backlogTask.title}) to ${agent.name}.`,
          });
        }
      }
    }

    // 3.5. Autonomous Engine Simulation Logs
    if (window.state.agents.hunter.status === 'watching' && Math.random() > 0.8) {
      const hunterLogs = [
        'Stealth Scout: Sentry streams clear. 0 anomalies detected in production loops.',
        'Stealth Scout: Production logs verified. API gateway latencies stable at 42ms.',
        'Stealth Scout: Scanned Datadog logs. Health checks passing on all clusters.',
      ];
      window.dispatch('ADD_LOG', {
        time: timestamp,
        agent: 'hunter',
        type: 'success',
        msg: hunterLogs[Math.floor(Math.random() * hunterLogs.length)],
      });
    }

    if (window.state.agents.updater.status !== 'sleeping' && Math.random() > 0.85) {
      const updaterLogs = [
        'Debt Chunin: Running weekly cron check... 0 critical updates needed.',
        'Debt Chunin: Auditing security advisory scrolls. NPM registry package hashes verify OK.',
        'Debt Chunin: Code refactor sweep completed. Cleaned up 4 unused imports in src/controllers.',
      ];
      window.dispatch('ADD_LOG', {
        time: timestamp,
        agent: 'updater',
        type: 'info',
        msg: updaterLogs[Math.floor(Math.random() * updaterLogs.length)],
      });
    }

    const refactorToggleEl = document.getElementById('settings-refactor-toggle');
    if (refactorToggleEl && refactorToggleEl.checked && Math.random() > 0.9) {
      window.dispatch('ADD_LOG', {
        time: timestamp,
        agent: 'orchestrator',
        type: 'success',
        msg: 'Sensei: Swarm idle. Dispatched minor code quality refactoring sweep.',
      });
    }

    // 4. Random Metrics Increments
    const addedRequests = Math.floor(Math.random() * 2) + 1;
    const addedCost = parseFloat((Math.random() * 0.02 + 0.005).toFixed(4));
    let nextCost = window.state.accumulatedCost + addedCost;
    if (nextCost >= window.state.dailyLimit) {
      nextCost = window.state.dailyLimit;
    }

    window.dispatch('UPDATE_METRICS', {
      llmRequests: window.state.llmRequests + addedRequests,
      accumulatedCost: nextCost,
    });

    // 5. Update selected items panels if they are open
    if (window.state.selectedTaskId) window.selectTask(window.state.selectedTaskId);
    if (window.state.selectedAgentId) window.selectAgent(window.state.selectedAgentId);

    // Redraw lists & terminal
    window.renderKanban();
    window.renderLogs();

    // Keep Dojo Workbench interactive widgets updated
    if (typeof window.workbenchInitialized !== 'undefined' && window.workbenchInitialized) {
      window.renderChecklist();
      window.renderBrowserPreview();

      // Stream dynamic terminal activity
      if (window.state.activeTab === 'dojo-workbench' && Math.random() > 0.5) {
        const projectKey = window.getActiveProjectKey();
        const tsVal = new Date().toTimeString().split(' ')[0];
        if (projectKey === 'taskmaster') {
          const lines = [
            `[compiler] [${tsVal}] File watcher detected changes in src/services/email.ts. Recompiling...`,
            `[test-pass] [${tsVal}] ◈ email module re-compiled & mock SMTP relay tests succeeded.`,
          ];
          window.appendTerminalLine('compiler', lines[0]);
          setTimeout(() => window.appendTerminalLine('test-pass', lines[1]), 600);
        } else {
          const lines = [
            `[compiler] [${tsVal}] File watcher triggered offline storage index validation in src/config/indexeddb.ts...`,
            `[test-pass] [${tsVal}] ◈ Geodesic GPS coordinate math assertions verified.`,
          ];
          window.appendTerminalLine('compiler', lines[0]);
          setTimeout(() => window.appendTerminalLine('test-pass', lines[1]), 600);
        }
      }
    }
  }, 3000);
};
window.runExtendedSimulationLoop = function () {
  setInterval(() => {
    if (window.state.systemStatus !== 'active') return;
    const ts = new Date().toTimeString().split(' ')[0];

    // VRAM swap simulation
    if (window.state.vramSwapEnabled && Math.random() > 0.7) {
      const localAgents = Object.values(window.state.agents).filter((a) =>
        a.route.includes('Ollama'),
      );
      if (localAgents.length > 1) {
        const swapOut = localAgents[Math.floor(Math.random() * localAgents.length)];
        const swapIn = localAgents[Math.floor(Math.random() * localAgents.length)];
        if (swapOut.id !== swapIn.id) {
          if (window.state.aggressiveUnload) {
            window.dispatch('ADD_LOG', {
              time: ts,
              agent: 'system',
              type: 'warning',
              msg: `VRAM Manager: [Aggressive Unloading] Explicitly purging model for ${swapOut.name} from GPU VRAM.`,
            });
          }
          window.dispatch('ADD_LOG', {
            time: ts,
            agent: 'system',
            type: 'info',
            msg: `VRAM Manager: Hot-swapping ${swapIn.name} model [${window.state.quantizationMatrix[swapIn.role] || 'Q8_0'}] into GPU VRAM.`,
          });

          // Update VRAM active list
          window.dispatch('UPDATE_SETTING', { key: 'activeModelsInVRAM', value: [swapIn.name] });
          window.renderLogs();
          window.updateVRAMBar();
        }
      }
    }

    // Rogue Agent Sandbox Watchdog simulation
    if (window.state.watchdogEnabled && Math.random() > 0.95) {
      window.dispatch('ADD_LOG', {
        time: ts,
        agent: 'system',
        type: 'error',
        msg: `◈ WATCHDOG TRIGGERED: Agent tried to write to [C:\\Windows\\System32\\hosts] outside sandbox root [${window.state.sandboxDir}]. Halted!`,
      });
      window.renderLogs();

      // Also log it in Sandbox Multiplexer
      window.appendMultiplexerLog(
        'docker',
        `[${ts}] [sandbox-watchdog] HALTED execution: Write breach detected on C:\\Windows\\System32\\hosts`,
      );
      window.appendMultiplexerLog(
        'docker',
        `[${ts}] [sandbox-watchdog] Container 'dojo-sandbox-c1' terminated. Status code 137.`,
      );
    }

    // MCP tool execution simulation
    const activeMCPs = window.state.mcpServers.filter((s) => s.status === 'active');
    if (activeMCPs.length > 0 && Math.random() > 0.8) {
      const srv = activeMCPs[Math.floor(Math.random() * activeMCPs.length)];
      const tool = srv.tools[Math.floor(Math.random() * srv.tools.length)];

      // Check authorization matrix (simplistic check)
      const allowed =
        window.state.mcpAuthMatrix &&
        window.state.mcpAuthMatrix.coder &&
        window.state.mcpAuthMatrix.coder[srv.id];
      if (allowed !== false) {
        window.dispatch('ADD_LOG', {
          time: ts,
          agent: 'system',
          type: 'info',
          msg: `MCP Gateway [${srv.name}]: Executed tool ${tool}() autonomously.`,
        });
      } else {
        window.dispatch('ADD_LOG', {
          time: ts,
          agent: 'system',
          type: 'error',
          msg: `Security: Blocked execution of MCP tool ${srv.id}/${tool}() due to authorization restrictions.`,
        });
      }
      window.renderLogs();
    }

    // RAG query simulation
    if (window.state.ragConfig.length > 0 && Math.random() > 0.85) {
      const doc = window.state.ragConfig[Math.floor(Math.random() * window.state.ragConfig.length)];
      if (doc.status === 'Indexed') {
        window.dispatch('ADD_LOG', {
          time: ts,
          agent: 'system',
          type: 'info',
          msg: `RAG Query: Retrieved relevance chunks from [${doc.name}] context window.`,
        });
        window.renderLogs();
      }
    }

    // Custom skill execution simulation
    if (window.state.customSkills.length > 0 && Math.random() > 0.9) {
      const skill =
        window.state.customSkills[Math.floor(Math.random() * window.state.customSkills.length)];
      window.dispatch('ADD_LOG', {
        time: ts,
        agent: 'orchestrator',
        type: 'success',
        msg: `Swarm Executor: Custom skill [${skill.id}] successfully executed.`,
      });
      window.renderLogs();
    }

    // Live connection logs in MCP Registry
    if (window.state.activeTab === 'mcp-registry' && Math.random() > 0.7) {
      const logBox = document.getElementById('mcp-events-log');
      if (logBox) {
        const packets = [
          `[${ts}] Heartbeat ping from stdio tunnel... OK`,
          `[${ts}] Dynamic schema lookup requested by jutsu-coder`,
          `[${ts}] GitHub pull-request data parsed correctly`,
          `[${ts}] Headless browser screenshot stored in /workspace/screenshots/`,
        ];
        logBox.innerHTML += `<div class="log-line">${packets[Math.floor(Math.random() * packets.length)]}</div>`;
        logBox.scrollTop = logBox.scrollHeight;
      }
    }

    // Sandbox Multiplexer logs feed (runs in parallel)
    if (Math.random() > 0.4) {
      const terms = ['coder', 'tester', 'scout', 'docker'];
      const term = terms[Math.floor(Math.random() * terms.length)];

      const coderLogs = [
        `[${ts}] info  - [compiler] file modified: src/services/mcp.ts`,
        `[${ts}] info  - [compiler] compiling target modules...`,
        `[${ts}] success - [compiler] webpack compiled modules in 480ms`,
        `[${ts}] warning - [eslint] src/services/mcp.ts: L12 'state' defined but never used`,
      ];

      const testerLogs = [
        `[${ts}] run   - [tester] running assertions...`,
        `[${ts}] pass  - [tester] PASS  tests/mcp-router.test.ts (1.42s)`,
        `[${ts}] stats - [tester] Assertions: 12 passed, 0 failed, 12 total`,
        `[${ts}] pass  - [tester] Coverage gate check: 84.2% > 80% (PASS)`,
      ];

      const scoutLogs = [
        `[${ts}] fetch - [scout] loading brave documentation search results...`,
        `[${ts}] info  - [scout] scraped page: context-protocol-servers/postgres.md`,
        `[${ts}] debug - [scout] parsed schema instructions, cached 4 chunks`,
      ];

      const dockerLogs = [
        `[${ts}] sandbox - [docker] mounting directories: /workspace/node_modules`,
        `[${ts}] sandbox - [docker] enforcing network security filter (Isolated LAN)`,
        `[${ts}] sandbox - [docker] execution check: no host escapes detected`,
        `[${ts}] success - [docker] task finished, container destroyed in 2ms`,
      ];

      const logPool = {
        coder: coderLogs,
        tester: testerLogs,
        scout: scoutLogs,
        docker: dockerLogs,
      };
      const lines = logPool[term];
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      window.appendMultiplexerLog(term, randomLine);
    }
  }, 4000);
};
