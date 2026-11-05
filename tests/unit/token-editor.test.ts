// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createProjectValidator, emptyProject, parseProject, parseStoredProject, projectCSS, projectJSON, validateProject } from '../../packages/tokens/src/engine.mjs';
import { sources } from '../../apps/studio/src/features/tokens/sources';
import { commitProject, contrastFailures, getCommitted, getStorageNotice, initializeTokenOverrides } from '../../apps/studio/src/features/tokens/model';
import { mountTokenEditor } from '../../apps/studio/src/features/tokens/index';

function configuration() { return emptyProject(); }

describe('token override validation', () => {
  it('prepares an isolated validated source snapshot without weakening draft checks', () => {
    const mutable = structuredClone(sources);
    const prepared = createProjectValidator(mutable);
    const data = configuration();
    data.overrides.global['color.primary'] = '#123456';
    data.overrides.global['color.link'] = '{semantic.color.primary}';
    data.overrides.light['spacing.md'] = '{primitive.space.2}';
    data.overrides.dark['radius.card'] = '2rem';
    const expected = validateProject(mutable, data);
    expect(prepared(data)).toEqual(expected);
    expect(Object.keys(expected)).toHaveLength(96);
    mutable.semantics['color.background'].$value = '{primitive.color.missing}';
    expect(prepared(data)).toEqual(expected);
    expect(() => validateProject(mutable, data)).toThrow(/Missing reference/);
    expect(() => createProjectValidator(mutable)).toThrow(/Missing reference/);
    const invalid = configuration();
    invalid.overrides.light['color.background'] = '{semantic.color.text}';
    invalid.overrides.light['color.text'] = '{semantic.color.background}';
    expect(() => prepared(invalid)).toThrow(/Circular/);
    invalid.overrides.light['color.text'] = '{primitive.space.1}';
    expect(() => prepared(invalid)).toThrow(/Type mismatch/);
    invalid.overrides.light['color.text'] = '#ffffff; background:url(https://example.invalid)';
    expect(() => prepared(invalid)).toThrow(/Invalid override/);
  });
  it('shares deterministic repository resolution and honors scope precedence and aliases in 96 combinations', () => {
    const data = configuration();
    data.overrides.global['color.primary'] = '#123456';
    data.overrides.light['color.primary'] = '#654321';
    data.overrides.global['color.link'] = '{semantic.color.primary}';
    data.overrides.global['spacing.md'] = '{primitive.space.2}';
    const result = validateProject(sources, data);
    expect(Object.keys(result)).toHaveLength(96);
    expect(result['light/teal/compact/minimal']['color.primary']).toBe('#654321');
    expect(result['light/teal/compact/minimal']['color.link']).toBe('#654321');
    expect(result['dark/teal/compact/minimal']['color.primary']).toBe('#123456');
    expect(result['dark/teal/compact/minimal']['spacing.md']).toBe('0.5rem');
    expect(sources.semantics['color.primary'].$value).toBe('{primitive.color.blue.base}');
    expect(projectCSS(result)).toContain('--ds-color-primary: #654321;');
    expect(parseProject(sources, projectJSON(data)).project).toEqual(data);
  });
  it('rejects duplicate, escaped duplicate, malicious and malformed input, unbounded data and unsupported structure', () => {
    const json = projectJSON(configuration());
    for (const bad of [
      '{',
      json.replace('"schema":', '"schema":"bad", "schema":'),
      '{"schema":"pwa-design-system/token-overrides","version":1,"overrides":{"global":{},"light":{},"dark":{},"\\u0067lobal":{}}}',
      '{"schema":"pwa-design-system/token-overrides","version":1,"overrides":{"global":{"__proto__":{}},"light":{},"dark":{}}}',
      '{"schema":"pwa-design-system/token-overrides","version":1,"overrides":{"global":{"color.text":"red; background:url(https://evil.test)"},"light":{},"dark":{}}}',
      '{"schema":"pwa-design-system/token-overrides","version":1,"overrides":{"global":{"unknown":"#ffffff"},"light":{},"dark":{}}}',
      '{"schema":"pwa-design-system/token-overrides","version":1,"overrides":{"global":{"spacing.md":"999999999px"},"light":{},"dark":{}}}',
      '{"schema":"pwa-design-system/token-overrides","version":1,"overrides":{"global":{"shadow.card":"0 99999px 99999px #00000033"},"light":{},"dark":{}}}',
      '{"schema":"pwa-design-system/token-overrides","version":1,"overrides":{"global":[],"light":{},"dark":{}}}',
      `${'['.repeat(12)}0${']'.repeat(12)}`,
      ' '.repeat(65537)
    ]) expect(() => parseProject(sources, bad)).toThrow();
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
  });
  it('rejects missing, circular or wrong-typed aliases without changing source', () => {
    const data = configuration(); data.overrides.light['color.text'] = '{semantic.color.background}'; data.overrides.light['color.background'] = '{semantic.color.text}';
    expect(() => validateProject(sources, data)).toThrow(/Circular/);
    data.overrides.light['color.background'] = '{primitive.color.missing}'; expect(() => validateProject(sources, data)).toThrow(/Missing/);
    data.overrides.light['color.background'] = '{primitive.space.1}'; expect(() => validateProject(sources, data)).toThrow(/Type mismatch/);
  });
  it('keeps committed state when storage fails or contrast is invalid', () => {
    const before = getCommitted();
    const data = configuration(); data.overrides.light['color.surface'] = '#fafafa';
    const fail = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(() => commitProject(data)).toThrow(/quota/); expect(getCommitted()).toEqual(before); fail.mockRestore();
    data.overrides.light['color.text'] = '#ffffff';
    expect(() => commitProject(data)).toThrow(/contrast/); expect(getCommitted()).toEqual(before);
  });
  it('stages, previews, cancels, commits and resets without changing source files', () => {
    localStorage.clear(); const teardown = initializeTokenOverrides();
    const container = document.createElement('main'); document.body.append(container);
    const destroy = mountTokenEditor(container);
    const field = container.querySelector<HTMLInputElement>('[data-token="color.surface"]');
    const preview = container.querySelector<HTMLElement>('.token-editor__preview');
    if (!field || !preview) throw new Error('Editor fixture missing');
    const click = (label: string) => { const node = [...container.querySelectorAll('button')].find(item => item.textContent === label); if (!node) throw new Error('Button missing'); node.click(); };
    field.value = '#fafafa'; field.dispatchEvent(new Event('input', { bubbles: true }));
    expect(preview.style.getPropertyValue('--ds-color-surface')).toBe('#fafafa');
    expect(localStorage.getItem('pwa-ds-token-overrides-v1')).toBeNull();
    click('Cancel draft'); expect(field.value).toBe('');
    field.value = '#fafafa'; field.dispatchEvent(new Event('input', { bubbles: true })); click('Commit changes');
    expect(JSON.parse(localStorage.getItem('pwa-ds-token-overrides-v1') ?? '{}').overrides.light['color.surface']).toBe('#fafafa');
    expect(document.documentElement.style.getPropertyValue('--ds-color-surface')).toBe('#fafafa');
    click('Reset draft to defaults'); expect(document.documentElement.style.getPropertyValue('--ds-color-surface')).toBe('#fafafa');
    click('Commit changes'); expect(document.documentElement.style.getPropertyValue('--ds-color-surface')).toBe('');
    expect(container.querySelectorAll('[data-token]').length).toBe(Object.keys(sources.semantics).filter(key => !key.startsWith('breakpoint.')).length);
    destroy(); teardown(); container.remove(); localStorage.clear();
  });
  it('revalidates a prepaint snapshot if storage becomes unavailable before app initialization', () => {
    const data = configuration(); data.overrides.light['color.surface'] = '#fafafa';
    const bootstrap = document.createElement('style'); bootstrap.id = 'pwa-ds-prepaint-overrides'; bootstrap.dataset.tokenConfig = projectJSON(data); document.head.append(bootstrap);
    const failure = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage unavailable'); });
    const teardown = initializeTokenOverrides();
    expect(document.getElementById('pwa-ds-prepaint-overrides')).toBeNull();
    expect(document.documentElement.style.getPropertyValue('--ds-color-surface')).toBe('#fafafa');
    expect(getCommitted()).toEqual(data);
    failure.mockRestore(); teardown();
  });

  it('checks text on actual background contexts and all supported base appearances', () => {
    expect(contrastFailures(validateProject(sources, configuration()))).toEqual([]);
    const draft = configuration(); draft.overrides.light['color.text-muted'] = '#757575';
    const failures = contrastFailures(validateProject(sources, draft));
    expect(failures).toContain('color.text-muted / color.background requires 4.5:1');
    expect(failures).not.toContain('color.text-muted / color.surface requires 4.5:1');
    expect(() => commitProject(draft)).toThrow(/contrast/);
  });
  it('ignores delayed imports after edits, reset, cancel or commit', async () => {
    localStorage.clear(); const teardown = initializeTokenOverrides(); commitProject(configuration());
    const root = document.createElement('div'); document.body.append(root); const destroy = mountTokenEditor(root);
    const field = root.querySelector<HTMLInputElement>('[data-token="color.surface"]');
    const upload = root.querySelector<HTMLInputElement>('input[type=file]');
    if (!field || !upload) throw new Error('Editor fixture missing');
    const buttons = [...root.querySelectorAll('button')];
    const click = (name: string) => { const item = buttons.find(button => button.textContent === name || button.getAttribute('aria-label') === name); if (!item) throw new Error('Button missing'); item.click(); };
    const incoming = configuration(); incoming.overrides.light['color.surface'] = '#fafafa';
    const start = () => {
      let finish: (value: string) => void = () => { throw new Error('read not initialized'); };
      const pending = new Promise<string>(resolve => { finish = resolve; });
      const file = new File(['{}'], 'tokens.json', { type: 'application/json' });
      Object.defineProperty(file, 'text', { value: () => pending });
      Object.defineProperty(upload, 'files', { configurable: true, value: [file] });
      upload.dispatchEvent(new Event('change', { bubbles: true }));
      return () => finish(projectJSON(incoming));
    };
    for (const action of ['edit', 'reset', 'cancel', 'commit']) {
      field.value = '#f8f8f8'; field.dispatchEvent(new Event('input', { bubbles: true }));
      const finish = start();
      if (action === 'edit') { field.value = '#f7f7f7'; field.dispatchEvent(new Event('input', { bubbles: true })); }
      else click(action === 'reset' ? 'Reset draft to defaults' : action === 'cancel' ? 'Cancel draft' : 'Commit changes');
      const expected = field.value; finish(); await Promise.resolve(); await Promise.resolve();
      expect(field.value, action).toBe(expected); expect(field.value, action).not.toBe('#fafafa');
    }
    destroy(); teardown(); root.remove(); localStorage.clear();
  });

  it('migrates legacy stored breakpoints without discarding other settings or rewriting storage', () => {
    const legacy = configuration(); legacy.overrides.global['breakpoint.tablet'] = '1024px'; legacy.overrides.light['color.surface'] = '#fafafa';
    const original = projectJSON(legacy); expect(() => parseProject(sources, original)).toThrow(/Invalid override/);
    const migrated = parseStoredProject(sources, original); expect(migrated.removedBreakpoints).toEqual(['breakpoint.tablet']);
    expect(migrated.project.overrides.light['color.surface']).toBe('#fafafa'); expect(migrated.project.overrides.global['breakpoint.tablet']).toBeUndefined();
    localStorage.setItem('pwa-ds-token-overrides-v1', original); const teardown = initializeTokenOverrides();
    expect(getCommitted()).toEqual(migrated.project); expect(getStorageNotice()).toMatch(/Legacy breakpoint overrides/);
    expect(localStorage.getItem('pwa-ds-token-overrides-v1')).toBe(original);
    const root = document.createElement('main'); document.body.append(root); const destroy = mountTokenEditor(root);
    expect(root.querySelector('[data-token="breakpoint.tablet"]')).toBeNull(); expect(root.textContent).toContain('Layout breakpoints and viewport presets (read-only)');
    destroy(); root.remove(); commitProject(configuration()); teardown(); localStorage.clear();
  });

});

describe('visual token workspace', () => {
  function fixture() {
    localStorage.clear(); commitProject(configuration()); document.documentElement.dataset.theme = 'light';
    const teardown = initializeTokenOverrides(), root = document.createElement('main'); document.body.append(root); const destroy = mountTokenEditor(root);
    const edit = (key: string, value: string) => { const input = root.querySelector<HTMLInputElement>(`[data-token="${key}"]`); if (!input) throw new Error(`Missing ${key}`); input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); return input; };
    const click = (name: string) => { const control = [...root.querySelectorAll('button')].find(button => button.textContent === name || button.getAttribute('aria-label') === name); if (!control) throw new Error(`Missing ${name}`); control.click(); return control; };
    const select = (name: string, value: string) => { const label = [...root.querySelectorAll('label')].find(label => label.firstChild?.textContent === name); const control = label?.querySelector('select'); if (!control) throw new Error(`Missing ${name}`); control.value = value; control.dispatchEvent(new Event('change', { bubbles: true })); };
    const count = () => root.querySelector<HTMLOutputElement>('[aria-label="Unsaved change count"]')?.value;
    return { root, edit, click, select, count, close() { destroy(); root.remove(); commitProject(configuration()); teardown(); localStorage.clear(); } };
  }
  it('keeps preview theme independent, displays current values and preserves aliases through filtering', () => {
    const f = fixture();
    try {
      f.edit('color.surface', '#fafafa'); f.edit('color.link', '{semantic.color.primary}');
      f.select('Preview theme', 'dark');
      expect(document.documentElement.dataset.theme).toBe('light');
      expect(f.root.querySelector('.token-editor__context')?.textContent).toContain('Editing: Light only · Preview: Dark');
      const row = f.root.querySelector('[data-token-row="color.surface"]');
      expect(row?.querySelector('.token-editor__values')?.textContent).toContain('#0f172a');
      expect(f.root.querySelector('[aria-label="Token preview"]')?.getAttribute('style')).toContain('--ds-color-surface: #0f172a');
      const search = f.root.querySelector<HTMLInputElement>('input[type="search"]'); if (!search) throw new Error('Missing search');
      search.value = 'font'; search.dispatchEvent(new Event('input', { bubbles: true }));
      expect((row as HTMLElement).hidden).toBe(true);
      f.click('Clear filters'); f.select('Preview theme', 'light');
      expect(f.root.querySelector<HTMLInputElement>('[data-token="color.link"]')?.value).toBe('{semantic.color.primary}');
      const picker = f.root.querySelector<HTMLInputElement>('[aria-label="Choose color.link color"]'); if (!picker) throw new Error('Missing picker');
      picker.value = '#123456'; picker.dispatchEvent(new Event('input', { bubbles: true }));
      expect(f.root.querySelector<HTMLInputElement>('[data-token="color.link"]')?.value).toBe('#123456');
    } finally { f.close(); }
  });
  it('counts actual cross-scope changes, supports undo and treats no-op edits as clean', async () => {
    const { isDraftUnsafe } = await import('../../apps/studio/src/features/pwa/guard'); const f = fixture();
    try {
      f.edit('color.surface', ''); expect(f.count()).toBe('0 unsaved changes'); expect(isDraftUnsafe()).toBe(false);
      f.edit('color.surface', '#fafafa'); f.select('Editing scope', 'dark'); f.edit('color.surface', '#101827');
      expect(f.count()).toBe('2 unsaved changes'); expect(isDraftUnsafe()).toBe(true);
      f.select('Preview theme', 'dark'); f.click('Undo last change'); expect(f.count()).toBe('1 unsaved change');
      expect(f.root.querySelector<HTMLInputElement>('[data-token="color.surface"]')?.value).toBe('');
      f.select('Editing scope', 'light'); f.click('Undo last change'); expect(f.count()).toBe('0 unsaved changes'); expect(isDraftUnsafe()).toBe(false);
      expect(f.root.querySelector<HTMLInputElement>('[data-token="color.surface"]')?.value).toBe('');
    } finally { f.close(); }
  });
  it('retains invalid draft and safety gates while its row is hidden', () => {
    const f = fixture();
    try {
      f.edit('color.surface', '#fafafa'); const field = f.edit('color.surface', 'not-a-color');
      expect(field.getAttribute('aria-invalid')).toBe('true');
      expect(f.root.querySelector('[data-token-row="color.surface"] .token-editor__values')?.textContent).toContain('Last valid: #fafafa');
      expect(f.root.querySelector('[aria-label="Token preview"]')?.textContent).toContain('last valid preview retained');
      f.select('Category', 'font');
      expect((f.root.querySelector('[data-token-row="color.surface"]') as HTMLElement).hidden).toBe(true);
      expect(f.click('Commit changes').disabled).toBe(true); expect(f.click('Export JSON').disabled).toBe(true); expect(f.click('Export CSS').disabled).toBe(true);
      f.click('Clear filters'); expect(field.value).toBe('not-a-color'); f.click('Undo last change'); expect(field.value).toBe('#fafafa');
    } finally { f.close(); }
  });
  it('retains diff, undo and stable preview controls when saving fails', () => {
    const f = fixture();
    try {
      const input = f.root.querySelector<HTMLInputElement>('[aria-label="Token preview"] .ds-control'); if (!input) throw new Error('Missing preview input'); input.value = 'Keep my text';
      f.edit('color.surface', '#fafafa'); expect(f.root.querySelector('[aria-label="Token preview"] .ds-control')).toBe(input); expect(input.value).toBe('Keep my text');
      const before = getCommitted(), stored = localStorage.getItem('pwa-ds-token-overrides-v1');
      const fail = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
      f.click('Commit changes'); fail.mockRestore();
      expect(getCommitted()).toEqual(before); expect(localStorage.getItem('pwa-ds-token-overrides-v1')).toBe(stored); expect(f.count()).toBe('1 unsaved change');
      f.click('Undo last change'); expect(f.count()).toBe('0 unsaved changes');
    } finally { f.close(); }
  });
  it('undo cancels a delayed import without admitting its late result', async () => {
    const f = fixture(); let finish: (value: string) => void = () => {};
    const original = Object.getOwnPropertyDescriptor(File.prototype, 'text'); Object.defineProperty(File.prototype, 'text', { configurable: true, value: () => new Promise<string>(resolve => { finish = resolve; }) });
    try {
      f.edit('color.surface', '#fafafa'); const input = f.root.querySelector<HTMLInputElement>('input[type="file"]'); if (!input) throw new Error('Missing import');
      Object.defineProperty(input, 'files', { configurable: true, value: [new File(['{}'], 'theme.json', { type: 'application/json' })] }); input.dispatchEvent(new Event('change', { bubbles: true }));
      f.click('Undo last change'); const incoming = configuration(); incoming.overrides.light['color.surface'] = '#f8f8f8'; finish(projectJSON(incoming)); await Promise.resolve(); await Promise.resolve();
      expect(f.root.querySelector<HTMLInputElement>('[data-token="color.surface"]')?.value).toBe(''); expect(f.count()).toBe('0 unsaved changes');
    } finally { if (original) Object.defineProperty(File.prototype, 'text', original); else Reflect.deleteProperty(File.prototype, 'text'); f.close(); }
  });
  it('announces a pending import and explicitly reports commit canceling its read', async () => {
    const f = fixture(); let finish: (value: string) => void = () => {};
    const original = Object.getOwnPropertyDescriptor(File.prototype, 'text'); Object.defineProperty(File.prototype, 'text', { configurable: true, value: () => new Promise<string>(resolve => { finish = resolve; }) });
    try {
      f.edit('color.surface', '#fafafa'); const input = f.root.querySelector<HTMLInputElement>('input[type="file"]'); if (!input) throw new Error('Missing import');
      Object.defineProperty(input, 'files', { configurable: true, value: [new File(['{}'], 'theme.json', { type: 'application/json' })] }); input.dispatchEvent(new Event('change', { bubbles: true }));
      expect(f.root.querySelector('.token-editor__status')?.textContent).toContain('Reading token configuration');
      expect(f.root.querySelector('.token-editor__status')?.textContent).toContain('validated before preview');
      expect(f.root.querySelector('.token-editor__status')?.textContent).toContain('Committing cancels this read');
      f.click('Commit changes');
      expect(f.root.querySelector('.token-editor__status')?.textContent).toContain('Pending import canceled. Current draft committed');
      const incoming = configuration(); incoming.overrides.light['color.surface'] = '#f8f8f8'; finish(projectJSON(incoming)); await Promise.resolve(); await Promise.resolve();
      expect(getCommitted().overrides.light['color.surface']).toBe('#fafafa');
      expect(f.root.querySelector<HTMLInputElement>('[data-token="color.surface"]')?.value).toBe('#fafafa');
      expect(f.root.querySelector('.token-editor__status')?.textContent).toContain('Pending import canceled. Current draft committed');
    } finally { if (original) Object.defineProperty(File.prototype, 'text', original); else Reflect.deleteProperty(File.prototype, 'text'); f.close(); }
  });
  it('explains out-of-preview contrast failures without treating a valid HEX as syntax-invalid', () => {
    const f = fixture();
    try {
      f.select('Editing scope', 'global'); const field = f.edit('color.surface', '#fafafa');
      const status = f.root.querySelector('.token-editor__status');
      expect(status?.textContent).toContain('project-wide checks (96 combinations)');
      expect(status?.textContent).toContain('example: dark/');
      expect(status?.textContent).toContain('even when this preview passes');
      expect(field.getAttribute('aria-invalid')).toBe('false');
      expect(field.getAttribute('aria-describedby')).toContain(status?.id);
      expect(f.root.querySelector('[aria-label="Token preview"]')?.getAttribute('style')).toContain('--ds-color-surface: #fafafa');
      expect(f.root.querySelector('[aria-label="Preview contrast checks"] li')?.textContent).toContain('Pass');
      expect(f.click('Commit changes').disabled).toBe(true); expect(f.click('Export JSON').disabled).toBe(true);
    } finally { f.close(); }
  });

});
