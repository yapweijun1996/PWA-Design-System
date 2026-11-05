import type { Component } from '../types.js';
import { assertLabel } from './shared.js';
/** Associates a visible label, optional description and error with a native input, textarea or select.
 * The control must have a unique ID. Default: no description or error. setError('') clears the error. */
export interface FormFieldOptions { label: string; control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement; description?: string; error?: string }
export interface FormFieldComponent extends Component<HTMLDivElement> { setError(message?: string): void }
export function createFormField(options: FormFieldOptions): FormFieldComponent {
  assertLabel(options.label);
  const control = options.control;
  if (!control || !['INPUT', 'TEXTAREA', 'SELECT'].includes(control.tagName) || !/^[A-Za-z][A-Za-z0-9_.:-]*$/.test(control.id)) throw new Error('A labelable control with a valid unique id is required');
  if (control.hasAttribute('aria-label') || control.hasAttribute('aria-labelledby')) throw new Error('Form Field requires a control without an overriding accessible name');
  if (control instanceof HTMLInputElement && ['hidden', 'checkbox', 'radio'].includes(control.type)) throw new Error('Use the checkbox or radio-group label instead');
  if (options.description !== undefined && typeof options.description !== 'string') throw new Error('Description must be text');
  if (options.error !== undefined && typeof options.error !== 'string') throw new Error('Error must be text');
  const root = document.createElement('div'), label = document.createElement('label'), description = document.createElement('span'), error = document.createElement('span');
  const originalInvalid = control.getAttribute('aria-invalid');
  root.className = 'ds-field'; label.className = 'ds-field__label'; label.htmlFor = control.id; label.textContent = options.label;
  description.id = `${control.id}--description`; description.className = 'ds-field__description'; description.textContent = options.description ?? '';
  error.id = `${control.id}--error`; error.className = 'ds-field__error'; error.setAttribute('aria-live', 'polite');
  root.append(label, control);
  if (options.description) root.append(description);
  root.append(error);
  function setError(message = ''): void {
    if (typeof message !== 'string') throw new Error('Error must be text');
    error.textContent = message;
    const ids = (control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(id => id && id !== description.id && id !== error.id);
    if (options.description) ids.push(description.id);
    if (message) ids.push(error.id);
    if (ids.length) control.setAttribute('aria-describedby', ids.join(' ')); else control.removeAttribute('aria-describedby');
    if (message) control.setAttribute('aria-invalid', 'true');
    else if (originalInvalid !== null) control.setAttribute('aria-invalid', originalInvalid); else control.removeAttribute('aria-invalid');
  }
  setError(options.error);
  return { element: root, setError, destroy() {
    const ids = (control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(id => id && id !== description.id && id !== error.id);
    if (ids.length) control.setAttribute('aria-describedby', ids.join(' ')); else control.removeAttribute('aria-describedby');
    if (originalInvalid === null) control.removeAttribute('aria-invalid'); else control.setAttribute('aria-invalid', originalInvalid);
  } };
}
