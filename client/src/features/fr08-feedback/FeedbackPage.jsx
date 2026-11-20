// FR-8: Feedback and Suggestions  (Owner: Member 2)
// Route: /feedback  (any logged-in user)
// Send a suggestion or bug report, and see what the admin answered.
import { useEffect, useState } from "react";
import api, { errorMessage } from "../../api/axios.js";
import { formatDate } from "../../utils/format.js";
import "./feedback.css";

const TYPE_LABELS = { suggestion: "Suggestion", bug: "Bug report", other: "Other" };

export default function FeedbackPage() {
  const [type, setType] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function loadMine() {
    return api
      .get("/api/feedback/mine")
      .then(({ data }) => setItems(data.feedback))
      .catch((err) => setError(errorMessage(err, "Could not load your feedback.")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadMine();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (message.trim().length < 10) {
      setError("Please write at least 10 characters.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/feedback", { type, message });
      setMessage("");
      setNotice("Thank you! Your feedback was sent to the admin.");
      await loadMine();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>Feedback and suggestions</h1>
      <p className="muted">Tell us what to improve, or report a problem. The admin reads every message.</p>

      <form className="form card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}

        <div className="form-group">
          <label htmlFor="fb-type">Type</label>
          <select id="fb-type" value={type} onChange={(event) => setType(event.target.value)}>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="fb-message">Your message</label>
          <textarea
            id="fb-message"
            value={message}
            maxLength={1000}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write your idea or describe the problem..."
          />
          <span className="form-hint">10 to 1000 characters ({message.length}/1000)</span>
        </div>

        <div className="btn-row">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Sending..." : "Send feedback"}
          </button>
        </div>
      </form>

      <h2>Your previous feedback</h2>
      {loading && <p className="muted">Loading...</p>}
      {!loading && items.length === 0 && <p className="muted">You have not sent any feedback yet.</p>}

      <div className="feedback-list">
        {items.map((item) => (
          <article key={item.id} className="feedback-item">
            <div className="feedback-head">
              <span className="badge badge-type">{TYPE_LABELS[item.type]}</span>
              <span className={`badge badge-${item.status}`}>{item.status}</span>
              <span className="muted">{formatDate(item.createdAt)}</span>
            </div>
            <p className="feedback-message">{item.message}</p>
            {item.adminNote && (
              <p className="feedback-reply">
                <strong>Admin:</strong> {item.adminNote}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
