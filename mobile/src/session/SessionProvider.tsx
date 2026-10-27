import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { configuredDeck } from '../decks';
import { useSessionController } from './useSessionController';

export type SessionController = ReturnType<typeof useSessionController>;
const SessionContext = createContext<SessionController | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useSessionController(configuredDeck);
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
