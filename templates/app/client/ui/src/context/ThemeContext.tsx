import {
  DEFAULT_PALETTE,
  applyPaletteVariables,
  findPalette,
  getPalettesForMode,
  isKnownPalette,
  loadPaletteFonts,
  normalizePaletteName,
  resolveThemeMode,
  type ResolvedTheme,
  type ThemePaletteEntry,
} from '@/lib/themePalette';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  paletteStorageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  palette: string;
  setPalette: (palette: string) => void;
  resolvedTheme: ResolvedTheme;
  palettes: ThemePaletteEntry[];
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  palette: DEFAULT_PALETTE,
  setPalette: () => null,
  resolvedTheme: 'light',
  palettes: [],
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function resolveStoredPalette(
  stored: string | null,
  mode: ResolvedTheme,
  fallback = DEFAULT_PALETTE
): string {
  const normalized = normalizePaletteName(stored || fallback);
  return isKnownPalette(normalized, mode) ? normalized : fallback;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  paletteStorageKey = 'dotnet-template-ui-palette',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [palette, setPaletteState] = useState<string>(() => {
    const mode = resolveThemeMode((localStorage.getItem(storageKey) as Theme) || defaultTheme);
    return resolveStoredPalette(localStorage.getItem(paletteStorageKey), mode);
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveThemeMode(theme));

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    const nextResolvedTheme = resolveThemeMode(theme);
    setResolvedTheme(nextResolvedTheme);
    root.classList.add(nextResolvedTheme);

    if (theme !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const systemTheme = resolveThemeMode('system');
      setResolvedTheme(systemTheme);
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    const entry = findPalette(palette, resolvedTheme);
    if (!entry) {
      return;
    }

    applyPaletteVariables(entry.variables);
    loadPaletteFonts(entry.variables);
  }, [palette, resolvedTheme]);

  const setTheme = (nextTheme: Theme) => {
    localStorage.setItem(storageKey, nextTheme);
    setThemeState(nextTheme);
  };

  const setPalette = (nextPalette: string) => {
    const normalized = normalizePaletteName(nextPalette);
    localStorage.setItem(paletteStorageKey, normalized);
    setPaletteState(normalized);
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      palette,
      setPalette,
      resolvedTheme,
      palettes: getPalettesForMode(resolvedTheme),
    }),
    [theme, palette, resolvedTheme]
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
