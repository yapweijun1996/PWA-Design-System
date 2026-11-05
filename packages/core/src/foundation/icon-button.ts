import type { Component } from '../types.js';
import { action, requiredText, type ActionOptions } from './shared.js';

/** `label` names the action; `icon` is a plain-text glyph, never HTML. */
export interface IconButtonOptions extends ActionOptions { label: string; icon: string }

export function createIconButton(options: IconButtonOptions): Component<HTMLButtonElement> {
  if (!options || typeof options !== 'object') throw new TypeError('options must be an object');
  const label = requiredText(options.label, 'label');
  const icon = requiredText(options.icon, 'icon');
  const component = action(options, 'ds-icon-button');
  component.element.setAttribute('aria-label', label);
  const glyph = document.createElement('span');
  glyph.setAttribute('aria-hidden', 'true');
  glyph.textContent = icon;
  component.element.append(glyph);
  return component;
}
