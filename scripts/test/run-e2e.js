#!/usr/bin/env node
// Runs the Playwright journeys: a fresh throwaway stack, the app exported for web
// against that stack, then a real browser.
//
//   npm run test:e2e                      # all journeys
//   npm run test:e2e -- --headed          # extra args go to Playwright
//   KEEP_STACK=1 npm run test:e2e         # leave the stack up to inspect it

const { env, finish, run, startStack } = require('./stack');

const WEB_DIR = 'dist/e2e/web';

startStack();

// EXPO_PUBLIC_* values are baked in at export time, which is why this happens after the
// stack's URL is known rather than as a separate build step.
console.log('[e2e] exporting the app for web ...');
// Through node rather than node_modules/.bin, whose shims don't spawn on Windows.
const exportStatus = run(process.execPath, [
  require.resolve('expo/bin/cli'),
  'export',
  '--platform',
  'web',
  '--output-dir',
  WEB_DIR,
]);
if (exportStatus !== 0) finish(exportStatus);

env.E2E_WEB_DIR = WEB_DIR;
finish(
  run(process.execPath, [
    require.resolve('@playwright/test/cli'),
    'test',
    ...process.argv.slice(2),
  ]),
);
