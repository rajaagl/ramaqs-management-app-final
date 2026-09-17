import axios from "axios";
import { API_BASE_URL } from "../config/endpoints";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Injecte le token JWT automatiquement sur chaque requête
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("access"); // ⚠️ à vérifier — voir ci-dessous

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
