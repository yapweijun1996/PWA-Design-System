import type { Component } from '../types.js';
import { applyControlOptions, type ControlOptions } from './shared.js';
/** Text, email, password, search, tel or URL input; default text, empty, enabled, md. Use Form Field for errors. */
export interface InputOptions extends ControlOptions {
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
  value?: string;
  placeholder?: string;
}
export function createInput(options: InputOptions): Component<HTMLInputElement> {
  const input = document.createElement('input');
  const type = options.type ?? 'text';
  if (!['text', 'email', 'password', 'search', 'tel', 'url'].includes(type)) throw new Error('Unsupported input type');
  input.type = type;
  applyControlOptions(input, options);
  input.value = options.value ?? '';
  if (options.placeholder !== undefined) input.placeholder = options.placeholder;
  return { element: input, destroy() {} };
}
