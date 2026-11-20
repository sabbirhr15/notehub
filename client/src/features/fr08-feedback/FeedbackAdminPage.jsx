// FR-8: Feedback and Suggestions  (Owner: Member 2)
// Route: /admin/feedback  (admin only)
// Read what users sent, set a status and write a short answer.
import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../../api/axios.js";
import { formatDate } from "../../utils/format.js";
import "./feedback.css";

const TYPE_LABELS = { suggestion: "Suggestion", bug: "Bug report", other: "Other" };
const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
];

function AdminRow({ item, onSave, saving }) {
  const [status, setStatus] = useState(item.status);
  const [adminNote, setAdminNote] = useState(item.adminNote);
  const changed = status !== item.status || adminNote.trim() !== item.adminNote;

  return (
    <article className="feedback-item">
      <div className="feedback-head">
        <span className="badge badge-type">{TYPE_LABELS[item.type]}</span>
        <span className={`badge badge-${item.status}`}>{item.status}</span>
        <strong>{item.userName || "Deleted user"}</strong>
        <span className="muted">{item.userEmail}</span>
        <span className="muted">{formatDate(item.createdAt)}</span>
      </div>
      <p className="feedback-message">{item.message}</p>

      <div className="feedback-admin-form">
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status">
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
        </select>
        <input
          type="text"
          value={adminNote}
          maxLength={500}
          placeholder="Short answer for the user (optional)"
          onChange={(event) => setAdminNote(event.target.value)}
          aria-label="Answer for the user"
        />
        <button className="btn-primary" disabled={!changed || saving} onClick={() => onSave(item.id, { status, adminNote })}>
          Save
        </button>
      </div>
    </article>
  );
}

export default function FeedbackAdminPage() {
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return api
      .get("/api/feedback", { params: { status: status || undefined, type: type || undefined, page } })
      .then(({ data: result }) => setData(result))
      .catch((err) => setError(errorMessage(err, "Could not load feedback.")))
      .finally(() => setLoading(false));
  }, [status, type, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(id, changes) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.patch(`/api/feedback/${id}`, changes);
      setNotice("Saved.");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>All feedback{data ? ` (${data.newCount} new)` : ""}</h1>

      <div className="toolbar">
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter by status">
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value ? `Status: ${option.label}` : "Any status"}
            </option>
          ))}
        </select>
        <select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} aria-label="Filter by type">
          <option value="">Any type</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading && !data && <p className="muted">Loading...</p>}
      {data && data.feedback.length === 0 && !loading && <p className="muted">No feedback found.</p>}

      {data && (
        <div className="feedback-list">
          {data.feedback.map((item) => (
            // key includes updatedAt, so the row resets after a save
            <AdminRow key={`${item.id}-${item.updatedAt}`} item={item} onSave={handleSave} saving={saving} />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {data.page} of {data.totalPages}
          </span>
          <button disabled={page >= data.totalPages || loading} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
