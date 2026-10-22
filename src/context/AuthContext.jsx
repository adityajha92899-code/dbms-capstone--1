import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { server, TOKEN_KEY } from "../utils/server";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [ready, setReady] = useState(!localStorage.getItem(TOKEN_KEY));

  const refresh = useCallback(async () => {
    try { setUser((await server.get("/auth/me")).data.user); }
    catch (e) { if (e?.response?.status === 401) { localStorage.removeItem(TOKEN_KEY); setUser(null); } }
  }, []);

  // restore session from the stored JWT
  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) refresh().finally(() => setReady(true));
  }, [refresh]);

  const authenticate = async (path, body) => {
    const { data } = await server.post(`/auth/${path}`, body);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  };
  const login    = (email, password)       => authenticate("login", { email, password });
  const register = (name, email, password) => authenticate("register", { name, email, password });
  const logout   = () => { localStorage.removeItem(TOKEN_KEY); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
