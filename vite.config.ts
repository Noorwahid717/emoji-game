import { defineConfig } from 'vite';

const resolveBase = (): string => {
  const explicit = process.env.VITE_BASE_URL ?? process.env.BASE_URL ?? '';
  return explicit || '';
};

export default defineConfig({
  base: resolveBase(),
  server: {
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('phaser')) {
              return 'phaser';
            }
            return 'vendor';
          }
          if (id.includes('/src/scenes/')) {
            return 'scenes';
          }
          return undefined;
        },
      },
    },
  },
});
