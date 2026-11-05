import type { Component } from '../types.js';
import { applyControlOptions, assertLabel, type ControlOptions } from './shared.js';
/** Native single select; defaults enabled, md, browser-selected first available option. */
export interface SelectOption { value: string; label: string; disabled?: boolean }
export interface SelectOptions extends ControlOptions { options: readonly SelectOption[]; value?: string }
export function createSelect(options: SelectOptions): Component<HTMLSelectElement> {
  if (!Array.isArray(options.options) || !options.options.length) throw new Error('Select requires at least one option');
  const select = document.createElement('select'); applyControlOptions(select, options);
  const values = new Set<string>();
  for (const item of options.options) {
    if (typeof item.value !== 'string' || values.has(item.value)) throw new Error('Select values must be unique strings');
    assertLabel(item.label); values.add(item.value);
    const option = document.createElement('option'); option.value = item.value; option.textContent = item.label; option.disabled = item.disabled ?? false; select.append(option);
  }
  if (options.value !== undefined) {
    if (!values.has(options.value)) throw new Error('Selected value is not in the options');
    select.value = options.value;
  }
  return { element: select, destroy() {} };
}
