# Implementation Plan

<!-- ============================================================
     CoNinja v1.2 Bugfix — Full Implementation Task List
     Ordered: PBT exploration → PBT preservation → Critical fixes
              → High fixes → Medium fixes → Low fixes → Checkpoint
     ============================================================ -->

- [ ] 1. Write bug condition exploration tests (BEFORE implementing any fix)
  - **Property 1: Bug Condition** - Dual-Render, Label-Duplication, Nav-Topology, Memory-Vault, Debug-ID
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: Surface counterexamples that demonstrate each bug exists
  - **Scoped PBT Approach**: For each deterministic bug, scope the property to the concrete failing case
  - Create `tests/bugfix-exploration.test.js` (vanilla JS, runs in browser via `<script>` or Node with jsdom)
  - **Test 1.A — Dual-Render (Bug Condition 1.7 / 1.15):**
    - Call `window.switchTab('monitoring')` on unfixed code
    - Assert `document.querySelectorAll('#monitoring-container h2').length === 1` → FAILS (finds 2)
    - Assert `document.querySelectorAll('#monitoring-container #monitoring-range-select').length === 1` → FAILS (finds 2)
    - Document counterexample: "switchTab('monitoring') produces 2 h2 elements and 2 selects"
  - **Test 1.B — Label Duplication (Bug Condition 1.1):**
    - Assert `document.querySelector('h1').textContent` does NOT match `/coNinja\s+coNinja/`
    - Run on unfixed code → FAILS (finds "coNinja coNinja Shadow Swarm v1.2")
  - **Test 1.C — Budget Duplication (Bug Condition 1.2):**
    - Assert `.budget-spent` textContent does NOT match `/\$[\d.]+\s+\$[\d.]+/`
    - Run on unfixed code → FAILS (finds "$4.45 $4.45 / $5.00")
  - **Test 1.D — Nav Topology (Bug Condition 1.9–1.13):**
    - Call `window.switchTab('memory')` on unfixed code
    - Assert `document.querySelectorAll('.nav-section-title').length === 6` → FAILS
    - Assert all `.nav-item` elements have `tagName === 'BUTTON'` → FAILS
  - **Test 1.E — Memory Vault Empty (Bug Condition 1.14):**
    - Call `window.switchTab('memory')` on unfixed code
    - Assert `document.getElementById('memory-pinned-list')` is not null → FAILS (container empty)
  - **Test 1.F — Debug ID Leak (Bug Condition 1.8):**
    - Call `window.switchTab('security')` on unfixed code
    - Assert `document.getElementById('security-container').textContent` does NOT contain `553c828c`
    - Run on unfixed code → FAILS
  - **Test 1.G — Approvals Deadline Duplication (Bug Condition 1.4):**
    - Call `window.switchTab('approvals')` on unfixed code
    - Assert no `.deadline` element textContent matches `/OVERDUE.*OVERDUE/`
    - Run on unfixed code → FAILS
  - Run all tests on UNFIXED code
  - **EXPECTED OUTCOME**: All tests FAIL (this is correct — proves bugs exist)
  - Document all counterexamples found
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.4, 1.7, 1.8, 1.9, 1.14, 1.15_


- [ ] 2. Write preservation property tests (BEFORE implementing any fix)
  - **Property 2: Preservation** - Confirmed-Fixed Screens Do Not Regress
  - **IMPORTANT**: Follow observation-first methodology
  - **Observe on UNFIXED code** (these are screens confirmed fixed in prior audits):
    - `window.switchTab('agent-studio')` → observe full editor renders (not blank)
    - `window.switchTab('testing')` → observe coverage metrics and runner controls render
    - `window.switchTab('security')` → observe score 87/100 renders, "Run Scan Now" button present
    - `window.switchTab('ops-recovery')` → observe nav item is a `<button>` not `<span>`
    - `window.switchTab('approvals')` → observe exactly 5 pending approval cards
    - `window.switchTab('monitoring')` → observe data values (89,450 requests, 0.35% error rate)
    - `window.switchTab('deployment')` → observe "Promote to Production" button is red
    - `window.switchTab('notifications')` → observe single filter bar (not two)
    - `window.switchTab('intelligence')` → observe single "Repository Intelligence" heading
  - Create `tests/bugfix-preservation.test.js`
  - **Test 2.A — Agent Studio renders (Preservation 3.1):**
    - Assert `document.getElementById('agent-studio-container').innerHTML.length > 100`
  - **Test 2.B — Testing Grounds renders (Preservation 3.2):**
    - Assert `document.getElementById('testing-container').innerHTML` contains coverage metrics
  - **Test 2.C — Shadow Guard score (Preservation 3.3):**
    - Assert `document.getElementById('security-container').textContent` contains "87"
  - **Test 2.D — Ops & Recovery nav item is button (Preservation 3.4):**
    - Assert `document.querySelector('[data-tab="ops-recovery"]').tagName === 'BUTTON'`
  - **Test 2.E — Approvals count (Preservation 3.6):**
    - Assert `document.querySelectorAll('.approval-row, .approval-card').length === 5`
  - **Test 2.F — Monitoring data values (Preservation 3.7):**
    - Assert monitoring container textContent contains "89,450" and "0.35%"
  - **Test 2.G — Deploy Gate button color (Preservation 3.8):**
    - Assert "Promote to Production" button has red background styling
  - **Test 2.H — Notifications single filter bar (Preservation 3.10):**
    - Assert `document.querySelectorAll('.notifications-filter-bar, [id*="notif-filter"]').length === 1`
  - **Test 2.I — Intelligence single heading (Preservation 3.11):**
    - Assert `document.querySelectorAll('#intelligence-container h2').length === 1`
  - **Test 2.J — Budget bar amber below 100% (Preservation 3.15):**
    - Set `window.state.accumulatedCost = 2.50`, call `renderMetrics()`
    - Assert `.budget-bar-fill` background is NOT red
  - Run all tests on UNFIXED code
  - **EXPECTED OUTCOME**: All tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 3.10, 3.11, 3.15_


<!-- ============================================================
     CRITICAL FIXES — Must be done first; all other fixes depend
     on the dual-render and nav-topology fixes being in place.
     ============================================================ -->

- [ ] 3. Fix dual-render pattern and nav topology in `js/ui.js`

  - [ ] 3.1 Add `restoreNavTopology()` helper function to `js/ui.js`
    - Insert before the `window.switchTab` function body
    - Implementation:
      ```javascript
      function restoreNavTopology() {
        document.querySelectorAll('.nav-item').forEach(item => {
          if (item.tagName !== 'BUTTON') {
            const btn = document.createElement('button');
            btn.className = item.className;
            btn.dataset.tab = item.dataset.tab;
            btn.innerHTML = item.innerHTML;
            item.parentNode.replaceChild(btn, item);
          }
        });
        document.querySelectorAll('.nav-section.collapsed').forEach(s => s.classList.remove('collapsed'));
      }
      ```
    - Call `restoreNavTopology()` at the top of `window.switchTab`, after the tab content toggle block
    - _Bug_Condition: isBugCondition_NavTopology(tabId) — navSections.length ≠ 6 OR any item.tagName ≠ 'BUTTON'_
    - _Expected_Behavior: All 6 nav sections present; all nav items are BUTTON elements_
    - _Preservation: Nav item clicks continue to switch tabs and update active highlight_
    - _Requirements: 1.9, 1.10, 1.11, 1.12, 1.13, 2.9, 2.10_

  - [ ] 3.2 Remove duplicate `renderMonitoring()` call from `switchTab('monitoring')` block in `js/ui.js`
    - Current broken code: `if (typeof window.renderMonitoring === 'function') window.renderMonitoring(); if (typeof window.initMonitoring === 'function') window.initMonitoring();`
    - Fixed code: `if (typeof window.initMonitoring === 'function') window.initMonitoring();`
    - `initMonitoring` already calls `renderMonitoring()` internally (confirmed in `monitoring.js`)
    - _Bug_Condition: isBugCondition_DualRender('monitoring') — switchTab calls renderMonitoring() then initMonitoring() which calls renderMonitoring() again_
    - _Expected_Behavior: monitoring container innerHTML written exactly once_
    - _Requirements: 1.7, 1.15, 2.7, 2.12_

  - [ ] 3.3 Remove duplicate `renderDeployment()` call from `switchTab('deployment')` block in `js/ui.js`
    - Current broken code: `if (typeof window.renderDeployment === 'function') window.renderDeployment(); if (typeof window.initDeployment === 'function') window.initDeployment();`
    - Fixed code: `if (typeof window.initDeployment === 'function') window.initDeployment();`
    - _Bug_Condition: isBugCondition_DualRender('deployment')_
    - _Requirements: 1.16, 2.12_

  - [ ] 3.4 Remove duplicate `renderNotifications()` call from `switchTab('notifications')` block in `js/ui.js`
    - Current broken code: `if (typeof window.renderNotifications === 'function') window.renderNotifications(); if (typeof window.initNotifications === 'function') window.initNotifications();`
    - Fixed code: `if (typeof window.initNotifications === 'function') window.initNotifications();`
    - _Bug_Condition: isBugCondition_DualRender('notifications')_
    - _Requirements: 1.17, 2.12_

  - [ ] 3.5 Fix `switchTab('memory')` to call only `initMemory()` in `js/ui.js`
    - Current broken code: `if (typeof window.renderMemory === 'function') window.renderMemory(); else if (typeof window.initMemory === 'function') window.initMemory();`
    - Fixed code: `if (typeof window.initMemory === 'function') window.initMemory();`
    - `initMemory` writes the container HTML then calls `renderMemory()` internally (confirmed in `memory.js`)
    - _Bug_Condition: isBugCondition_DualRender('memory') — renderMemory() called before container HTML exists_
    - _Expected_Behavior: Memory Vault renders all 8 content sections_
    - _Requirements: 1.14, 2.11_

  - [ ] 3.6 Fix remaining dual-render blocks in `switchTab()` for `workflow`, `debate`, `repo-explorer`, `pull-requests`, `approvals`, `ops-recovery`, `projects`, `provenance` in `js/ui.js`
    - For each block that calls both `renderX()` and `initX()`, remove the `renderX()` call
    - Pattern: replace `renderX(); initX();` with `initX();` for all components that have an `initX`
    - Components to fix: `workflow`, `debate`, `repo-explorer`, `pull-requests`, `approvals`, `ops-recovery`, `projects`, `provenance`
    - _Bug_Condition: isBugCondition_DualRender(tabId) for each affected tab_
    - _Requirements: 1.15, 1.16, 1.17, 2.12_


- [ ] 4. Fix brand heading duplication in `index.html` and `js/ui.js`

  - [ ] 4.1 Remove the literal "coNinja" text node from the `<h1>` in `index.html`
    - Current: `<h1>coNinja <span class="badge badge-orange">Shadow Swarm v1.2</span></h1>`
    - Fixed: `<h1><span class="badge badge-orange">Shadow Swarm v1.2</span></h1>` — OR keep "coNinja" but ensure `renderMetrics()` never touches this element
    - Preferred fix: keep `<h1>coNinja <span class="badge badge-orange">Shadow Swarm v1.2</span></h1>` as static HTML and ensure `renderMetrics()` does NOT set `innerHTML` on the brand `<h1>`
    - _Bug_Condition: isBugCondition_LabelDuplication — h1.textContent matches /coNinja\s+coNinja/_
    - _Expected_Behavior: "coNinja" appears exactly once in the brand heading_
    - _Requirements: 1.1, 2.1_

  - [ ] 4.2 Remove any code in `js/ui.js` `renderMetrics()` that sets `innerHTML` on the brand `<h1>` element
    - Search `renderMetrics` for any selector targeting `h1`, `.brand h1`, or `brand-heading`
    - Remove or guard that code so the brand heading is never modified by JavaScript
    - _Bug_Condition: renderMetrics() re-injects brand string into h1 that already contains "coNinja"_
    - _Requirements: 1.1, 2.1_

- [ ] 5. Fix budget span duplication in `js/ui.js` `renderMetrics()`

  - [ ] 5.1 Ensure `renderMetrics()` uses `innerHTML =` (assignment, not `+=`) on `.budget-spent`
    - Locate the `.budget-spent` update in `renderMetrics()`
    - Ensure the assignment is: `elSpent.innerHTML = \`$\${cost.toFixed(2)} <span class="budget-total">/ $\${limit.toFixed(2)}</span>\``
    - Verify it is `=` not `+=` and does not prepend a static dollar amount
    - _Bug_Condition: isBugCondition_LabelDuplication — .budget-spent textContent matches /\$[\d.]+\s+\$[\d.]+/_
    - _Expected_Behavior: budget value appears exactly once, e.g. "$4.45 / $5.00"_
    - _Requirements: 1.2, 2.2_

- [ ] 6. Fix Shadow Guard debug ID leak in `js/components/security.js`

  - [ ] 6.1 Remove `strw-id="553c828c"` attribute and any stray `553c828c` text node from the toggle template in `renderSecurity()`
    - Search `security.js` template string for `strw-id` and `553c828c`
    - Remove the attribute from the `<label class="switch">` element
    - Remove any stray text node containing the hash value outside of an HTML attribute context
    - _Bug_Condition: isBugCondition_DebugIDLeak — security-container textContent contains "553c828c"_
    - _Expected_Behavior: toggle area shows only the switch control and its label_
    - _Requirements: 1.8, 2.8_

- [ ] 7. Fix Approvals deadline label duplication in `js/components/approvals.js`

  - [ ] 7.1 Fix the deadline cell template in `renderApprovals()` to avoid "OVERDUE: OVERDUE"
    - Current template: `` `${getDeadlineLabel(a.deadline)}: ${formatDeadline(a.deadline)}` ``
    - Fixed template: `` `${getDeadlineLabel(a.deadline)}${formatDeadline(a.deadline) !== 'OVERDUE' ? ': ' + formatDeadline(a.deadline) : ''}` ``
    - This ensures "⚠ OVERDUE" is shown without the redundant ": OVERDUE" suffix
    - Apply the same fix to both the table cell template and the card template (two locations in `approvals.js`)
    - _Bug_Condition: isBugCondition_LabelDuplication — deadline cell textContent matches /OVERDUE.*OVERDUE/_
    - _Expected_Behavior: "⚠ OVERDUE" displayed exactly once_
    - _Requirements: 1.4, 2.4_

- [ ] 8. Fix Repository active branch label duplication in `js/components/repoExplorer.js`

  - [ ] 8.1 Remove the "Active Branch:" prefix from `window.state.repository.currentBranch` value if it is stored with the prefix
    - Locate where `currentBranch` is written in `repoExplorer.js` or state dispatch handlers
    - Ensure the stored value is just `"main"` (not `"Active Branch: main"`)
    - Ensure the template that renders it provides the label: `Active Branch: ${state.repository.currentBranch}`
    - _Bug_Condition: isBugCondition_LabelDuplication — branch panel textContent matches /Active Branch:.*Active Branch:/_
    - _Expected_Behavior: "Active Branch: main" with prefix appearing exactly once_
    - _Requirements: 1.5, 2.5_

- [ ] 9. Fix Yin/Yang persona label separator in `js/components/settings.js`

  - [ ] 9.1 Add colon-space separator between Yin/Yang prefix and tone category name
    - Locate the Yin/Yang label construction in `settings.js` (likely in a persona balance slider section)
    - Change from: `` `Yin${tone}` `` / `` `Yang${tone}` ``
    - Change to: `` `Yin: ${tone}` `` / `` `Yang: ${tone}` ``
    - _Bug_Condition: isBugCondition_LabelDuplication — label textContent matches /^(Yin|Yang)(\w+)$/ (no separator)_
    - _Expected_Behavior: "Yin: Precise" and "Yang: Creative" with separator_
    - _Requirements: 1.6, 2.6_


<!-- ============================================================
     HIGH PRIORITY FIXES
     ============================================================ -->

- [ ] 10. Fix Dojo Rules settings tab overflow in `js/components/settings.js` and `styles.css`

  - [ ] 10.1 Add `flex-wrap: wrap` to the settings tab row container in `styles.css` or inline styles
    - Locate the `.settings-tabs` or `.s-tabs` container in `index.html` or `settings.js`
    - Add CSS: `.settings-tabs { flex-wrap: wrap; gap: 4px; }`
    - This allows all 10 tabs to wrap to a second line without a scrollbar
    - Alternatively add `overflow-x: auto; scrollbar-width: thin;` if wrapping is not desired
    - _Bug_Condition: 10-tab row overflows container width, "Prompts & Skills" truncated_
    - _Expected_Behavior: All 10 tabs visible without truncation_
    - _Requirements: 1.18, 2.13_

- [ ] 11. Fix Approvals Defer button color in `js/components/approvals.js`

  - [ ] 11.1 Remove purple/violet inline color override from the Defer button
    - Current: `<button class="btn btn-outline btn-sm" data-action="defer" ... style="border-color:rgba(156,39,176,0.3); color:#9c27b0;">`
    - Fixed: `<button class="btn btn-outline btn-sm" data-action="defer" ...>` (remove inline style)
    - Apply to both the table cell actions and the card actions (two locations)
    - _Bug_Condition: Defer button uses purple color inconsistent with design system_
    - _Expected_Behavior: Defer button uses secondary dark/outlined style_
    - _Requirements: 1.19, 2.14_

- [ ] 12. Fix budget alarm state in `js/ui.js` `renderMetrics()`

  - [ ] 12.1 Apply full alarm visual state when `accumulatedCost >= dailyLimit`
    - In `renderMetrics()`, when `accumulatedCost >= dailyLimit`:
      - Add `budget-depleted` class to `.budget-spent` (already done — verify)
      - Set `.budget-bar-fill` background to `#ef4444` (red)
      - Set `.budget-badge` border to `rgba(239,68,68,0.3)` and background to `rgba(239,68,68,0.05)`
    - When `accumulatedCost < dailyLimit`:
      - Remove `budget-depleted` class
      - Restore `.budget-bar-fill` background to `var(--accent-cyan)` (amber/orange)
      - Restore `.budget-badge` border to `rgba(255,179,0,0.15)`
    - _Bug_Condition: budget alarm state not consistently applied across all render paths_
    - _Expected_Behavior: red alarm state when cost >= limit; amber/orange when below_
    - _Requirements: 1.20, 2.15, 3.15_


<!-- ============================================================
     MEDIUM PRIORITY FIXES — Icon System
     ============================================================ -->

- [ ] 13. Fix icon system: replace hardcoded Unicode/emoji in `js/components/memory.js`

  - [ ] 13.1 Replace `<span>⏳</span>` in Retention Policies panel header with SVG icon
    - File: `js/components/memory.js`, `initMemory()` function, Retention Policies panel header
    - Current: `<span>⏳</span>`
    - Fixed: `${window.ninjaIcons ? window.ninjaIcons.get('hourglass') : ''}`
    - Also replace all other `◈` and `◈️` hardcoded symbols in `memory.js` templates with `window.ninjaIcons.get('diamond')`
    - _Bug_Condition: hardcoded ⏳ emoji in template bypasses icon system_
    - _Expected_Behavior: SVG hourglass icon from ninjaIcons registry_
    - _Requirements: 1.22, 2.16_

- [ ] 14. Fix icon system: replace hardcoded Unicode/emoji in `js/components/workflow.js`

  - [ ] 14.1 Replace `⏪` and `⏱️` emoji in section headings with SVG icons
    - File: `js/components/workflow.js`
    - Replace `⏪` with `${window.ninjaIcons ? window.ninjaIcons.get('rewind') : ''}`
    - Replace `⏱️` with `${window.ninjaIcons ? window.ninjaIcons.get('clock') : ''}`
    - _Bug_Condition: hardcoded emoji in workflow.js headings_
    - _Requirements: 1.23, 2.16_

- [ ] 15. Fix icon system: replace hardcoded Unicode/emoji in `js/components/multiplexer.js`

  - [ ] 15.1 Replace all hardcoded emoji characters in `multiplexer.js` section headings with SVG icons
    - File: `js/components/multiplexer.js`
    - Replace each emoji with the appropriate `window.ninjaIcons.get(name)` call
    - _Bug_Condition: hardcoded emoji in multiplexer.js_
    - _Requirements: 1.24, 2.16_

- [ ] 16. Fix icon system: replace hardcoded Unicode in `js/components/intelligence.js`

  - [ ] 16.1 Replace `◈` Unicode symbols and tab icons in `intelligence.js` with SVG icons
    - File: `js/components/intelligence.js`
    - Replace `◈` with `${window.ninjaIcons ? window.ninjaIcons.get('diamond') : ''}`
    - Replace Unicode tab icons with appropriate `ninjaIcons.get()` calls
    - _Bug_Condition: hardcoded ◈ Unicode in intelligence.js_
    - _Requirements: 1.25, 2.16_

- [ ] 17. Fix icon system: replace hardcoded Unicode in `js/components/deployment.js`

  - [ ] 17.1 Replace `◎` Unicode symbol in Deploy Gate heading with SVG icon
    - File: `js/components/deployment.js`
    - Replace `◎` with `${window.ninjaIcons ? window.ninjaIcons.get('circle') : ''}`
    - _Bug_Condition: hardcoded ◎ Unicode in deployment.js heading_
    - _Requirements: 1.45, 2.16_

- [ ] 18. Fix icon system: replace hardcoded Unicode in `js/components/projects.js`

  - [ ] 18.1 Replace `⭐` and `↩️` emoji in projects.js with SVG icons
    - File: `js/components/projects.js`
    - Replace `⭐` with `${window.ninjaIcons ? window.ninjaIcons.get('star') : ''}`
    - Replace `↩️` with `${window.ninjaIcons ? window.ninjaIcons.get('revert') : ''}`
    - _Bug_Condition: hardcoded emoji in projects.js_
    - _Requirements: 1.50, 1.51, 2.16_

- [ ] 19. Fix icon system: replace hardcoded `⊡` in `js/components/settings.js`

  - [ ] 19.1 Replace `⊡` Unicode symbol in settings.js with SVG icon
    - File: `js/components/settings.js`
    - Replace `⊡` with `${window.ninjaIcons ? window.ninjaIcons.get('square') : ''}`
    - _Bug_Condition: hardcoded ⊡ Unicode in settings.js_
    - _Requirements: 1.65, 2.16_


<!-- ============================================================
     MEDIUM PRIORITY FIXES — Agent Naming, Repository, PRs
     ============================================================ -->

- [ ] 20. Fix agent naming inconsistency in `js/components/monitoring.js`

  - [ ] 20.1 Add fallback to `window.getAgentDisplayName()` for unresolved agent IDs in `AGENT_ACTIVITY`
    - File: `js/components/monitoring.js`
    - In the `AGENT_ACTIVITY.map()` render block, the existing code already does `const name = agentInfo ? agentInfo.name : agent.id`
    - Add a tertiary fallback: `const name = agentInfo ? agentInfo.name : (window.getAgentDisplayName ? window.getAgentDisplayName(agent.id) : agent.id)`
    - Verify `window.canonicalInit()` runs before `renderMonitoring()` (confirmed in `app.js` step 2)
    - _Bug_Condition: agent IDs like "coder1" shown as raw IDs instead of canonical names_
    - _Expected_Behavior: "Jutsu Coder (BE)", "Kunai Tester", "Stealth Auditor" displayed consistently_
    - _Requirements: 1.27, 2.17_

  - [ ] 20.2 Fix agent naming in `js/components/collaboration.js`
    - File: `js/components/collaboration.js`
    - Sync collaboration thread agent status with `window.state.agents[id].status`
    - Ensure "Sensei" is not shown as both "Active" and "Meditating" simultaneously
    - _Requirements: 1.28_

  - [ ] 20.3 Fix agent naming in `js/components/provenance.js`
    - File: `js/components/provenance.js`
    - Replace raw IDs `coder1`, `tester` with `window.state.agents[id]?.name || id`
    - _Requirements: 1.29_

- [ ] 21. Fix Repository screen issues in `js/components/repoExplorer.js` and `js/components/repository.js`

  - [ ] 21.1 Standardize commit hash display to 7-character short format
    - File: `js/components/repository.js` (or `repoExplorer.js`)
    - Ensure all commit hash renders use `c.id.substring(0, 7)` consistently
    - _Requirements: 1.30, 2.18_

  - [ ] 21.2 Apply consistent badge styling for branch types
    - File: `js/components/repository.js`
    - Map branch types to semantic badge classes: `main`/`master` → `badge-success`, feature branches → `badge-outline`, release branches → `badge-warning`
    - _Requirements: 1.31_

  - [ ] 21.3 Replace `◈` in `REPO_ICONS` with distinct SVG icons per file type
    - File: `js/components/repository.js`
    - Replace the `REPO_ICONS` map that returns `'◈'` for all types with distinct `ninjaIcons.get()` calls per extension
    - `.js`/`.ts` → `ninjaIcons.get('code')`, `.json` → `ninjaIcons.get('file')`, `.md` → `ninjaIcons.get('documentation')`, `.css` → `ninjaIcons.get('gear')`, `.html` → `ninjaIcons.get('browser')`, `.yml`/`.yaml` → `ninjaIcons.get('gear')`, `Dockerfile` → `ninjaIcons.get('square')`
    - _Requirements: 1.32, 2.19_

- [ ] 22. Fix Pull Requests screen issues in `js/components/pullRequests.js`

  - [ ] 22.1 Fix PR status badge color semantics
    - File: `js/components/pullRequests.js`
    - Map PR states to semantic badge classes: `open` → `badge-success`, `merged` → `badge-purple`, `changes_requested` → `badge-warning`, `approved` → `badge-success`
    - _Requirements: 1.34_

  - [ ] 22.2 Fix grammar inconsistencies in PR titles and descriptions
    - File: `js/components/pullRequests.js` (mock data)
    - Standardize PR title casing to sentence case; fix mixed tense in descriptions
    - _Requirements: 1.33_


<!-- ============================================================
     MEDIUM PRIORITY FIXES — Workflow, Workbench, Multiplexer,
     Neural Graph, MCP, Collaboration, Notifications, Ops,
     Council Decrees, Analytics, Intelligence, Timeline, Settings,
     Wizard
     ============================================================ -->

- [ ] 23. Fix Workflow Forge issues in `js/components/workflow.js`

  - [ ] 23.1 Standardize Workflow stat card styling to glass-card design system
    - File: `js/components/workflow.js`
    - Apply consistent `padding: var(--space-xl)`, `border-radius: var(--radius-lg)`, and font sizes matching other glass-card components
    - _Requirements: 1.35_

  - [ ] 23.2 Add drag-and-drop visual affordances to Workflow canvas
    - File: `js/components/workflow.js`
    - Add `cursor: grab` to draggable stage elements
    - Add drop zone highlight (border color change) on `dragover` events
    - Add drag handle indicator (grip icon) to draggable items
    - _Requirements: 1.36_

- [ ] 24. Fix Dojo Workbench issues in `js/components/workbench.js`

  - [ ] 24.1 Replace Unicode file type icons in workbench file tree with SVG icons
    - File: `js/components/workbench.js`
    - Apply same `REPO_ICONS` fix as task 21.3 to the workbench file tree icon mapping
    - _Requirements: 1.37_

  - [ ] 24.2 Add scrollable tab bar for editor tab overflow
    - File: `js/components/workbench.js`
    - Add `overflow-x: auto; scrollbar-width: thin;` to the editor tab bar container
    - _Requirements: 1.38_

  - [ ] 24.3 Add responsive resize handling for viewports narrower than 1280px
    - File: `js/components/workbench.js` and `styles.css`
    - Add CSS media query: `@media (max-width: 1280px) { .workbench-editor-panel { min-width: 0; flex: 1; } }`
    - _Requirements: 1.39_

- [ ] 25. Fix Sandbox Multiplexer issues in `js/components/multiplexer.js`

  - [ ] 25.1 Replace Windows-style paths in Docker log lines with Linux paths
    - File: `js/components/multiplexer.js` (mock data)
    - Replace `C:\Windows\System32\hosts` and similar Windows paths with `/etc/hosts` equivalents
    - _Requirements: 1.40_

  - [ ] 25.2 Add human-readable explanation for exit code 137
    - File: `js/components/multiplexer.js`
    - When rendering container exit status, check if exit code is 137 and append: `(OOM Kill — container exceeded memory limit)`
    - _Requirements: 1.41, 2.22_

  - [ ] 25.3 Add `aria-label` to "+" add terminal buttons
    - File: `js/components/multiplexer.js`
    - Add `aria-label="Add new terminal"` to each "+" button element
    - _Requirements: 1.42, 2.23_

- [ ] 26. Fix Neural Graph issues in `js/components/neuralGraph.js`

  - [ ] 26.1 Add color legend panel to Neural Graph
    - File: `js/components/neuralGraph.js`
    - Add a legend overlay or panel identifying: orange = orchestrator, cyan = data flow, purple = external dependency
    - _Requirements: 1.43, 2.24_

  - [ ] 26.2 Add direct node labels on the graph canvas
    - File: `js/components/neuralGraph.js`
    - Render node name labels directly on the canvas (not just on hover)
    - _Requirements: 1.44_

- [ ] 27. Fix MCP Registry Authorization Matrix in `js/components/settings.js`

  - [ ] 27.1 Render one row per configured agent in the MCP Authorization Matrix
    - File: `js/components/settings.js` (or `js/components/mcp.js` if separate)
    - Replace hardcoded single-agent row with `Object.values(window.state.agents).map(agent => ...)` to render all agents
    - _Bug_Condition: matrix shows only 1 agent row instead of all configured agents_
    - _Expected_Behavior: one row per agent from window.state.agents_
    - _Requirements: 1.47, 2.20_

- [ ] 28. Fix Collaboration screen issues in `js/components/collaboration.js`

  - [ ] 28.1 Sync collaboration agent presence status with `window.state.agents` status
    - File: `js/components/collaboration.js`
    - Replace hardcoded `teamActivity` status values with live `window.state.agents[id].status` lookups
    - _Requirements: 1.48_

  - [ ] 28.2 Add visual breathing room to Collaboration panel
    - File: `js/components/collaboration.js`
    - Increase padding between agent presence rows to `var(--space-md)` minimum
    - _Requirements: 1.49_

- [ ] 29. Fix Notifications screen title mismatch in `js/components/notifications.js`

  - [ ] 29.1 Align page title with nav label
    - File: `js/components/notifications.js`
    - Change page heading from "Mission Control Alerts" to "Notifications" (or update nav label to match)
    - _Requirements: 1.53, 2.25_

- [ ] 30. Fix Ops & Recovery screen issues in `js/components/opsRecovery.js`

  - [ ] 30.1 Add badge container to "INVESTIGATING" incident status
    - File: `js/components/opsRecovery.js`
    - Wrap "INVESTIGATING" status text in `<span class="badge badge-warning">INVESTIGATING</span>`
    - _Requirements: 1.54_

  - [ ] 30.2 Add visual hierarchy to Resolve/Escalate buttons
    - File: `js/components/opsRecovery.js`
    - "Resolve Incident" → `btn btn-primary btn-sm`; "Escalate Threat" → `btn btn-danger btn-sm`
    - _Requirements: 1.55_

- [ ] 31. Fix Council Decrees status badge color semantics in `js/components/debate.js` or `js/ui.js`

  - [ ] 31.1 Apply semantic color mapping to decision status badges
    - File: `js/components/debate.js` (or wherever `renderDecisions` lives — confirmed in `js/ui.js`)
    - `proposed` → amber/orange badge; `decided`/`approved` → green badge; `overridden`/`rejected` → red badge; `archived` → neutral badge
    - _Requirements: 1.56_

- [ ] 32. Fix Analytics screen chart colors in `js/components/analytics.js`

  - [ ] 32.1 Align chart colors with orange/dark theme palette
    - File: `js/components/analytics.js`
    - Replace default blue/green chart colors with `var(--accent-orange)`, `var(--accent-cyan)`, `var(--accent-warning)`
    - _Requirements: 1.57_

  - [ ] 32.2 Improve chart legend text contrast
    - File: `js/components/analytics.js`
    - Ensure legend text uses `var(--text-secondary)` (not `var(--text-muted)`) for sufficient contrast
    - _Requirements: 1.58_

- [ ] 33. Fix Intelligence screen issues in `js/components/intelligence.js`

  - [ ] 33.1 Replace raw "npm:" prefix string with styled badge in call graph explorer
    - File: `js/components/intelligence.js`
    - Wrap `npm:` prefix in `<span class="badge badge-outline" style="font-size:0.65rem;">npm</span>`
    - _Requirements: 1.59_

  - [ ] 33.2 Improve A/B Testing left panel header contrast and styling
    - File: `js/components/intelligence.js`
    - Apply `color: var(--text-primary)` and consistent font-weight to A/B panel headers
    - _Requirements: 1.60_

- [ ] 34. Fix Timeline/Timelapse issues in `js/components/timelapse.js`

  - [ ] 34.1 Fix contradictory "LIVE" + specific timestamp display
    - File: `js/components/timelapse.js`
    - Show either "LIVE" indicator OR a specific timestamp, not both
    - When `timelapse.playing` is true and at current time, show "LIVE"; otherwise show the timestamp
    - _Requirements: 1.61, 2.27_

  - [ ] 34.2 Reserve layout space for timeline bar to prevent layout shift
    - File: `js/components/timelapse.js` and `styles.css`
    - Add `min-height` reservation for the timeline bar container so it doesn't cause layout shift
    - _Requirements: 1.62_

- [ ] 35. Fix Settings (Dojo Rules) screen issues in `js/components/settings.js`

  - [ ] 35.1 Increase form row spacing for readability
    - File: `js/components/settings.js` and `styles.css`
    - Add `margin-bottom: var(--space-md)` to `.setting-row` elements
    - _Requirements: 1.63_

  - [ ] 35.2 Add visible label text to Dynamic VRAM toggle
    - File: `index.html` or `settings.js` (wherever the VRAM toggle is rendered)
    - Add non-empty label text adjacent to the toggle: e.g., "Dynamic VRAM Swap"
    - _Requirements: 1.64, 2.28_

  - [ ] 35.3 Apply consistent badge styling to provider type column
    - File: `js/components/settings.js`, `renderModelsPane()`
    - Add CSS for `.provider-type.local` and `.provider-type.cloud` to render both as styled badges
    - Current: "Cloud API" is a styled badge, "Ollama Local" is plain text
    - Fixed: both use `<span class="badge badge-outline provider-type local">Ollama Local</span>` and `<span class="badge badge-outline provider-type cloud">Cloud API</span>`
    - _Requirements: 1.66_

- [ ] 36. Fix Wizard modal overlay persistence in `js/components/wizard.js`

  - [ ] 36.1 Ensure wizard dismiss handler fully removes the modal overlay
    - File: `js/components/wizard.js`
    - In the dismiss handler, call both `modal.classList.remove('active')` AND `modal.style.display = 'none'`
    - Verify the `app.js` step 5c cleanup (`document.querySelectorAll('.modal-overlay.active').forEach(...)`) runs on DOMContentLoaded
    - _Bug_Condition: modal overlay persists as semi-transparent overlay on subsequent screens_
    - _Expected_Behavior: modal fully removed after dismiss_
    - _Requirements: 1.67, 2.21_

  - [ ] 36.2 Fix wizard modal header alignment
    - File: `js/components/wizard.js`
    - Add `display: flex; align-items: center; gap: 12px;` to the wizard header container
    - _Requirements: 1.68_


<!-- ============================================================
     LOW PRIORITY FIXES — Accessibility, Performance, State
     ============================================================ -->

- [ ] 37. Fix accessibility issues across all screens

  - [ ] 37.1 Ensure consistent visible focus rings on all interactive elements
    - File: `styles.css`
    - Verify `*:focus-visible { outline: 2px solid #ff7300; outline-offset: 2px; }` is present (already in `index.html` inline styles — move to `styles.css` for global coverage)
    - Test all buttons, inputs, selects, and nav items for visible focus ring
    - _Requirements: 1.69_

  - [ ] 37.2 Add ARIA labels to icon-only buttons and dynamic content regions
    - Files: all component files with icon-only buttons
    - Add `aria-label` to: global pause button (`aria-label="Pause swarm"`), new project button, all icon-only action buttons
    - Add `role="status"` and `aria-live="polite"` to dynamic content regions (console log, notification count)
    - _Requirements: 1.70_

  - [ ] 37.3 Add responsive breakpoints for mobile viewports (< 768px)
    - File: `styles.css`
    - Add `@media (max-width: 768px)` breakpoints for sidebar (collapse to hidden), topbar (stack vertically), content panels (full width)
    - _Requirements: 1.71_

- [ ] 38. Fix performance issues — event listener accumulation

  - [ ] 38.1 Use event delegation in `renderKanban()` to prevent duplicate listener accumulation
    - File: `js/ui.js`, `renderKanban()`
    - Replace per-card `addEventListener` calls with a single delegated listener on the kanban board container
    - Or add `removeEventListener` before re-attaching on each render cycle
    - _Bug_Condition: simulation loop calls renderKanban() every 3s, attaching new listeners without removing old ones_
    - _Expected_Behavior: no duplicate event handler execution on long-running sessions_
    - _Requirements: 1.72, 2.26_

  - [ ] 38.2 Add event listener cleanup in component re-render functions
    - Files: all component files that attach listeners in render functions
    - Use `dataset.wired = '1'` guard pattern (already used in `testing.js`, `approvals.js`) consistently across all components
    - _Requirements: 1.73_

  - [ ] 38.3 Narrow `initIconSystem()` selector scope to reduce initial load performance impact
    - File: `js/icons.js`, `initIconSystem()`
    - Replace broad `span, .value, .label` selectors with more targeted selectors: `.type-icon, .rule-type, .requester, .history-icon, .nav-section-toggle-icon, .panel-header`
    - _Requirements: 1.74_

- [ ] 39. Fix state management inconsistency for notifications

  - [ ] 39.1 Normalize `window.state.notifications` shape consistently
    - File: `js/state.js` and `js/components/notifications.js`
    - `state.js` defines `notifications` as `{ items: [...], taskComplete: bool, decisions: bool, security: bool }`
    - Ensure `notifications.js` always accesses `window.state.notifications.items` (not `window.state.notifications` directly as an array)
    - Add a guard: `const items = Array.isArray(window.state.notifications) ? window.state.notifications : (window.state.notifications?.items || [])`
    - _Bug_Condition: notifications accessed as both array and object with items property_
    - _Requirements: 1.75_

  - [ ] 39.2 Fix `renderMetrics()` static HTML / dynamic value race condition for `.budget-spent`
    - File: `js/ui.js`, `renderMetrics()`
    - Ensure `renderMetrics()` always uses `innerHTML =` (full replacement) on `.budget-spent`, never partial update
    - The static `$1.42` in `index.html` is the initial placeholder; `renderMetrics()` must fully replace it on first call
    - _Bug_Condition: static text node persists alongside dynamically injected content_
    - _Requirements: 1.76, 2.2_


<!-- ============================================================
     VALIDATION — Re-run tests after all fixes applied
     ============================================================ -->

- [ ] 40. Verify bug condition exploration tests now pass (after all fixes)

  - [ ] 40.1 Re-run the bug condition exploration tests from task 1
    - **Property 1: Expected Behavior** - Dual-Render, Label-Duplication, Nav-Topology, Memory-Vault, Debug-ID
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior
    - When these tests pass, it confirms the expected behavior is satisfied
    - Run `tests/bugfix-exploration.test.js` on FIXED code
    - **EXPECTED OUTCOME**: All tests PASS (confirms all critical bugs are fixed)
    - Verify:
      - Test 1.A: `switchTab('monitoring')` → exactly 1 h2, exactly 1 select ✓
      - Test 1.B: `h1.textContent` does NOT match `/coNinja\s+coNinja/` ✓
      - Test 1.C: `.budget-spent` does NOT match `/\$[\d.]+\s+\$[\d.]+/` ✓
      - Test 1.D: nav has 6 sections, all items are BUTTON elements ✓
      - Test 1.E: `memory-pinned-list` exists and is not null after `switchTab('memory')` ✓
      - Test 1.F: security container does NOT contain `553c828c` ✓
      - Test 1.G: no deadline element matches `/OVERDUE.*OVERDUE/` ✓
    - _Requirements: 2.1, 2.2, 2.4, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_

  - [ ] 40.2 Re-run the preservation property tests from task 2
    - **Property 2: Preservation** - Confirmed-Fixed Screens Do Not Regress
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run `tests/bugfix-preservation.test.js` on FIXED code
    - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions)
    - Verify all 10 preservation tests (2.A through 2.J) still pass
    - _Requirements: 3.1 through 3.15_

- [ ] 41. Checkpoint — Ensure all tests pass and all 76+ defect clauses are resolved

  - Manually navigate to all 28 screens and verify no blank content areas (Requirement 3.12)
  - Verify Kanban drag-and-drop still works with smoke puff animation (Requirement 3.13)
  - Verify nav item clicks switch tabs and update active highlight (Requirement 3.14)
  - Verify budget bar is amber/orange below 100% and red at 100% (Requirements 2.15, 3.15)
  - Verify all 76+ defect clauses from `bugfix.md` are addressed (1.1 through 1.76)
  - Run both test files one final time and confirm all pass
  - Ensure all tests pass; ask the user if questions arise


---

## Task Dependency Graph

```
Task 1 (PBT: Bug Condition Exploration)
  └── Must be done BEFORE any fix tasks (3–39)
      └── Establishes baseline failure evidence

Task 2 (PBT: Preservation)
  └── Must be done BEFORE any fix tasks (3–39)
      └── Establishes baseline passing behavior to protect

Task 3 (Dual-Render + Nav Topology — js/ui.js)  ← CRITICAL FOUNDATION
  ├── 3.1 restoreNavTopology() helper
  ├── 3.2 Fix monitoring dual-render
  ├── 3.3 Fix deployment dual-render
  ├── 3.4 Fix notifications dual-render
  ├── 3.5 Fix memory dual-render
  └── 3.6 Fix remaining dual-render blocks
      └── ALL tasks 4–39 depend on task 3 being complete
          (dual-render causes cascading DOM corruption that
           makes other fixes unreliable until resolved)

Task 4 (Brand heading duplication — index.html + ui.js)
  └── Depends on: Task 3 (renderMetrics must not fight dual-render)

Task 5 (Budget span duplication — ui.js renderMetrics)
  └── Depends on: Task 3, Task 4

Task 6 (Shadow Guard debug ID — security.js)
  └── Depends on: Task 3 (security tab must render once)

Task 7 (Approvals deadline duplication — approvals.js)
  └── Depends on: Task 3 (approvals tab must render once)

Task 8 (Repository branch label — repoExplorer.js)
  └── Depends on: Task 3

Task 9 (Yin/Yang separator — settings.js)
  └── Independent (settings tab not in dual-render list)

Task 10 (Settings tab overflow — settings.js + styles.css)
  └── Independent

Task 11 (Defer button color — approvals.js)
  └── Depends on: Task 7 (same file, same render function)

Task 12 (Budget alarm state — ui.js renderMetrics)
  └── Depends on: Task 5 (same function)

Tasks 13–19 (Icon system fixes — various component files)
  └── Each independent of each other
  └── Each depends on: Task 3 (component must render once before icon fix matters)
  └── Order: 13 (memory.js) → 14 (workflow.js) → 15 (multiplexer.js) →
             16 (intelligence.js) → 17 (deployment.js) → 18 (projects.js) →
             19 (settings.js)

Task 20 (Agent naming — monitoring.js, collaboration.js, provenance.js)
  └── 20.1 depends on: Task 3 (monitoring renders once)
  └── 20.2, 20.3 independent

Task 21 (Repository issues — repoExplorer.js, repository.js)
  └── 21.1, 21.2, 21.3 depend on: Task 8 (same file)

Task 22 (Pull Requests — pullRequests.js)
  └── Depends on: Task 3

Task 23 (Workflow Forge — workflow.js)
  └── Depends on: Task 3, Task 14

Task 24 (Dojo Workbench — workbench.js)
  └── Independent of dual-render fix (workbench has its own init)

Task 25 (Sandbox Multiplexer — multiplexer.js)
  └── Depends on: Task 15

Task 26 (Neural Graph — neuralGraph.js)
  └── Independent

Task 27 (MCP Registry — settings.js)
  └── Depends on: Task 9 (same file)

Task 28 (Collaboration — collaboration.js)
  └── Depends on: Task 20.2

Task 29 (Notifications title — notifications.js)
  └── Depends on: Task 3.4

Task 30 (Ops & Recovery — opsRecovery.js)
  └── Depends on: Task 3

Task 31 (Council Decrees — debate.js / ui.js)
  └── Depends on: Task 3

Task 32 (Analytics — analytics.js)
  └── Independent

Task 33 (Intelligence — intelligence.js)
  └── Depends on: Task 16

Task 34 (Timeline — timelapse.js)
  └── Independent

Task 35 (Settings form — settings.js)
  └── Depends on: Tasks 9, 19, 27

Task 36 (Wizard — wizard.js)
  └── Independent

Task 37 (Accessibility — styles.css + all components)
  └── Depends on: Tasks 3–36 (accessibility fixes applied after functional fixes)

Task 38 (Performance — ui.js + all components)
  └── Depends on: Tasks 3–36

Task 39 (State management — state.js + notifications.js)
  └── 39.1 depends on: Task 29
  └── 39.2 depends on: Task 5

Task 40 (Verify exploration tests pass)
  └── Depends on: ALL fix tasks (3–39)

Task 41 (Final checkpoint)
  └── Depends on: Task 40
```

### Critical Path (Minimum Viable Fix Sequence)

```
1 → 2 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6
  → 4.1 → 4.2
  → 5.1
  → 6.1
  → 7.1
  → 40.1 → 40.2 → 41
```

Tasks 8–39 are parallel-eligible after task 3 is complete and can be
executed in any order within their dependency constraints.

### Defect Clause Coverage Matrix

| Requirement | Task(s) |
|-------------|---------|
| 1.1 | 4.1, 4.2 |
| 1.2 | 5.1, 39.2 |
| 1.3 | 3.2 (dual-render fix eliminates double-render of testing stats) |
| 1.4 | 7.1 |
| 1.5 | 8.1 |
| 1.6 | 9.1 |
| 1.7 | 3.2 |
| 1.8 | 6.1 |
| 1.9 | 3.1 |
| 1.10 | 3.1 |
| 1.11 | 3.1 |
| 1.12 | 3.1 |
| 1.13 | 3.1 |
| 1.14 | 3.5 |
| 1.15 | 3.2 |
| 1.16 | 3.3 |
| 1.17 | 3.4 |
| 1.18 | 10.1 |
| 1.19 | 11.1 |
| 1.20 | 12.1 |
| 1.21 | 38.3 |
| 1.22 | 13.1 |
| 1.23 | 14.1 |
| 1.24 | 15.1 |
| 1.25 | 16.1 |
| 1.26 | 9.1 |
| 1.27 | 20.1 |
| 1.28 | 20.2 |
| 1.29 | 20.3 |
| 1.30 | 21.1 |
| 1.31 | 21.2 |
| 1.32 | 21.3 |
| 1.33 | 22.2 |
| 1.34 | 22.1 |
| 1.35 | 23.1 |
| 1.36 | 23.2 |
| 1.37 | 24.1 |
| 1.38 | 24.2 |
| 1.39 | 24.3 |
| 1.40 | 25.1 |
| 1.41 | 25.2 |
| 1.42 | 25.3 |
| 1.43 | 26.1 |
| 1.44 | 26.2 |
| 1.45 | 17.1 |
| 1.46 | 30.2 |
| 1.47 | 27.1 |
| 1.48 | 28.1 |
| 1.49 | 28.2 |
| 1.50 | 18.1 |
| 1.51 | 18.1 |
| 1.52 | 23.1 |
| 1.53 | 29.1 |
| 1.54 | 30.1 |
| 1.55 | 30.2 |
| 1.56 | 31.1 |
| 1.57 | 32.1 |
| 1.58 | 32.2 |
| 1.59 | 33.1 |
| 1.60 | 33.2 |
| 1.61 | 34.1 |
| 1.62 | 34.2 |
| 1.63 | 35.1 |
| 1.64 | 35.2 |
| 1.65 | 19.1 |
| 1.66 | 35.3 |
| 1.67 | 36.1 |
| 1.68 | 36.2 |
| 1.69 | 37.1 |
| 1.70 | 37.2 |
| 1.71 | 37.3 |
| 1.72 | 38.1 |
| 1.73 | 38.2 |
| 1.74 | 38.3 |
| 1.75 | 39.1 |
| 1.76 | 39.2 |
| 3.6 (dual-render for remaining tabs) | 3.6 |
