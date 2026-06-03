// --- BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', () => {
  // Each init is independently protected so one failure doesn't kill others
  const safe = (fn, label) => {
    try {
      fn();
    } catch (e) {
      console.warn(`[CoNinja] ${label} init error:`, e);
    }
  };

  // 1. Canvas Graph
  safe(() => {
    if (typeof window.SwarmGraph === 'function') {
      window.swarmGraph = new window.SwarmGraph('swarm-canvas');
      window.swarmGraph.start();
    }
  }, 'SwarmGraph');

  // 2. Canonical data
  safe(() => {
    if (typeof window.canonicalInit === 'function') window.canonicalInit();
  }, 'Canonical');

  // 2b. Icon system
  safe(() => {
    if (typeof window.initIconSystem === 'function') window.initIconSystem();
  }, 'IconSystem');

  // 3. Core rendering
  safe(() => {
    if (typeof window.renderKanban === 'function') window.renderKanban();
  }, 'Kanban');
  safe(() => {
    if (typeof window.renderDecisions === 'function') window.renderDecisions();
  }, 'Decisions');
  safe(() => {
    if (typeof window.renderLogs === 'function') window.renderLogs();
  }, 'Logs');

  // 4. Agent selection
  safe(() => {
    if (typeof window.selectAgent === 'function') window.selectAgent('orchestrator');
  }, 'SelectAgent');

  // 5. CRITICAL: Wire navigation (most important - must not be blocked by other inits)
  safe(() => {
    if (typeof window.initNavigation === 'function') window.initNavigation();
  }, 'Navigation');
  safe(() => {
    if (typeof window.initGlobalControls === 'function') window.initGlobalControls();
  }, 'GlobalControls');
  safe(() => {
    if (typeof window.initDragAndDrop === 'function') window.initDragAndDrop();
  }, 'DragAndDrop');
  safe(() => {
    if (typeof window.initWizard === 'function') window.initWizard();
  }, 'Wizard');

  // 5b. Ensure all navigation sections are expanded (fix non-deterministic nav)
  safe(() => {
    document.querySelectorAll('.nav-section.collapsed').forEach((section) => {
      section.classList.remove('collapsed');
    });
  }, 'NavigationExpand');

  // 5c. Ensure all modals are hidden by default
  safe(() => {
    document.querySelectorAll('.modal-overlay.active').forEach((modal) => {
      modal.classList.remove('active');
    });
  }, 'ModalsHidden');

  // 6. Settings & sub-tabs
  safe(() => {
    if (typeof window.initSettingsSubTabs === 'function') window.initSettingsSubTabs();
  }, 'SettingsTabs');
  safe(() => {
    if (typeof window.initArchiveSidebar === 'function') window.initArchiveSidebar();
  }, 'ArchiveSidebar');
  safe(() => {
    if (typeof window.initExtendedSettings === 'function') window.initExtendedSettings();
  }, 'ExtendedSettings');

  // 7. Time-lapse viewer
  safe(() => {
    if (typeof window.initTimeLapseViewer === 'function') window.initTimeLapseViewer();
  }, 'TimeLapse');

  // 8. Simulation loops
  safe(() => {
    if (typeof window.runSimulationLoop === 'function') window.runSimulationLoop();
  }, 'SimLoop');
  safe(() => {
    if (typeof window.runExtendedSimulationLoop === 'function') window.runExtendedSimulationLoop();
  }, 'ExtSimLoop');

  // 9. Badge sync (from state data)
  safe(() => {
    if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
  }, 'Badges');
  safe(() => {
    if (typeof window.renderMetrics === 'function') window.renderMetrics();
  }, 'Metrics');
  safe(() => {
    if (typeof window.syncSettingsUI === 'function') window.syncSettingsUI();
  }, 'SyncUI');

  // 10. Icon decoration
  safe(() => {
    if (typeof window.decorateNinjaIcons === 'function') {
      const activeTab =
        window.state && window.state.activeTab ? window.state.activeTab : 'swarm-graph';
      const tabEl = document.getElementById(`tab-${activeTab}`);
      if (tabEl) window.decorateNinjaIcons(tabEl);
    }
  }, 'NinjaIcons');

  // 11. Scroll to top button
  safe(() => {
    const scrollBtn = document.getElementById('scroll-to-top');
    if (!scrollBtn) return;

    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, 'ScrollToTop');

  // 12. Password visibility toggles
  safe(() => {
    document.querySelectorAll('.password-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        const iconEye = btn.querySelector('.icon-eye');
        const iconEyeOff = btn.querySelector('.icon-eye-off');
        if (!input) return;

        if (input.type === 'password') {
          input.type = 'text';
          if (iconEye) iconEye.style.display = 'none';
          if (iconEyeOff) iconEyeOff.style.display = 'block';
        } else {
          input.type = 'password';
          if (iconEye) iconEye.style.display = 'block';
          if (iconEyeOff) iconEyeOff.style.display = 'none';
        }
      });
    });
  }, 'PasswordToggles');

  // 13. Initialize Active Tab View on load
  safe(() => {
    if (typeof window.switchTab === 'function') {
      window.switchTab(window.state.activeTab || 'login');
    }
  }, 'InitTab');
});

// --- ACOUSTIC TELEMETRY (TASK 4.2) ---
window.playSystemSound = function (type) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch (A5)
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12); // Short decay
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const dist = ctx.createWaveShaper();

      osc.type = 'square';
      osc.frequency.setValueAtTime(100, ctx.currentTime); // Low pitch (G2)

      // Wave shaper distortion curve generator
      const curve = new Float32Array(44100);
      const k = 150;
      const deg = Math.PI / 180;
      for (let i = 0; i < 44100; ++i) {
        const x = (i * 2) / 44100 - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      dist.curve = curve;
      dist.oversample = '4x';

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35); // Decay

      osc.connect(dist);
      dist.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.warn('[CoNinja] AudioContext playback error:', e);
  }
};
