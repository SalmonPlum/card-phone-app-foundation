import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type TabInteraction = { blocked: boolean; setBlocked: (value: boolean) => void };
const TabInteractionContext = createContext<TabInteraction>({ blocked: false, setBlocked: () => {} });

export function TabInteractionProvider({ children }: { children: ReactNode }) {
  const [blocked, setBlocked] = useState(false);
  const value = useMemo(() => ({ blocked, setBlocked }), [blocked]);
  return <TabInteractionContext.Provider value={value}>{children}</TabInteractionContext.Provider>;
}

export function useTabInteraction() { return useContext(TabInteractionContext); }
