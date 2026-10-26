import axios from "axios";

const api = axios.create({
  // Em produção, o build define VITE_API_URL (ex.: /api); em desenvolvimento, usa o backend local.
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("motormind_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("motormind_token"); 
      localStorage.removeItem("motormind_usuario");
    }

    return Promise.reject(error);
  },
);

export default api;
