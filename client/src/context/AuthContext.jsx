import { createContext, useContext, useState } from "react";

// Holds the logged-in user for the whole app.
// FR-1 calls login(token, user) after a successful login, and logout() from the navbar.
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("notehub_user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  function login(token, userData) {
    localStorage.setItem("notehub_token", token);
    localStorage.setItem("notehub_user", JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("notehub_token");
    localStorage.removeItem("notehub_user");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
