export interface DecisionAlternative {
  title: string;
  pros: string;
  cons: string;
}

export interface DecisionItem {
  id: string;
  title: string;
  desc: string;
  status: 'proposed' | 'decided' | 'overridden';
  decidedBy: string;
  confidence: number;
  rationale: string;
  alternatives: DecisionAlternative[];
  selectedAlternative: number;
}

export const mockDecisions: DecisionItem[] = [
  {
    id: 'decision-01',
    title: 'SMTP Local Server vs SendGrid Integration for Email Alerts',
    desc: 'Determine transaction transit routing for workspace email alerts. Local Nodemailer is completely free, whereas SendGrid offers dedicated delivery tunnels but charges subscription tiers.',
    status: 'decided',
    decidedBy: 'architect',
    confidence: 87,
    rationale: 'We should prioritize Nodemailer with SMTP configuration parameters for local sandbox operations. This removes third-party account credential bottlenecks during initial implementation.',
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
    rationale: 'PostgreSQL chosen because task assignments, subteams, and graph indices require parallel transactional writes and relational constraints that SQLite handles poorly.',
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
];

const decisionTitles = [
  'WebSocket vs SSE for real-time dashboard events',
  'State management: Zustand vs Redux Toolkit',
  'CSS design system: Vanilla CSS vs TailwindCSS',
  'Testing framework: Vitest vs Jest',
  'Static analysis tools: ESLint vs Biome',
  'Language choice: TypeScript vs JavaScript',
  'Container sandbox virtualization: Docker vs Podman',
  'CI/CD provider: GitHub Actions vs GitLab CI',
];

const decisionRationales = [
  'Zustand chosen due to simplicity and native vanilla JS hook bindings support.',
  'Vanilla CSS for flexible glassmorphic control, without dependency build bloat.',
  'Vitest selected for faster compilation and execution speeds inside Vite pipelines.',
  'TypeScript enforced for robustness and code autocomplete typings.',
];

for (let i = 3; i <= 10; i++) {
  const alternative1 = {
    title: `Alternative Option A (#${i})`,
    pros: 'Low overhead, easy to bootstrap and align with standard frameworks.',
    cons: 'Harder to customize or configure for scale operations.',
  };
  const alternative2 = {
    title: `Alternative Option B (#${i})`,
    pros: 'Extremely scalable, supports async tasks and pipeline parallelization.',
    cons: 'Overhead is high and requires configuration setup time.',
  };

  mockDecisions.push({
    id: `decision-${String(i).padStart(2, '0')}`,
    title: decisionTitles[(i - 3) % decisionTitles.length],
    desc: `Architectural selection decree for task swarm module coordination item #${i}. Weigh benefits.`,
    status: i % 3 === 0 ? 'proposed' : 'decided',
    decidedBy: 'architect',
    confidence: 70 + (i * 2) % 25,
    rationale: decisionRationales[(i - 3) % decisionRationales.length] || 'Option B chosen for long-term maintainability and scaling support.',
    alternatives: [alternative1, alternative2],
    selectedAlternative: i % 2,
  });
}
