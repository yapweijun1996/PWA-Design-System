import type { Component } from '../types.js';

export type Size = 'small' | 'medium' | 'large';
export type ActionVariant = 'primary' | 'secondary' | 'ghost';

export function requiredText(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} must be a non-empty string`);
  return value;
}

export function choice<T extends string>(value: unknown, allowed: readonly T[], fallback: T, name: string): T {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !allowed.includes(value as T)) throw new TypeError(`Invalid ${name}`);
  return value as T;
}

export function bool(value: unknown, name: string): boolean {
  if (value === undefined) return false;
  if (typeof value !== 'boolean') throw new TypeError(`${name} must be a boolean`);
  return value;
}

export interface ActionOptions {
  /** Defaults to medium. */
  size?: Size;
  /** Defaults to primary. */
  variant?: ActionVariant;
  /** Disabled and loading buttons cannot be activated. */
  disabled?: boolean;
  loading?: boolean;
  /** Defaults to button, preventing accidental form submission. */
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: MouseEvent) => void;
}

export function action(options: ActionOptions, className: string): Component<HTMLButtonElement> {
  if (!options || typeof options !== 'object') throw new TypeError('options must be an object');
  const size = choice(options.size, ['small', 'medium', 'large'], 'medium', 'size');
  const variant = choice(options.variant, ['primary', 'secondary', 'ghost'], 'primary', 'variant');
  const type = choice(options.type, ['button', 'submit', 'reset'], 'button', 'type');
  const disabled = bool(options.disabled, 'disabled');
  const loading = bool(options.loading, 'loading');
  if (options.onClick !== undefined && typeof options.onClick !== 'function') throw new TypeError('onClick must be a function');
  const element = document.createElement('button');
  element.className = `ds-button ${className}`;
  element.dataset.size = size;
  element.dataset.variant = variant;
  element.type = type;
  element.disabled = disabled || loading;
  if (loading) element.setAttribute('aria-busy', 'true');
  const onClick = options.onClick;
  if (onClick) element.addEventListener('click', onClick);
  return { element, destroy: () => { if (onClick) element.removeEventListener('click', onClick); } };
}
