import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';

const base = `/PWA-Design-System/@fs${resolve('packages/core/src/forms')}`;
const tokens = `/PWA-Design-System/@fs${resolve('packages/tokens/generated/tokens.css')}`;

test.beforeEach(async ({ page }) => {
  await page.goto('/PWA-Design-System/');
  await page.evaluate(async ({ base, tokens }) => {
    const paths = ['input', 'textarea', 'checkbox', 'radio-group', 'switch', 'select', 'form-field'];
    const [input, textarea, checkbox, radio, toggle, select, field] = await Promise.all(paths.map(name => import(`${base}/${name}.ts`)));
    await Promise.all([tokens, `${base}/forms.css`].map(href => new Promise<void>((resolve, reject) => {
      const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href;
      link.addEventListener('load', () => resolve(), { once: true });
      link.addEventListener('error', () => reject(new Error(`Failed to load stylesheet: ${href}`)), { once: true });
      document.head.append(link);
    })));
    const container = document.createElement('section'); container.id = 'form-fixture'; container.setAttribute('aria-label', 'Form examples');
    container.append(
      field.createFormField({ label: 'Email', control: input.createInput({ id: 'form-email', type: 'email', required: true }).element, description: 'Use your work email', error: 'Enter an email' }).element,
      field.createFormField({ label: 'Notes', control: textarea.createTextarea({ id: 'form-notes' }).element }).element,
      checkbox.createCheckbox({ id: 'form-terms', label: 'Accept terms' }).element,
      toggle.createSwitch({ id: 'form-switch', label: 'Notifications' }).element,
      radio.createRadioGroup({ id: 'form-plan', legend: 'Plan', name: 'form-plan', options: [{ value: 'basic', label: 'Basic' }, { value: 'plus', label: 'Plus' }] }).element,
      field.createFormField({ label: 'Country', control: select.createSelect({ id: 'form-country', options: [{ value: 'sg', label: 'Singapore' }, { value: 'my', label: 'Malaysia' }] }).element }).element,
      checkbox.createCheckbox({ id: 'form-disabled', label: 'Unavailable', disabled: true }).element
    );
    document.body.replaceChildren(container);
  }, { base, tokens });
});

test('native controls expose labels and support keyboard interaction', async ({ page }) => {
  const email = page.getByRole('textbox', { name: 'Email' });
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAttribute('aria-describedby', 'form-email--description form-email--error');
  await email.focus(); await page.keyboard.type('test@example.com'); await expect(email).toHaveValue('test@example.com');
  const terms = page.getByRole('checkbox', { name: 'Accept terms' });
  await terms.focus(); await page.keyboard.press('Space'); await expect(terms).toBeChecked();
  const toggle = page.getByRole('switch', { name: 'Notifications' });
  await toggle.focus(); await page.keyboard.press('Space'); await expect(toggle).toBeChecked();
  const basic = page.getByRole('radio', { name: 'Basic' });
  await basic.focus(); await page.keyboard.press('Space'); await page.keyboard.press('ArrowRight'); await expect(page.getByRole('radio', { name: 'Plus' })).toBeChecked();
  const country = page.getByRole('combobox', { name: 'Country' });
  await country.selectOption('my'); await expect(country).toHaveValue('my');
  await expect(page.getByRole('checkbox', { name: 'Unavailable' })).toBeDisabled();
});

test('form examples pass automated axe checks', async ({ page }) => {
  const results = await new AxeBuilder({ page }).include('#form-fixture').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('checked choice boundaries and switch indicators retain contrast across appearance axes', async ({ page }) => {
  const results = await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('#form-terms');
    const radio = document.querySelector<HTMLInputElement>('input[name="form-plan"]');
    const toggle = document.querySelector<HTMLInputElement>('#form-switch');
    if (!input || !radio || !toggle) throw new Error('Missing choice fixture');
    input.checked = true; radio.checked = true; toggle.checked = true;
    const html = document.documentElement;
    const values = [];
    for (const theme of ['light', 'dark']) for (const palette of ['blue', 'indigo', 'violet', 'emerald', 'teal', 'rose', 'orange', 'slate']) for (const density of ['comfortable', 'compact']) for (const kit of ['default', 'minimal', 'enterprise']) {
      Object.assign(html.dataset, { theme, palette, density, kit });
      const root = getComputedStyle(html), checkboxStyle = getComputedStyle(input), radioStyle = getComputedStyle(radio), switchStyle = getComputedStyle(toggle), knob = getComputedStyle(toggle, '::before');
      const fill = switchStyle.backgroundColor, border = switchStyle.borderColor, knobFill = knob.backgroundColor;
      toggle.checked = false;
      const uncheckedFill = getComputedStyle(toggle).backgroundColor, uncheckedKnob = getComputedStyle(toggle, '::before').backgroundColor;
      toggle.checked = true;
      values.push({ name: `${theme}/${palette}/${density}/${kit}`, surface: root.getPropertyValue('--ds-color-surface').trim(), checkboxOutline: checkboxStyle.outlineColor, checkboxOutlineStyle: checkboxStyle.outlineStyle, radioOutline: radioStyle.outlineColor, radioOutlineStyle: radioStyle.outlineStyle, switchBorder: border, switchBorderStyle: switchStyle.borderTopStyle, switchFill: fill, switchKnob: knobFill, uncheckedFill, uncheckedKnob });
    }
    return values;
  });
  const luminance = (color: string) => {
    const matches = color.startsWith('#') ? color.slice(1).match(/../g)?.map(part => parseInt(part, 16)) : color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    if (matches?.length !== 3) throw new Error(`Unexpected color: ${color}`);
    const channels = matches.map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const contrast = (a: string, b: string) => {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  expect(results).toHaveLength(96);
  for (const value of results) {
    expect(value.checkboxOutlineStyle, value.name).toBe('solid');
    expect(value.radioOutlineStyle, value.name).toBe('solid');
    expect(value.switchBorderStyle, value.name).toBe('solid');
    expect(contrast(value.checkboxOutline, value.surface), value.name).toBeGreaterThanOrEqual(3);
    expect(contrast(value.radioOutline, value.surface), value.name).toBeGreaterThanOrEqual(3);
    expect(contrast(value.switchBorder, value.surface), value.name).toBeGreaterThanOrEqual(3);
    expect(contrast(value.switchKnob, value.switchFill), value.name).toBeGreaterThanOrEqual(3);
    expect(contrast(value.uncheckedKnob, value.uncheckedFill), value.name).toBeGreaterThanOrEqual(3);
  }
});

test('Form Field rejects a conflicting programmatic name without mutating its control', async ({ page }) => {
  const result = await page.evaluate(async ({ base }) => {
    const inputModule = await import(`${base}/input.ts`), fieldModule = await import(`${base}/form-field.ts`);
    const input = inputModule.createInput({ id: 'conflicting-name', ariaLabel: 'Other name' }).element;
    try { fieldModule.createFormField({ label: 'Visible name', control: input }); return { rejected: false, original: input.getAttribute('aria-label') }; }
    catch { return { rejected: true, original: input.getAttribute('aria-label') }; }
  }, { base });
  expect(result).toEqual({ rejected: true, original: 'Other name' });
});
