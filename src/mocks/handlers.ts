import { http, HttpResponse, delay } from 'msw';
import { mockAgents } from './agents';
import { mockTasks } from './tasks';
import { mockLogs } from './logs';
import { mockDeployments } from './deployments';
import { mockDecisions } from './decisions';

// Simulates network latency (100ms - 2000ms)
const simulateLatency = async () => {
  const ms = Math.floor(Math.random() * (2000 - 100 + 1)) + 100;
  await delay(ms);
};

// 5% chance of simulating errors
const shouldSimulateError = () => {
  return Math.random() < 0.05;
};

const getSimulatedError = () => {
  const errorTypes = ['500', '429', 'timeout'];
  const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];

  if (errorType === '500') {
    return HttpResponse.json(
      {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Simulated MSW Internal Server Error',
        details: { reason: 'Random error injection activated.' },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } else if (errorType === '429') {
    return HttpResponse.json(
      {
        code: 'TOO_MANY_REQUESTS',
        message: 'Simulated MSW Rate Limit Exceeded',
        details: { retryAfter: '30s' },
        timestamp: new Date().toISOString(),
      },
      { status: 429 }
    );
  } else {
    // Network timeout / request dropped simulation
    return HttpResponse.error();
  }
};

export const handlers = [
  // Intercept GET /api/v1/agents
  http.get('*/api/v1/agents', async () => {
    await simulateLatency();
    if (shouldSimulateError()) return getSimulatedError();

    return HttpResponse.json({
      data: mockAgents,
      success: true,
    });
  }),

  // Intercept GET /api/v1/tasks
  http.get('*/api/v1/tasks', async () => {
    await simulateLatency();
    if (shouldSimulateError()) return getSimulatedError();

    return HttpResponse.json({
      data: mockTasks,
      success: true,
    });
  }),

  // Intercept GET /api/v1/logs
  http.get('*/api/v1/logs', async () => {
    await simulateLatency();
    if (shouldSimulateError()) return getSimulatedError();

    return HttpResponse.json({
      data: mockLogs,
      success: true,
    });
  }),

  // Intercept GET /api/v1/deployments
  http.get('*/api/v1/deployments', async () => {
    await simulateLatency();
    if (shouldSimulateError()) return getSimulatedError();

    return HttpResponse.json({
      data: mockDeployments,
      success: true,
    });
  }),

  // Intercept GET /api/v1/decisions
  http.get('*/api/v1/decisions', async () => {
    await simulateLatency();
    if (shouldSimulateError()) return getSimulatedError();

    return HttpResponse.json({
      data: mockDecisions,
      success: true,
    });
  }),

  // Intercept GET /api/v1/auth/permissions
  http.get('*/api/v1/auth/permissions', async ({ request }) => {
    await simulateLatency();
    if (shouldSimulateError()) return getSimulatedError();

    const url = new URL(request.url);
    const role = url.searchParams.get('role') || 'Chunin';

    const rolePermissions: Record<string, string[]> = {
      Genin: ['view:dashboard', 'view:roadmap', 'view:logs'],
      Chunin: ['view:dashboard', 'view:roadmap', 'view:pull-requests', 'view:logs', 'view:settings', 'edit:tasks'],
      Jonin: ['view:dashboard', 'view:pull-requests', 'view:logs', 'approve:deployments', 'view:security'],
      Kage: [
        'view:dashboard', 'view:roadmap', 'view:pull-requests', 'view:logs', 'view:settings',
        'edit:settings', 'edit:tasks', 'approve:deployments', 'view:security'
      ],
    };

    return HttpResponse.json({
      permissions: rolePermissions[role] || rolePermissions['Chunin'],
      success: true,
    });
  }),

  // Intercept POST /api/v1/metrics/frontend
  http.post('*/api/v1/metrics/frontend', async ({ request }) => {
    const payload = await request.json() as any;
    console.warn('[MSW Mock Backend] Metric received:', payload);
    return HttpResponse.json({
      success: true,
      message: 'Metric stored successfully',
    });
  }),

  // Intercept POST /api/v1/errors
  http.post('*/api/v1/errors', async ({ request }) => {
    const payload = await request.json() as any;
    console.warn('[MSW Mock Backend] Sentry Error Telemetry report received:', payload);
    return HttpResponse.json({
      success: true,
      message: 'Error report stored successfully',
    });
  }),
];
