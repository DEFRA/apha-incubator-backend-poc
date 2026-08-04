import neostandard from 'neostandard'

export default [
  ...neostandard({
    env: ['node', 'vitest'],
    ignores: [...neostandard.resolveIgnoresFromGitignore(), 'dist'],
    ts: true,
    noJsx: true,
    noStyle: true
  }),
  {
    files: ['**/*.ts'],
    rules: {
      // Enforce the AGENTS.md TypeScript subset
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error'
    }
  }
]
