// Explicit removal requested by the owner: retire WordSprout asset snapshots.
// Never touches other Pages projects, Worker APIs, databases or user sessions.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const account = '59d1142ec45805e0ed0a5e04c242cd84';
const prefix = `/accounts/${account}/pages/projects/wordsprout`;
const auth = JSON.parse(
  execFileSync('npx', ['wrangler', 'auth', 'token', '--json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
if (!auth.token) throw new Error('Cloudflare login required');
const endpoint = 'https://api.cloudflare.com/client/v4';
async function api(path, method = 'GET') {
  const response = await fetch(endpoint + path, {
    method,
    headers: { Authorization: `Bearer ${auth.token}` },
    signal: AbortSignal.timeout(30_000),
  });
  const value = await response.json();
  if (!response.ok || value.success === false)
    throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(value.errors)}`);
  return value.result;
}
async function list() {
  const items = [];
  for (let page = 1; ; page++) {
    const current = await api(`${prefix}/deployments?per_page=25&page=${page}`);
    items.push(...current);
    if (current.length < 25) break;
  }
  return items;
}
const action = process.argv[2] ?? 'plan';
const planPath = 'docs/content-audit/deployment-removal-plan.json';
if (action === 'plan') {
  const project = await api(prefix);
  const deployments = await list();
  const affected = new Set([
    '754da528-dcfb-4b6b-88f1-ace5cc09946e',
    '7e6b2251-237a-4027-a6fb-17b814d65433',
    '9c41eb04-1492-47b3-a8e8-c5c29ad4710b',
  ]);
  const plan = {
    project: 'wordsprout',
    created_at: new Date().toISOString(),
    previous_production: project.canonical_deployment?.id,
    deployments: deployments
      .filter((d) => affected.has(d.id))
      .map((d) => ({
        id: d.id,
        url: d.url,
        environment: d.environment,
        created_on: d.created_on,
        aliases: d.aliases ?? [],
      })),
  };
  writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n');
  console.log(JSON.stringify(plan, null, 2));
} else if (action === 'remove-after-replacement') {
  const plan = JSON.parse(readFileSync(planPath, 'utf8'));
  const project = await api(prefix);
  const canonical = project.canonical_deployment;
  if (!canonical?.id || plan.deployments.some((d) => d.id === canonical.id))
    throw new Error('A new clean production deployment must be active before retiring old assets.');
  const proof = await fetch(`${canonical.url}/vocabulary/credits.html`, {
    signal: AbortSignal.timeout(20_000),
  });
  if (!proof.ok || !(await proof.text()).includes('当前提供 WordSprout 独立编排的 600'))
    throw new Error('New deployment lacks audited content notice.');
  const available = new Set((await list()).map((d) => d.id));
  const results = [];
  for (const deployment of plan.deployments) {
    if (deployment.id === canonical.id) throw new Error('Refusing to delete live production.');
    if (!available.has(deployment.id)) {
      results.push({ ...deployment, status: 'already-removed' });
      continue;
    }
    try {
      await api(`${prefix}/deployments/${deployment.id}`, 'DELETE');
      results.push({ ...deployment, status: 'removed' });
      console.log('removed', deployment.id);
    } catch (error) {
      results.push({ ...deployment, status: 'failed', error: error.message });
      console.log('failed', deployment.id, error.message);
    }
    writeFileSync(
      'docs/content-audit/deployment-removal-results.json',
      JSON.stringify(
        { replacement: canonical.id, checked_at: new Date().toISOString(), results },
        null,
        2,
      ) + '\n',
    );
  }
  const remaining = await list();
  console.log(
    'remaining-deployments',
    JSON.stringify(remaining.map((d) => ({ id: d.id, url: d.url }))),
  );
  if (remaining.some((d) => plan.deployments.some((old) => old.id === d.id))) process.exitCode = 1;
} else throw new Error('Unknown action');
