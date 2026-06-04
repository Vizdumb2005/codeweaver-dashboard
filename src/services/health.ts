import { api } from './api';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details?: Record<string, string>;
}

/**
 * Periodically polls the backend system health endpoint and dynamically updates the status UI elements.
 */
export const startHealthCheck = () => {
  const check = () => {
    api.get<HealthStatus>('/v1/health')
      .then((res) => {
        const data = res.data;
        const ind = document.getElementById('system-status-indicator');
        const txt = document.getElementById('system-status-text');

        if (!ind) return;

        if (data.status === 'healthy') {
          ind.className = 'status-indicator-pulse online';
          ind.setAttribute('title', 'System Healthy');
          if (txt && (txt.innerText.includes('Swarm Degraded') || txt.innerText === 'Swarm Offline' || txt.innerText === 'Swarm Unhealthy')) {
            txt.innerText = 'Swarm Active (6 Shinobi Coding)';
          }
        } else if (data.status === 'degraded') {
          ind.className = 'status-indicator-pulse degraded';
          const affected = Object.entries(data.details || {})
            .filter(([_, status]) => status !== 'healthy')
            .map(([service]) => service)
            .join(', ');
          const titleText = `Degraded services: ${affected || 'unknown'}`;
          ind.setAttribute('title', titleText);
          if (txt) {
            txt.innerText = `Swarm Degraded (Issues: ${affected || 'unknown'})`;
          }
        } else {
          ind.className = 'status-indicator-pulse offline';
          ind.setAttribute('title', 'System Unhealthy');
          if (txt) txt.innerText = 'Swarm Unhealthy';
        }
      })
      .catch((err) => {
        const ind = document.getElementById('system-status-indicator');
        const txt = document.getElementById('system-status-text');
        if (ind) {
          ind.className = 'status-indicator-pulse offline';
          ind.setAttribute('title', `System unreachable: ${err.message || err}`);
        }
        if (txt) txt.innerText = 'Swarm Offline';
      });
  };

  // Poll immediately and start periodic cycle every 30 seconds
  check();
  const intervalId = setInterval(check, 30000);
  return intervalId;
};
