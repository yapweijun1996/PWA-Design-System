import { build, defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const studioRoot = fileURLToPath(new URL('.', import.meta.url));
const prepaintEntry = fileURLToPath(new URL('./src/features/tokens/prepaint.ts', import.meta.url));
const base = '/PWA-Design-System/';
const target = ['chrome114', 'edge114', 'firefox125', 'safari17'];

function staticFiles(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const file = join(folder, entry.name);
    return entry.isDirectory() ? staticFiles(file) : [file];
  });
}

function serviceWorker(): Plugin {
  return {
    name: 'studio-service-worker',
    apply: 'build',
    enforce: 'post',
    writeBundle(output) {
      if (!output.dir) throw new Error('Studio build requires an output directory');
      const outputDir = output.dir;
      const entries: [string, Uint8Array][] = staticFiles(outputDir)
        .filter(path => relative(outputDir, path).replaceAll('\\', '/') !== 'sw.js')
        .map(path => [relative(outputDir, path).replaceAll('\\', '/'), readFileSync(path)]);
      entries.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
      const template = readFileSync(join(studioRoot, 'src/features/pwa/sw-template.js'), 'utf8');
      const hash = createHash('sha256').update(template);
      for (const [name, source] of entries) hash.update(name).update(source);
      const version = hash.digest('hex').slice(0, 20);
      const indexFile = join(outputDir, 'index.html');
      const index = readFileSync(indexFile, 'utf8');
      if (!index.includes('__STUDIO_VERSION__')) throw new Error('Missing Studio version marker');
      const finalIndex = index.replace('__STUDIO_VERSION__', version);
      writeFileSync(indexFile, finalIndex);
      const files = entries.map(([name, source]) => ({
        url: `${base}${name}`,
        sha256: createHash('sha256').update(name === 'index.html' ? finalIndex : source).digest('hex')
      }));
      writeFileSync(join(outputDir, 'sw.js'), template.replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(files)));
    }
  };
}

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
  plugins: [tokenPrepaint(), serviceWorker()],
  build: {
    outDir: '../../dist/studio',
    emptyOutDir: true,
    target
  }
});
