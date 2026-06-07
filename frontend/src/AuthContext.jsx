import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await api.me();
        setUser(u);
      } catch { setUser(false); }
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const r = await api.login({ email, password });
    if (r.token) localStorage.setItem("ag_token", r.token);
    setUser(r);
    return r;
  };
  const register = async (email, password, name) => {
    const r = await api.register({ email, password, name });
    if (r.token) localStorage.setItem("ag_token", r.token);
    setUser(r);
    await api.seedDemo().catch(() => {});
    return r;
  };
  const logout = async () => {
    await api.logout().catch(() => {});
    localStorage.removeItem("ag_token");
    setUser(false);
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
