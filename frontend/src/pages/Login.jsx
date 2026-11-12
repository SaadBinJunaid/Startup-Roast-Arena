// pages/Login.jsx
// Login form in a split layout: ink brand panel on the left,
// form on the right. On success AuthContext saves the token and we
// go to the dashboard.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";
import { getErrorMessage } from "../services/apiClient";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="split">
      {/* Left: ink panel with a short pitch for returning users. */}
      <aside className="split-panel">
        <span className="eyebrow">Welcome back</span>
        <h1>The panel is waiting for your next pitch.</h1>
        <p>Log in to manage your ideas, votes and re-pitches.</p>

        <ul className="split-list">
          <li>Pick up where you left off on your drafts</li>
          <li>Track votes and leaderboard positions</li>
          <li>Re-run AI reviews on any version</li>
        </ul>
      </aside>

      {/* Right: the form. */}
      <section className="split-form">
        <div className="split-form-inner">
          <span className="eyebrow">Account login</span>
          <h2>Welcome back</h2>
          <p className="muted">
            New here? <Link to="/register">Create an account</Link>
          </p>

          <ErrorMessage message={error} />

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                className="input"
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                className="input"
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
            >
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
