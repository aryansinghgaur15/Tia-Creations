// server/_start.js — starts API + Vite dev servers, keeps running
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

console.log('[TIA] Starting API server...');
const api = spawn('node', [join(__dirname, 'index.js')], { cwd: root, stdio: 'inherit' });

console.log('[TIA] Starting Vite dev server...');
const vite = spawn('npx', ['vite', '--host'], { cwd: root, stdio: 'inherit' });

api.on('error', (e) => console.error('[API error]', e.message));
vite.on('error', (e) => console.error('[Vite error]', e.message));

process.on('SIGINT', () => { api.kill(); vite.kill(); process.exit(0); });
