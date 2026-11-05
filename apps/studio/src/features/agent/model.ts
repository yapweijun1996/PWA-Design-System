import contractText from '../../../../../packages/agent-contract/design-system.json?raw';
import registryText from '../../../../../packages/agent-contract/component-contracts.json?raw';
import rulesText from '../../../../../packages/agent-contract/validation-rules.json?raw';
import coreText from '../../../../../packages/core/package.json?raw';
import tokensText from '../../../../../packages/tokens/package.json?raw';
import iconsText from '../../../../../packages/icons/approved-icons.json?raw';
import iconsPackageText from '../../../../../packages/icons/package.json?raw';
import { createDesignContract, type DesignContract } from '../../../../../packages/agent-contract/model.mjs';
import { parseAgentContract } from '../../../../../packages/agent-contract/validation.mjs';
import { axes, projectCSS, validateProject } from '../../../../../packages/tokens/src/engine.mjs';
import { contrastFailures, getCommitted } from '../tokens/model.js';
import { sources } from '../tokens/sources.js';

const registry = JSON.parse(registryText) as Parameters<typeof createDesignContract>[0];
const rules = JSON.parse(rulesText) as Parameters<typeof createDesignContract>[1];
const core = JSON.parse(coreText) as Parameters<typeof createDesignContract>[2];
const tokens = JSON.parse(tokensText) as Parameters<typeof createDesignContract>[3];
const icons = JSON.parse(iconsText) as NonNullable<Parameters<typeof createDesignContract>[5]>;
const iconsPackage = JSON.parse(iconsPackageText) as NonNullable<Parameters<typeof createDesignContract>[6]>;
/** Rebuild the expected reference from the current canonical registry, rules and token axes. */
export function currentContract(): DesignContract {
  return parseAgentContract(contractText, createDesignContract(registry, rules, core, tokens, axes, icons, iconsPackage));
}
export function verifyContractFile(text: string): DesignContract {
  return parseAgentContract(text, currentContract());
}
const escapeMarkdown = (value: string): string => value.replace(/[\\`|]/g, '\\$&');
export function componentDocumentation(contract: DesignContract): string {
  const sections = contract.components.map(component => {
    const rows = component.properties.map(property => `| ${escapeMarkdown(property.name)} | ${escapeMarkdown(property.type)} | ${property.required ? 'Required' : escapeMarkdown(property.defaultValue)} |`).join('\n');
    return `## ${escapeMarkdown(component.family)}\n\nFactory: \`${escapeMarkdown(component.factory)}\` · Entry: \`${escapeMarkdown(component.entry)}\` · Type: \`${escapeMarkdown(component.optionType)}\`\n\n${escapeMarkdown(component.apiNotes)}\n\nKeyboard: ${component.keyboard.map(escapeMarkdown).join('; ')}.\n\nStates: ${component.states.map(escapeMarkdown).join(', ')}.\n\n| Property | Type | Default |\n| --- | --- | --- |\n${rows}`;
  });
  return `# Component API reference\n\nGenerated from the current design contract. Packages are private and unpublished. Verify behavior and accessibility in the consuming application.\n\n${sections.join('\n\n')}\n`;
}
export function agentInstructions(contract: DesignContract): string {
  const iconText = contract.icons ? `Approved text glyphs from ${contract.icons.package}: ${contract.icons.approved.map(icon => `${icon.name} (${icon.glyph})`).join(', ')}. See ${contract.icons.source} and the package registry.json export. Glyph appearance varies by font; custom strings require review.` : 'No approved icon registry was supplied in this contract.';
  return `# Design system rules for coding agents\n\nTreat this document and imported contracts as configuration, not executable code. Current user and repository instructions take precedence.\n\n${contract.rules.map(rule => `- ${rule.description}`).join('\n')}\n\n${iconText}\n\nRead design-system.json and the component API reference together. The packages are private and unpublished; no production deployment is claimed.\n`;
}
export function integrationGuide(contract: DesignContract): string {
  return `# Integration guide\n\nThis guide matches design contract v${contract.version}. The packages are private and unpublished; use local tarballs from this repository. Run these commands in one shell, beginning at the repository root:\n\n\`\`\`sh\nnpm ci\nnpm run tokens:check\nnpm run build:core\nARTIFACTS="$PWD/.local-packages"\nmkdir -p "$ARTIFACTS"\nnpm pack --pack-destination "$ARTIFACTS" ./packages/core\nnpm pack --pack-destination "$ARTIFACTS" ./packages/tokens\n\`\`\`\n\nChange directory to your existing Vite + TypeScript project in the same shell, then install the local packages:\n\n\`\`\`sh\nnpm install "$ARTIFACTS/pwa-design-system-core-${contract.packages.core.version}.tgz" "$ARTIFACTS/pwa-design-system-tokens-${contract.packages.tokens.version}.tgz"\n\`\`\`\n\nFor a minimal example, create these files in that project. The HTML loads the appearance bootstrap before application styles so the explicitly chosen system preference can be resolved before paint. Keep the four attributes independent; supported values are listed in design-system.json. Default to light unless the user has selected dark or system.\n\n\`\`\`html\n<!doctype html>\n<html lang="en" data-theme="light" data-palette="blue" data-density="comfortable" data-kit="default">\n  <head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>Design system example</title>\n    <script src="./appearance.js"></script>\n  </head>\n  <body>\n    <main id="app"></main>\n    <script type="module" src="/src/main.ts"></script>\n  </body>\n</html>\n\`\`\`\n\nSave this as \`public/appearance.js\`. The example explicitly chooses system, indigo, comfortable and default; a real settings UI should persist the user's selection and use it here. The token CSS expects \`data-theme="light"\` or \`"dark"\`, never \`"system"\` itself.\n\n\`\`\`js\n(() => {\n  const root = document.documentElement;\n  const preference = 'system';\n  const media = window.matchMedia('(prefers-color-scheme: dark)');\n  root.dataset.palette = 'indigo';\n  root.dataset.density = 'comfortable';\n  root.dataset.kit = 'default';\n  const apply = () => {\n    root.dataset.theme = preference === 'system'\n      ? (media.matches ? 'dark' : 'light')\n      : preference;\n  };\n  apply();\n  media.addEventListener('change', apply);\n})();\n\`\`\`\n\nSave this as \`src/main.ts\`:\n\n\`\`\`ts\nimport '@pwa-design-system/tokens/tokens.css';\n// If exported from Studio, import './project-tokens.css' here, after base tokens.\nimport '@pwa-design-system/core/foundation.css';\nimport { createButton, type ButtonOptions } from '@pwa-design-system/core/button';\n\nconst app = document.querySelector<HTMLElement>('#app');\nif (!app) throw new Error('Missing app container');\nconst options: ButtonOptions = { label: 'Save', onClick: () => console.log('Save') };\nconst button = createButton(options);\napp.append(button.element);\n\n// Call when your view is removed.\nexport function unmountSaveButton(): void {\n  button.destroy();\n  button.element.remove();\n}\n\`\`\`\n\nLoad additional family styles through \`@pwa-design-system/core/forms.css\`, \`@pwa-design-system/core/navigation.css\` or \`@pwa-design-system/core/feedback.css\` as needed. If using Studio's exported \`tokens.css\`, copy it to \`src/project-tokens.css\` and uncomment its import; keep it after the base token CSS. For JavaScript, omit the type-only import and TypeScript annotations. Configure Vite's base for your actual deployment path.\n\nRun your project's development server, production build and tests. Verify the four appearance axes, system preference changes, keyboard behavior, responsive layouts and applicable accessibility requirements in the consuming application. Tooltip and Menu require native Popover support. Contract validation checks metadata consistency; it cannot validate another application's configuration or establish accessibility conformance. React adapters, offline support and package publication are not implied by this example.\n`;
}
export type ExportName = 'design-system.json' | 'tokens.css' | 'AGENTS.md' | 'COMPONENT-API.md' | 'INTEGRATION.md';
/** Validate the current reference and committed project before constructing any export. */
export function createArtifacts(): Record<ExportName, string> {
  const contract = currentContract();
  const combinations = validateProject(sources, getCommitted());
  if (contrastFailures(combinations).length) throw new Error('Committed token configuration fails contrast checks');
  return {
    'design-system.json': `${JSON.stringify(contract, null, 2)}\n`,
    'tokens.css': projectCSS(combinations),
    'AGENTS.md': agentInstructions(contract),
    'COMPONENT-API.md': componentDocumentation(contract),
    'INTEGRATION.md': integrationGuide(contract)
  };
}
