#!/usr/bin/env node
import { spawn } from 'node:child_process';

const procs = [
  spawn('pnpm', ['--filter', '@svaraa/control-plane', 'dev'], { stdio: 'inherit', shell: true }),
  spawn('pnpm', ['--filter', '@svaraa/tenant', 'dev'], { stdio: 'inherit', shell: true }),
  spawn('pnpm', ['--filter', '@svaraa/web', 'dev'], { stdio: 'inherit', shell: true }),
];

function shutdown() {
  for (const p of procs) p.kill('SIGTERM');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

setTimeout(() => {
  spawn('node', ['scripts/demo.mjs'], { stdio: 'inherit', shell: true });
}, 2500);
