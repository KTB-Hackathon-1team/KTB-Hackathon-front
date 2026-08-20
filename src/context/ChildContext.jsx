import { createContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export const ChildContext = createContext(null);

export function ChildProvider({ children }) {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => {
    if (!user) setSelectedChildId(null);
  }, [user]);

  const value = useMemo(() => ({
    selectedChildId,
    selectChild: setSelectedChildId,
    clearSelectedChild: () => setSelectedChildId(null),
  }), [selectedChildId]);

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>;
}
