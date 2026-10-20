import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
    chunkSizeWarningLimit: 1600
  },
  test: { include: ['tests/*.test.ts'] }
});
