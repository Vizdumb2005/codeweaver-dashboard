// ============================================================
// CoNinja State Store — Single source of truth with subscriptions
// ============================================================

(function () {
  'use strict';

  // ── Initial State ──────────────────────────────────────────
  const initialState = {
    activeProject: 'TaskMaster Marketplace MVP',
    agentLoops: {},
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

    activeTab: 'login',
    user: {
      isAuthenticated: false,
      username: '',
      role: '',
      clan: '',
      avatar: '',
    },
    activeReportId: 'ab-cta',
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

    customSkills: [
      {
        id: 'vulnerability-audit',
        desc: 'Runs OWASP scans on repository',
        prompt: 'When a security scan is requested, run checksec and check npm audit findings.',
      },
      {
        id: 'markdown-builder',
        desc: 'Constructs GFM Markdown reports',
        prompt: 'When writing reports, use clean tables, GFM highlights, and alerts.',
      },
    ],

    mcpServers: [
      {
        id: 'filesystem',
        name: 'Filesystem MCP',
        command: 'node',
        args: 'dist/index.js',
        status: 'active',
        tools: ['read_file', 'write_file', 'list_dir'],
      },
      {
        id: 'git',
        name: 'Git MCP',
        command: 'git',
        args: 'status',
        status: 'active',
        tools: ['git_status', 'git_diff', 'git_commit'],
      },
      {
        id: 'sqlite',
        name: 'SQLite Database',
        command: 'node',
        args: 'server-sqlite/dist/index.js',
        status: 'active',
        tools: ['inspect_schema', 'run_migrations', 'execute_query'],
      },
      {
        id: 'github',
        name: 'GitHub Integration',
        command: 'npx',
        args: '-y @modelcontextprotocol/server-github',
        status: 'active',
        tools: ['get_pull_request', 'post_comment', 'merge_pull_request'],
      },
      {
        id: 'puppeteer',
        name: 'Puppeteer Browser',
        command: 'node',
        args: 'server-puppeteer/dist/index.js',
        status: 'active',
        tools: ['open_page', 'click_element', 'take_screenshot'],
      },
      {
        id: 'brave-search',
        name: 'Brave Search API',
        command: 'npx',
        args: '-y @modelcontextprotocol/server-brave-search',
        status: 'active',
        tools: ['web_search', 'retrieve_url'],
      },
    ],

    ragConfig: [
      { name: 'coNinja_stealth_protocol.md', size: '12 KB', status: 'Indexed', chunks: 24 },
      { name: 'shinobi_hashing_standards.txt', size: '8 KB', status: 'Indexed', chunks: 16 },
    ],

    availableLocalModels: [
      'Ollama: Llama-3.1-8B',
      'Ollama: Qwen-2.5-Coder-7B',
      'Ollama: Mistral-7B',
      'Ollama: DeepSeek-Coder-6.7B',
      'Gemini 3.5 Flash',
      'Gemini 1.5 Pro',
    ],

    agentPrompts: {
      orchestrator:
        'You are the coNinja orchestrator (Sensei). Your task is to delegate subtasks, coordinate VRAM loading, and arbitrate code conflicts.',
      architect:
        'You are the Grandmaster (Architect). You create blueprints, schemas, and design guidelines for code tasks.',
      coder:
        'You are the Jutsu Coder. You write high-quality, typed, modular code adhering to the architecture specs.',
      tester:
        'You are the Kunai Tester. You write comprehensive tests and debug test failures with precision.',
      security:
        'You are the Stealth Auditor. You scan all commits for security leaks, vulnerabilities, and CVEs.',
    },

    selectedAgentId: 'orchestrator',
    selectedTaskId: null,
    taskSearchQuery: '',
    streamLogs: true,
    logFilterAgent: 'all',
    logSearchQuery: '',

    agents: {
      orchestrator: {
        id: 'orchestrator',
        name: 'Sensei (Orch)',
        icon: 'orchestrator',
        role: 'orchestrator',
        status: 'thinking',
        objective:
          'Directing the mission roadmap, arbitrating debates, and compiling progress scrolls.',
        currentTaskId: null,
        route: 'Gemini 3.5 Flash',
        ram: '0.2 GB (Cloud)',
        cost: 0.52,
        skills: [
          'task-scheduling',
          'peer-arbitration',
          'performance-auditing',
          'workflow-management',
        ],
      },
      pm: {
        id: 'pm',
        name: 'Recon Shinobi',
        icon: 'pm',
        role: 'product_manager',
        status: 'idle',
        objective: 'Gathering requirement specifications and drafting the primary mission scope.',
        currentTaskId: null,
        route: 'Gemini 3.5 Flash',
        ram: '0.0 GB (Cloud)',
        cost: 0.15,
        skills: [
          'requirement-analysis',
          'user-story-writing',
          'scope-definition',
          'clarification-polling',
        ],
      },
      architect: {
        id: 'architect',
        name: 'Grandmaster (Arch)',
        icon: 'architect',
        role: 'architect',
        status: 'idle',
        objective: 'Architecting code property blueprints, database relations, and system specs.',
        currentTaskId: null,
        route: 'Gemini 3.5 Flash',
        ram: '0.0 GB (Cloud)',
        cost: 0.34,
        skills: ['database-design', 'systems-architecture', 'adr-authoring', 'uml-generation'],
      },
      coder1: {
        id: 'coder1',
        name: 'Jutsu Coder (BE)',
        icon: 'coder',
        role: 'coder',
        status: 'coding',
        objective: 'Writing backend server services, database models, and API endpoints.',
        currentTaskId: 'task-04',
        route: 'Ollama: Llama-3.1-8B',
        ram: '5.4 GB VRAM',
        cost: 0.12,
        skills: ['api-routing', 'sql-queries', 'typescript', 'dependency-binding'],
      },
      coder2: {
        id: 'coder2',
        name: 'Genjutsu Coder (FE)',
        icon: 'coder',
        role: 'coder',
        status: 'idle',
        objective: 'Creating front-facing UI flows, glassmorphism layouts, and state stores.',
        currentTaskId: null,
        route: 'Ollama: Llama-3.1-8B',
        ram: '0.0 GB VRAM',
        cost: 0.08,
        skills: ['html5-css3', 'vanilla-js', 'responsive-layouts', 'component-scaffolding'],
      },
      tester: {
        id: 'tester',
        name: 'Kunai Tester',
        icon: 'tester',
        role: 'tester',
        status: 'coding',
        objective: 'Executing test runner assertions to confirm code files pass quality gates.',
        currentTaskId: 'task-05',
        route: 'Ollama: Mistral-7B',
        ram: '4.8 GB VRAM',
        cost: 0.09,
        skills: ['unit-testing', 'jest-mocha', 'regression-audits', 'mock-generation'],
      },
      security: {
        id: 'security',
        name: 'Stealth Auditor',
        icon: 'security',
        role: 'security',
        status: 'idle',
        objective:
          'Conducting continuous vulnerability scans, secret leak assessments, and supply checks.',
        currentTaskId: null,
        route: 'Ollama: Llama-3.1-8B',
        ram: '0.0 GB VRAM',
        cost: 0.06,
        skills: [
          'vulnerability-scans',
          'secret-detection',
          'owasp-auditing',
          'dependency-cve-checks',
        ],
      },
      devops: {
        id: 'devops',
        name: 'Chunin DevOps',
        icon: 'devops',
        role: 'devops',
        status: 'idle',
        objective:
          'Configuring Docker container setups, compiling pipelines, and triggering production releases.',
        currentTaskId: null,
        route: 'Gemini 3.5 Flash',
        ram: '0.0 GB (Cloud)',
        cost: 0.04,
        skills: ['docker-compose', 'nginx-configurations', 'ci-cd-pipelines', 'cloud-deployment'],
      },
      documentation: {
        id: 'documentation',
        name: 'Scroll Keeper',
        icon: 'documentation',
        role: 'documentation',
        status: 'idle',
        objective: 'Writing inline explanations and maintaining code documentations in sync.',
        currentTaskId: null,
        route: 'Ollama: Llama-3.1-8B',
        ram: '0.0 GB VRAM',
        cost: 0.01,
        skills: [
          'markdown-authoring',
          'jsdoc-extraction',
          'changelog-updates',
          'readme-generation',
        ],
      },
      performance: {
        id: 'performance',
        name: 'Taijutsu Engineer',
        icon: 'performance',
        role: 'performance',
        status: 'idle',
        objective:
          'Optimizing request speeds, analyzing O(N) constraints, and recommending cache relays.',
        currentTaskId: null,
        route: 'Ollama: Mistral-7B',
        ram: '0.0 GB VRAM',
        cost: 0.01,
        skills: ['runtime-profiling', 'big-o-analysis', 'cache-optimization', 'query-tuning'],
      },
      hunter: {
        id: 'hunter',
        name: 'Stealth Scout (Hunter)',
        icon: 'hunter',
        role: 'security',
        status: 'watching',
        objective: 'Monitoring Sentry error logs and production telemetry for runtime exceptions.',
        currentTaskId: null,
        route: 'Gemini 3.5 Flash',
        ram: '0.2 GB (Cloud)',
        cost: 0.18,
        skills: ['log-parsing', 'stacktrace-diagnosis', 'anomaly-detection', 'incident-dispatch'],
      },
      updater: {
        id: 'updater',
        name: 'Debt Chunin (Updater)',
        icon: 'updater',
        role: 'devops',
        status: 'idle',
        objective:
          'Running scheduled weekly cron-sweeps to identify outdated packages and automate PR bump validation.',
        currentTaskId: null,
        route: 'Gemini 3.5 Flash',
        ram: '0.0 GB (Cloud)',
        cost: 0.22,
        skills: [
          'dependency-auditing',
          'semver-resolution',
          'regression-testing',
          'auto-pr-creation',
        ],
      },
    },

    tasks: [
      {
        id: 'task-01',
        title: 'Design Database Schema',
        desc: 'Architect the entity relational schemas for users, workspace nodes, task lines, and transaction logs. Detail indices for foreign key constraints.',
        status: 'completed',
        assignee: 'architect',
        priority: 5,
        complexity: 'complex',
        duration: '24 min elapsed',
        attempts: '1 / 3',
        tags: ['#architecture', '#db'],
        deps: [],
        output:
          '[DB Spec Compiled]\nEntities: user, task, decision, workspace\nRelations: user HAS_MANY tasks, workspace CONTAINS tasks\nIndices: Created index idx_tasks_user_id on tasks(user_id)',
      },
      {
        id: 'task-02',
        title: 'Verify Hashing Security',
        desc: 'Perform static review of password hashing wrappers. Ensure bcrypt utilizes a strength factor >= 12, and check for secret leaks in salt environments.',
        status: 'completed',
        assignee: 'security',
        priority: 5,
        complexity: 'medium',
        duration: '8 min elapsed',
        attempts: '1 / 3',
        tags: ['#security', '#auth'],
        deps: ['task-01'],
        output:
          '[Security Audit Success]\nScanned: src/utils/auth.ts\nFound: bcrypt.hash(pwd, 12) used.\nResult: Code conforms to OWASP cryptograph guidelines. Secret scanners reported 0 indicators.',
      },
      {
        id: 'task-03',
        title: 'Create User & Session Models',
        desc: 'Implement database mapping entities for user authentication states. Write session token serializers and JWT validation handlers.',
        status: 'completed',
        assignee: 'coder2',
        priority: 4,
        complexity: 'medium',
        duration: '18 min elapsed',
        attempts: '1 / 3',
        tags: ['#backend', '#auth'],
        deps: ['task-01', 'task-02'],
        output:
          '[Models Completed]\nWritten: src/models/User.ts, src/models/Session.ts\nTests: Manual verify check pass.',
      },
      {
        id: 'task-04',
        title: 'Create Email Service Module',
        desc: 'Implement email service logic using Nodemailer. Support SMTP server parameters with a fallback for mock console log templates.',
        status: 'in_progress',
        assignee: 'coder1',
        priority: 4,
        complexity: 'medium',
        duration: '12 min elapsed',
        attempts: '1 / 3',
        tags: ['#backend', '#notifications'],
        deps: ['task-03'],
        progress: 45,
        output: '',
      },
      {
        id: 'task-05',
        title: 'Write User Auth Integration Tests',
        desc: 'Write testing scripts targeting login, validation, and token refresh endpoints. Verify invalid logins throw 401 statuses.',
        status: 'review',
        assignee: 'tester',
        priority: 4,
        complexity: 'medium',
        duration: '14 min elapsed',
        attempts: '1 / 3',
        tags: ['#testing', '#auth'],
        deps: ['task-03'],
        output:
          '[Test Run Running]\nExecuting jest integration/auth.test.ts...\nTests: 6 passed, 2 executing...',
      },
      {
        id: 'task-06',
        title: 'Setup Docker Compose',
        desc: 'Draft multi-stage Dockerfiles for node application services. Write compose files linking database service, redis cache, and backend app container.',
        status: 'backlog',
        assignee: 'devops',
        priority: 3,
        complexity: 'medium',
        duration: 'Pending prerequisite',
        attempts: '0 / 3',
        tags: ['#devops', '#docker'],
        deps: ['task-04'],
        output: '',
      },
      {
        id: 'task-07',
        title: 'Generate API Documentation',
        desc: 'Extract JSDoc declarations from Express controller files to output OpenAPI v3 JSON endpoints map. Configure Swagger UI handler.',
        status: 'backlog',
        assignee: 'documentation',
        priority: 2,
        complexity: 'simple',
        duration: 'Pending prerequisite',
        attempts: '0 / 3',
        tags: ['#docs', '#swagger'],
        deps: ['task-04'],
        output: '',
      },
      {
        id: 'task-08',
        title: 'Run Performance Profiling',
        desc: 'Measure memory allocations and event loop lag on request spikes. Suggest indexing extensions for database query pathways.',
        status: 'backlog',
        assignee: 'performance',
        priority: 2,
        complexity: 'medium',
        duration: 'Pending prerequisite',
        attempts: '0 / 3',
        tags: ['#performance', '#profiling'],
        deps: ['task-04'],
        output: '',
      },
    ],

    decisions: [
      {
        id: 'decision-01',
        title: 'SMTP Local Server vs SendGrid Integration for Email Alerts',
        desc: 'Determine transaction transit routing for workspace email alerts. Local Nodemailer is completely free, whereas SendGrid offers dedicated delivery tunnels but charges subscription tiers.',
        status: 'proposed',
        decidedBy: 'architect',
        confidence: 87,
        rationale:
          'We should prioritize Nodemailer with SMTP configuration parameters for local sandbox operations. This removes third-party account credential bottlenecks during initial implementation. The email service will use an interface, letting us switch to SendGrid by swapping environmental variables later.',
        alternatives: [
          {
            title: 'Nodemailer (SMTP Local Configuration)',
            pros: 'Zero operational costs. Works offline within isolated local testing sandboxes.',
            cons: 'Low inbox delivery rates in production without manual reverse-DNS/DKIM setups.',
          },
          {
            title: 'SendGrid Web API Integration',
            pros: '99% deliverability rates. Includes delivery diagnostics and HTML template design features.',
            cons: 'Requires payment accounts, API token configurations, and fails offline.',
          },
        ],
        selectedAlternative: 0,
      },
      {
        id: 'decision-02',
        title: 'Primary Relational Storage Selection: SQLite vs PostgreSQL',
        desc: 'Select the database engine for user accounts, workspace configurations, and task timelines.',
        status: 'decided',
        decidedBy: 'architect',
        confidence: 92,
        rationale:
          'PostgreSQL chosen because task assignments, subteams, and graph indices require parallel transactional writes and relational constraints that SQLite handles poorly.',
        alternatives: [
          {
            title: 'SQLite Database',
            pros: 'Embedded file-based configuration. Extremely fast for read-only local structures.',
            cons: 'Locks database tables during concurrent writes. Lacks robust production scaling.',
          },
          {
            title: 'PostgreSQL Instance',
            pros: 'Full transactional isolation, JSONB index support, and concurrent writing capabilities.',
            cons: 'Requires external docker environment setups and configuration overhead.',
          },
        ],
        selectedAlternative: 1,
      },
    ],

    consoleLogs: [
      {
        time: '15:40:01',
        agent: 'system',
        type: 'info',
        msg: 'coNinja Shadow Swarm initialized successfully.',
      },
      {
        time: '15:40:03',
        agent: 'pm',
        type: 'info',
        msg: 'Mission parameters scoped by Recon Shinobi. Commenced requirement questionnaire...',
      },
      {
        time: '15:40:45',
        agent: 'pm',
        type: 'info',
        msg: 'Compiled Mission Scroll (PRD). Transmitted to Grandmaster.',
      },
      {
        time: '15:41:00',
        agent: 'architect',
        type: 'info',
        msg: 'Grandmaster initiated strategy research. Querying local code scrolls...',
      },
      {
        time: '15:41:20',
        agent: 'architect',
        type: 'info',
        msg: 'Grandmaster triggered debate: SQLite vs PostgreSQL. Weighting parameters...',
      },
      {
        time: '15:42:05',
        agent: 'orchestrator',
        type: 'success',
        msg: 'Decision approved: Primary Storage -> PostgreSQL.',
      },
      {
        time: '15:42:15',
        agent: 'architect',
        type: 'info',
        msg: 'Database blueprint compiled: outputting entity mapping scrolls.',
      },
      {
        time: '15:42:30',
        agent: 'orchestrator',
        type: 'info',
        msg: 'Sensei dispatched Scroll #01 (Design Database Schema) to Grandmaster.',
      },
      {
        time: '15:43:10',
        agent: 'orchestrator',
        type: 'info',
        msg: 'Sensei dispatched Scroll #02 (Verify Hashing Security) to Stealth Auditor.',
      },
      {
        time: '15:44:02',
        agent: 'architect',
        type: 'success',
        msg: 'Scroll #01 completed. Database schema blueprint saved to /docs/db-schema.md.',
      },
      {
        time: '15:44:15',
        agent: 'security',
        type: 'info',
        msg: 'Stealth Auditor scanning cryptography buffers for password leaks...',
      },
      {
        time: '15:44:30',
        agent: 'security',
        type: 'success',
        msg: 'Scroll #02 completed. Cryptographic parameters verified.',
      },
      {
        time: '15:45:00',
        agent: 'orchestrator',
        type: 'info',
        msg: 'Sensei dispatched Scroll #03 (Create User & Session Models) to Genjutsu Coder.',
      },
      {
        time: '15:45:10',
        agent: 'coder',
        type: 'info',
        msg: 'Genjutsu Coder: Writing code logic in src/models/User.ts...',
      },
      {
        time: '15:46:12',
        agent: 'coder',
        type: 'success',
        msg: 'Scroll #03 completed. Session models compiled and verified.',
      },
      {
        time: '15:47:00',
        agent: 'orchestrator',
        type: 'info',
        msg: 'Sensei dispatched Scroll #04 (Create Email Service Module) to Jutsu Coder.',
      },
      {
        time: '15:47:05',
        agent: 'orchestrator',
        type: 'info',
        msg: 'Sensei dispatched Scroll #05 (Write User Auth Integration Tests) to Kunai Tester.',
      },
      {
        time: '15:47:15',
        agent: 'coder',
        type: 'info',
        msg: 'Jutsu Coder: Implementation started on Nodemailer SMTP wrapper...',
      },
      {
        time: '15:47:20',
        agent: 'tester',
        type: 'info',
        msg: 'Kunai Tester: Compiling mock authentication specs...',
      },
    ],

    agentStudio: {
      selectedAgentId: null,
      viewMode: 'grid', // 'grid' | 'list'
      filterRole: 'all',
      filterStatus: 'all',
      agents: [], // will be populated from window.state.agents
    },

    workflow: {
      stages: [
        {
          id: 'intake',
          name: 'Mission Intake',
          color: '#ff7300',
          tasks: [],
          approvalRequired: false,
        },
        {
          id: 'design',
          name: 'Architecture Design',
          color: '#9C27B0',
          tasks: [],
          approvalRequired: true,
        },
        {
          id: 'implementation',
          name: 'Implementation',
          color: '#00BCD4',
          tasks: [],
          approvalRequired: false,
        },
        {
          id: 'testing',
          name: 'Quality Gates',
          color: '#FFB300',
          tasks: [],
          approvalRequired: true,
        },
        {
          id: 'security',
          name: 'Security Review',
          color: '#ef4444',
          tasks: [],
          approvalRequired: true,
        },
        {
          id: 'deployment',
          name: 'Shadow Strike',
          color: '#4CAF50',
          tasks: [],
          approvalRequired: true,
        },
      ],
      dependencies: [
        { from: 'intake', to: 'design' },
        { from: 'design', to: 'implementation' },
        { from: 'implementation', to: 'testing' },
        { from: 'testing', to: 'security' },
        { from: 'security', to: 'deployment' },
      ],
      activeWorkflowId: null,
      autonomyPolicy: 'advisory',
      retryStrategy: { maxRetries: 3, backoffMs: 1000 },
      rollbackEnabled: true,
      autoPromote: true,
      enableRollback: true,
      maxRetries: 3,
      backoffMultiplier: 2,
    },

    debate: {
      sessions: [
        {
          id: 'debate-001',
          title: 'Database Engine Selection',
          status: 'decided',
          createdAt: '2026-05-29T10:00:00Z',
          decidedAt: '2026-05-29T10:30:00Z',
          criteria: [
            { id: 'c1', name: 'Performance', weight: 0.3 },
            { id: 'c2', name: 'Cost', weight: 0.25 },
            { id: 'c3', name: 'Scalability', weight: 0.25 },
            { id: 'c4', name: 'Ease of Use', weight: 0.2 },
          ],
          alternatives: [
            { id: 'a1', title: 'PostgreSQL', scores: { c1: 85, c2: 70, c3: 90, c4: 75 } },
            { id: 'a2', title: 'SQLite', scores: { c1: 65, c2: 95, c3: 40, c4: 95 } },
            { id: 'a3', title: 'MongoDB', scores: { c1: 80, c2: 60, c3: 85, c4: 70 } },
          ],
          winnerId: 'a1',
          rationale:
            'PostgreSQL wins on weighted score (83.25) due to superior scalability and performance.',
          adrGenerated: true,
          dissentingViews:
            'Stealth Auditor noted SQLite is safer for initial MVP due to zero-config nature.',
          humanOverride: false,
        },
      ],
      activeSessionId: null,
      newAlternativeForm: { title: '', scores: {} },
      autoADR: true,
      humanOverride: false,
      confidenceThreshold: 75,
    },

    memory: {
      vectorSettings: {
        engine: 'chroma',
        embeddingModel: 'all-minilm',
        chunkSize: 500,
        chunkOverlap: 50,
        similarityThreshold: 0.75,
      },
      graphSettings: {
        nodeTypes: ['file', 'function', 'class', 'module', 'schema'],
        maxDepth: 5,
        traversalMode: 'bfs',
      },
      retentionRules: [
        { id: 'r1', name: 'Hot Memory', maxAge: '7d', priority: 'high', auto: true },
        { id: 'r2', name: 'Warm Archive', maxAge: '30d', priority: 'medium', auto: true },
        { id: 'r3', name: 'Cold Vault', maxAge: '365d', priority: 'low', auto: false },
      ],
      pinnedEntries: [
        {
          id: 'm1',
          content: 'PostgreSQL chosen as primary DB. Schema: users, tasks, decisions, workspaces.',
          pinned: true,
          created: '2026-05-29',
          tags: ['#db', '#architecture'],
        },
        {
          id: 'm2',
          content:
            'Nodemailer SMTP for local email testing. Interface pattern allows swapping to SendGrid.',
          pinned: true,
          created: '2026-05-29',
          tags: ['#email', '#backend'],
        },
      ],
      searchResults: [],
      searchQuery: '',
      impactAnalysis: null,
      totalEntries: 1247,
      indexedFiles: 48,
    },

    testing: {
      suites: [
        {
          id: 'ts-01',
          name: 'Auth Integration Tests',
          status: 'running',
          total: 12,
          passed: 8,
          failed: 2,
          skipped: 2,
          coverage: 82,
          duration: '14.3s',
          file: 'integration/auth.test.ts',
        },
        {
          id: 'ts-02',
          name: 'User Model Unit Tests',
          status: 'passed',
          total: 24,
          passed: 24,
          failed: 0,
          skipped: 0,
          coverage: 96,
          duration: '3.2s',
          file: 'unit/user.test.ts',
        },
        {
          id: 'ts-03',
          name: 'Email Service Tests',
          status: 'pending',
          total: 8,
          passed: 0,
          failed: 0,
          skipped: 8,
          coverage: 0,
          duration: '-',
          file: 'unit/email.test.ts',
        },
        {
          id: 'ts-04',
          name: 'API Endpoint Tests',
          status: 'failed',
          total: 18,
          passed: 14,
          failed: 4,
          skipped: 0,
          coverage: 71,
          duration: '8.7s',
          file: 'integration/api.test.ts',
        },
      ],
      overallCoverage: 84.2,
      coverageThreshold: 80,
      mutationScore: 67.4,
      lintErrors: [
        {
          id: 'l1',
          file: 'src/api/search.ts',
          line: 47,
          rule: 'no-unsanitized-input',
          severity: 'warning',
          message: 'Unescaped user input passed to query builder',
        },
        {
          id: 'l2',
          file: 'src/utils/jwt.ts',
          line: 12,
          rule: 'prefer-const',
          severity: 'info',
          message: 'Variable could be declared as const',
        },
      ],
      selectedSuiteId: 'ts-01',
      runnerStatus: 'running',
      lastRunAt: '2026-05-29T15:47:00Z',
    },

    security: {
      score: 87,
      lastScanAt: '2026-05-29T15:00:00Z',
      scanStatus: 'idle',
      vulnerabilities: [
        {
          id: 'v1',
          cve: 'CVE-2022-24999',
          package: 'qs',
          version: '6.5.2',
          severity: 'high',
          fixAvailable: '6.11.0',
          description: 'Prototype pollution via merge function',
          status: 'open',
        },
        {
          id: 'v2',
          cve: 'GHSA-jchw-25xp-jwwc',
          package: 'jsonwebtoken',
          version: '8.5.1',
          severity: 'medium',
          fixAvailable: '9.0.0',
          description: 'Algorithm confusion vulnerability',
          status: 'open',
        },
        {
          id: 'v3',
          cve: 'CVE-2023-45133',
          package: '@babel/traverse',
          version: '7.21.4',
          severity: 'critical',
          fixAvailable: '7.23.2',
          description: 'Code injection via malformed AST',
          status: 'patched',
        },
      ],
      secretScan: {
        status: 'clean',
        scannedFiles: 48,
        scannedLines: 1240,
        findings: [],
        lastScan: '2026-05-29T15:00:00Z',
      },
      dependencyAudit: {
        total: 142,
        vulnerable: 3,
        outdated: 8,
        lastAudit: '2026-05-29T14:30:00Z',
      },
      blockOnCritical: true,
      approvalPending: false,
    },

    deployment: {
      environments: [
        {
          id: 'staging',
          name: 'Staging Dojo',
          url: 'https://staging.coninja-app.dev',
          status: 'healthy',
          version: 'v0.4.2',
          lastDeploy: '2026-05-29T12:00:00Z',
          healthScore: 98,
          uptime: '99.7%',
        },
        {
          id: 'production',
          name: 'Production Shadow',
          url: 'https://coninja-app.dev',
          status: 'healthy',
          version: 'v0.4.1',
          lastDeploy: '2026-05-28T22:00:00Z',
          healthScore: 100,
          uptime: '99.99%',
        },
      ],
      releaseHistory: [
        {
          id: 'rel-001',
          version: 'v0.4.2',
          env: 'staging',
          status: 'success',
          deployedAt: '2026-05-29T12:00:00Z',
          deployedBy: 'Chunin DevOps',
          changelog: 'Auth module + email service integration',
        },
        {
          id: 'rel-002',
          version: 'v0.4.1',
          env: 'production',
          status: 'success',
          deployedAt: '2026-05-28T22:00:00Z',
          deployedBy: 'Chunin DevOps',
          changelog: 'Database schema v2, bcrypt upgrade',
        },
        {
          id: 'rel-003',
          version: 'v0.4.0',
          env: 'production',
          status: 'rolled_back',
          deployedAt: '2026-05-27T18:00:00Z',
          deployedBy: 'Chunin DevOps',
          changelog: 'Initial full release',
        },
      ],
      cronJobs: [
        {
          id: 'cj-01',
          name: 'Dependency Sweep',
          schedule: '0 2 * * 1',
          status: 'active',
          lastRun: '2026-05-26T02:00:00Z',
          nextRun: '2026-06-02T02:00:00Z',
        },
        {
          id: 'cj-02',
          name: 'DB Backup',
          schedule: '0 3 * * *',
          status: 'active',
          lastRun: '2026-05-29T03:00:00Z',
          nextRun: '2026-05-30T03:00:00Z',
        },
      ],
      deployInProgress: false,
      selectedEnvId: 'staging',
    },

    monitoring: {
      health: {
        uptime: '99.97%',
        responseTime: 124,
        errorRate: 0.12,
        throughput: 842,
        cpuUsage: 34,
        memoryUsage: 62,
        activeConnections: 187,
      },
      costHistory: [
        { date: '2026-05-23', amount: 3.21 },
        { date: '2026-05-24', amount: 2.88 },
        { date: '2026-05-25', amount: 4.12 },
        { date: '2026-05-26', amount: 1.95 },
        { date: '2026-05-27', amount: 3.67 },
        { date: '2026-05-28', amount: 2.44 },
        { date: '2026-05-29', amount: 1.42 },
      ],
      errorLog: [
        {
          id: 'e1',
          timestamp: '2026-05-29T14:23:11Z',
          level: 'error',
          service: 'auth-service',
          message: 'JWT verification failed for token id: abc123',
          count: 3,
        },
        {
          id: 'e2',
          timestamp: '2026-05-29T13:01:44Z',
          level: 'warning',
          service: 'email-service',
          message: 'SMTP connection timeout, retry 1/3',
          count: 1,
        },
      ],
      alerts: [
        {
          id: 'al-01',
          name: 'Error Rate Spike',
          threshold: '> 1%',
          current: '0.12%',
          status: 'ok',
          channel: 'in-app',
        },
        {
          id: 'al-02',
          name: 'Response Time',
          threshold: '> 500ms',
          current: '124ms',
          status: 'ok',
          channel: 'in-app',
        },
        {
          id: 'al-03',
          name: 'Daily Budget',
          threshold: '> $4.00',
          current: '$1.42',
          status: 'ok',
          channel: 'in-app',
        },
      ],
      selectedRange: '7d',
    },

    backup: {
      snapshots: [
        {
          id: 'snap-001',
          name: 'Pre-Auth-Module Snapshot',
          created: '2026-05-29T11:00:00Z',
          size: '2.4 MB',
          type: 'auto',
          status: 'ready',
        },
        {
          id: 'snap-002',
          name: 'Daily Backup 2026-05-28',
          created: '2026-05-28T03:00:00Z',
          size: '2.1 MB',
          type: 'scheduled',
          status: 'ready',
        },
        {
          id: 'snap-003',
          name: 'Manual Save — Pre-Refactor',
          created: '2026-05-27T16:30:00Z',
          size: '1.9 MB',
          type: 'manual',
          status: 'ready',
        },
      ],
      exportInProgress: false,
      lastExport: null,
    },

    permissions: {
      roles: [
        {
          id: 'admin',
          name: 'Shadow Master',
          desc: 'Full control over all swarm operations',
          color: '#ff7300',
          members: 1,
        },
        {
          id: 'developer',
          name: 'Chunin Coder',
          desc: 'Can code, review and approve PRs. No deployment access.',
          color: '#9C27B0',
          members: 3,
        },
        {
          id: 'viewer',
          name: 'Scout Observer',
          desc: 'Read-only access to all screens and logs.',
          color: '#00BCD4',
          members: 5,
        },
      ],
      matrix: {
        admin: {
          canDeploy: true,
          canApprove: true,
          canOverride: true,
          canConfig: true,
          canView: true,
        },
        developer: {
          canDeploy: false,
          canApprove: true,
          canOverride: false,
          canConfig: false,
          canView: true,
        },
        viewer: {
          canDeploy: false,
          canApprove: false,
          canOverride: false,
          canConfig: false,
          canView: true,
        },
      },
    },

    appearance: {
      theme: 'dark',
      density: 'comfortable',
      motionEnabled: true,
      fontSize: 14,
      sidebarCollapsed: false,
      contrastMode: false,
      layoutPreset: 'default',
      accentColor: '#ff7300',
    },

    notifications: {
      items: [
        {
          id: 'n1',
          type: 'success',
          title: 'Task Completed',
          message: 'Design Database Schema completed by Grandmaster.',
          time: '15 min ago',
          read: false,
          action: 'view-task',
          actionId: 'task-01',
        },
        {
          id: 'n2',
          type: 'warning',
          title: 'Decision Pending',
          message: 'SMTP vs SendGrid requires your approval.',
          time: '32 min ago',
          read: false,
          action: 'view-decision',
          actionId: 'decision-01',
        },
        {
          id: 'n3',
          type: 'info',
          title: 'Security Scan Complete',
          message: 'OWASP scan passed. 2 advisories found.',
          time: '1 hr ago',
          read: true,
          action: 'view-security',
          actionId: null,
        },
        {
          id: 'n4',
          type: 'error',
          title: 'Test Suite Failed',
          message: 'API Endpoint Tests: 4 failures detected.',
          time: '2 hr ago',
          read: true,
          action: 'view-testing',
          actionId: 'ts-04',
        },
      ],
      taskComplete: true,
      decisions: true,
      security: true,
    },

    integrations: {
      github: { enabled: true, token: '••••••••', repo: 'org/coninja-app', webhookUrl: '' },
      slack: { enabled: false, webhookUrl: '', channel: '#dev-alerts' },
      jira: { enabled: false, apiKey: '', projectKey: '', baseUrl: '' },
      sentry: { enabled: true, dsn: 'https://abc@sentry.io/123', environment: 'production' },
      datadog: { enabled: false, apiKey: '', site: 'datadoghq.com' },
      vcs: { provider: null, localPath: '', branch: 'main', ignoreRules: '' },
    },

    project: {
      name: 'TaskMaster Marketplace MVP',
      description: 'A comprehensive task marketplace platform with real-time collaboration',
      timezone: 'UTC',
    },

    settings: {
      autosave: true,
      autosaveInterval: 30,
      confirmDestructive: true,
    },

    ui: {
      shortcuts: true,
    },

    llm: {
      circuitBreaker: true,
      failover: true,
      rateLimit: 60,
    },

    // === NEW: Repository & Code Review State ===
    repository: {
      currentBranch: 'main',
      branches: [
        {
          name: 'main',
          type: 'protected',
          ahead: 0,
          behind: 0,
          lastCommit: '2026-05-29T15:30:00Z',
          author: 'Chunin DevOps',
        },
        {
          name: 'feature/auth-module',
          type: 'feature',
          ahead: 12,
          behind: 3,
          lastCommit: '2026-05-29T14:20:00Z',
          author: 'Jutsu Coder',
        },
        {
          name: 'feature/email-service',
          type: 'feature',
          ahead: 8,
          behind: 2,
          lastCommit: '2026-05-29T13:45:00Z',
          author: 'Genjutsu Coder',
        },
        {
          name: 'hotfix/security-patch',
          type: 'hotfix',
          ahead: 3,
          behind: 0,
          lastCommit: '2026-05-29T12:10:00Z',
          author: 'Stealth Auditor',
        },
      ],
      commits: [
        {
          id: 'a1b2c3d',
          message: 'feat: implement JWT authentication middleware',
          author: 'Jutsu Coder',
          timestamp: '2026-05-29T15:30:00Z',
          branch: 'main',
          stats: { additions: 142, deletions: 23 },
        },
        {
          id: 'e4f5g6h',
          message: 'fix: resolve bcrypt hash strength configuration',
          author: 'Stealth Auditor',
          timestamp: '2026-05-29T15:15:00Z',
          branch: 'main',
          stats: { additions: 12, deletions: 8 },
        },
        {
          id: 'i7j8k9l',
          message: 'chore: update Docker compose with Redis cache',
          author: 'Chunin DevOps',
          timestamp: '2026-05-29T14:50:00Z',
          branch: 'main',
          stats: { additions: 34, deletions: 5 },
        },
        {
          id: 'm0n1o2p',
          message: 'feat: add email service with Nodemailer SMTP',
          author: 'Genjutsu Coder',
          timestamp: '2026-05-29T14:20:00Z',
          branch: 'feature/email-service',
          stats: { additions: 89, deletions: 0 },
        },
        {
          id: 'q3r4s5t',
          message: 'test: add integration tests for auth endpoints',
          author: 'Kunai Tester',
          timestamp: '2026-05-29T13:45:00Z',
          branch: 'main',
          stats: { additions: 156, deletions: 12 },
        },
      ],
      tags: [
        {
          name: 'v0.4.2',
          commit: 'a1b2c3d',
          created: '2026-05-29T12:00:00Z',
          message: 'Staging release with auth module',
        },
        {
          name: 'v0.4.1',
          commit: 'e4f5g6h',
          created: '2026-05-28T22:00:00Z',
          message: 'Production hotfix for bcrypt',
        },
        {
          name: 'v0.4.0',
          commit: 'i7j8k9l',
          created: '2026-05-27T18:00:00Z',
          message: 'Initial full release',
        },
      ],
      fileTree: [
        {
          path: 'src',
          type: 'folder',
          children: [
            {
              path: 'src/api',
              type: 'folder',
              children: [
                {
                  path: 'src/api/auth.ts',
                  type: 'file',
                  size: 2340,
                  lastModified: '2026-05-29T15:30:00Z',
                },
                {
                  path: 'src/api/users.ts',
                  type: 'file',
                  size: 1856,
                  lastModified: '2026-05-29T14:20:00Z',
                },
              ],
            },
            {
              path: 'src/models',
              type: 'folder',
              children: [
                {
                  path: 'src/models/User.ts',
                  type: 'file',
                  size: 1240,
                  lastModified: '2026-05-29T13:45:00Z',
                },
                {
                  path: 'src/models/Session.ts',
                  type: 'file',
                  size: 890,
                  lastModified: '2026-05-29T13:30:00Z',
                },
              ],
            },
            {
              path: 'src/services',
              type: 'folder',
              children: [
                {
                  path: 'src/services/email.ts',
                  type: 'file',
                  size: 1567,
                  lastModified: '2026-05-29T14:20:00Z',
                },
              ],
            },
          ],
        },
        {
          path: 'tests',
          type: 'folder',
          children: [
            {
              path: 'tests/integration',
              type: 'folder',
              children: [
                {
                  path: 'tests/integration/auth.test.ts',
                  type: 'file',
                  size: 3420,
                  lastModified: '2026-05-29T13:45:00Z',
                },
              ],
            },
          ],
        },
        {
          path: 'docs',
          type: 'folder',
          children: [
            {
              path: 'docs/db-schema.md',
              type: 'file',
              size: 2345,
              lastModified: '2026-05-29T12:00:00Z',
            },
          ],
        },
      ],
      blameData: {
        'src/models/User.ts': [
          { line: 1, commit: 'a1b2c3d', author: 'Jutsu Coder', timestamp: '2026-05-29T15:30:00Z' },
          { line: 2, commit: 'a1b2c3d', author: 'Jutsu Coder', timestamp: '2026-05-29T15:30:00Z' },
          {
            line: 3,
            commit: 'e4f5g6h',
            author: 'Stealth Auditor',
            timestamp: '2026-05-29T15:15:00Z',
          },
        ],
      },
      searchQuery: '',
      searchResults: [],
      selectedFile: null,
    },

    pullRequests: {
      list: [
        {
          id: 42,
          number: 42,
          title: 'Feat: Implement JWT authentication',
          author: 'Jutsu Coder',
          branch: 'feature/auth-module',
          base: 'main',
          status: 'open',
          createdAt: '2026-05-29T14:00:00Z',
          updatedAt: '2026-05-29T15:30:00Z',
          ciStatus: 'passing',
          reviewStatus: 'approved',
          conflicts: false,
          additions: 142,
          deletions: 23,
          reviewers: [
            { user: 'Stealth Auditor', status: 'approved' },
            { user: 'Kunai Tester', status: 'commented' },
          ],
          comments: 3,
          labels: ['feature', 'security'],
          commentsList: [
            {
              id: 'c1',
              author: 'Stealth Auditor',
              content: 'LGTM! Hashing algorithms are compliant with OWASP guidelines.',
              timestamp: '2026-05-29T15:00:00Z',
              type: 'general',
            },
            {
              id: 'c2',
              author: 'Kunai Tester',
              content: 'Should we add error handling here in case JWT signing fails?',
              timestamp: '2026-05-29T15:10:00Z',
              type: 'inline',
              file: 'src/api/auth.ts',
              line: 11,
            },
          ],
        },
        {
          id: 41,
          number: 41,
          title: 'Feat: Add email service module',
          author: 'Genjutsu Coder',
          branch: 'feature/email-service',
          base: 'main',
          status: 'open',
          createdAt: '2026-05-29T13:00:00Z',
          updatedAt: '2026-05-29T14:20:00Z',
          ciStatus: 'passing',
          reviewStatus: 'changes_requested',
          conflicts: true,
          additions: 89,
          deletions: 0,
          reviewers: [{ user: 'Grandmaster', status: 'changes_requested' }],
          comments: 5,
          labels: ['feature', 'backend'],
          commentsList: [
            {
              id: 'c3',
              author: 'Grandmaster',
              content:
                'Please review the connection timeout handling. 10s might be too low on high-latency SMTP servers.',
              timestamp: '2026-05-29T13:30:00Z',
              type: 'inline',
              file: 'src/services/email.ts',
              line: 6,
            },
          ],
        },
        {
          id: 40,
          number: 40,
          title: 'Hotfix: Bcrypt strength configuration',
          author: 'Stealth Auditor',
          branch: 'hotfix/security-patch',
          base: 'main',
          status: 'merged',
          createdAt: '2026-05-29T12:00:00Z',
          updatedAt: '2026-05-29T12:30:00Z',
          mergedAt: '2026-05-29T12:30:00Z',
          ciStatus: 'passing',
          reviewStatus: 'approved',
          conflicts: false,
          additions: 12,
          deletions: 8,
          reviewers: [{ user: 'Sensei', status: 'approved' }],
          comments: 1,
          labels: ['hotfix', 'security'],
          commentsList: [
            {
              id: 'c4',
              author: 'Sensei',
              content: 'Verified security patch fixes critical OWASP vulnerability.',
              timestamp: '2026-05-29T12:20:00Z',
              type: 'general',
            },
          ],
        },
      ],
      selectedPR: null,
      filter: 'open', // open, closed, merged, all
      sortBy: 'updated',
      diffView: 'split', // split, unified
      mergeQueue: [
        {
          id: 42,
          priority: 1,
          status: 'ready',
          checks: { ci: true, review: true, security: true },
        },
      ],
    },

    // === NEW: Provenance & Traceability State ===
    provenance: {
      traces: [
        {
          id: 'trace-001',
          agentId: 'coder1',
          taskId: 'task-04',
          action: 'code_generation',
          timestamp: '2026-05-29T15:30:00Z',
          duration: 14500,
          prompt: 'Implement Nodemailer SMTP email service with fallback configuration...',
          model: 'Ollama: Llama-3.1-8B',
          temperature: 0.2,
          tokens: { input: 450, output: 890 },
          toolsInvoked: [
            { tool: 'read_file', params: { path: 'src/config/smtp.json' } },
            { tool: 'write_file', params: { path: 'src/services/email.ts' } },
          ],
          memoryRetrieved: ['email-service-pattern', 'nodemailer-docs'],
          filesChanged: ['src/services/email.ts'],
          testsRun: [],
          confidence: 94,
          output: 'Successfully implemented email service...',
          retryCount: 0,
          cost: 0.04,
        },
        {
          id: 'trace-002',
          agentId: 'tester',
          taskId: 'task-05',
          action: 'test_execution',
          timestamp: '2026-05-29T15:25:00Z',
          duration: 8200,
          prompt: 'Run integration tests for auth endpoints...',
          model: 'Ollama: Mistral-7B',
          temperature: 0.1,
          tokens: { input: 120, output: 340 },
          toolsInvoked: [{ tool: 'execute_test', params: { suite: 'auth.integration' } }],
          memoryRetrieved: ['test-fixtures-auth'],
          filesChanged: [],
          testsRun: ['auth.login', 'auth.register', 'auth.refresh'],
          confidence: 98,
          output: '12 tests passed, 0 failed',
          retryCount: 0,
          cost: 0.02,
        },
      ],
      filters: { agent: 'all', action: 'all', dateRange: '7d' },
      selectedTrace: null,
    },

    // === NEW: Human Approval Governance State ===
    approvals: {
      queue: [
        {
          id: 'approval-001',
          type: 'deployment',
          title: 'Deploy v0.4.2 to Production',
          requester: 'Chunin DevOps',
          requestedAt: '2026-05-29T15:00:00Z',
          riskLevel: 'medium',
          affectedSystems: ['production-api', 'production-db'],
          description: 'Deploy auth module and email service to production',
          changes: { commits: 3, files: 12, additions: 142, deletions: 23 },
          status: 'pending',
          approvers: ['Shadow Master'],
          deadline: '2026-05-29T18:00:00Z',
          autoApprove: false,
        },
        {
          id: 'approval-002',
          type: 'security',
          title: 'Approve JWT Algorithm Switch',
          requester: 'Stealth Auditor',
          requestedAt: '2026-05-29T14:30:00Z',
          riskLevel: 'high',
          affectedSystems: ['auth-service'],
          description: 'Switch from RS256 to ES256 for improved performance',
          changes: { breaking: true, requiresDowntime: false },
          status: 'pending',
          approvers: ['Shadow Master', 'Grandmaster'],
          deadline: '2026-05-29T20:00:00Z',
          autoApprove: false,
        },
        {
          id: 'approval-004',
          type: 'architecture',
          title: 'PostgreSQL Schema Migration: Workspace Cascade',
          requester: 'Grandmaster (Arch)',
          requestedAt: '2026-05-29T16:10:00Z',
          riskLevel: 'high',
          affectedSystems: ['production-db', 'user-service'],
          description: 'Apply foreign key constraints with ON DELETE CASCADE to user workspaces.',
          changes: {
            table: 'workspaces',
            migrationFile: '20260529_workspace_cascade.sql',
            safetyIndex: 92,
          },
          status: 'pending',
          approvers: ['Grandmaster'],
          deadline: '2026-05-30T00:00:00Z',
          autoApprove: false,
        },
        {
          id: 'approval-005',
          type: 'rollback',
          title: 'Rollback v0.4.2 to v0.4.1',
          requester: 'Stealth Scout (Hunter)',
          requestedAt: '2026-05-29T16:15:00Z',
          riskLevel: 'critical',
          affectedSystems: ['production-api', 'auth-service'],
          description: 'Rollback due to 12% increase in token sign validation failures on staging.',
          changes: {
            fromVersion: 'v0.4.2',
            toVersion: 'v0.4.1',
            triggerReason: 'JWT verification failure spike',
          },
          status: 'pending',
          approvers: ['Shadow Master'],
          deadline: '2026-05-29T18:00:00Z',
          autoApprove: false,
        },
        {
          id: 'approval-006',
          type: 'model_switch',
          title: 'LLM Route Switch: Qwen-2.5-Coder to Gemini 1.5 Pro',
          requester: 'Sensei (Orch)',
          requestedAt: '2026-05-29T16:20:00Z',
          riskLevel: 'medium',
          affectedSystems: ['codegen-pipeline'],
          description:
            'Switch base coding LLM due to local context exhaustion on authentication templates.',
          changes: { oldProvider: 'Ollama: Qwen-2.5-Coder-7B', newProvider: 'Gemini 1.5 Pro' },
          status: 'pending',
          approvers: ['Sensei (Orch)'],
          deadline: '2026-05-30T04:00:00Z',
          autoApprove: false,
        },
      ],
      history: [
        {
          id: 'approval-003',
          type: 'cost',
          title: 'Increase Daily Budget to $10',
          requester: 'Sensei',
          requestedAt: '2026-05-29T14:00:00Z',
          riskLevel: 'low',
          affectedSystems: ['billing'],
          description: 'Project complexity requires additional LLM budget',
          changes: { oldLimit: 5.0, newLimit: 10.0 },
          status: 'approved',
          approvers: ['Shadow Master'],
          approvedBy: 'Shadow Master',
          approvedAt: '2026-05-29T14:15:00Z',
        },
      ],
      delegationRules: [
        { type: 'deployment', env: 'staging', autoApprove: true, maxRisk: 'low' },
        {
          type: 'deployment',
          env: 'production',
          autoApprove: false,
          requireApprovers: ['Shadow Master'],
        },
      ],
      myApprovals: [],
    },

    // === NEW: Multi-Project Workspace State ===
    projects: {
      list: [
        {
          id: 'proj-001',
          name: 'TaskMaster Marketplace',
          description: 'Task marketplace platform',
          status: 'active',
          health: 98,
          costToday: 1.42,
          costMonth: 45.23,
          lastActivity: '2026-05-29T15:30:00Z',
          tags: ['marketplace', 'production'],
          members: 4,
          starred: true,
        },
        {
          id: 'proj-002',
          name: 'Geodesic GPS Tracker',
          description: 'Offline-first GPS tracking app',
          status: 'active',
          health: 95,
          costToday: 0.89,
          costMonth: 23.45,
          lastActivity: '2026-05-28T12:00:00Z',
          tags: ['mobile', 'gps'],
          members: 2,
          starred: false,
        },
        {
          id: 'proj-003',
          name: 'Auth Microservice',
          description: 'Reusable authentication service',
          status: 'archived',
          health: 100,
          costToday: 0,
          costMonth: 0,
          lastActivity: '2026-05-20T10:00:00Z',
          tags: ['microservice', 'auth'],
          members: 1,
          starred: false,
        },
      ],
      current: 'proj-001',
      templates: [
        {
          id: 'tmpl-web',
          name: 'Full-Stack Web App',
          description: 'Next.js + Node.js + PostgreSQL',
          stack: ['nextjs', 'nodejs', 'postgres'],
        },
        {
          id: 'tmpl-api',
          name: 'API Service',
          description: 'Express + TypeScript + MongoDB',
          stack: ['express', 'typescript', 'mongodb'],
        },
        {
          id: 'tmpl-mobile',
          name: 'Mobile App',
          description: 'React Native + Firebase',
          stack: ['react-native', 'firebase'],
        },
      ],
      viewMode: 'grid', // grid, list
      filter: 'all', // all, active, archived, starred
    },

    // === NEW: Ops Recovery & Incident State ===
    incidents: {
      active: [
        {
          id: 'inc-001',
          title: 'Elevated API Error Rate',
          severity: 'medium',
          status: 'investigating',
          startedAt: '2026-05-29T14:00:00Z',
          affectedService: 'auth-service',
          symptoms: ['5xx errors increased to 2.3%'],
          impact: 'partial',
          assignedTo: 'Stealth Scout',
          timeline: [{ time: '2026-05-29T14:00:00Z', event: 'Alert triggered', type: 'alert' }],
        },
      ],
      resolved: [
        {
          id: 'inc-000',
          title: 'SMTP Timeout Errors',
          severity: 'low',
          status: 'resolved',
          startedAt: '2026-05-28T10:00:00Z',
          resolvedAt: '2026-05-28T11:30:00Z',
          resolution: 'Increased timeout to 30s',
          affectedService: 'email-service',
        },
      ],
      runbooks: [
        {
          id: 'rb-001',
          title: 'Database Connection Pool Exhaustion',
          steps: ['Check active connections', 'Scale pool size', 'Review slow queries'],
        },
        {
          id: 'rb-002',
          title: 'JWT Token Validation Failures',
          steps: ['Verify secret key', 'Check clock skew', 'Validate algorithm'],
        },
      ],
    },

    featureFlags: {
      flags: [
        {
          id: 'ff-001',
          name: 'new-auth-flow',
          description: 'New authentication UI flow',
          status: 'rolling',
          rollout: 25,
          environments: { staging: 100, production: 25 },
          rules: [{ type: 'user_group', value: 'beta_users' }],
        },
        {
          id: 'ff-002',
          name: 'dark-mode-default',
          description: 'Enable dark mode by default',
          status: 'enabled',
          rollout: 100,
          environments: { staging: 100, production: 100 },
        },
        {
          id: 'ff-003',
          name: 'experimental-cache',
          description: 'Redis caching layer',
          status: 'disabled',
          rollout: 0,
          environments: { staging: 0, production: 0 },
        },
      ],
    },

    secrets: {
      envVars: [
        {
          id: 'env-001',
          key: 'DATABASE_URL',
          value: '••••••••',
          scope: 'production',
          lastRotated: '2026-05-01T00:00:00Z',
        },
        {
          id: 'env-002',
          key: 'JWT_SECRET',
          value: '••••••••',
          scope: 'all',
          lastRotated: '2026-04-15T00:00:00Z',
        },
        {
          id: 'env-003',
          key: 'SMTP_HOST',
          value: 'smtp.example.com',
          scope: 'production',
          lastRotated: null,
        },
      ],
      apiKeys: [
        {
          id: 'key-001',
          name: 'SendGrid API',
          key: '••••••••SG.xxxx',
          lastUsed: '2026-05-29T15:00:00Z',
          expiresAt: '2026-12-31T00:00:00Z',
          status: 'active',
        },
        {
          id: 'key-002',
          name: 'Stripe API',
          key: '••••••••sk_live_',
          lastUsed: '2026-05-29T14:30:00Z',
          expiresAt: null,
          status: 'active',
        },
      ],
    },

    // === NEW: Collaboration & Handoff State ===
    collaboration: {
      threads: [
        {
          id: 'thread-001',
          type: 'agent-handoff',
          from: 'architect',
          to: 'coder1',
          taskId: 'task-04',
          createdAt: '2026-05-29T14:00:00Z',
          messages: [
            {
              from: 'architect',
              content: 'Database schema is ready. Note the email field has UNIQUE constraint.',
              timestamp: '2026-05-29T14:00:00Z',
            },
            {
              from: 'coder1',
              content: 'Got it. I\'ll implement the User model with proper validation.',
              timestamp: '2026-05-29T14:05:00Z',
            },
          ],
        },
        {
          id: 'thread-002',
          type: 'review',
          author: 'Grandmaster',
          prId: 41,
          createdAt: '2026-05-29T13:30:00Z',
          messages: [
            {
              from: 'Grandmaster',
              content: 'Consider adding rate limiting to the email endpoint.',
              timestamp: '2026-05-29T13:30:00Z',
            },
            {
              from: 'Genjutsu Coder',
              content: 'Good point. I\'ll add express-rate-limit middleware.',
              timestamp: '2026-05-29T13:45:00Z',
            },
          ],
        },
      ],
      teamActivity: [
        {
          id: 'act-001',
          user: 'Jutsu Coder',
          action: 'committed',
          target: 'feat: implement JWT auth',
          timestamp: '2026-05-29T15:30:00Z',
        },
        {
          id: 'act-002',
          user: 'Kunai Tester',
          action: 'approved',
          target: 'PR #42',
          timestamp: '2026-05-29T15:15:00Z',
        },
      ],
    },

    // === NEW: Analytics Dashboard State ===
    analytics: {
      costByAgent: [
        { agent: 'Sensei', cost: 12.45, tokens: 45000, requests: 234 },
        { agent: 'Jutsu Coder', cost: 8.23, tokens: 32000, requests: 156 },
        { agent: 'Kunai Tester', cost: 4.12, tokens: 18000, requests: 89 },
      ],
      costByTask: [
        { task: 'Design Database Schema', cost: 2.34, duration: '24m' },
        { task: 'Create Email Service', cost: 1.89, duration: '18m' },
      ],
      qualityTrends: [
        { date: '2026-05-23', testPassRate: 82, coverage: 78, bugs: 5 },
        { date: '2026-05-24', testPassRate: 85, coverage: 80, bugs: 3 },
        { date: '2026-05-25', testPassRate: 88, coverage: 82, bugs: 2 },
        { date: '2026-05-26', testPassRate: 86, coverage: 81, bugs: 4 },
        { date: '2026-05-27', testPassRate: 90, coverage: 83, bugs: 1 },
        { date: '2026-05-28', testPassRate: 92, coverage: 84, bugs: 1 },
        { date: '2026-05-29', testPassRate: 94, coverage: 85, bugs: 0 },
      ],
      mttr: { avg: 45, trend: 'improving', lastIncident: 30 },
      customDashboards: [],
    },

    // === NEW: Repository Intelligence State ===
    intelligence: {
      dependencies: {
        nodes: [
          { id: 'user-model', name: 'User Model', type: 'model', file: 'src/models/User.ts' },
          {
            id: 'auth-service',
            name: 'Auth Service',
            type: 'service',
            file: 'src/services/auth.ts',
          },
          {
            id: 'email-service',
            name: 'Email Service',
            type: 'service',
            file: 'src/services/email.ts',
          },
        ],
        edges: [
          { from: 'auth-service', to: 'user-model', type: 'uses' },
          { from: 'email-service', to: 'user-model', type: 'uses' },
        ],
      },
      symbols: [
        { name: 'User', type: 'class', file: 'src/models/User.ts', line: 12 },
        { name: 'authenticate', type: 'function', file: 'src/services/auth.ts', line: 45 },
      ],
      impactAnalysis: null,
      searchIndex: {
        files: [],
        symbols: [],
        contents: [],
      },
    },

    intake: {
      currentStep: 1,
      projectType: null,
      stack: { backend: null, frontend: null, database: null, auth: null, deployment: null },
      constraints: { budget: 5.0, timeline: '2 weeks', teamSize: 1 },
      description: '',
      pmQuestions: [],
      pmAnswers: '',
    },
  };

  // ── Store Implementation ──────────────────────────────────
  function createStore(initialData) {
    const state = JSON.parse(JSON.stringify(initialData));
    const listeners = [];

    return {
      getState() {
        return state;
      },

      setState(path, value) {
        if (path === null || path === undefined) return;
        const parts = String(path).split('.');
        let current = state;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        this.notify(path);
      },

      notify(path) {
        listeners.forEach((fn) => {
          try {
            fn(path, state);
          } catch (e) {
            console.warn('Store listener error:', e);
          }
        });
      },

      subscribe(fn) {
        listeners.push(fn);
        return () => {
          const idx = listeners.indexOf(fn);
          if (idx > -1) listeners.splice(idx, 1);
        };
      },
    };
  }

  const store = createStore(initialState);

  window.state = store.getState();
  window.store = store;

  // ── Log Helpers ───────────────────────────────────────────
  const ts = () => new Date().toTimeString().split(' ')[0];

  window.addLog = function (agent, type, msg, time) {
    const log = { time: time || ts(), agent: agent, type: type || 'info', msg: msg };
    window.state.consoleLogs.push(log);
    if (window.state.consoleLogs.length > 500) {
      window.state.consoleLogs.shift();
    }
    window.renderLogs();
  };

  window.getPersonaTone = function (temp) {
    if (temp <= 0.15) return 'Surgical';
    if (temp <= 0.35) return 'Analytical';
    if (temp <= 0.65) return 'Balanced';
    if (temp <= 0.95) return 'Expressive';
    if (temp <= 1.2) return 'Inventive';
    return 'Chaotic';
  };

  // ── SETTINGS UI SYNCHRONIZER ───────────────────────────────
  window.syncSettingsUI = function () {
    const s = window.state;
    document.querySelectorAll("input[name='autonomy-level-new']").forEach((radio) => {
      radio.checked = radio.value === s.autonomyLevel;
      const opt = radio.closest('.radio-option');
      if (opt) opt.classList.toggle('active', radio.checked);
    });
    document.querySelectorAll("input[name='autonomy-level']").forEach((radio) => {
      radio.checked = radio.value === s.autonomyLevel;
      const opt = radio.closest('.radio-option');
      if (opt) opt.classList.toggle('active', radio.checked);
    });

    const setSlider = (id, valId, getter, formatter) => {
      const el = document.getElementById(id);
      const valEl = valId ? document.getElementById(valId) : null;
      if (el && valEl) {
        el.value = getter(s);
        valEl.innerText = formatter ? formatter(getter(s)) : getter(s);
      }
    };
    setSlider(
      'daily-limit-slider',
      'daily-limit-val',
      (s) => s.dailyLimit,
      (v) => `$${v.toFixed(2)}`,
    );
    setSlider(
      'daily-limit-slider-new',
      'daily-limit-val-new',
      (s) => s.dailyLimit,
      (v) => `$${v.toFixed(2)}`,
    );
    setSlider(
      'alert-threshold-slider',
      'alert-threshold-val',
      (s) => Math.round(s.alertThreshold * 100),
      (v) => `${v}%`,
    );
    setSlider(
      'alert-threshold-slider-new',
      'alert-threshold-val-new',
      (s) => Math.round(s.alertThreshold * 100),
      (v) => `${v}%`,
    );
    setSlider(
      'settings-temp',
      'settings-temp-val',
      (s) => s.temperature,
      (v) => v.toFixed(2),
    );
    setSlider(
      'settings-context',
      'settings-context-val',
      (s) => s.contextLength,
      (v) => v,
    );

    document.querySelectorAll("input[name='tdd-stance']").forEach((radio) => {
      radio.checked = radio.value === s.tddStance;
      const opt = radio.closest('.radio-option');
      if (opt) opt.classList.toggle('active', radio.checked);
    });

    const setCheck = (id, checked) => {
      const el = document.getElementById(id);
      if (el) el.checked = checked;
    };
    setCheck('settings-mutation-toggle', s.mutationTesting);
    setCheck('settings-midnight-deploy', s.midnightDeploy);
    setCheck('settings-auto-rollback', s.autoRollback);
    setCheck('settings-aggressive-unload', s.aggressiveUnload);
    setCheck('settings-proxy-toggle', s.proxyEnabled);
    setCheck('settings-ssl-toggle', s.sslEnabled);
    setCheck('settings-watchdog-toggle', s.watchdogEnabled);

    const setSliderVal = (id, valId, val) => {
      const el = document.getElementById(id);
      const vEl = document.getElementById(valId);
      if (el) el.value = val;
      if (vEl)
        vEl.innerText = val + (typeof val === 'number' && id.includes('coverage') ? '%' : '');
    };
    setSliderVal('settings-coverage-gate', 'settings-coverage-gate-val', s.coverageGate);
    setSliderVal('settings-scroll-tokens', 'settings-scroll-tokens-val', s.scrollTokenLimit);
    setSliderVal('settings-release-chakra', 'settings-release-chakra-val', s.releaseChakra);
    setSliderVal('settings-max-models', 'settings-max-models-val', s.maxConcurrentModels);

    const setSelect = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setSelect('settings-memory-pruning', s.memoryPruning);
    setSelect('settings-idle-focus', s.idleFocus);
    setSelect('settings-sandbox-network', s.sandboxNetLevel);

    document.querySelectorAll("input[name='execution-seal']").forEach((radio) => {
      radio.checked = radio.value === s.executionSeal;
      const opt = radio.closest('.radio-option');
      if (opt) opt.classList.toggle('active', radio.checked);
    });

    const setInput = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setInput('settings-ast-limit', s.astEditLimit);
    setInput('settings-sandbox-dir', s.sandboxDir);

    ['quant-sensei', 'quant-coder', 'quant-tester'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        const role = id.split('-')[1];
        el.value = s.quantizationMatrix[role] || 'Q8_0';
      }
    });

    const personaSlider = document.getElementById('agent-persona-temp');
    const personaTempVal = document.getElementById('agent-persona-temp-val');
    const personaToneEl = document.getElementById('agent-persona-tone');
    if (personaSlider && personaTempVal && personaToneEl) {
      personaSlider.value = s.agentPersonaTemp;
      personaTempVal.innerText = s.agentPersonaTemp.toFixed(2);
      personaToneEl.innerText = window.getPersonaTone(s.agentPersonaTemp);
    }

    const proxyHostInput = document.getElementById('settings-proxy-host');
    if (proxyHostInput) proxyHostInput.disabled = !s.proxyEnabled;

    const hunterToggle = document.getElementById('settings-hunter-toggle');
    if (hunterToggle) hunterToggle.checked = s.agents.hunter.status === 'watching';

    const updaterToggle = document.getElementById('settings-updater-toggle');
    if (updaterToggle) updaterToggle.checked = s.agents.updater.status !== 'sleeping';
  };

  // ── METRICS RENDERING ──────────────────────────────────────
  // Note: renderMetrics function has been moved to ui.js with explicit guards against modifying brand h1

  // ── Store-backed Subscriptions ─────────────────────────────
  window.store.subscribe(function (path, state) {
    if (path === 'logFilterAgent' || path === 'logSearchQuery' || path === 'streamLogs') {
      window.renderLogs();
    }
  });

  // ── CENTRAL STATE DISPATCHER ──────────────────────────────
  window.dispatch = function (action, payload) {
    const tsVal = () => new Date().toTimeString().split(' ')[0];

    switch (action) {
      case 'SWITCH_TAB':
        window.state.activeTab = payload;
        window.switchTab(payload);
        break;

      case 'AUTH_LOGIN':
        window.state.user.isAuthenticated = true;
        window.state.user.username = payload.username || 'shinobi_guest';
        window.state.user.role = payload.role || 'Chunin';
        window.state.user.clan = payload.clan || 'Shadow Clan';
        window.state.user.avatar = payload.avatar || '◈';
        window.state.activeTab = 'swarm-graph';
        window.switchTab('swarm-graph');
        break;

      case 'AUTH_LOGOUT':
        window.state.user.isAuthenticated = false;
        window.state.user.username = '';
        window.state.user.role = '';
        window.state.user.clan = '';
        window.state.user.avatar = '';
        window.state.activeTab = 'login';
        window.switchTab('login');
        break;

      case 'SELECT_AGENT':
        window.state.selectedAgentId = payload;
        window.selectAgent(payload);
        break;

      case 'SELECT_TASK':
        window.state.selectedTaskId = payload;
        window.selectTask(payload);
        break;

      case 'UPDATE_SYSTEM_STATUS':
        window.state.systemStatus = payload;
        {
          const pauseBtn = document.getElementById('global-pause-btn');
          if (pauseBtn) {
            if (payload === 'paused') {
              pauseBtn.innerHTML =
                '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 10 C2 10 4 5 12 5 C20 5 22 10 22 10 C22 10 20 15 12 15 C4 15 2 10 2 10 Z"/><line x1="2" y1="10" x2="22" y2="10"/></svg>';
              pauseBtn.classList.remove('btn-outline');
              pauseBtn.classList.add('btn-purple');
              const ind = document.getElementById('system-status-indicator');
              if (ind) ind.className = 'status-indicator-pulse offline';
              const txt = document.getElementById('system-status-text');
              if (txt) txt.innerText = 'Swarm Hidden';
            } else {
              pauseBtn.innerHTML =
                '<svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 10 C2 10 4 5 12 5 C20 5 22 10 22 10 C22 10 20 15 12 15 C4 15 2 10 2 10 Z"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="12" cy="10" r="2" fill="currentColor"/></svg>';
              pauseBtn.classList.add('btn-outline');
              pauseBtn.classList.remove('btn-purple');
              const ind = document.getElementById('system-status-indicator');
              if (ind) ind.className = 'status-indicator-pulse online';
              const txt = document.getElementById('system-status-text');
              if (txt) txt.innerText = 'Swarm Active';
            }
          }
          window.addLog(
            'orchestrator',
            payload === 'paused' ? 'error' : 'success',
            payload === 'paused'
              ? 'Stealth shroud activated. HALTING all active shinobi threads.'
              : 'Stealth shroud deactivated. Resuming active shinobi missions.',
          );
        }
        break;

      case 'ADD_LOG':
        window.addLog(payload.agent, payload.type || 'info', payload.msg, payload.time);
        break;

      case 'CLEAR_LOGS':
        window.state.consoleLogs = [];
        window.renderLogs();
        break;

      case 'UPDATE_SETTING': {
        const { key, value } = payload;
        if (key.includes('.')) {
          const parts = key.split('.');
          let current = window.state;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = value;
        } else {
          window.state[key] = value;
        }
        window.syncSettingsUI();
        window.store.notify(key);
        break;
      }

      case 'UPDATE_AGENT_STATUS':
        if (window.state.agents[payload.agentId]) {
          window.state.agents[payload.agentId].status = payload.status;
          if (payload.currentTaskId !== undefined) {
            window.state.agents[payload.agentId].currentTaskId = payload.currentTaskId;
          }
          if (window.state.selectedAgentId === payload.agentId) {
            window.selectAgent(payload.agentId);
          }
        }
        break;

      case 'UPDATE_TASK': {
        const task = window.state.tasks.find((t) => t.id === payload.taskId);
        if (task) {
          Object.assign(task, payload.updates);
          window.renderKanban();
          if (window.state.selectedTaskId === payload.taskId) {
            window.selectTask(payload.taskId);
          }
          if (typeof window.workbenchInitialized !== 'undefined' && window.workbenchInitialized) {
            if (typeof window.renderChecklist === 'function') window.renderChecklist();
            if (typeof window.renderBrowserPreview === 'function') window.renderBrowserPreview();
          }
        }
        break;
      }

      case 'RESOLVE_DECISION': {
        const decision = window.state.decisions.find((d) => d.id === payload.decisionId);
        if (decision) {
          decision.status = payload.approved ? 'decided' : 'overridden';
          window.addLog(
            'orchestrator',
            payload.approved ? 'success' : 'error',
            `User ${payload.approved ? 'approved decree' : 'overrode decree'}: ${decision.title}. Option Enforced: ${decision.alternatives[decision.selectedAlternative].title}.`,
          );
          if (payload.decisionId === 'decision-01') {
            window.dispatch('UPDATE_TASK', {
              taskId: 'task-04',
              updates: {
                progress: 100,
                status: 'completed',
                output:
                  '[SMTP Module Configured]\\nService: Nodemailer\\nTransport: SMTP local proxy relay\\nPort: 1025\\nEncryption: TLS default SSL handshake pass.',
              },
            });
            setTimeout(() => window.triggerSmokePuff('task-04'), 100);
            window.dispatch('UPDATE_TASK', {
              taskId: 'task-06',
              updates: { status: 'in_progress', duration: 'Active: 2 min elapsed', progress: 10 },
            });
            window.dispatch('UPDATE_AGENT_STATUS', {
              agentId: 'devops',
              status: 'coding',
              currentTaskId: 'task-06',
            });
            window.dispatch('UPDATE_AGENT_STATUS', {
              agentId: 'coder1',
              status: 'idle',
              currentTaskId: null,
            });
            window.addLog(
              'system',
              'info',
              'SMTP Scroll task closed. Dispatched Scroll #06 (Setup Docker Compose) to Chunin DevOps.',
            );
          }
          window.renderDecisions();
          window.renderKanban();
        }
        break;
      }

      case 'INIT_NEW_PROJECT': {
        window.state.activeProject = payload.projectTitle;
        window.state.accumulatedCost = 0.05;
        window.state.llmRequests = 10;
        window.state.autoFixes = 0;
        window.state.testCoverage = 0;
        window.state.tasks = payload.tasks;

        // === NEW: Store VCS config with project state ===
        if (payload.vcsConfig) {
          window.state.project.vcsConfig = payload.vcsConfig;
          // Also update VCS settings for the repository tab
          window.state.integrations.vcs = {
            provider:
              payload.vcsConfig.mode === 'git'
                ? 'git'
                : payload.vcsConfig.mode === 'local'
                  ? 'local'
                  : null,
            localPath: payload.vcsConfig.localPath || '',
            branch: payload.vcsConfig.gitBranch || 'main',
            ignoreRules: '',
          };
          window.addLog(
            'system',
            'info',
            `Project source: ${payload.vcsConfig.mode === 'git' ? 'Git repo' : payload.vcsConfig.mode === 'local' ? 'Local folder' : 'New workspace'}`,
          );
        }

        Object.keys(window.state.agents).forEach((k) => {
          window.state.agents[k].status = 'idle';
          window.state.agents[k].currentTaskId = null;
          window.state.agents[k].cost = 0;
        });
        const hunterToggleEl = document.getElementById('settings-hunter-toggle');
        window.state.agents.hunter.status =
          hunterToggleEl && !hunterToggleEl.checked ? 'idle' : 'watching';
        const updaterToggleEl = document.getElementById('settings-updater-toggle');
        window.state.agents.updater.status =
          updaterToggleEl && !updaterToggleEl.checked ? 'sleeping' : 'idle';
        window.state.agents.architect.status = 'thinking';
        window.state.agents.architect.currentTaskId = payload.tasks[0].id;
        window.state.consoleLogs = [
          {
            time: tsVal(),
            agent: 'system',
            type: 'info',
            msg: `Initialized mission: ${payload.projectTitle}.`,
          },
          {
            time: tsVal(),
            agent: 'pm',
            type: 'info',
            msg: 'Stealth coordinates integrated. Strategy scrolls prepared.',
          },
          {
            time: tsVal(),
            agent: 'orchestrator',
            type: 'info',
            msg: `Shadow swarm unleashed. Scroll #${payload.tasks[0].id} assigned to Grandmaster.`,
          },
        ];
        document.getElementById('current-project-name').innerText = payload.projectTitle;
        window.renderKanban();
        window.renderDecisions();
        window.renderLogs();
        if (typeof window.renderMetrics === 'function') window.renderMetrics();
        window.selectAgent('architect');
        window.workbenchInitialized = false;
        window.switchTab('swarm-graph');
        break;
      }

      case 'UPDATE_METRICS':
        Object.assign(window.state, payload);
        window.renderMetrics();
        break;

      case 'UPDATE_AGENT_MODEL': {
        const { agentId, model } = payload;
        const agent = window.state.agents[agentId];
        if (agent) {
          agent.route = model;
          window.addLog(
            'system',
            'info',
            `Model reassigned: ${agent.name} → ${model}. VRAM rebalancing...`,
          );
          if (typeof window.updateVRAMBar === 'function') window.updateVRAMBar();
        }
        break;
      }

      case 'TOGGLE_MCP_SERVER': {
        const srv = window.state.mcpServers.find((s) => s.id === payload.serverId);
        if (srv) {
          srv.status = payload.status;
          window.addLog(
            'system',
            'info',
            `MCP Server [${payload.serverId}] ${payload.status === 'active' ? 'MOUNTED' : 'UNMOUNTED'}.`,
          );
          if (typeof window.renderMCPPane === 'function') window.renderMCPPane();
        }
        break;
      }

      case 'ADD_MCP_SERVER':
        window.state.mcpServers.push(payload);
        window.addLog(
          'system',
          'success',
          `MCP Server [${payload.id}] mounted. Command: ${payload.command}`,
        );
        if (typeof window.renderMCPPane === 'function') window.renderMCPPane();
        break;

      case 'SAVE_PROMPT':
        window.state.agentPrompts[payload.role] = payload.prompt;
        window.addLog(
          'system',
          'success',
          `Stealth instruction scroll updated for ${payload.role}.`,
        );
        break;

      case 'FORGE_SKILL':
        window.state.customSkills.push(payload);
        window.addLog(
          'system',
          'success',
          `Custom Jutsu Skill [${payload.id}] forged and added to the Skill Archives.`,
        );
        if (typeof window.renderCustomSkillsList === 'function') window.renderCustomSkillsList();
        break;

      case 'DELETE_SKILL':
        window.state.customSkills = window.state.customSkills.filter((s) => s.id !== payload.id);
        if (typeof window.renderCustomSkillsList === 'function') window.renderCustomSkillsList();
        break;

      case 'INGEST_RAG_DOC':
        window.state.ragConfig.push(payload);
        window.addLog(
          'system',
          'info',
          `RAG ingestion started: ${payload.name} (${payload.chunks} chunks)...`,
        );
        if (typeof window.renderRAGDocsList === 'function') window.renderRAGDocsList();
        break;

      case 'UPDATE_RAG_DOC_STATUS': {
        const doc = window.state.ragConfig.find((d) => d.name === payload.name);
        if (doc) {
          doc.status = payload.status;
          window.addLog(
            'system',
            'success',
            `RAG Vectorization complete: ${payload.name}. ${doc.chunks} chunks indexed.`,
          );
          if (typeof window.renderRAGDocsList === 'function') window.renderRAGDocsList();
        }
        break;
      }

      case 'ADD_NOTIFICATION': {
        const notif = { id: `n${Date.now()}`, ...payload, time: 'just now', read: false };
        const notifs = Array.isArray(window.state.notifications)
          ? window.state.notifications
          : window.state.notifications?.items || [];
        notifs.unshift(notif);
        const badge = document.getElementById('notif-badge-count');
        const unread = notifs.filter((n) => !n.read).length;
        if (badge) {
          badge.textContent = unread;
          badge.style.display = unread > 0 ? 'inline-block' : 'none';
        }
        if (typeof window.showToast === 'function')
          window.showToast(`${payload.title}: ${payload.message}`, payload.type || 'info');
        break;
      }

      case 'MARK_NOTIF_READ': {
        const notifs = Array.isArray(window.state.notifications)
          ? window.state.notifications
          : window.state.notifications?.items || [];
        const notif = notifs.find((n) => n.id === payload.id);
        if (notif) notif.read = true;
        const unread = notifs.filter((n) => !n.read).length;
        const badge = document.getElementById('notif-badge-count');
        if (badge) {
          badge.textContent = unread;
          badge.style.display = unread > 0 ? 'inline-block' : 'none';
        }
        break;
      }

      case 'MARK_ALL_NOTIFS_READ': {
        const notifs = Array.isArray(window.state.notifications)
          ? window.state.notifications
          : window.state.notifications?.items || [];
        notifs.forEach((n) => (n.read = true));
        const badge = document.getElementById('notif-badge-count');
        if (badge) badge.style.display = 'none';
        break;
      }

      case 'UPDATE_APPEARANCE': {
        const { key, value } = payload;
        window.state.appearance[key] = value;
        if (key === 'theme') {
          document.body.setAttribute('data-theme', value);
        }
        if (key === 'fontSize') {
          document.documentElement.style.setProperty('--font-size-base', `${value}px`);
        }
        if (key === 'motionEnabled') {
          document.body.classList.toggle('reduce-motion', !value);
        }
        if (key === 'contrastMode') {
          document.body.classList.toggle('high-contrast', value);
        }
        break;
      }

      case 'CREATE_BACKUP_SNAPSHOT': {
        const snap = {
          id: `snap-${Date.now()}`,
          name: payload.name || `Manual Snapshot ${new Date().toLocaleTimeString()}`,
          created: new Date().toISOString(),
          size: `${(2.5 + Math.random()).toFixed(1)} MB`,
          type: 'manual',
          status: 'ready',
        };
        window.state.backup.snapshots.unshift(snap);
        window.addLog('system', 'success', `Backup snapshot created: ${snap.name}`);
        if (typeof window.showToast === 'function')
          window.showToast('Snapshot created successfully', 'success');
        break;
      }

      case 'ADD_SECURITY_VULN_NOTE': {
        const vuln = window.state.security.vulnerabilities.find((v) => v.id === payload.id);
        if (vuln) {
          vuln.note = payload.note;
          vuln.status = payload.status || vuln.status;
        }
        break;
      }

      case 'TRIGGER_SECURITY_SCAN':
        window.state.security.scanStatus = 'scanning';
        window.addLog('security', 'info', 'Stealth Auditor: Full security scan initiated...');
        setTimeout(() => {
          window.state.security.scanStatus = 'idle';
          window.state.security.lastScanAt = new Date().toISOString();
          window.addLog(
            'security',
            'success',
            `Stealth Auditor: Security scan complete. Score: ${window.state.security.score}/100`,
          );
          window.dispatch('ADD_NOTIFICATION', {
            type: 'info',
            title: 'Scan Complete',
            message: `Security score: ${window.state.security.score}/100`,
          });
        }, 3000);
        break;

      case 'TRIGGER_DEPLOYMENT': {
        const env = window.state.deployment.environments.find((e) => e.id === payload.envId);
        if (env) {
          window.state.deployment.deployInProgress = true;
          window.addLog(
            'devops',
            'info',
            `Chunin DevOps: Initiating Shadow Strike deployment to ${env.name}...`,
          );
          setTimeout(() => {
            env.lastDeploy = new Date().toISOString();
            env.version = payload.version || 'v0.4.3';
            window.state.deployment.deployInProgress = false;
            window.state.deployment.releaseHistory.unshift({
              id: `rel-${Date.now()}`,
              version: env.version,
              env: env.id,
              status: 'success',
              deployedAt: new Date().toISOString(),
              deployedBy: 'Chunin DevOps',
              changelog: payload.changelog || 'Manual deployment',
            });
            window.addLog(
              'devops',
              'success',
              `Shadow Strike complete! ${env.name} updated to ${env.version}.`,
            );
            window.dispatch('ADD_NOTIFICATION', {
              type: 'success',
              title: 'Deployment Complete',
              message: `${env.name} updated to ${env.version}`,
            });
          }, 4000);
        }
        break;
      }

      case 'WORKFLOW_UPDATE_STAGE': {
        const stage = window.state.workflow.stages.find((s) => s.id === payload.stageId);
        if (stage) Object.assign(stage, payload.updates);
        break;
      }

      // === NEW: Repository Actions ===
      case 'REPO_SELECT_BRANCH': {
        window.state.repository.currentBranch = payload.branch
          ? payload.branch.replace(/^Active Branch:\s*/i, '')
          : payload.branch;
        window.addLog(
          'system',
          'info',
          `Switched to branch: ${window.state.repository.currentBranch}`,
        );
        break;
      }

      case 'REPO_CREATE_BRANCH': {
        window.state.repository.branches.push({
          name: payload.name,
          type: payload.type || 'feature',
          ahead: 0,
          behind: 0,
          lastCommit: new Date().toISOString(),
          author: 'You',
        });
        window.addLog('system', 'success', `Created branch: ${payload.name}`);
        break;
      }

      case 'REPO_SELECT_FILE': {
        window.state.repository.selectedFile = payload.path;
        break;
      }

      case 'REPO_SEARCH': {
        window.state.repository.searchQuery = payload.query;
        // Mock search results
        window.state.repository.searchResults = [
          { type: 'file', path: 'src/services/email.ts', matches: 3 },
          { type: 'symbol', name: 'sendEmail', path: 'src/services/email.ts:45' },
        ].filter((r) => r.path.includes(payload.query) || r.name?.includes(payload.query));
        break;
      }

      // === NEW: Pull Request Actions ===
      case 'PR_CREATE': {
        const newPR = {
          id: Date.now(),
          number: window.state.pullRequests.list.length + 42,
          title: payload.title,
          author: 'You',
          branch: payload.branch,
          base: payload.base || 'main',
          status: 'open',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ciStatus: 'pending',
          reviewStatus: 'pending',
          conflicts: false,
          additions: payload.additions || 0,
          deletions: payload.deletions || 0,
          reviewers: [],
          comments: 0,
          labels: payload.labels || [],
        };
        window.state.pullRequests.list.unshift(newPR);
        window.addLog('system', 'success', `Created PR #${newPR.number}: ${newPR.title}`);
        window.dispatch('ADD_NOTIFICATION', {
          type: 'success',
          title: 'PR Created',
          message: `#${newPR.number}: ${newPR.title}`,
        });
        break;
      }

      case 'PR_SELECT': {
        window.state.pullRequests.selectedPR = payload.prId;
        break;
      }

      case 'PR_UPDATE_STATUS': {
        const pr = window.state.pullRequests.list.find((p) => p.id === payload.prId);
        if (pr) {
          pr.status = payload.status;
          pr.updatedAt = new Date().toISOString();
          if (payload.status === 'merged') {
            pr.mergedAt = new Date().toISOString();
            window.addLog('system', 'success', `Merged PR #${pr.number}: ${pr.title}`);
          }
        }
        break;
      }

      case 'PR_ADD_REVIEW': {
        const pr = window.state.pullRequests.list.find((p) => p.id === payload.prId);
        if (pr) {
          pr.reviewers.push({ user: payload.reviewer, status: payload.status });
          pr.comments += payload.comments || 0;
          // Update overall review status
          const approved = pr.reviewers.filter((r) => r.status === 'approved').length;
          const changes = pr.reviewers.filter((r) => r.status === 'changes_requested').length;
          if (changes > 0) pr.reviewStatus = 'changes_requested';
          else if (approved >= 1) pr.reviewStatus = 'approved';
        }
        break;
      }

      case 'REPO_DELETE_BRANCH': {
        window.state.repository.branches = window.state.repository.branches.filter(
          (b) => b.name !== payload.branch,
        );
        window.addLog('system', 'warning', `Deleted branch: ${payload.branch}`);
        break;
      }

      case 'PR_COMPARE_BRANCH': {
        window.state.pullRequests.compareBranch = payload.branch;
        break;
      }

      case 'PR_SIMULATE_MERGE': {
        window.state.pullRequests.isSimulatingMerge = true;
        window.addLog(
          'system',
          'info',
          `[MERGE SIMULATION] Starting merge checks for PR #${payload.prId}...`,
        );

        const steps = [
          '[MERGE SIMULATION] Simulating target merge into main...',
          '[MERGE SIMULATION] Running code compiler check: PASS',
          '[MERGE SIMULATION] Executing dojo integration tests: 14/14 PASS',
          '[MERGE SIMULATION] Executing static AST security checks: 0 vulnerabilities found.',
          '[MERGE SIMULATION] Lock acquired. Commencing fast-forward merge...',
        ];

        steps.forEach((msg, index) => {
          setTimeout(
            () => {
              window.dispatch('ADD_LOG', { agent: 'system', type: 'info', msg });
            },
            (index + 1) * 800,
          );
        });

        setTimeout(
          () => {
            window.state.pullRequests.isSimulatingMerge = false;
            // Find the PR in queue and remove it
            window.state.pullRequests.mergeQueue = window.state.pullRequests.mergeQueue.filter(
              (item) => item.id !== payload.prId,
            );
            // Set PR status to merged
            window.dispatch('PR_UPDATE_STATUS', { prId: payload.prId, status: 'merged' });
            window.renderPullRequests();
            window.showToast(
              `PR #${payload.prId} merged successfully after simulation!`,
              'success',
            );
          },
          (steps.length + 1) * 800,
        );
        break;
      }

      // === NEW: Provenance Actions ===
      case 'TRACE_SELECT': {
        window.state.provenance.selectedTrace = payload.traceId;
        break;
      }

      case 'TRACE_FILTER': {
        Object.assign(window.state.provenance.filters, payload.filters);
        break;
      }

      // === NEW: Approval Actions ===
      case 'APPROVAL_REQUEST': {
        window.state.approvals.queue.push({
          id: `approval-${Date.now()}`,
          type: payload.type,
          title: payload.title,
          requester: payload.requester,
          requestedAt: new Date().toISOString(),
          riskLevel: payload.riskLevel,
          affectedSystems: payload.affectedSystems,
          description: payload.description,
          changes: payload.changes,
          status: 'pending',
          approvers: payload.approvers,
          deadline: payload.deadline,
          autoApprove: false,
        });
        window.addLog('system', 'warning', `Approval requested: ${payload.title}`);
        window.dispatch('ADD_NOTIFICATION', {
          type: 'warning',
          title: 'Approval Required',
          message: payload.title,
        });
        break;
      }

      case 'APPROVAL_RESOLVE': {
        const approval = window.state.approvals.queue.find((a) => a.id === payload.approvalId);
        if (approval) {
          approval.status = payload.approved ? 'approved' : 'rejected';
          approval.resolvedAt = new Date().toISOString();
          approval.resolvedBy = payload.resolver;
          window.state.approvals.history.unshift({ ...approval });
          window.state.approvals.queue = window.state.approvals.queue.filter(
            (a) => a.id !== payload.approvalId,
          );
          window.addLog('system', 'success', `Approval ${approval.status}: ${approval.title}`);
        }
        break;
      }

      // === NEW: Project Actions ===
      case 'PROJECT_SWITCH': {
        window.state.projects.current = payload.projectId;
        const project = window.state.projects.list.find((p) => p.id === payload.projectId);
        if (project) {
          window.state.activeProject = project.name;
          window.addLog('system', 'info', `Switched to project: ${project.name}`);
        }
        break;
      }

      case 'PROJECT_CREATE': {
        const newProject = {
          id: `proj-${Date.now()}`,
          name: payload.name,
          description: payload.description,
          status: 'active',
          health: 100,
          costToday: 0,
          costMonth: 0,
          lastActivity: new Date().toISOString(),
          tags: payload.tags || [],
          members: 1,
          starred: false,
        };
        window.state.projects.list.push(newProject);
        window.addLog('system', 'success', `Created project: ${newProject.name}`);
        break;
      }

      case 'PROJECT_STAR': {
        const project = window.state.projects.list.find((p) => p.id === payload.projectId);
        if (project) project.starred = !project.starred;
        break;
      }

      // === NEW: Incident Actions ===
      case 'INCIDENT_CREATE': {
        window.state.incidents.active.push({
          id: `inc-${Date.now()}`,
          title: payload.title,
          severity: payload.severity,
          status: 'investigating',
          startedAt: new Date().toISOString(),
          affectedService: payload.service,
          symptoms: payload.symptoms,
          impact: payload.impact,
          assignedTo: payload.assignee,
          timeline: [
            { time: new Date().toISOString(), event: 'Incident created', type: 'created' },
          ],
        });
        window.addLog('system', 'error', `Incident created: ${payload.title}`);
        window.dispatch('ADD_NOTIFICATION', {
          type: 'error',
          title: 'Incident',
          message: payload.title,
        });
        break;
      }

      case 'INCIDENT_RESOLVE': {
        const incident = window.state.incidents.active.find((i) => i.id === payload.incidentId);
        if (incident) {
          incident.status = 'resolved';
          incident.resolvedAt = new Date().toISOString();
          incident.resolution = payload.resolution;
          window.state.incidents.resolved.unshift({ ...incident });
          window.state.incidents.active = window.state.incidents.active.filter(
            (i) => i.id !== payload.incidentId,
          );
          window.addLog('system', 'success', `Incident resolved: ${incident.title}`);
        }
        break;
      }

      case 'INCIDENT_UPDATE': {
        const incident = window.state.incidents.active.find((i) => i.id === payload.incidentId);
        if (incident) {
          incident.timeline.push({
            time: new Date().toISOString(),
            event: payload.event,
            type: payload.type,
          });
        }
        break;
      }

      // === NEW: Feature Flag Actions ===
      case 'FLAG_UPDATE': {
        const flag = window.state.featureFlags.flags.find((f) => f.id === payload.flagId);
        if (flag) Object.assign(flag, payload.updates);
        break;
      }

      case 'FLAG_TOGGLE': {
        const flag = window.state.featureFlags.flags.find((f) => f.id === payload.flagId);
        if (flag) {
          flag.status = flag.status === 'enabled' ? 'disabled' : 'enabled';
          flag.rollout = flag.status === 'enabled' ? 100 : 0;
        }
        break;
      }

      // === NEW: Secret Actions ===
      case 'SECRET_ROTATE': {
        const secret =
          window.state.secrets.apiKeys.find((s) => s.id === payload.secretId) ||
          window.state.secrets.envVars.find((s) => s.id === payload.secretId);
        if (secret) {
          secret.lastRotated = new Date().toISOString();
          secret.value = `••••••••${Math.random().toString(36).slice(-4)}`;
          window.addLog('system', 'success', `Rotated secret: ${secret.name || secret.key}`);
        }
        break;
      }

      case 'SECRET_CREATE': {
        if (payload.type === 'env') {
          window.state.secrets.envVars.push({
            id: `env-${Date.now()}`,
            key: payload.key,
            value: '••••••••',
            scope: payload.scope,
            lastRotated: null,
          });
        } else {
          window.state.secrets.apiKeys.push({
            id: `key-${Date.now()}`,
            name: payload.name,
            key: `••••••••${payload.key.slice(-8)}`,
            lastUsed: null,
            expiresAt: payload.expiresAt,
            status: 'active',
          });
        }
        break;
      }

      // === NEW: Collaboration Actions ===
      case 'THREAD_CREATE': {
        window.state.collaboration.threads.push({
          id: `thread-${Date.now()}`,
          type: payload.type,
          from: payload.from,
          to: payload.to,
          taskId: payload.taskId,
          createdAt: new Date().toISOString(),
          messages: [],
        });
        break;
      }

      case 'THREAD_MESSAGE': {
        const thread = window.state.collaboration.threads.find((t) => t.id === payload.threadId);
        if (thread) {
          thread.messages.push({
            from: payload.from,
            content: payload.content,
            timestamp: new Date().toISOString(),
          });
        }
        break;
      }

      // === NEW: Analytics Actions ===
      case 'ANALYTICS_FILTER': {
        Object.assign(window.state.analytics.filters, payload.filters);
        break;
      }

      // === NEW: Intelligence Actions ===
      case 'INTELLIGENCE_SEARCH': {
        window.state.intelligence.searchIndex.query = payload.query;
        break;
      }

      case 'IMPACT_ANALYZE': {
        window.state.intelligence.impactAnalysis = {
          target: payload.target,
          affectedFiles: ['src/models/User.ts', 'src/controllers/auth.ts'],
          affectedTests: 6,
          riskLevel: 'medium',
          blastRadius: 'medium',
          estimatedTime: '15m',
          timestamp: new Date().toISOString(),
        };
        break;
      }

      default:
        console.warn(`Unknown action type: ${action}`);
    }

    if (typeof window.updateSidebarBadges === 'function') {
      window.updateSidebarBadges();
    }
  };
})();
