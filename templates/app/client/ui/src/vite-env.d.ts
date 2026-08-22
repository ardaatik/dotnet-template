/// <reference types="vite/client" />

interface ThemePaletteEntry {
  theme: string;
  variables: Record<string, string>;
}

interface Window {
  __THEME_PALETTES?: {
    light: ThemePaletteEntry[];
    dark: ThemePaletteEntry[];
  };
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ENTRA_CLIENT_ID?: string;
  readonly VITE_ENTRA_AUTHORITY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
