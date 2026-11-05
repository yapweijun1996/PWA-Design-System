import { build, defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';

const studioRoot = fileURLToPath(new URL('.', import.meta.url));
const prepaintEntry = fileURLToPath(new URL('./src/features/tokens/prepaint.ts', import.meta.url));
const base = '/PWA-Design-System/';
const target = ['chrome114', 'edge114', 'firefox125', 'safari17'];

async function bundlePrepaint(): Promise<string> {
  const result = await build({
    configFile: false,
    root: studioRoot,
    publicDir: false,
    logLevel: 'silent',
    build: {
      write: false,
      target,
      lib: { entry: prepaintEntry, name: 'TokenPrepaint', formats: ['iife'] },
      rollupOptions: { output: { inlineDynamicImports: true } }
    }
  });
  if (Array.isArray(result) && result.length !== 1) throw new Error('Unexpected prepaint build output');
  const output = Array.isArray(result) ? result[0] : result;
  if (!('output' in output)) throw new Error('Unexpected prepaint build output');
  const chunks = output.output.filter(item => item.type === 'chunk');
  if (chunks.length !== 1 || output.output.length !== 1) throw new Error('Prepaint must build to one self-contained script');
  return chunks[0].code;
}

function tokenPrepaint(): Plugin {
  return {
    name: 'studio-token-prepaint',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        return context.server ? html : html.replace('src="/token-prepaint.js"', `src="${base}token-prepaint.js"`);
      }
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split('?')[0];
        if (request.method !== 'GET' || (pathname !== `${base}token-prepaint.js` && pathname !== '/token-prepaint.js')) { next(); return; }
        void bundlePrepaint().then(code => {
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
          response.setHeader('Cache-Control', 'no-store');
          response.end(code);
        }).catch(next);
      });
    },
    async generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'token-prepaint.js', source: await bundlePrepaint() });
    }
  };
}

export default defineConfig({
  root: studioRoot,
  base,
  plugins: [tokenPrepaint()],
  build: {
    outDir: '../../dist/studio',
    emptyOutDir: true,
    target
  }
});
