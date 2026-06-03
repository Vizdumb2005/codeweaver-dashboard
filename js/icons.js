/* ============================================================
   CoNinja Shadow Swarm — SVG Icon System
   ============================================================
   Centralized SVG icon library to replace Unicode symbols and emojis
   Each icon represents a distinct concept in the UI
   ============================================================ */

(function () {
  'use strict';

  // Icon registry - maps icon names to SVG definitions
  window.ninjaIcons = {
    // Navigation and structure - each has unique shape
    diamond:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 L14 9 L21 7 L16 12 L21 17 L14 15 L12 22 L10 15 L3 17 L8 12 L3 7 L10 9 Z"/></svg>',
    circle:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>',
    circleDot:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
    circleFilled:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>',
    square:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
    squareFilled:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
    triangle:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 L2 22 L22 22 Z"/></svg>',
    triangleFilled:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 L2 22 L22 22 Z"/></svg>',

    // Agent role icons - each role has unique iconography
    orchestrator:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>',
    pm: '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 L14 9 L21 7 L16 12 L21 17 L14 15 L12 22 L10 15 L3 17 L8 12 L3 7 L10 9 Z"/></svg>',
    architect:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor"/></svg>',
    coder:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18 L22 12 L16 6"/><path d="M8 6 L2 12 L8 18"/></svg>',
    tester:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 22,20 2,20"/></svg>',
    security:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/></svg>',
    devops:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 L12 22 M2 12 L22 12 M4 4 L20 20 M20 4 L4 20"/></svg>',
    documentation:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2 H6 A2 2 0 0 0 4 4 V20 A2 2 0 0 0 6 22 H18 A2 2 0 0 0 20 20 V8"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    performance:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12 L12 16 L16 12"/><path d="M12 8 V4"/></svg>',
    opsRecovery:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v8M8 12h8"/></svg>',
    monitoring:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M6 10h2l2-3 2 6 2-5 2 2h2"/><path d="M12 17v4M8 21h8"/></svg>',
    hunter:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor"/><path d="M12 6 V4 M12 20 V18 M6 12 H4 M20 12 H18"/><path d="M18.36 18.36 L20.71 20.71"/><path d="M4.29 4.29 L6.64 6.64"/><path d="M18.36 5.64 L20.71 3.29"/><path d="M4.29 19.71 L6.64 17.36"/></svg>',
    updater:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4 V12 H17"/><path d="M17 4 H7 V12"/><path d="M7 12 V20 H17 V12"/><path d="M23 12 H17"/><path d="M10 16 H14"/><path d="M10 20 H14"/></svg>',

    // Navigation controls
    chevronDown:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"/></svg>',
    shuriken:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 L14 9 L21 7 L16 12 L21 17 L14 15 L12 22 L10 15 L3 17 L8 12 L3 7 L10 9 Z"/></svg>',

    // Security concepts (distinct shapes)
    lock: '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11 V7 a5 5 0 0 1 10 0 v4"/></svg>',
    shield:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 12 15 16 10"/></svg>',

    // Actions (each a unique geometric shape)
    pause:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    play: '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21"/></svg>',
    rewind:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11,5 23,12 11,19"/><polygon points="3,5 11,12 3,19"/></svg>',
    forward:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13,5 23,12 13,19"/><polygon points="3,5 13,12 3,19"/></svg>',
    revert:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9 L9 3 L15 9"/><path d="M9 21 V9"/><path d="M9 9 L21 9"/></svg>',
    refresh:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',

    // Status and indicators
    clock:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
    hourglass:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 V8"/><path d="M6 18 V22"/><path d="M18 2 V8"/><path d="M18 18 V22"/><path d="M2 12 H22"/><path d="M6 8 C6 8 6 12 12 12 C18 12 18 8 18 8"/><path d="M6 18 C6 18 6 12 12 12 C18 12 18 18 18 18"/></svg>',
    info: '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16 V12"/><path d="M12 8 V8"/></svg>',
    star: '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 L14.5 9.5 L22 11 L14.5 12.5 L12 20 L9.5 12.5 L2 11 L9.5 9.5 Z"/></svg>',
    check:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>',
    close:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 L6 18"/><path d="M6 6 L18 18"/></svg>',
    alert:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',

    // Development
    code: '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>',
    file: '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2 H6 A2 2 0 0 0 4 4 V20 A2 2 0 0 0 6 22 H18 A2 2 0 0 0 20 20 V8"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    folder:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19 A2 2 0 0 1 20 21 H4 A2 2 0 0 1 2 19 V5 A2 2 0 0 1 4 3 H10"/><path d="M10 3 V8 C10 8 15 8 15 8 V3 H20"/></svg>',
    browser:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="15" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="21"/><line x1="8" y1="8" x2="16" y2="8"/></svg>',
    codeFile:
      '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2 H6 a2 2 0 0 0-2 2 v16 a2 2 0 0 0 2 2 h12 a2 2 0 0 0 2-2 V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    gear: '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',

    // Get icon by name
    get(name) {
      return (
        this[name] ||
        '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'
      );
    },
  };

  // Helper function to replace text icons with SVG
  window.replaceTextIcons = function (element) {
    if (!element) return;

    const iconMap = {
      '◈': 'diamond',
      '✦': 'star',
      '⊙': 'circleDot',
      '⊡': 'square',
      '◇': 'diamond',
      '△': 'triangle',
      '●': 'circle',
      '✱': 'star',
      '◎': 'circle',
      '⊕': 'circle',
      '★': 'star',
      '⭐': 'star',
      '⏸': 'pause',
      '⏸️': 'pause',
      '▶': 'play',
      '▶️': 'play',
      '⏰': 'clock',
      '⏳': 'hourglass',
      ℹ: 'info',
      ℹ️: 'info',
      '↩': 'revert',
      '↩️': 'revert',
      '▼': 'chevronDown',
      '🔒': 'lock',
      '🔄': 'refresh',
      '🌐': 'browser',
      '📄': 'codeFile',
      '⚙': 'gear',
      '⚙️': 'gear',
      '⚠': 'alert',
      '⚠️': 'alert',
    };

    const text = element.textContent || '';
    let newText = text;

    for (const [symbol, iconName] of Object.entries(iconMap)) {
      newText = newText.replace(new RegExp(symbol, 'g'), window.ninjaIcons.get(iconName));
    }

    if (newText !== text) {
      element.innerHTML = newText;
    }
  };

  // Initialize icon system
  window.initIconSystem = function () {
    // Replace icons in targeted elements only (improves performance)
    document
      .querySelectorAll(
        '.type-icon, .rule-type, .requester, .history-icon, .nav-section-toggle-icon, .panel-header',
      )
      .forEach(window.replaceTextIcons);
  };

  console.warn('%c[CoNinja] Icon System loaded', 'color:#ff7300;font-weight:bold;');
})();
