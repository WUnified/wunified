// Shared by the integration and end-to-end runners: a throwaway Supabase stack built
// fresh from the committed migrations and seed, so a stale local volume can't fail a run.

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const PROJECT = 'wunified-test';
const SERVICES = ['db', 'auth', 'storage', 'migrate', 'rest', 'gateway'];
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
    console.error(`[test-stack] could not run ${command}: ${result.error.message}`);
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
    console.log(`[test-stack] KEEP_STACK set — stack left running at ${supabaseUrl}.`);
    console.log(`[test-stack] Remove it with: docker compose -p ${PROJECT} down -v`);
    return;
  }
  console.log('[test-stack] removing throwaway stack ...');
  compose('down', '-v', '--remove-orphans');
}

// All runs share one Compose project, so cleaning up an existing stack here could
// delete the database of a run still in progress in another terminal or worktree.
function refuseIfStackExists() {
  const result = spawnSync(
    'docker',
    ['compose', '-p', PROJECT, '--env-file', '.env.example', 'ps', '-aq'],
    { cwd: ROOT, env, encoding: 'utf8' },
  );
  if (result.error || result.status !== 0) {
    console.error('[test-stack] could not reach Docker. Is it running?');
    process.exit(1);
  }
  if (result.stdout.trim()) {
    console.error(
      `[test-stack] a "${PROJECT}" stack already exists: another run may be in progress, or an earlier one was killed or used KEEP_STACK.`,
    );
    console.error(
      `[test-stack] If it isn't in use, remove it with: docker compose -p ${PROJECT} down -v`,
    );
    process.exit(1);
  }
}

function printLogs() {
  compose('logs', '--no-color', ...SERVICES);
}

/** Starts the stack, or exits with its logs if it can't. */
function startStack() {
  refuseIfStackExists();
  // Ctrl-C reaches child processes directly (same process group). Ignoring it here lets
  // the runner survive long enough to remove the stack afterwards.
  process.on('SIGINT', () => {});

  console.log(`[test-stack] starting fresh stack "${PROJECT}" on ${supabaseUrl} ...`);
  const status = compose('up', '-d', '--wait', '--wait-timeout', '300', ...SERVICES);
  if (status !== 0) {
    console.error(
      '[test-stack] stack failed to start. If a port is busy, set TEST_GATEWAY_HOST_PORT / TEST_DB_HOST_PORT. Logs follow.',
    );
    printLogs();
    removeStack();
    process.exit(status);
  }
}

/** Removes the stack and exits, keeping the logs first when a CI run failed. */
function finish(status) {
  // In CI the stack is gone after this, so capture its logs while we can.
  if (status !== 0 && process.env.CI) printLogs();
  removeStack();
  process.exit(status);
}

module.exports = { ROOT, env, finish, run, startStack, supabaseUrl };
