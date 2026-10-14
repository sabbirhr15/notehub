import axios from "axios";

// Shared API client. Adds the login token to every request automatically.
// Locally the Vite proxy sends /api to the server. After deployment, set VITE_API_URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("notehub_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    // storage not available, continue without a token
  }
  return config;
});

export default api;
