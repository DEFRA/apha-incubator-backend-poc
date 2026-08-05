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
      clean: false,
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [...configDefaults.exclude, 'coverage', 'dist', 'src/**/*.d.ts']
    },
    setupFiles: ['.vite/setup-files.js']
  }
})
