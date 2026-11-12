// pages/SubmitPitch.jsx (formerly SubmitIdea.jsx)
// Numbered step form to submit a new startup idea. Optionally triggers
// the AI evaluation right away, then sends the user to the details page.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../services/apiClient";
import ErrorMessage from "../components/ErrorMessage";

const ROAST_LEVELS = [
  { value: "Mild", text: "Gentle feedback" },
  { value: "Medium", text: "Cheeky roast" },
  { value: "Spicy", text: "Savage but fair" },
];

export default function SubmitPitch() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    problem: "",
    solution: "",
    targetCustomer: "",
    roastLevel: "Medium",
  });
  const [autoEvaluate, setAutoEvaluate] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  }

  function selectRoastLevel(level) {
    setForm({ ...form, roastLevel: level });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // 1) Create the idea.
      const createResponse = await api.post("/ideas", form);
      const ideaId = createResponse.data.idea._id;

      // 2) Optionally ask the AI investors for reviews.
      let aiError = "";

      if (autoEvaluate) {
        try {
          await api.post("/ideas/" + ideaId + "/evaluate");
        } catch (err) {
          // The idea was still created; we just could not get AI reviews.
          aiError = getErrorMessage(err);
        }
      }

      navigate("/ideas/" + ideaId, { state: { aiError: aiError } });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="container page">
      <div className="page-narrow">
        <div className="page-head">
          <span className="eyebrow">New submission</span>
          <h1>Submit a startup idea</h1>
          <p>
            Answer the four questions below. Three AI investors will evaluate
            it.
          </p>
        </div>

        <div className="card">
          <ErrorMessage message={error} />

          <form onSubmit={handleSubmit}>
            <div className="step-field">
              <span className="field-num">01 — Problem</span>
              <div className="field">
                <label className="label" htmlFor="problem">
                  What problem does your startup solve?
                </label>
                <textarea
                  className="textarea"
                  id="problem"
                  name="problem"
                  value={form.problem}
                  onChange={handleChange}
                  placeholder="Describe the pain point clearly..."
                  required
                />
                <span className="hint">At least 10 characters.</span>
              </div>
            </div>

            <div className="step-field">
              <span className="field-num">02 — Solution</span>
              <div className="field">
                <label className="label" htmlFor="solution">
                  How will your startup solve the problem?
                </label>
                <textarea
                  className="textarea"
                  id="solution"
                  name="solution"
                  value={form.solution}
                  onChange={handleChange}
                  placeholder="Explain your product or service..."
                  required
                />
                <span className="hint">At least 10 characters.</span>
              </div>
            </div>

            <div className="step-field">
              <span className="field-num">03 — Target customer</span>
              <div className="field">
                <label className="label" htmlFor="targetCustomer">
                  Who will use or buy your product?
                </label>
                <input
                  className="input"
                  id="targetCustomer"
                  name="targetCustomer"
                  type="text"
                  value={form.targetCustomer}
                  onChange={handleChange}
                  placeholder="e.g. university students in Pakistan"
                  required
                />
              </div>
            </div>

            <div className="step-field">
              <span className="field-num">04 — Roast level</span>
              <div className="field">
                <span className="label">How hard should the panel hit?</span>
                <div className="roast-options">
                  {ROAST_LEVELS.map((level) => (
                    <label
                      key={level.value}
                      className={
                        "roast-option" +
                        (form.roastLevel === level.value ? " selected" : "")
                      }
                    >
                      <input
                        type="radio"
                        name="roastLevel"
                        value={level.value}
                        checked={form.roastLevel === level.value}
                        onChange={() => selectRoastLevel(level.value)}
                      />
                      <strong>{level.value}</strong>
                      <span>{level.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="step-field">
              <div className="field" style={{ marginBottom: 12 }}>
                <label className="row" style={{ gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={autoEvaluate}
                    onChange={() => setAutoEvaluate(!autoEvaluate)}
                  />
                  <span>Get AI investor reviews immediately</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={submitting}
              >
                {submitting
                  ? autoEvaluate
                    ? "Submitting and evaluating..."
                    : "Submitting..."
                  : "Submit idea"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
