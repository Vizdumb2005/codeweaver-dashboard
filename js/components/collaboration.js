/* ============================================================
   CoNinja Shadow Swarm — Collaboration & Handoff Visibility
   Agent conversations, handoff notes, team timeline
   ============================================================ */

(function () {
  'use strict';

  const TYPE_ICONS = {
    'agent-handoff': '◈',
    review: '◈️',
    discussion: '◈',
    alert: '◈',
  };

  window.renderCollaboration = function () {
    const container = document.getElementById('collaboration-container');
    if (!container) return;

    const { threads, teamActivity } = window.state.collaboration;
    const activeTab = window.state.collabActiveTab || 'threads';
    const selectedThread = window.state.collabSelectedThread;

    container.innerHTML = `
      <div class="collab-layout">
        <aside class="collab-sidebar">
          <div class="collab-sidebar-header" style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.05); background:rgba(0,0,0,0.15);">
            <span style="font-weight:600; font-size:0.85rem; color:var(--text-primary);">Stealth Comms</span>
            <button class="btn btn-outline btn-xs" id="btn-new-thread">+ New Thread</button>
          </div>
          <div class="collab-tabs">
            <button class="collab-tab ${activeTab === 'threads' ? 'active' : ''}" data-tab="threads">Threads</button>
            <button class="collab-tab ${activeTab === 'activity' ? 'active' : ''}" data-tab="activity">Activity</button>
            <button class="collab-tab ${activeTab === 'mentions' ? 'active' : ''}" data-tab="mentions">Mentions</button>
          </div>
          <div class="threads-list">
            ${threads
              .map(
                (t) => `
              <div class="thread-item ${selectedThread === t.id && activeTab === 'threads' ? 'active' : ''}" data-thread-id="${t.id}">
                <span class="thread-icon">${TYPE_ICONS[t.type]}</span>
                <div class="thread-info">
                  <div class="thread-title">${getThreadTitle(t)}</div>
                  <div class="thread-preview">${t.messages[t.messages.length - 1]?.content.substring(0, 32) || 'No messages'}...</div>
                  <div class="thread-meta">${t.messages.length} messages • ${formatTime(t.createdAt)}</div>
                </div>
              </div>
            `,
              )
              .join('')}
          </div>
        </aside>

        <main class="collab-main">
          ${activeTab === 'threads' && selectedThread ? renderThreadDetail(threads.find((t) => t.id === selectedThread)) : ''}
          ${
            activeTab === 'threads' && !selectedThread
              ? `
            <div class="empty-state-hint" style="padding: 40px; text-align:center; color:var(--text-muted); margin: auto;">
              <span style="font-size:2.5rem; display:block; margin-bottom:12px;">◈</span>
              Select a thread from the sidebar to view conversation or create a new one.
            </div>
          `
              : ''
          }
          ${activeTab === 'activity' ? renderActivityFeed(teamActivity) : ''}
          ${activeTab === 'mentions' ? renderMentions(threads) : ''}
        </main>

        <aside class="collab-info">
          <div class="team-members">
            <h4>Active Swarm Core</h4>
              ${Object.values(window.state.agents)
                .map((a) => {
                  // Normalize status for display (fixes #024: Sensei showing "Active" vs "Meditating")
                  const displayStatus =
                    {
                      coding: 'Attacking',
                      thinking: 'Meditating',
                      idle: 'Idle',
                      watching: 'Scouting',
                      active: 'Active',
                      sleeping: 'Hibernating',
                    }[a.status] || a.status;
                  const statusIcon =
                    {
                      coding: window.ninjaIcons ? window.ninjaIcons.get('coder') : '◈',
                      thinking: window.ninjaIcons ? window.ninjaIcons.get('orchestrator') : '◈',
                      idle: window.ninjaIcons ? window.ninjaIcons.get('circle') : '◈',
                      watching: window.ninjaIcons ? window.ninjaIcons.get('security') : '◈',
                      active: window.ninjaIcons ? window.ninjaIcons.get('check') : '◈',
                      sleeping: window.ninjaIcons ? window.ninjaIcons.get('circle') : '◈',
                    }[a.status] || '◈';
                  return `
              <div class="member-item">
                <span class="member-avatar">${statusIcon}</span>
                <div class="member-info">
                  <span class="member-name">${a.name}</span>
                  <span class="member-status ${a.status}">${displayStatus}</span>
                </div>
              </div>`;
                })
                .join('')}
          </div>
        </aside>
      </div>
    `;

    attachListeners(container, selectedThread);
    injectStyles();
  };

  function getThreadTitle(thread) {
    if (thread.type === 'agent-handoff') return `Handoff: ${thread.from} → ${thread.to}`;
    if (thread.type === 'review') return `Review: PR #${thread.prId}`;
    return thread.title || 'Discussion';
  }

  function renderThreadDetail(thread) {
    return `
      <div class="thread-detail">
        <div class="thread-header">
          <div>
            <h3 style="font-size:1.1rem; color:var(--text-primary); font-weight:600;">${getThreadTitle(thread)}</h3>
            <span style="font-size:0.72rem; color:var(--text-muted);">Thread started: ${new Date(thread.createdAt).toLocaleString()}</span>
          </div>
          <span class="thread-type badge badge-outline">${TYPE_ICONS[thread.type]} ${thread.type.replace('-', ' ')}</span>
        </div>
        <div class="messages-container">
          ${thread.messages
            .map(
              (m) => `
            <div class="message ${m.from === 'You' ? 'outgoing' : 'incoming'}">
              <div class="message-avatar">${m.from === 'You' ? '◈' : m.from.charAt(0).toUpperCase()}</div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-from">${m.from}</span>
                  <span class="message-time">${formatTime(m.timestamp)}</span>
                </div>
                <div class="message-body">${m.content}</div>
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
        <div class="message-input">
          <textarea class="form-textarea collab-msg-textarea" placeholder="Send handoff coordinates, reviewer notes, or queries to Shinobis..."></textarea>
          <button class="btn btn-primary btn-collab-send">Send</button>
        </div>
      </div>
    `;
  }

  function renderActivityFeed(activity) {
    const getAgentStatus = (user) => {
      const agent = Object.values(window.state.agents).find(
        (a) => a.name === user || a.id === user,
      );
      if (!agent) return '';
      const statusMap = {
        coding: 'Attacking',
        thinking: 'Meditating',
        idle: 'Idle',
        watching: 'Scouting',
        active: 'Active',
        sleeping: 'Hibernating',
      };
      return statusMap[agent.status] || agent.status || '';
    };

    return `
      <div class="activity-feed">
        <h3>Swarm Sync Activity</h3>
        <p style="color:var(--text-muted); font-size:0.78rem; margin-bottom:16px;">Chronological timeline of task transitions and collaboration events.</p>
        <div class="activity-list">
          ${activity
            .map((a) => {
              const agentStatus = getAgentStatus(a.user);
              return `
            <div class="activity-item">
              <span class="activity-icon">${getActivityIcon(a.action)}</span>
              <div class="activity-content">
                <span class="activity-user">${a.user}${agentStatus ? ` <span class="activity-status" style="font-size:0.65rem; color:var(--text-muted);">[${agentStatus}]</span>` : ''}</span>
                <span class="activity-action">${a.action}</span>
                <span class="activity-target">${a.target}</span>
              </div>
              <span class="activity-time">${formatTime(a.timestamp)}</span>
            </div>
          `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  function renderMentions(threads) {
    const mentions = [];
    threads.forEach((t) => {
      t.messages.forEach((m) => {
        const text = m.content.toLowerCase();
        if (
          text.includes('you') ||
          text.includes('operator') ||
          text.includes('human') ||
          text.includes('master')
        ) {
          mentions.push({
            threadId: t.id,
            threadTitle: getThreadTitle(t),
            from: m.from,
            content: m.content,
            timestamp: m.timestamp,
          });
        }
      });
    });

    return `
      <div class="mentions-view" style="padding: 24px;">
        <h3>Mentions & Inboxes</h3>
        <p style="color:var(--text-muted); font-size:0.78rem; margin-bottom:16px;">Direct messages flagged for operator attention.</p>
        <div class="mentions-list" style="display:flex; flex-direction:column; gap:10px;">
          ${
            mentions.length === 0
              ? `
            <p style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:20px;">No pending mentions found.</p>
          `
              : mentions
                  .map(
                    (m) => `
            <div class="mention-item" style="padding:14px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:10px; cursor:pointer;" data-thread-id="${m.threadId}">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <strong style="color:var(--accent-orange); font-size:0.8rem;">${m.threadTitle}</strong>
                <span style="font-size:0.7rem; color:var(--text-muted);">${formatTime(m.timestamp)}</span>
              </div>
              <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:4px;">
                <span style="font-weight:600; color:var(--text-primary);">${m.from}:</span> "${m.content}"
              </div>
              <div style="font-size:0.68rem; color:var(--accent-cyan); display:flex; align-items:center; gap:4px;">
                <span>◈ Jump to conversation</span>
              </div>
            </div>
          `,
                  )
                  .join('')
          }
        </div>
      </div>
    `;
  }

  function getActivityIcon(action) {
    const icons = { committed: '◈', approved: '◈', created: '◈', merged: '◈', commented: '◈' };
    return icons[action] || '◈';
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function attachListeners(container, selectedThread) {
    // Guard against duplicate listener attachment
    if (container.dataset.collabListenersWired) return;
    container.dataset.collabListenersWired = '1';

    // Thread Selection
    container.querySelectorAll('.thread-item').forEach((item) => {
      item.addEventListener('click', () => {
        window.state.collabActiveTab = 'threads';
        window.state.collabSelectedThread = item.dataset.threadId;
        window.renderCollaboration();
      });
    });

    // Tab Switching
    container.querySelectorAll('.collab-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        window.state.collabActiveTab = tab.dataset.tab;
        if (tab.dataset.tab === 'activity' || tab.dataset.tab === 'mentions') {
          window.state.collabSelectedThread = null;
        } else {
          // default to first thread if none active
          if (!window.state.collabSelectedThread && window.state.collaboration.threads.length > 0) {
            window.state.collabSelectedThread = window.state.collaboration.threads[0].id;
          }
        }
        window.renderCollaboration();
      });
    });

    // Mention item jump
    container.querySelectorAll('.mention-item').forEach((item) => {
      item.addEventListener('click', () => {
        window.state.collabActiveTab = 'threads';
        window.state.collabSelectedThread = item.dataset.threadId;
        window.renderCollaboration();
      });
    });

    // Send message handling
    const sendBtn = container.querySelector('.btn-collab-send');
    const textarea = container.querySelector('.collab-msg-textarea');
    if (sendBtn && textarea) {
      const sendMessage = () => {
        const val = textarea.value.trim();
        if (!val) return;

        const currentThread = window.state.collaboration.threads.find(
          (t) => t.id === selectedThread,
        );
        if (currentThread) {
          currentThread.messages.push({
            from: 'You',
            content: val,
            timestamp: new Date().toISOString(),
          });

          // Add to activity logs
          window.state.collaboration.teamActivity.unshift({
            id: `act-${Date.now()}`,
            user: 'You',
            action: 'commented',
            target: getThreadTitle(currentThread),
            timestamp: new Date().toISOString(),
          });

          window.dispatch('ADD_LOG', {
            agent: 'system',
            type: 'info',
            msg: `Operator added reviewer comments into thread: "${getThreadTitle(currentThread)}".`,
          });

          window.renderCollaboration();
          window.showToast('Message transmitted successfully', 'success');
        }
      };

      sendBtn.addEventListener('click', sendMessage);
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    // New Thread Creator Modal
    const btnNewThread = container.querySelector('#btn-new-thread');
    if (btnNewThread) {
      btnNewThread.addEventListener('click', () => {
        const agentOptions = Object.values(window.state.agents)
          .map(
            (a) => `
          <option value="${a.id}">${a.name} (${a.role.replace('_', ' ')})</option>
        `,
          )
          .join('');

        window.showConfirmDialog(
          'Forge Collaboration Thread',
          `<div style="text-align:left; display:flex; flex-direction:column; gap:10px;">
            <div>
              <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Thread Category:</label>
              <select id="collab-input-type" class="form-input text-xs" style="width:100%;">
                <option value="discussion">◈ Discussion / Query</option>
                <option value="agent-handoff">◈ Agent Handoff Notes</option>
                <option value="review">◈️ Code Review Loop</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Thread Subject:</label>
              <input type="text" id="collab-input-title" class="form-input text-xs" style="width:100%;" placeholder="e.g. Auth Route Refactor Debate" required>
            </div>
            <div id="collab-recipient-row">
              <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Target Recipient Shinobi:</label>
              <select id="collab-input-to" class="form-input text-xs" style="width:100%;">
                ${agentOptions}
              </select>
            </div>
            <div>
              <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Opening Statement:</label>
              <textarea id="collab-input-msg" class="form-textarea text-xs" style="width:100%; min-height:60px;" placeholder="Describe what you want to consult about..."></textarea>
            </div>
          </div>`,
          () => {
            const type = document.getElementById('collab-input-type').value;
            const titleInput = document.getElementById('collab-input-title').value.trim();
            const recipientId = document.getElementById('collab-input-to').value;
            const msgInput = document.getElementById('collab-input-msg').value.trim();

            const title = titleInput || 'Discussion Thread';
            const recipient = window.state.agents[recipientId];

            if (!msgInput) {
              window.showToast('Opening statement is required!', 'error');
              return;
            }

            const newThreadId = `thread-${Date.now()}`;
            const newThread = {
              id: newThreadId,
              type,
              title,
              from: 'You',
              to: recipient.name,
              createdAt: new Date().toISOString(),
              messages: [
                {
                  from: 'You',
                  content: msgInput,
                  timestamp: new Date().toISOString(),
                },
              ],
            };

            // Setup responder mock side-effect
            if (type === 'discussion' || type === 'review') {
              setTimeout(() => {
                const replyingAgent = recipient.name;
                const replyText = `Stealth Sync [${replyingAgent}]: Acknowledged. I am scanning the workspace parameters and will execute necessary adaptations.`;
                newThread.messages.push({
                  from: replyingAgent,
                  content: replyText,
                  timestamp: new Date().toISOString(),
                });

                window.state.collaboration.teamActivity.unshift({
                  id: `act-${Date.now()}`,
                  user: replyingAgent,
                  action: 'commented',
                  target: title,
                  timestamp: new Date().toISOString(),
                });

                window.dispatch('ADD_LOG', {
                  agent: recipient.role,
                  type: 'info',
                  msg: `${replyingAgent} replied to debate thread "${title}".`,
                });

                if (
                  window.state.collabActiveTab === 'threads' &&
                  window.state.collabSelectedThread === newThreadId
                ) {
                  window.renderCollaboration();
                }
              }, 2500);
            }

            window.state.collaboration.threads.unshift(newThread);
            window.state.collabActiveTab = 'threads';
            window.state.collabSelectedThread = newThreadId;

            window.state.collaboration.teamActivity.unshift({
              id: `act-${Date.now()}`,
              user: 'You',
              action: 'created',
              target: title,
              timestamp: new Date().toISOString(),
            });

            window.dispatch('ADD_LOG', {
              agent: 'system',
              type: 'success',
              msg: `Forged new collaboration channel: "${title}".`,
            });

            window.renderCollaboration();
            window.showToast(`Thread "${title}" initiated`, 'success');
          },
        );

        // Toggle recipient dropdown based on thread type
        const typeSelect = document.getElementById('collab-input-type');
        const recipientRow = document.getElementById('collab-recipient-row');
        if (typeSelect && recipientRow) {
          typeSelect.addEventListener('change', () => {
            if (typeSelect.value === 'agent-handoff') {
              recipientRow.style.display = 'block';
            } else {
              recipientRow.style.display = 'block'; // Let them select recipient for discussions as well
            }
          });
        }
      });
    }
  }

  function injectStyles() {
    if (document.getElementById('collab-styles-extended')) return;
    const style = document.createElement('style');
    style.id = 'collab-styles-extended';
    style.textContent = `
      .collab-layout { display: grid; grid-template-columns: 280px 1fr 220px; height: calc(100vh - 180px); gap: 16px; }
      .collab-sidebar { background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
      .collab-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.1); }
      .collab-tab { flex: 1; padding: 12px 6px; background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.78rem; font-weight: 600; text-align: center; }
      .collab-tab.active { color: var(--accent-orange); border-bottom: 2px solid var(--accent-orange); background: rgba(255,115,0,0.05); }
      .threads-list { flex: 1; overflow-y: auto; }
      .thread-item { display: flex; gap: 10px; padding: 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.02); transition: background 0.15s; }
      .thread-item:hover { background: rgba(255,255,255,0.03); }
      .thread-item.active { background: rgba(255,115,0,0.1); border-left: 3px solid var(--accent-orange); }
      .thread-icon { font-size: 1.2rem; display: flex; align-items: center; }
      .thread-info { flex: 1; min-width: 0; }
      .thread-title { font-weight: 600; font-size: 0.82rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .thread-preview { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
      .thread-meta { font-size: 0.65rem; color: var(--text-muted); margin-top: 4px; }
      
      .collab-main { background: rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
      .thread-detail { display: flex; flex-direction: column; height: 100%; }
      .thread-header { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.05); }
      .messages-container { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
      .message { display: flex; gap: 12px; }
      .message.incoming { flex-direction: row; }
      .message.outgoing { flex-direction: row-reverse; }
      .message-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, rgba(255,115,0,0.2), rgba(255,179,0,0.2)); border: 1px solid rgba(255,115,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; flex-shrink: 0; color: var(--accent-orange); }
      .message.outgoing .message-avatar { background: linear-gradient(135deg, rgba(156,39,176,0.2), rgba(0,188,212,0.2)); border-color: rgba(0,188,212,0.3); color: var(--accent-cyan); }
      .message-content { max-width: 75%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 12px 16px; }
      .message.outgoing .message-content { background: rgba(255,115,0,0.08); border-color: rgba(255,115,0,0.15); }
      .message-header { display: flex; gap: 8px; margin-bottom: 4px; font-size: 0.72rem; align-items: center; }
      .message-from { font-weight: 600; color: var(--text-primary); }
      .message-time { color: var(--text-muted); }
      .message-body { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; word-break: break-word; }
      
      .message-input { display: flex; gap: 10px; padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.15); align-items: center; }
      .message-input textarea { flex: 1; min-height: 48px; max-height: 120px; font-size: 0.8rem; background: rgba(0,0,0,0.2); }
      
      .activity-feed { padding: 24px; display: flex; flex-direction: column; height: 100%; }
      .activity-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
      .activity-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; }
      .activity-icon { font-size: 1.1rem; }
      .activity-content { flex: 1; font-size: 0.8rem; }
      .activity-user { font-weight: 600; color: var(--text-primary); }
      .activity-action { color: var(--text-muted); }
      .activity-target { color: var(--accent-orange); font-family: var(--font-mono); }
      .activity-time { font-size: 0.72rem; color: var(--text-muted); }
      
      .collab-info { background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; }
      .team-members h4 { margin: 0 0 16px 0; font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
      .member-item { display: flex; align-items: center; gap: 10px; margin-bottom: var(--space-md); padding: var(--space-sm, 8px); background: rgba(255,255,255,0.01); border-radius: 8px; }
      .member-avatar { font-size: 1.2rem; }
      .member-info { flex: 1; min-width: 0; }
      .member-name { display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-primary); }
      .member-status { display: inline-block; font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; margin-top: 2px; }
      .member-status.idle { background: rgba(255,255,255,0.05); color: var(--text-muted); }
      .member-status.coding { background: rgba(76,175,80,0.15); color: #4CAF50; border: 1px solid rgba(76,175,80,0.25); }
      .member-status.thinking { background: rgba(255,115,0,0.15); color: #ff9800; border: 1px solid rgba(255,115,0,0.25); }
      .member-status.watching { background: rgba(33,150,243,0.15); color: #2196F3; border: 1px solid rgba(33,150,243,0.25); }
    `;
    document.head.appendChild(style);
  }

  window.initCollaboration = function () {
    if (!window.state.collabSelectedThread && window.state.collaboration.threads.length > 0) {
      window.state.collabSelectedThread = window.state.collaboration.threads[0].id;
    }
    window.renderCollaboration();
  };

  console.warn('%c[CoNinja] Collaboration loaded ◈', 'color:#ff7300;font-weight:bold;');
})();
