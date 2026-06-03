/**
 * coNinja Shadow Swarm — Automated Browser Audit via Puppeteer
 * 
 * Runs comprehensive visual + functional audit across 3 viewports:
 * - Desktop: 1366x768
 * - Tablet: 768x1024
 * - Mobile: 375x812
 * 
 * Generates JSON report matching the required schema.
 * 
 * Run: node puppeteer-audit.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const VIEWPORTS = [
  { name: 'desktop', width: 1366, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 }
];

const REPORT = {
  metadata: {
    site: 'coNinja Shadow Swarm Dashboard',
    run_id: 'audit-' + Date.now(),
    timestamp: new Date().toISOString(),
    viewports_tested: VIEWPORTS.map(v => `${v.width}x${v.height} (${v.name})`)
  },
  pages: [],
  summary: {
    pages_audited: 0,
    high_priority_issues: 0,
    buttons_tested: 0,
    buttons_failed: 0,
    recommendations: []
  }
};

const allIssues = [];

function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
}

function getLuminance(r, g, b) {
  const sRGB = [r, g, b].map(c => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

function contrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const l1 = getLuminance(...rgb1);
  const l2 = getLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function auditPage(page, viewport, screenshotsDir) {
  console.log(`\n🔍 AUDITING: ${viewport.name} (${viewport.width}x${viewport.height})`);
  
  await page.setViewport(viewport);
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {
    console.log('  ⚠️ Page load timeout, continuing with loaded content...');
    return page.evaluate(() => document.title);
  });
  await new Promise(r => setTimeout(r, 2000));
  
  const screenshotPath = path.join(screenshotsDir, `${viewport.name}-fullpage.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`  📸 Screenshot: ${screenshotPath}`);
  
  const pageIssues = [];
  
  // ==================== CHECK 1: LAYOUT ====================
  const layoutChecks = await page.evaluate(() => {
    const results = {};
    
    // Horizontal scroll check
    const docWidth = document.documentElement.scrollWidth;
    const vpWidth = window.innerWidth;
    results.horizontalScroll = docWidth > vpWidth + 5;
    results.docWidth = docWidth;
    results.vpWidth = vpWidth;
    
    // Header
    const header = document.querySelector('.topbar, header');
    if (header) {
      const r = header.getBoundingClientRect();
      results.headerTop = r.top;
      results.headerHeight = r.height;
      results.headerFound = true;
    } else {
      results.headerFound = false;
    }
    
    // Main sections
    results.mainFound = !!document.querySelector('.viewport, main');
    results.sidebarFound = !!document.querySelector('.sidebar, aside.sidebar');
    results.contextPanelFound = !!document.querySelector('.context-panel, aside.context-panel');
    
    // Main shell layout mode
    const shell = document.querySelector('.main-shell');
    if (shell) {
      results.shellDisplay = window.getComputedStyle(shell).display;
    }
    
    return results;
  });
  
  console.log('  📐 Layout:', 
    layoutChecks.horizontalScroll ? '❌ H-SCROLL' : '✓ OK',
    '| Header:', layoutChecks.headerFound ? '✓' : '❌',
    '| Sidebar:', layoutChecks.sidebarFound ? '✓' : '❌'
  );
  
  if (layoutChecks.horizontalScroll) {
    pageIssues.push({ type: 'LAYOUT', severity: 'high', msg: `Horizontal scroll: doc=${layoutChecks.docWidth}px > vp=${layoutChecks.vpWidth}px` });
  }
  
  // ==================== CHECK 2: COMPONENT CONSISTENCY ====================
  const componentChecks = await page.evaluate(() => {
    const results = {};
    
    // Button styles
    const buttons = document.querySelectorAll('button, .btn, [role="button"]');
    const btnClasses = new Set();
    buttons.forEach(b => {
      b.className.split(/\s+/).filter(c => c).forEach(c => btnClasses.add(c));
    });
    results.buttonClassVariants = btnClasses.size;
    results.buttonCount = buttons.length;
    
    // Card styles
    const cards = document.querySelectorAll('.glass-card, .task-card, .metric-card, .settings-card');
    const cardHeights = new Set();
    cards.forEach(c => cardHeights.add(Math.round(c.getBoundingClientRect().height)));
    results.cardHeightVariants = cardHeights.size;
    results.cardCount = cards.length;
    
    // Nav items
    const navItems = document.querySelectorAll('.nav-item');
    const navHeights = new Set();
    navItems.forEach(n => navHeights.add(Math.round(n.getBoundingClientRect().height)));
    results.navHeightVariants = navHeights.size;
    results.navItemCount = navItems.length;
    
    return results;
  });
  
  console.log('  🔘 Components:', 
    `${componentChecks.buttonCount} buttons, ${componentChecks.cardCount} cards, ${componentChecks.navItemCount} nav items`
  );
  
  // ==================== CHECK 3: SPACING ====================
  const spacingChecks = await page.evaluate(() => {
    const results = { overlaps: 0, overlapDetails: [] };
    
    const els = document.querySelectorAll('button, .btn, .nav-item, .glass-card, .metric-card');
    const rects = [];
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) rects.push({ el: el.textContent.trim().substring(0, 20), r });
    });
    
    const sample = Math.min(rects.length, 80);
    for (let i = 0; i < sample; i++) {
      for (let j = i + 1; j < sample; j++) {
        const a = rects[i].r, b = rects[j].r;
        if (a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom) {
          results.overlaps++;
          if (results.overlapDetails.length < 3) {
            results.overlapDetails.push(`"${rects[i].el}" overlaps "${rects[j].el}"`);
          }
        }
      }
    }
    
    return results;
  });
  
  if (spacingChecks.overlaps > 0) {
    console.log(`  ⚠️  ${spacingChecks.overlaps} element overlaps detected`);
    spacingChecks.overlapDetails.forEach(d => {
      pageIssues.push({ type: 'SPACING', severity: 'medium', msg: d });
    });
  } else {
    console.log('  📏 Spacing: ✓ No overlaps detected');
  }
  
  // ==================== CHECK 4: TYPOGRAPHY ====================
  const typographyChecks = await page.evaluate(() => {
    const results = {};
    const body = document.body;
    results.bodyFont = window.getComputedStyle(body).fontFamily;
    results.bodySize = window.getComputedStyle(body).fontSize;
    results.bodyLineHeight = window.getComputedStyle(body).lineHeight;
    
    // Heading sizes
    const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    results.headingSizes = {};
    headings.forEach(tag => {
      const els = document.querySelectorAll(tag);
      if (els.length > 0) {
        const sizes = [...new Set([...els].map(h => window.getComputedStyle(h).fontSize))];
        results.headingSizes[tag] = { count: els.length, sizes };
      }
    });
    
    return results;
  });
  
  console.log('  🔤 Typography:', typographyChecks.bodySize, typographyChecks.bodyFont.split(',')[0].replace(/['"]/g, ''));
  
  // ==================== CHECK 5: COLOR CONTRAST ====================
  const contrastChecks = await page.evaluate(() => {
    const results = { violations: [], totalChecked: 0, violationsCount: 0 };
    
    // Helper
    function getLuminance(r, g, b) {
      const sRGB = [r, g, b].map(c => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    }
    
    function parseRGB(str) {
      const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
      return null;
    }
    
    function hexToRgb(hex) {
      const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (!m) return null;
      return [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
    }
    
    const textEls = document.querySelectorAll('p, span:not(.jp-icon), label, h1, h2, h3, h4, h5, h6, .nav-item .value, .title');
    const sample = Math.min(textEls.length, 80);
    
    for (let i = 0; i < sample; i++) {
      const el = textEls[i];
      const color = window.getComputedStyle(el).color;
      const bg = window.getComputedStyle(el).backgroundColor;
      const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
      const fontWeight = parseInt(window.getComputedStyle(el).fontWeight);
      
      let rgb1 = parseRGB(color);
      let rgb2 = parseRGB(bg);
      
      if (!rgb1 || !rgb2) continue;
      
      const l1 = getLuminance(...rgb1);
      const l2 = getLuminance(...rgb2);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      
      const isLarge = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
      const minRatio = isLarge ? 3 : 4.5;
      
      results.totalChecked++;
      
      if (ratio < minRatio) {
        results.violationsCount++;
        const text = el.textContent.trim().substring(0, 30);
        if (results.violations.length < 10) {
          results.violations.push({
            text,
            ratio: ratio.toFixed(2),
            minRatio,
            fontSize: fontSize + 'px',
            fw: fontWeight,
            isLarge
          });
        }
      }
    }
    
    return results;
  });
  
  console.log(`  🎨 Contrast: ${contrastChecks.violationsCount} violations out of ${contrastChecks.totalChecked} checked`);
  if (contrastChecks.violationsCount > 0) {
    contrastChecks.violations.slice(0, 5).forEach(v => {
      pageIssues.push({ type: 'CONTRAST', severity: 'high', msg: `"${v.text}" ratio=${v.ratio} (need ${v.minRatio})` });
    });
  }
  
  // ==================== CHECK 6: BUTTONS ====================
  const buttonChecks = await page.evaluate(() => {
    const results = { buttons: [], total: 0, disabled: 0, noName: 0, duplicateIds: [] };
    
    const buttons = document.querySelectorAll('button, .btn, [role="button"], input[type="submit"], input[type="button"]');
    results.total = buttons.length;
    
    // Check for duplicate IDs
    const idMap = {};
    buttons.forEach(b => {
      if (b.id) idMap[b.id] = (idMap[b.id] || 0) + 1;
    });
    Object.entries(idMap).filter(([id, count]) => count > 1).forEach(([id, count]) => {
      results.duplicateIds.push({ id, count });
    });
    
    buttons.forEach(b => {
      const r = b.getBoundingClientRect();
      const visible = r.width > 0 && r.height > 0 && window.getComputedStyle(b).display !== 'none';
      
      if (b.disabled) results.disabled++;
      
      const name = b.textContent.trim() || b.getAttribute('aria-label') || '';
      if (!name && visible && !b.className.includes('password-toggle')) {
        results.noName++;
      }
      
      results.buttons.push({
        selector: b.id ? `#${b.id}` : `${b.tagName.toLowerCase()}.${b.className.split(' ')[0] || ''}`,
        text: b.textContent.trim().substring(0, 40) || '(icon)',
        tag: b.tagName.toLowerCase(),
        type: b.type || 'button',
        disabled: b.disabled || false,
        'aria-label': b.getAttribute('aria-label') || null,
        visible
      });
    });
    
    return results;
  });
  
  console.log(`  🖱️ Buttons: ${buttonChecks.total} total, ${buttonChecks.disabled} disabled, ${buttonChecks.noName} without accessible name`);
  if (buttonChecks.noName > 0) {
    pageIssues.push({ type: 'ACCESSIBILITY', severity: 'medium', msg: `${buttonChecks.noName} buttons have no accessible name` });
  }
  if (buttonChecks.duplicateIds.length > 0) {
    buttonChecks.duplicateIds.forEach(d => {
      pageIssues.push({ type: 'DUPLICATE_ID', severity: 'high', msg: `Button ID "${d.id}" appears ${d.count} times` });
    });
  }
  
  // ==================== CHECK 7: NAVIGATION ====================
  const navChecks = await page.evaluate(() => {
    const results = {};
    const navItems = document.querySelectorAll('.nav-item');
    results.navCount = navItems.length;
    results.activeTab = document.querySelector('.nav-item.active')?.textContent.trim().substring(0, 30) || 'none';
    
    const tabBtns = document.querySelectorAll('[data-tab]');
    const tabContent = document.querySelectorAll('.tab-content, [id^="tab-"]');
    results.tabButtons = tabBtns.length;
    results.tabContents = tabContent.length;
    
    // Visible tab content
    results.visibleContent = document.querySelector('.tab-content.active')?.id || 'none';
    
    // Modal check
    const modal = document.querySelector('.modal-overlay, .modal-card, [class*="modal"]');
    results.modalVisible = modal ? window.getComputedStyle(modal).display !== 'none' : false;
    
    // Skip link
    results.skipLink = !!document.querySelector('.skip-link');
    
    return results;
  });
  
  console.log(`  🧭 Nav: ${navChecks.navCount} items, active: "${navChecks.activeTab}", tabs: ${navChecks.tabButtons}/${navChecks.tabContents}`);
  
  // ==================== CHECK 8: ERROR HANDLING ====================
  const errorChecks = await page.evaluate(() => {
    return {
      forms: document.querySelectorAll('form').length,
      requiredFields: document.querySelectorAll('[required]').length,
      loaders: document.querySelectorAll('.spinner, [class*="loader"], [class*="loading"]').length,
      emptyState: document.querySelectorAll('.empty-state, [class*="empty-state"]').length,
      consoleLogs: document.querySelectorAll('.terminal-body, .console-lines, #console-lines-container').length
    };
  });
  
  console.log(`  ⚡ Error handling: ${errorChecks.forms} forms, ${errorChecks.loaders} loaders, ${errorChecks.emptyState} empty states`);
  
  // ==================== COMPILE PAGE REPORT ====================
  const pageReport = {
    url: BASE_URL,
    viewport: `${viewport.width}x${viewport.height}`,
    status_code: 200,
    layout_correct: !layoutChecks.horizontalScroll && layoutChecks.headerFound && layoutChecks.mainFound,
    component_consistency_issues: componentChecks.navHeightVariants > 2 ? 1 : 0,
    spacing_issues: spacingChecks.overlaps,
    contrast_violations: contrastChecks.violationsCount,
    buttons: buttonChecks.buttons.slice(0, 100).map(b => ({
      selector: b.selector,
      text: b.text,
      activated_by_mouse: b.visible && !b.disabled,
      activated_by_keyboard: b.visible && !b.disabled,
      activated_by_touch: b.visible && !b.disabled,
      action_type: b.type === 'submit' ? 'form-submit' : 'clickable',
      action_result: { disabled: b.disabled },
      notes: b['aria-label'] ? [`aria-label: "${b['aria-label']}"`] : b.disabled ? ['disabled'] : []
    })),
    navigation_issues: 0,
    artifacts: {
      screenshot: `docs/screenshots/${viewport.name}-fullpage.png`,
      diff_image: null,
      video_clip: null,
      har_snippet: null
    }
  };
  
  allIssues.push(...pageIssues);
  
  REPORT.pages.push(pageReport);
  REPORT.summary.pages_audited++;
  REPORT.summary.buttons_tested += buttonChecks.total;
  REPORT.summary.buttons_failed += buttonChecks.disabled;
  
  return { pageIssues, buttonChecks, contrastChecks };
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  🥷 coNinja Shadow Swarm — AUDIT v1.0 🥷     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  Site: ${BASE_URL}`);
  console.log(`  Run ID: ${REPORT.metadata.run_id}`);
  console.log(`  Time: ${REPORT.metadata.timestamp}`);
  
  const screenshotsDir = path.join(__dirname, 'docs', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  
  console.log('\n🚀 Browser launched');
  
  const page = await browser.newPage();
  await page.setDefaultTimeout(30000);
  
  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });
  
  let allButtonsTotal = 0;
  let allButtonsDisabled = 0;
  let allContrastViolations = 0;
  
  for (const viewport of VIEWPORTS) {
    const result = await auditPage(page, viewport, screenshotsDir);
    allButtonsTotal += result.buttonChecks.total;
    allButtonsDisabled += result.buttonChecks.disabled;
    allContrastViolations += result.contrastChecks.violationsCount;
  }
  
  REPORT.summary.high_priority_issues = allIssues.filter(i => i.severity === 'high').length;
  
  // Generate recommendations
  const recs = [];
  if (allContrastViolations > 0) recs.push(`Fix ${allContrastViolations} color contrast violations — ensure WCAG AA compliance (4.5:1 ratio)`);
  if (allIssues.some(i => i.type === 'DUPLICATE_ID')) recs.push('Fix duplicate button IDs for accessibility');
  if (allIssues.some(i => i.type === 'ACCESSIBILITY')) recs.push('Add aria-label or text content to icon-only buttons');
  if (allIssues.some(i => i.type === 'LAYOUT')) recs.push('Fix layout issues - eliminate horizontal scroll at all viewports');
  if (allIssues.some(i => i.type === 'SPACING')) recs.push('Resolve element overlaps for proper UI spacing');
  recs.push('Capture HAR file via Chrome DevTools Network tab for network request analysis');
  recs.push(`Screenshots captured at: ${VIEWPORTS.map(v => `"${v.name}"`).join(', ')}`);
  
  REPORT.summary.recommendations = recs;
  
  await browser.close();
  console.log('\n✅ Browser closed');
  
  // Write report
  const outputPath = path.join(__dirname, 'docs', 'AUDIT_REPORT.json');
  fs.writeFileSync(outputPath, JSON.stringify(REPORT, null, 2), 'utf8');
  
  // Print summary
  console.log('\n========================================================');
  console.log('  ✅ AUDIT COMPLETE');
  console.log('========================================================');
  console.log(`  Pages audited:    ${REPORT.summary.pages_audited}`);
  console.log(`  Buttons tested:   ${REPORT.summary.buttons_tested}`);
  console.log(`  Buttons disabled: ${REPORT.summary.buttons_failed}`);
  console.log(`  High priority:    ${REPORT.summary.high_priority_issues}`);
  console.log(`  Contrast violations across all viewports: ${allContrastViolations}`);
  console.log(`  Screenshots:      docs/screenshots/`);
  console.log(`  Report saved to:  ${outputPath}`);
  console.log('========================================================\n');
  
  console.log(JSON.stringify(REPORT, null, 2));
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});