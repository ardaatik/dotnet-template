import darkThemes from '@/themes/dark.json';
import lightThemes from '@/themes/light.json';

export type ThemePaletteEntry = {
  theme: string;
  variables: Record<string, string>;
};

export type ResolvedTheme = 'light' | 'dark';

export const DEFAULT_PALETTE = 'Default';
const LEGACY_DEFAULT_PALETTE = 'Vercel';

function getThemePalettesFromWindow(): { light: ThemePaletteEntry[]; dark: ThemePaletteEntry[] } {
  const palettes = window.__THEME_PALETTES;
  if (palettes) {
    return palettes;
  }

  return {
    light: lightThemes as ThemePaletteEntry[],
    dark: darkThemes as ThemePaletteEntry[],
  };
}

export const lightPalettes = getThemePalettesFromWindow().light;
export const darkPalettes = getThemePalettesFromWindow().dark;

export function normalizePaletteName(name: string): string {
  return name === LEGACY_DEFAULT_PALETTE ? DEFAULT_PALETTE : name;
}

export function isDefaultPalette(name: string): boolean {
  return normalizePaletteName(name) === DEFAULT_PALETTE;
}

export function getPalettesForMode(mode: ResolvedTheme): ThemePaletteEntry[] {
  return mode === 'light' ? lightPalettes : darkPalettes;
}

export function findPalette(name: string, mode: ResolvedTheme): ThemePaletteEntry | null {
  const normalized = normalizePaletteName(name);
  const palettes = mode === 'light' ? lightPalettes : darkPalettes;
  return palettes.find(entry => entry.theme === normalized) ?? null;
}

export function isKnownPalette(name: string, mode: ResolvedTheme): boolean {
  return findPalette(name, mode) !== null;
}

const THEME_STYLE_ID = 'theme-palette-vars';

export function applyPaletteVariables(variables: Record<string, string>): void {
  const declarations = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  let styleEl = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = THEME_STYLE_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `:root,\n.dark {\n${declarations}\n}`;
}

function parsePrimaryFontFamily(fontStack: string): string {
  const first = fontStack.split(',')[0]?.trim() ?? '';
  return first.replace(/^['"]|['"]$/g, '');
}

const GEIST_SANS_STYLESHEET =
  'https://cdn.jsdelivr.net/npm/@fontsource-variable/geist@5.3.0/index.css';
const GEIST_MONO_STYLESHEET =
  'https://cdn.jsdelivr.net/npm/@fontsource/geist-mono@5.3.0/index.css';

const GEIST_FONT_FAMILIES = new Set(['Geist Variable', 'Geist Mono']);

const SYSTEM_FONT_FAMILIES = new Set([
  'Georgia',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'system-ui',
  'sans-serif',
  'serif',
  'monospace',
  'Cambria',
  'Times New Roman',
  'Times',
  'SFMono-Regular',
  'Menlo',
  'Monaco',
  'Consolas',
  'Liberation Mono',
  'Courier New',
]);

function buildGoogleFontsUrl(families: string[]): string | null {
  const googleFamilies = families.filter(
    family =>
      !SYSTEM_FONT_FAMILIES.has(family) &&
      !GEIST_FONT_FAMILIES.has(family) &&
      !family.startsWith('Inter ') &&
      family !== 'Inter'
  );

  if (googleFamilies.length === 0) {
    return null;
  }

  const params = googleFamilies
    .map(family => `family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;500;600;700`)
    .join('&');

  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

function upsertStylesheetLink(id: string, href: string | null): void {
  const existing = document.getElementById(id) as HTMLLinkElement | null;

  if (!href) {
    existing?.remove();
    return;
  }

  if (existing) {
    if (existing.href !== href) {
      existing.href = href;
    }
    return;
  }

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

export function loadPaletteFonts(variables: Record<string, string>): void {
  const fontStacks = ['--font-sans', '--font-serif', '--font-mono']
    .map(key => variables[key])
    .filter((value): value is string => Boolean(value));

  const families = [...new Set(fontStacks.map(parsePrimaryFontFamily).filter(Boolean))];
  const needsGeist = families.some(family => GEIST_FONT_FAMILIES.has(family));

  upsertStylesheetLink('theme-fonts', buildGoogleFontsUrl(families));
  upsertStylesheetLink(
    'theme-fonts-geist-sans',
    needsGeist && families.includes('Geist Variable') ? GEIST_SANS_STYLESHEET : null
  );
  upsertStylesheetLink(
    'theme-fonts-geist-mono',
    needsGeist && families.includes('Geist Mono') ? GEIST_MONO_STYLESHEET : null
  );
}

export function resolveThemeMode(theme: 'dark' | 'light' | 'system'): ResolvedTheme {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return theme;
}
