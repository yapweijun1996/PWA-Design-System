import type { Component } from '../types.js';
import { assertLabel, updateDescription } from './shared.js';
/** Native radios grouped by fieldset and visible legend. Defaults no selection, enabled. */
export interface RadioOption { value: string; label: string; disabled?: boolean }
export interface RadioGroupOptions { id: string; legend: string; name: string; options: readonly RadioOption[]; value?: string; disabled?: boolean; required?: boolean; error?: string }
export interface RadioGroupComponent extends Component<HTMLFieldSetElement> { inputs: readonly HTMLInputElement[]; setError(message?: string): void }
export function createRadioGroup(options: RadioGroupOptions): RadioGroupComponent {
  assertLabel(options.legend); assertLabel(options.name);
  if (typeof options.id !== 'string' || !/^[A-Za-z][A-Za-z0-9_.:-]*$/.test(options.id)) throw new Error('Invalid group id');
  if (!Array.isArray(options.options) || !options.options.length) throw new Error('Radio group requires options');
  const fieldset = document.createElement('fieldset'), legend = document.createElement('legend');
  fieldset.className = 'ds-radio-group'; fieldset.disabled = options.disabled ?? false; legend.textContent = options.legend; fieldset.append(legend);
  const values = new Set<string>(), inputs: HTMLInputElement[] = [];
  for (const item of options.options) {
    if (typeof item.value !== 'string' || values.has(item.value)) throw new Error('Radio values must be unique strings');
    assertLabel(item.label); values.add(item.value);
    const label = document.createElement('label'), input = document.createElement('input'), text = document.createElement('span');
    label.className = 'ds-choice'; input.type = 'radio'; input.name = options.name; input.value = item.value;
    input.disabled = item.disabled ?? false; input.required = options.required ?? false; input.checked = item.value === options.value;
    text.textContent = item.label; label.append(input, text); fieldset.append(label); inputs.push(input);
  }
  if (options.value !== undefined && !values.has(options.value)) throw new Error('Selected value is not in the options');
  const error = document.createElement('span'); error.id = `${options.id}--error`; error.className = 'ds-field__error'; error.setAttribute('aria-live', 'polite'); fieldset.append(error);
  function setError(message = ''): void {
    if (typeof message !== 'string') throw new Error('Error must be text');
    error.textContent = message;
    for (const input of inputs) {
      updateDescription(input, error.id, Boolean(message));
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  }
  setError(options.error);
  return { element: fieldset, inputs, setError, destroy() {} };
}
