// Unit-test runner for the Expo app. `jest-expo` wires up the React Native /
// Expo module mocks and Babel transform; we only add coverage scope and a floor.

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',

  setupFiles: ['<rootDir>/jest.setup.js'],

  // jest-expo ships CJS/ESM RN + Expo packages that must be transformed rather
  // than treated as plain node_modules. This is the list from the jest-expo docs.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg))',
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
  ],

  // An honest floor so CI can enforce "tests exist and run", not a real target.
  // Raise this deliberately as coverage grows.
  coverageThreshold: {
    global: {
      lines: 5,
    },
  },
};
