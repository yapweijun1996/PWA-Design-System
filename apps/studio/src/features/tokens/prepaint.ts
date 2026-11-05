import { parseStoredProject, projectCSS, projectJSON } from '../../../../../packages/tokens/src/engine.mjs';
import { contrastFailures } from './model';
import { sources } from './sources';

// Bundled as a blocking script. Stored data uses the same validation as the editor.
try {
  const text = localStorage.getItem('pwa-ds-token-overrides-v1');
  if (text !== null) {
    const { project, combinations, removedBreakpoints } = parseStoredProject(sources, text);
    if (Object.values(project.overrides).some(scope => Object.keys(scope).length) && contrastFailures(combinations).length === 0) {
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
