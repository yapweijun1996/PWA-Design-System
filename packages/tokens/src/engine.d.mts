export type TokenValue = string | number;
export type TokenDefinition = { $type: string; $value: TokenValue };
export type TokenMap = Record<string, TokenValue>;
export interface TokenSources {
  primitives: Record<string, TokenDefinition>; semantics: Record<string, TokenDefinition>;
  themes: Record<string, TokenMap>; palettes: Record<string, Record<string, TokenMap>>;
  density: Record<string, TokenMap>; kits: Record<string, TokenMap>;
}
export interface ProjectTokens { schema: string; version: number; overrides: { global: TokenMap; light: TokenMap; dark: TokenMap } }
export type TokenCombinations = Record<string, TokenMap>;
export const axes: { themes: string[]; palettes: string[]; density: string[]; kits: string[] };
export const projectSchema: string;
export const projectMaxBytes: number;
export function compile(sources: TokenSources): Record<string, string>;
export function emptyProject(): ProjectTokens;
export function validateProject(sources: TokenSources, project: ProjectTokens): TokenCombinations;
export function parseProject(sources: TokenSources, text: string): { project: ProjectTokens; combinations: TokenCombinations };
export function parseStoredProject(sources: TokenSources, text: string): { project: ProjectTokens; combinations: TokenCombinations; removedBreakpoints: string[] };
export function projectJSON(project: ProjectTokens): string;
export function projectCSS(combinations: TokenCombinations): string;
