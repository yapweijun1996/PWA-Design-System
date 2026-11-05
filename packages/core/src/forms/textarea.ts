import type { Component } from '../types.js';
import { applyControlOptions, type ControlOptions } from './shared.js';
/** Multi-line text control; default empty, enabled, md, three rows. Use Form Field for errors. */
export interface TextareaOptions extends ControlOptions { value?: string; placeholder?: string; rows?: number }
export function createTextarea(options: TextareaOptions): Component<HTMLTextAreaElement> {
  const textarea = document.createElement('textarea'); applyControlOptions(textarea, options);
  const rows = options.rows ?? 3;
  if (!Number.isInteger(rows) || rows < 1 || rows > 100) throw new Error('Rows must be an integer from 1 to 100');
  textarea.rows = rows; textarea.value = options.value ?? '';
  if (options.placeholder !== undefined) textarea.placeholder = options.placeholder;
  return { element: textarea, destroy() {} };
}
