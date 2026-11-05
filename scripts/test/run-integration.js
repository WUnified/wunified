#!/usr/bin/env node
// Runs the API integration tests against a brand-new, throwaway Supabase stack, then
// deletes it. Every run gets the current migrations + seed.sql, so a stale local
// volume can never fail a correct change. Used locally and by CI.
//
//   npm run test:integration                     # all integration tests
//   npm run test:integration -- src/lib/db/chat  # extra args go to Jest
//   KEEP_STACK=1 npm run test:integration        # leave the stack up to inspect it
//
// For quick reruns against a stack you already have running, use
// `npm run test:integration:dev` instead.

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const PROJECT = 'wunified-test';
const SERVICES = ['db', 'auth', 'migrate', 'rest', 'gateway'];
// Not the dev ports (54321/54322), so a running dev stack is left alone.
const GATEWAY_HOST_PORT = process.env.TEST_GATEWAY_HOST_PORT ?? '55321';
const DB_HOST_PORT = process.env.TEST_DB_HOST_PORT ?? '55322';

// .env.example, not .env: a developer's .env may be stale (e.g. old JWT keys), and
// the test stack must always match what's committed.
function readEnvExample() {
  const env = {};
  const lines = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match) env[match[1]] = match[2];
  }
  return env;
}

const supabaseUrl = `http://localhost:${GATEWAY_HOST_PORT}`;
const env = {
  ...process.env,
  ...readEnvExample(),
  GATEWAY_HOST_PORT,
  DB_HOST_PORT,
  // Read by GoTrue (API_EXTERNAL_URL) and by the tests; loadEnv.js never overrides it.
  EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
};

function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, env, stdio: 'inherit' });
  if (result.error) {
    console.error(`[integration] could not run ${command}: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

function compose(...args) {
  // --env-file only feeds Compose's ${VAR} substitution; `env` above wins over it.
  return run('docker', ['compose', '-p', PROJECT, '--env-file', '.env.example', ...args]);
}

function removeStack() {
  if (process.env.KEEP_STACK) {
    console.log(`[integration] KEEP_STACK set — stack left running at ${supabaseUrl}.`);
    console.log(`[integration] Remove it with: docker compose -p ${PROJECT} down -v`);
    return;
  }
  console.log('[integration] removing throwaway stack ...');
  compose('down', '-v', '--remove-orphans');
}

// Ctrl-C reaches Jest/Docker directly (same process group). Ignoring it here lets
// this script survive long enough to remove the stack afterwards.
process.on('SIGINT', () => {});

// A previous run killed mid-way can leave containers behind; start from nothing.
compose('down', '-v', '--remove-orphans');

console.log(`[integration] starting fresh stack "${PROJECT}" on ${supabaseUrl} ...`);
const upStatus = compose('up', '-d', '--wait', '--wait-timeout', '300', ...SERVICES);
if (upStatus !== 0) {
  console.error(
    `[integration] stack failed to start. If a port is busy, set TEST_GATEWAY_HOST_PORT / TEST_DB_HOST_PORT. Logs follow.`,
  );
  compose('logs', '--no-color', ...SERVICES);
  removeStack();
  process.exit(upStatus);
}

const jestBin = require.resolve('jest/bin/jest');
const jestArgs = ['--selectProjects', 'integration', '--runInBand', ...process.argv.slice(2)];
const testStatus = run(process.execPath, [jestBin, ...jestArgs]);

if (testStatus !== 0 && process.env.CI) {
  // In CI the stack is gone after this script, so capture its logs while we can.
  compose('logs', '--no-color', ...SERVICES);
}

removeStack();
process.exit(testStatus);
