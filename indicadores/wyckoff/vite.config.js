import {resolve} from 'node:path';
import {defineConfig} from 'vite';

// La demo vive en demo/. Rutas relativas (base './') para que funcione en GitHub Pages bajo /videos-trading/.
export default defineConfig({
  root: resolve(import.meta.dirname, 'demo'),
  base: './',
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'demo/index.html'),
        grafico: resolve(import.meta.dirname, 'demo/grafico.html'),
      },
    },
  },
});
