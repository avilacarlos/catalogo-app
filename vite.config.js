import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        menu: resolve(__dirname, 'menu.html'),
        catalogo: resolve(__dirname, 'catalogo.html'),
        eventos: resolve(__dirname, 'v2/eventos.html')
      }
    }
  }
});
