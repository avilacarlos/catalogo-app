import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: resolve(__dirname, 'v2/public'),
  build: {
    rollupOptions: {
      input: {
        catalogo: resolve(__dirname, 'index.html'),
      }
    }
  }
});
