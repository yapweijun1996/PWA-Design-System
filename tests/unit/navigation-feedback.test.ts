// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBreadcrumb, createMenu, createPagination, createTabs } from '../../packages/core/src/navigation/index';
import { createAlert, createDialog, createToast } from '../../packages/core/src/feedback/index';

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
describe('navigation and feedback primitives', () => {
  it('connects tabs to panels and switches via keyboard', () => {
    const tabs = createTabs({ label: 'Views', tabs: [{ label: 'First', content: 'One' }, { label: 'Second', content: 'Two' }] }); document.body.append(tabs.element);
    const buttons = tabs.element.querySelectorAll<HTMLButtonElement>('[role=tab]'); const panels = tabs.element.querySelectorAll<HTMLElement>('[role=tabpanel]');
    expect(buttons[0].getAttribute('aria-controls')).toBe(panels[0].id); expect(panels[1].hidden).toBe(true);
    buttons[0].focus(); buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(buttons[1]); expect(buttons[1].getAttribute('aria-selected')).toBe('true'); expect(panels[1].hidden).toBe(false);
    tabs.destroy(); expect(tabs.element.isConnected).toBe(true); buttons[0].click(); expect(buttons[1].getAttribute('aria-selected')).toBe('true');
  });
  it('reports only user-initiated changes and leaves programmatic selection silent', () => {
    const onChange = vi.fn();
    const tabs = createTabs({ label: 'Views', tabs: [{ label: 'First', content: 'One' }, { label: 'Second', content: 'Two' }], onChange });
    document.body.append(tabs.element);
    const buttons = tabs.element.querySelectorAll<HTMLButtonElement>('[role=tab]');
    expect(onChange).not.toHaveBeenCalled();
    buttons[1].click(); buttons[1].click();
    expect(onChange).toHaveBeenCalledTimes(1); expect(onChange).toHaveBeenLastCalledWith(1);
    tabs.select(0); expect(onChange).toHaveBeenCalledTimes(1);
    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(onChange).toHaveBeenCalledTimes(2); expect(onChange).toHaveBeenLastCalledWith(1);
    expect(() => createTabs({ label: 'Views', tabs: [{ label: 'Only', content: '' }], onChange: 'bad' as never })).toThrow();
    tabs.destroy();
  });
  it('rejects menu creation if native popovers are unavailable', () => {
    Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true, value: undefined });
    expect(() => createMenu({ label: 'Actions', items: [{ label: 'Run', onSelect() {} }] })).toThrow(/Popover API/);
  });
  it('renders a current breadcrumb and rejects script URLs', () => {
    const nav = createBreadcrumb([{ label: 'Home', href: 'https://example.test/' }, { label: 'Current' }]);
    expect(nav.element.querySelector('[aria-current=page]')?.textContent).toBe('Current');
    expect(() => createBreadcrumb([{ label: 'Bad', href: 'javascript:alert(1)' }, { label: 'Current' }])).toThrow();
  });
  it('keeps disabled menu items focusable but never activates them', () => {
    const disabled = vi.fn(), active = vi.fn(); const menu = createMenu({ label: 'Actions', items: [{ label: 'Blocked', disabled: true, onSelect: disabled }, { label: 'Run', onSelect: active }] }); document.body.append(menu.element);
    const trigger = menu.element.querySelector<HTMLButtonElement>('button'); if (!trigger) throw new Error('Menu trigger missing'); trigger.click();
    const items = menu.element.querySelectorAll<HTMLButtonElement>('[role=menuitem]'); expect(document.activeElement).toBe(items[0]); items[0].click(); expect(disabled).not.toHaveBeenCalled();
    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); expect(document.activeElement).toBe(items[1]);
    items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); expect(document.activeElement).toBe(trigger); expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click(); document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })); expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
  it('rejects blank accessible names', () => {
    expect(() => createTabs({ label: ' ', tabs: [{ label: 'Tab', content: 'Text' }] })).toThrow(/non-empty/);
    expect(() => createTabs({ label: 'Tabs', tabs: [{ label: '', content: 'Text' }] })).toThrow(/non-empty/);
    expect(() => createMenu({ label: '', items: [{ label: 'Item', onSelect() {} }] })).toThrow(/non-empty/);
    expect(() => createMenu({ label: 'Menu', items: [{ label: ' ', onSelect() {} }] })).toThrow(/non-empty/);
    expect(() => createDialog({ title: '', description: 'Text' })).toThrow(/non-empty/);
    expect(() => createDialog({ title: 'Title', description: 'Text', closeLabel: '' })).toThrow(/non-empty/);
  });
  it('limits pagination and announces changes', () => {
    const change = vi.fn(); const nav = createPagination({ page: 1, totalPages: 2, onChange: change }); const buttons = nav.element.querySelectorAll('button');
    expect(buttons[0].disabled).toBe(true); buttons[1].click(); expect(change).toHaveBeenCalledWith(2); expect(buttons[1].disabled).toBe(true); expect(nav.element.textContent).toContain('Page 2 of 2');
    expect(() => nav.setPage(3)).toThrow();
  });
  it('creates a labelled dialog and restores its opener on close', () => {
    const opener = document.createElement('button'); document.body.append(opener); opener.focus();
    const dialog = createDialog({ title: 'Title', description: '<b>Text</b>' }); document.body.append(dialog.element);
    dialog.element.showModal = () => { dialog.element.open = true; };
    dialog.element.close = () => { dialog.element.open = false; dialog.element.dispatchEvent(new Event('close')); };
    dialog.open(); expect(dialog.element.querySelector('b')).toBeNull(); expect(dialog.element.getAttribute('aria-labelledby')).toBe(dialog.element.querySelector('h2')?.id);
    dialog.close(); expect(document.activeElement).toBe(opener); dialog.open(); dialog.destroy(); expect(document.activeElement).toBe(opener); expect(dialog.element.isConnected).toBe(true); expect(() => dialog.open()).toThrow();
  });
  it('restores an explicit pointer invoker even when another element was focused', () => {
    const invoker = document.createElement('button'), focused = document.createElement('button');
    document.body.append(invoker, focused); focused.focus();
    const dialog = createDialog({ title: 'Title', description: 'Text' }); document.body.append(dialog.element);
    dialog.element.showModal = () => { dialog.element.open = true; };
    dialog.element.close = () => { dialog.element.open = false; dialog.element.dispatchEvent(new Event('close')); };
    expect(() => dialog.open(document.createElement('button'))).toThrow(/connected/);
    invoker.disabled = true; expect(() => dialog.open(invoker)).toThrow(/enabled/); invoker.disabled = false;
    dialog.open(invoker); dialog.close(); expect(document.activeElement).toBe(invoker);
    dialog.destroy();
  });
  it('keeps static alerts separate from assertive updates and does not parse markup', () => {
    const staticAlert = createAlert({ message: '<img src=x>' }); expect(staticAlert.element.getAttribute('role')).toBeNull(); expect(staticAlert.element.querySelector('img')).toBeNull();
    const urgent = createAlert({ message: '', assertive: true }); urgent.setMessage('Error'); expect(urgent.element.getAttribute('role')).toBe('alert'); expect(urgent.element.textContent).toBe('Error');
  });
  it('offers a status message and a dismissible toast', async () => {
    const dismiss = vi.fn(); const toast = createToast({ message: 'Saved', onDismiss: dismiss }); document.body.append(toast.element);
    await Promise.resolve();
    expect(toast.element.querySelector('[role=status]')?.textContent).toBe('Saved'); const button = toast.element.querySelector('button'); if (!button) throw new Error('Dismiss button missing'); button.click(); expect(dismiss).toHaveBeenCalledOnce(); expect(toast.element.isConnected).toBe(false);
  });
  it('does not populate toast live text until after delayed mounting', async () => {
    const toast = createToast({ message: 'Delayed' });
    await Promise.resolve(); expect(toast.element.querySelector('[role=status]')?.textContent).toBe('');
    document.body.append(toast.element); await Promise.resolve(); expect(toast.element.querySelector('[role=status]')?.textContent).toBe('Delayed');
    toast.destroy();
  });
});
