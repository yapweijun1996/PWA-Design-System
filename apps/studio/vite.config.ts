import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/PWA-Design-System/',
  build: {
    outDir: '../../dist/studio',
    emptyOutDir: true,
    target: ['chrome107', 'edge107', 'firefox104', 'safari16']
  }
});
