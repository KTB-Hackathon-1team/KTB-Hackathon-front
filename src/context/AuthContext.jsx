import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  loginRequest,
  logoutRequest,
  refreshAccessToken,
  signupRequest,
} from "@/api/authApi";
import {
  clearApiSession,
  setApiSession,
  subscribeApiSession,
} from "@/api/apiClient";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const applySession = useCallback((session) => {
    setApiSession(session);
    setUser(session.user);
    setIsRestoring(false);
  }, []);

  const clearSession = useCallback(() => {
    clearApiSession();
    setUser(null);
    setIsRestoring(false);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeApiSession((session) => {
      setUser(session?.user ?? null);
    });
    return unsubscribe;
  }, []);

  const restoreSession = useCallback(async () => {
    setIsRestoring(true);
    try {
      const session = await refreshAccessToken();
      setUser(session.user);
      return session;
    } finally {
      setIsRestoring(false);
    }
  }, []);

  useEffect(() => {
    restoreSession().catch(() => undefined);
  }, [restoreSession]);

  const login = useCallback(async (loginId, password) => {
    const session = await loginRequest(loginId, password);
    applySession(session);
    return session;
  }, [applySession]);

  const signup = useCallback(async (loginId, password, nickname) => {
    const session = await signupRequest(loginId, password, nickname);
    applySession(session);
    return session;
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(() => ({
    user,
    isRestoring,
    restoreSession,
    login,
    signup,
    logout,
  }), [isRestoring, login, logout, restoreSession, signup, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
