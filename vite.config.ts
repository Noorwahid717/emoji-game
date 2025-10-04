import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/emoji-game/',
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/assets/static/**/*',
          dest: 'assets',
        },
      ],
    }),
  ],
  server: {
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
}));
