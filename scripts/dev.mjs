import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const vitePackagePath = require.resolve('vite/package.json');
const viteBin = join(dirname(vitePackagePath), require('vite/package.json').bin.vite);
const apiOrigin = process.env.API_ORIGIN || `http://127.0.0.1:${process.env.PORT || 4173}`;
const childEnv = { ...process.env, API_ORIGIN: apiOrigin };
const commands = [];

try {
  const response = await fetch(`${apiOrigin.replace(/\/$/, '')}/api/health`, {
    signal: AbortSignal.timeout(1000),
  });

  if (response.ok) {
    console.log(`Using existing API at ${apiOrigin}`);
  } else {
    commands.push([process.execPath, ['server.js'], 'api']);
  }
} catch {
  commands.push([process.execPath, ['server.js'], 'api']);
}

commands.push([process.execPath, [viteBin, '--host', '127.0.0.1'], 'vite']);

let stopping = false;
const children = commands.map(([command, args, name]) => {
  const child = spawn(command, args, { cwd: projectRoot, stdio: 'inherit', env: childEnv });
  child.on('error', (error) => { console.error(`${name} process failed:`, error); stop(1); });
  child.on('exit', (code) => { if (code && code !== 0) stop(code); });
  return child;
});

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill('SIGTERM');
  process.exitCode = code;
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
