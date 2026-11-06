import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { textSizeStorage, type TextSizeStorage } from '../platform/textSizeStorage';
import { isTextSize, textSizeScale, type TextSize } from './textSize';

type TextSizeSettings = {
  size: TextSize; scale: number; ready: boolean; setTextSize: (size: TextSize) => void;
  saveError: boolean; retrySave: () => void;
  retryTextSizeRestore: () => void; keepCurrentTextSize: () => void;
};
const TextSizeContext = createContext<TextSizeSettings | null>(null);
const fallback: TextSizeSettings = {
  size: 'standard', scale: 1, ready: true, setTextSize: () => {}, saveError: false,
  retrySave: () => {}, retryTextSizeRestore: () => {}, keepCurrentTextSize: () => {},
};

export function TextSizeProvider({ children, storage = textSizeStorage }: { children: ReactNode; storage?: TextSizeStorage }) {
  const [size, setSize] = useState<TextSize>('standard');
  const [ready, setReady] = useState(false), [saveError, setSaveError] = useState(false);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const current = useRef<TextSize>('standard'), revision = useRef(0), live = useRef(true);
  const writes = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    const version = revision.current;
    void Promise.resolve().then(() => storage.read()).then(saved => {
      if (active && revision.current === version) {
        const next = isTextSize(saved) ? saved : 'standard';
        current.current = next; setSize(next);
      }
    }, () => {}).then(() => { if (active && revision.current === version) setReady(true); });
    return () => { active = false; };
  }, [storage, restoreAttempt]);
  const retryTextSizeRestore = useCallback(() => {
    ++revision.current; setReady(false); setRestoreAttempt(value => value + 1);
  }, []);
  const keepCurrentTextSize = useCallback(() => { ++revision.current; setReady(true); }, []);
  const setTextSize = useCallback((next: TextSize) => {
    if (!isTextSize(next)) return;
    current.current = next;
    const version = ++revision.current;
    setSize(next); setReady(true); setSaveError(false);
    // Complete writes in order; stale outcomes cannot replace the current selection's status.
    const request = writes.current.catch(() => {}).then(() => storage.write(next));
    writes.current = request;
    void request.then(() => {
      if (live.current && revision.current === version) setSaveError(false);
    }, () => {
      if (live.current && revision.current === version) setSaveError(true);
    });
  }, [storage]);
  const retrySave = useCallback(() => setTextSize(current.current), [setTextSize]);
  const value = useMemo(() => ({ size, scale: textSizeScale[size], ready, setTextSize, saveError, retrySave, retryTextSizeRestore, keepCurrentTextSize }),
    [size, ready, setTextSize, saveError, retrySave, retryTextSizeRestore, keepCurrentTextSize]);
  return <TextSizeContext.Provider value={value}>{children}</TextSizeContext.Provider>;
}

export function useTextSizeSettings(): TextSizeSettings { return useContext(TextSizeContext) ?? fallback; }
