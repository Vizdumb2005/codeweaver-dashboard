# Bugfix Requirements Document — CoNinja v1.2 Dashboard

## Introduction

The CoNinja v1.2 dashboard is a vanilla JS single-page application that currently scores 39/100 in production readiness audits. The application suffers from a systemic label/value duplication bug family that renders text twice across nearly every screen, a non-deterministic navigation topology that changes structure per screen, several component-level regressions (Memory Vault empty content, Pulse Monitor duplicate DOM elements, Shadow Guard debug ID leak), and a large backlog of medium-priority UX, accessibility, and polish issues. This document captures all defects found in three audit cycles plus additional issues discovered by direct source inspection, organized by severity, with formal bug conditions and correctness properties for the most critical invariants.

---

## Bug Analysis

### Current Behavior (Defect)

#### CRITICAL — Systemic Label/Value Duplication (Root Cause: Dual Render Pattern)

1.1 WHEN the application renders the topbar brand heading THEN the system displays "coNinja coNinja Shadow Swarm v1.2" because `index.html` `<h1>` contains the literal text "coNinja" as a text node AND `renderMetrics` / simulation loop re-injects the brand string into the same element via `innerHTML`, causing the text node and the injected string to coexist.

1.2 WHEN the simulation loop calls `renderMetrics()` and updates `.budget-spent` via `innerHTML` assignment THEN the system renders the budget value twice in the span (e.g., `$4.45 $4.45 / $5.00`) because `renderMetrics` sets `elSpent.innerHTML` to a full string including the dollar amount, but the element already contains a static dollar amount from the initial HTML, and the assignment appends rather than fully replacing in certain browser render states.

1.3 WHEN the Testing Grounds screen renders suite stat rows THEN the system displays "Total: Total: 12", "Passed: Passed: 8", "Failed: Failed: 2", "Skipped: Skipped: 2", "Coverage: Coverage: 82%", "Duration: Duration: 14.3s" because `suitCardHTML()` in `testing.js` uses template literals that embed both a label string (e.g., `Total:`) as a `<span>` text node AND the same label is also present as a hardcoded prefix in the surrounding `<span>` wrapper.

1.4 WHEN the Approvals screen renders deadline cells THEN the system displays "OVERDUE: OVERDUE" because `getDeadlineLabel()` returns the string "⚠ OVERDUE" and the cell template also prepends the label prefix independently, resulting in the label appearing twice.

1.5 WHEN the Repository screen renders the active branch info panel THEN the system displays "Active Branch: Active Branch: main" because the branch info section in `repoExplorer.js` (or the state dispatch handler) prepends "Active Branch:" as a label AND the data value stored in `window.state.repository.currentBranch` already contains the prefix string from a prior write.

1.6 WHEN the right inspector panel renders the Yin/Yang persona balance labels THEN the system displays "YinPrecise" and "YangCreative" as single concatenated words with no space, because the label construction concatenates the tone category name directly to the Yin/Yang prefix without inserting a separator character (space, colon, or dash).

1.7 WHEN the Pulse Monitor screen is navigated to THEN the system renders two `<h2>` elements both reading "Pulse Monitor — Runtime Health" and two `<select>` time-range dropdowns because `switchTab('monitoring')` in `ui.js` calls both `renderMonitoring()` AND `initMonitoring()` sequentially, and `initMonitoring` itself calls `renderMonitoring()` again, causing the container's `innerHTML` to be written twice and event listeners to be attached twice.

1.8 WHEN the Shadow Guard screen renders the critical vulnerability gate toggle area THEN the system displays the raw browser element hash ID "553c828c" as visible text overlaying the toggle, because a debug `strw-id` attribute value is being rendered as a text node rather than remaining as an HTML attribute.

#### CRITICAL — Non-Deterministic Navigation Topology

1.9 WHEN the user navigates to the Memory Vault screen THEN the system renders a navigation sidebar where the "Engineering" group disappears entirely and its items (Repository, Pull Requests, Workflow Forge, Agent Studio, Testing Grounds) are absorbed into the "Mission Control" group, because `switchTab()` in `ui.js` does not re-render the navigation from a canonical source — instead, each component's init/render function may manipulate `.nav-section` DOM elements directly, causing group membership to drift per screen.

1.10 WHEN the user navigates to the Notifications screen THEN the system renders a navigation sidebar where the "Intelligence" group disappears and Stealth Archives appears in the "Engineering" group as a `<span>` element instead of a `<button>`, making it non-interactive and keyboard-inaccessible.

1.11 WHEN the user navigates to the Approvals screen THEN the system renders a navigation sidebar where "Governance" items sometimes appear inside the "Operations" group, and the group header label changes from "Governance" to "Operations".

1.12 WHEN the user navigates to the Deploy Gate screen THEN the system renders a navigation sidebar where "Dojo Rules" is missing from the "Infrastructure" group.

1.13 WHEN any screen is rendered THEN the system produces a different navigation group structure (different group names, different item membership, different item element types) compared to the canonical structure defined in `index.html`, because no mechanism enforces nav topology consistency after tab switches.

#### CRITICAL — Memory Vault Content Regression

1.14 WHEN the user navigates to the Memory Vault screen THEN the system renders only the page heading and two buttons (Export Memory, Search Memory) with all main content sections empty, because `switchTab('memory')` calls both `renderMemory()` and `initMemory()` — `initMemory()` sets `container.innerHTML` to the full layout and then calls `renderMemory()`, but if `renderMemory()` is called first (before `initMemory()` has written the container HTML), it finds no target DOM elements and silently exits, leaving the container empty.

#### HIGH — Component Double-Init / Double-Render Bugs

1.15 WHEN `switchTab('monitoring')` is called THEN the system calls `renderMonitoring()` followed immediately by `initMonitoring()`, and `initMonitoring` calls `renderMonitoring()` again, resulting in the monitoring container being written twice and producing duplicate DOM elements (two h2 headings, two select dropdowns).

1.16 WHEN `switchTab('deployment')` is called THEN the system calls both `renderDeployment()` and `initDeployment()` sequentially; if `initDeployment` also calls `renderDeployment()` internally, the deployment container is rendered twice.

1.17 WHEN `switchTab('notifications')` is called THEN the system calls both `renderNotifications()` and `initNotifications()` sequentially; if `initNotifications` also calls `renderNotifications()` internally, the notifications container is rendered twice.

#### HIGH — Dojo Rules Tab Overflow

1.18 WHEN the Dojo Rules (Settings) screen is rendered THEN the system displays a horizontal scrollbar beneath the settings tab row because the 10-tab row (General, Swarm Routing, LLM Providers, Agent Studio, Workflow, Debate, MCP & Tools, Prompts & Skills, Runtime & Net, Notifications) overflows the container width with no wrapping or scrollable tab solution, causing "Prompts & Skills" to be truncated to "Prompts &...".

#### HIGH — Approvals Defer Button Color

1.19 WHEN the Approvals screen renders the Defer action button THEN the system displays it in purple/violet color, which does not match the design system's secondary dark/outlined button style and creates visual ambiguity with the primary action hierarchy.

#### HIGH — Budget Alarm State Missing

1.20 WHEN `window.state.accumulatedCost` reaches `window.state.dailyLimit` (i.e., $5.00/$5.00) THEN the system does not display a red/alarm visual state on the budget badge in the topbar, because while `renderMetrics()` adds the `budget-depleted` CSS class to `.budget-spent`, the `.budget-bar-fill` background color change and the badge border/background alarm state are not consistently applied across all render paths.

#### MEDIUM — Icon System: Residual Unicode Symbols

1.21 WHEN any screen renders UI elements THEN the system displays raw Unicode symbols (◈, ✦, ⊙, ⊡, ◇, △, ●, ✱, ◎, ⊕, ★) and raw emojis (⏸️, ⏰, ⏳, ℹ️, ↩️, ⭐) in buttons, labels, panel headers, and tab icons instead of SVG icons, because `initIconSystem()` in `icons.js` uses `replaceTextIcons()` which operates on `textContent` and attempts regex replacement, but many elements use `innerHTML` with mixed SVG and text, causing the replacement to fail silently or corrupt SVG markup.

1.22 WHEN the Memory Vault screen renders the Retention Policies panel header THEN the system displays a raw ⏳ emoji in the heading because `memory.js` hardcodes `<span>⏳</span>` in the panel header template rather than using the SVG icon system.

1.23 WHEN the Workflow Forge screen renders section headings THEN the system displays ⏪ and ⏱️ emojis in headings because `workflow.js` hardcodes emoji characters in heading strings.

1.24 WHEN the Sandbox Multiplexer screen renders section headings THEN the system displays emojis in headings because `multiplexer.js` hardcodes emoji characters.

1.25 WHEN the Intelligence screen renders tab icons and search icon THEN the system displays Unicode symbols (◈ for search, Unicode for tab icons) instead of SVG icons.

1.26 WHEN the Dojo Rules (Settings) screen renders the Yin-Yang balance slider section THEN the system displays the Yin-Yang duplication issue where both the label and the value repeat the same text.

#### MEDIUM — Agent Naming Inconsistency

1.27 WHEN the Pulse Monitor screen renders the Agent Activity Monitor THEN the system displays agent IDs like "coder1", "tester", "security" as names in some contexts and canonical names like "Jutsu Coder (BE)", "Kunai Tester", "Stealth Auditor" in others, because `AGENT_ACTIVITY` in `monitoring.js` uses raw IDs (`coder1`, `tester`) that are resolved via `window.state.agents[id].name`, but `window.state.agents` uses different name strings than `window.canonicalAgents`, creating inconsistency.

1.28 WHEN the Collaboration screen renders agent status THEN the system shows "Sensei" as both "Active" and "Meditating" simultaneously because the collaboration thread data and the agent status data are not synchronized.

1.29 WHEN the Provenance screen renders agent attribution THEN the system displays "coder1" and "tester" as raw IDs instead of canonical display names.

#### MEDIUM — Repository Screen Issues

1.30 WHEN the Repository screen renders commit hashes THEN the system displays inconsistent hash formats (some 7-character, some full 40-character) because `renderCommitsView` uses `c.id.substring(0, 7)` but other areas use the full ID.

1.31 WHEN the Repository screen renders branch badges THEN the system uses inconsistent badge styling (some branches use `badge-warning`, others `badge-outline`) without a clear semantic mapping to branch type.

1.32 WHEN the Repository screen renders file tree icons THEN the system displays the Unicode symbol ◈ for all file types (js, ts, json, md, css, html, yml, dockerfile) because `REPO_ICONS` in `repository.js` maps every extension to `'◈'` instead of distinct SVG icons.

#### MEDIUM — Pull Requests Screen Issues

1.33 WHEN the Pull Requests screen renders PR descriptions THEN the system displays grammar inconsistencies (mixed tense, inconsistent capitalization) in PR titles and descriptions.

1.34 WHEN the Pull Requests screen renders status badges THEN the system uses inconsistent color semantics for PR states (open, merged, changes_requested, approved) that do not align with the design system's semantic color palette.

#### MEDIUM — Workflow Forge Issues

1.35 WHEN the Workflow Forge screen renders stat cards THEN the system displays inconsistent card styling (different padding, border-radius, and font sizes) compared to the glass-card design system standard.

1.36 WHEN the Workflow Forge canvas renders workflow stages THEN the system provides no visual affordance for drag-and-drop interaction (no cursor change, no drop zone highlight, no drag handle indicator).

#### MEDIUM — Workbench Issues

1.37 WHEN the Dojo Workbench renders the file tree THEN the system displays incorrect or missing icons for different file types because the file tree icon mapping uses Unicode symbols rather than distinct SVG icons per file type.

1.38 WHEN the Dojo Workbench renders the editor tab bar THEN the system does not handle tab overflow (many open files) with a scrollable or collapsible tab solution.

1.39 WHEN the Dojo Workbench renders on viewports narrower than 1280px THEN the system does not resize the code editor panel responsively, causing content overflow.

#### MEDIUM — Sandbox Multiplexer Issues

1.40 WHEN the Sandbox Multiplexer renders Docker logs THEN the system displays Windows-style paths (e.g., `C:\Windows\System32\hosts`) in Docker container log lines, which is inconsistent with the Linux container context.

1.41 WHEN the Sandbox Multiplexer renders a container exit with status code 137 THEN the system displays the raw exit code "137" with no explanation, leaving users without context that this means OOM kill.

1.42 WHEN the Sandbox Multiplexer renders "+" add terminal buttons THEN the system renders them without accessible labels (no `aria-label`, no visible text), making them inaccessible to screen readers.

#### MEDIUM — Neural Graph Issues

1.43 WHEN the Neural Graph renders nodes THEN the system provides no color legend explaining the semantic meaning of orange, cyan, and purple node colors.

1.44 WHEN the Neural Graph renders nodes THEN the system does not display direct node labels on the graph canvas, requiring users to hover to identify nodes.

#### MEDIUM — Deploy Gate Issues

1.45 WHEN the Deploy Gate screen renders the page header THEN the system displays a ◎ Unicode symbol in the heading instead of an SVG icon.

1.46 WHEN the Deploy Gate screen renders environment header action buttons THEN the system displays them with inconsistent visual weight (some primary, some ghost) without a clear hierarchy.

#### MEDIUM — MCP Registry Issues

1.47 WHEN the MCP Registry renders the Authorization Matrix THEN the system shows only 1 agent row instead of all configured agents, because the matrix rendering logic does not iterate over the full `window.state.agents` object.

#### MEDIUM — Collaboration Screen Issues

1.48 WHEN the Collaboration screen renders agent presence THEN the system shows "Sensei" as simultaneously "Active" and "Meditating" because the collaboration `teamActivity` state and the `agents` state use different status values for the same agent.

1.49 WHEN the Collaboration screen renders the panel THEN the system displays high information density with no visual breathing room, making it difficult to scan.

#### MEDIUM — Projects Screen Issues

1.50 WHEN the Projects screen renders project tabs THEN the system displays a ⭐ emoji in the "Starred" tab instead of an SVG star icon.

1.51 WHEN the Projects screen renders the "Back" navigation button THEN the system displays a ↩️ emoji instead of an SVG icon.

1.52 WHEN the Projects screen renders project progress bars THEN the system uses inconsistent styling (different heights, colors, and border-radius values) across project cards.

#### MEDIUM — Notifications Screen Issues

1.53 WHEN the Notifications screen nav label reads "Notifications" THEN the system renders the page title as "Mission Control Alerts", creating a mismatch between the nav label and the page heading.

#### MEDIUM — Ops & Recovery Issues

1.54 WHEN the Ops & Recovery screen renders the "INVESTIGATING" incident status THEN the system displays the status text without a badge container, making it visually inconsistent with other status badges.

1.55 WHEN the Ops & Recovery screen renders "Resolve Incident" and "Escalate Threat" buttons THEN the system renders them with equal visual weight as ghost buttons, providing no hierarchy signal for the more destructive escalation action.

#### MEDIUM — Council Decrees Issues

1.56 WHEN the Council Decrees screen renders status badges THEN the system uses color semantics that do not clearly distinguish between "proposed" (pending), "decided" (approved), and "overridden" (rejected) states in a way consistent with the design system's semantic palette.

#### MEDIUM — Analytics Issues

1.57 WHEN the Analytics screen renders charts THEN the system uses chart colors that are not aligned with the orange/dark theme (e.g., using default blue/green chart colors instead of the orange/amber palette).

1.58 WHEN the Analytics screen renders chart legends THEN the system displays legend text with low contrast against the dark background, making it difficult to read.

#### MEDIUM — Intelligence Screen Issues

1.59 WHEN the Intelligence screen renders the call graph explorer THEN the system displays NPM package names with a raw "npm:" prefix string instead of a styled badge or icon.

1.60 WHEN the Intelligence screen renders the A/B Testing left panel headers THEN the system displays them with low contrast and inconsistent styling.

#### MEDIUM — Timeline / Timelapse Issues

1.61 WHEN the Timeline bar renders the current viewing position THEN the system displays "Viewing 12:00 — Day 1 LIVE" which is confusing UX because "LIVE" and a specific time are contradictory states.

1.62 WHEN the Timeline screen renders content THEN the system does not reserve space for the timeline bar, causing layout shift when the bar appears.

#### MEDIUM — Settings (Dojo Rules) Issues

1.63 WHEN the Settings screen renders the form grid THEN the system displays excessive information density with form rows that are too tightly packed, reducing readability.

1.64 WHEN the Settings screen renders the Dynamic VRAM toggle THEN the system displays an empty label next to the toggle, providing no accessible name for the control.

1.65 WHEN the Dojo Rules screen renders the agent model allocation table THEN the system displays the ⊡ icon shared by 4 different agents, providing no visual distinction between agent roles.

1.66 WHEN the Dojo Rules screen renders the provider type column THEN the system displays "Cloud API" as a styled badge but "Ollama Local" as plain text, creating visual inconsistency.

#### MEDIUM — Wizard Issues

1.67 WHEN the Wizard modal is dismissed THEN the system does not fully remove the modal overlay, leaving a persistent semi-transparent overlay on every subsequent screen.

1.68 WHEN the Wizard modal renders its header THEN the system displays the header content misaligned (logo and title not vertically centered).

#### LOW — Accessibility Issues

1.69 WHEN any interactive element receives keyboard focus THEN the system does not consistently display a visible focus ring on all interactive elements (buttons, inputs, selects, nav items) across all screens.

1.70 WHEN screen reader users navigate the application THEN the system does not provide sufficient ARIA labels for icon-only buttons, status indicators, and dynamic content regions.

1.71 WHEN the application renders on mobile viewports (< 768px) THEN the system does not apply responsive breakpoints, causing the sidebar, topbar, and content panels to overflow the viewport.

#### LOW — Performance Issues

1.72 WHEN the simulation loop runs every 3 seconds THEN the system attaches new event listeners on each `renderKanban()` call without removing old ones, causing memory leaks and duplicate event handler execution.

1.73 WHEN components are re-rendered THEN the system does not clean up event listeners from the previous render, causing accumulating listeners on long-running sessions.

1.74 WHEN the application initializes THEN the system calls `initIconSystem()` which runs `replaceTextIcons()` on a broad selector including `span`, `.value`, `.label` — this runs on hundreds of DOM elements and may cause performance degradation on initial load.

#### LOW — State Management Issues

1.75 WHEN `window.state.notifications` is accessed THEN the system inconsistently uses `window.state.notifications` as both an array of notification objects (in `state.js`) and as an object with `items` array and boolean flags (in the notifications component), causing potential runtime errors.

1.76 WHEN the `dispatch('UPDATE_METRICS')` action is called THEN the system calls `renderMetrics()` which updates `.budget-spent` innerHTML, but the static HTML in `index.html` also contains a hardcoded `$1.42` value in the `.budget-spent` span — on first render before any dispatch, the static value shows; after dispatch, the dynamic value replaces it, but if the span's innerHTML is partially updated, the old text node may persist alongside the new content.

---

### Expected Behavior (Correct)

2.1 WHEN the application renders the topbar brand heading THEN the system SHALL display "coNinja" exactly once followed by the "Shadow Swarm v1.2" badge, with no duplication of the brand name text.

2.2 WHEN `renderMetrics()` updates the budget display THEN the system SHALL render the budget value exactly once in the `.budget-spent` span (e.g., `$4.45 / $5.00`), with no duplicate dollar amount.

2.3 WHEN the Testing Grounds screen renders suite stat rows THEN the system SHALL display each label exactly once (e.g., "Total: 12", "Passed: 8", "Failed: 2", "Skipped: 2", "Coverage: 82%", "Duration: 14.3s") with no label prefix duplication.

2.4 WHEN the Approvals screen renders deadline cells THEN the system SHALL display the deadline status exactly once (e.g., "⚠ OVERDUE" or "Due: 2h left") with no label duplication.

2.5 WHEN the Repository screen renders the active branch info panel THEN the system SHALL display "Active Branch: main" with the prefix appearing exactly once.

2.6 WHEN the right inspector panel renders the Yin/Yang persona balance labels THEN the system SHALL display "Yin: Precise" and "Yang: Creative" (or equivalent formatted labels) with a clear separator between the prefix and the category name.

2.7 WHEN `switchTab('monitoring')` is called THEN the system SHALL render the Pulse Monitor container exactly once, producing exactly one `<h2>` heading and exactly one time-range `<select>` dropdown.

2.8 WHEN the Shadow Guard screen renders the critical vulnerability gate toggle area THEN the system SHALL display only the toggle control and its label, with no raw element hash IDs or debug strings visible in the UI.

2.9 WHEN the user navigates to any screen THEN the system SHALL render the navigation sidebar with the identical group structure: Mission Control (6 items), Engineering (6 items), Intelligence (5 items), Operations (4 items), Governance (5 items), Infrastructure (2 items) — matching the canonical structure defined in `index.html`.

2.10 WHEN the user navigates to any screen THEN the system SHALL render all navigation items as `<button>` elements with `data-tab` attributes, with no items rendered as `<span>` elements.

2.11 WHEN the user navigates to the Memory Vault screen THEN the system SHALL render all content sections: stat cards row, Vector Memory Search panel, Pinned Memory Entries panel, Impact Analysis Tool panel, Retention Policies panel, Vector Settings panel, Graph Settings panel, and Export/Import panel.

2.12 WHEN `switchTab('monitoring')` is called THEN the system SHALL call the monitoring render function exactly once, not twice.

2.13 WHEN the Dojo Rules screen renders the settings tab row THEN the system SHALL display all 10 tabs without truncation, using either tab wrapping or a horizontally scrollable tab container with no visible overflow scrollbar.

2.14 WHEN the Approvals screen renders the Defer action button THEN the system SHALL display it using the secondary dark/outlined button style consistent with the design system.

2.15 WHEN `window.state.accumulatedCost` equals `window.state.dailyLimit` THEN the system SHALL display the budget badge with a red/alarm visual state including red text color, red border, and red progress bar fill.

2.16 WHEN any screen renders UI elements THEN the system SHALL display SVG icons from the `ninjaIcons` registry in place of all Unicode symbols and emoji characters.

2.17 WHEN the Pulse Monitor renders the Agent Activity Monitor THEN the system SHALL display consistent canonical agent names (from `window.canonicalAgents` or `window.state.agents[id].name`) for all agents across all screens.

2.18 WHEN the Repository screen renders commit hashes THEN the system SHALL display all hashes in a consistent 7-character short format.

2.19 WHEN the Repository screen renders file tree icons THEN the system SHALL display distinct SVG icons for different file types (js/ts, json, md, css, html, yml, dockerfile).

2.20 WHEN the MCP Registry renders the Authorization Matrix THEN the system SHALL display one row per configured agent, showing all agents from `window.state.agents`.

2.21 WHEN the Wizard modal is dismissed THEN the system SHALL fully remove the modal overlay with no residual overlay persisting on subsequent screens.

2.22 WHEN the Sandbox Multiplexer renders a container exit with status code 137 THEN the system SHALL display a human-readable explanation: "Exit 137 (OOM Kill — container exceeded memory limit)".

2.23 WHEN the Sandbox Multiplexer renders "+" add terminal buttons THEN the system SHALL include an `aria-label` attribute (e.g., `aria-label="Add new terminal"`) on each button.

2.24 WHEN the Neural Graph renders nodes THEN the system SHALL display a color legend panel identifying the semantic meaning of each node color (orange = orchestrator, cyan = data flow, purple = external dependency).

2.25 WHEN the Notifications screen renders THEN the system SHALL display a page title that matches the navigation label "Notifications" (or the nav label SHALL be updated to match the page title "Mission Control Alerts").

2.26 WHEN the simulation loop calls `renderKanban()` THEN the system SHALL not attach duplicate event listeners; existing listeners SHALL be removed before new ones are attached, or a delegation pattern SHALL be used.

2.27 WHEN the Timeline bar renders the current viewing position THEN the system SHALL display either a live indicator OR a specific timestamp, not both simultaneously.

2.28 WHEN the Settings screen renders the Dynamic VRAM toggle THEN the system SHALL display a visible, non-empty label text adjacent to the toggle control.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user navigates to the Agent Studio screen THEN the system SHALL CONTINUE TO render the full code editor with syntax highlighting, agent configuration panels, and file tree (confirmed fixed in third audit).

3.2 WHEN the user navigates to the Testing Grounds screen THEN the system SHALL CONTINUE TO render the full test suite dashboard with coverage metrics, test results, and runner controls.

3.3 WHEN the user navigates to the Shadow Guard screen THEN the system SHALL CONTINUE TO render the full security center with vulnerability scanner, security score (87/100), and threat indicators.

3.4 WHEN the Ops & Recovery nav item is rendered THEN the system SHALL CONTINUE TO render it as a `<button>` element (not a `<span>`).

3.5 WHEN the Neural Graph renders THEN the system SHALL CONTINUE TO display zoom buttons with proper `aria-label` attributes ("Zoom In", "Zoom Out") and no debug tooltip text.

3.6 WHEN the Approvals screen renders THEN the system SHALL CONTINUE TO display exactly 5 pending approval cards matching the "5 Pending" badge count.

3.7 WHEN the Pulse Monitor renders metrics data THEN the system SHALL CONTINUE TO display sensible, coherent data values (89,450 total requests, 0.35% error rate, 148ms avg latency, $4.89 cost for 7-day range).

3.8 WHEN the Deploy Gate screen renders the "Promote to Production" button THEN the system SHALL CONTINUE TO display it as a RED button with a lock icon, clearly distinguished from the "Deploy to Staging" orange button.

3.9 WHEN the Shadow Guard screen renders the primary action button THEN the system SHALL CONTINUE TO display "Run Scan Now" as the orange primary button and "Review Approvals" as the secondary button.

3.10 WHEN the Notifications screen renders THEN the system SHALL CONTINUE TO display a single filter bar (All / Mark All Read / Clear All), not two.

3.11 WHEN the Intelligence screen renders THEN the system SHALL CONTINUE TO display a single "Repository Intelligence" heading, not two.

3.12 WHEN the application initializes THEN the system SHALL CONTINUE TO display all 28 screens without any "black void" (blank content area) failures.

3.13 WHEN the user drags a task card between Kanban columns THEN the system SHALL CONTINUE TO move the card with the smoke puff animation and update the task status in state.

3.14 WHEN the user clicks a nav item THEN the system SHALL CONTINUE TO switch the active tab content and update the active nav item highlight.

3.15 WHEN the budget bar fill percentage is below 100% THEN the system SHALL CONTINUE TO display the bar in the amber/orange color (not red).

---

## Bug Condition Pseudocode

### Fix Checking Properties

```pascal
// Property 1: No label duplication in any rendered DOM element
FUNCTION isBugCondition_LabelDuplication(element)
  INPUT: element of type DOMElement
  OUTPUT: boolean
  RETURN element.textContent MATCHES /(\b\w[\w\s]+):\s*\1:/
END FUNCTION

FOR ALL element WHERE isBugCondition_LabelDuplication(element) DO
  result ← element.textContent
  ASSERT NOT (result MATCHES /(\b\w[\w\s]+):\s*\1:/)
END FOR

// Property 2: Budget value appears exactly once
FUNCTION isBugCondition_BudgetDuplication(span)
  INPUT: span of type DOMElement with class "budget-spent"
  OUTPUT: boolean
  RETURN span.textContent MATCHES /\$[\d.]+\s+\$[\d.]+/
END FUNCTION

FOR ALL span WHERE isBugCondition_BudgetDuplication(span) DO
  result ← span.textContent
  ASSERT NOT (result MATCHES /\$[\d.]+\s+\$[\d.]+/)
END FOR

// Property 3: Navigation group structure is identical on every screen
FUNCTION isBugCondition_NavTopology(screen)
  INPUT: screen of type TabId
  OUTPUT: boolean
  navGroups ← document.querySelectorAll('.nav-section-title')
  RETURN navGroups.length ≠ 6 OR navGroups[0].textContent ≠ 'Mission Control'
END FUNCTION

FOR ALL screen WHERE isBugCondition_NavTopology(screen) DO
  result ← renderScreen(screen)
  ASSERT navGroupCount = 6
  ASSERT navGroups[0] = 'Mission Control'
  ASSERT navGroups[1] = 'Engineering'
  ASSERT navGroups[2] = 'Intelligence'
  ASSERT navGroups[3] = 'Operations'
  ASSERT navGroups[4] = 'Governance'
  ASSERT navGroups[5] = 'Infrastructure'
END FOR

// Property 4: Preservation Checking — no regressions on confirmed-fixed screens
FOR ALL screen IN ['agent-studio', 'testing', 'security', 'monitoring', 'notifications', 'intelligence'] DO
  ASSERT F(screen) = F'(screen)  // render output unchanged
END FOR
```
