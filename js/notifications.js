// ============================================================
// Toast Notification System
// ============================================================

(function () {
  'use strict';

  let toastContainer = null;

  function ensureContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        bottom: 60px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  /** Show a toast notification */
  window.showToast = function (message, type, duration) {
    const container = ensureContainer();
    type = type || 'info';
    duration = duration || (type === 'error' ? 5000 : type === 'success' ? 3000 : 3500);

    const colors = {
      success: { bg: 'rgba(76, 175, 80, 0.92)', border: '#4caf50', icon: '◈' },
      error: { bg: 'rgba(244, 67, 54, 0.92)', border: '#f44336', icon: '◈' },
      warning: { bg: 'rgba(255, 179, 0, 0.92)', border: '#ffb300', icon: '◈️' },
      info: { bg: 'rgba(255, 115, 0, 0.92)', border: '#ff7300', icon: 'ℹ️' },
    };

    const config = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
      background: ${config.bg};
      border-left: 3px solid ${config.border};
      color: #fff;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-family: var(--font-sans);
      box-shadow: 0 6px 20px rgba(0,0,0,0.5);
      pointer-events: auto;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transform: translateX(120%);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
      opacity: 0;
      max-width: 340px;
      backdrop-filter: blur(8px);
    `;
    toast.innerHTML = `<span>${config.icon}</span><span>${message}</span>`;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    // Auto remove
    setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 350);
    }, duration);

    // Click to dismiss
    toast.addEventListener('click', () => {
      toast.style.transform = 'translateX(120%)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 350);
    });

    // Cap at 5 toasts
    while (container.children.length > 5) {
      container.firstChild.remove();
    }
  };

  /** Confirm dialog — returns Promise<boolean> */
  window.showConfirm = function (message) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: rgba(16, 11, 9, 0.95);
        border: 1px solid rgba(255, 115, 0, 0.2);
        border-radius: 10px;
        padding: 24px;
        max-width: 380px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      `;
      dialog.innerHTML = `
        <p style="font-size:0.85rem;color:#f8fafc;margin-bottom:20px;line-height:1.5;">${message}</p>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn btn-outline btn-sm" id="confirm-cancel-btn" style="min-width:80px;">Cancel</button>
          <button class="btn btn-primary btn-sm" id="confirm-ok-btn" style="min-width:80px;">Confirm</button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      const cancelBtn = dialog.querySelector('#confirm-cancel-btn');
      const okBtn = dialog.querySelector('#confirm-ok-btn');

      function close(result) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
        resolve(result);
      }

      cancelBtn.addEventListener('click', () => close(false));
      okBtn.addEventListener('click', () => close(true));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(false);
      });
    });
  };

  // Add keyframes if not present
  if (!document.querySelector('#toast-keyframes')) {
    const style = document.createElement('style');
    style.id = 'toast-keyframes';
    style.textContent = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    `;
    document.head.appendChild(style);
  }

  // Wire confirmation to destructive console clear
  document.addEventListener('DOMContentLoaded', () => {
    const clearBtn = document.getElementById('console-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', async (e) => {
        const confirmed = await window.showConfirm(
          'Wipe all stealth scroll logs? This cannot be undone.',
        );
        if (!confirmed) {
          e.stopImmediatePropagation();
        }
      });
    }
  });
})();
