import type { CheckboxComponent, CheckboxOptions } from './checkbox.js';
import { createCheckbox } from './checkbox.js';
/** Binary switch using native checkbox state and a stable visible label. Defaults unchecked, enabled, md. */
export type SwitchOptions = CheckboxOptions;
export type SwitchComponent = CheckboxComponent;
export function createSwitch(options: SwitchOptions): SwitchComponent {
  const result = createCheckbox(options); result.input.setAttribute('role', 'switch'); result.input.closest('label')?.classList.add('ds-switch'); return result;
}
