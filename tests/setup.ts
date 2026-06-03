import '@testing-library/jest-dom';

import { vi } from 'vitest';

// Mock system API / browser properties if needed
global.HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
});
global.playSystemSound = vi.fn();

// Add global window mock methods expected by components and state store
window.switchTab = vi.fn();
window.renderLogs = vi.fn();
window.addLog = vi.fn();
window.updateSidebarBadges = vi.fn();
window.showToast = vi.fn();
window.showConfirmDialog = vi.fn((title, content, onConfirm) => onConfirm?.());
window.renderKanban = vi.fn();
window.renderSettingsSubtab = vi.fn();
window.renderReport = vi.fn();
window.renderMetrics = vi.fn();
window.renderSecurity = vi.fn();
window.renderOpsRecovery = vi.fn();
window.renderSwarmGraph = vi.fn();
window.ninjaIcons = {
  get: vi.fn().mockReturnValue('◈'),
};
