/** Connect a visible Form Field or supply ariaLabel when no visible label exists. */
export interface ControlOptions {
  id: string;
  name?: string;
  ariaLabel?: string;
  disabled?: boolean;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
export function applyControlOptions(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, options: ControlOptions): void {
  if (typeof options.id !== 'string' || !/^[A-Za-z][A-Za-z0-9_.:-]*$/.test(options.id)) throw new Error('Invalid control id');
  if (options.ariaLabel !== undefined && (typeof options.ariaLabel !== 'string' || !options.ariaLabel.trim())) throw new Error('Accessible label cannot be empty');
  const size = options.size ?? 'md';
  if (!['sm', 'md', 'lg'].includes(size)) throw new Error('Unsupported size');
  element.id = options.id;
  if (options.name !== undefined) element.name = options.name;
  if (options.ariaLabel !== undefined) element.setAttribute('aria-label', options.ariaLabel);
  element.disabled = options.disabled ?? false;
  element.required = options.required ?? false;
  element.dataset.size = size;
  element.classList.add('ds-control');
}
export function assertLabel(label: string): void {
  if (typeof label !== 'string' || !label.trim()) throw new Error('A non-empty label is required');
}

/** Change only our own description ID, preserving IDs installed by consumers. */
export function updateDescription(element: HTMLElement, ownedId: string, enabled: boolean): void {
  const ids = (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(id => id && id !== ownedId);
  if (enabled) ids.push(ownedId);
  if (ids.length) element.setAttribute('aria-describedby', ids.join(' '));
  else element.removeAttribute('aria-describedby');
}
