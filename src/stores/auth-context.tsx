"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@/lib/types";
import { api } from "@/lib/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User, token?: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api
        .get<{ user: User }>("/api/auth/me")
        .then((res) => setUser({ ...res.user, avatar_url: localStorage.getItem("profile_avatar") || undefined }))
        .catch(() => api.setToken(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (emailOrPhone: string, password: string) => {
      const res = await api.post<{ token: string; user: User }>(
        "/api/auth/login",
        { identifier: emailOrPhone, password }
      );
      api.setToken(res.token);
      setUser({ ...res.user, avatar_url: localStorage.getItem("profile_avatar") || undefined });
    },
    []
  );

  const logout = useCallback(() => {
    api.setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser: User, token?: string) => {
    if (token) api.setToken(token);
    if (nextUser.avatar_url) localStorage.setItem("profile_avatar", nextUser.avatar_url);
    else localStorage.removeItem("profile_avatar");
    setUser(nextUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
