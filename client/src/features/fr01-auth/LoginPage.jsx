// FR-1: User Registration and Login  (Owner: Member 1)
// Route: /login
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import api, { errorMessage } from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./auth.css";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already logged in, so there is nothing to do here.
  if (user) return <Navigate to="/" replace />;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password");
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.post("/api/auth/login", form);
      login(data.token, data.user);
      // Go back to the page the user wanted before being asked to log in.
      navigate((location.state && location.state.from) || "/", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Could not log in. Please try again."));
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Log in</h1>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <form className="form form-narrow" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="muted auth-switch">
          New to NoteHub? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
