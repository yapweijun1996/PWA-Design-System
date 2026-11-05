import type { Component } from '../types.js';
import { choice, requiredText } from './shared.js';

/** Noninteractive label; default variant is neutral. */
export interface BadgeOptions { label: string; variant?: 'neutral' | 'primary' | 'success' | 'danger' }
export function createBadge(options: BadgeOptions): Component<HTMLSpanElement> {
  if (!options || typeof options !== 'object') throw new TypeError('options must be an object');
  const label = requiredText(options.label, 'label');
  const variant = choice(options.variant, ['neutral', 'primary', 'success', 'danger'], 'neutral', 'variant');
  const element = document.createElement('span');
  element.className = 'ds-badge';
  element.dataset.variant = variant;
  element.textContent = label;
  return { element, destroy() {} };
}
