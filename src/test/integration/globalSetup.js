// Fail once, up front, with the fix — instead of every suite timing out with a
// generic fetch error when the local stack isn't running.
require('./loadEnv');

const START_STACK_HINT =
  'Run `npm run test:integration` (starts its own fresh stack), or for test:integration:dev start yours with: cp .env.example .env && docker compose up -d --wait db auth migrate rest gateway';

module.exports = async function globalSetup() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      `Integration tests need EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY. ${START_STACK_HINT}`,
    );
  }

  // Tests sign up users and write listings, posts, and chats. Pointed at hosted
  // Supabase they would pollute real data, so only a local stack is allowed.
  const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];
  if (!LOCAL_HOSTS.includes(new URL(url).hostname)) {
    throw new Error(
      `Refusing to run integration tests against ${url}: they write data and must only target the local stack. Point EXPO_PUBLIC_SUPABASE_URL at http://localhost:54321. ${START_STACK_HINT}`,
    );
  }

  try {
    const response = await fetch(`${url}/auth/v1/health`, { headers: { apikey: anonKey } });
    if (!response.ok) {
      throw new Error(`auth health check returned HTTP ${response.status}`);
    }
  } catch (error) {
    throw new Error(
      `The local Supabase stack is not reachable at ${url} (${error.message}). ${START_STACK_HINT}`,
    );
  }
};
