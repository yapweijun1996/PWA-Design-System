import type { Component } from '../types.js';
import { applyControlOptions, assertLabel, updateDescription, type ControlOptions } from './shared.js';
/** Native checkbox with visible label. Defaults: unchecked, enabled, md, no error. */
export interface CheckboxOptions extends Omit<ControlOptions, 'ariaLabel'> { label: string; checked?: boolean; value?: string; error?: string }
export interface CheckboxComponent extends Component<HTMLDivElement> { input: HTMLInputElement; setError(message?: string): void }
export function createCheckbox(options: CheckboxOptions): CheckboxComponent {
  assertLabel(options.label);
  const root = document.createElement('div'), label = document.createElement('label'), input = document.createElement('input'), text = document.createElement('span'), error = document.createElement('span');
  input.type = 'checkbox'; applyControlOptions(input, options); input.classList.remove('ds-control');
  input.checked = options.checked ?? false;
  if (options.value !== undefined) input.value = options.value;
  text.textContent = options.label; label.className = 'ds-choice'; label.append(input, text);
  root.className = 'ds-field'; error.id = `${options.id}--error`; error.className = 'ds-field__error'; error.setAttribute('aria-live', 'polite'); root.append(label, error);
  function setError(message = ''): void {
    if (typeof message !== 'string') throw new Error('Error must be text');
    error.textContent = message;
    updateDescription(input, error.id, Boolean(message));
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
  setError(options.error);
  return { element: root, input, setError, destroy() {} };
}
