import { createButton, createCard, createInput, createAlert, createDialog, createDataTable, type Component } from '../../../../../packages/core/src/index.js';
import type { TokenMap } from '../../../../../packages/tokens/src/engine.mjs';
import { contrastRatio } from '../accessibility/contrast';
import { setTokenMap } from './model';
import type { PreviewTheme } from './editor-utils';
import '../../../../../packages/core/src/foundation/foundation.css';
import '../../../../../packages/core/src/forms/forms.css';
import '../../../../../packages/core/src/navigation/navigation.css';
import '../../../../../packages/core/src/feedback/feedback.css';
import '../../../../../packages/core/src/table/table.css';
export interface TokenScene { element: HTMLElement; update(values: TokenMap, theme: PreviewTheme, retained: boolean, contrastInvalid?: boolean): void; destroy(): void }
let sceneId = 0;
export function createTokenScene(comparison = false): TokenScene {
  const components: Component[] = [], controller = new AbortController();
  const element = document.createElement('section'); element.className = 'token-editor__preview'; element.setAttribute('aria-label', comparison ? 'Other theme preview' : 'Token preview');
  const title = document.createElement('h3'); title.textContent = 'Workspace preview';
  const mode = document.createElement('p'); mode.className = 'token-editor__preview-mode';
  const card = createCard({ label: comparison ? 'Comparison example card' : 'Example card', variant: 'elevated' }); components.push(card);
  const description = document.createElement('p'); description.textContent = 'See how the same tokens shape real components.';
  const buttons = document.createElement('div'); buttons.className = 'token-editor__preview-actions';
  for (const options of [{ label: 'Preview action' }, { label: 'Disabled', disabled: true }, { label: 'Loading', loading: true }]) { const component = createButton(options); components.push(component); buttons.append(component.element); }
  const label = document.createElement('label'); label.textContent = 'Example input';
  const input = createInput({ id: `token-preview-input-${++sceneId}`, placeholder: 'Type to try the input' }); components.push(input); label.htmlFor = input.element.id;
  card.element.append(title, description, buttons, label, input.element);
  const alert = createAlert({ message: 'Changes are previewed before they are saved.', tone: 'info' }); components.push(alert);
  const dialog = createDialog({ title: 'Preview dialog', description: 'This dialog uses the current preview tokens.' }); components.push(dialog);
  const opener = createButton({ label: 'Open preview dialog', variant: 'secondary' }); components.push(opener);
  opener.element.addEventListener('click', () => dialog.open(opener.element), { signal: controller.signal });
  const table = createDataTable({ label: 'Example table', columns: [{ id: 'name', label: 'Item', sortable: true }, { id: 'status', label: 'Status' }], rows: [{ id: 'one', cells: { name: 'Design tokens', status: 'Ready' } }, { id: 'two', cells: { name: 'Components', status: 'Ready' } }], pageSize: 2 }); components.push(table);
  const contrast = document.createElement('ul'); contrast.className = 'token-editor__contrast'; contrast.setAttribute('aria-label', comparison ? 'Comparison contrast checks' : 'Preview contrast checks');
  element.append(mode, card.element, alert.element, opener.element, dialog.element, table.element, contrast);
  return {
    element,
    update(values, theme, retained, contrastInvalid) {
      setTokenMap(element, values); element.style.colorScheme = theme;
      mode.textContent = `${theme === 'light' ? 'Light' : 'Dark'} theme${retained ? ' · last valid preview retained' : contrastInvalid ? ' · draft has contrast issues' : ' · draft preview'}`;
      const items: HTMLLIElement[] = [];
      for (const [name, foreground, background, minimum] of [['Text / surface', 'color.text', 'color.surface', 4.5], ['Primary label / primary', 'color.on-primary', 'color.primary', 4.5], ['Focus / surface', 'color.focus', 'color.surface', 3]] as const) {
        const ratio = contrastRatio(String(values[foreground]), String(values[background]));
        const item = document.createElement('li'); item.textContent = `${name}: ${ratio === null ? 'unavailable' : `${ratio.toFixed(2)}:1 · ${ratio >= minimum ? 'Pass' : 'Below minimum'}`} (minimum ${minimum}:1)`; items.push(item);
      }
      contrast.replaceChildren(...items);
    },
    destroy() { controller.abort(); for (const component of components) component.destroy(); element.remove(); }
  };
}
