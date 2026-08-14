"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api, LoginResponse } from "../api/client";

export type RoleLevelBadge = {
  level: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
};

export const LEVEL_STYLE_MAP: Record<number, RoleLevelBadge> = {
  1: { level: 1, badgeBg: "bg-purple-500/10", badgeText: "text-purple-400", badgeBorder: "border-purple-500/30" },
  2: { level: 2, badgeBg: "bg-amber-500/10", badgeText: "text-amber-400", badgeBorder: "border-amber-500/30" },
  3: { level: 3, badgeBg: "bg-blue-500/10", badgeText: "text-blue-400", badgeBorder: "border-blue-500/30" },
  4: { level: 4, badgeBg: "bg-emerald-500/10", badgeText: "text-emerald-400", badgeBorder: "border-emerald-500/30" },
  5: { level: 5, badgeBg: "bg-stone-500/10", badgeText: "text-stone-300", badgeBorder: "border-stone-500/30" },
  6: { level: 6, badgeBg: "bg-rose-500/10", badgeText: "text-rose-400", badgeBorder: "border-rose-500/30" },
};

export function getRoleBadgeStyle(level: number): RoleLevelBadge {
  return LEVEL_STYLE_MAP[level] || {
    level,
    badgeBg: "bg-cyan-500/10",
    badgeText: "text-cyan-400",
    badgeBorder: "border-cyan-500/30",
  };
}

interface AuthContextType {
  token: string | null;
  user: LoginResponse | null;
  isLoading: boolean;
  login: (phoneOrEmail: string, password: string) => Promise<LoginResponse>;
  loginPin: (phoneOrEmail: string, pin: string) => Promise<LoginResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  canManageUsers: boolean;
  isDirectorOrOwner: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("orderpum_token");
    const savedUser = localStorage.getItem("orderpum_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("orderpum_token");
        localStorage.removeItem("orderpum_user");
      }
    }
    setIsLoading(false);
  }, []);

  const saveAuth = (response: LoginResponse) => {
    setToken(response.accessToken);
    setUser(response);
    localStorage.setItem("orderpum_token", response.accessToken);
    localStorage.setItem("orderpum_user", JSON.stringify(response));
  };

  const login = async (phoneOrEmail: string, password: string) => {
    const res = await api.login(phoneOrEmail, password);
    saveAuth(res);
    return res;
  };

  const loginPin = async (phoneOrEmail: string, pin: string) => {
    const res = await api.loginPin(phoneOrEmail, pin);
    saveAuth(res);
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("orderpum_token");
    localStorage.removeItem("orderpum_user");
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const me = await api.getMe();
      if (user) {
        const updated: LoginResponse = {
          ...user,
          displayName: me.displayName,
          phoneOrEmail: me.phoneOrEmail,
          roleId: me.roleId,
          role: me.role,
          roleCode: me.roleCode,
          roleLevel: me.roleLevel,
          roleDisplayName: me.roleDisplayName,
          branchId: me.branchId,
          branchName: me.branchName,
        };
        setUser(updated);
        localStorage.setItem("orderpum_user", JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
  };

  const roleLevel = user?.roleLevel ?? 99;
  const canManageUsers = roleLevel <= 3;
  const isDirectorOrOwner = roleLevel <= 2;
  const isManager = roleLevel === 3;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        login,
        loginPin,
        logout,
        refreshUser,
        canManageUsers,
        isDirectorOrOwner,
        isManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
