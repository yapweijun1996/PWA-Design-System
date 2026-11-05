import type { Component } from '../types.js';
import { requiredText } from './shared.js';

let sequence = 0;

/**
 * Tooltip contains plain text only. The caller owns a focusable trigger element.
 * Requires the native Popover API; unsupported browsers receive an explicit error.
 */
export interface TooltipOptions { trigger: HTMLElement; text: string }

export function createTooltip(options: TooltipOptions): Component<HTMLSpanElement> {
  if (!options || typeof options !== 'object') throw new TypeError('options must be an object');
  if (!(options.trigger instanceof HTMLElement)) throw new TypeError('trigger must be an HTMLElement');
  const text = requiredText(options.text, 'text');
  const { trigger } = options;
  const element = document.createElement('span');
  element.className = 'ds-tooltip-wrap';
  const tip = document.createElement('span');
  if (typeof tip.showPopover !== 'function' || typeof tip.hidePopover !== 'function') {
    throw new Error('Tooltip requires browser support for the Popover API');
  }
  tip.className = 'ds-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.setAttribute('popover', 'manual');
  tip.hidden = true;
  tip.textContent = text;
  do { sequence += 1; tip.id = `ds-tooltip-${sequence}`; } while (document.getElementById(tip.id));
  const previous = trigger.getAttribute('aria-describedby');
  trigger.setAttribute('aria-describedby', [previous, tip.id].filter(Boolean).join(' '));
  element.append(trigger, tip);
  let hovered = false;
  let focused = false;
  let dismissed = false;
  let destroyed = false;
  let shown = false;
  let ownerDialog: HTMLDialogElement | null = null;
  const detachObserver = new MutationObserver(() => {
    if (!element.isConnected || !trigger.isConnected) closeForRemoval();
  });

  const position = () => {
    if (tip.hidden) return;
    const anchor = trigger.getBoundingClientRect();
    const bounds = tip.getBoundingClientRect();
    const margin = (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) / 2;
    const maxLeft = Math.max(margin, window.innerWidth - bounds.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - bounds.height - margin);
    const below = anchor.bottom;
    const above = anchor.top - bounds.height;
    const preferred = below + bounds.height <= window.innerHeight - margin || above < margin ? below : above;
    tip.style.left = `${Math.min(Math.max(anchor.left, margin), maxLeft)}px`;
    tip.style.top = `${Math.min(Math.max(preferred, margin), maxTop)}px`;
  };
  const update = () => {
    if (!hovered && !focused) dismissed = false;
    const visible = !dismissed && (hovered || focused);
    if (!visible) {
      if (shown) { tip.hidePopover(); shown = false; }
      tip.hidden = true;
      document.removeEventListener('keydown', onEscape, true);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      ownerDialog?.removeEventListener('close', closeForRemoval);
      ownerDialog = null;
      detachObserver.disconnect();
    } else {
      if (!shown) {
        tip.hidden = false;
        tip.showPopover();
        shown = true;
        ownerDialog = trigger.closest('dialog');
        ownerDialog?.addEventListener('close', closeForRemoval);
        detachObserver.observe(document, { childList: true, subtree: true });
      }
      position();
      document.addEventListener('keydown', onEscape, true);
      window.addEventListener('resize', position);
      window.addEventListener('scroll', position, true);
    }
  };
  const onEnter = () => { hovered = true; update(); };
  const onLeave = () => { hovered = false; update(); };
  const onFocus = () => { focused = true; update(); };
  const onBlur = (event: FocusEvent) => {
    if (!(event.relatedTarget instanceof Node) || !element.contains(event.relatedTarget)) focused = false;
    update();
  };
  const onEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !tip.hidden) {
      event.preventDefault();
      event.stopPropagation();
      dismissed = true;
      update();
    }
  };
  function closeForRemoval() {
    hovered = false;
    focused = false;
    dismissed = false;
    update();
  }
  element.addEventListener('mouseenter', onEnter);
  element.addEventListener('mouseleave', onLeave);
  element.addEventListener('focusin', onFocus);
  element.addEventListener('focusout', onBlur);

  return { element, destroy() {
    if (destroyed) return;
    destroyed = true;
    element.removeEventListener('mouseenter', onEnter);
    element.removeEventListener('mouseleave', onLeave);
    element.removeEventListener('focusin', onFocus);
    element.removeEventListener('focusout', onBlur);
    document.removeEventListener('keydown', onEscape, true);
    window.removeEventListener('resize', position);
    window.removeEventListener('scroll', position, true);
    ownerDialog?.removeEventListener('close', closeForRemoval);
    detachObserver.disconnect();
    if (shown) { tip.hidePopover(); shown = false; }
    const ids = (trigger.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(id => id && id !== tip.id);
    if (ids.length) trigger.setAttribute('aria-describedby', ids.join(' '));
    else trigger.removeAttribute('aria-describedby');
    tip.remove();
  } };
}
