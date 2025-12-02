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
  setAuthToken(_token: string | null) {},

  login(data: LoginPayload) {
    return http.post<{ token: string }>("/auth/login", data);
  },

  me() {
    return http.get<AuthUserDto>("/auth/me");
  },

  logout() {
    return http.post("/auth/logout");
  },
};
