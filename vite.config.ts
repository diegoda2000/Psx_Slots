import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Multi-página: cada slot es una página y un bundle independiente.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        duelo: resolve(import.meta.dirname, 'duelo/index.html'),
        olimpo: resolve(import.meta.dirname, 'olimpo/index.html'),
      },
    },
  },
});
