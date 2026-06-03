(function () {
  'use strict';

  const results = [];

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function record(name, fn) {
    try {
      fn();
      results.push({ name, status: 'passed' });
    } catch (error) {
      results.push({
        name,
        status: 'failed',
        error: error && error.message ? error.message : String(error),
      });
      throw error;
    }
  }

  function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  function waitFor(predicate, timeoutMs = 3000) {
    const start = Date.now();

    return new Promise((resolve, reject) => {
      function tick() {
        try {
          if (predicate()) {
            resolve(true);
            return;
          }
        } catch (error) {
          reject(error);
          return;
        }

        if (Date.now() - start >= timeoutMs) {
          reject(new Error('Timed out waiting for expected DOM state'));
          return;
        }

        requestAnimationFrame(tick);
      }

      tick();
    });
  }

  function countVisible(selector) {
    return Array.from(document.querySelectorAll(selector)).filter((element) => {
      const style = getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        element.getClientRects().length > 0
      );
    }).length;
  }

  async function showTab(tabId) {
    if (typeof window.switchTab === 'function') {
      window.switchTab(tabId);
      await nextFrame();
    }
  }

  async function run() {
    const summary = [];

    await showTab('agent-studio');
    record('2.A Agent Studio renders', () => {
      const container = document.getElementById('agent-studio-container');
      assert(container, 'agent-studio-container is missing');
      assert(container.innerHTML.length > 100, 'Agent Studio did not render enough content');
    });

    await showTab('testing');
    record('2.B Testing Grounds renders', () => {
      const container = document.getElementById('testing-container');
      assert(container, 'testing-container is missing');
      assert(
        /Overall Coverage|Coverage Gate|Runner/i.test(container.innerHTML),
        'Testing Grounds coverage metrics were not rendered',
      );
    });

    await showTab('security');
    record('2.C Shadow Guard score', () => {
      const container = document.getElementById('security-container');
      assert(container, 'security-container is missing');
      assert(container.textContent.includes('87'), 'Shadow Guard score 87 was not found');
    });

    await showTab('ops-recovery');
    record('2.D Ops & Recovery nav item is button', () => {
      const navItem = document.querySelector('[data-tab="ops-recovery"]');
      assert(navItem, 'ops-recovery nav item is missing');
      assert(navItem.tagName === 'BUTTON', `Expected BUTTON but found ${navItem.tagName}`);
    });

    await showTab('approvals');
    await waitFor(() => countVisible('.approval-row, .approval-card') === 5);
    record('2.E Approvals count', () => {
      assert(
        countVisible('.approval-row, .approval-card') === 5,
        'Expected exactly 5 visible approval cards/rows',
      );
    });

    await showTab('monitoring');
    record('2.F Monitoring data values', () => {
      const container = document.getElementById('monitoring-container');
      assert(container, 'monitoring-container is missing');
      const text = container.textContent;
      assert(text.includes('89,450'), 'Monitoring requests value 89,450 was not found');
      assert(text.includes('0.35%'), 'Monitoring error rate 0.35% was not found');
    });

    await showTab('deployment');
    record('2.G Deploy Gate button color', () => {
      const button = document.querySelector('#deploy-promote-btn, button.btn-danger');
      assert(button, 'Promote to Production button is missing');
      const style = getComputedStyle(button);
      const bg = `${style.backgroundColor} ${style.background}`.toLowerCase();
      assert(
        bg.includes('rgb(239, 68, 68)') ||
          bg.includes('#ef4444') ||
          bg.includes('red') ||
          bg.includes('rgb(220, 38, 38)'),
        'Promote to Production button is not red',
      );
    });

    await showTab('notifications');
    record('2.H Notifications single filter bar', () => {
      assert(
        document.querySelectorAll('.notifications-filter-bar, [id*="notif-filter"]').length === 1,
        'Expected exactly one notifications filter bar',
      );
    });

    await showTab('intelligence');
    record('2.I Intelligence single heading', () => {
      const visibleHeadings = Array.from(document.querySelectorAll('h2')).filter(
        (element) =>
          element.getClientRects().length > 0 &&
          element.textContent.includes('Repository Intelligence'),
      );
      assert(
        visibleHeadings.length === 1,
        'Expected exactly one visible Repository Intelligence heading',
      );
    });

    await showTab('metrics');
    record('2.J Budget bar amber below 100%', () => {
      if (!window.state) {
        throw new Error('window.state is missing');
      }
      const previousCost = window.state.accumulatedCost;
      window.state.accumulatedCost = 2.5;
      if (typeof window.renderMetrics === 'function') {
        window.renderMetrics();
      }
      const bar = document.querySelector('.budget-bar-fill');
      assert(bar, 'budget-bar-fill is missing');
      const style = getComputedStyle(bar);
      const bg = `${style.backgroundColor} ${style.background}`.toLowerCase();
      assert(
        !bg.includes('rgb(239, 68, 68)') && !bg.includes('#ef4444'),
        'Budget bar should not be red below 100%',
      );
      window.state.accumulatedCost = previousCost;
      if (typeof window.renderMetrics === 'function') {
        window.renderMetrics();
      }
    });

    summary.push(...results);
    window.__bugfixPreservationResults = summary;
    return summary;
  }

  window.__runBugfixPreservationTests = run;

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
      run().catch((error) => {
        window.__bugfixPreservationError = error;
      });
    }, 0);
  } else {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        run().catch((error) => {
          window.__bugfixPreservationError = error;
        });
      },
      { once: true },
    );
  }
})();
