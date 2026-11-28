import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { login as apiLogin } from '../api/endpoints.js';
import { clearSession, getToken, getUser, saveSession, purgeTemporarySession } from './storage.js';

const AuthContext = createContext(null);

purgeTemporarySession();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(() => getUser());

  const login = useCallback(async (correo, contrasena, recordar) => {
    const data = await apiLogin(correo, contrasena);
    const t = data?.token || data?.accessToken;
    if (!t) throw new Error('Respuesta inesperada del servidor.');
    const u = data.usuario || data.user || { correo };
    saveSession(t, u, recordar);
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, isAuthenticated: !!token, login, logout }),
    [token, user, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
