export interface ReleaseItem {
  id: string;
  version: string;
  env: string;
  status: 'success' | 'failed' | 'rolled_back' | 'in_progress';
  deployedAt: string;
  deployedBy: string;
  changelog: string;
}

export const mockDeployments: ReleaseItem[] = [];

const environments = ['staging', 'production', 'development'];
const users = ['Chunin DevOps', 'Shadow Master', 'Sensei'];
const changelogs = [
  'Initial scaffolding of user database maps',
  'Upgrade hashing algorithms to bcrypt',
  'Implement email SMTP transports fallback configs',
  'Fix concurrency locks on dashboard socket controllers',
  'Add OWASP security audit scans mappings',
  'Refactor state store selectors for components UI',
];

for (let i = 1; i <= 20; i++) {
  const version = `v0.5.${20 - i}`;
  const env = environments[i % environments.length];
  const status = i % 10 === 0 ? 'failed' : i % 7 === 0 ? 'rolled_back' : 'success';
  const deployedBy = users[i % users.length];
  const changelog = changelogs[i % changelogs.length];
  
  mockDeployments.push({
    id: `rel-${String(i).padStart(3, '0')}`,
    version,
    env,
    status,
    deployedAt: new Date(Date.now() - i * 86400000).toISOString(),
    deployedBy,
    changelog: `${changelog} (Release patch #${i})`,
  });
}
