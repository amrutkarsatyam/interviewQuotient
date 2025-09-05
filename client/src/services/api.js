import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"});

// add JWT token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);


export const register = (formData) => API.post("/auth/register", formData);
export const login = (formData) => API.post("/auth/login", formData);

// in services/api.js
export const getProfile = () => API.get("/auth/profile");


export const saveStats = (stats) => API.post("/interviews", stats);
export const getStats = () => API.get("/interviews");
