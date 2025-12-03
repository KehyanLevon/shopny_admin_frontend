import { create } from "zustand";
import { authApi } from "../api/authApi";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  surname: string;
  roles: string[];
  verified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  initFromCookies: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const isAdmin = (user: AuthUser | null) =>
  !!user?.roles?.includes("ROLE_ADMIN");

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  async initFromCookies() {
    const { initialized } = get();
    if (initialized) return;

    set({ loading: true });

    try {
      const res = await authApi.me();
      const user = res.data as AuthUser;

      if (!isAdmin(user)) {
        set({ user: null });
      } else {
        set({ user });
      }
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  async login(email: string, password: string) {
    set({ loading: true });
    try {
      await authApi.login({ email, password });
      const meRes = await authApi.me();
      const user = meRes.data as AuthUser;

      if (!isAdmin(user)) {
        try {
          if (authApi.logout) {
            await authApi.logout();
          }
        } catch {}

        set({ user: null });
        throw new Error("ACCESS_DENIED");
      }

      set({ user, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  async logout() {
    set({ loading: true });
    try {
      if (authApi.logout) {
        await authApi.logout();
      }
    } catch {
    } finally {
      set({ user: null, initialized: false, loading: false });
    }
  },
}));
