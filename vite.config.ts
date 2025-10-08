// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // baca dari env jika ada, fallback ke subfolder repo untuk GitHub Pages
  base: process.env.VITE_BASE_URL || '/emoji-game/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
});
