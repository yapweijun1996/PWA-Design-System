import type { TokenSources } from '../../../../../packages/tokens/src/engine.mjs';
import primitives from '../../../../../packages/tokens/primitives.json?raw';
import semantics from '../../../../../packages/tokens/semantics.json?raw';
import themes_light from '../../../../../packages/tokens/themes/light.json?raw';
import themes_dark from '../../../../../packages/tokens/themes/dark.json?raw';
import palettes_blue from '../../../../../packages/tokens/palettes/blue.json?raw';
import palettes_indigo from '../../../../../packages/tokens/palettes/indigo.json?raw';
import palettes_violet from '../../../../../packages/tokens/palettes/violet.json?raw';
import palettes_emerald from '../../../../../packages/tokens/palettes/emerald.json?raw';
import palettes_teal from '../../../../../packages/tokens/palettes/teal.json?raw';
import palettes_rose from '../../../../../packages/tokens/palettes/rose.json?raw';
import palettes_orange from '../../../../../packages/tokens/palettes/orange.json?raw';
import palettes_slate from '../../../../../packages/tokens/palettes/slate.json?raw';
import density_comfortable from '../../../../../packages/tokens/density/comfortable.json?raw';
import density_compact from '../../../../../packages/tokens/density/compact.json?raw';
import kits_default from '../../../../../packages/tokens/kits/default.json?raw';
import kits_minimal from '../../../../../packages/tokens/kits/minimal.json?raw';
import kits_enterprise from '../../../../../packages/tokens/kits/enterprise.json?raw';

// These are repository-owned JSON sources, never user imports.
export const sources: TokenSources = {
  primitives: JSON.parse(primitives), semantics: JSON.parse(semantics),
  themes: { light: JSON.parse(themes_light), dark: JSON.parse(themes_dark) },
  palettes: { blue: JSON.parse(palettes_blue), indigo: JSON.parse(palettes_indigo), violet: JSON.parse(palettes_violet), emerald: JSON.parse(palettes_emerald), teal: JSON.parse(palettes_teal), rose: JSON.parse(palettes_rose), orange: JSON.parse(palettes_orange), slate: JSON.parse(palettes_slate) },
  density: { comfortable: JSON.parse(density_comfortable), compact: JSON.parse(density_compact) },
  kits: { default: JSON.parse(kits_default), minimal: JSON.parse(kits_minimal), enterprise: JSON.parse(kits_enterprise) },
};
