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

// If the server says the login expired, clear it and send the user to the login page.
// Login and register requests are skipped, so a wrong password does not trigger this.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response && error.response.status;
    const url = (error.config && error.config.url) || "";
    if (status === 401 && !url.includes("/api/auth/login") && !url.includes("/api/auth/register")) {
      try {
        if (localStorage.getItem("notehub_token")) {
          localStorage.removeItem("notehub_token");
          localStorage.removeItem("notehub_user");
          window.location.assign("/login");
        }
      } catch (e) {
        // ignore storage problems
      }
    }
    return Promise.reject(error);
  }
);

// Turns an axios error into a message that is safe to show on screen.
export function errorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error && error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  if (error && error.request && !error.response) {
    return "Cannot reach the server. Is it running?";
  }
  return fallback;
}

export default api;
