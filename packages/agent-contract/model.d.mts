export interface ContractProperty { name: string; type: string; required: boolean; defaultValue: string }
export interface ContractComponent { family: string; factory: string; entry: string; optionType: string; keyboard: string[]; states: string[]; apiNotes: string; properties: ContractProperty[] }
export interface ContractRule { id: string; description: string }
export interface ApprovedIcon { name: string; glyph: string; description: string }
export interface DesignContract { schema: string; version: number; project: string; packages: { core: { name: string; version: string; private: boolean }; tokens: { name: string; version: string; private: boolean } }; tokens: { source: string; cssExport: string; axes: { themes: string[]; palettes: string[]; density: string[]; kits: string[] } }; icons?: { source: string; package: string; version: string; approved: ApprovedIcon[] }; components: ContractComponent[]; rules: ContractRule[] }
export function createDesignContract(registry: { components: ContractComponent[] }, rules: { rules: ContractRule[] }, core: DesignContract['packages']['core'], tokens: DesignContract['packages']['tokens'], axes: DesignContract['tokens']['axes'], icons?: { icons: ApprovedIcon[] }, iconPackage?: { name: string; version: string }): DesignContract;
export function canonical(value: unknown): unknown;
