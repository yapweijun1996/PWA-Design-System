// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createButton } from '../../packages/core/src/foundation/button.js';
import { createIconButton } from '../../packages/core/src/foundation/icon-button.js';
import { createBadge } from '../../packages/core/src/foundation/badge.js';
import { createCard } from '../../packages/core/src/foundation/card.js';
import { createSeparator } from '../../packages/core/src/foundation/separator.js';
import { createTooltip } from '../../packages/core/src/foundation/tooltip.js';

const originalShowPopover = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'showPopover');
const originalHidePopover = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'hidePopover');
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true, value: vi.fn() });
  Object.defineProperty(HTMLElement.prototype, 'hidePopover', { configurable: true, value: vi.fn() });
});
afterEach(() => {
  document.body.replaceChildren();
  if (originalShowPopover) Object.defineProperty(HTMLElement.prototype, 'showPopover', originalShowPopover);
  else Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
  if (originalHidePopover) Object.defineProperty(HTMLElement.prototype, 'hidePopover', originalHidePopover);
  else Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
});

describe('foundation components', () => {
  it('creates an inert-by-default button with correct options and cleanup', () => {
    const onClick = vi.fn();
    const component = createButton({ label: 'Save', onClick, variant: 'secondary', size: 'large' });
    expect(component.element.type).toBe('button');
    expect(component.element.dataset).toMatchObject({ size: 'large', variant: 'secondary' });
    component.element.click();
    expect(onClick).toHaveBeenCalledOnce();
    component.destroy();
    component.destroy();
    component.element.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
  it('enforces loading and validates invalid button options', () => {
    const onClick = vi.fn();
    const component = createButton({ label: 'Loading', loading: true, onClick });
    expect(component.element.disabled).toBe(true);
    expect(component.element.getAttribute('aria-busy')).toBe('true');
    component.element.click();
    expect(onClick).not.toHaveBeenCalled();
    expect(() => createButton({ label: '' })).toThrow();
    expect(() => createButton({ label: 'Save', size: 'giant' as never })).toThrow();
    expect(() => createButton({ label: 'Save', disabled: 'yes' as never })).toThrow();
  });
  it('requires an accessible icon button name and treats its icon as text', () => {
    const icon = createIconButton({ label: 'Settings', icon: '<svg>' }).element;
    expect(icon.getAttribute('aria-label')).toBe('Settings');
    expect(icon.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    expect(icon.querySelector('svg')).toBeNull();
    expect(() => createIconButton({ label: ' ', icon: '!' })).toThrow();
  });
  it('creates a noninteractive badge and validates its variant', () => {
    const badge = createBadge({ label: '<unsafe>', variant: 'success' }).element;
    expect(badge.textContent).toBe('<unsafe>');
    expect(badge.dataset.variant).toBe('success');
    expect(badge.children.length).toBe(0);
    expect(() => createBadge({ label: 'OK', variant: 'invalid' as never })).toThrow();
  });
  it('creates a labeled card and rejects invalid options', () => {
    const card = createCard({ label: 'Profile', variant: 'elevated' }).element;
    expect(card.tagName).toBe('SECTION');
    expect(card.getAttribute('aria-label')).toBe('Profile');
    expect(card.dataset.variant).toBe('elevated');
    expect(() => createCard({ label: '' })).toThrow();
  });
  it('uses native horizontal and explicit vertical separator semantics', () => {
    expect(createSeparator().element.tagName).toBe('HR');
    const vertical = createSeparator({ orientation: 'vertical' }).element;
    expect(vertical.getAttribute('role')).toBe('separator');
    expect(vertical.getAttribute('aria-orientation')).toBe('vertical');
  });
  it('shows tooltip for focus and hover, supports Escape, and cleans up its description', () => {
    const trigger = document.createElement('button');
    trigger.setAttribute('aria-describedby', 'existing');
    const component = createTooltip({ trigger, text: 'Helpful information' });
    document.body.append(component.element);
    const tooltip = component.element.querySelector<HTMLElement>('[role=tooltip]');
    expect(tooltip?.hidden).toBe(true);
    trigger.focus();
    expect(tooltip?.hidden).toBe(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(tooltip?.hidden).toBe(true);
    trigger.blur();
    component.element.dispatchEvent(new MouseEvent('mouseenter'));
    expect(tooltip?.hidden).toBe(false);
    component.element.dispatchEvent(new MouseEvent('mouseleave'));
    expect(tooltip?.hidden).toBe(true);
    component.destroy();
    component.destroy();
    expect(trigger.getAttribute('aria-describedby')).toBe('existing');
    expect(component.element.querySelector('[role=tooltip]')).toBeNull();
  });
  it('rejects unsupported Popover API before mutating the trigger', () => {
    Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true, value: undefined });
    const trigger = document.createElement('button');
    document.body.append(trigger);
    expect(() => createTooltip({ trigger, text: 'Help' })).toThrow('Tooltip requires browser support for the Popover API');
    expect(trigger.parentElement).toBe(document.body);
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
  });
});
