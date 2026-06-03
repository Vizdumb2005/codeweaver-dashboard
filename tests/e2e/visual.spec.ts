import { expect, test } from '@playwright/test';

test.describe('coNinja Shadow Swarm E2E Journey & Visual Regression', () => {
  test('should go through login, create mission, and deploy with visual verification', async ({
    page,
  }) => {
    // Capture page logs and errors for debugging
    page.on('console', (msg) => console.log(`PAGE LOG [${msg.type()}]:`, msg.text()));
    page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message));

    // 1. Visit the application (starts at login screen)
    await page.addInitScript(() => {
      Object.defineProperty(window, 'runSimulationLoop', {
        get: () => () => {},
        set: () => {},
        configurable: true,
      });
      Object.defineProperty(window, 'runExtendedSimulationLoop', {
        get: () => () => {},
        set: () => {},
        configurable: true,
      });
    });
    await page.goto('/');
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
    await page.waitForSelector('#login-form');

    // Visual Regression: Login Screen
    await expect(page).toHaveScreenshot('login-screen.png', {
      maxDiffPixels: 3000,
    });

    // Perform Login
    await page.fill('#login-username', 'test_shinobi');
    await page.fill('#login-password', 'secret_jutsu_123');
    await page.click('button:has-text("Unlock Nexus")');

    // Verify main dashboard loaded (Sidebar, Brand header, and Swarm Graph active)
    await page.waitForSelector('.dashboard-shell');
    await page.waitForSelector('.brand h1');
    await expect(page.locator('.brand h1')).toContainText('coNinja');

    // Visual Regression: Shinobi Clan (Swarm Graph) Screen
    await expect(page).toHaveScreenshot('dashboard-swarm-graph.png', {
      maxDiffPixels: 3000,
      mask: [page.locator('#swarm-canvas')],
    });

    // 2. Create Mission Journey
    await page.click('#new-project-btn');
    await page.waitForSelector('#project-wizard-modal.active');

    // Step 1: Input app prompt
    await page.fill('#wizard-app-prompt', 'Build a secure credentials vault plugin');
    await page.click('#wizard-to-step-2-btn');

    // Step 2: Input PM response
    await page.waitForSelector('#wizard-step-2.active');
    await page.fill(
      '#wizard-pm-response',
      'Implement AES-256 local storage encryption and dynamic session rotation',
    );
    await page.click('#wizard-to-step-3-btn');

    // Step 3: Wait for decomposition animation and launch swarm
    await page.waitForSelector('#wizard-step-3.active');
    // Wait for the animation to finish (finished footer becomes visible / not hidden)
    const launchButton = page.locator('#wizard-launch-swarm-btn');
    await launchButton.waitFor({ state: 'visible', timeout: 10000 });
    await launchButton.click();

    // Verify modal is closed
    await page.waitForSelector('#project-wizard-modal', { state: 'hidden' });

    // Wait for the asynchronous generateProject redirect to swarm-graph tab to finish
    await page.waitForSelector('#tab-swarm-graph.active');
    await page.waitForTimeout(600);

    // 3. Navigation & Screen Visual Verifications
    // Go to Jutsu Roadmap
    await page.click('.nav-item[data-tab="task-board"]');
    await page.waitForSelector('#tab-task-board.active');

    await expect(page.locator('#tab-task-board')).toHaveScreenshot('jutsu-roadmap.png', {
      maxDiffPixels: 3000,
      mask: [page.locator('.kanban-board')],
    });

    // Go to Approvals
    await page.click('.nav-item[data-tab="approvals"]');
    await page.waitForSelector('#tab-approvals.active');
    await expect(page.locator('#tab-approvals')).toHaveScreenshot('approvals.png', {
      maxDiffPixels: 3000,
      mask: [page.locator('#approvals-container')],
    });

    // Go to Deploy Gate
    await page.click('.nav-item[data-tab="deployment"]');
    await page.waitForSelector('#tab-deployment.active');
    await expect(page.locator('#tab-deployment')).toHaveScreenshot('deploy-gate.png', {
      maxDiffPixels: 3000,
      mask: [page.locator('#deployment-container')],
    });

    // 4. Deploy Journey
    // Click Promote to Production button
    await page.click('#deploy-promote-btn');
    // Verify toast or updated environment state (e.g. Production Temple active environment or alert sound triggered)
    // Wait for any state changes to stabilize
    await page.waitForTimeout(1000);
  });
});
