import { execFileSync } from 'node:child_process';
import process from 'node:process';

const image = process.env.DOCKER_IMAGE || 'orchestrarr:ci';
const port = Number(process.env.DOCKER_SMOKE_PORT || 4174);
const container = `orchestrarr-smoke-${process.pid}`;
const baseUrl = `http://127.0.0.1:${port}`;
let started = false;

function docker(args) {
  return execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

async function waitForHealth() {
  let lastError = 'container did not respond';
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
      lastError = `health returned ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(lastError);
}

try {
  docker(['run', '--detach', '--rm', '--name', container, '--publish', `127.0.0.1:${port}:4173`, '--env', 'DEMO_MODE=true', '--env', 'ORCHESTRARR_API_KEY=ci-smoke-key', image]);
  started = true;
  await waitForHealth();

  const health = await fetch(`${baseUrl}/api/health`);
  const healthPayload = await health.json();
  if (health.status !== 200 || healthPayload.ok !== true || healthPayload.mode !== 'demo') throw new Error('Docker health response was not valid');

  const shell = await fetch(`${baseUrl}/`);
  if (shell.status !== 200 || !(await shell.text()).includes('Orchestrarr')) throw new Error('Docker runtime did not serve the frontend shell');

  const denied = await fetch(`${baseUrl}/api/config`);
  if (denied.status !== 401) throw new Error(`Docker API should require authentication, got ${denied.status}`);

  const authenticated = await fetch(`${baseUrl}/api/config`, { headers: { 'X-Orchestrarr-Key': 'ci-smoke-key' } });
  if (authenticated.status !== 200) throw new Error(`Docker API key authentication failed with ${authenticated.status}`);

  console.log(`Docker runtime smoke passed for ${image}`);
} finally {
  if (started) {
    try { docker(['stop', container]); } catch (error) { console.error(`Could not stop ${container}: ${error.message}`); }
  }
}
