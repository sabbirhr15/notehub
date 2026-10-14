// FR-1: User Registration and Login  (Owner: Member 1)
// Route: /register
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api, { errorMessage } from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./auth.css";

export default function RegisterPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Quick checks here save a trip to the server. The server checks everything again.
    if (form.name.trim().length < 2) return setError("Please enter your name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return setError("Please enter a valid email address");
    }
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (form.password !== form.confirm) return setError("The two passwords do not match");

    setBusy(true);
    try {
      const { data } = await api.post("/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      login(data.token, data.user); // sign the new user in straight away
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Could not create the account. Please try again."));
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Create an account</h1>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <form className="form form-narrow" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" type="text" autoComplete="name" value={form.name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
            />
            <span className="form-hint">At least 6 characters</span>
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="muted auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
