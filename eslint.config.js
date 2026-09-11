// Flat ESLint config for the Expo / React Native / strict-TypeScript codebase.
// Layer order matters: Expo's rules first, then type-checked TypeScript rules and
// our project rules, then Prettier last so formatting never fights ESLint.

const { defineConfig } = require('eslint/config');
const eslintConfigPrettier = require('eslint-config-prettier/flat');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const globals = require('globals');
const tseslint = require('typescript-eslint');

module.exports = defineConfig([
  {
    // Generated, vendored, or build output — nothing here is hand-edited.
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'coverage/**',
      'babel.config.js',
      'metro.config.js',
      'supabase/.temp/**',
      // Regenerated with `supabase gen types typescript`; not worth linting.
      'src/types/database.ts',
    ],
  },

  ...expoConfig,

  // Type-aware rules, scoped to our own TypeScript. `projectService` lets
  // typescript-eslint build the program from tsconfig.json without a file list.
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      // Passing an async handler straight to a JSX prop (onPress={handleLogin}) is
      // idiomatic in React Native; only the void-return-in-attribute check is noise.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      // AGENTS.md import order: external -> internal -> relative, a blank line
      // between groups, alphabetised within each group.
      'import/order': [
        'error',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // SessionProvider initialises its loading/error state inside the bootstrap
  // effect on purpose (the retry path re-runs the same effect). Reworking that
  // flow is out of scope for a tooling change, so silence the newer react-hooks
  // "set state in effect" check for this one file rather than churn auth logic.
  {
    files: ['src/features/auth/SessionProvider.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  // Node-context config files: allow CommonJS globals and `require()`.
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },

  // The Jest setup file runs in Jest's context and uses the ambient `jest`
  // global. Test files instead import their globals from `@jest/globals`.
  {
    files: ['jest.setup.js'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },

  prettierRecommended,
  eslintConfigPrettier,
]);
