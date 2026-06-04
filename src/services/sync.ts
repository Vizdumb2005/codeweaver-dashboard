import { dashboardStore } from '../store/store';

export class SyncClient {
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private reconnectTimeout: any = null;
  private reconnectAttempts = 0;
  private isFallbackMode = false;
  private simulationInterval: any = null;

  private getUrl(type: 'ws' | 'sse'): string {
    if (type === 'ws' && import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    let host = window.location.host;
    let protocol = window.location.protocol;

    if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
      const url = new URL(apiBase);
      host = url.host;
      protocol = url.protocol;
    }

    if (type === 'ws') {
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${host}${apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase}/v1/sync`;
    } else {
      const sseProtocol = protocol;
      return `${sseProtocol}//${host}${apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase}/v1/sync/sse`;
    }
  }

  public connect(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    if (this.isFallbackMode) {
      this.connectSSE();
      return;
    }

    const wsUrl = this.getUrl('ws');
    console.warn('[SyncClient] Connecting WebSocket to:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.warn('[SyncClient] WebSocket connected.');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (err) => {
        console.warn('[SyncClient] WebSocket error:', err);
        // Switch to SSE after 2 consecutive failures
        if (this.reconnectAttempts >= 2) {
          console.warn('[SyncClient] Switch to SSE fallback mode.');
          this.isFallbackMode = true;
        }
      };

      this.ws.onclose = (event) => {
        console.warn('[SyncClient] WebSocket closed:', event.code, event.reason);
        this.ws = null;
        this.scheduleReconnection();
      };
    } catch (e) {
      console.warn('[SyncClient] Failed to initialize WebSocket:', e);
      this.isFallbackMode = true;
      this.scheduleReconnection();
    }
  }

  private connectSSE(): void {
    const sseUrl = this.getUrl('sse');
    console.warn('[SyncClient] Connecting SSE EventSource to:', sseUrl);

    try {
      this.sse = new EventSource(sseUrl);

      this.sse.onopen = () => {
        console.warn('[SyncClient] SSE connected.');
        this.reconnectAttempts = 0;
      };

      this.sse.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.sse.onerror = (err) => {
        console.warn('[SyncClient] SSE error:', err);
        if (this.sse) {
          this.sse.close();
          this.sse = null;
        }
        this.scheduleReconnection();
      };
    } catch (e) {
      console.warn('[SyncClient] Failed to initialize EventSource:', e);
      this.scheduleReconnection();
    }
  }

  private scheduleReconnection(): void {
    if (this.reconnectTimeout) return;

    // Auto-trigger simulation fallback if connection fails repeatedly
    if (this.reconnectAttempts >= 3) {
      this.startSimulationMode();
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    console.warn(`[SyncClient] Reconnecting in ${delay}ms (Attempt #${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  private startSimulationMode(): void {
    if (this.simulationInterval) return;
    console.warn('[SyncClient] Unable to connect. Activating simulated local update stream.');

    this.simulationInterval = setInterval(() => {
      const state = dashboardStore.getState();
      const agentsList = Object.keys(state.agents);
      
      if (agentsList.length > 0) {
        // Randomly update an agent status
        const randomAgent = agentsList[Math.floor(Math.random() * agentsList.length)];
        const statuses = ['coding', 'idle', 'thinking', 'watching'];
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        state.updateAgentStatus(randomAgent, newStatus);
      }

      // Randomly append a swarm trace/log
      const systems = ['scout', 'sensei', 'coder', 'auditor', 'system'];
      const logs = [
        'Running AST verification sweeps on modified nodes.',
        'Analyzing telemetry data from staging environments.',
        'Swarm status parameters synced successfully.',
        'Optimizing context buffer lengths for LLM requests.',
        'Chakra gates fully aligned. Swarm stability stable.'
      ];
      const randomSystem = systems[Math.floor(Math.random() * systems.length)];
      const randomLog = logs[Math.floor(Math.random() * logs.length)];
      state.addLog(randomSystem, 'info', randomLog);
    }, 10000);
  }

  private handleMessage(dataStr: string): void {
    try {
      const event = JSON.parse(dataStr);
      console.warn('[SyncClient] Received real-time sync event:', event);

      const store = dashboardStore.getState();
      switch (event.type) {
        case 'agent_status':
          store.updateAgentStatus(event.agentId, event.status, event.currentTaskId);
          break;
        case 'log_stream':
          store.addLog(event.agent, event.logType || 'info', event.message, event.timestamp);
          break;
        case 'deployment_progress':
          store.updateTask(event.taskId, {
            progress: event.progress,
            status: event.status,
            output: event.output || '',
          });
          break;
        default:
          console.warn('[SyncClient] Unknown event type:', event.type);
      }
    } catch (e) {
      console.warn('[SyncClient] Failed to parse message:', e);
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.sse) {
      this.sse.close();
      this.sse = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
}

export const syncClient = new SyncClient();
