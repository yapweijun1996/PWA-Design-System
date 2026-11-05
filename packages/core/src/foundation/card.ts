import type { Component } from '../types.js';
import { choice, requiredText } from './shared.js';

/** Noninteractive container with optional accessible label. Default variant is outlined. */
export interface CardOptions { label?: string; variant?: 'outlined' | 'elevated' }
export function createCard(options: CardOptions = {}): Component<HTMLElement> {
  if (!options || typeof options !== 'object') throw new TypeError('options must be an object');
  const variant = choice(options.variant, ['outlined', 'elevated'], 'outlined', 'variant');
  const element = document.createElement('section');
  element.className = 'ds-card';
  element.dataset.variant = variant;
  if (options.label !== undefined) element.setAttribute('aria-label', requiredText(options.label, 'label'));
  return { element, destroy() {} };
}
