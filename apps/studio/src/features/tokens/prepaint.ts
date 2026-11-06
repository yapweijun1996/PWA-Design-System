import { emptyProject, parseStoredProject, projectCSS, projectJSON, validateProject } from '../../../../../packages/tokens/src/engine.mjs';
import { contrastFailures, currentCombination } from './model';
import { sources } from './sources';

// Bundled as a blocking script. Stored data and system chrome share validated semantic values.
let chromeValues = validateProject(sources, emptyProject());
try {
  const text = localStorage.getItem('pwa-ds-token-overrides-v1');
  if (text !== null) {
    const { project, combinations, removedBreakpoints } = parseStoredProject(sources, text);
    if (Object.values(project.overrides).some(scope => Object.keys(scope).length) && contrastFailures(combinations).length === 0) {
      chromeValues = combinations;
      const style = document.createElement('style');
      style.id = 'pwa-ds-prepaint-overrides';
      if (removedBreakpoints.length) style.dataset.legacyBreakpoints = 'true';
      style.dataset.tokenConfig = projectJSON(project);
      style.textContent = projectCSS(combinations);
      document.head.append(style);
    }
  }
} catch {
  // An unavailable or invalid store cannot override the repository defaults.
}

const surface = String(currentCombination(chromeValues)['color.surface']);
if (/^#[a-f0-9]{6}$/i.test(surface)) document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', surface);
document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', document.documentElement.dataset.theme === 'dark' ? 'black' : 'default');
