// Domain-specific Model Interfaces

export interface Agent {
  id: string;
  name: string;
  icon: string;
  role: string;
  status: string | 'coding' | 'idle' | 'thinking' | 'watching';
  objective: string;
  currentTaskId: string | null;
  route: string;
  ram: string;
  cost: number;
  skills: string[];
}

export interface Task {
  id: string;
  title: string;
  desc: string;
  status: string | 'backlog' | 'completed' | 'failed' | 'in_progress' | 'review';
  assignee: string;
  priority: number;
  complexity: string | 'complex' | 'medium' | 'simple';
  duration: string;
  attempts: string;
  tags: string[];
  deps: string[];
  progress?: number;
  output: string;
}

export interface DecisionAlternative {
  title: string;
  pros: string;
  cons: string;
}

export interface Decision {
  id: string;
  title: string;
  desc: string;
  status: string | 'decided' | 'proposed';
  decidedBy: string;
  confidence: number;
  rationale: string;
  alternatives: DecisionAlternative[];
  selectedAlternative: number;
}

export interface LogEntry {
  time: string;
  agent: string;
  type: string | 'error' | 'info' | 'success' | 'warning';
  msg: string;
}

export interface DeploymentEnvironment {
  id: string;
  name: string;
  url: string;
  status: string | 'healthy' | 'unhealthy';
  version: string;
  lastDeploy: string;
  healthScore: number;
  uptime: string;
}

export interface ReleaseHistoryItem {
  id: string;
  version: string;
  env: string;
  status: string | 'failed' | 'rolled_back' | 'success';
  deployedAt: string;
  deployedBy: string;
  changelog: string;
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  status: string | 'active' | 'inactive';
  lastRun: string;
  nextRun: string;
}

export interface Deployment {
  environments: DeploymentEnvironment[];
  releaseHistory: ReleaseHistoryItem[];
  cronJobs: CronJob[];
  deployInProgress: boolean;
  selectedEnvId: string;
}

export interface Reviewer {
  user: string;
  status: string | 'approved' | 'changes_requested' | 'commented';
}

export interface PRComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  type: string | 'general' | 'inline';
  file?: string;
  line?: number;
}

export interface PR {
  id: number;
  number: number;
  title: string;
  author: string;
  branch: string;
  base: string;
  status: string | 'closed' | 'merged' | 'open';
  createdAt: string;
  updatedAt: string;
  ciStatus: string | 'failing' | 'passing' | 'pending';
  reviewStatus: string | 'approved' | 'changes_requested' | 'pending';
  conflicts: boolean;
  additions: number;
  deletions: number;
  reviewers: Reviewer[];
  comments: number;
  labels: string[];
  commentsList: PRComment[];
}

export interface Trace {
  id: string;
  agentId: string;
  taskId: string;
  action: string;
  timestamp: string;
  duration: number; // in milliseconds
  prompt: string;
  model: string;
  temperature: number;
  tokens: {
    input: number;
    output: number;
  };
  toolsInvoked: Array<{
    tool: string;
    params: Record<string, unknown>;
  }>;
  memoryRetrieved: string[];
  filesChanged: string[];
  testsRun: string[];
  confidence: number;
  output: string;
  retryCount: number;
  cost: number;
}

export interface Approval {
  id: string;
  type: string | 'architecture' | 'deployment' | 'rollback' | 'security';
  title: string;
  requester: string;
  requestedAt: string;
  riskLevel: string | 'critical' | 'high' | 'low' | 'medium';
  affectedSystems: string[];
  description: string;
  changes: Record<string, unknown>;
  status: string | 'approved' | 'pending' | 'rejected';
  approvers: string[];
  deadline: string;
  autoApprove: boolean;
}
