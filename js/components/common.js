/* ============================================================
   CoNinja Shadow Swarm — Common Utilities Component
   Shared helpers, UI primitives, and interaction utilities
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. renderSkeleton(count)
     Returns HTML for `count` premium shimmer skeleton cards
  ---------------------------------------------------------- */
  window.renderSkeleton = function (count) {
    count = Math.max(1, parseInt(count) || 3);
    const card = `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton-header">
          <div class="skeleton-avatar skel-pulse"></div>
          <div class="skeleton-title-group">
            <div class="skel-line skel-pulse" style="width:60%;height:14px;"></div>
            <div class="skel-line skel-pulse" style="width:40%;height:10px;margin-top:6px;"></div>
          </div>
          <div class="skel-badge skel-pulse"></div>
        </div>
        <div class="skeleton-body">
          <div class="skel-line skel-pulse" style="width:100%;height:10px;"></div>
          <div class="skel-line skel-pulse" style="width:85%;height:10px;margin-top:8px;"></div>
          <div class="skel-line skel-pulse" style="width:70%;height:10px;margin-top:8px;"></div>
        </div>
        <div class="skeleton-footer">
          <div class="skel-pill skel-pulse"></div>
          <div class="skel-pill skel-pulse" style="width:60px;"></div>
          <div class="skel-pill skel-pulse" style="width:48px;"></div>
        </div>
      </div>`;
    return Array.from({ length: count }, () => card).join('');
  };

  /* Inject skeleton styles once */
  if (!document.getElementById('cns-skeleton-styles')) {
    const style = document.createElement('style');
    style.id = 'cns-skeleton-styles';
    style.textContent = `
      .skeleton-card {
        background: var(--surface-glass, rgba(255,255,255,0.04));
        border: 1px solid var(--border-subtle, rgba(255,255,255,0.07));
        border-radius: 14px;
        padding: 18px;
        overflow: hidden;
      }
      .skeleton-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .skeleton-avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .skeleton-title-group { flex: 1; }
      .skel-badge {
        width: 64px;
        height: 22px;
        border-radius: 100px;
      }
      .skel-pill {
        width: 80px;
        height: 24px;
        border-radius: 100px;
      }
      .skeleton-body { margin-bottom: 16px; }
      .skel-line { border-radius: 6px; }
      .skeleton-footer {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      @keyframes cns-shimmer {
        0%   { background-position: -400px 0; }
        100% { background-position: 400px 0; }
      }
      .skel-pulse {
        background: linear-gradient(
          90deg,
          rgba(255,115,0,0.06) 0%,
          rgba(255,115,0,0.18) 30%,
          rgba(255,200,80,0.22) 50%,
          rgba(255,115,0,0.18) 70%,
          rgba(255,115,0,0.06) 100%
        );
        background-size: 800px 100%;
        animation: cns-shimmer 1.6s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  /* ----------------------------------------------------------
     2. renderEmptyState(optsOrIcon, title, message, actionLabel, actionId)
     Dual-mode renderer: supports both object-based (emptyState.js style)
     and legacy positional-arg call signatures.
     Object style: renderEmptyState({ illustration, title, description, primaryLabel, ... })
     Positional style: renderEmptyState(icon, title, message, actionLabel, actionId)
  ---------------------------------------------------------- */
  window.renderEmptyState = function (icon, title, message, actionLabel, actionId) {
    // ── Object-based call (from agentStudio.js, testing.js, security.js, etc.) ──
    if (icon !== null && icon !== undefined && typeof icon === 'object') {
      const opts = icon;
      const illustration = opts.illustration || 'kanji';
      const objTitle = opts.title || 'Nothing here yet';
      const objDesc =
        opts.description || opts.message || 'The shadow swarm awaits its first scroll.';
      const pLabel = opts.primaryLabel || opts.actionLabel || '';
      const pAction = opts.primaryAction || opts.actionId || '';
      const sLabel = opts.secondaryLabel || '';
      const sAction = opts.secondaryAction || '';
      const sizeClass = opts.size === 'sm' ? 'empty-state-sm' : '';

      // Use illustration SVGs from emptyState.js if loaded, otherwise fall back to CSS icon
      let svgHtml = '';
      if (window.emptyStateIllustrations && window.emptyStateIllustrations[illustration]) {
        svgHtml = `<div class="empty-state-illustration">${
          window.emptyStateIllustrations[illustration]
        }</div>`;
      } else {
        svgHtml =
          '<div class="cns-empty-icon" style="font-size:3rem;margin-bottom:20px;filter:drop-shadow(0 0 20px rgba(255,115,0,0.3));">◈</div>';
      }

      const pBtn = pLabel
        ? `<button class="btn btn-primary btn-sm empty-state-primary" data-action="${pAction}">${pLabel}</button>`
        : '';
      const sBtn = sLabel
        ? `<button class="btn btn-outline btn-sm empty-state-secondary" data-action="${sAction}">${sLabel}</button>`
        : '';
      const actionsHtml =
        pBtn || sBtn
          ? `<div class="empty-state-actions" style="display:flex;gap:10px;justify-content:center;margin-top:20px;">${
              pBtn
            }${sBtn}</div>`
          : '';

      return (
        `<div class="empty-state ${
          sizeClass
        }" role="status" aria-live="polite" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;text-align:center;animation:cns-fade-in 0.4s ease;">${
          svgHtml
        }<h3 class="empty-state-title cns-empty-title" style="font-size:1.25rem;font-weight:700;color:var(--text-primary,#fff);margin:0 0 10px;">${
          objTitle
        }</h3>` +
        `<p class="empty-state-description cns-empty-msg" style="font-size:0.9rem;color:var(--text-muted,#8a8a9a);max-width:320px;line-height:1.6;margin:0;">${
          objDesc
        }</p>${actionsHtml}</div>`
      );
    }

    // ── Legacy positional-arg call (from repository.js, etc.) ──
    icon = icon || '◈';
    title = title || 'Nothing here yet';
    message = message || 'The shadow swarm awaits its first scroll.';

    // Map common emoji placeholders to premium SVGs
    let finalIcon = icon;
    if (typeof icon === 'string' && icon.length <= 4) {
      const svgs = {
        '◈': '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#cns-empty-glow)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(255, 115, 0, 0.2));"><defs><linearGradient id="cns-empty-glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7300" /><stop offset="100%" stop-color="#a855f7" /></linearGradient></defs><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
        '◈️': '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#cns-empty-glow)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(255, 115, 0, 0.2));"><defs><linearGradient id="cns-empty-glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7300" /><stop offset="100%" stop-color="#a855f7" /></linearGradient></defs><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
        '◈': '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#cns-empty-glow)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(255, 115, 0, 0.2));"><defs><linearGradient id="cns-empty-glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7300" /><stop offset="100%" stop-color="#a855f7" /></linearGradient></defs><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        '◈': '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#cns-empty-glow)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(255, 115, 0, 0.2));"><defs><linearGradient id="cns-empty-glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7300" /><stop offset="100%" stop-color="#a855f7" /></linearGradient></defs><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
        '◈': '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#cns-empty-glow)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(255, 115, 0, 0.2));"><defs><linearGradient id="cns-empty-glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7300" /><stop offset="100%" stop-color="#a855f7" /></linearGradient></defs><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
        '◈': '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#cns-empty-glow)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(255, 115, 0, 0.2));"><defs><linearGradient id="cns-empty-glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7300" /><stop offset="100%" stop-color="#a855f7" /></linearGradient></defs><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
        '◈': '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#cns-empty-glow)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(255, 115, 0, 0.2));"><defs><linearGradient id="cns-empty-glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7300" /><stop offset="100%" stop-color="#a855f7" /></linearGradient></defs><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
        '◈': '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#cns-empty-glow)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(255, 115, 0, 0.2));"><defs><linearGradient id="cns-empty-glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7300" /><stop offset="100%" stop-color="#a855f7" /></linearGradient></defs><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
        '◈': '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#cns-empty-glow)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(255, 115, 0, 0.2));"><defs><linearGradient id="cns-empty-glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7300" /><stop offset="100%" stop-color="#a855f7" /></linearGradient></defs><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        '◈': '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#cns-empty-glow)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(255, 115, 0, 0.2));"><defs><linearGradient id="cns-empty-glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7300" /><stop offset="100%" stop-color="#a855f7" /></linearGradient></defs><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
        '◈': '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#cns-empty-glow)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(255, 115, 0, 0.2));"><defs><linearGradient id="cns-empty-glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7300" /><stop offset="100%" stop-color="#a855f7" /></linearGradient></defs><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z"></path></svg>',
      };

      const cleanIcon = icon.trim();
      if (svgs[cleanIcon]) {
        finalIcon = svgs[cleanIcon];
      }
    }

    const actionHtml =
      actionLabel && actionId
        ? `<button id="${actionId}" class="btn btn-primary" style="margin-top:18px;">${actionLabel}</button>`
        : '';
    return `
      <div class="cns-empty-state" role="status" aria-live="polite">
        <div class="cns-empty-icon">${finalIcon}</div>
        <h3 class="cns-empty-title">${title}</h3>
        <p class="cns-empty-msg">${message}</p>
        ${actionHtml}
      </div>`;
  };

  if (!document.getElementById('cns-empty-styles')) {
    const style = document.createElement('style');
    style.id = 'cns-empty-styles';
    style.textContent = `
      .cns-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 24px;
        text-align: center;
        animation: cns-fade-in 0.4s ease;
      }
      .cns-empty-icon {
        font-size: 72px;
        line-height: 1;
        margin-bottom: 20px;
        filter: drop-shadow(0 0 20px rgba(255,115,0,0.3));
        animation: cns-float 3s ease-in-out infinite;
      }
      .cns-empty-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary, #fff);
        margin: 0 0 10px;
      }
      .cns-empty-msg {
        font-size: 0.9rem;
        color: var(--text-muted, #8a8a9a);
        max-width: 320px;
        line-height: 1.6;
        margin: 0;
      }
      @keyframes cns-float {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(-10px); }
      }
      @keyframes cns-fade-in {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  /* ----------------------------------------------------------
     3. renderErrorState(message, retryId)
     Returns HTML for an error state with retry button
  ---------------------------------------------------------- */
  window.renderErrorState = function (message, retryId) {
    message = message || 'Something went wrong. The jutsu failed.';
    const retryHtml = retryId
      ? `<button id="${retryId}" class="btn btn-outline" style="margin-top:18px;">⟳ Retry Jutsu</button>`
      : '';
    return `
      <div class="cns-error-state" role="alert">
        <div class="cns-error-icon">◈️</div>
        <h3 class="cns-error-title">Jutsu Failed</h3>
        <p class="cns-error-msg">${message}</p>
        ${retryHtml}
      </div>`;
  };

  if (!document.getElementById('cns-error-styles')) {
    const style = document.createElement('style');
    style.id = 'cns-error-styles';
    style.textContent = `
      .cns-error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 24px;
        text-align: center;
      }
      .cns-error-icon {
        font-size: 56px;
        margin-bottom: 16px;
        animation: cns-shake 0.5s ease;
      }
      .cns-error-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--accent-error, #ef4444);
        margin: 0 0 8px;
      }
      .cns-error-msg {
        font-size: 0.88rem;
        color: var(--text-muted, #8a8a9a);
        max-width: 300px;
        line-height: 1.6;
        margin: 0;
      }
      @keyframes cns-shake {
        0%, 100% { transform: translateX(0); }
        25%       { transform: translateX(-8px); }
        75%       { transform: translateX(8px); }
      }
    `;
    document.head.appendChild(style);
  }

  /* ----------------------------------------------------------
     4. showConfirmDialog(title, message, onConfirm, destructive)
     Creates a modal overlay with backdrop blur
  ---------------------------------------------------------- */
  window.showConfirmDialog = function (title, message, onConfirm, destructive) {
    window.closeConfirmDialog();

    const overlay = document.createElement('div');
    overlay.id = 'cns-confirm-overlay';
    overlay.innerHTML = `
      <div class="cns-confirm-backdrop" id="cns-confirm-backdrop"></div>
      <div class="cns-confirm-modal glass-card" role="dialog" aria-modal="true"
           aria-labelledby="cns-confirm-title" aria-describedby="cns-confirm-desc">
      <div class="cns-confirm-icon">
        ${
          destructive
            ? '<svg class="jp-icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>'
            : '<svg class="jp-icon" viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z"/></svg>'
        }
      </div>
        <h2 class="cns-confirm-title" id="cns-confirm-title">${title || 'Confirm Action'}</h2>
        <p class="cns-confirm-desc" id="cns-confirm-desc">${message || 'Are you sure you want to proceed?'}</p>
        <div class="cns-confirm-actions">
          <button id="cns-confirm-cancel" class="btn btn-outline">Cancel</button>
          <button id="cns-confirm-ok" class="btn ${destructive ? 'btn-danger' : 'btn-primary'}">
            ${destructive ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    /* Animate in */
    requestAnimationFrame(() => {
      overlay.classList.add('cns-confirm-visible');
    });

    const closeAndRun = (run) => {
      window.closeConfirmDialog();
      if (run && typeof onConfirm === 'function') onConfirm();
    };

    const cancelBtn = overlay.querySelector('#cns-confirm-cancel');
    const okBtn = overlay.querySelector('#cns-confirm-ok');
    const backdrop = overlay.querySelector('#cns-confirm-backdrop');

    if (cancelBtn) cancelBtn.addEventListener('click', () => closeAndRun(false));
    if (okBtn) okBtn.addEventListener('click', () => closeAndRun(true));
    if (backdrop) backdrop.addEventListener('click', () => closeAndRun(false));

    /* Focus trap */
    if (okBtn) okBtn.focus();

    /* ESC key */
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeAndRun(false);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  };

  /* ----------------------------------------------------------
     5. closeConfirmDialog()
  ---------------------------------------------------------- */
  window.closeConfirmDialog = function () {
    const existing = document.getElementById('cns-confirm-overlay');
    if (existing) {
      existing.classList.remove('cns-confirm-visible');
      setTimeout(() => {
        if (existing.parentNode) existing.parentNode.removeChild(existing);
      }, 280);
    }
  };

  if (!document.getElementById('cns-confirm-styles')) {
    const style = document.createElement('style');
    style.id = 'cns-confirm-styles';
    style.textContent = `
      #cns-confirm-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      #cns-confirm-overlay.cns-confirm-visible { opacity: 1; }
      .cns-confirm-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.65);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .cns-confirm-modal {
        position: relative;
        z-index: 1;
        max-width: 420px;
        width: 90%;
        padding: 36px 32px;
        border-radius: 20px;
        text-align: center;
        transform: scale(0.9) translateY(20px);
        transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1);
        border: 1px solid rgba(255,115,0,0.25);
        box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,115,0,0.1);
      }
      #cns-confirm-overlay.cns-confirm-visible .cns-confirm-modal {
        transform: scale(1) translateY(0);
      }
      .cns-confirm-icon { font-size: 48px; margin-bottom: 14px; }
      .cns-confirm-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--text-primary, #fff);
        margin: 0 0 10px;
      }
      .cns-confirm-desc {
        font-size: 0.9rem;
        color: var(--text-muted, #8a8a9a);
        line-height: 1.6;
        margin: 0 0 24px;
      }
      .cns-confirm-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      .btn-danger {
        background: var(--accent-error, #ef4444);
        color: #fff;
        border: none;
        box-shadow: 0 4px 16px rgba(239,68,68,0.35);
      }
      .btn-danger:hover { background: #dc2626; }
    `;
    document.head.appendChild(style);
  }

  /* ----------------------------------------------------------
     6. showToast(message, type, duration)
     Only defines if not already present
  ---------------------------------------------------------- */
  if (typeof window.showToast !== 'function') {
    window.showToast = function (message, type, duration) {
      type = type || 'info';
      duration = duration || 3500;

      let container = document.getElementById('cns-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'cns-toast-container';
        document.body.appendChild(container);
      }

      const icons = { success: '●', error: '●', warning: '●', info: '●' };
      const toast = document.createElement('div');
      toast.className = `cns-toast cns-toast-${type}`;
      toast.setAttribute('role', 'alert');
      toast.innerHTML = `
        <span class="cns-toast-icon">${icons[type] || 'ℹ️'}</span>
        <span class="cns-toast-msg">${message}</span>
        <button class="cns-toast-close" aria-label="Dismiss">×</button>`;

      container.appendChild(toast);

      requestAnimationFrame(() => toast.classList.add('cns-toast-in'));

      const dismiss = () => {
        toast.classList.remove('cns-toast-in');
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 350);
      };

      const closeBtn = toast.querySelector('.cns-toast-close');
      if (closeBtn) closeBtn.addEventListener('click', dismiss);
      setTimeout(dismiss, duration);
    };

    if (!document.getElementById('cns-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'cns-toast-styles';
      style.textContent = `
        #cns-toast-container {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }
        .cns-toast {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 18px;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 500;
          color: #fff;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          pointer-events: all;
          opacity: 0;
          transform: translateX(60px) scale(0.9);
          transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
          min-width: 240px;
          max-width: 380px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .cns-toast.cns-toast-in {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        .cns-toast-success { background: rgba(76,175,80,0.9);  border-color: rgba(76,175,80,0.4); }
        .cns-toast-error   { background: rgba(239,68,68,0.9);  border-color: rgba(239,68,68,0.4); }
        .cns-toast-warning { background: rgba(255,115,0,0.9);  border-color: rgba(255,115,0,0.4); }
        .cns-toast-info    { background: rgba(0,188,212,0.9);  border-color: rgba(0,188,212,0.4); }
        .cns-toast-icon { font-size: 1rem; flex-shrink: 0; }
        .cns-toast-msg  { flex: 1; line-height: 1.4; }
        .cns-toast-close {
          background: none;
          border: none;
          color: rgba(255,255,255,0.75);
          cursor: pointer;
          font-size: 1.2rem;
          line-height: 1;
          padding: 0 2px;
          flex-shrink: 0;
        }
        .cns-toast-close:hover { color: #fff; }
      `;
      document.head.appendChild(style);
    }
  }

  /* ----------------------------------------------------------
     7. Ninja Icon System
     Context-aware marker replacement with purpose-made SVGs
  ---------------------------------------------------------- */
  window.ninjaIconSvg = function (name) {
    const key = name || 'shuriken';
    const icons = {
      shuriken:
        '<path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z"></path><circle cx="12" cy="12" r="2.2" fill="currentColor"></circle>',
      kunai:
        '<path d="M12 2L14 6L12 10L10 6Z"></path><path d="M12 10V19"></path><path d="M9 19L12 22L15 19"></path><path d="M8.5 12.5H15.5"></path>',
      scroll:
        '<rect x="6" y="5" width="12" height="14" rx="2"></rect><path d="M9 9h6M9 12h6M9 15h4"></path><circle cx="6" cy="8" r="1.2"></circle><circle cx="18" cy="16" r="1.2"></circle>',
      gate: '<path d="M4 20h16"></path><path d="M6 20V8h12v12"></path><path d="M4 8h16"></path><path d="M8 8V5h8v3"></path>',
      mask: '<path d="M4 12c0-4 4-7 8-7s8 3 8 7c0 4-4 7-8 7s-8-3-8-7z"></path><path d="M8 12h2M14 12h2"></path><path d="M9 15c1 .8 5 .8 6 0"></path>',
      branch:
        '<path d="M6 4v9"></path><path d="M6 9h8"></path><path d="M14 9v7"></path><circle cx="6" cy="4" r="1.5"></circle><circle cx="14" cy="9" r="1.5"></circle><circle cx="14" cy="16" r="1.5"></circle>',
      bell: '<path d="M12 3a4 4 0 0 0-4 4v3l-2 3h12l-2-3V7a4 4 0 0 0-4-4z"></path><path d="M10 17a2 2 0 0 0 4 0"></path>',
      seal: '<circle cx="12" cy="12" r="8"></circle><path d="M12 7l1.5 3 3.2.4-2.3 2.2.6 3.2L12 14.5 9 16l.6-3.2-2.3-2.2 3.2-.4z"></path>',
      dojo: '<path d="M3 9h18"></path><path d="M5 9v9h14V9"></path><path d="M7 9V6h10v3"></path><path d="M9 13h6"></path>',
      flame:
        '<path d="M12 3c1 2 3 3.5 3 6a3 3 0 1 1-6 0c0-2.5 1.2-4.2 3-6z"></path><path d="M12 14c2 1 3 2.4 3 4a3 3 0 0 1-6 0c0-1.6.9-3 3-4z"></path>',
      shield:
        '<path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"></path><path d="M9.5 12l1.7 1.7L14.8 10"></path>',
      wave: '<path d="M3 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"></path><path d="M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0"></path>',
      radar:
        '<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="4"></circle><path d="M12 12L18 9"></path>',
      lock: '<rect x="6" y="11" width="12" height="9" rx="2"></rect><path d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11"></path>',
      merge:
        '<path d="M6 5v10"></path><path d="M6 9h6a4 4 0 0 1 4 4v6"></path><circle cx="6" cy="5" r="1.5"></circle><circle cx="6" cy="15" r="1.5"></circle><circle cx="16" cy="19" r="1.5"></circle>',
      graph:
        '<path d="M4 18l5-6 4 3 7-9"></path><circle cx="4" cy="18" r="1.2"></circle><circle cx="9" cy="12" r="1.2"></circle><circle cx="13" cy="15" r="1.2"></circle><circle cx="20" cy="6" r="1.2"></circle>',
      archive:
        '<rect x="4" y="6" width="16" height="4" rx="1"></rect><rect x="5" y="10" width="14" height="10" rx="1.5"></rect><path d="M10 14h4"></path>',
      compass:
        '<circle cx="12" cy="12" r="8"></circle><path d="M15.5 8.5l-2.4 5-5 2.4 2.4-5z"></path>',
      pulse: '<path d="M3 12h4l2-4 3 8 2-4h7"></path>',
      cloud: '<path d="M7 18h9a4 4 0 1 0-.8-7.9A5.2 5.2 0 0 0 5.3 11 3.5 3.5 0 0 0 7 18z"></path>',
      quill:
        '<path d="M20 4c-5 1-9 5-11 11l3 3c6-2 10-6 11-11z"></path><path d="M11 15l-5 5"></path>',
      eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"></path><circle cx="12" cy="12" r="2.2"></circle>',
    };
    const body = icons[key] || icons.shuriken;
    return `
      <svg class="ninja-inline-icon ninja-icon-${key}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        ${body}
      </svg>`;
  };

  window.pickNinjaIconByContext = function (contextText) {
    const t = (contextText || '').toLowerCase();

    const variants = (arr) => {
      let h = 0;
      for (let i = 0; i < t.length; i++) h = (h << 5) - h + t.charCodeAt(i);
      const idx = Math.abs(h) % arr.length;
      return arr[idx];
    };

    if (/deploy|release|staging|rollback|production|merge gate/.test(t))
      return variants(['gate', 'cloud']);
    if (/security|audit|vuln|scan|approval governance|shadow guard/.test(t))
      return variants(['mask', 'shield', 'eye']);
    if (/test|coverage|lint|qa|failure|testing ground/.test(t)) return variants(['kunai', 'pulse']);
    if (/memory|vault|knowledge|trace|provenance/.test(t)) return variants(['scroll', 'archive']);
    if (/debate|council|approve|override|governance|decree/.test(t))
      return variants(['seal', 'lock']);
    if (/workflow|pipeline|stage|orchestration/.test(t)) return variants(['dojo', 'compass']);
    if (/repo|repository|branch|commit|pull request|pr center/.test(t))
      return variants(['branch', 'merge']);
    if (/notification|alert|inbox/.test(t)) return variants(['bell', 'radar']);
    if (/analytics|cost|metric|trend/.test(t)) return variants(['graph', 'wave']);
    if (/collaboration|handoff|message|chat/.test(t)) return variants(['quill', 'scroll']);
    if (/agent|shinobi|swarm|studio/.test(t)) return variants(['shuriken', 'flame']);
    return variants(['shuriken', 'compass', 'seal', 'quill']);
  };

  window.decorateNinjaIcons = function (root) {
    const host = root || document.body;
    if (!host) return;
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue || !node.nodeValue.includes('◈')) continue;
      const parentTag = node.parentElement ? node.parentElement.tagName : '';
      if (['PRE', 'CODE', 'TEXTAREA', 'SCRIPT', 'STYLE', 'OPTION'].includes(parentTag)) continue;
      textNodes.push(node);
    }
    textNodes.forEach((textNode) => {
      const raw = textNode.nodeValue;
      const markerRegex = /◈(?:️)?/g;
      let lastIndex = 0;
      let match = null;
      let hasAny = false;
      const frag = document.createDocumentFragment();

      while ((match = markerRegex.exec(raw)) !== null) {
        hasAny = true;
        const idx = match.index;
        if (idx > lastIndex) frag.appendChild(document.createTextNode(raw.slice(lastIndex, idx)));

        const start = Math.max(0, idx - 24);
        const end = Math.min(raw.length, idx + 24);
        const context = raw.slice(start, end);
        const iconName = window.pickNinjaIconByContext(context);
        const holder = document.createElement('span');
        holder.innerHTML = window.ninjaIconSvg(iconName);
        if (holder.firstElementChild) frag.appendChild(holder.firstElementChild);

        lastIndex = idx + match[0].length;
      }

      if (hasAny) {
        if (lastIndex < raw.length) frag.appendChild(document.createTextNode(raw.slice(lastIndex)));
        textNode.parentNode.replaceChild(frag, textNode);
      }
    });
  };

  if (!document.getElementById('ninja-inline-icon-styles')) {
    const style = document.createElement('style');
    style.id = 'ninja-inline-icon-styles';
    style.textContent = `
      .ninja-inline-icon {
        width: 0.95em;
        height: 0.95em;
        vertical-align: -0.125em;
        color: var(--accent-orange, #ff7300);
        filter: drop-shadow(0 0 4px rgba(255,115,0,0.35));
      }
    `;
    document.head.appendChild(style);
  }

  /* ----------------------------------------------------------
     7. handleDecisionResolve(decisionId, approved)
  ---------------------------------------------------------- */
  window.handleDecisionResolve = function (decisionId, approved) {
    if (!decisionId) {
      console.warn('[CoNinja] handleDecisionResolve: missing decisionId');
      return;
    }
    if (typeof window.dispatch === 'function') {
      window.dispatch('RESOLVE_DECISION', { decisionId, approved: !!approved });
    } else {
      console.warn('[CoNinja] window.dispatch not available — decision not dispatched.');
    }
    const verdict = approved ? 'Approved' : 'Rejected';
    const type = approved ? 'success' : 'warning';
    if (typeof window.showToast === 'function') {
      window.showToast(`◈ Decision ${decisionId} ${verdict}`, type);
    }
    if (typeof window.addLog === 'function') {
      window.addLog(
        `Decision ${decisionId} ${verdict.toLowerCase()} by Sensei`,
        type === 'success' ? 'success' : 'warn',
      );
    }
  };

  /* ----------------------------------------------------------
     8. triggerSmokePuff(taskId)
     Adds a smoke particle burst effect near a task element
  ---------------------------------------------------------- */
  window.triggerSmokePuff = function (taskId) {
    const target = taskId ? document.querySelector(`[data-task-id="${taskId}"]`) : null;
    const origin = target
      ? target.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const ox = origin.left + origin.width / 2;
    const oy = origin.top + origin.height / 2;

    for (let i = 0; i < 12; i++) {
      const puff = document.createElement('div');
      puff.className = 'cns-smoke-puff';
      const angle = ((Math.PI * 2) / 12) * i;
      const dist = 40 + Math.random() * 40;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const size = 14 + Math.random() * 20;
      puff.style.cssText = `
        left:${ox}px; top:${oy}px;
        width:${size}px; height:${size}px;
        --dx:${dx}px; --dy:${dy}px;`;
      document.body.appendChild(puff);
      setTimeout(() => {
        if (puff.parentNode) puff.parentNode.removeChild(puff);
      }, 900);
    }
  };

  if (!document.getElementById('cns-smoke-styles')) {
    const style = document.createElement('style');
    style.id = 'cns-smoke-styles';
    style.textContent = `
      .cns-smoke-puff {
        position: fixed;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,115,0,0.7) 0%, rgba(255,115,0,0) 70%);
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 99999;
        animation: cns-smoke-burst 0.85s ease-out forwards;
      }
      @keyframes cns-smoke-burst {
        0%   { opacity: 1;   transform: translate(calc(-50%), calc(-50%)) scale(0.2); }
        60%  { opacity: 0.6; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1); }
        100% { opacity: 0;   transform: translate(calc(-50% + var(--dx) * 1.4), calc(-50% + var(--dy) * 1.4)) scale(1.3); }
      }
    `;
    document.head.appendChild(style);
  }

  /* ----------------------------------------------------------
     9. formatDate(isoString)
     Formats an ISO date string to a readable date
  ---------------------------------------------------------- */
  window.formatDate = function (isoString) {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return '—';
    }
  };

  /* ----------------------------------------------------------
     10. formatRelativeTime(isoString)
     Formats to '5 min ago', '2 hr ago', etc.
  ---------------------------------------------------------- */
  window.formatRelativeTime = function (isoString) {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '—';
      const diff = Math.floor((Date.now() - d.getTime()) / 1000); // seconds ago
      if (diff < 5) return 'just now';
      if (diff < 60) return `${diff} sec ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
      if (diff < 604800) return `${Math.floor(diff / 86400)} day ago`;
      return window.formatDate(isoString);
    } catch (e) {
      return '—';
    }
  };

  /* ----------------------------------------------------------
     11. Keyboard Navigation Manager
     Enables global keyboard shortcuts and focus management
  ---------------------------------------------------------- */
  window.KeyboardManager = {
    enabled: true,
    shortcuts: {},

    init() {
      document.addEventListener('keydown', (e) => this.handleKeyDown(e));
      console.warn('[CoNinja] Keyboard navigation initialized');
    },

    handleKeyDown(e) {
      if (!this.enabled || e.target.matches('input, textarea, select')) {
        // Allow Esc even in inputs
        if (e.key === 'Escape') {
          this.handleEscape();
        }
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Global shortcuts
      if (ctrl && key >= '1' && key <= '9') {
        e.preventDefault();
        const tabIndex = parseInt(key) - 1;
        this.switchToTabByIndex(tabIndex);
        return;
      }

      if (ctrl && key === '/') {
        e.preventDefault();
        this.toggleSidebar();
        return;
      }

      if (ctrl && key === 'k') {
        e.preventDefault();
        this.focusSearch();
        return;
      }

      if (key === 'escape') {
        e.preventDefault();
        this.handleEscape();
        return;
      }

      if (key === '?') {
        e.preventDefault();
        this.showShortcutsHelp();
      }
    },

    switchToTabByIndex(index) {
      const tabs = document.querySelectorAll('.sidebar a');
      if (tabs[index]) {
        tabs[index].click();
        window.showToast(`Switched to ${tabs[index].textContent.trim()}`, 'info', 2000);
      }
    },

    toggleSidebar() {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.classList.toggle('collapsed');
        window.store.setState(
          'appearance.sidebarCollapsed',
          sidebar.classList.contains('collapsed'),
        );
      }
    },

    focusSearch() {
      const search = document.querySelector('.search-box input, input[type="search"]');
      if (search) {
        search.focus();
        search.select();
      }
    },

    handleEscape() {
      // Close modals
      window.closeConfirmDialog();

      // Close any open drawers
      const drawer = document.querySelector('.node-detail-drawer.open');
      if (drawer) drawer.classList.remove('open');

      // Close any open panels
      const panels = document.querySelectorAll('.panel-overlay.active');
      panels.forEach((p) => p.classList.remove('active'));
    },

    showShortcutsHelp() {
      const shortcutsHtml = `
        <div style="text-align:left; font-size:0.85rem; line-height:1.8;">
          <div><kbd style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">Ctrl+1-9</kbd> Switch tabs</div>
          <div><kbd style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">Ctrl+/</kbd> Toggle sidebar</div>
          <div><kbd style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">Ctrl+K</kbd> Focus search</div>
          <div><kbd style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">Esc</kbd> Close modals/drawers</div>
          <div><kbd style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">?</kbd> Show this help</div>
        </div>
      `;
      window.showConfirmDialog('⌨️ Keyboard Shortcuts', shortcutsHtml, null, false);
      const okBtn = document.getElementById('cns-confirm-ok');
      if (okBtn) okBtn.textContent = 'Got it';
    },
  };

  // Initialize keyboard manager
  window.KeyboardManager.init();

  /* ----------------------------------------------------------
     12. Loading State Wrapper
     Wraps async operations with loading UI
  ---------------------------------------------------------- */
  window.withLoading = async function (containerId, asyncFn, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return asyncFn();

    const skeletonCount = options.skeletonCount || 3;
    const originalContent = container.innerHTML;

    // Show skeleton
    container.innerHTML = window.renderSkeleton(skeletonCount);
    container.classList.add('loading');

    try {
      const result = await asyncFn();
      container.classList.remove('loading');
      return result;
    } catch (error) {
      container.classList.remove('loading');
      container.innerHTML = window.renderErrorState(
        error.message || 'Failed to load content',
        options.retryId || 'retry-btn',
      );
      if (options.onRetry) {
        const retryBtn = document.getElementById(options.retryId || 'retry-btn');
        if (retryBtn) retryBtn.addEventListener('click', options.onRetry);
      }
      throw error;
    }
  };

  console.warn('%c[CoNinja] Common utilities loaded ◈', 'color:#ff7300;font-weight:bold;');
})();
