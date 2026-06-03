// ============================================================
// SANDBOX MULTIPLEXER (tmux for Agents)
// ============================================================
window.initSandboxMultiplexer = function () {
  // Add title/label support for clear buttons (fixes #056)
  document.querySelectorAll('.term-clear').forEach((btn) => {
    btn.title = btn.title || 'Clear Buffer';
    btn.setAttribute('aria-label', 'Clear terminal buffer');
    btn.onclick = () => {
      const term = btn.dataset.term;
      window.state.multiplexerLogs[term] = [];
      const termBody = document.getElementById(`term-${term}-body`);
      if (termBody) termBody.innerHTML = '';
    };
  });

  // Ensure pause buttons have proper aria labels
  document.querySelectorAll('.term-pause').forEach((btn) => {
    btn.setAttribute(
      'aria-label',
      btn.dataset.term ? `Toggle pause for ${btn.dataset.term}` : 'Toggle pause',
    );
  });

  // Add tooltip to all terminal action buttons (fixes the unlabeled "+" issue)
  document.querySelectorAll('.multiplexer-panel .terminal-actions button').forEach((btn) => {
    if (!btn.title) {
      if (btn.classList.contains('term-clear')) btn.title = 'Clear Buffer';
      else if (btn.classList.contains('term-pause')) btn.title = 'Pause Stream';
    }
  });

  document.querySelectorAll('.term-pause').forEach((btn) => {
    const term = btn.dataset.term;
    btn.innerHTML = window.state.multiplexerPaused[term]
      ? window.ninjaIcons.get('play')
      : window.ninjaIcons.get('pause');
    btn.onclick = () => {
      window.state.multiplexerPaused[term] = !window.state.multiplexerPaused[term];
      btn.innerHTML = window.state.multiplexerPaused[term]
        ? window.ninjaIcons.get('play')
        : window.ninjaIcons.get('pause');
      btn.title = window.state.multiplexerPaused[term] ? 'Resume Stream' : 'Pause Stream';
    };
  });

  const ts = new Date().toTimeString().split(' ')[0];
  const defaults = {
    coder: [
      `[${ts}] info  - [compiler] watching source files...`,
      `[${ts}] debug - [compiler] loaded tsconfig.json`,
      `[${ts}] info  - [compiler] webpack compiled successfully in 1420ms`,
    ],
    tester: [
      `[${ts}] info  - [tester] jest initialized`,
      `[${ts}] pass  - [tester] PASS  tests/auth.test.ts (4.82s)`,
      `[${ts}] pass  - [tester] PASS  tests/rag.test.ts (2.12s)`,
    ],
    scout: [
      `[${ts}] info  - [scout] BraveSearch API connection: OK`,
      `[${ts}] query - [scout] GET /search?q=model-context-protocol-schema`,
      `[${ts}] info  - [scout] Fetch OK: found 8 documentation references`,
    ],
    docker: [
      `[${ts}] docker - [docker] Programmatic boot: Container 'dojo-sandbox-c1' initialized`,
      `[${ts}] docker - [docker] Image: node:20-alpine`,
      `[${ts}] docker - [docker] Sandboxing limits: ROOT=/workspace, NET=isolated`,
      `[${ts}] docker - [docker] Mounting /etc/hosts into container`,
      `[${ts}] docker - [docker] Loading config from /etc/dojo/config.yaml`,
    ],
  };

  Object.keys(defaults).forEach((key) => {
    const termBody = document.getElementById(`term-${key}-body`);
    if (termBody && termBody.children.length === 0) {
      defaults[key].forEach((line) => {
        window.appendMultiplexerLog(key, line);
      });
    }
  });
};

window.appendMultiplexerLog = function (term, text) {
  if (window.state.multiplexerPaused[term]) return;

  const container = document.getElementById(`term-${term}-body`);
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'log-line';
  container.appendChild(div);

  // Replace Windows-style paths with Linux paths
  let processedText = text
    .replace(/C:\\Windows\\System32\\hosts/g, '/etc/hosts')
    .replace(/C:\\Windows\\System32\\drivers\\etc\\hosts/g, '/etc/hosts')
    .replace(/C:\\/g, '/')
    .replace(/\\/g, '/');

  // Handle exit code 137 (OOM Kill)
  const exitCode137Regex = /exit code (137)/g;
  processedText = processedText.replace(
    exitCode137Regex,
    'exit code $1 (OOM Kill — container exceeded memory limit)',
  );

  let currentText = '';
  let index = 0;

  const intervalId = setInterval(() => {
    if (index < processedText.length) {
      currentText += processedText[index];
      div.innerText = currentText;
      index++;
      container.scrollTop = container.scrollHeight;
    } else {
      clearInterval(intervalId);

      // Formatting matching and audio triggers
      if (
        processedText.includes('PASS') ||
        processedText.includes('success') ||
        processedText.includes('OK')
      ) {
        div.innerHTML = processedText.replace(
          /PASS|success|OK/g,
          (match) => `<span style="color:#4caf50; font-weight:bold;">${match}</span>`,
        );
        if (typeof window.playSystemSound === 'function') {
          window.playSystemSound('success');
        }
      } else if (
        processedText.includes('FAIL') ||
        processedText.includes('error') ||
        processedText.includes('Halted')
      ) {
        div.innerHTML = processedText.replace(
          /FAIL|error|Halted/g,
          (match) => `<span style="color:#f44336; font-weight:bold;">${match}</span>`,
        );
        if (typeof window.playSystemSound === 'function') {
          window.playSystemSound('error');
        }
      } else if (
        processedText.includes('compile') ||
        processedText.includes('warning') ||
        processedText.includes('Advisory')
      ) {
        div.innerHTML = processedText.replace(
          /compile|warning|Advisory/g,
          (match) => `<span style="color:#ffb300; font-weight:bold;">${match}</span>`,
        );
      }
      container.scrollTop = container.scrollHeight;
    }
  }, 2);

  while (container.children.length > 50) {
    container.removeChild(container.firstChild);
  }

  // Infinite Loop Breaker (Task 3.1)
  const isError =
    processedText.includes('FAIL') ||
    processedText.includes('error') ||
    processedText.includes('Halted');
  if (isError) {
    // Resolve agent ID associated with term
    let agentId = term;
    if (term === 'coder') {
      if (window.state.agents.coder1 && window.state.agents.coder1.status === 'coding')
        agentId = 'coder1';
      else if (window.state.agents.coder2 && window.state.agents.coder2.status === 'coding')
        agentId = 'coder2';
      else agentId = 'coder1';
    } else if (term === 'scout') {
      agentId = 'hunter';
    }

    if (!window.state.agentLoops) {
      window.state.agentLoops = {};
    }

    const loopState = window.state.agentLoops[agentId] || { errorCount: 0, lastError: '' };

    // Check for sequential duplicate error strings (comparing to last error)
    if (loopState.lastError === processedText) {
      loopState.errorCount++;
    } else {
      loopState.lastError = processedText;
      loopState.errorCount = 1;
    }

    window.state.agentLoops[agentId] = loopState;

    if (loopState.errorCount >= 4) {
      loopState.looping = true;
      if (typeof window.renderKanban === 'function') {
        window.renderKanban();
      }
    }
  }
};
