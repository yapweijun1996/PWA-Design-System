// @vitest-environment jsdom
import { act, createElement, StrictMode, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Alert, Badge, Breadcrumb, Button, Card, Checkbox, Dialog, FormField, IconButton, Input, Menu, Pagination, RadioGroup, Select, Separator, Switch, Tabs, Textarea, Toast, Tooltip } from '../../packages/react/src/index';

let container: HTMLDivElement; let root: Root;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true, value() {} });
  Object.defineProperty(HTMLElement.prototype, 'hidePopover', { configurable: true, value() {} });
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
function Controlled() {
  const [value, setValue] = useState('A');
  return createElement(Input, { id: 'name', ariaLabel: 'Name', value, onValueChange: setValue });
}
async function render(value: ReactElement) { await act(async () => { root.render(createElement(StrictMode, null, value)); }); }

describe('React adapters integrate with core', () => {
  it('mounts all 20 component families and cleans up in StrictMode', async () => {
    const components = {
      button: createElement(Button, { label: 'Save' }), icon: createElement(IconButton, { label: 'Help', icon: '?' }), badge: createElement(Badge, { label: 'New' }),
      card: createElement(Card, { label: 'Card', content: 'Text' }), separator: createElement(Separator, {}), tooltip: createElement(Tooltip, { label: 'Help', text: 'Details' }),
      input: createElement(Input, { id: 'input', ariaLabel: 'Input' }), textarea: createElement(Textarea, { id: 'textarea', ariaLabel: 'Notes' }),
      checkbox: createElement(Checkbox, { id: 'check', label: 'Check' }), radio: createElement(RadioGroup, { id: 'radio', legend: 'Plan', name: 'plan', options: [{ value: 'a', label: 'A' }] }),
      switch: createElement(Switch, { id: 'switch', label: 'Switch' }), select: createElement(Select, { id: 'select', ariaLabel: 'Select', options: [{ value: 'a', label: 'A' }] }),
      field: createElement(FormField, { label: 'Field', control: { id: 'field' } }), tabs: createElement(Tabs, { label: 'Tabs', tabs: [{ label: 'One', content: 'Panel' }] }),
      breadcrumb: createElement(Breadcrumb, { items: [{ label: 'Home', href: './' }, { label: 'Current' }] }), menu: createElement(Menu, { label: 'Menu', items: [{ label: 'One', onSelect() {} }] }),
      pagination: createElement(Pagination, { page: 1, totalPages: 2, onChange() {} }), dialog: createElement(Dialog, { title: 'Dialog', description: 'Info', open: false }),
      alert: createElement(Alert, { message: 'Alert' }), toast: createElement(Toast, { message: 'Saved' })
    };
    for (const component of Object.values(components)) { await render(component); expect(container.querySelector('[data-ds-react-host]')?.children.length).toBe(1); }
  });
  it('refreshes callbacks and props, detaches old handlers and destroys on unmount', async () => {
    const first = vi.fn(), second = vi.fn();
    await render(createElement(Button, { label: 'Save', onClick: first }));
    const old = container.querySelector('button'); if (!old) throw new Error('Button missing');
    act(() => old.click()); expect(first).toHaveBeenCalledOnce();
    await render(createElement(Button, { label: 'Update', onClick: second }));
    const current = container.querySelector('button'); if (!current) throw new Error('Updated button missing');
    expect(current.textContent).toBe('Update'); act(() => { old.click(); current.click(); });
    expect(first).toHaveBeenCalledOnce(); expect(second).toHaveBeenCalledOnce();
  });
  it('supports controlled input updates without losing keyboard focus and selection', async () => {
    await render(createElement(Controlled));
    const input = container.querySelector('input'); if (!input) throw new Error('Input missing');
    input.focus(); input.value = 'AB'; input.setSelectionRange(2, 2);
    await act(async () => { input.dispatchEvent(new Event('input', { bubbles: true })); });
    const updated = container.querySelector('input');
    expect(updated?.value).toBe('AB'); expect(document.activeElement).toBe(updated); expect(updated?.selectionStart).toBe(2);
  });
  it('uses core change semantics for a labeled checkbox', async () => {
    const callback = vi.fn(); await render(createElement(Checkbox, { id: 'choice', label: 'Receive updates', onCheckedChange: callback }));
    const input = container.querySelector<HTMLInputElement>('input'); if (!input) throw new Error('Checkbox missing');
    act(() => input.click()); expect(callback).toHaveBeenCalledWith(true); expect(input.labels?.[0].textContent).toBe('Receive updates');
  });
  it('preserves uncontrolled text and checkbox state across unrelated prop updates', async () => {
    await render(createElement(Input, { id: 'uncontrolled', ariaLabel: 'Uncontrolled', size: 'md' }));
    const input = container.querySelector('input'); if (!input) throw new Error('Input missing');
    input.value = 'In progress'; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus();
    await render(createElement(Input, { id: 'uncontrolled', ariaLabel: 'Uncontrolled', size: 'lg' }));
    expect(container.querySelector('input')?.value).toBe('In progress'); expect(document.activeElement).toBe(container.querySelector('input'));
    await render(createElement(Checkbox, { id: 'choice', label: 'Choice', size: 'md' }));
    const check = container.querySelector<HTMLInputElement>('input'); if (!check) throw new Error('Checkbox missing');
    act(() => check.click()); await render(createElement(Checkbox, { id: 'choice', label: 'Choice', size: 'lg' }));
    expect(container.querySelector<HTMLInputElement>('input')?.checked).toBe(true);
  });

  it('restores rejected controlled changes for input, checkbox and tabs', async () => {
    const changed = vi.fn();
    await render(createElement(Input, { id: 'controlled', ariaLabel: 'Controlled', value: 'fixed', onValueChange: changed }));
    const input = container.querySelector('input'); if (!input) throw new Error('Input missing');
    input.value = 'changed';
    await act(async () => { input.dispatchEvent(new Event('input', { bubbles: true })); await Promise.resolve(); });
    expect(changed).toHaveBeenCalledWith('changed'); expect(input.value).toBe('fixed'); expect(container.querySelector('input')).toBe(input);
    const checked = vi.fn(); await render(createElement(Checkbox, { id: 'controlled-check', label: 'Check', checked: false, onCheckedChange: checked }));
    const checkbox = container.querySelector<HTMLInputElement>('input'); if (!checkbox) throw new Error('Checkbox missing');
    await act(async () => { checkbox.click(); await Promise.resolve(); });
    expect(checked).toHaveBeenCalledWith(true); expect(checkbox.checked).toBe(false);
    const selected = vi.fn(); await render(createElement(Tabs, { label: 'Tabs', selectedIndex: 0, tabs: [{ label: 'First', content: 'One' }, { label: 'Second', content: 'Two' }], onChange: selected }));
    const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    await act(async () => { tabs[1].click(); await Promise.resolve(); });
    expect(selected).toHaveBeenCalledWith(1); expect(tabs[0].getAttribute('aria-selected')).toBe('true'); expect(tabs[1].getAttribute('aria-selected')).toBe('false');
  });
  it('keeps composing input connected across accepted changes and prop updates', async () => {
    await render(createElement(Controlled));
    const input = container.querySelector('input'); if (!input) throw new Error('Input missing');
    input.focus(); input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); input.value = 'A中';
    await act(async () => { input.dispatchEvent(new InputEvent('input', { bubbles: true, data: '中', isComposing: true })); await Promise.resolve(); });
    expect(container.querySelector('input')).toBe(input); expect(input.isConnected).toBe(true); expect(input.value).toBe('A中');
    await act(async () => { input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })); await Promise.resolve(); });
    expect(input.value).toBe('A中');
  });
  it('does not resurrect uncontrolled input after native form reset and prop change', async () => {
    const form = (size: 'md' | 'lg') => createElement('form', null, createElement(Input, { id: 'reset', ariaLabel: 'Reset', size }));
    await render(form('md')); const input = container.querySelector('input'); if (!input) throw new Error('Input missing');
    input.value = 'draft'; input.dispatchEvent(new Event('input', { bubbles: true })); container.querySelector('form')?.reset();
    expect(input.value).toBe(''); await render(form('lg')); expect(container.querySelector('input')).toBe(input); expect(input.value).toBe('');
  });
  it('restores an open menu and its focused item after item props change', async () => {
    const menu = (disabled: boolean) => createElement(Menu, { label: 'Actions', items: [{ label: 'First', onSelect() {} }, { label: 'Second', disabled, onSelect() {} }] });
    await render(menu(false)); const trigger = container.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]'); if (!trigger) throw new Error('Trigger missing');
    act(() => trigger.click()); const first = container.querySelector<HTMLElement>('[role="menuitem"]'); if (!first) throw new Error('Menu item missing'); first.focus();
    await render(menu(true)); expect(container.querySelector('[aria-haspopup="menu"]')?.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement?.textContent).toBe('First');
  });
  it('rejects a tooltip with a blank accessible name', async () => {
    await expect(render(createElement(Tooltip, { label: ' ', text: 'Help' }))).rejects.toThrow();
    expect(container.querySelector('button')).toBeNull();
  });

  it('restores rejected controlled radio, select, switch and pagination changes', async () => {
    const choice = vi.fn();
    await render(createElement(Switch, { id: 'controlled-switch', label: 'Switch', checked: false, onCheckedChange: choice }));
    const toggle = container.querySelector<HTMLInputElement>('input'); if (!toggle) throw new Error('Switch missing');
    await act(async () => { toggle.click(); await Promise.resolve(); }); expect(toggle.checked).toBe(false); expect(choice).toHaveBeenCalledWith(true);
    const values = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]; const selected = vi.fn();
    await render(createElement(RadioGroup, { id: 'controlled-radio', legend: 'Plan', name: 'plan', options: values, value: 'a', onValueChange: selected }));
    const radio = container.querySelectorAll<HTMLInputElement>('input'); await act(async () => { radio[1].click(); await Promise.resolve(); });
    expect(selected).toHaveBeenCalledWith('b'); expect(radio[0].checked).toBe(true); expect(radio[1].checked).toBe(false);
    await render(createElement(Select, { id: 'controlled-select', ariaLabel: 'Plan', options: values, value: 'a', onValueChange: selected }));
    const select = container.querySelector('select'); if (!select) throw new Error('Select missing'); select.value = 'b';
    await act(async () => { select.dispatchEvent(new Event('change', { bubbles: true })); await Promise.resolve(); }); expect(select.value).toBe('a');
    const pageChanged = vi.fn(); await render(createElement(Pagination, { page: 1, totalPages: 3, onChange: pageChanged }));
    const next = [...container.querySelectorAll('button')].find(button => button.textContent === 'Next'); if (!next) throw new Error('Next button missing');
    await act(async () => { next.click(); await Promise.resolve(); }); expect(pageChanged).toHaveBeenCalledWith(2); expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('Page 1 of 3');
  });

});
