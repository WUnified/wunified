// Integration tests talk to the same local stack the app uses, so they read the
// same `.env` (`cp .env.example .env`). Values already exported in the shell or
// CI win, because process.loadEnvFile never overrides an existing variable.
const fs = require('node:fs');
const path = require('node:path');

const envPath = path.resolve(__dirname, '../../../.env');

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}
