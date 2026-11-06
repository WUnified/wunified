// Two Jest projects share this config. `unit` is the fast, offline suite that runs
// on every commit; `integration` calls the real local Supabase stack (see
// knowledge/testing-strategy.md) and is opt-in via `npm run test:integration`.

// jest-expo ships CJS/ESM RN + Expo packages that must be transformed rather
// than treated as plain node_modules. This is the list from the jest-expo docs.
const transformIgnorePatterns = [
  'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg))',
];

const INTEGRATION_TEST_PATTERN = '<rootDir>/src/**/*.int.test.ts';

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'unit',
      preset: 'jest-expo',
      setupFiles: ['<rootDir>/jest.setup.js'],
      transformIgnorePatterns,
      testPathIgnorePatterns: ['/node_modules/', '\\.int\\.test\\.ts$'],
    },
    {
      displayName: 'integration',
      // Deliberately not the jest-expo preset: its setup swaps global `fetch` for a
      // stubbed `expo/fetch`, so real HTTP calls to the local stack would return
      // nothing. These tests only exercise src/lib/db, which needs plain Node.
      testEnvironment: 'node',
      transform: {
        '\\.[jt]sx?$': ['babel-jest', { presets: [require.resolve('expo/internal/babel-preset')] }],
      },
      moduleNameMapper: {
        // Pulls in `react-native`; Node already ships a spec-compliant URL.
        '^react-native-url-polyfill/auto$': '<rootDir>/src/test/integration/noopModule.js',
        // Loads the Expo runtime, which needs React Native globals.
        '^expo-crypto$': '<rootDir>/src/test/integration/expoCryptoNode.js',
      },
      setupFiles: ['<rootDir>/jest.setup.js', '<rootDir>/src/test/integration/loadEnv.js'],
      globalSetup: '<rootDir>/src/test/integration/globalSetup.js',
      // babel-preset-expo rewrites `process.env.EXPO_PUBLIC_*` to an ESM import
      // from `expo/virtual/env`, so `expo` must be transformed here too.
      transformIgnorePatterns,
      testMatch: [INTEGRATION_TEST_PATTERN],
    },
  ],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    // Barrels and type-only modules have no behaviour to cover.
    '!**/index.ts',
    '!**/types.ts',
    // Generated from the Supabase schema; not a coverage target.
    '!src/types/**',
    // Test helpers, not product code.
    '!src/test/**',
    // The unit project doesn't run these, so they'd otherwise count as uncovered code.
    '!**/*.int.test.ts',
    // Proven by the integration project, which this unit-only report can't see. Listed by
    // name so a new module, or a pure one like imagePaths.ts, still counts here.
    '!src/lib/db/{board_posts,chat,chatInbox,clubTestClient,club_memberships,club_shared,clubs,events,listings,profiles,storage}.ts',
  ],

  // A floor that catches a real drop in unit coverage, not a target. src/lib/db is
  // excluded above, so this measures only the code the integration layer can't reach.
  coverageThreshold: {
    global: {
      lines: 65,
    },
  },
};
