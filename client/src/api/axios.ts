import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("Missing VITE_API_URL");
}

const api = axios.create({
  baseURL: API_URL,
});

// Attach token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  const publicRoutes = ["/auth/login", "/auth/signup"];

  const url = config.url ?? "";

  if (token && !publicRoutes.includes(url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle expired/invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("token");
      window.location.href = "/";
    }

    return Promise.reject(error);
  },
);

export default api;
