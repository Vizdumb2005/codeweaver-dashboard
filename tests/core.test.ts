/* eslint-disable */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Set up globals that JSDOM environment provides but the legacy files expect on window/global
beforeEach(() => {
  document.body.innerHTML = `
    <div id="workflow-container"></div>
    <div id="approvals-container"></div>
    <div id="deployment-container"></div>
    <div id="toast-container"></div>
    <div id="confirm-modal"></div>
    
    <!-- navigation items -->
    <button class="nav-item" data-tab="swarm-graph">Swarm Graph</button>
    <button class="nav-item" data-tab="workflow">Workflow</button>
    
    <!-- kanban pills -->
    <div class="filter-pills">
      <button class="pill active" data-filter="all">All</button>
      <button class="pill" data-filter="completed">Completed</button>
    </div>

    <!-- controls -->
    <button id="global-pause-btn">Pause</button>
    <input id="daily-limit-slider" type="range" value="5" />
    <span id="daily-limit-val">5</span>
    <input id="alert-threshold-slider" type="range" value="80" />
    <span id="alert-threshold-val">80%</span>
    <input type="radio" name="autonomy-level" value="advisory" checked />
    <input id="log-search" type="text" value="" />
    <select id="log-filter-agent">
      <option value="all">All</option>
    </select>
    <input id="task-search-input" type="text" />
    <button id="console-clear-btn">Clear</button>
    <button id="console-toggle-btn">Toggle</button>
    <input id="settings-hunter-toggle" type="checkbox" />
    <input id="settings-updater-toggle" type="checkbox" />
    <input id="settings-refactor-toggle" type="checkbox" />
    <input id="settings-sentry-url" type="text" />
    <input id="settings-datadog-key" type="text" />

    <!-- kanban columns for drag/drop -->
    <div class="kanban-col" id="col-backlog"></div>
    <div class="kanban-col" id="col-in-progress"></div>
    <div class="kanban-col" id="col-review"></div>
    <div class="kanban-col" id="col-completed"></div>
  `;

  // Reset module registry and window state to ensure clean runs
  vi.resetModules();
});

describe('CoNinja Dashboard Unit and Component Tests', () => {
  it('should load utils.js and execute drawShuriken and triggerSmokePuff correctly', async () => {
    await import('../js/utils.js');
    expect(window.drawShuriken).toBeTypeOf('function');
    expect(window.triggerSmokePuff).toBeTypeOf('function');

    // Test drawShuriken
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    window.drawShuriken(ctx, 50, 50, 4, 20, 10, '#fff', '#000');
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();

    // Test triggerSmokePuff
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('data-id', 'task-123');
    document.body.appendChild(card);

    window.triggerSmokePuff('task-123');
    const container = card.querySelector('.smoke-puff-container');
    expect(container).not.toBeNull();
    expect(container?.querySelectorAll('.smoke-particle').length).toBe(6);
  });

  it('should load state.js and initialize the global state and dispatch functionality', async () => {
    await import('../js/state.js');
    expect(window.state).toBeTypeOf('object');
    expect(window.dispatch).toBeTypeOf('function');

    // Verify initial values
    expect(window.state.systemStatus).toBe('active');
    expect(window.state.activeTab).toBe('login');

    // Test SWITCH_TAB action
    window.dispatch('SWITCH_TAB', 'workflow');
    expect(window.state.activeTab).toBe('workflow');

    // Test UPDATE_SYSTEM_STATUS action
    window.dispatch('UPDATE_SYSTEM_STATUS', 'paused');
    expect(window.state.systemStatus).toBe('paused');

    // Test UPDATE_SETTING action
    window.dispatch('UPDATE_SETTING', { key: 'contextLength', value: 4096 });
    expect(window.state.contextLength).toBe(4096);

    // Test SECRET_ROTATE action
    const mockSecret = { id: 'sec-1', name: 'Test Key', key: 'test', value: 'old_value' };
    window.state.secrets = { apiKeys: [mockSecret], envVars: [] };
    window.dispatch('SECRET_ROTATE', { secretId: 'sec-1' });
    expect(mockSecret.value).toContain('••••••••');
  });

  it('should load events.js and initialize navigation and global controls', async () => {
    await import('../js/state.js');
    await import('../js/events.js');
    expect(window.initNavigation).toBeTypeOf('function');
    expect(window.initGlobalControls).toBeTypeOf('function');
    expect(window.initDragAndDrop).toBeTypeOf('function');

    // Call navigations initialization
    window.initNavigation();

    // Simulate navigation item click
    const navBtn = document.querySelector('.nav-item') as HTMLElement;
    navBtn.click();
    expect(window.state.activeTab).toBe('swarm-graph');

    // Call global controls initialization
    window.initGlobalControls();

    // Trigger pause status update
    const pauseBtn = document.getElementById('global-pause-btn') as HTMLElement;
    window.state.systemStatus = 'active'; // force active
    pauseBtn.click();
    expect(window.state.systemStatus).toBe('paused'); // should transition to paused
  });

  it('should render and interact with workflow (Jutsu Roadmap) component', async () => {
    await import('../js/state.js');
    await import('../js/components/workflow.js');
    expect(window.renderWorkflow).toBeTypeOf('function');

    window.renderWorkflow();
    const wrapper = document.querySelector('.wf-wrapper');
    expect(wrapper).not.toBeNull();

    // Verify stats, stages, and cards are rendered
    expect(wrapper?.querySelector('.wf-stat-bar')).not.toBeNull();
    expect(wrapper?.querySelector('.wf-pipeline-section')).not.toBeNull();
    expect(wrapper?.querySelectorAll('.wf-stage-col').length).toBeGreaterThan(0);
  });

  it('should render and interact with approvals component', async () => {
    await import('../js/state.js');
    await import('../js/components/approvals.js');
    expect(window.renderApprovals).toBeTypeOf('function');

    window.renderApprovals();
    const approvalsLayout = document.querySelector('.approvals-layout');
    expect(approvalsLayout).not.toBeNull();

    // Verify list of approvals is rendered
    expect(approvalsLayout?.querySelector('.approvals-table-container')).not.toBeNull();
    expect(approvalsLayout?.querySelector('.delegation-rules')).not.toBeNull();
  });

  it('should render and interact with deployment component', async () => {
    await import('../js/state.js');
    await import('../js/components/deployment.js');
    expect(window.renderDeployment).toBeTypeOf('function');

    window.renderDeployment();
    const envCards = document.querySelectorAll('.env-card');
    expect(envCards.length).toBe(3); // dev, staging, production

    // Test selecting different environment card
    const devCard = document.querySelector('[data-env="dev"]') as HTMLElement;
    devCard.click();

    // Re-query the dev environment card to assert active state status
    const updatedDevCard = document.querySelector('[data-env="dev"]') as HTMLElement;
    expect(updatedDevCard.classList.contains('active')).toBe(true);
  });
});
