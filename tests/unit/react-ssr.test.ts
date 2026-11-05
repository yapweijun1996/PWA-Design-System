// @vitest-environment node
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button, DataTable, Dialog, FormField, Menu, Tooltip } from '../../packages/react/src/index';

describe('React server rendering', () => {
  it('imports and renders adapters without browser globals', () => {
    expect(typeof document).toBe('undefined');
    const components = {
      button: createElement(Button, { label: 'Save' }),
      table: createElement(DataTable, { label: 'People', columns: [{ id: 'name', label: 'Name' }], rows: [] }),
      dialog: createElement(Dialog, { open: true, title: 'Title', description: 'Description' }),
      field: createElement(FormField, { label: 'Name', control: { id: 'name' } }),
      menu: createElement(Menu, { label: 'Actions', items: [{ label: 'Open', onSelect() {} }] }),
      tooltip: createElement(Tooltip, { label: 'Help', text: 'Helpful information' })
    };
    for (const item of Object.values(components)) expect(renderToString(item)).toContain('data-ds-react-host');
  });
});
