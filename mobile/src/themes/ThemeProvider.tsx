import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { themeStorage, type ThemeStorage } from '../platform/themeStorage';
import type { ThemeDefinition, ThemeResource } from './contracts';
import { themeResource } from './index';
import { validateThemeResource } from './validateThemeResource';

type ThemeSettings = {
  theme: ThemeDefinition; themes: readonly ThemeDefinition[]; ready: boolean;
  setTheme: (id: string) => void; saveError: boolean; retrySave: () => void;
  retryThemeRestore: () => void; keepCurrentTheme: () => void;
};
const ThemeContext = createContext<ThemeSettings | null>(null);
const defaultTheme = themeResource.themes.find(theme => theme.id === themeResource.defaultThemeId)!;
const fallback: ThemeSettings = {
  theme: defaultTheme, themes: themeResource.themes, ready: true,
  setTheme: () => {}, saveError: false, retrySave: () => {},
  retryThemeRestore: () => {}, keepCurrentTheme: () => {},
};

export function ThemeProvider({ children, storage = themeStorage, resource = themeResource }: {
  children: ReactNode; storage?: ThemeStorage; resource?: ThemeResource;
}) {
  const validated = useMemo(() => validateThemeResource(resource), [resource]);
  const [id, setId] = useState(validated.defaultThemeId);
  const [ready, setReady] = useState(false), [saveError, setSaveError] = useState(false);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const current = useRef(validated.defaultThemeId), revision = useRef(0), live = useRef(true);
  const writes = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    const version = revision.current;
    void Promise.resolve().then(() => storage.read()).then(saved => {
      if (active && revision.current === version) {
        const next = validated.themes.some(theme => theme.id === saved) ? saved! : validated.defaultThemeId;
        current.current = next; setId(next);
      }
    }, () => {}).then(() => { if (active && revision.current === version) setReady(true); });
    return () => { active = false; };
  }, [storage, validated, restoreAttempt]);
  const retryThemeRestore = useCallback(() => {
    ++revision.current; setReady(false); setRestoreAttempt(value => value + 1);
  }, []);
  const keepCurrentTheme = useCallback(() => {
    // Startup fallback is an explicit choice for this run, not a preference write.
    ++revision.current; setReady(true);
  }, []);
  const setTheme = useCallback((next: string) => {
    if (!validated.themes.some(theme => theme.id === next)) return;
    current.current = next;
    const version = ++revision.current;
    setId(next); setReady(true); setSaveError(false);
    // Serialize native writes so an older choice cannot overwrite the latest.
    const request = writes.current.catch(() => {}).then(() => storage.write(next));
    writes.current = request;
    void request.then(() => {
      if (live.current && revision.current === version) setSaveError(false);
    }, () => {
      if (live.current && revision.current === version) setSaveError(true);
    });
  }, [storage, validated]);
  const retrySave = useCallback(() => setTheme(current.current), [setTheme]);
  const theme = validated.themes.find(theme => theme.id === id)
    ?? validated.themes.find(theme => theme.id === validated.defaultThemeId)!;
  const value = useMemo(() => ({ theme, themes: validated.themes, ready, setTheme, saveError, retrySave, retryThemeRestore, keepCurrentTheme }),
    [theme, validated, ready, setTheme, saveError, retrySave, retryThemeRestore, keepCurrentTheme]);
  // No theme-dependent key or hydration gate: sessions and images stay mounted.
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeSettings(): ThemeSettings { return useContext(ThemeContext) ?? fallback; }
