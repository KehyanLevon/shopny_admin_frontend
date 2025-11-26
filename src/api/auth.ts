import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
});

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post("/admin/login", data),
  register: (data: {
    email: string;
    password: string;
    name: string;
  }) => api.post("/admin/register", data),
  me: () => api.get("/admin/me"),
};
