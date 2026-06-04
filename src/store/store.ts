import { createStore } from 'zustand/vanilla';
import type { StateCreator } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface UserState {
  isAuthenticated: boolean;
  username: string;
  role: string;
  clan: string;
  avatar: string;
}

export interface Agent {
  id: string;
  name: string;
  icon: string;
  role: string;
  status: string;
  objective: string;
  currentTaskId: string | null;
  route?: string;
  ram?: string;
  cost?: number;
  skills?: string[];
}

export interface Task {
  id: string;
  title: string;
  desc: string;
  status: string;
  assignee: string;
  priority: number;
  complexity: string;
  duration: string;
  attempts: string;
  tags: string[];
  deps: string[];
  progress?: number;
  output: string;
}

export interface LogEntry {
  time: string;
  agent: string;
  type: string;
  msg: string;
}

export interface DashboardState {
  // --- STATE SLICES ---
  // Auth
  user: UserState;
  
  // Project
  activeProject: string;
  project: {
    name: string;
    description: string;
    timezone: string;
    vcsConfig?: any;
  };
  customSkills: any[];
  mcpServers: any[];
  ragConfig: any[];
  
  // Agents
  agents: Record<string, Agent>;
  selectedAgentId: string | null;
  agentStudio: any;
  
  // Tasks
  tasks: Task[];
  selectedTaskId: string | null;
  taskSearchQuery: string;
  pendingSyncTasks: string[];
  
  // Logs
  consoleLogs: LogEntry[];
  streamLogs: boolean;
  logFilterAgent: string;
  logSearchQuery: string;
  
  // UI / Global
  activeTab: string;
  systemStatus: string;
  autonomyLevel: string;
  hardwareProfile: string;
  dailyLimit: number;
  alertThreshold: number;
  accumulatedCost: number;
  llmRequests: number;
  autoFixes: number;
  avgConfidence: number;
  testCoverage: number;
  activeSettingsTab: string;
  vramSwapEnabled: boolean;
  temperature: number;
  contextLength: number;
  proxyEnabled: boolean;
  sslEnabled: boolean;
  aggressiveUnload: boolean;
  maxConcurrentModels: number;
  quantizationMatrix: Record<string, string>;
  sandboxDir: string;
  sandboxNetLevel: string;
  watchdogEnabled: boolean;
  activeModelsInVRAM: string[];
  multiplexerLogs: Record<string, any[]>;
  multiplexerPaused: Record<string, boolean>;
  tddStance: string;
  mutationTesting: boolean;
  coverageGate: number;
  scrollTokenLimit: number;
  memoryPruning: string;
  midnightDeploy: boolean;
  autoRollback: boolean;
  releaseChakra: number;
  executionSeal: string;
  astEditLimit: number;
  idleFocus: string;
  agentPersonaTemp: number;
  timelapse: any;
  availableLocalModels: string[];
  agentPrompts: Record<string, string>;
  workflow: any;
  debate: any;
  memory: any;
  testing: any;
  security: any;
  deployment: any;
  monitoring: any;
  intake: any;
  repository: any;
  pullRequests: any;
  provenance: any;
  approvals: any;
  projects: any;
  incidents: any;
  featureFlags: any;
  secrets: any;
  collaboration: any;
  analytics: any;
  intelligence: any;
  settings: any;
  appearance: any;
  notifications: any;
  llm: any;
  decisions: any[];

  // --- ACTIONS ---
  switchTab: (tabId: string) => void;
  login: (payload: Partial<UserState>) => void;
  logout: () => void;
  selectAgent: (agentId: string) => void;
  selectTask: (taskId: string | null) => void;
  updateSystemStatus: (status: string) => void;
  addLog: (agent: string, type: string, msg: string, time?: string) => void;
  clearLogs: () => void;
  updateSetting: (key: string, value: any) => void;
  updateAgentStatus: (agentId: string, status: string, currentTaskId?: string | null) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  resolveDecision: (decisionId: string, approved: boolean) => void;
  initNewProject: (payload: { projectTitle: string; tasks: Task[]; vcsConfig?: any }) => void;
  setRawState: (state: Partial<DashboardState>) => void;
}

// Helper to get time representation
const ts = () => new Date().toTimeString().split(' ')[0];

const storeCreator: StateCreator<DashboardState> = (set) => ({
  // --- INITIAL VALUES ---
  user: {
    isAuthenticated: false,
    username: '',
    role: '',
    clan: '',
    avatar: '',
  },
  activeProject: 'TaskMaster Marketplace MVP',
  project: {
    name: 'TaskMaster Marketplace MVP',
    description: 'A comprehensive task marketplace platform with real-time collaboration',
    timezone: 'UTC',
  },
  customSkills: [],
  mcpServers: [],
  ragConfig: [],
  agents: {},
  selectedAgentId: 'orchestrator',
  agentStudio: { selectedAgentId: null, viewMode: 'grid', filterRole: 'all', filterStatus: 'all', agents: [] },
  tasks: [],
  selectedTaskId: null,
  taskSearchQuery: '',
  pendingSyncTasks: [],
  consoleLogs: [],
  streamLogs: true,
  logFilterAgent: 'all',
  logSearchQuery: '',
  activeTab: 'login',
  systemStatus: 'active',
  autonomyLevel: 'advisory',
  hardwareProfile: 'standard',
  dailyLimit: 5.0,
  alertThreshold: 0.8,
  accumulatedCost: 1.42,
  llmRequests: 412,
  autoFixes: 24,
  avgConfidence: 91,
  testCoverage: 84.2,
  activeSettingsTab: 'models',
  vramSwapEnabled: true,
  temperature: 0.2,
  contextLength: 8192,
  proxyEnabled: false,
  sslEnabled: true,
  aggressiveUnload: true,
  maxConcurrentModels: 2,
  quantizationMatrix: { sensei: 'Q8_0', coder: 'Q8_0', tester: 'Q4_K_M' },
  sandboxDir: '/workspace',
  sandboxNetLevel: 'isolated',
  watchdogEnabled: true,
  activeModelsInVRAM: ['Sensei (Orch)'],
  multiplexerLogs: { coder: [], tester: [], scout: [], docker: [] },
  multiplexerPaused: { coder: false, tester: false, scout: false, docker: false },
  tddStance: 'genin',
  mutationTesting: false,
  coverageGate: 80,
  scrollTokenLimit: 4000,
  memoryPruning: 'weekly',
  midnightDeploy: true,
  autoRollback: true,
  releaseChakra: 5,
  executionSeal: 'code_only',
  astEditLimit: 80,
  idleFocus: 'documentation',
  agentPersonaTemp: 0.2,
  timelapse: { playing: false, speed: 1, currentMinute: 720, day: 1 },
  availableLocalModels: [],
  agentPrompts: {},
  workflow: { stages: [], dependencies: [], activeWorkflowId: null, autonomyPolicy: 'advisory' },
  debate: { sessions: [], activeSessionId: null },
  memory: { vectorSettings: {}, graphSettings: {}, retentionRules: [], pinnedEntries: [], searchResults: [] },
  testing: { suites: [], overallCoverage: 84.2, coverageThreshold: 80 },
  security: { score: 87, scanStatus: 'idle', vulnerabilities: [] },
  deployment: { environments: [], releaseHistory: [], cronJobs: [], deployInProgress: false, selectedEnvId: 'staging' },
  monitoring: { health: {}, costHistory: [], errorLog: [], alerts: [] },
  intake: { currentStep: 1, stack: {} },
  repository: { currentBranch: 'main', branches: [], commits: [] },
  pullRequests: { list: [], selectedPR: null, filter: 'open' },
  provenance: { traces: [] },
  approvals: { queue: [], history: [] },
  projects: { list: [] },
  incidents: { active: [], resolved: [] },
  featureFlags: { flags: [] },
  secrets: { envVars: [], apiKeys: [] },
  collaboration: { threads: [] },
  analytics: { costByAgent: [], costByTask: [] },
  intelligence: { dependencies: { nodes: [], edges: [] }, symbols: [] },
  settings: {},
  appearance: {},
  notifications: { items: [] },
  llm: {},
  decisions: [],

  // --- ACTIONS ---
  switchTab: (tabId) => set({ activeTab: tabId }),
  login: (payload) => set((state) => ({
    user: {
      ...state.user,
      isAuthenticated: true,
      username: payload.username || 'shinobi_guest',
      role: payload.role || 'Chunin',
      clan: payload.clan || 'Shadow Clan',
      avatar: payload.avatar || '◈',
    }
  })),
  logout: () => set({
    user: {
      isAuthenticated: false,
      username: '',
      role: '',
      clan: '',
      avatar: '',
    },
    activeTab: 'login',
  }),
  selectAgent: (agentId) => set({ selectedAgentId: agentId }),
  selectTask: (taskId) => set({ selectedTaskId: taskId }),
  updateSystemStatus: (status) => set({ systemStatus: status }),
  addLog: (agent, type, msg, time) => set((state) => {
    const log = { time: time || ts(), agent, type: type || 'info', msg };
    const logs = [...state.consoleLogs, log];
    if (logs.length > 500) logs.shift();
    return { consoleLogs: logs };
  }),
  clearLogs: () => set({ consoleLogs: [] }),
  updateSetting: (key, value) => set((state: any) => {
    if (key.includes('.')) {
      const parts = key.split('.');
      const newState = { ...state };
      let current = newState;
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...current[parts[i]] };
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return newState;
    }
    return { [key]: value };
  }),
  updateAgentStatus: (agentId, status, currentTaskId) => set((state) => {
    const agents = { ...state.agents };
    if (agents[agentId]) {
      agents[agentId] = {
        ...agents[agentId],
        status,
        ...(currentTaskId !== undefined ? { currentTaskId } : {}),
      };
    }
    return { agents };
  }),
  updateTask: (taskId, updates) => set((state) => {
    const tasks = state.tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, ...updates };
      }
      return task;
    });
    return { tasks };
  }),
  resolveDecision: (decisionId, approved) => set((state) => {
    const decisions = state.decisions.map((d: any) => {
      if (d.id === decisionId) {
        return { ...d, status: approved ? 'decided' : 'overridden' };
      }
      return d;
    });
    return { decisions };
  }),
  initNewProject: (payload) => set((state) => {
    const agents = { ...state.agents };
    Object.keys(agents).forEach((k) => {
      agents[k] = {
        ...agents[k],
        status: 'idle',
        currentTaskId: null,
        cost: 0,
      };
    });
    if (agents.architect) {
      agents.architect.status = 'thinking';
      agents.architect.currentTaskId = payload.tasks[0]?.id || null;
    }
    
    return {
      activeProject: payload.projectTitle,
      accumulatedCost: 0.05,
      llmRequests: 10,
      autoFixes: 0,
      testCoverage: 0,
      tasks: payload.tasks,
      agents,
    };
  }),
  setRawState: (stateUpdate) => set((state) => ({ ...state, ...stateUpdate })),
});

export const dashboardStore = createStore<DashboardState>(
  __ENV__ === 'development'
    ? (devtools(storeCreator, { name: 'CodeWeaver Dashboard' }) as any)
    : storeCreator
);

export function useDashboardStore<T>(selector: (state: DashboardState) => T): T;
export function useDashboardStore(): DashboardState;
export function useDashboardStore<T>(selector?: (state: DashboardState) => T) {
  return useStore(dashboardStore, selector!);
}

