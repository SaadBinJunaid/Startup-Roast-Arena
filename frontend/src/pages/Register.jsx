// pages/Register.jsx
// Sign-up form in a split layout: ink brand panel on the left,
// form on the right. On success AuthContext saves the token and we
// go to the dashboard.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";
import { getErrorMessage } from "../services/apiClient";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="split">
      {/* Left: ink panel explaining what the account gives you. */}
      <aside className="split-panel">
        <span className="eyebrow">Join the arena</span>
        <h1>Every great pitch starts with a submission.</h1>
        <p>Create a free account to submit ideas and face the panel.</p>

        <ul className="split-list">
          <li>Submit startup ideas in four simple fields</li>
          <li>Get scored by the Strict, Funny and Dreamer investors</li>
          <li>Collect community votes and climb the leaderboard</li>
          <li>Re-pitch improved versions and compare scores</li>
        </ul>
      </aside>

      {/* Right: the form. */}
      <section className="split-form">
        <div className="split-form-inner">
          <span className="eyebrow">Step 1 of 2</span>
          <h2>Create your account</h2>
          <p className="muted">
            Already have an account? <Link to="/login">Log in</Link>
          </p>

          <ErrorMessage message={error} />

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="name">
                Full name
              </label>
              <input
                className="input"
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Ali Khan"
                required
              />
            </div>

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
                placeholder="At least 6 characters"
                required
              />
              <span className="hint">Use at least 6 characters.</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
