import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { platform, arch } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

/** Fingerprint the OS, installed fonts and bundled Chromium used by visual baselines. */
export async function visualEnvironment() {
  if (platform() !== 'linux') throw new Error('Visual baseline capture and comparison require Linux.');
  const release = await readFile('/etc/os-release', 'utf8');
  const osId = release.match(/^ID=(.+)$/m)?.[1]?.replaceAll('"', '');
  const osVersion = release.match(/^VERSION_ID=(.+)$/m)?.[1]?.replaceAll('"', '');
  if (!osId || !osVersion) throw new Error('Cannot identify Linux distribution');
  const fontPaths = [...new Set(execFileSync('fc-list', ['--format', '%{file}\n'], { encoding: 'utf8' }).split('\n').filter(Boolean))].sort();
  if (!fontPaths.length) throw new Error('No system fonts found');
  const fonts = createHash('sha256');
  for (const path of fontPaths) { fonts.update(path).update('\0'); fonts.update(await readFile(path)); }
  const browser = await chromium.launch();
  let chromiumVersion;
  try { chromiumVersion = browser.version(); } finally { await browser.close(); }
  const packagePath = fileURLToPath(new URL('../../node_modules/@playwright/test/package.json', import.meta.url));
  const playwright = JSON.parse(await readFile(packagePath, 'utf8')).version;
  return { platform: platform(), arch: arch(), osId, osVersion, playwright, chromium: chromiumVersion, fontsSha256: fonts.digest('hex'), deviceScaleFactor: 1, locale: 'en-US', timezone: 'UTC', reducedMotion: 'reduce' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 3 || process.argv[2] !== '--capture') { console.error('Usage: node tests/visual/environment.mjs --capture'); process.exitCode = 1; }
  else visualEnvironment().then(async data => { const path = new URL('./baselines/environment.json', import.meta.url); await writeFile(path, `${JSON.stringify(data, null, 2)}\n`); console.log(JSON.stringify(data, null, 2)); }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
