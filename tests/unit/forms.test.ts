// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createInput } from '../../packages/core/src/forms/input';
import { createTextarea } from '../../packages/core/src/forms/textarea';
import { createCheckbox } from '../../packages/core/src/forms/checkbox';
import { createSwitch } from '../../packages/core/src/forms/switch';
import { createRadioGroup } from '../../packages/core/src/forms/radio-group';
import { createSelect } from '../../packages/core/src/forms/select';
import { createFormField } from '../../packages/core/src/forms/form-field';

afterEach(() => { document.body.replaceChildren(); });
describe('native form families', () => {
  it('constructs a text input with defaults, accessible label and disabled state', () => {
    const input = createInput({ id: 'email', type: 'email', ariaLabel: 'Email', disabled: true });
    expect(input.element.type).toBe('email'); expect(input.element.value).toBe('');
    expect(input.element.disabled).toBe(true); expect(input.element.getAttribute('aria-label')).toBe('Email');
    expect(input.element.dataset.size).toBe('md');
    expect(() => createInput({ id: 'bad id' })).toThrow(/Invalid control id/);
    expect(() => createInput({ id: 'x', ariaLabel: ' ' })).toThrow(/label/);
  });
  it('constructs a textarea and validates row count', () => {
    const area = createTextarea({ id: 'notes', ariaLabel: 'Notes', value: 'Hello', rows: 5, size: 'lg' });
    expect(area.element.value).toBe('Hello'); expect(area.element.rows).toBe(5); expect(area.element.dataset.size).toBe('lg');
    expect(() => createTextarea({ id: 'notes', rows: 0 })).toThrow(/Rows/);
  });
  it('constructs a labeled native checkbox with checked and disabled state', () => {
    const checkbox = createCheckbox({ id: 'terms', label: 'Accept terms', checked: true, disabled: true });
    expect(checkbox.element.textContent).toBe('Accept terms'); expect(checkbox.element.contains(checkbox.input)).toBe(true);
    expect(checkbox.input.checked).toBe(true); expect(checkbox.input.disabled).toBe(true);
    checkbox.input.setAttribute('aria-describedby', 'help'); checkbox.setError('Required'); expect(checkbox.input.getAttribute('aria-describedby')).toBe('help terms--error'); expect(checkbox.input.getAttribute('aria-invalid')).toBe('true'); checkbox.input.setAttribute('aria-describedby', 'help terms--error extra'); checkbox.setError(); expect(checkbox.input.getAttribute('aria-describedby')).toBe('help extra'); expect(checkbox.input.hasAttribute('aria-invalid')).toBe(false);
    expect(() => createCheckbox({ id: 'x', label: ' ' })).toThrow(/label/);
  });
  it('constructs a switch with stable label and native checked state', () => {
    const item = createSwitch({ id: 'notifications', label: 'Notifications' });
    expect(item.input.getAttribute('role')).toBe('switch'); expect(item.input.checked).toBe(false);
    item.input.checked = true; expect(item.element.textContent).toBe('Notifications');
    item.input.setAttribute('aria-describedby', 'switch-help'); item.setError('Check this'); item.setError(); expect(item.input.getAttribute('aria-describedby')).toBe('switch-help');
  });
  it('constructs a named radio group with visible legend and option states', () => {
    const group = createRadioGroup({ id: 'plan-group', legend: 'Plan', name: 'plan', value: 'b', options: [{ value: 'a', label: 'Basic', disabled: true }, { value: 'b', label: 'Plus' }] });
    expect(group.element.querySelector('legend')?.textContent).toBe('Plan'); expect(group.inputs.map(input => input.name)).toEqual(['plan', 'plan']);
    expect(group.inputs[0].disabled).toBe(true); expect(group.inputs[1].checked).toBe(true);
    group.inputs[1].setAttribute('aria-describedby', 'plan-help'); group.setError('Choose a plan'); expect(group.inputs[1].getAttribute('aria-describedby')).toBe('plan-help plan-group--error'); group.inputs[1].setAttribute('aria-describedby', 'plan-help plan-group--error extra'); group.setError(); expect(group.inputs[1].getAttribute('aria-describedby')).toBe('plan-help extra'); expect(group.inputs[1].hasAttribute('aria-invalid')).toBe(false);
    expect(() => createRadioGroup({ id: 'plan-group', legend: 'Plan', name: 'plan', options: [{ value: 'a', label: 'A' }, { value: 'a', label: 'B' }] })).toThrow(/unique/);
  });
  it('constructs a native select with safe text options and rejects unknown values', () => {
    const select = createSelect({ id: 'country', ariaLabel: 'Country', value: 'sg', options: [{ value: 'sg', label: '<b>Singapore</b>' }, { value: 'my', label: 'Malaysia', disabled: true }] });
    expect(select.element.value).toBe('sg'); expect(select.element.options[0].textContent).toBe('<b>Singapore</b>');
    expect(select.element.querySelector('b')).toBeNull(); expect(select.element.options[1].disabled).toBe(true);
    expect(() => createSelect({ id: 'x', options: [{ value: 'a', label: 'A' }], value: 'b' })).toThrow(/not in/);
  });
  it('associates a visible label and description, updates error and restores pre-existing attributes', () => {
    const named = createInput({ id: 'named', ariaLabel: 'Different name' }).element;
    expect(() => createFormField({ label: 'Visible label', control: named })).toThrow(/overriding accessible name/);
    expect(named.getAttribute('aria-label')).toBe('Different name');
    const labelled = createInput({ id: 'labelled' }).element; labelled.setAttribute('aria-labelledby', 'existing');
    expect(() => createFormField({ label: 'Visible label', control: labelled })).toThrow(/overriding accessible name/);
    const input = createInput({ id: 'address', required: true }).element;
    input.setAttribute('aria-describedby', 'other-help'); input.setAttribute('aria-invalid', 'false');
    const field = createFormField({ label: 'Address', control: input, description: 'Street and number' });
    document.body.append(field.element);
    expect(field.element.querySelector('label')?.htmlFor).toBe('address');
    expect(input.getAttribute('aria-describedby')).toBe('other-help address--description');
    field.setError('Required'); expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('other-help address--description address--error');
    expect(field.element.querySelector('#address--error')?.textContent).toBe('Required');
    field.setError(); expect(input.getAttribute('aria-invalid')).toBe('false');
    field.destroy(); expect(input.getAttribute('aria-describedby')).toBe('other-help'); expect(input.getAttribute('aria-invalid')).toBe('false');
  });
});
