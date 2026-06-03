/* ============================================================
   CoNinja Shadow Swarm — Notification Center Component
   Centralized inbox for all system alerts and messages
   ============================================================ */

(function () {
  'use strict';

  const getNotifications = () => {
    const items = Array.isArray(window.state.notifications)
      ? window.state.notifications
      : window.state.notifications?.items || [];
    if (!window.state.notifications) {
      window.state.notifications = { items: [] };
    }
    if (!Array.isArray(window.state.notifications) && !window.state.notifications.items) {
      window.state.notifications.items = [];
    }
    const currentItems = Array.isArray(window.state.notifications)
      ? window.state.notifications
      : window.state.notifications.items;
    if (currentItems.length === 0) {
      const defaultItems = [
        {
          id: 'notif-001',
          type: 'success',
          title: 'Deployment Complete',
          message: 'Staging v1.2.3-rc.7 deployed successfully',
          time: '2m ago',
          read: false,
        },
        {
          id: 'notif-002',
          type: 'warning',
          title: 'High Memory Usage',
          message: 'Kage Coder using 78% VRAM - consider scaling',
          time: '5m ago',
          read: false,
        },
        {
          id: 'notif-003',
          type: 'info',
          title: 'Model Swapped',
          message: 'Sensei switched to GPT-4o for current task',
          time: '15m ago',
          read: true,
        },
        {
          id: 'notif-004',
          type: 'success',
          title: 'Task Completed',
          message: 'Authentication middleware implementation done',
          time: '32m ago',
          read: true,
        },
        {
          id: 'notif-005',
          type: 'error',
          title: 'Test Failure',
          message: 'Payment flow E2E test failed - retrying',
          time: '1h ago',
          read: true,
        },
        {
          id: 'notif-006',
          type: 'info',
          title: 'Agent Spawned',
          message: 'New shinobi "Sakura Coder" joined the swarm',
          time: '2h ago',
          read: true,
        },
        {
          id: 'notif-007',
          type: 'warning',
          title: 'Budget Alert',
          message: 'Daily spend at 80% of $5 limit',
          time: '3h ago',
          read: true,
        },
      ];
      if (Array.isArray(window.state.notifications)) {
        window.state.notifications.push(...defaultItems);
      } else {
        window.state.notifications.items = defaultItems;
      }
    }
    return Array.isArray(window.state.notifications)
      ? window.state.notifications
      : window.state.notifications.items;
  };

  let _filter = 'all';

  /* ── Type styles ─────────────────────────────────────────── */
  const TYPE_ICONS = {
    success: window.ninjaIcons ? window.ninjaIcons.get('check') : '✅',
    error: window.ninjaIcons ? window.ninjaIcons.get('circle') : '❌',
    warning: window.ninjaIcons ? window.ninjaIcons.get('star') : '⚠️',
    info: window.ninjaIcons ? window.ninjaIcons.get('info') : 'ℹ️',
  };

  const TYPE_COLORS = {
    success: '#4CAF50',
    error: '#ef4444',
    warning: '#ff7300',
    info: '#00BCD4',
  };

  /* ── Render notifications ────────────────────────────────── */
  function renderNotifications() {
    const container = document.getElementById('notifications-container');
    if (!container) {
      console.warn('[Notifications] No container found');
      return;
    }

    const notifs = getNotifications();

    const filtered = notifs.filter((n) => {
      if (_filter === 'unread') return !n.read;
      if (_filter === 'all') return true;
      return n.type === _filter;
    });

    const unreadCount = notifs.filter((n) => !n.read).length;

    container.innerHTML = `
      <div class="glass-card" style="margin-bottom:16px;">
        <div style="padding:16px 20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.3rem;">${window.ninjaIcons ? window.ninjaIcons.get('diamond') : '◈'}</span>
            <div>
              <div style="font-weight:700; font-size:0.95rem;">Notifications</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${unreadCount} unread • ${notifs.length} total</div>
            </div>
          </div>
        </div>
        <!-- Single filter bar (was previously duplicated) -->
        <div style="padding:0 20px 16px 20px; display:flex; gap:8px; flex-wrap:wrap; border-bottom:1px solid rgba(255,255,255,0.05);">
          <select class="form-select" id="notif-filter-select" style="font-size:0.75rem; padding:4px 8px;">
            <option value="all" ${_filter === 'all' ? 'selected' : ''}>All</option>
            <option value="unread" ${_filter === 'unread' ? 'selected' : ''}>Unread</option>
            <option value="success" ${_filter === 'success' ? 'selected' : ''}>Success</option>
            <option value="warning" ${_filter === 'warning' ? 'selected' : ''}>Warnings</option>
            <option value="error" ${_filter === 'error' ? 'selected' : ''}>Errors</option>
            <option value="info" ${_filter === 'info' ? 'selected' : ''}>Info</option>
          </select>
          <button class="btn btn-outline btn-sm" id="notif-mark-all-read-btn">Mark All Read</button>
          <button class="btn btn-outline btn-sm" id="notif-clear-all-btn">Clear All</button>
        </div>
      </div>

      <div class="notifications-list" style="display:flex; flex-direction:column; gap:10px;">
        ${
          filtered.length === 0
            ? `
          <div class="glass-card" style="padding:60px; text-align:center;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#notif-glow)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px; filter: drop-shadow(0 0 8px rgba(255, 115, 0, 0.2)); display: inline-block;">
              <defs>
                <linearGradient id="notif-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ff7300" />
                  <stop offset="100%" stop-color="#a855f7" />
                </linearGradient>
              </defs>
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
            </svg>
            <div style="font-size:1.1rem; font-weight:600; color:var(--text-muted);">No notifications</div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:8px;">Your scroll is empty</div>
          </div>
        `
            : filtered
                .map(
                  (notif) => `
          <div class="glass-card notif-card ${notif.read ? 'read' : 'unread'}" 
               style="padding:16px 20px; border-left:3px solid ${TYPE_COLORS[notif.type]}; cursor:pointer; transition:all 0.15s ease;"
               data-id="${notif.id}">
            <div style="display:flex; align-items:flex-start; gap:14px;">
              <div style="width:32px; height:32px; border-radius:50%; background:${TYPE_COLORS[notif.type]}20; 
                          display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0;">
                ${TYPE_ICONS[notif.type]}
              </div>
              <div style="flex:1; min-width:0;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                   <span style="font-weight:600; font-size:0.9rem;">${notif.title}</span>
                  ${!notif.read ? '<span class="badge badge-purple" style="font-size:0.6rem; padding:2px 6px;">NEW</span>' : ''}
                </div>
                <div style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:6px;">${notif.message}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${notif.time}</div>
              </div>
              <button class="btn btn-outline btn-sm notif-dismiss" data-id="${notif.id}" style="padding:2px 8px; font-size:0.7rem;">${window.ninjaIcons ? window.ninjaIcons.get('circle') : '◈'}</button>
            </div>
          </div>
        `,
                )
                .join('')
        }
      </div>
    `;

    attachListeners();
    updateBadge(unreadCount);
    injectStyles();
  }

  /* ── Update notification badge ───────────────────────────── */
  function updateBadge(count) {
    const badge = document.getElementById('notif-badge-count');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }

  /* ── Attach event listeners ──────────────────────────────── */
  function attachListeners() {
    // Guard against duplicate listener attachment
    if (window._notificationsListenersWired) return;
    window._notificationsListenersWired = true;

    const filterSelect = document.getElementById('notif-filter-select');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        _filter = e.target.value;
        renderNotifications();
      });
    }

    const markAllBtn = document.getElementById('notif-mark-all-read-btn');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        getNotifications().forEach((n) => (n.read = true));
        if (typeof window.showToast === 'function') {
          window.showToast('All notifications marked as read', 'success');
        }
        renderNotifications();
        if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      });
    }

    const clearAllBtn = document.getElementById('notif-clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (Array.isArray(window.state.notifications)) {
          window.state.notifications.length = 0;
        } else if (window.state.notifications) {
          window.state.notifications.items = [];
        }
        if (typeof window.showToast === 'function') {
          window.showToast('All notifications cleared', 'info');
        }
        renderNotifications();
        if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      });
    }

    document.querySelectorAll('.notif-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('notif-dismiss')) {
          e.stopPropagation();
          const id = e.target.dataset.id;
          if (Array.isArray(window.state.notifications)) {
            window.state.notifications.splice(
              0,
              window.state.notifications.length,
              ...getNotifications().filter((n) => n.id !== id),
            );
          } else if (window.state.notifications) {
            window.state.notifications.items = getNotifications().filter((n) => n.id !== id);
          }
          renderNotifications();
          if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
        } else {
          const id = card.dataset.id;
          const notif = getNotifications().find((n) => n.id === id);
          if (notif) {
            notif.read = true;
            card.classList.add('read');
            card.classList.remove('unread');
            const unread = getNotifications().filter((n) => !n.read).length;
            updateBadge(unread);
            if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
          }
        }
      });
    });
  }

  /* ── Inject component styles ─────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('notifications-styles')) return;
    const style = document.createElement('style');
    style.id = 'notifications-styles';
    style.textContent = `
      .notif-card:hover { background: rgba(255,255,255,0.04); transform: translateX(4px); }
      .notif-card.unread { background: rgba(255,115,0,0.05); }
      .notif-card.read { opacity: 0.85; }
    `;
    document.head.appendChild(style);
  }

  /* ── Expose to window ────────────────────────────────────── */
  window.renderNotifications = renderNotifications;
  window.initNotifications = function () {
    renderNotifications();
  };

  console.warn('%c[CoNinja] Notification Center loaded', 'color:#ff7300;font-weight:bold;');
})();
