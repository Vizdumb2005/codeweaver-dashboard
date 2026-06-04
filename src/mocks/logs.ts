import { LogEntry } from '../store/store';

const agents = ['system', 'pm', 'architect', 'coder1', 'coder2', 'tester', 'security', 'devops'];
const templates = [
  'Swarm orchestrator initialized successfully.',
  'Recon Shinobi mapped project requirements catalog.',
  'Grandmaster updated schema entity relations files.',
  'Jutsu Coder started coding task handlers.',
  'Kunai Tester executing validation mock runner assertions.',
  'Stealth Auditor scanning secrets keys in environment.',
  'Chunin DevOps initialized container configuration mappings.',
  'Failed connection timeout retry triggered for services.',
  'Successfully pushed changes branch feature/auth-module.',
  'Vulnerability alert critical detected packages index.',
];

export const mockLogs: LogEntry[] = [];

// Base date offset
const baseTime = Date.now() - 36000000; // 10 hours ago

for (let i = 1; i <= 1024; i++) {
  const timestamp = new Date(baseTime + i * 35000); // spread over hours
  const timeStr = timestamp.toTimeString().split(' ')[0];
  const agent = agents[i % agents.length];
  const type = i % 55 === 0 ? 'error' : i % 24 === 0 ? 'warning' : i % 8 === 0 ? 'success' : 'info';
  
  let msg = templates[i % templates.length];
  if (type === 'error') {
    msg = `EXCEPTION: Connection failure to database port. Return code: ${500 + (i % 5)}.`;
  } else if (type === 'warning') {
    msg = `WARNING: Deprecated packages configuration node used in line ${i % 100}.`;
  } else if (type === 'success') {
    msg = `SUCCESS: Completed AST scan validation parameters for segment #${i}.`;
  } else {
    msg = `${msg} (Record offset ${i})`;
  }

  mockLogs.push({
    time: timeStr,
    agent,
    type,
    msg,
  });
}
