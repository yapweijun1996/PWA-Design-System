import type { Component } from '../types.js';

let nextId = 0;
const id = (name: string): string => { let value: string; do { value = `ds-${name}-${++nextId}`; } while (document.getElementById(value)); return value; };
function requireLabel(value: string, name: string): void { if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} must be non-empty`); }

export interface DialogOptions { title: string; description: string; closeLabel?: string; onClose?(): void }
export interface Dialog extends Component<HTMLDialogElement> { open(opener?: HTMLElement): void; close(): void }
/** Native modal. Pass the pointer invoker to open() when it may not receive focus on click. */
export function createDialog(options: DialogOptions): Dialog {
  requireLabel(options.title, 'Dialog title'); requireLabel(options.closeLabel ?? 'Close', 'Close label');
  const element = document.createElement('dialog'); element.className = 'ds-dialog';
  const heading = document.createElement('h2'); heading.id = id('dialog-title'); heading.textContent = options.title;
  const description = document.createElement('p'); description.id = id('dialog-description'); description.textContent = options.description;
  element.setAttribute('aria-labelledby', heading.id); element.setAttribute('aria-describedby', description.id);
  const closeButton = document.createElement('button'); closeButton.type = 'button'; closeButton.textContent = options.closeLabel ?? 'Close'; closeButton.autofocus = true;
  let opener: HTMLElement | null = null; let destroyed = false;
  const controller = new AbortController();
  closeButton.addEventListener('click', () => element.close(), { signal: controller.signal });
  element.addEventListener('close', () => { if (!element.open) { if (opener?.isConnected) opener.focus(); opener = null; } options.onClose?.(); }, { signal: controller.signal });
  element.append(heading, description, closeButton);
  return {
    element,
    open(invoker) {
      if (destroyed) throw new Error('Dialog is destroyed');
      if (invoker !== undefined && (!(invoker instanceof HTMLElement) || !invoker.isConnected || invoker.matches(':disabled') || invoker.closest('[inert]'))) throw new TypeError('Dialog opener must be a connected, enabled element');
      if (element.open) return;
      opener = invoker ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      element.showModal();
    },
    close() { if (element.open) element.close(); },
    destroy() { destroyed = true; controller.abort(); if (element.open) element.close(); if (opener?.isConnected) opener.focus(); opener = null; }
  };
}

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';
export interface AlertOptions { message: string; tone?: AlertTone; assertive?: boolean }
export interface Alert extends Component<HTMLDivElement> { setMessage(message: string): void }
/** Static by default. Set assertive for urgent dynamic messages; updates use textContent. */
export function createAlert(options: AlertOptions): Alert {
  const element = document.createElement('div'); element.className = `ds-alert ds-alert-${options.tone ?? 'info'}`;
  if (options.assertive) element.setAttribute('role', 'alert');
  element.textContent = options.message;
  return { element, setMessage(message) { element.textContent = message; }, destroy() {} };
}

export interface ToastOptions { message: string; dismissLabel?: string; onDismiss?(): void }
/** Polite live message with a keyboard-operable dismiss button; no automatic timeout. */
export function createToast(options: ToastOptions): Component<HTMLDivElement> {
  requireLabel(options.message, 'Toast message'); requireLabel(options.dismissLabel ?? 'Dismiss', 'Dismiss label');
  const element = document.createElement('div'); element.className = 'ds-toast';
  const controller = new AbortController();
  const message = document.createElement('span'); message.setAttribute('role', 'status');
  // Populate only after insertion so the live region exists before its text changes.
  const observer = new MutationObserver(() => { if (element.isConnected) { observer.disconnect(); if (!controller.signal.aborted) message.textContent = options.message; } });
  observer.observe(document, { childList: true, subtree: true });
  const dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.textContent = options.dismissLabel ?? 'Dismiss';
  dismiss.addEventListener('click', () => { observer.disconnect(); controller.abort(); element.remove(); options.onDismiss?.(); }, { signal: controller.signal });
  element.append(message, dismiss); return { element, destroy() { observer.disconnect(); controller.abort(); } };
}
