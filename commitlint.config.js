// Conventional Commits enforcement (see CONTRIBUTING.md "Commits").
// The changelog is generated from commit history by release-please (Phase 5),
// so the `type(scope): summary` subject is what gets parsed.

/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'chore',
        'docs',
        'refactor',
        'test',
        'build',
        'ci',
        'perf',
        'style',
        'revert',
      ],
    ],
    // AI-assisted commits carry a `Co-Authored-By:` trailer and often a longer
    // body pasted from the task/AI log; don't reject those on line length.
    'body-max-line-length': [0, 'always', Infinity],
    'footer-max-line-length': [0, 'always', Infinity],
  },
};
