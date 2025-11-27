import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

const client = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
});

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  client,

  setAuthToken(token: string | null) {
    if (token) {
      client.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete client.defaults.headers.common.Authorization;
    }
  },

  login(data: LoginPayload) {
    return client.post<{ token: string }>("/login", data);
  },

  me() {
    return client.get<{
      id: number;
      email: string;
      name: string;
      surname: string;
      roles: string[];
      verified: boolean;
    }>("/me");
  },
};
