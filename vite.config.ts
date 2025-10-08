// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/emoji-game/', // ✅ fixed: align base path with GitHub Pages deployment
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
});
