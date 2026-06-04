// API Request and Response Type Definitions


// Generic responses
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown> | any;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// /api/v1/agents Endpoints
export interface AgentCreateRequest {
  name: string;
  role: string;
  icon?: string;
  status?: string;
  objective?: string;
  skills?: string[];
}

export interface AgentUpdateRequest {
  name?: string;
  role?: string;
  icon?: string;
  status?: string;
  objective?: string;
  skills?: string[];
  currentTaskId?: string | null;
}

export interface AgentMetricsResponse {
  tasksCompleted: number;
  successRate: number;
  avgResponseTime: number; // ms
  totalCost: string;
  uptime: string;
}

// /api/v1/tasks Endpoints
export interface TaskUpdateRequest {
  title?: string;
  desc?: string;
  status?: string;
  assignee?: string;
  priority?: number;
  complexity?: string;
  progress?: number;
  output?: string;
}

// /api/v1/logs Endpoints
export interface LogQueryRequest extends PaginationParams {
  agent?: string;
  type?: string;
}

// /api/v1/deployments Endpoints
export interface DeployRequest {
  envId: string;
  changelog?: string;
  version?: string;
}

export interface RollbackRequest {
  envId: string;
  targetVersion?: string;
}

// /api/v1/pull-requests Endpoints
export interface PRCreateRequest {
  title: string;
  branch: string;
  base: string;
  author: string;
  description?: string;
}

export interface PRReviewRequest {
  reviewer: string;
  status: 'approved' | 'changes_requested' | 'pending';
  comments: string;
}

export interface PRDiffResponse {
  files: Array<{
    path: string;
    additions: number;
    deletions: number;
    hunks: Array<{
      oldStart: number;
      oldLines: number;
      newStart: number;
      newLines: number;
      lines: Array<{
        type: 'context' | 'add' | 'delete';
        content: string;
        newLine?: number;
        oldLine?: number;
      }>;
    }>;
  }>;
}

// /api/v1/decisions Endpoints
export interface DecisionResolveRequest {
  decisionId: string;
  approved: boolean;
}

// /api/v1/security/scans Endpoints
export interface VulnerabilityPatchRequest {
  vulnId: string;
}

// /api/v1/projects Endpoints
export interface ProjectCreateRequest {
  name: string;
  description?: string;
  vcsConfig?: Record<string, any>;
}

export interface ProjectGenerateRequest {
  promptText: string;
  answersText?: string;
  vcsConfig?: Record<string, any>;
}

// /api/v1/settings Endpoints
export interface SettingsUpdateRequest {
  [key: string]: any;
}
