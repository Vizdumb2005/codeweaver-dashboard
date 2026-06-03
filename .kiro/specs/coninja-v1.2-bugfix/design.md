# CoNinja v1.2 Bugfix Design

## Overview

The CoNinja v1.2 dashboard suffers from four distinct bug families that collectively reduce production readiness to 39/100. The root cause of the majority of defects is a **dual-render pattern** in `switchTab()` (`js/ui.js`) that calls both `renderX()` and `initX()` for the same component on every tab switch — and several `initX()` functions internally call `renderX()` again, causing double DOM writes, duplicate event listeners, and in the case of Memory Vault, a race condition that leaves the container empty.

The fix strategy is:
1. **Eliminate the dual-render pattern** in `switchTab()` by establishing a single-call contract per component.
2. **Enforce canonical navigation topology** by making `switchTab()` restore the nav DOM from `index.html`'s static structure rather than allowing components to mutate it.
3. **Fix the Memory Vault empty-content regression** by ensuring `initMemory` always runs before `renderMemory`.
4. **Remove the Shadow Guard debug ID leak** by stripping the raw `strw-id` text node from the toggle template.
5. **Replace residual Unicode/emoji icons** with `ninjaIcons.get()` calls at the component template level.
6. **Fix label/value duplication** at each call site (topbar, budget span, testing stats, approvals deadline, repo branch, Yin/Yang labels).
7. **Apply high/medium priority fixes** (settings tab overflow, defer button color, budget alarm state, agent naming, MCP matrix, wizard overlay, etc.).

No architectural rewrites are required. All fixes are targeted, minimal, and reversible.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers a defect — e.g., `switchTab()` calling both `renderX()` and `initX()` when `initX` internally calls `renderX`.
- **Property (P)**: The desired correct behavior — e.g., each label appears exactly once; nav topology is identical on every screen.
- **Preservation**: Existing behaviors confirmed fixed in prior audits that must not regress (Agent Studio, Testing Grounds, Shadow Guard render, Ops & Recovery nav item, Neural Graph zoom buttons, Approvals count, Pulse Monitor data, Deploy Gate buttons, Notifications filter bar, Intelligence heading).
- **Dual-render pattern**: The anti-pattern in `switchTab()` where both `renderX()` and `initX()` are called sequentially, and `initX()` also calls `renderX()` internally, causing the container to be written twice.
- **Canonical nav topology**: The fixed 6-group, 28-item navigation structure defined in `index.html` that must be identical on every screen.
- **`switchTab(tabId)`**: The central navigation function in `js/ui.js` that activates a tab content panel and triggers component initialization.
- **`initX()` / `renderX()`**: Per-component function pair. `initX()` writes the container scaffold HTML and wires events; `renderX()` fills dynamic data into existing DOM nodes. The contract is: `initX()` calls `renderX()` internally; `switchTab()` calls only `initX()`.
- **`strw-id`**: A debug attribute whose value (`553c828c`) is being rendered as a visible text node in the Shadow Guard toggle area.
- **`ninjaIcons.get(name)`**: The SVG icon registry in `js/icons.js` that returns inline SVG strings. All Unicode symbols and emoji must be replaced with calls to this function.

---

## Bug Details

### Bug Family 1 — Systemic Label/Value Duplication

The bug manifests when any screen renders a label-value pair where the label text is present both as a static text node in the HTML template AND as a dynamically injected string in the same element, or where a function returns a prefixed string that is then wrapped in another prefix.

**Formal Specification:**
```
FUNCTION isBugCondition_LabelDuplication(element)
  INPUT: element of type DOMElement
  OUTPUT: boolean

  RETURN element.textContent MATCHES /(\b\w[\w\s]+):\s*\1:/
         OR element.textContent MATCHES /\$[\d.]+\s+\$[\d.]+/
         OR element.textContent MATCHES /^(Yin|Yang)(\w+)$/   // no separator
END FUNCTION
```

**Concrete Examples:**

| Bug ID | Element | Actual Text | Expected Text |
|--------|---------|-------------|---------------|
| 1.1 | `<h1>` brand heading | "coNinja coNinja Shadow Swarm v1.2" | "coNinja Shadow Swarm v1.2" |
| 1.2 | `.budget-spent` span | "$4.45 $4.45 / $5.00" | "$4.45 / $5.00" |
| 1.3 | Testing suite stat rows | "Total: Total: 12" | "Total: 12" |
| 1.4 | Approvals deadline cell | "OVERDUE: OVERDUE" | "⚠ OVERDUE" |
| 1.5 | Repo branch info panel | "Active Branch: Active Branch: main" | "Active Branch: main" |
| 1.6 | Yin/Yang persona labels | "YinPrecise" / "YangCreative" | "Yin: Precise" / "Yang: Creative" |

### Bug Family 2 — Dual-Render Pattern (Double DOM Write)

The bug manifests when `switchTab()` calls both `renderX()` and `initX()` for the same component, and `initX()` internally calls `renderX()` again.

**Formal Specification:**
```
FUNCTION isBugCondition_DualRender(tabId)
  INPUT: tabId of type string
  OUTPUT: boolean

  callsRender   ← switchTab calls renderX(tabId) directly
  callsInit     ← switchTab calls initX(tabId) directly
  initCallsRender ← initX body contains a call to renderX

  RETURN callsRender AND callsInit AND initCallsRender
END FUNCTION
```

**Affected tabs (confirmed dual-render):**
- `monitoring`: `switchTab` calls `renderMonitoring()` then `initMonitoring()`; `initMonitoring` calls `renderMonitoring()` → 2× DOM write → duplicate `<h2>` and `<select>`.
- `deployment`: same pattern.
- `notifications`: same pattern.
- `memory`: `switchTab` calls `renderMemory()` first (before container HTML exists), then `initMemory()` which writes the container and calls `renderMemory()` again. The first `renderMemory()` call finds no DOM targets and silently exits, leaving the container empty if `initMemory` is never reached (e.g., due to an error).

### Bug Family 3 — Non-Deterministic Navigation Topology

The bug manifests when any component's `init` or `render` function directly mutates `.nav-section` DOM elements (adding/removing items, changing element types from `<button>` to `<span>`, or collapsing sections), causing the nav structure to differ per screen.

**Formal Specification:**
```
FUNCTION isBugCondition_NavTopology(tabId)
  INPUT: tabId of type string
  OUTPUT: boolean

  navSections ← document.querySelectorAll('.nav-section-title')
  RETURN navSections.length ≠ 6
         OR navSections[0].textContent ≠ 'Mission Control'
         OR navSections[1].textContent ≠ 'Engineering'
         OR navSections[2].textContent ≠ 'Intelligence'
         OR navSections[3].textContent ≠ 'Operations'
         OR navSections[4].textContent ≠ 'Governance'
         OR navSections[5].textContent ≠ 'Infrastructure'
         OR EXISTS item IN navItems WHERE item.tagName ≠ 'BUTTON'
END FUNCTION
```

### Bug Family 4 — Shadow Guard Debug ID Leak

The `strw-id` attribute value `553c828c` is rendered as a visible text node inside the critical vulnerability gate toggle area in `security.js`. This is a debug artifact left in the template string.

### Bug Family 5 — Icon System Failures

`initIconSystem()` in `icons.js` runs `replaceTextIcons()` on broad selectors including `span`, `.value`, `.label`. The function operates on `textContent` and attempts regex replacement, but many elements use `innerHTML` with mixed SVG and text, causing the replacement to fail silently or corrupt SVG markup. Additionally, several components hardcode Unicode/emoji directly in template literals, bypassing the icon system entirely.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors (confirmed fixed in prior audits — must not regress):**
- Agent Studio (`agent-studio`) renders the full code editor, agent config panels, and file tree.
- Testing Grounds (`testing`) renders the full test suite dashboard with coverage metrics and runner controls.
- Shadow Guard (`security`) renders the full security center with vulnerability scanner and score 87/100.
- Ops & Recovery nav item renders as a `<button>` element (not a `<span>`).
- Neural Graph zoom buttons have `aria-label` attributes ("Zoom In", "Zoom Out") and no debug tooltip text.
- Approvals screen renders exactly 5 pending approval cards matching the "5 Pending" badge count.
- Pulse Monitor renders coherent data values (89,450 requests, 0.35% error rate, 148ms latency, $4.89 cost for 7-day range).
- Deploy Gate "Promote to Production" button is RED with a lock icon, distinct from the orange "Deploy to Staging" button.
- Shadow Guard primary action button reads "Run Scan Now" (orange) with "Review Approvals" as secondary.
- Notifications screen renders a single filter bar (All / Mark All Read / Clear All), not two.
- Intelligence screen renders a single "Repository Intelligence" heading, not two.
- All 28 screens render without blank content areas.
- Kanban drag-and-drop moves cards with smoke puff animation and updates task status.
- Nav item clicks switch active tab content and update the active nav item highlight.
- Budget bar fill below 100% displays in amber/orange (not red).

**Scope of non-buggy inputs:**
All inputs that do NOT involve the specific bug conditions above (i.e., tab switches that do not trigger dual-render, DOM elements that do not contain duplicated labels, nav items that are not mutated by components) must be completely unaffected by this fix.

---

## Hypothesized Root Cause

### RC-1: Dual-Render Pattern in `switchTab()` — `js/ui.js`

**Location:** `js/ui.js`, `window.switchTab` function, lines covering the `if (tabId === "monitoring")`, `if (tabId === "deployment")`, `if (tabId === "notifications")`, `if (tabId === "memory")` blocks.

**Mechanism:** For `monitoring`, `deployment`, and `notifications`, `switchTab` calls both `renderX()` and `initX()` sequentially. Inspection of `monitoring.js` confirms `window.initMonitoring = function() { renderMonitoring(); }` — so the sequence is: `renderMonitoring()` → writes full HTML → `initMonitoring()` → calls `renderMonitoring()` again → overwrites HTML a second time, attaching a second set of event listeners.

For `memory`, the order is reversed: `switchTab` calls `renderMemory()` first (which calls `_renderPinnedEntries()` and `_renderRetentionRules()` — both look for `#memory-pinned-list` and `#memory-retention-list` which don't exist yet), then calls `initMemory()` which writes the container HTML and calls `renderMemory()` again. The first `renderMemory()` call silently exits because the DOM targets don't exist, leaving the container in whatever state `initMemory` produces — which is correct. However, if `switchTab` is called while `initMemory` hasn't run yet (e.g., on first navigation), the container is empty until `initMemory` completes.

**Fix:** Establish a single-call contract: `switchTab` calls only `initX()` for components that have an `initX`. `initX` is responsible for writing the container HTML and calling `renderX()` internally. For components that only have `renderX()` (no `initX`), `switchTab` calls `renderX()` directly. Remove all duplicate calls.

### RC-2: Navigation Topology Drift — Component `init` Functions Mutating Nav DOM

**Location:** Various component `init` functions that call `document.querySelector('.nav-section')` or similar selectors and modify nav items.

**Mechanism:** When a component's `init` function runs, it may add, remove, or retype nav items to reflect its own context. Since `switchTab` does not restore the nav DOM before calling `initX`, each screen can leave the nav in a different state.

**Fix:** Add a `restoreNavTopology()` call at the top of `switchTab()` that reads the canonical nav structure from `window.canonicalLabels.nav` and `index.html`'s static structure, then ensures all nav items are `<button>` elements with correct `data-tab` attributes. Alternatively, prohibit component `init` functions from touching the nav DOM at all (preferred — simpler and more robust).

### RC-3: Brand Heading Duplication — `index.html` Static Text + `renderMetrics()` Re-injection

**Location:** `index.html` line with `<h1>coNinja <span class="badge badge-orange">Shadow Swarm v1.2</span></h1>` and `renderMetrics()` in `js/ui.js` or simulation loop.

**Mechanism:** The `<h1>` already contains the text node "coNinja". If `renderMetrics()` or the simulation loop sets `h1.innerHTML` to a string that includes "coNinja" again, the text node and the injected string coexist.

**Fix:** `renderMetrics()` must not touch the brand `<h1>`. The brand heading is static HTML and should never be modified by JavaScript.

### RC-4: Budget Span Duplication — Static HTML + `renderMetrics()` `innerHTML` Assignment

**Location:** `index.html` `.budget-spent` span contains static text `$1.42 <span class="budget-total">/ $5.00</span>`. `renderMetrics()` sets `elSpent.innerHTML` to a new string.

**Mechanism:** If `renderMetrics()` sets `elSpent.innerHTML = '$4.45 <span class="budget-total">/ $5.00</span>'`, this correctly replaces the static content. The duplication occurs only if `renderMetrics()` appends to `innerHTML` rather than replacing it, or if it sets `innerText` on the parent while the child span already contains text.

**Fix:** Ensure `renderMetrics()` uses `innerHTML =` (assignment, not `+=`) on `.budget-spent`, and that the assigned string does not include a redundant dollar amount prefix.

### RC-5: Testing Suite Stat Row Duplication — `suitCardHTML()` in `testing.js`

**Location:** `js/components/testing.js`, `suitCardHTML()` function, the stats grid section.

**Mechanism:** The template literal uses `<span>Total: <strong>${suite.total}</strong></span>`. The label "Total:" is embedded in the `<span>` text node. This is correct and should NOT produce duplication on its own. The duplication ("Total: Total: 12") would occur if the outer `<span>` wrapper also contains a hardcoded "Total:" prefix, or if `suitCardHTML` is called twice and the results are concatenated into the same container without clearing it first.

**Fix:** Verify that the container is cleared (`innerHTML = ''`) before inserting suite cards, and that `suitCardHTML` is not called in a context where its output is appended to existing content that already contains the labels.

### RC-6: Approvals Deadline Label Duplication — `getDeadlineLabel()` + Template Prefix

**Location:** `js/components/approvals.js`, `getDeadlineLabel()` returns `'⚠ OVERDUE'`, and the cell template uses `` `${getDeadlineLabel(a.deadline)}: ${formatDeadline(a.deadline)}` ``.

**Mechanism:** `formatDeadline()` returns `'OVERDUE'` when the deadline has passed. `getDeadlineLabel()` returns `'⚠ OVERDUE'`. The template concatenates them as `"⚠ OVERDUE: OVERDUE"`.

**Fix:** When `formatDeadline()` returns `'OVERDUE'`, the template should display only `getDeadlineLabel()` without appending `formatDeadline()`. Alternatively, `getDeadlineLabel()` should return only the status prefix (e.g., `'⚠'`) and `formatDeadline()` should return the full human-readable string including "OVERDUE".

### RC-7: Shadow Guard Debug ID Leak — `security.js` Template String

**Location:** `js/components/security.js`, `renderSecurity()`, the "BLOCK ON CRITICAL WARNING" section template.

**Mechanism:** A `strw-id="553c828c"` attribute was added to the toggle `<label>` element during debugging. The attribute value is being rendered as a visible text node, likely because the template string accidentally includes the attribute value outside of the HTML attribute context (e.g., `strw-id="553c828c" 553c828c` where the second occurrence is a stray text node).

**Fix:** Remove the `strw-id` attribute and any stray text node containing the hash value from the template string.

### RC-8: Icon System Failures — Hardcoded Unicode in Component Templates

**Location:** Multiple component files: `memory.js` (`⏳`), `workflow.js` (`⏪`, `⏱️`), `multiplexer.js` (emojis), `intelligence.js` (`◈`), `settings.js` (`⊡`), `projects.js` (`⭐`, `↩️`), `deployment.js` (`◎`), `security.js` (`◈` in multiple places).

**Mechanism:** Components hardcode Unicode symbols and emoji directly in template literal strings. `initIconSystem()` runs `replaceTextIcons()` on broad selectors after initial load, but this does not cover dynamically rendered content (components rendered on tab switch after `initIconSystem()` has already run).

**Fix:** Replace all hardcoded Unicode/emoji in component template strings with `window.ninjaIcons ? window.ninjaIcons.get('iconName') : ''` inline calls. This is the same pattern already used correctly in `monitoring.js`, `security.js` (partially), and `approvals.js`.

---

## Correctness Properties

Property 1: Bug Condition — No Label/Value Duplication in Any Rendered Element

_For any_ DOM element rendered by the fixed application where the element contains a label-value pair, the fixed render functions SHALL produce text content where each label prefix appears exactly once, the budget value appears exactly once, and Yin/Yang labels include a separator character between the prefix and the category name.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 2: Bug Condition — Single DOM Write Per Tab Switch

_For any_ call to `switchTab(tabId)` where `tabId` is one of `monitoring`, `deployment`, `notifications`, or `memory`, the fixed `switchTab` function SHALL cause the component container's `innerHTML` to be written exactly once, producing exactly one instance of each structural element (headings, selects, panels) and attaching event listeners exactly once.

**Validates: Requirements 2.7, 2.12**

Property 3: Bug Condition — Canonical Navigation Topology on Every Screen

_For any_ call to `switchTab(tabId)` for any of the 28 tab IDs, the fixed application SHALL render the navigation sidebar with exactly 6 groups in the order: Mission Control, Engineering, Intelligence, Operations, Governance, Infrastructure; all navigation items SHALL be `<button>` elements with `data-tab` attributes; no group SHALL be missing or have its items absorbed into another group.

**Validates: Requirements 2.9, 2.10**

Property 4: Bug Condition — Memory Vault Full Content Render

_For any_ call to `switchTab('memory')`, the fixed application SHALL render all 8 content sections: stat cards row, Vector Memory Search panel, Pinned Memory Entries panel, Impact Analysis Tool panel, Retention Policies panel, Vector Settings panel, Graph Settings panel, and Export/Import panel.

**Validates: Requirement 2.11**

Property 5: Bug Condition — Shadow Guard No Debug ID Visible

_For any_ render of the Shadow Guard screen, the fixed application SHALL display only the toggle control and its label in the critical vulnerability gate area, with no raw element hash IDs or debug strings (e.g., `553c828c`) visible as text content.

**Validates: Requirement 2.8**

Property 6: Bug Condition — SVG Icons Replace All Unicode/Emoji

_For any_ screen rendered by the fixed application, the fixed render functions SHALL display SVG icons from the `ninjaIcons` registry in place of all Unicode symbols (◈, ✦, ⊙, ⊡, ◇, △, ●, ✱, ◎, ⊕, ★) and emoji characters (⏸️, ⏰, ⏳, ℹ️, ↩️, ⭐, ⏪, ⏱️, ◎).

**Validates: Requirements 2.16**

Property 7: Preservation — Confirmed-Fixed Screens Do Not Regress

_For any_ input that navigates to one of the 11 confirmed-fixed screens (agent-studio, testing, security, ops-recovery nav item, neural-graph zoom buttons, approvals count, monitoring data values, deployment buttons, shadow-guard action buttons, notifications filter bar, intelligence heading), the fixed application SHALL produce the same correct render output as the pre-fix baseline, preserving all previously fixed behaviors.

**Validates: Requirements 3.1 through 3.15**

---

## Fix Implementation

### Architecture Decision: Single-Call Contract for `switchTab()`

**Decision:** `switchTab()` SHALL call only one function per component — either `initX()` (for components that have one) or `renderX()` (for components that only have a render function). `initX()` is solely responsible for writing the container scaffold HTML and calling `renderX()` internally. `switchTab()` must never call both `renderX()` and `initX()` for the same component.

**Rationale:** This eliminates the dual-render pattern at its source without requiring changes to individual component files (except to ensure `initX` calls `renderX` internally, which most already do).

**Affected `switchTab()` blocks to fix:**

| Tab ID | Current (broken) | Fixed |
|--------|-----------------|-------|
| `monitoring` | `renderMonitoring(); initMonitoring();` | `initMonitoring();` |
| `deployment` | `renderDeployment(); initDeployment();` | `initDeployment();` |
| `notifications` | `renderNotifications(); initNotifications();` | `initNotifications();` |
| `memory` | `renderMemory(); initMemory();` | `initMemory();` |
| `workflow` | `renderWorkflow(); initWorkflow();` | `initWorkflow();` |
| `debate` | `renderDebate(); initDebate();` | `initDebate();` |
| `agent-studio` | `renderAgentStudio(); initAgentStudio();` (or vice versa) | `initAgentStudio();` |
| `testing` | `renderTesting(); initTesting();` | `initTesting();` |
| `security` | `renderSecurity(); initSecurity();` | `initSecurity();` |
| `approvals` | `renderApprovals(); initApprovals();` | `initApprovals();` |
| `ops-recovery` | `renderOpsRecovery(); initOpsRecovery();` | `initOpsRecovery();` |
| `projects` | `renderProjects(); initProjects();` | `initProjects();` |
| `provenance` | `renderProvenance(); initProvenance();` | `initProvenance();` |
| `pull-requests` | `renderPullRequests(); initPullRequests();` | `initPullRequests();` |
| `repo-explorer` | `renderRepoExplorer(); initRepoExplorer();` | `initRepoExplorer();` |
| `notifications` | `renderNotifications(); initNotifications();` | `initNotifications();` |

For components that only expose `renderX()` (no `initX`), `switchTab()` continues to call `renderX()` directly.

### Architecture Decision: Nav Topology Enforcement

**Decision:** Add a `restoreNavTopology()` helper that is called at the start of `switchTab()`. This function verifies that all `.nav-section` groups are present and all `.nav-item` elements are `<button>` elements. If any item has been converted to a `<span>`, it replaces it with a `<button>` with the same `data-tab` attribute and content. Component `init` functions are prohibited from modifying `.nav-section` or `.nav-item` elements.

**Alternative considered:** Re-render the entire nav from `window.canonicalLabels.nav` on every tab switch. Rejected because it would destroy the active state highlight and counter badges, requiring additional re-sync logic.

**Preferred approach:** Defensive restoration — only fix what's broken, leave correct items untouched.

```javascript
// js/ui.js — add before switchTab body
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
  // Ensure all 6 sections are expanded (not collapsed by component side effects)
  document.querySelectorAll('.nav-section.collapsed').forEach(s => s.classList.remove('collapsed'));
}
```

### Component-Level Fix Specifications

#### `js/ui.js` — `switchTab()`

**Changes:**
1. Add `restoreNavTopology()` call at the top of the function body (after state update, before tab content toggle).
2. For every component block that calls both `renderX()` and `initX()`, remove the `renderX()` call, keeping only `initX()`.
3. Verify that the `memory` block calls only `initMemory()` (not `renderMemory()` first).

#### `js/ui.js` — `renderMetrics()`

**Changes:**
1. Remove any code that sets `innerHTML` on the brand `<h1>` element. The brand heading is static and must not be touched.
2. Ensure `.budget-spent` is updated via `innerHTML =` (assignment) with a string that does not duplicate the dollar amount. The correct pattern: `elSpent.innerHTML = \`$\${cost.toFixed(2)} <span class="budget-total">/ $\${limit.toFixed(2)}</span>\``.

#### `js/components/testing.js` — `suitCardHTML()`

**Changes:**
1. Verify the stats grid template: `<span>Total: <strong>${suite.total}</strong></span>` — this is correct. The fix is to ensure the container (`#testing-suites-grid`) is cleared with `innerHTML = ''` before inserting suite cards, preventing accumulation of duplicate cards on re-render.
2. If `renderTesting()` is called multiple times (due to dual-render), the second call overwrites the first — this is acceptable as long as the container is cleared first. The dual-render fix in `switchTab()` eliminates the root cause.

#### `js/components/approvals.js` — `getDeadlineLabel()` + template

**Changes:**
1. Change the deadline cell template from:
   `` `<span class="deadline ${getDeadlineClass(a.deadline)}">${getDeadlineLabel(a.deadline)}: ${formatDeadline(a.deadline)}</span>` ``
   to:
   `` `<span class="deadline ${getDeadlineClass(a.deadline)}">${getDeadlineLabel(a.deadline)}${formatDeadline(a.deadline) !== 'OVERDUE' ? ': ' + formatDeadline(a.deadline) : ''}</span>` ``
2. This ensures "⚠ OVERDUE" is displayed without the redundant ": OVERDUE" suffix.

#### `js/components/security.js` — Debug ID Leak

**Changes:**
1. Search the template string in `renderSecurity()` for `strw-id` and `553c828c`.
2. Remove the `strw-id="553c828c"` attribute from the toggle `<label>` element.
3. Remove any stray text node containing `553c828c`.

#### `js/components/memory.js` — `initMemory()` / `renderMemory()`

**Changes:**
1. Confirm that `initMemory()` writes the container HTML and then calls `window.renderMemory()` at the end (it already does: `window.renderMemory(); _wireMemoryEvents();`).
2. The fix is entirely in `switchTab()` — remove the `renderMemory()` call that precedes `initMemory()`.
3. No changes needed to `memory.js` itself.

#### `js/components/monitoring.js` — `initMonitoring()`

**Changes:**
1. Confirm `window.initMonitoring = function() { renderMonitoring(); }` — this is correct. `initMonitoring` calls `renderMonitoring` internally.
2. The fix is entirely in `switchTab()` — remove the direct `renderMonitoring()` call.
3. No changes needed to `monitoring.js` itself.

#### `js/components/memory.js` — Retention Policies Panel Icon

**Changes:**
1. Replace `<span>⏳</span>` in the Retention Policies panel header with `${window.ninjaIcons ? window.ninjaIcons.get('hourglass') : ''}`.

#### `js/components/settings.js` — Yin/Yang Label Separator

**Changes:**
1. Locate the Yin/Yang persona balance label construction in the settings pane renderer.
2. Change the label template from `Yin${tone}` / `Yang${tone}` to `Yin: ${tone}` / `Yang: ${tone}` (add colon-space separator).

#### `js/components/settings.js` — Provider Type Column Consistency

**Changes:**
1. In `renderModelsPane()`, the `<span class="provider-type ${isLocal ? 'local' : 'cloud'}">` already applies a class. Add CSS rules for `.provider-type.local` and `.provider-type.cloud` to render both as styled badges (same visual treatment).

#### `js/components/settings.js` — Settings Tab Overflow (HIGH)

**Changes:**
1. Add CSS to the settings tab row container: `overflow-x: auto; scrollbar-width: thin;` and remove `white-space: nowrap` if present, or add `flex-wrap: wrap` to allow tabs to wrap to a second line.
2. Preferred: `flex-wrap: wrap` so all 10 tabs are visible without a scrollbar.

#### `js/components/approvals.js` — Defer Button Color (HIGH)

**Changes:**
1. The Defer button currently uses inline style `style="border-color:rgba(156,39,176,0.3); color:#9c27b0;"` (purple/violet).
2. Change to `class="btn btn-outline btn-sm"` with no inline color override, matching the secondary dark/outlined button style.

#### `js/ui.js` — Budget Alarm State (HIGH)

**Changes:**
1. In `renderMetrics()`, when `accumulatedCost >= dailyLimit`, apply the `budget-depleted` class to `.budget-spent` AND set `.budget-bar-fill` background to `#ef4444` AND set `.budget-badge` border to `rgba(239,68,68,0.3)`.
2. When `accumulatedCost < dailyLimit`, remove `budget-depleted` class and restore amber/orange fill.

#### `js/components/monitoring.js` — Agent Naming Consistency (MEDIUM)

**Changes:**
1. `AGENT_ACTIVITY` array uses IDs like `coder1`, `tester`, `security`. The render already does `const name = agentInfo ? agentInfo.name : agent.id;` which resolves to canonical names from `window.state.agents`.
2. Verify that `window.canonicalInit()` has run before `renderMonitoring()` is called (it runs in `app.js` step 2, before any tab renders). No code change needed — the existing resolution is correct.
3. If `window.state.agents[agent.id]` is undefined for any ID in `AGENT_ACTIVITY`, add a fallback to `window.getAgentDisplayName(agent.id)`.

#### `js/components/approvals.js` — MCP Registry Authorization Matrix (MEDIUM)

**Changes:**
1. In `js/components/mcp.js` (or wherever the MCP Registry Authorization Matrix is rendered), replace the hardcoded single-agent row with `Object.values(window.state.agents).map(agent => ...)` to render one row per configured agent.

#### `js/components/wizard.js` — Modal Overlay Persistence (MEDIUM)

**Changes:**
1. In the wizard dismiss handler, ensure `modal.classList.remove('active')` is called AND the modal element is removed from the DOM (or its `display` is set to `none`).
2. Add a check in `app.js` step 5c (already present: `document.querySelectorAll('.modal-overlay.active').forEach(modal => modal.classList.remove('active'))`) — verify this runs after wizard init.

#### `js/components/notifications.js` — Page Title Mismatch (MEDIUM)

**Changes:**
1. Change the page heading in `renderNotifications()` from "Mission Control Alerts" to "Notifications" to match the nav label, OR update the nav label in `index.html` from "Notifications" to "Mission Control Alerts". The nav label is the user-facing entry point, so matching the page title to the nav label is preferred.

#### `js/components/sandbox-multiplexer.js` — Exit Code 137 Explanation (MEDIUM)

**Changes:**
1. Add a lookup table for known exit codes. When exit code 137 is rendered, display: "Exit 137 (OOM Kill — container exceeded memory limit)".

#### `js/components/sandbox-multiplexer.js` — Add Terminal Button Accessibility (MEDIUM)

**Changes:**
1. Add `aria-label="Add new terminal"` to all "+" add terminal buttons.

#### `js/components/neural-graph.js` — Color Legend (MEDIUM)

**Changes:**
1. Add a color legend panel to the Neural Graph container identifying: orange = orchestrator, cyan = data flow, purple = external dependency.

### Icon System Replacement Strategy

The `initIconSystem()` / `replaceTextIcons()` approach is fundamentally unreliable for dynamically rendered content because it runs once at startup and cannot intercept template strings rendered later. The replacement strategy is:

1. **Do not rely on `replaceTextIcons()` for component-rendered content.** It can remain for static HTML in `index.html` but should not be the primary mechanism.
2. **Fix at the source:** Each component template string that contains a Unicode symbol or emoji must be updated to use `window.ninjaIcons ? window.ninjaIcons.get('iconName') : ''` inline.
3. **Priority order for icon replacement:**
   - `memory.js`: `⏳` → `ninjaIcons.get('hourglass')`
   - `security.js`: all `◈` occurrences in panel headers → `ninjaIcons.get('diamond')` or appropriate icon
   - `testing.js`: all `◈` occurrences → `ninjaIcons.get('diamond')`
   - `projects.js`: `⭐` → `ninjaIcons.get('star')`, `↩️` → `ninjaIcons.get('revert')`
   - `deployment.js`: `◎` in page header → `ninjaIcons.get('circle')`
   - `settings.js`: `⊡` agent icons → `ninjaIcons.get('square')` or role-specific icon
   - `workflow.js`: `⏪` → `ninjaIcons.get('rewind')`, `⏱️` → `ninjaIcons.get('clock')`
   - `multiplexer.js`: all emoji → appropriate `ninjaIcons` calls
   - `intelligence.js`: `◈` search icon → `ninjaIcons.get('diamond')`
4. **Infrastructure section toggle icon:** `index.html` Infrastructure section uses `▼` as the toggle icon text. Replace with the SVG chevron used by other sections.

---

## Regression Prevention Strategy

The 11 confirmed-fixed items must not regress. The following safeguards are applied:

### Safeguard 1: `switchTab()` Single-Call Contract (Structural)
By removing duplicate `renderX()` calls from `switchTab()`, the dual-render pattern that caused most regressions is eliminated at the source. Any future addition of a new component to `switchTab()` must follow the single-call contract.

### Safeguard 2: `restoreNavTopology()` on Every Tab Switch (Structural)
By calling `restoreNavTopology()` at the start of every `switchTab()`, any nav mutation introduced by a component is immediately corrected on the next tab switch. This provides a self-healing mechanism.

### Safeguard 3: Component `init` Functions Must Not Touch Nav DOM (Convention)
Document in code comments that component `init` and `render` functions must not query or modify `.nav-section`, `.nav-item`, or `.sidebar` elements. This is enforced by code review.

### Safeguard 4: Property-Based Tests for Critical Invariants (Automated)
The correctness properties defined above are implemented as automated tests (see Testing Strategy). These tests run on every render and catch regressions before they reach production.

### Safeguard 5: Idempotent Render Functions (Structural)
All `renderX()` functions must be idempotent: calling them multiple times must produce the same DOM state as calling them once. This is achieved by clearing the container (`innerHTML = ''`) at the start of each render, or by using targeted DOM updates that overwrite rather than append.

### Safeguard 6: Event Listener Deduplication (Structural)
Use `dataset.wired = '1'` guards (already present in `security.js`, `approvals.js`, `testing.js`) on all event listener attachments. This prevents duplicate listeners even if a render function is called multiple times.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate each bug on the unfixed code to confirm root cause analysis; then verify the fix works correctly and preserves existing behavior.

All tests are written as vanilla JS functions that can be executed in the browser console or via a lightweight test harness injected into the page. Property-based tests use a simple generator approach (no external library required for the browser context).

---

### Exploratory Bug Condition Checking

**Goal:** Surface counterexamples that demonstrate each bug BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Plan:** Simulate tab switches and DOM queries, then assert on the resulting DOM state.

**Test Cases:**

1. **Dual-Render — Monitoring:** Call `window.switchTab('monitoring')`. Count `document.querySelectorAll('#monitoring-container h2').length`. Expected on unfixed code: 2. Expected after fix: 1.

2. **Dual-Render — Memory Vault:** Call `window.switchTab('memory')`. Check `document.getElementById('memory-pinned-list')`. Expected on unfixed code: may be null (if `renderMemory` runs before container exists). Expected after fix: non-null element with content.

3. **Nav Topology — Memory Screen:** Call `window.switchTab('memory')`. Count `document.querySelectorAll('.nav-section-title').length`. Expected on unfixed code: may be < 6. Expected after fix: exactly 6.

4. **Nav Topology — Notifications Screen:** Call `window.switchTab('notifications')`. Check `document.querySelectorAll('.nav-item[data-tab="mission-reports"]')[0].tagName`. Expected on unfixed code: `'SPAN'`. Expected after fix: `'BUTTON'`.

5. **Label Duplication — Budget:** After `window.renderMetrics()`, check `document.querySelector('.budget-spent').textContent`. Expected on unfixed code: matches `/\$[\d.]+\s+\$[\d.]+/`. Expected after fix: does not match.

6. **Label Duplication — Testing Stats:** Call `window.switchTab('testing')`. Check first suite card stat text. Expected on unfixed code: "Total: Total: 12". Expected after fix: "Total: 12".

7. **Debug ID Leak — Shadow Guard:** Call `window.switchTab('security')`. Check `document.querySelector('#security-container').textContent.includes('553c828c')`. Expected on unfixed code: true. Expected after fix: false.

8. **Approvals Deadline Duplication:** Call `window.switchTab('approvals')`. Find an overdue deadline cell. Check its text content. Expected on unfixed code: "⚠ OVERDUE: OVERDUE". Expected after fix: "⚠ OVERDUE".

**Expected Counterexamples on Unfixed Code:**
- `#monitoring-container` contains 2 `<h2>` elements and 2 `<select>` elements.
- `#memory-container` is empty or missing content sections.
- `.nav-section-title` count is < 6 on certain screens.
- `.budget-spent` textContent contains duplicate dollar amounts.
- Suite stat rows contain duplicated label prefixes.
- `#security-container` textContent contains `553c828c`.

---

### Fix Checking

**Goal:** Verify that for all inputs where the bug condition holds, the fixed functions produce the expected behavior.

**Pseudocode:**
```
FOR ALL tabId IN ['monitoring', 'deployment', 'notifications', 'memory'] DO
  switchTab(tabId)
  container ← getContainer(tabId)
  ASSERT countHeadings(container) = 1
  ASSERT countSelects(container) ≤ expectedSelectCount(tabId)
  ASSERT noLabelDuplication(container)
END FOR

FOR ALL screen IN ALL_TAB_IDS DO
  switchTab(screen)
  ASSERT navSectionCount() = 6
  ASSERT navSectionTitles() = ['Mission Control', 'Engineering', 'Intelligence', 'Operations', 'Governance', 'Infrastructure']
  ASSERT allNavItemsAreButtons()
END FOR

switchTab('memory')
ASSERT document.getElementById('memory-pinned-list') ≠ null
ASSERT document.getElementById('memory-retention-list') ≠ null
ASSERT document.getElementById('memory-search-input') ≠ null

switchTab('security')
ASSERT NOT document.querySelector('#security-container').textContent.includes('553c828c')

renderMetrics()
ASSERT NOT document.querySelector('.budget-spent').textContent.match(/\$[\d.]+\s+\$[\d.]+/)
```

---

### Preservation Checking

**Goal:** Verify that for all inputs where the bug condition does NOT hold, the fixed application produces the same result as the pre-fix baseline.

**Pseudocode:**
```
FOR ALL screen IN CONFIRMED_FIXED_SCREENS DO
  result_original ← captureRenderOutput(screen, UNFIXED_CODE)
  result_fixed    ← captureRenderOutput(screen, FIXED_CODE)
  ASSERT result_original = result_fixed
END FOR

// Specific preservation assertions
switchTab('agent-studio')
ASSERT document.getElementById('agent-studio-container').innerHTML.length > 0
ASSERT document.querySelector('#agent-studio-container .glass-card') ≠ null

switchTab('testing')
ASSERT document.querySelectorAll('.testing-suite-card').length > 0
ASSERT document.querySelector('#testing-container h2') = null  // no duplicate heading

switchTab('security')
ASSERT document.querySelector('#security-container .glass-card') ≠ null
ASSERT document.querySelector('#security-container').textContent.includes('87')  // score preserved

switchTab('approvals')
ASSERT document.querySelectorAll('.approval-row').length = 5  // 5 pending preserved

switchTab('monitoring')
ASSERT document.querySelectorAll('#monitoring-container h2').length = 1  // single heading
ASSERT document.querySelector('#monitoring-container').textContent.includes('89,450')  // data preserved
```

**Testing Approach:** Property-based testing is recommended for preservation checking because it generates many tab-switch sequences automatically and catches edge cases (e.g., switching to the same tab twice, switching rapidly between tabs) that manual unit tests might miss.

**Test Plan:** Capture the render output of each confirmed-fixed screen on the unfixed code as a baseline snapshot. After applying fixes, verify that the render output matches the baseline for all confirmed-fixed screens.

---

### Unit Tests

- Test `switchTab('monitoring')` produces exactly one `<h2>` in `#monitoring-container`.
- Test `switchTab('memory')` produces a non-null `#memory-pinned-list` element.
- Test `switchTab('memory')` followed by `switchTab('monitoring')` produces correct nav topology on both screens.
- Test `renderMetrics()` with `accumulatedCost = 4.45` produces `.budget-spent` text matching `$4.45 / $5.00` (no duplication).
- Test `renderMetrics()` with `accumulatedCost = 5.00` applies `budget-depleted` class and red bar fill.
- Test `getDeadlineLabel()` + `formatDeadline()` for an overdue deadline produces "⚠ OVERDUE" (not "⚠ OVERDUE: OVERDUE").
- Test `restoreNavTopology()` converts a `<span class="nav-item" data-tab="mission-reports">` to a `<button>`.
- Test `switchTab('security')` does not include `553c828c` in `#security-container` textContent.
- Test `switchTab('testing')` produces suite stat rows with "Total: 12" (not "Total: Total: 12").

---

### Property-Based Tests

- **Property 1 (Label Duplication):** For any tab ID in the full set of 28 tabs, after `switchTab(tabId)`, no DOM element in the active tab container has `textContent` matching `/(\b\w[\w\s]+):\s*\1:/`.
- **Property 2 (Single DOM Write):** For any sequence of tab switches `[t1, t2, ..., tn]` where `ti ∈ DUAL_RENDER_TABS`, after each switch, the component container contains exactly one instance of its primary heading element.
- **Property 3 (Nav Topology):** For any tab ID in the full set of 28 tabs, after `switchTab(tabId)`, `document.querySelectorAll('.nav-section-title').length === 6` and all titles match the canonical order.
- **Property 4 (Nav Item Types):** For any tab ID, after `switchTab(tabId)`, all `.nav-item` elements have `tagName === 'BUTTON'`.
- **Property 5 (Budget No Duplication):** For any value of `window.state.accumulatedCost` in `[0, 5.00]`, after `renderMetrics()`, `.budget-spent.textContent` does not match `/\$[\d.]+\s+\$[\d.]+/`.
- **Property 6 (Preservation):** For any tab ID in `CONFIRMED_FIXED_SCREENS`, the render output after fix matches the pre-fix baseline snapshot.

---

### Integration Tests

- Navigate through all 28 screens in sequence; verify nav topology is correct on each screen.
- Navigate to Memory Vault; verify all 8 content sections are present.
- Navigate to Pulse Monitor; verify exactly one `<h2>` heading and one time-range `<select>`.
- Navigate to Shadow Guard; verify no debug hash visible; verify security score 87 is displayed.
- Navigate to Approvals; verify 5 pending cards; verify defer button uses outline style (not purple).
- Navigate to Testing Grounds; verify suite stat rows show "Total: 12" (not duplicated).
- Simulate budget reaching $5.00; verify red alarm state on budget badge.
- Navigate to Memory Vault after navigating to Monitoring; verify Memory Vault content is fully rendered.
- Navigate to Notifications; verify page title matches nav label.
- Navigate to Settings (Dojo Rules); verify all 10 tabs are visible without truncation.
