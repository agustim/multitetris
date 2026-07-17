import { defineConfig } from 'vite';

export default defineConfig({
  base: '/multitetris/',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    target: 'esnext',
  },
});
