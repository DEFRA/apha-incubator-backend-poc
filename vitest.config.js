import { defineConfig, configDefaults } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '#': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'lcov'],
      // Kept as .js temporarily — source is not yet converted to TypeScript.
      // Switch to 'src/**/*.ts' once step 06 (full src conversion) completes.
      include: ['src/**/*.js'],
      exclude: [...configDefaults.exclude, 'coverage', 'dist']
    },
    setupFiles: ['.vite/mongo-memory-server.js', '.vite/setup-files.js']
  }
})
