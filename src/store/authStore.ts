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
  initFromCookies: (force?: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutFromOtherTab: () => void;
}
const isAdmin = (user: AuthUser | null) =>
  !!user?.roles?.includes("ROLE_ADMIN");

export const AUTH_EVENT_KEY = "shopny_auth_event";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  async initFromCookies(force?: boolean) {
    const { initialized } = get();
    if (initialized && !force) return;

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

        set({ user: null, initialized: true });
        throw new Error("ACCESS_DENIED");
      }

      set({ user, initialized: true });

      try {
        window.localStorage.setItem(
          AUTH_EVENT_KEY,
          JSON.stringify({ type: "login", ts: Date.now() })
        );
      } catch {}
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
      set({ user: null, initialized: true, loading: false });

      try {
        window.localStorage.setItem(
          AUTH_EVENT_KEY,
          JSON.stringify({ type: "logout", ts: Date.now() })
        );
      } catch {}
    }
  },
  logoutFromOtherTab() {
    set({ user: null, initialized: true, loading: false });
  },
}));
