import { createInput } from '../../../../../packages/core/src/forms/input.js';
import { createFormField } from '../../../../../packages/core/src/forms/form-field.js';
import '../../../../../packages/core/src/forms/forms.css';
import { contrastRatio } from './contrast.js';
import './styles.css';

function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag); if (text !== undefined) result.textContent = text; return result;
}

export function mountAccessibilityLab(root: HTMLElement): () => void {
  const controller = new AbortController();
  const section = node('section'); section.className = 'accessibility-lab';
  const title = node('h1', 'Accessibility Lab');
  const introduction = node('p', 'Check a pair of opaque sRGB colors and plan the manual checks that automated tools cannot complete.');
  const workspace = node('div'); workspace.className = 'accessibility-lab__workspace';
  const controls = node('section'); controls.className = 'accessibility-lab__panel';
  controls.append(node('h2', 'Contrast calculator'), node('p', 'Enter six-digit hex colors, for example #000000. Changes are checked as you type.'));
  const foreground = createInput({ id: 'contrast-foreground', value: '#000000' });
  const background = createInput({ id: 'contrast-background', value: '#ffffff' });
  foreground.element.autocomplete = background.element.autocomplete = 'off';
  foreground.element.spellcheck = background.element.spellcheck = false;
  const fgField = createFormField({ label: 'Foreground color', control: foreground.element });
  const bgField = createFormField({ label: 'Background color', control: background.element });
  controls.append(fgField.element, bgField.element);
  const resultPanel = node('section'); resultPanel.className = 'accessibility-lab__panel';
  resultPanel.append(node('h2', 'Result'));
  const result = node('div'); result.setAttribute('role', 'status'); result.setAttribute('aria-live', 'polite');
  const preview = node('div', 'Preview text'); preview.className = 'accessibility-lab__preview'; preview.setAttribute('aria-hidden', 'true');
  const note = node('p', 'Checks compare the unrounded ratio. Large text generally means at least 18 pt regular or 14 pt bold. Non-text contrast applies to visual information required to identify controls and states.');
  note.className = 'accessibility-lab__note'; resultPanel.append(result, preview, note);
  workspace.append(controls, resultPanel);
  const manual = node('section'); manual.className = 'accessibility-lab__manual';
  manual.append(node('h2', 'Manual checks'), node('p', 'Status: NOT VERIFIED. Record the browser, operating system, assistive technology, version, date and outcome for each check.'));
  const list = node('ul');
  for (const item of [
    'Use a screen reader to verify names, roles, state changes, error messages and announcements.',
    'Use only the keyboard to navigate, operate controls, close overlays and verify focus returns.',
    'Check desktop, tablet and mobile layouts, touch targets, text enlargement and 200% zoom.',
    'Check reduced motion, focus visibility and contrast for actual adjacent colors and component states.'
  ]) list.append(node('li', item));
  manual.append(list, node('p', 'This calculator checks two opaque colors only. It does not evaluate transparency, gradients, images, fonts, focus area or an entire page, and does not establish WCAG conformance.'));
  section.append(title, introduction, workspace, manual); root.replaceChildren(section);
  function update(): void {
    const fg = foreground.element.value.trim(), bg = background.element.value.trim();
    const fgValid = /^#[0-9a-f]{6}$/i.test(fg), bgValid = /^#[0-9a-f]{6}$/i.test(bg);
    fgField.setError(fgValid ? '' : 'Enter a six-digit hex color such as #000000.');
    bgField.setError(bgValid ? '' : 'Enter a six-digit hex color such as #ffffff.');
    const ratio = contrastRatio(fg, bg);
    result.replaceChildren();
    if (ratio === null) { result.append(node('p', 'Enter two valid colors to calculate a ratio.')); preview.hidden = true; return; }
    preview.hidden = false; preview.style.color = fg; preview.style.backgroundColor = bg;
    const number = node('p', `${ratio.toFixed(2)}:1`); number.className = 'accessibility-lab__ratio'; result.append(number);
    const outcomes = node('ul');
    for (const [label, minimum] of [['Normal text', 4.5], ['Large text', 3], ['Applicable non-text', 3]] as const) {
      outcomes.append(node('li', `${label}: ${ratio >= minimum ? 'Meets' : 'Below'} ${minimum}:1`));
    }
    result.append(outcomes);
  }
  foreground.element.addEventListener('input', update, { signal: controller.signal });
  background.element.addEventListener('input', update, { signal: controller.signal });
  update();
  return () => { controller.abort(); fgField.destroy(); bgField.destroy(); foreground.destroy(); background.destroy(); section.remove(); };
}
