#!/usr/bin/env node
// Runs the API integration tests against a brand-new, throwaway Supabase stack,
// then deletes it. Used locally and by CI.
//
//   npm run test:integration                     # all of them
//   npm run test:integration -- src/lib/db/chat  # extra args go to Jest
//   KEEP_STACK=1 npm run test:integration        # leave the stack up to inspect it
//
// For quick reruns against a stack you already have running, use
// `npm run test:integration:dev` instead.

const { finish, run, startStack } = require('./stack');

startStack();

const jestBin = require.resolve('jest/bin/jest');
const jestArgs = ['--selectProjects', 'integration', '--runInBand', ...process.argv.slice(2)];
finish(run(process.execPath, [jestBin, ...jestArgs]));
