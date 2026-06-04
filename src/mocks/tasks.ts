import { Task } from '../store/store';

const assignees = ['pm', 'architect', 'coder1', 'coder2', 'tester', 'security', 'devops'];
const complexities = ['simple', 'medium', 'complex'] as const;
const columns = ['backlog', 'in_progress', 'review', 'completed'] as const;

const taskTemplates = [
  { title: 'Refactor Auth Middleware', desc: 'Migrate legacy passport session code to JWT token validations for security standards.' },
  { title: 'Implement Redis Caching Layer', desc: 'Cache popular read API requests to reduce primary Postgres DB load.' },
  { title: 'Write Integration Tests', desc: 'Generate mocks and assertions for all controller operations.' },
  { title: 'Configure GitHub Actions CI', desc: 'Automatically trigger test runner and security scan on PR creations.' },
  { title: 'Audit Vulnerabilities', desc: 'Scan npm vulnerabilities and fix version discrepancies on packages.' },
  { title: 'Optimize Indexing constraints', desc: 'Add indices on workspace search fields to resolve slow SQL reads.' },
  { title: 'Design Landing Page UI', desc: 'Build modern glassmorphism web layout according to styling requirements.' },
  { title: 'Create Email SMTP Transport', desc: 'Implement Nodemailer smtp transports supporting local configurations.' },
  { title: 'Setup Sentry Telemetry', desc: 'Wire transaction performance traces and catch unhandled promise exceptions.' },
  { title: 'Document OpenAPI bluePrint', desc: 'Scaffold swagger interface matching active express router routes.' },
];

export const mockTasks: Task[] = [];

// Seed first 8 explicit items to retain legacy items
mockTasks.push(
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
    output: '[DB Spec Compiled]\nEntities: user, task, decision, workspace\nRelations: user HAS_MANY tasks, workspace CONTAINS tasks\nIndices: Created index idx_tasks_user_id on tasks(user_id)',
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
    output: '[Security Audit Success]\nScanned: src/utils/auth.ts\nFound: bcrypt.hash(pwd, 12) used.\nResult: Code conforms to OWASP cryptograph guidelines. Secret scanners reported 0 indicators.',
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
    output: '[Models Completed]\nWritten: src/models/User.ts, src/models/Session.ts\nTests: Manual verify check pass.',
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
    output: '[Test Run Running]\nExecuting jest integration/auth.test.ts...\nTests: 6 passed, 2 executing...',
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
    assignee: 'pm',
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
    assignee: 'architect',
    priority: 2,
    complexity: 'medium',
    duration: 'Pending prerequisite',
    attempts: '0 / 3',
    tags: ['#performance', '#profiling'],
    deps: ['task-04'],
    output: '',
  }
);

// Programmatically seed remaining 47 tasks to exceed the 50 tasks requirement
for (let i = 9; i <= 55; i++) {
  const template = taskTemplates[i % taskTemplates.length];
  const colIndex = i % columns.length;
  const complexity = complexities[i % complexities.length];
  const status = columns[colIndex];
  
  mockTasks.push({
    id: `task-${String(i).padStart(2, '0')}`,
    title: `${template.title} (Part ${Math.floor(i / 10) + 1})`,
    desc: `${template.desc} Subtask section ${i % 3}. Confirm validation requirements.`,
    status,
    assignee: assignees[i % assignees.length],
    priority: (i % 5) + 1,
    complexity,
    duration: status === 'completed' ? `${(i * 3) % 40 + 5} min elapsed` : status === 'in_progress' ? 'Active: 4m elapsed' : 'Pending',
    attempts: status === 'completed' ? '1 / 3' : '0 / 3',
    tags: [`#tag-${i % 4}`, `#sub-${i % 2}`],
    deps: [`task-0${(i % 5) + 1}`],
    progress: status === 'in_progress' ? (i * 12) % 90 + 10 : undefined,
    output: status === 'completed' ? `[Mock Log i=${i}] Successfully executed subtask specifications.` : '',
  });
}
