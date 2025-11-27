import { http } from "./http";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUserDto {
  id: number;
  email: string;
  name: string;
  surname: string;
  roles: string[];
  verified: boolean;
}

export const authApi = {
  setAuthToken(token: string | null) {
    if (token) {
      http.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete http.defaults.headers.common.Authorization;
    }
  },

  login(data: LoginPayload) {
    return http.post<{ token: string }>("/auth/login", data);
  },

  me() {
    return http.get<AuthUserDto>("/auth/me");
  },
};
