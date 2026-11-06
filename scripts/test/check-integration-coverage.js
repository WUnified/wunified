#!/usr/bin/env node
// Keeps the honeycomb from drifting: every src/lib/db module that talks to Supabase
// needs its own integration suite, because mocked tests can't see RLS, triggers, or
// RPCs. This only checks that a suite exists; reviewers judge whether it's thorough.
// See knowledge/testing-strategy.md.

const fs = require('node:fs');
const path = require('node:path');

const DB_DIR = path.resolve(__dirname, '../../src/lib/db');

// Each exemption needs a reason. Add to this list sparingly.
const EXEMPT = {
  'authErrors.ts': 'pure classifier; exercised against real GoTrue through the repositories',
  'clubTestClient.ts': 'test helper',
  'club_shared.ts': 'shared helpers; exercised through clubs and club_memberships suites',
  'imagePaths.ts': 'pure path helpers with no Supabase access',
  'index.ts': 'barrel',
};

function isModule(file) {
  return file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.d.ts');
}

const files = fs.readdirSync(DB_DIR);
const missing = files
  .filter((file) => isModule(file) && !(file in EXEMPT))
  .filter((file) => !files.includes(file.replace(/\.ts$/, '.int.test.ts')));

const staleExemptions = Object.keys(EXEMPT).filter((file) => !files.includes(file));

if (missing.length === 0 && staleExemptions.length === 0) {
  console.log('[check-integration-coverage] every src/lib/db module has an integration suite.');
  process.exit(0);
}

for (const file of missing) {
  console.error(
    `[check-integration-coverage] src/lib/db/${file} has no ${file.replace(/\.ts$/, '.int.test.ts')}.`,
  );
}
for (const file of staleExemptions) {
  console.error(`[check-integration-coverage] exemption for ${file} no longer matches a file.`);
}
console.error(
  '[check-integration-coverage] Add the suite (see ai/skills/test-agent.md), or a justified exemption in this script.',
);
process.exit(1);
