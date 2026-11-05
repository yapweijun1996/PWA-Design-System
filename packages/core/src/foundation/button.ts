import type { Component } from '../types.js';
import { action, requiredText, type ActionOptions } from './shared.js';

export interface ButtonOptions extends ActionOptions { label: string }

/** Creates a native button; default type is button, size medium and variant primary. */
export function createButton(options: ButtonOptions): Component<HTMLButtonElement> {
  if (!options || typeof options !== 'object') throw new TypeError('options must be an object');
  const label = requiredText(options.label, 'label');
  const component = action(options, 'ds-text-button');
  component.element.textContent = label;
  return component;
}
