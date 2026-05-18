import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, tokenStore } from "../lib/api";
import type { User } from "../lib/types";

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<User>("/api/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const res = await api.post("/api/auth/login", { email, password });
        tokenStore.set(res.data.access_token);
        setUser(res.data.user);
        return res.data.user as User;
      },
      async signup(name, email, password) {
        const res = await api.post("/api/auth/signup", { name, email, password });
        tokenStore.set(res.data.access_token);
        setUser(res.data.user);
        return res.data.user as User;
      },
      logout() {
        tokenStore.clear();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
