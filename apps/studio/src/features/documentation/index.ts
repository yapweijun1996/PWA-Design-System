import './styles.css';

type Section = { title: string; paragraphs: readonly string[]; command?: string; link?: { label: string; hash: string } };
const sections: readonly Section[] = [
  { title: 'Start locally', paragraphs: ['Use Node.js ^22.13.0 or >=24.0.0. From the repository root, install dependencies and start the Studio. The packages are private and unpublished.'], command: 'npm ci\nnpm run build:react\nnpm run dev' },
  { title: 'Shared workspace', paragraphs: ['Components and Design Tokens use Explorer to find items, Canvas to inspect their output, and Inspector to edit the selection. Resize wide-layout dividers by dragging or using Arrow Left/Right and Home/End. Pane sizes also provides number inputs and Decrease/Increase buttons without dragging. Compact layouts collapse Explorer; phone layouts switch between named panels while retaining edits.', 'The document scrolls the page; component lists and the Token Table have their own bounded scrolling. Wide code and deliberately oversized canvases scroll horizontally inside their regions. Canvas width controls change CSS width, not the browser viewport or its media queries.'] },
  { title: 'Components', paragraphs: ['The core exposes 21 framework-independent DOM component families. Search or filter Explorer, then edit supported properties in the single Inspector. Preview and Code use the same validated configuration; Code contains the copy action. Usage examples are independent demonstrations and do not change the active component.', 'Load the token CSS before the CSS for each component family, and call destroy() before removing its element.'], link: { label: 'Explore components', hash: '#components' } },
  { title: 'Tokens and themes', paragraphs: ['JSON files in packages/tokens are authoritative. Search or filter the compact Token Table and select a row to edit its override and inspect inheritance in Details. Empty overrides inherit. Unresolvable drafts retain the last valid preview; invalid drafts block saving and export. Editing scope chooses where overrides are saved, Canvas theme chooses the isolated preview, and Studio theme styles the application shell.', 'Commit saves validated drafts locally when storage is available; Cancel and Undo help review changes before saving. Imports are validated before commit, and edits do not rewrite repository files. Theme Builder independently selects theme, palette, density and visual kit.'], link: { label: 'Open design tokens', hash: '#design-tokens' } },
  { title: 'Rules for coding agents', paragraphs: ['AI Agent Rules exports a validated contract, resolved token CSS, agent instructions, component API and a local package integration guide. Imported contracts are treated as data and are not executed.'], link: { label: 'Open AI Agent Rules', hash: '#ai-agent-rules' } },
  { title: 'Offline use and updates', paragraphs: ['A production build can cache the shell and existing tools after an online visit and service worker installation. Save or cancel drafts, finish pending imports and close other Studio tabs before choosing Prepare update. A loading indicator remains while Studio checks safety and waits for the new worker to activate; repeated preparation and editing are temporarily disabled. Preparation does not reload the page.', 'After activation, choose Reload now when ready. This separate action checks for unsafe drafts and imports again. Browser storage may be unavailable or evicted. Actual OS installation and iOS standalone behavior are NOT VERIFIED.'] },
  { title: 'Accessibility and limits', paragraphs: ['The Accessibility Lab compares two opaque colors and lists manual checks. Automated checks do not establish WCAG conformance; manual screen-reader and device testing is NOT VERIFIED. The layout table and dialog are static examples; the reusable Data Table is separate.'], link: { label: 'Open Accessibility Lab', hash: '#accessibility-lab' } }
];

function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag); if (text !== undefined) result.textContent = text; return result;
}

/** Local static guidance is bundled with the Studio; no fetched markup is executed. */
export function mountDocumentation(root: HTMLElement): () => void {
  const container = node('section'); container.className = 'studio-documentation';
  container.append(node('h1', 'Documentation'), node('p', 'Practical guidance for the current development release.'));
  for (const section of sections) {
    const article = node('section'); article.className = 'studio-documentation__section';
    article.append(node('h2', section.title));
    for (const paragraph of section.paragraphs) article.append(node('p', paragraph));
    if (section.command) { const pre = node('pre'), code = node('code', section.command); pre.append(code); article.append(pre); }
    if (section.link) { const link = node('a', section.link.label); link.href = section.link.hash; article.append(link); }
    container.append(article);
  }
  root.replaceChildren(container);
  return () => container.remove();
}
