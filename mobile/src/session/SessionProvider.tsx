import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { configuredDeck } from '../decks';
import { useRevealModeSettings } from '../settings/RevealModeProvider';
import { useSessionController } from './useSessionController';

export type SessionController = ReturnType<typeof useSessionController>;
const SessionContext = createContext<SessionController | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const {mode,ready}=useRevealModeSettings();
  const session = useSessionController(configuredDeck,mode,ready);
  const initialized = useRef(false);
  const { reset } = session;
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    reset();
  }, [reset]);
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionController {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used within a SessionProvider');
  return session;
}
