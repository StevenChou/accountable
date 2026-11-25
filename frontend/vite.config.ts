import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: Number(process.env.ACCOUNTABLE_WEB_PORT || 5173),
    strictPort: true,
    cors: false,
    fs: { allow: ['.', '../node_modules'] },
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.ACCOUNTABLE_API_PORT || 8000}`,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['test/setup.ts'],
    allowOnly: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text'],
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
})
