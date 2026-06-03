// ============================================================
// STEALTH AUDITOR — SECURITY PANEL COMPONENT
// ============================================================

(function () {
  'use strict';

  // ── Mock Data ─────────────────────────────────────────────
  const MOCK_SECURITY = {
    score: 87,
    vulnerabilitiesOpen: 3,
    lastScan: '18 min ago',
    filesScanned: 214,
    scanInProgress: false,
    blockOnCritical: true,
    approvalPending: false,
    vulnerabilities: [
      {
        id: 'CVE-2023-45133',
        package: 'babel-traverse',
        current: '7.21.2',
        fixVersion: '7.23.2',
        severity: 'critical',
        status: 'open',
      },
      {
        id: 'CVE-2024-29180',
        package: 'webpack-dev-middleware',
        current: '5.3.3',
        fixVersion: '5.3.4',
        severity: 'high',
        status: 'open',
      },
      {
        id: 'CVE-2023-42282',
        package: 'ip',
        current: '1.1.8',
        fixVersion: '2.0.1',
        severity: 'medium',
        status: 'open',
      },
      {
        id: 'CVE-2022-25858',
        package: 'terser',
        current: '4.8.0',
        fixVersion: '4.8.1',
        severity: 'low',
        status: 'patched',
      },
    ],
    secretScan: {
      status: 'clean',
      filesScanned: 214,
      linesScanned: 18423,
      findings: [],
    },
    depAudit: {
      totalPackages: 847,
      vulnerable: 3,
      outdated: 24,
    },
  };

  if (!window.state.security) {
    window.state.security = MOCK_SECURITY;
  }

  function normalizeSecurityState(raw) {
    const base = raw && typeof raw === 'object' ? raw : {};
    const dep = base.depAudit || base.dependencyAudit || {};
    const depAudit = {
      totalPackages: Number(dep.totalPackages || dep.total || 0),
      vulnerable: Number(dep.vulnerable || 0),
      outdated: Number(dep.outdated || 0),
    };

    const vulnerabilities =
      Array.isArray(base.vulnerabilities) && base.vulnerabilities.length
        ? base.vulnerabilities.map((v) => ({
            id: v.id || v.cve || 'CVE-UNKNOWN',
            package: v.package || v.pkg || 'unknown',
            current: v.current || v.version || '—',
            fixVersion: v.fixVersion || v.fixAvailable || '—',
            severity: v.severity || 'low',
            status: v.status || 'open',
          }))
        : MOCK_SECURITY.vulnerabilities;

    const secretScan = base.secretScan || {};
    const filesScanned = Number(
      base.filesScanned || secretScan.filesScanned || secretScan.scannedFiles || 0,
    );
    const linesScanned = Number(secretScan.linesScanned || secretScan.scannedLines || 0);

    return {
      ...base,
      depAudit,
      vulnerabilities,
      vulnerabilitiesOpen:
        typeof base.vulnerabilitiesOpen === 'number'
          ? base.vulnerabilitiesOpen
          : vulnerabilities.filter((v) => v.status !== 'patched').length,
      lastScan: base.lastScan || base.lastScanAt || secretScan.lastScan || '—',
      filesScanned,
      scanInProgress:
        typeof base.scanInProgress === 'boolean'
          ? base.scanInProgress
          : base.scanStatus === 'scanning',
      secretScan: {
        status: secretScan.status || 'clean',
        filesScanned,
        linesScanned,
        findings: Array.isArray(secretScan.findings) ? secretScan.findings : [],
      },
    };
  }

  function renderSecurityLoading(container) {
    if (!container) return;
    if (window.renderEmptyState && window.emptyStatePresets && window.emptyStatePresets.security) {
      container.innerHTML = window.renderEmptyState({
        illustration: window.emptyStatePresets.security.illustration,
        title: 'Loading Shadow Guard',
        description: 'Preparing vulnerability and secret scan telemetry.',
      });
    } else {
      container.innerHTML =
        '<div style="padding:40px;text-align:center;color:var(--text-muted);">Loading Shadow Guard...</div>';
    }
  }

  function renderSecurityEmpty(container) {
    if (!container) return;
    if (window.renderEmptyState && window.emptyStatePresets && window.emptyStatePresets.security) {
      container.innerHTML = window.renderEmptyState(window.emptyStatePresets.security);
      if (typeof window.wireEmptyStateActions === 'function')
        window.wireEmptyStateActions(container);
    } else {
      container.innerHTML =
        '<div style="padding:40px;text-align:center;color:var(--text-muted);">No security findings available.</div>';
    }
  }

  function renderSecurityError(container) {
    if (!container) return;
    container.innerHTML =
      '<div style="padding:40px;text-align:center;color:var(--text-muted);">Failed to load Shadow Guard. <button class="btn btn-outline btn-sm" onclick="window.switchTab(\'security\')">Retry</button></div>';
  }

  // ── Helpers ───────────────────────────────────────────────
  function scoreColor(score) {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 60) return 'var(--accent-orange)';
    return 'var(--accent-error)';
  }

  function sevBadge(sev) {
    const map = {
      critical: {
        bg: 'rgba(239,68,68,0.15)',
        color: '#ef4444',
        border: 'rgba(239,68,68,0.35)',
        pulse: true,
      },
      high: {
        bg: 'rgba(255,115,0,0.12)',
        color: 'var(--accent-orange)',
        border: 'rgba(255,115,0,0.3)',
        pulse: false,
      },
      medium: {
        bg: 'rgba(251,191,36,0.12)',
        color: '#fbbf24',
        border: 'rgba(251,191,36,0.3)',
        pulse: false,
      },
      low: {
        bg: 'rgba(255,255,255,0.06)',
        color: 'var(--text-muted)',
        border: 'rgba(255,255,255,0.12)',
        pulse: false,
      },
    };
    const c = map[sev] || map.low;
    const anim = c.pulse ? 'animation:pulse-badge 1.2s infinite;' : '';
    return `<span class="badge" style="background:${c.bg};color:${c.color};border:1px solid ${c.border};${anim}">${sev}</span>`;
  }

  function svgGauge(score, color) {
    const r = 54;
    const circ = 2 * Math.PI * r;
    const dash = ((score / 100) * circ).toFixed(1);
    return `
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r="${r}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="10"/>
        <circle cx="65" cy="65" r="${r}" fill="none" stroke="${color}" stroke-width="10"
          stroke-dasharray="${dash} ${circ.toFixed(1)}"
          stroke-linecap="round"
          transform="rotate(-90 65 65)"
          style="filter:drop-shadow(0 0 6px ${color}66); transition:stroke-dasharray 1s ease;"/>
        <text x="65" y="62" text-anchor="middle" font-size="22" font-weight="700" fill="${color}" font-family="system-ui">${score}</text>
        <text x="65" y="78" text-anchor="middle" font-size="10" fill="rgba(255,255,255,0.4)" font-family="system-ui">/ 100</text>
      </svg>`;
  }

  // ── Render ────────────────────────────────────────────────
  window.renderSecurity = function () {
    const container = document.getElementById('security-container');
    if (!container) return;

    if (!window.state || !window.state.security) {
      renderSecurityLoading(container);
      return;
    }

    try {
      const sec = normalizeSecurityState(window.state.security);
      window.state.security = sec;
      const isEmpty =
        (!sec.vulnerabilities || sec.vulnerabilities.length === 0) &&
        sec.depAudit.totalPackages === 0;
      if (isEmpty) {
        renderSecurityEmpty(container);
        return;
      }

      const color = scoreColor(sec.score);
      const depTrafficLight = (pct) =>
        pct === 0
          ? 'var(--accent-green)'
          : pct < 5
            ? 'var(--accent-orange)'
            : 'var(--accent-error)';
      const vulnPct =
        sec.depAudit.totalPackages > 0
          ? (sec.depAudit.vulnerable / sec.depAudit.totalPackages) * 100
          : 0;

      container.innerHTML = `
      <!-- SECURITY SCORE DASHBOARD -->
      <div style="display:grid; grid-template-columns:auto 1fr 1fr 1fr; gap:14px; margin-bottom:18px; align-items:stretch;">
        <!-- Gauge -->
        <div class="glass-card" style="padding:18px 22px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;">
          ${svgGauge(sec.score, color)}
          <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em;">Security Score</div>
        </div>
        <!-- Vulns Open -->
        <div class="glass-card" style="padding:16px; display:flex; flex-direction:column; justify-content:center; gap:4px;">
          <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em; font-weight:600;">Open Vulns</div>
          <div style="font-size:2rem; font-weight:800; color:${sec.vulnerabilitiesOpen > 0 ? 'var(--accent-error)' : 'var(--accent-green)'}; line-height:1;">${sec.vulnerabilitiesOpen}</div>
          <div style="font-size:0.7rem; color:var(--text-muted);">requires attention</div>
        </div>
        <!-- Last Scan -->
        <div class="glass-card" style="padding:16px; display:flex; flex-direction:column; justify-content:center; gap:4px;">
          <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em; font-weight:600;">Last Scan</div>
          <div style="font-size:1.5rem; font-weight:700; color:var(--accent-cyan); line-height:1;">${sec.lastScan}</div>
          <div style="font-size:0.7rem; color:var(--text-muted);">auto-scan interval: 30 min</div>
        </div>
        <!-- Files Scanned -->
        <div class="glass-card" style="padding:16px; display:flex; flex-direction:column; justify-content:center; gap:4px;">
          <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em; font-weight:600;">Files Scanned</div>
          <div style="font-size:2rem; font-weight:800; color:var(--text-primary); line-height:1;">${sec.filesScanned}</div>
          <div style="font-size:0.7rem; color:var(--text-muted);">source files inspected</div>
        </div>
      </div>

      <!-- BLOCK ON CRITICAL WARNING -->
      ${
        sec.blockOnCritical
          ? `
            <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:10px; padding:12px 16px; margin-bottom:18px; display:flex; align-items:center; gap:12px;">
              <div style="font-size:1.3rem;">${window.ninjaIcons ? window.ninjaIcons.get('alert') : '◈'}</div>
              <div style="flex:1;">
                <div style="font-size:0.78rem; font-weight:700; color:#ef4444;">Critical Vulnerability Gate Active</div>
                <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Deployment will be blocked until all critical CVEs are patched or dismissed.</div>
        </div>
        <label class="switch" style="transform:scale(0.85); transform-origin:right center; flex-shrink:0;">
          <input type="checkbox" id="security-block-critical-toggle" ${sec.blockOnCritical ? 'checked' : ''}>
          <span class="slider-toggle"></span>
        </label>
      </div>`
          : `
      <div style="background:rgba(255,115,0,0.06); border:1px solid rgba(255,115,0,0.2); border-radius:10px; padding:12px 16px; margin-bottom:18px; display:flex; align-items:center; gap:12px;">
        <div style="font-size:1.3rem;">${window.ninjaIcons ? window.ninjaIcons.get('info') : '◈️'}</div>
        <div style="flex:1;">
          <div style="font-size:0.78rem; font-weight:700; color:var(--accent-orange);">Critical Gate Disabled</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Deployment can proceed even with critical vulnerabilities present.</div>
        </div>
        <label class="switch" style="transform:scale(0.85); transform-origin:right center; flex-shrink:0;">
          <input type="checkbox" id="security-block-critical-toggle" ${sec.blockOnCritical ? 'checked' : ''}>
          <span class="slider-toggle"></span>
        </label>
      </div>`
      }

      <!-- APPROVAL GATE -->
      ${
        sec.approvalPending
          ? `
      <div class="glass-card" style="margin-bottom:18px; padding:18px; border:1px solid rgba(156,39,176,0.4); background:rgba(156,39,176,0.07);">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
          <span style="font-size:1.4rem;">◈</span>
          <div>
            <div style="font-size:0.88rem; font-weight:700; color:var(--accent-purple);">Security Approval Required</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">Human review gate triggered. Awaiting Sensei decision to proceed with deployment.</div>
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-primary btn-sm" id="security-approve-btn" style="background:var(--accent-green); border-color:var(--accent-green);">◈ Approve & Deploy</button>
          <button class="btn btn-outline btn-sm" id="security-reject-btn" style="color:var(--accent-error); border-color:var(--accent-error);">◈ Reject</button>
        </div>
      </div>`
          : ''
      }

      <!-- VULNERABILITY TABLE -->
      <div class="glass-card" style="margin-bottom:18px;">
        <div class="panel-header" style="padding:12px 16px; border-bottom:1px solid var(--border-subtle);">
          <span>◈️ Vulnerability Scroll</span>
          <span class="badge badge-warning">${sec.vulnerabilities.filter((v) => v.status === 'open').length} open</span>
        </div>
        <div style="overflow:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-subtle); color:var(--text-muted); text-align:left;">
                <th style="padding:10px 14px; font-weight:600;">CVE / ID</th>
                <th style="padding:10px 14px; font-weight:600;">Package</th>
                <th style="padding:10px 14px; font-weight:600;">Current</th>
                <th style="padding:10px 14px; font-weight:600;">Fix Version</th>
                <th style="padding:10px 14px; font-weight:600;">Severity</th>
                <th style="padding:10px 14px; font-weight:600;">Status</th>
                <th style="padding:10px 14px; font-weight:600;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${sec.vulnerabilities
                .map(
                  (v) => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.04); ${v.status === 'patched' ? 'opacity:0.5;' : ''}">
                  <td style="padding:10px 14px; font-family:var(--font-mono); color:var(--accent-cyan); font-size:0.7rem;">${v.id}</td>
                  <td style="padding:10px 14px; font-weight:600;">${v.package}</td>
                  <td style="padding:10px 14px; font-family:var(--font-mono);">${v.current}</td>
                  <td style="padding:10px 14px; font-family:var(--font-mono); color:var(--accent-green);">${v.fixVersion}</td>
                  <td style="padding:10px 14px;">${sevBadge(v.severity)}</td>
                  <td style="padding:10px 14px;">
                    ${
                      v.status === 'patched'
                        ? '<span class="badge badge-success">◈ Patched</span>'
                        : '<span class="badge badge-outline">Open</span>'
                    }
                  </td>
                  <td style="padding:10px 14px;">
                    ${
                      v.status !== 'patched'
                        ? `
                      <div style="display:flex; gap:6px;">
                        <button class="btn btn-primary btn-sm security-patch-btn" data-vuln="${v.id}" style="font-size:0.65rem; padding:3px 9px;">Patch</button>
                        <button class="btn btn-outline btn-sm security-dismiss-btn" data-vuln="${v.id}" style="font-size:0.65rem; padding:3px 9px;">Dismiss</button>
                      </div>`
                        : '—'
                    }
                  </td>
                </tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECRET SCAN + DEP AUDIT -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:18px;">
        <!-- Secret Scan -->
        <div class="glass-card" style="padding:16px;">
          <div class="panel-header" style="margin-bottom:12px;">
            <span>◈ Secret Scan</span>
            <span class="badge ${sec.secretScan.status === 'clean' ? 'badge-success' : 'badge-error'}">${sec.secretScan.status}</span>
          </div>
          ${
            sec.secretScan.status === 'clean'
              ? `
            <div style="display:flex; align-items:center; gap:10px; padding:10px 0;">
              <div style="font-size:2rem;">◈</div>
              <div>
                <div style="font-size:0.78rem; font-weight:600; color:var(--accent-green);">No secrets detected</div>
                <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">${sec.secretScan.filesScanned} files · ${sec.secretScan.linesScanned.toLocaleString()} lines scanned</div>
              </div>
            </div>`
              : sec.secretScan.findings
                  .map(
                    (f) => `
            <div style="background:rgba(239,68,68,0.08); border-radius:6px; padding:8px; margin-bottom:6px; font-size:0.72rem;">
              <div style="color:#ef4444; font-weight:600;">${f.type}</div>
              <div style="color:var(--text-muted); font-family:var(--font-mono);">${f.file}:${f.line}</div>
            </div>`,
                  )
                  .join('')
          }
        </div>

        <!-- Dep Audit -->
        <div class="glass-card" style="padding:16px;">
          <div class="panel-header" style="margin-bottom:12px;">
            <span>◈ Dependency Audit</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span style="font-size:0.75rem; color:var(--text-secondary);">Total Packages</span>
              <strong style="font-size:0.9rem;">${sec.depAudit.totalPackages}</strong>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span style="font-size:0.75rem; color:var(--text-secondary);">Vulnerable</span>
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="status-indicator-pulse ${sec.depAudit.vulnerable > 0 ? 'offline' : 'online'}" style="display:inline-block;"></span>
                <strong style="color:${depTrafficLight(vulnPct)};">${sec.depAudit.vulnerable}</strong>
              </div>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span style="font-size:0.75rem; color:var(--text-secondary);">Outdated</span>
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="status-indicator-pulse ${sec.depAudit.outdated > 20 ? 'offline' : 'online'}" style="display:inline-block;"></span>
                <strong style="color:${sec.depAudit.outdated > 20 ? 'var(--accent-orange)' : 'var(--accent-green)'};">${sec.depAudit.outdated}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SCAN PROGRESS (if scanning) -->
      <div id="security-scan-progress-wrap" style="display:${sec.scanInProgress ? 'block' : 'none'}; margin-bottom:18px;">
        <div class="glass-card" style="padding:14px 18px;">
          <div style="font-size:0.78rem; font-weight:600; color:var(--accent-orange); margin-bottom:8px;">◈ Scan in Progress...</div>
          <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden;">
            <div id="security-scan-bar" style="height:100%; width:0%; background:linear-gradient(90deg, var(--accent-orange), #ffb300); border-radius:3px; transition:width 0.4s;"></div>
          </div>
          <div id="security-scan-status-txt" style="font-size:0.7rem; color:var(--text-muted); margin-top:6px;">Initializing stealth scan...</div>
        </div>
      </div>
    `;

      // ── Event Wiring ─────────────────────────────────────────
      _wireSecurity(container);
    } catch (e) {
      console.error('[CoNinja] Security render error:', e);
      renderSecurityError(container);
    }
  };

  function _wireSecurity(container) {
    // Block on critical toggle
    const blockToggle = container.querySelector('#security-block-critical-toggle');
    if (blockToggle && !blockToggle.dataset.wired) {
      blockToggle.dataset.wired = '1';
      blockToggle.addEventListener('change', (e) => {
        window.state.security.blockOnCritical = e.target.checked;
        window.addLog(
          'security',
          e.target.checked ? 'error' : 'warning',
          e.target.checked
            ? 'Critical block gate ARMED. Deployment will halt on critical CVEs.'
            : 'Critical block gate DISARMED. Deployment unrestricted.',
        );
        if (window.showToast)
          window.showToast(
            e.target.checked ? 'Block gate armed' : 'Block gate disabled',
            e.target.checked ? 'warning' : 'info',
          );
      });
    }

    // Approval gate
    const approveBtn = container.querySelector('#security-approve-btn');
    if (approveBtn && !approveBtn.dataset.wired) {
      approveBtn.dataset.wired = '1';
      approveBtn.addEventListener('click', () => {
        window.state.security.approvalPending = false;
        window.addLog(
          'orchestrator',
          'success',
          'Sensei approved security gate. Deployment proceeds.',
        );
        if (window.showToast) window.showToast('Deployment approved!', 'success');
        window.renderSecurity();
      });
    }
    const rejectBtn = container.querySelector('#security-reject-btn');
    if (rejectBtn && !rejectBtn.dataset.wired) {
      rejectBtn.dataset.wired = '1';
      rejectBtn.addEventListener('click', () => {
        window.state.security.approvalPending = false;
        window.addLog(
          'security',
          'error',
          'Security gate rejected. Deployment blocked by Stealth Auditor.',
        );
        if (window.showToast) window.showToast('Deployment rejected!', 'error');
        window.renderSecurity();
      });
    }

    // Patch buttons
    container.querySelectorAll('.security-patch-btn').forEach((btn) => {
      if (!btn.dataset.wired) {
        btn.dataset.wired = '1';
        btn.addEventListener('click', () => {
          const vid = btn.dataset.vuln;
          const vuln = (window.state.security.vulnerabilities || []).find((v) => v.id === vid);
          if (vuln) {
            vuln.status = 'patched';
            window.state.security.vulnerabilitiesOpen = Math.max(
              0,
              window.state.security.vulnerabilitiesOpen - 1,
            );
          }
          window.addLog(
            'security',
            'success',
            `Vulnerability ${vid} patched. Dependency upgraded.`,
          );
          if (window.showToast) window.showToast(`${vid} patched!`, 'success');
          if (
            window.api &&
            window.api.security &&
            typeof window.api.security.patchVulnerability === 'function'
          ) {
            window.api.security.patchVulnerability(vid);
          }
          window.renderSecurity();
        });
      }
    });

    // Dismiss buttons
    container.querySelectorAll('.security-dismiss-btn').forEach((btn) => {
      if (!btn.dataset.wired) {
        btn.dataset.wired = '1';
        btn.addEventListener('click', () => {
          const vid = btn.dataset.vuln;
          const vuln = (window.state.security.vulnerabilities || []).find((v) => v.id === vid);
          if (vuln) {
            vuln.status = 'patched';
            window.state.security.vulnerabilitiesOpen = Math.max(
              0,
              window.state.security.vulnerabilitiesOpen - 1,
            );
          }
          window.addLog('security', 'warning', `Vulnerability ${vid} dismissed by Sensei.`);
          if (window.showToast) window.showToast(`${vid} dismissed`, 'warning');
          window.renderSecurity();
        });
      }
    });

    // Scan now button (from panel-header)
    const scanBtn = document.getElementById('security-scan-now-btn');
    if (scanBtn && !scanBtn.dataset.wired) {
      scanBtn.dataset.wired = '1';
      scanBtn.addEventListener('click', () => {
        if (window.state.security.scanInProgress) return;
        _runSecurityScan();
      });
    }
  }

  function _runSecurityScan() {
    const sec = window.state.security;
    sec.scanInProgress = true;
    window.addLog('security', 'info', 'Stealth Auditor initiating deep vulnerability scan...');
    if (window.showToast) window.showToast('Scan started...', 'info');

    const wrap = document.getElementById('security-scan-progress-wrap');
    const bar = document.getElementById('security-scan-bar');
    const txt = document.getElementById('security-scan-status-txt');
    if (wrap) wrap.style.display = 'block';

    const messages = [
      'Scanning npm dependency tree...',
      'Running OWASP checks...',
      'Inspecting secret patterns...',
      'Auditing Docker configs...',
      'Compiling vulnerability report...',
    ];
    let step = 0;
    const iv = setInterval(() => {
      step++;
      const pct = Math.min(step * 22, 100);
      if (bar) bar.style.width = `${pct}%`;
      if (txt) txt.textContent = messages[step - 1] || 'Finalizing...';
      if (step >= 5) {
        clearInterval(iv);
        sec.scanInProgress = false;
        sec.lastScan = 'just now';
        window.addLog(
          'security',
          'success',
          'Stealth scan complete. 3 vulnerabilities catalogued.',
        );
        if (window.showToast) window.showToast('Scan complete!', 'success');
        if (wrap) wrap.style.display = 'none';
      }
    }, 600);
  }

  // ── Init ──────────────────────────────────────────────────
  window.initSecurity = function () {
    if (!window.state.security) window.state.security = MOCK_SECURITY;
    window.renderSecurity();
  };
})();
