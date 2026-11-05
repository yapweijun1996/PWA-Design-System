// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../apps/studio/src/features/accessibility/contrast';
import { mountAccessibilityLab } from '../../apps/studio/src/features/accessibility/index';
import { mountDocumentation } from '../../apps/studio/src/features/documentation/index';

describe('contrast calculator', () => {
  it('calculates WCAG ratios in either order without rounding the decision', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 10);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 10);
    expect(contrastRatio('#abcdef', '#abcdef')).toBeCloseTo(1, 10);
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.5);
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });
  it('rejects shorthand, alpha, CSS expressions and non-color input', () => {
    for (const value of ['#fff', '#ffffff00', 'white', 'url(https://example.invalid)', '#12345g', '']) {
      expect(contrastRatio(value, '#ffffff')).toBeNull();
    }
  });
  it('updates accessible errors and hides stale preview for invalid values', () => {
    const root = document.createElement('div'); document.body.append(root);
    const destroy = mountAccessibilityLab(root);
    const foreground = root.querySelector<HTMLInputElement>('#contrast-foreground');
    if (!foreground) throw new Error('Missing foreground input');
    expect(root.querySelector('[role=status]')?.textContent).toContain('21.00:1');
    foreground.value = 'invalid'; foreground.dispatchEvent(new Event('input'));
    expect(foreground.getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector('[role=status]')?.textContent).toContain('valid colors');
    expect(root.querySelector<HTMLElement>('.accessibility-lab__preview')?.hidden).toBe(true);
    foreground.value = '#777777'; foreground.dispatchEvent(new Event('input'));
    expect(foreground.hasAttribute('aria-invalid')).toBe(false);
    expect(root.querySelector('[role=status]')?.textContent).toContain('Normal text: Below 4.5:1');
    destroy(); expect(root.children).toHaveLength(0); root.remove();
  });
  it('mounts local documentation with links and cleans up without executing markup', () => {
    const root = document.createElement('div'); const destroy = mountDocumentation(root);
    expect(root.querySelector('h1')?.textContent).toBe('Documentation');
    expect(root.querySelector('a[href="#accessibility-lab"]')).not.toBeNull();
    expect(root.textContent).toContain('NOT VERIFIED');
    destroy(); expect(root.children).toHaveLength(0);
  });
});
