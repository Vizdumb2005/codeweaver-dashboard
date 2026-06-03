// ============================================================
// KUNAI TESTER — TESTING PANEL COMPONENT
// ============================================================

(function () {
  'use strict';

  // ── Mock Data ─────────────────────────────────────────────
  const MOCK_TESTING = {
    overallCoverage: 84.2,
    coverageThreshold: 80,
    mutationScore: 67.4,
    runner: {
      state: 'running',
      lastRun: '2 min ago',
      total: 142,
      passed: 131,
      failed: 7,
      skipped: 4,
    },
    suites: [
      {
        id: 'auth-suite',
        name: 'Auth Integration Tests',
        file: 'integration/auth.test.ts',
        status: 'running',
        total: 12,
        passed: 10,
        failed: 0,
        skipped: 2,
        coverage: 91.4,
        duration: '14s',
      },
      {
        id: 'user-model-suite',
        name: 'User Model Unit Tests',
        file: 'unit/user.model.test.ts',
        status: 'passed',
        total: 18,
        passed: 18,
        failed: 0,
        skipped: 0,
        coverage: 97.2,
        duration: '3s',
      },
      {
        id: 'email-suite',
        name: 'Email Service Tests',
        file: 'unit/email.service.test.ts',
        status: 'failed',
        total: 8,
        passed: 5,
        failed: 3,
        skipped: 0,
        coverage: 62.1,
        duration: '6s',
        errorMessage:
          'Error: connect ECONNREFUSED 127.0.0.1:1025\n  at TCPConnectWrap.afterConnect\n  Expected SMTP handshake, got connection refused.',
        suggestedFix:
          'Mock the SMTP transport in tests using `nodemailer.createTransport({ jsonTransport: true })`. Avoid real network calls in unit test scope.',
      },
      {
        id: 'session-suite',
        name: 'Session Token Tests',
        file: 'unit/session.test.ts',
        status: 'passed',
        total: 22,
        passed: 22,
        failed: 0,
        skipped: 0,
        coverage: 88.3,
        duration: '4s',
      },
      {
        id: 'api-route-suite',
        name: 'API Route Integration',
        file: 'integration/api.routes.test.ts',
        status: 'failed',
        total: 34,
        passed: 27,
        failed: 4,
        skipped: 3,
        coverage: 74.5,
        duration: '22s',
        errorMessage:
          'AssertionError: Expected status 401 but got 500\n  at Object.<anonymous> (integration/api.routes.test.ts:88:5)',
        suggestedFix:
          'The middleware chain may not be validating JWT before invoking the handler. Ensure `authMiddleware` is registered before route handlers in Express.',
      },
      {
        id: 'db-suite',
        name: 'Database Schema Tests',
        file: 'unit/db.schema.test.ts',
        status: 'pending',
        total: 15,
        passed: 0,
        failed: 0,
        skipped: 15,
        coverage: 0,
        duration: '—',
      },
    ],
    lintErrors: [
      {
        file: 'src/utils/auth.ts',
        line: 42,
        rule: 'no-unused-vars',
        severity: 'warning',
        message: '\'tokenExpiry\' is defined but never used.',
      },
      {
        file: 'src/models/User.ts',
        line: 17,
        rule: '@typescript-eslint/no-explicit-any',
        severity: 'error',
        message: 'Unexpected any. Specify a different type.',
      },
      {
        file: 'src/services/email.ts',
        line: 89,
        rule: 'prefer-const',
        severity: 'warning',
        message: '\'transport\' is never reassigned. Use \'const\' instead.',
      },
    ],
    coverageTrend: [
      { day: 'Mon', value: 71.2 },
      { day: 'Tue', value: 74.8 },
      { day: 'Wed', value: 78.1 },
      { day: 'Thu', value: 79.5 },
      { day: 'Fri', value: 81.3 },
      { day: 'Sat', value: 83.0 },
      { day: 'Sun', value: 84.2 },
    ],
  };

  // Merge into window.state if not present
  if (!window.state.testing) {
    window.state.testing = MOCK_TESTING;
  }

  function normalizeTestingState(raw) {
    const base = raw && typeof raw === 'object' ? raw : {};
    const suites = Array.isArray(base.suites) ? base.suites : [];
    const totals = suites.reduce(
      (acc, s) => {
        acc.total += Number(s.total || 0);
        acc.passed += Number(s.passed || 0);
        acc.failed += Number(s.failed || 0);
        acc.skipped += Number(s.skipped || 0);
        return acc;
      },
      { total: 0, passed: 0, failed: 0, skipped: 0 },
    );

    const runner = base.runner || {
      state: base.runnerStatus || 'idle',
      lastRun: base.lastRun || base.lastRunAt || '—',
      total: totals.total,
      passed: totals.passed,
      failed: totals.failed,
      skipped: totals.skipped,
    };

    const coverageTrend =
      Array.isArray(base.coverageTrend) && base.coverageTrend.length
        ? base.coverageTrend
        : MOCK_TESTING.coverageTrend;

    return {
      ...base,
      overallCoverage:
        typeof base.overallCoverage === 'number'
          ? base.overallCoverage
          : typeof base.testCoverage === 'number'
            ? base.testCoverage
            : MOCK_TESTING.overallCoverage,
      coverageThreshold:
        typeof base.coverageThreshold === 'number'
          ? base.coverageThreshold
          : typeof base.coverageGate === 'number'
            ? base.coverageGate
            : MOCK_TESTING.coverageThreshold,
      mutationScore:
        typeof base.mutationScore === 'number' ? base.mutationScore : MOCK_TESTING.mutationScore,
      runner,
      suites: suites.length ? suites : MOCK_TESTING.suites,
      lintErrors: Array.isArray(base.lintErrors) ? base.lintErrors : MOCK_TESTING.lintErrors,
      coverageTrend,
    };
  }

  function renderTestingLoading(container) {
    if (!container) return;
    if (window.renderEmptyState && window.emptyStatePresets && window.emptyStatePresets.testing) {
      container.innerHTML = window.renderEmptyState({
        illustration: window.emptyStatePresets.testing.illustration,
        title: 'Loading Testing Grounds',
        description: 'Preparing test suites and coverage telemetry.',
      });
    } else {
      container.innerHTML =
        '<div style="padding:40px;text-align:center;color:var(--text-muted);">Loading Testing Grounds...</div>';
    }
  }

  function renderTestingEmpty(container) {
    if (!container) return;
    if (window.renderEmptyState && window.emptyStatePresets && window.emptyStatePresets.testing) {
      container.innerHTML = window.renderEmptyState(window.emptyStatePresets.testing);
      if (typeof window.wireEmptyStateActions === 'function')
        window.wireEmptyStateActions(container);
    } else {
      container.innerHTML =
        '<div style="padding:40px;text-align:center;color:var(--text-muted);">No tests available.</div>';
    }
  }

  function renderTestingError(container) {
    if (!container) return;
    container.innerHTML =
      '<div style="padding:40px;text-align:center;color:var(--text-muted);">Failed to load Testing Grounds. <button class="btn btn-outline btn-sm" onclick="window.switchTab(\'testing\')">Retry</button></div>';
  }

  // ── Helpers ───────────────────────────────────────────────
  function coverageColor(pct, threshold) {
    if (pct >= threshold) return 'var(--accent-green)';
    if (pct >= threshold * 0.9) return 'var(--accent-orange)';
    return 'var(--accent-error)';
  }

  function svgCircle(pct, color, size) {
    const r = size / 2 - 8;
    const circ = 2 * Math.PI * r;
    const dash = ((pct / 100) * circ).toFixed(1);
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}"
          fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="7"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}"
          fill="none" stroke="${color}" stroke-width="7"
          stroke-dasharray="${dash} ${circ.toFixed(1)}"
          stroke-linecap="round"
          transform="rotate(-90 ${size / 2} ${size / 2})"
          style="transition: stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1);"/>
      </svg>`;
  }

  function statusBadge(status) {
    const map = {
      running: { cls: 'badge-orange', label: '◈ Running', pulse: true },
      passed: { cls: 'badge-success', label: '◈ Passed', pulse: false },
      failed: { cls: 'badge-error', label: '◈ Failed', pulse: false },
      pending: { cls: 'badge-outline', label: '◌ Pending', pulse: false },
    };
    const cfg = map[status] || map.pending;
    const pulseStyle = cfg.pulse ? 'animation: pulse-badge 1.4s infinite;' : '';
    return `<span class="badge ${cfg.cls}" style="${pulseStyle}">${cfg.label}</span>`;
  }

  function severityBadge(sev) {
    return sev === 'error'
      ? '<span class="badge" style="background:rgba(239,68,68,0.18);color:#ef4444;border:1px solid rgba(239,68,68,0.3);">error</span>'
      : '<span class="badge badge-warning">warning</span>';
  }

  function relTime() {
    return new Date().toTimeString().split(' ')[0];
  }

  // ── Suite Card HTML ───────────────────────────────────────
  function suitCardHTML(suite) {
    const passPct = suite.total > 0 ? Math.round((suite.passed / suite.total) * 100) : 0;
    const failPct = suite.total > 0 ? Math.round((suite.failed / suite.total) * 100) : 0;
    const covColor = coverageColor(suite.coverage, window.state.testing.coverageThreshold);

    const failDiagnosis =
      suite.status === 'failed'
        ? `
      <div class="testing-failure-diagnosis" style="margin-top:10px; background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.2); border-radius:8px; padding:10px;">
        <div style="font-size:0.7rem; color:var(--accent-error); font-weight:600; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">◈ Failure Diagnosis</div>
        <div style="font-family:var(--font-mono); font-size:0.7rem; color:#f87171; background:rgba(0,0,0,0.3); border-radius:4px; padding:8px; white-space:pre-wrap; max-height:60px; overflow:auto; margin-bottom:6px;">${suite.errorMessage || ''}</div>
        <div style="font-size:0.7rem; color:var(--text-secondary); margin-bottom:8px;"><span style="color:var(--accent-cyan);">◈ Sensei suggests:</span> ${suite.suggestedFix || ''}</div>
        <button class="btn btn-outline btn-sm testing-create-task-btn" data-suite="${suite.id}" style="font-size:0.68rem; padding:3px 10px;">＋ Create Fix Task</button>
      </div>`
        : '';

    return `
      <div class="glass-card testing-suite-card" data-suite-id="${suite.id}" style="padding:14px; display:flex; flex-direction:column; gap:8px; border-left:3px solid ${
        suite.status === 'running'
          ? 'var(--accent-orange)'
          : suite.status === 'passed'
            ? 'var(--accent-green)'
            : suite.status === 'failed'
              ? 'var(--accent-error)'
              : 'rgba(255,255,255,0.1)'
      };">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px;">
          <div>
            <div style="font-weight:600; font-size:0.82rem; color:var(--text-primary);">${suite.name}</div>
            <div style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">${suite.file}</div>
          </div>
          ${statusBadge(suite.status)}
        </div>
        <div style="height:5px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden; display:flex;">
          <div style="height:100%; width:${passPct}%; background:var(--accent-green); transition:width 0.5s;"></div>
          <div style="height:100%; width:${failPct}%; background:var(--accent-error); transition:width 0.5s;"></div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:4px; font-size:0.7rem; color:var(--text-secondary);">
          <span>Total: <strong style="color:var(--text-primary);">${suite.total}</strong></span>
          <span>Passed: <strong style="color:var(--accent-green);">${suite.passed}</strong></span>
          <span>Failed: <strong style="color:${suite.failed > 0 ? 'var(--accent-error)' : 'var(--text-muted)'};">${suite.failed}</strong></span>
          <span>Skipped: <strong style="color:var(--accent-orange);">${suite.skipped}</strong></span>
          <span>Coverage: <strong style="color:${covColor};">${suite.coverage}%</strong></span>
          <span>Duration: <strong style="color:var(--text-primary);">${suite.duration}</strong></span>
        </div>
        <div style="display:flex; gap:6px; justify-content:flex-end;">
          <button class="btn btn-outline btn-sm testing-suite-rerun-btn" data-suite="${suite.id}" style="font-size:0.68rem; padding:3px 10px;">↺ Rerun</button>
          <button class="btn btn-sm testing-suite-details-btn" data-suite="${suite.id}" style="font-size:0.68rem; padding:3px 10px; background:rgba(255,115,0,0.1); border:1px solid rgba(255,115,0,0.25); color:var(--accent-orange);">Details</button>
        </div>
        ${failDiagnosis}
      </div>`;
  }

  // ── Render ────────────────────────────────────────────────
  window.renderTesting = function () {
    const container = document.getElementById('testing-container');
    if (!container) return;

    if (!window.state || !window.state.testing) {
      renderTestingLoading(container);
      return;
    }

    const t = normalizeTestingState(window.state.testing);
    window.state.testing = t;
    const suitesEmpty = !Array.isArray(t.suites) || t.suites.length === 0;
    const lintEmpty = !Array.isArray(t.lintErrors) || t.lintErrors.length === 0;
    if (suitesEmpty && lintEmpty) {
      renderTestingEmpty(container);
      return;
    }

    try {
      const r = t.runner || {
        state: 'idle',
        lastRun: '—',
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
      };
      const covColor = coverageColor(t.overallCoverage, t.coverageThreshold);
      const mutColor = coverageColor(t.mutationScore, 60);

      // Runner state
      const runnerBadge =
        r.state === 'running'
          ? '<span class="badge badge-orange" style="animation:pulse-badge 1.4s infinite;">◈ Running</span>'
          : '<span class="badge badge-outline">◌ Idle</span>';

      container.innerHTML = `
      <!-- COVERAGE DASHBOARD -->
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:18px;">
        <!-- Overall Coverage -->
        <div class="glass-card" style="padding:18px; display:flex; flex-direction:column; align-items:center; gap:6px; position:relative;">
          <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; font-weight:600;">Overall Coverage</div>
          <div style="position:relative; width:80px; height:80px;">
            ${svgCircle(t.overallCoverage, covColor, 80)}
            <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:0.92rem; font-weight:700; color:${covColor};">${t.overallCoverage}%</div>
          </div>
          <div style="font-size:0.68rem; color:var(--text-muted);">Threshold: ${t.coverageThreshold}%</div>
        </div>
        <!-- Coverage Threshold -->
        <div class="glass-card" style="padding:18px; display:flex; flex-direction:column; align-items:center; gap:6px;">
          <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; font-weight:600;">Coverage Gate</div>
          <div style="position:relative; width:80px; height:80px;">
            ${svgCircle(t.coverageThreshold, 'var(--accent-cyan)', 80)}
            <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:0.92rem; font-weight:700; color:var(--accent-cyan);">${t.coverageThreshold}%</div>
          </div>
          <span class="badge badge-success" style="font-size:0.65rem;">◈ Gate Open</span>
        </div>
        <!-- Mutation Score -->
        <div class="glass-card" style="padding:18px; display:flex; flex-direction:column; align-items:center; gap:6px;">
          <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; font-weight:600;">Mutation Score</div>
          <div style="position:relative; width:80px; height:80px;">
            ${svgCircle(t.mutationScore, mutColor, 80)}
            <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:0.92rem; font-weight:700; color:${mutColor};">${t.mutationScore}%</div>
          </div>
          <div style="font-size:0.68rem; color:var(--text-muted);">Genin stance active</div>
        </div>
      </div>

      <!-- TEST RUNNER STATUS BAR -->
      <div class="glass-card" style="padding:14px 18px; margin-bottom:18px; display:flex; align-items:center; flex-wrap:wrap; gap:14px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em;">Runner</span>
          ${runnerBadge}
        </div>
        <div style="height:20px; width:1px; background:var(--border-subtle); margin:0 4px;"></div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">Last run: <strong style="color:var(--text-primary);">${r.lastRun}</strong></div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">Total: <strong style="color:var(--text-primary);">${r.total}</strong></div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">Pass: <strong style="color:var(--accent-green);">${r.passed}</strong></div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">Fail: <strong style="color:var(--accent-error);">${r.failed}</strong></div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">Skip: <strong style="color:var(--accent-orange);">${r.skipped}</strong></div>
        <div style="margin-left:auto; display:flex; gap:8px;">
          <button class="btn btn-outline btn-sm" id="testing-rerun-failed-btn" style="font-size:0.72rem;">↺ Rerun Failed</button>
          <button class="btn btn-primary btn-sm" id="testing-rerun-all-btn" style="font-size:0.72rem;">▶ Run All</button>
        </div>
      </div>

      <!-- TEST SUITES GRID -->
      <div class="panel-header" style="margin-bottom:10px;">
        <span>◈ Test Suites</span>
        <span style="font-size:0.72rem; color:var(--text-muted);">${t.suites.length} suites</span>
      </div>
      <div id="testing-suites-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:18px;">
        ${t.suites.map(suitCardHTML).join('')}
      </div>

      <!-- LINT RESULTS PANEL -->
      <div class="glass-card" style="margin-bottom:18px;">
        <div class="panel-header" style="padding:12px 16px; border-bottom:1px solid var(--border-subtle);">
          <span>◈ Lint Results</span>
          <span class="badge ${t.lintErrors.length === 0 ? 'badge-success' : 'badge-warning'}">${t.lintErrors.length === 0 ? '◈ Clean' : `${t.lintErrors.length} issues`}</span>
        </div>
        <div style="padding:10px 14px;">
          ${
            t.lintErrors.length === 0
              ? '<div style="color:var(--text-muted); font-size:0.78rem; text-align:center; padding:18px 0;">◈ No lint violations found. Scroll is clean.</div>'
              : t.lintErrors
                  .map(
                    (e) => `
              <div style="display:flex; align-items:flex-start; gap:10px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                ${severityBadge(e.severity)}
                <div style="flex:1; min-width:0;">
                  <div style="font-size:0.72rem; font-family:var(--font-mono); color:var(--accent-cyan);">${e.file}<span style="color:var(--text-muted);">:${e.line}</span></div>
                  <div style="font-size:0.73rem; color:var(--text-secondary); margin-top:2px;">${e.message}</div>
                </div>
                <div style="font-size:0.68rem; color:var(--text-muted); font-family:var(--font-mono); white-space:nowrap;">${e.rule}</div>
              </div>`,
                  )
                  .join('')
          }
        </div>
      </div>

      <!-- COVERAGE TREND CHART -->
      <div class="glass-card" style="margin-bottom:18px; padding:16px;">
        <div class="panel-header" style="margin-bottom:14px;">
          <span>◈ Coverage Trend (7 days)</span>
        </div>
        <div style="display:flex; align-items:flex-end; gap:8px; height:80px;">
          ${t.coverageTrend
            .map((d, i) => {
              const h = Math.round((d.value / 100) * 72);
              const isToday = i === t.coverageTrend.length - 1;
              const col = isToday ? 'var(--accent-orange)' : 'rgba(255,115,0,0.45)';
              const glow = isToday ? 'box-shadow:0 0 8px rgba(255,115,0,0.5);' : '';
              return `
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">
                <div style="font-size:0.62rem; color:${isToday ? 'var(--accent-orange)' : 'var(--text-muted)'}; font-weight:${isToday ? '700' : '400'};">${d.value}%</div>
                <div style="width:100%; height:${h}px; background:${col}; border-radius:3px 3px 0 0; ${glow} transition:height 0.5s;"></div>
                <div style="font-size:0.65rem; color:var(--text-muted);">${d.day}</div>
              </div>`;
            })
            .join('')}
        </div>
        <div style="height:1px; background:rgba(255,255,255,0.06); margin-top:2px;"></div>
        <div style="font-size:0.65rem; color:var(--text-muted); margin-top:6px; text-align:center;">Threshold gate at ${t.coverageThreshold}%</div>
      </div>
    `;

      // ── Event Wiring ─────────────────────────────────────────
      _wireTesting(container);
    } catch (e) {
      console.error('[CoNinja] Testing render error:', e);
      renderTestingError(container);
    }
  };

  function _wireTesting(container) {
    // Rerun failed
    const rerunFailed = container.querySelector('#testing-rerun-failed-btn');
    if (rerunFailed && !rerunFailed.dataset.wired) {
      rerunFailed.dataset.wired = '1';
      rerunFailed.addEventListener('click', () => {
        window.addLog('tester', 'info', 'Kunai Tester: Re-executing failed test scrolls...');
        if (window.showToast) window.showToast('Rerunning failed tests...', 'info');
        rerunFailed.textContent = '↺ Running…';
        rerunFailed.disabled = true;
        setTimeout(() => {
          rerunFailed.textContent = '↺ Rerun Failed';
          rerunFailed.disabled = false;
          window.addLog('tester', 'success', 'Failed suite rerun complete. 3 tests now passing.');
          if (window.showToast) window.showToast('Rerun complete!', 'success');
        }, 2500);
      });
    }

    // Rerun all
    const rerunAll = container.querySelector('#testing-rerun-all-btn');
    if (rerunAll && !rerunAll.dataset.wired) {
      rerunAll.dataset.wired = '1';
      rerunAll.addEventListener('click', () => {
        window.addLog('tester', 'info', 'Kunai Tester: Full suite execution initiated...');
        if (window.showToast) window.showToast('Running all test suites...', 'info');
        rerunAll.textContent = '▶ Running…';
        rerunAll.disabled = true;
        setTimeout(() => {
          rerunAll.textContent = '▶ Run All';
          rerunAll.disabled = false;
          window.addLog(
            'tester',
            'success',
            `Full test run complete. ${window.state.testing.runner.total} tests executed.`,
          );
          if (window.showToast) window.showToast('All suites complete!', 'success');
        }, 3500);
      });
    }

    // Per-suite rerun
    container.querySelectorAll('.testing-suite-rerun-btn').forEach((btn) => {
      if (!btn.dataset.wired) {
        btn.dataset.wired = '1';
        btn.addEventListener('click', () => {
          const suiteId = btn.dataset.suite;
          window.addLog('tester', 'info', `Kunai Tester: Rerunning suite [${suiteId}]...`);
          if (window.showToast) window.showToast(`Rerunning ${suiteId}`, 'info');
          // Simulate via api namespace if available
          if (
            window.api &&
            window.api.testing &&
            typeof window.api.testing.rerunSuite === 'function'
          ) {
            window.api.testing.rerunSuite(suiteId);
          }
          btn.textContent = '↺ …';
          btn.disabled = true;
          setTimeout(() => {
            btn.textContent = '↺ Rerun';
            btn.disabled = false;
          }, 2000);
        });
      }
    });

    // Create fix task
    container.querySelectorAll('.testing-create-task-btn').forEach((btn) => {
      if (!btn.dataset.wired) {
        btn.dataset.wired = '1';
        btn.addEventListener('click', () => {
          const suiteId = btn.dataset.suite;
          const suite = (window.state.testing.suites || []).find((s) => s.id === suiteId);
          window.addLog(
            'orchestrator',
            'info',
            `Sensei forging fix task for failed suite: ${suite ? suite.name : suiteId}`,
          );
          if (window.showToast) window.showToast('Fix task created in backlog!', 'success');
          btn.textContent = '◈ Task Created';
          btn.disabled = true;
        });
      }
    });
  }

  // ── Init ──────────────────────────────────────────────────
  window.initTesting = function () {
    if (!window.state.testing) window.state.testing = MOCK_TESTING;
    window.renderTesting();
  };
})();
