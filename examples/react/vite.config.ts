import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  esbuild: { jsx: 'automatic' },
  server: { fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] } },
  resolve: { dedupe: ['react', 'react-dom'] },
  build: { outDir: '../../dist/react-example', emptyOutDir: true }
});
