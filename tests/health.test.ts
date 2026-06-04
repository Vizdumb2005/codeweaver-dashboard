import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startHealthCheck } from '../src/services/health';
import { api } from '../src/services/api';

vi.mock('../src/services/api', () => {
  return {
    api: {
      get: vi.fn(),
    },
  };
});

describe('System Health Polling Service', () => {
  let mockIndicator: HTMLElement;
  let mockText: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup simulated DOM nodes
    mockIndicator = document.createElement('span');
    mockIndicator.id = 'system-status-indicator';
    mockIndicator.className = 'status-indicator-pulse online';

    mockText = document.createElement('span');
    mockText.id = 'system-status-text';
    mockText.innerText = 'Swarm Active (6 Shinobi Coding)';

    document.body.appendChild(mockIndicator);
    document.body.appendChild(mockText);
  });

  afterEach(() => {
    if (document.getElementById('system-status-indicator')) {
      document.body.removeChild(mockIndicator);
    }
    if (document.getElementById('system-status-text')) {
      document.body.removeChild(mockText);
    }
    vi.useRealTimers();
  });

  it('should transition indicator to online and update tooltip on healthy response', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        status: 'healthy',
        details: { database: 'healthy', redis: 'healthy' }
      },
      success: true,
    });

    startHealthCheck();
    await vi.runOnlyPendingTimersAsync();

    expect(mockIndicator.className).toBe('status-indicator-pulse online');
    expect(mockIndicator.getAttribute('title')).toBe('System Healthy');
  });

  it('should transition indicator to degraded and set detailed tooltip on degraded response', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        status: 'degraded',
        details: { database: 'healthy', redis: 'degraded', query_engine: 'unhealthy' }
      },
      success: true,
    });

    startHealthCheck();
    await vi.runOnlyPendingTimersAsync();

    expect(mockIndicator.className).toBe('status-indicator-pulse degraded');
    expect(mockIndicator.getAttribute('title')).toBe('Degraded services: redis, query_engine');
    expect(mockText.innerText).toBe('Swarm Degraded (Issues: redis, query_engine)');
  });

  it('should transition indicator to offline on connection/server failure', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    startHealthCheck();
    await vi.runOnlyPendingTimersAsync();

    expect(mockIndicator.className).toBe('status-indicator-pulse offline');
    expect(mockIndicator.getAttribute('title')).toContain('Network error');
    expect(mockText.innerText).toBe('Swarm Offline');
  });
});
