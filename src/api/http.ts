import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL + "/api"
  : "http://localhost:8000/api";

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
