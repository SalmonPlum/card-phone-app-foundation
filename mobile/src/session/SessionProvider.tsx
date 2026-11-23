import {useHistory} from '../history/HistoryProvider';
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { configuredDeck } from '../decks';
import { useRevealModeSettings } from '../settings/RevealModeProvider';
import { useSessionController } from './useSessionController';

export type SessionController = ReturnType<typeof useSessionController>;
const SessionContext = createContext<SessionController | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const {mode,ready}=useRevealModeSettings();
  const history=useHistory();
  const session = useSessionController(configuredDeck,mode,ready&&history.ready);
  const initialized = useRef(false);
  const { reset } = session;
  useEffect(() => {
    if (initialized.current||!history.ready) return;
    initialized.current = true;
    reset();
  }, [reset,history.ready]);
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionController {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used within a SessionProvider');
  return session;
}
