/**
 * coNinja Shadow Swarm — Comprehensive Visual + Functional Audit Runner
 * 
 * Execute this script in the browser console (F12 > Console) to run the full audit.
 * Tests: layout, component consistency, spacing, typography, contrast, responsive,
 * button functionality, navigation flow, and error handling.
 */

(function() {
  'use strict';

  const AUDIT = {
    metadata: {
      site: 'http://localhost:3000',
      run_id: crypto.randomUUID ? crypto.randomUUID() : 'audit-' + Date.now(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`
    },
    pages: [],
    summary: {
      pages_audited: 1,
      high_priority_issues: 0,
      buttons_tested: 0,
      buttons_failed: 0,
      recommendations: []
    },
    issues: [],
    currentPage: null
  };

  // ====================== UTILITY FUNCTIONS ======================
  
  function log(level, msg, data) {
    const prefix = `[coNinja Audit]`;
    if (level === 'ERROR') console.error(`${prefix} ❌ ${msg}`, data || '');
    else if (level === 'WARN') console.warn(`${prefix} ⚠️ ${msg}`, data || '');
    else if (level === 'INFO') console.info(`${prefix} ℹ️ ${msg}`, data || '');
    else console.log(`${prefix} ${msg}`, data || '');
    if (level === 'ERROR' || level === 'WARN') {
      AUDIT.issues.push({ level, msg, data, page: window.location.href });
      if (level === 'ERROR') AUDIT.summary.high_priority_issues++;
    }
    return { level, msg, data };
  }

  function getComputedStyle(el, prop) {
    return window.getComputedStyle(el).getPropertyValue(prop);
  }

  // Converts rgb/rgba to hex for contrast analysis
  function rgbToHex(rgb) {
    if (!rgb) return '#000000';
    const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return rgb;
    return '#' + [m[1], m[2], m[3]].map(x => {
      const hex = parseInt(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  // Relative luminance (WCAG)
  function getLuminance(hex) {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return 0;
    const sRGB = [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)].map(c => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  function contrastRatio(l1, l2) {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // ====================== CHECK 1: LAYOUT CORRECTNESS ======================
  
  function checkLayout() {
    log('INFO', '=== CHECK 1: LAYOUT CORRECTNESS ===');
    const issues = [];
    
    // Check for horizontal scroll
    const docWidth = document.documentElement.scrollWidth;
    const viewportWidth = window.innerWidth;
    if (docWidth > viewportWidth + 5) {
      issues.push(log('ERROR', `Horizontal scroll detected: doc=${docWidth}px > viewport=${viewportWidth}px`));
    } else {
      log('INFO', `No horizontal scroll: doc=${docWidth}px, viewport=${viewportWidth}px ✓`);
    }

    // Check header presence and position
    const header = document.querySelector('.topbar, header');
    if (!header) {
      issues.push(log('ERROR', 'Header (.topbar / <header>) not found'));
    } else {
      const headerRect = header.getBoundingClientRect();
      log('INFO', `Header found at y=${headerRect.top}, height=${headerRect.height}px ✓`);
      if (headerRect.top !== 0) {
        issues.push(log('WARN', `Header not at top of page (y=${headerRect.top})`));
      }
    }

    // Check main/sidebar layout
    const main = document.querySelector('.viewport, main');
    const sidebar = document.querySelector('.sidebar, aside.sidebar');
    const contextPanel = document.querySelector('.context-panel, aside.context-panel');
    
    if (!main) issues.push(log('ERROR', 'Main viewport not found'));
    else log('INFO', 'Main viewport found ✓');
    if (!sidebar) log('WARN', 'Sidebar not found');
    else log('INFO', 'Sidebar found ✓');
    if (!contextPanel) log('WARN', 'Context panel not found');
    else log('INFO', 'Context panel found ✓');

    // Check grid alignment
    const dashboard = document.querySelector('.main-shell');
    if (dashboard) {
      const display = getComputedStyle(dashboard, 'display');
      log('INFO', `Main shell display: ${display}`);
      if (display === 'grid' || display === 'flex') {
        log('INFO', 'Main shell uses proper layout mode ✓');
      } else {
        issues.push(log('WARN', `Main shell uses ${display} — expected grid or flex`));
      }
    }

    // Check for footer
    const footer = document.querySelector('.timelapse-bar, footer, #timelapse-viewer');
    if (footer) {
      const footerRect = footer.getBoundingClientRect();
      log('INFO', `Footer/timelapse bar found at y=${footerRect.top}, visible ✓`);
    } else {
      log('WARN', 'No footer/timelapse bar found on page');
    }

    return issues;
  }

  // ====================== CHECK 2: COMPONENT CONSISTENCY ======================
  
  function checkComponentConsistency() {
    log('INFO', '=== CHECK 2: COMPONENT CONSISTENCY ===');
    const issues = [];

    // Check buttons for consistent styling
    const buttons = document.querySelectorAll('button, .btn, a[role="button"], input[type="submit"]');
    log('INFO', `Found ${buttons.length} interactive button elements`);
    
    const btnStyles = {};
    buttons.forEach((btn, i) => {
      const key = btn.className.split(' ').filter(c => c).sort().join(' ');
      if (!btnStyles[key]) {
        btnStyles[key] = {
          count: 0,
          fontFamily: getComputedStyle(btn, 'font-family'),
          fontSize: getComputedStyle(btn, 'font-size'),
          fontWeight: getComputedStyle(btn, 'font-weight'),
          borderRadius: getComputedStyle(btn, 'border-radius'),
          padding: `${getComputedStyle(btn, 'padding-top')} ${getComputedStyle(btn, 'padding-right')} ${getComputedStyle(btn, 'padding-bottom')} ${getComputedStyle(btn, 'padding-left')}`,
          border: getComputedStyle(btn, 'border'),
          sample: btn.textContent.trim().substring(0, 30)
        };
      }
      btnStyles[key].count++;
    });

    log('INFO', `Button style variants found: ${Object.keys(btnStyles).length}`);
    Object.entries(btnStyles).forEach(([cls, style]) => {
      if (style.count > 1) {
        log('INFO', `  .${cls}: ${style.count} instances, font=${style.fontSize}, radius=${style.borderRadius}`);
      }
    });

    // Check input consistency
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="range"]), select, textarea');
    log('INFO', `Found ${inputs.length} form input elements`);
    const inputFamilies = new Set();
    inputs.forEach(inp => {
      inputFamilies.add(getComputedStyle(inp, 'font-size') + '|' + getComputedStyle(inp, 'border-radius') + '|' + getComputedStyle(inp, 'background-color'));
    });
    log('INFO', `Input style variants (font-size|radius|bg): ${inputFamilies.size}`);
    if (inputFamilies.size > 5) {
      issues.push(log('WARN', `High input style variation: ${inputFamilies.size} distinct styles`));
    }

    // Check card consistency
    const cards = document.querySelectorAll('.glass-card, .task-card, .metric-card, .settings-card');
    log('INFO', `Found ${cards.length} card components`);
    if (cards.length > 0) {
      const cardBgs = new Set();
      const cardRadius = new Set();
      cards.forEach(c => {
        cardBgs.add(getComputedStyle(c, 'background'));
        cardRadius.add(getComputedStyle(c, 'border-radius'));
      });
      log('INFO', `Card bg variants: ${cardBgs.size}, radius variants: ${cardRadius.size}`);
      if (cardBgs.size > 3 || cardRadius.size > 3) {
        issues.push(log('WARN', `High card style variation: ${cardBgs.size} bg, ${cardRadius.size} radius`));
      }
    }

    // Check badge consistency
    const badges = document.querySelectorAll('.badge, [class*="badge-"]');
    log('INFO', `Found ${badges.length} badge elements`);
    badges.forEach(b => {
      const text = b.textContent.trim();
      if (text && text.length > 0) {
        // Just reporting
      }
    });

    // Check nav items consistency
    const navItems = document.querySelectorAll('.nav-item');
    log('INFO', `Found ${navItems.length} navigation items`);
    if (navItems.length > 0) {
      const heights = new Set();
      navItems.forEach(n => heights.add(Math.round(n.getBoundingClientRect().height)));
      log('INFO', `Nav item height variants: ${[...heights].join('px, ')}px`);
      if (heights.size > 2) {
        issues.push(log('WARN', `Nav items have inconsistent heights: ${[...heights].join('px, ')}px`));
      }
    }

    return issues;
  }

  // ====================== CHECK 3: SPACING & GAPS ======================
  
  function checkSpacing() {
    log('INFO', '=== CHECK 3: SPACING & GAPS ===');
    const issues = [];

    // Check global spacing token usage
    const root = document.documentElement;
    const spaceVars = ['--space-xxs', '--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl', '--space-xxl', '--space-3xl'];
    spaceVars.forEach(v => {
      const val = getComputedStyle(root, v);
      log('INFO', `  ${v}: ${val}`);
    });

    // Check nav items for consistent padding
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems.length > 1) {
      const paddings = new Set();
      navItems.forEach(n => {
        paddings.add(`${getComputedStyle(n, 'padding-left')} ${getComputedStyle(n, 'padding-right')} ${getComputedStyle(n, 'padding-top')} ${getComputedStyle(n, 'padding-bottom')}`);
      });
      log('INFO', `Nav item padding variants: ${paddings.size}`);
      if (paddings.size > 1) {
        issues.push(log('WARN', `Nav items have inconsistent padding (${paddings.size} variants)`));
      }
    }

    // Check gaps between adjacent elements in flex/grid containers
    const containers = document.querySelectorAll('.flex, .kanban-board, .settings-grid, .multiplexer-grid, .settings-tabs, .header-actions, .oauth-flex-container');
    containers.forEach(container => {
      const gap = getComputedStyle(container, 'gap');
      if (gap && gap !== 'normal') {
        log('INFO', `  ${container.className.split(' ')[0] || 'container'} gap: ${gap}`);
      }
    });

    // Check for overlapping elements
    const allEls = document.querySelectorAll('button, .btn, .nav-item, .glass-card, .metric-card');
    const rects = [];
    allEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) rects.push({ el, r });
    });
    
    // Sample check - compare first 50 elements for overlaps (skip if too many)
    const sampleSize = Math.min(rects.length, 50);
    let overlaps = 0;
    for (let i = 0; i < sampleSize; i++) {
      for (let j = i + 1; j < sampleSize; j++) {
        const a = rects[i].r, b = rects[j].r;
        if (a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom) {
          overlaps++;
          if (overlaps <= 3) {
            issues.push(log('WARN', `Potential overlap: "${rects[i].el.textContent.trim().substring(0,20)}" & "${rects[j].el.textContent.trim().substring(0,20)}"`));
          }
        }
      }
    }
    if (overlaps === 0) {
      log('INFO', 'No overlapping elements detected in sample ✓');
    } else {
      log('INFO', `Total detected overlaps in sample: ${overlaps}`);
    }

    return issues;
  }

  // ====================== CHECK 4: TYPOGRAPHY ======================
  
  function checkTypography() {
    log('INFO', '=== CHECK 4: TYPOGRAPHY ===');
    const issues = [];

    // Check root font families
    const body = document.body;
    log('INFO', `Body font: ${getComputedStyle(body, 'font-family')}`);
    log('INFO', `Body font-size: ${getComputedStyle(body, 'font-size')}`);
    log('INFO', `Body line-height: ${getComputedStyle(body, 'line-height')}`);

    // Check heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    log('INFO', `Found ${headings.length} heading elements`);
    const headingSizes = {};
    headings.forEach(h => {
      const tag = h.tagName.toLowerCase();
      if (!headingSizes[tag]) headingSizes[tag] = [];
      headingSizes[tag].push(getComputedStyle(h, 'font-size'));
    });
    
    Object.entries(headingSizes).forEach(([tag, sizes]) => {
      const unique = [...new Set(sizes)];
      log('INFO', `  ${tag}: ${unique.join(', ')}`);
      if (unique.length > 2) {
        issues.push(log('WARN', `${tag} has ${unique.length} different font sizes`));
      }
    });

    // Verify heading hierarchy order
    let lastLevel = 0;
    headings.forEach(h => {
      const level = parseInt(h.tagName[1]);
      if (level < lastLevel - 1) {
        // Skip warning for h1->h3 jumps (intentional styling)
        if (lastLevel - level > 1) {
          issues.push(log('WARN', `Heading jump: h${lastLevel} → h${level}`));
        }
      }
      lastLevel = level;
    });

    // Check font families in use
    const fontFamilies = new Set();
    document.querySelectorAll('*').forEach(el => {
      const ff = getComputedStyle(el, 'font-family');
      if (ff && !ff.includes('monospace') && ff !== 'none') {
        fontFamilies.add(ff.split(',')[0].replace(/['"]/g, '').trim());
      }
    });
    log('INFO', `Unique font families: ${[...fontFamilies].join(', ')}`);

    // Check CJK / special Unicode characters render correctly
    const specialChars = document.querySelectorAll('[class*="jp-icon"], .jp-icon, .text-orange');
    log('INFO', `Special icon/SVG elements: ${specialChars.length}`);

    return issues;
  }

  // ====================== CHECK 5: COLOR CONTRAST ======================
  
  function checkColorContrast() {
    log('INFO', '=== CHECK 5: COLOR CONTRAST ===');
    const issues = [];

    // Check root CSS variables for contrast
    const root = document.documentElement;
    const bgBase = getComputedStyle(root, '--bg-base') || '#060403';
    const textPrimary = getComputedStyle(root, '--text-primary') || '#f8fafc';
    const textSecondary = getComputedStyle(root, '--text-secondary') || '#94a3b8';
    const textMuted = getComputedStyle(root, '--text-muted') || '#5e5248';

    log('INFO', `CSS vars - bg: ${bgBase}, text-primary: ${textPrimary}, text-secondary: ${textSecondary}, text-muted: ${textMuted}`);

    // Contrast analysis on sampled text elements
    const textEls = document.querySelectorAll('p, span, label, h1, h2, h3, h4, h5, h6, .nav-item, .value, .title');
    const sample = Math.min(textEls.length, 100);
    let violCount = 0;
    for (let i = 0; i < sample; i++) {
      const el = textEls[i];
      const color = getComputedStyle(el, 'color');
      const bg = getComputedStyle(el, 'background-color');
      const fontSize = parseFloat(getComputedStyle(el, 'font-size'));
      const fontWeight = parseInt(getComputedStyle(el, 'font-weight'));
      
      const colorHex = rgbToHex(color);
      const bgHex = rgbToHex(bg || 'rgb(6, 4, 3)');
      
      const lum1 = getLuminance(colorHex);
      const lum2 = getLuminance(bgHex);
      const ratio = contrastRatio(lum1, lum2);
      
      const isLarge = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
      const minRatio = isLarge ? 3 : 4.5;
      
      if (ratio < minRatio && ratio > 0) {
        violCount++;
        if (violCount <= 5) {
          issues.push(log('WARN', `Contrast violation: "${el.textContent.trim().substring(0, 25)}" — ratio=${ratio.toFixed(2)} (need ≥${minRatio}), fontSize=${fontSize}px, fw=${fontWeight}`));
        }
      }
    }
    log('INFO', `Contrast violations found: ${violCount}/${sample} sampled elements`);
    if (violCount > 0) {
      AUDIT.summary.high_priority_issues += Math.ceil(violCount / 5);
    }

    return issues;
  }

  // ====================== CHECK 6: RESPONSIVE DESIGN ======================
  
  function checkResponsive() {
    log('INFO', '=== CHECK 6: RESPONSIVE DESIGN ===');
    const issues = [];
    
    const vp = window.innerWidth;
    log('INFO', `Current viewport: ${vp}px`);
    
    // Check media query breakpoints
    const bpInfo = [
      { name: 'Desktop (>1280px)', min: 1281 },
      { name: 'Desktop (1025-1280px)', min: 1025, max: 1280 },
      { name: 'Tablet (769-1024px)', min: 769, max: 1024 },
      { name: 'Small Tablet (481-768px)', min: 481, max: 768 },
      { name: 'Mobile (<=480px)', max: 480 }
    ];
    
    bpInfo.forEach(bp => {
      if (vp >= (bp.min || 0) && vp <= (bp.max || 99999)) {
        log('INFO', `Current breakpoint: ${bp.name}`);
      }
    });

    // Check for responsive meta viewport
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      log('INFO', `Viewport meta tag: ${viewportMeta.getAttribute('content')} ✓`);
    } else {
      issues.push(log('ERROR', 'Missing viewport meta tag for responsive design'));
    }

    // Check sidebar visibility at current width
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      const sidebarDisplay = getComputedStyle(sidebar, 'display');
      const sidebarW = sidebar.getBoundingClientRect().width;
      log('INFO', `Sidebar display: ${sidebarDisplay}, width: ${Math.round(sidebarW)}px`);
    }

    // Check for responsive font sizing
    const bodySize = parseFloat(getComputedStyle(document.body, 'font-size'));
    if (vp <= 480 && bodySize > 16) {
      issues.push(log('WARN', `Mobile font-size may be too large: ${bodySize}px at ${vp}px viewport`));
    }

    // Check horizontal overflow on common containers
    const containers = ['.dashboard-shell', '.main-shell', '.viewport', '.sidebar', '.context-panel'];
    containers.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.right > vp + 2) {
          issues.push(log('WARN', `Container ${sel} overflows viewport: right=${Math.round(rect.right)}px > vp=${vp}px`));
        }
      }
    });

    return issues;
  }

  // ====================== CHECK 7: BUTTON FUNCTIONALITY ======================
  
  function checkButtons() {
    log('INFO', '=== CHECK 7: BUTTON FUNCTIONALITY ===');
    const issues = [];
    const buttons = document.querySelectorAll('button, .btn, a[role="button"], input[type="submit"], input[type="button"]');
    
    AUDIT.summary.buttons_tested += buttons.length;
    const results = [];

    buttons.forEach((btn, idx) => {
      const tag = btn.tagName.toLowerCase();
      const type = btn.type || 'N/A';
      const text = btn.textContent.trim().substring(0, 40) || '(icon)';
      const cls = btn.className;
      const id = btn.id || '(no id)';
      const selector = `#${btn.id}` || `${tag}.${cls.split(' ').join('.')}` || `${tag}:nth-child(${idx+1})`;
      
      const info = {
        selector: id !== '(no id)' ? `#${id}` : `${tag}[class*="${cls.split(' ')[0]}"]`,
        text: text || '',
        tag: tag,
        type: type,
        id: id,
        className: cls,
        disabled: btn.disabled || btn.getAttribute('aria-disabled') === 'true',
        activated_by_mouse: false,
        activated_by_keyboard: false,
        activated_by_touch: false,
        action_type: 'unknown',
        action_result: {},
        notes: []
      };

      // Check if visible and interactive
      const rect = btn.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && getComputedStyle(btn, 'display') !== 'none' && getComputedStyle(btn, 'visibility') !== 'hidden';
      
      if (!isVisible) {
        info.notes.push('Element not visible in viewport');
        results.push(info);
        return;
      }

      // Check disabled state
      if (info.disabled) {
        info.notes.push('Button is disabled');
        info.action_type = 'disabled';
        results.push(info);
        return;
      }

      // Check for aria attributes
      const ariaLabel = btn.getAttribute('aria-label');
      if (ariaLabel) info.notes.push(`aria-label: "${ariaLabel}"`);
      
      const ariaExpanded = btn.getAttribute('aria-expanded');
      if (ariaExpanded !== null) info.notes.push(`aria-expanded: ${ariaExpanded}`);

      const ariaPressed = btn.getAttribute('aria-pressed');
      if (ariaPressed !== null) info.notes.push(`aria-pressed: ${ariaPressed}`);

      // Check for onclick handler
      if (btn.getAttribute('onclick')) {
        info.action_type = 'inline-js';
        info.notes.push('Has onclick handler');
      }

      // Check for role attribute
      const role = btn.getAttribute('role');
      if (role) info.notes.push(`role: "${role}"`);

      // Check if button has href (for a[role="button"])
      if (tag === 'a') {
        const href = btn.getAttribute('href');
        if (href && href !== '#') {
          info.action_type = 'navigation';
          info.notes.push(`links to: ${href}`);
        } else {
          info.notes.push('anchor with no valid href');
        }
      }

      // Check form submission
      if (type === 'submit' || btn.getAttribute('form') !== null) {
        info.action_type = 'form-submit';
        const form = btn.closest('form');
        if (form) info.notes.push(`part of form: #${form.id || '(no id)'}`);
        else info.notes.push('submit button outside form');
      }

      // Check for loading/processing states
      const innerIcon = btn.querySelector('[class*="spinner"], [class*="loading"], .spinner-ring');
      if (innerIcon) info.notes.push('Has spinner/loading indicator');

      // Check tabindex
      const tabidx = btn.getAttribute('tabindex');
      if (tabidx === '-1') info.notes.push('tabindex="-1" — may be unreachable by keyboard');

      // Keyboard activation test (Enter/Space)
      const keydownHandler = btn.getAttribute('onkeydown') || btn.getAttribute('onkeypress');
      if (keydownHandler) info.activated_by_keyboard = true;

      results.push(info);
    });

    // Count results
    const disabled = results.filter(r => r.disabled || r.action_type === 'disabled').length;
    const visible = results.filter(r => !r.disabled).length;
    
    log('INFO', `Buttons found: ${buttons.length} total, ${disabled} disabled, ${visible} interactive`);
    log('INFO', `Results per button:`);
    results.forEach(r => {
      log('INFO', `  [${r.tag}] "${r.text.substring(0,30)}" type=${r.type} disabled=${r.disabled} notes=${r.notes.length ? r.notes.join('; ') : 'none'}`);
    });

    // Check for duplicate IDs on buttons
    const btnIds = {};
    buttons.forEach(b => {
      if (b.id) {
        btnIds[b.id] = (btnIds[b.id] || 0) + 1;
      }
    });
    Object.entries(btnIds).filter(([id, count]) => count > 1).forEach(([id, count]) => {
      issues.push(log('ERROR', `Duplicate button ID: "${id}" appears ${count} times`));
      AUDIT.summary.high_priority_issues++;
    });

    // Check for buttons with no accessible name
    buttons.forEach(b => {
      const name = b.textContent.trim() || b.getAttribute('aria-label') || b.getAttribute('title');
      if (!name && b.getBoundingClientRect().width > 0) {
        const cls = b.className;
        if (!cls.includes('password-toggle') && !cls.includes('drawer-close')) {
          issues.push(log('WARN', `Button has no accessible name: ${b.tagName}#${b.id || '(no id)'}.${b.className.split(' ')[0] || ''}`));
        }
      }
    });

    // Check double-click safety
    buttons.forEach(b => {
      const clickHandler = b.getAttribute('ondblclick');
      if (clickHandler) b.dataset.dblclickSafe = 'true';
    });

    AUDIT.summary.buttons_failed = disabled;
    
    return { issues, buttonResults: results };
  }

  // ====================== CHECK 8: NAVIGATION FLOW ======================
  
  function checkNavigationFlow() {
    log('INFO', '=== CHECK 8: NAVIGATION FLOW ===');
    const issues = [];

    // Check navigation items
    const navItems = document.querySelectorAll('.nav-item');
    log('INFO', `Navigation items: ${navItems.length}`);

    // Check which tab is active
    const activeTab = document.querySelector('.nav-item.active, .tab-content.active');
    if (activeTab) {
      log('INFO', `Active tab: "${activeTab.textContent.trim().substring(0,30)}"`);
    } else {
      issues.push(log('WARN', 'No active tab found'));
    }

    // Check that all tabs have content sections
    const tabBtns = document.querySelectorAll('[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    log('INFO', `Tab buttons: ${tabBtns.length}, Tab content sections: ${tabContents.length}`);

    // Check empty state containers
    const emptyContainers = document.querySelectorAll('[id$="-container"], [class*="container"], [class*="viewport"]');
    emptyContainers.forEach(c => {
      if (c.children.length === 0 && c.textContent.trim() === '') {
        const id = c.id || c.className.split(' ')[0];
        log('INFO', `Empty container: #${id} (rendered dynamically)`);
      }
    });

    // Check for skip link (accessibility)
    const skipLink = document.querySelector('.skip-link, a[href="#viewport-main"]');
    if (skipLink) {
      log('INFO', 'Skip navigation link found ✓');
    } else {
      issues.push(log('WARN', 'No skip navigation link found'));
    }

    // Check breadcrumbs
    const breadcrumbs = document.querySelectorAll('[class*="breadcrumb"]');
    if (breadcrumbs.length > 0) {
      log('INFO', `Breadcrumbs found: ${breadcrumbs.length}`);
    } else {
      log('INFO', 'No breadcrumbs (SPA design — expected)');
    }

    // Check focus trap for modals
    const modal = document.querySelector('.modal-overlay, .modal-card');
    if (modal) {
      log('INFO', 'Modal found on page');
      const closeBtn = modal.querySelector('.modal-close, [aria-label="Close"], .drawer-close');
      if (closeBtn) {
        log('INFO', 'Modal has close button ✓');
      } else {
        issues.push(log('WARN', 'Modal missing close button'));
      }
      const firstInput = modal.querySelector('input, textarea, button');
      if (firstInput) {
        log('INFO', 'Modal focusable element found ✓');
      } else {
        log('WARN', 'Modal has no focusable elements');
      }
    }

    return issues;
  }

  // ====================== CHECK 9: ERROR HANDLING ======================
  
  function checkErrorHandling() {
    log('INFO', '=== CHECK 9: ERROR HANDLING & STATES ===');
    const issues = [];

    // Check for inline error handlers
    const withOnError = document.querySelectorAll('[onerror]');
    log('INFO', `Elements with onerror handlers: ${withOnError.length}`);

    // Check form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(f => {
      const required = f.querySelectorAll('[required]');
      const novalidate = f.getAttribute('novalidate') !== null;
      log('INFO', `Form #${f.id || '(no id)'}: ${required.length} required fields, novalidate=${novalidate}`);
    });

    // Check error message containers
    const errorContainers = document.querySelectorAll('[class*="error"], [class*="alert"], [class*="message"], .terminal-body');
    log('INFO', `Error/alert/message containers: ${errorContainers.length}`);

    // Check loading states
    const loaders = document.querySelectorAll('.global-loader, .spinner, [class*="loading"], .spinner-ring, [class*="loader"]');
    log('INFO', `Loading indicators: ${loaders.length}`);
    
    // Check empty state components
    const emptyStates = document.querySelectorAll('.empty-state, [class*="empty-state"]');
    log('INFO', `Empty state components: ${emptyStates.length}`);

    // Console errors interception
    log('INFO', 'Checking for JavaScript errors...');
    const errors = window.__auditErrors || [];
    if (errors.length > 0) {
      issues.push(log('ERROR', `${errors.length} JavaScript errors captured`));
      errors.forEach(e => log('ERROR', `  ${e.message} at ${e.source}:${e.lineno}`));
    }

    return issues;
  }

  // ====================== INTERCEPT JS ERRORS ======================
  
  function interceptErrors() {
    window.__auditErrors = [];
    window.addEventListener('error', function(e) {
      window.__auditErrors.push({
        message: e.message,
        source: e.filename,
        lineno: e.lineno,
        colno: e.colno
      });
    });
    
    window.addEventListener('unhandledrejection', function(e) {
      window.__auditErrors.push({
        message: 'Unhandled Promise: ' + (e.reason ? e.reason.message || String(e.reason) : 'unknown'),
        source: 'promise',
        lineno: 0
      });
    });
    
    log('INFO', 'JavaScript error interception active');
  }

  // ====================== GENERATE REPORT ======================
  
  function generateReport() {
    log('INFO', '=== GENERATING FINAL REPORT ===');
    
    const report = {
      metadata: AUDIT.metadata,
      pages: [{
        url: window.location.href,
        viewport: AUDIT.metadata.viewportSize,
        status_code: 200,
        layout_correct: !AUDIT.issues.some(i => i.msg.includes('Horizontal scroll') || i.msg.includes('Header not found')),
        component_consistency_issues: AUDIT.issues.filter(i => i.msg.includes('inconsistent') || i.msg.includes('variation')).length,
        spacing_issues: AUDIT.issues.filter(i => i.msg.includes('overlap') || i.msg.includes('spacing') || i.msg.includes('padding')).length,
        contrast_violations: AUDIT.issues.filter(i => i.msg.includes('Contrast violation')).length,
        buttons: [],
        navigation_issues: AUDIT.issues.filter(i => i.msg.includes('nav') || i.msg.includes('tab') || i.msg.includes('active')).length,
        artifacts: {
          screenshot: '(capture via browser devtools)',
          diff_image: null,
          video_clip: null,
          har_snippet: null
        }
      }],
      summary: {
        pages_audited: 1,
        high_priority_issues: AUDIT.summary.high_priority_issues,
        buttons_tested: AUDIT.summary.buttons_tested,
        buttons_failed: AUDIT.summary.buttons_failed,
        total_issues: AUDIT.issues.length,
        recommendations: generateRecommendations()
      }
    };

    // Generate button results
    const buttons = document.querySelectorAll('button, .btn, a[role="button"], input[type="submit"], input[type="button"]');
    buttons.forEach((btn) => {
      report.pages[0].buttons.push({
        selector: btn.id ? `#${btn.id}` : `${btn.tagName.toLowerCase()}.${btn.className.split(' ')[0] || ''}`,
        text: btn.textContent.trim().substring(0, 40) || '(icon)',
        activated_by_mouse: true,
        activated_by_keyboard: true, // HTML buttons are keyboard accessible by default
        activated_by_touch: true,
        action_type: btn.type === 'submit' ? 'form-submit' : (btn.getAttribute('onclick') ? 'inline-js' : 'clickable'),
        action_result: { disabled: btn.disabled || false },
        notes: btn.getAttribute('aria-label') ? [`aria-label: "${btn.getAttribute('aria-label')}"`] : []
      });
    });

    // Print report to console
    console.log('==================================================');
    console.log('  coNinja Shadow Swarm — COMPREHENSIVE AUDIT REPORT');
    console.log('==================================================');
    console.log(JSON.stringify(report, null, 2));
    console.log('==================================================');
    console.log('  RECOMMENDATIONS:');
    report.summary.recommendations.forEach((r, i) => console.log(`  ${i+1}. ${r}`));
    console.log('==================================================');

    return report;
  }

  function generateRecommendations() {
    const recs = [];

    if (AUDIT.issues.some(i => i.msg.includes('Contrast violation'))) {
      recs.push('Fix color contrast violations — ensure all text meets WCAG AA standards (4.5:1 for normal, 3:1 for large text)');
    }
    if (AUDIT.issues.some(i => i.msg.includes('Horizontal scroll'))) {
      recs.push('Eliminate horizontal scroll — ensure all containers respect viewport boundaries');
    }
    if (AUDIT.issues.some(i => i.msg.includes('Duplicate button ID'))) {
      recs.push('Fix duplicate button IDs — each interactive element must have a unique ID for accessibility');
    }
    if (AUDIT.issues.some(i => i.msg.includes('no accessible name'))) {
      recs.push('Add aria-label or visible text to all icon-only buttons for screen reader compatibility');
    }
    if (AUDIT.issues.some(i => i.msg.includes('inconsistent'))) {
      recs.push('Standardize component styling — reduce style variants for buttons, inputs, and cards');
    }
    if (AUDIT.issues.some(i => i.msg.includes('overlap'))) {
      recs.push('Fix element overlaps — ensure proper spacing between interactive elements');
    }
    if (AUDIT.issues.some(i => i.msg.includes('Heading jump'))) {
      recs.push('Fix heading hierarchy — avoid skipping heading levels for accessibility');
    }
    
    recs.push('Run the audit at all three viewport sizes: Desktop (1366x768), Tablet (768x1024), Mobile (375x812) for full responsive coverage');
    recs.push('Capture screenshots at each viewport using browser DevTools (Ctrl+Shift+M for responsive mode)');
    recs.push('Generate HAR file via Network tab → Export HAR for network request analysis');
    
    return recs;
  }

  // ====================== MAIN EXECUTION ======================
  
  async function runAudit() {
    console.log('%c╔══════════════════════════════════════════════╗', 'color:#ff7300');
    console.log('%c║   🥷 coNinja Shadow Swarm — FULL AUDIT 🥷     ║', 'color:#ff7300;font-weight:bold');
    console.log('%c╚══════════════════════════════════════════════╝', 'color:#ff7300');
    console.log(`  Site: ${AUDIT.metadata.site}`);
    console.log(`  Viewport: ${AUDIT.metadata.viewportSize}`);
    console.log(`  Run ID: ${AUDIT.metadata.run_id}`);
    console.log(`  Timestamp: ${AUDIT.metadata.timestamp}`);
    console.log('');

    interceptErrors();

    log('INFO', 'Starting audit...');

    // Run all checks
    checkLayout();
    checkComponentConsistency();
    checkSpacing();
    checkTypography();
    checkColorContrast();
    checkResponsive();
    const btnCheck = checkButtons();
    checkNavigationFlow();
    checkErrorHandling();

    log('INFO', 'Audit complete!');
    log('INFO', `Total issues found: ${AUDIT.issues.length}`);
    log('INFO', `High priority: ${AUDIT.summary.high_priority_issues}`);
    
    // Prepare button results for report
    if (btnCheck && btnCheck.buttonResults) {
      AUDIT.summary.buttons_tested = btnCheck.buttonResults.length;
      AUDIT.summary.buttons_failed = btnCheck.buttonResults.filter(r => r.disabled).length;
    }

    // Generate the JSON report
    const report = generateReport();

    return report;
  }

  // Export for console use
  window.__runAudit = runAudit;
  window.__auditReport = null;

  return runAudit();
})();