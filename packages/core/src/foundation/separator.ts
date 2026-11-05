import type { Component } from '../types.js';
import { choice } from './shared.js';

/** Native horizontal rule, or a noninteractive vertical separator. Default horizontal. */
export interface SeparatorOptions { orientation?: 'horizontal' | 'vertical' }
export function createSeparator(options: SeparatorOptions = {}): Component<HTMLElement> {
  if (!options || typeof options !== 'object') throw new TypeError('options must be an object');
  const orientation = choice(options.orientation, ['horizontal', 'vertical'], 'horizontal', 'orientation');
  const element = document.createElement(orientation === 'horizontal' ? 'hr' : 'span');
  element.className = 'ds-separator';
  element.dataset.orientation = orientation;
  if (orientation === 'vertical') {
    element.setAttribute('role', 'separator');
    element.setAttribute('aria-orientation', 'vertical');
  }
  return { element, destroy() {} };
}
