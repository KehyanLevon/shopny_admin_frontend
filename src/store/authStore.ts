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
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  initFromCookies: (force?: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const isAdmin = (user: AuthUser | null) =>
  !!user?.roles?.includes("ROLE_ADMIN");

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  loading: false,
  initialized: false,

  async initFromCookies(force: boolean = false) {
    const { initialized } = get();
    if (initialized && !force) return;

    set({ loading: true });

    try {
      const res = await authApi.me();
      const user = res.data;

      if (!isAdmin(user)) {
        set({ token: null, user: null });
      } else {
        set({ token: null, user });
      }
    } catch {
      set({ token: null, user: null });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  async login(email: string, password: string) {
    set({ loading: true });
    try {
      const res = await authApi.login({ email, password });

      const token = (res.data as any)?.token ?? null;

      const meRes = await authApi.me();
      const user = meRes.data as AuthUser;

      if (!isAdmin(user)) {
        try {
          if (authApi.logout) {
            await authApi.logout();
          }
        } catch {}

        set({ token: null, user: null });
        throw new Error("ACCESS_DENIED");
      }

      set({ token, user });
    } finally {
      set({ loading: false });
    }
  },

  async logout() {
    try {
      if (authApi.logout) {
        await authApi.logout();
      }
    } catch {}

    set({ token: null, user: null });
  },
}));
