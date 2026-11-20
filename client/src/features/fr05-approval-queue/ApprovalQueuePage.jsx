// FR-5: Note Approval Queue  (Owner: Member 2)
// Route: /review/queue  (reviewers and admins)
// Open a note to read its details and download the file, then approve it or decline it with a reason.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../../api/axios.js";
import { fileKindLabel, formatDate } from "../../utils/format.js";
import "./approval.css";

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
];

function QueueItem({ note, onApprove, onDecline, busy }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  function submitDecline() {
    if (reason.trim().length < 5) {
      setReasonError("Please write a reason (at least 5 characters).");
      return;
    }
    setReasonError("");
    onDecline(note.id, reason.trim());
  }

  return (
    <article className="queue-item">
      <div className="note-card-top">
        <span className="badge badge-kind">{fileKindLabel(note.fileKind)}</span>
        <span className={`badge badge-${note.status}`}>{note.status}</span>
      </div>

      <h3>
        <Link to={`/notes/${note.id}`}>{note.title}</Link>
      </h3>
      <p className="queue-meta">
        {note.subject}
        {note.className ? ` | ${note.className}` : ""} | by {note.authorName} | uploaded {formatDate(note.createdAt)}
      </p>
      <p className="queue-desc">{note.description}</p>
      {note.fileName && <p className="queue-meta">File: {note.fileName}</p>}

      {note.status === "declined" && note.declineReason && (
        <div className="alert alert-error" style={{ marginBottom: 0 }}>
          Reason: {note.declineReason}
        </div>
      )}
      {note.status !== "pending" && note.reviewedByName && (
        <p className="queue-meta">
          {note.status === "approved" ? "Approved" : "Declined"} by {note.reviewedByName}
          {note.reviewedAt ? ` on ${formatDate(note.reviewedAt)}` : ""}
        </p>
      )}

      {note.status === "pending" && !declining && (
        <div className="btn-row">
          <button className="btn-primary" disabled={busy} onClick={() => onApprove(note.id)}>
            Approve
          </button>
          <button className="btn-danger" disabled={busy} onClick={() => setDeclining(true)}>
            Decline
          </button>
          <Link to={`/notes/${note.id}`}>Open details and file</Link>
        </div>
      )}

      {note.status === "pending" && declining && (
        <div className="decline-box">
          <label htmlFor={`reason-${note.id}`}>
            <strong>Why are you declining this note?</strong> The author will see this reason.
          </label>
          <textarea
            id={`reason-${note.id}`}
            value={reason}
            maxLength={300}
            onChange={(event) => setReason(event.target.value)}
            placeholder="For example: the scan is blurry, please upload a clearer file."
          />
          {reasonError && <div className="alert alert-error" style={{ marginBottom: 0 }}>{reasonError}</div>}
          <div className="btn-row">
            <button className="btn-danger" disabled={busy} onClick={submitDecline}>
              Confirm decline
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setDeclining(false);
                setReason("");
                setReasonError("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function ApprovalQueuePage() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return api
      .get("/api/approvals", { params: { status, page } })
      .then(({ data: result }) => setData(result))
      .catch((err) => setError(errorMessage(err, "Could not load the queue.")))
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id, action, body) {
    setNotice("");
    setError("");
    setBusy(true);
    try {
      await api.post(`/api/approvals/${id}/${action}`, body);
      setNotice(
        action === "approve"
          ? "Note approved. The author received 20 points."
          : "Note declined. The author can see your reason."
      );
      // If that was the last note on this page, go back one page.
      if (data && data.notes.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (err) {
      setError(errorMessage(err));
      await load(); // somebody else may have decided it already
    } finally {
      setBusy(false);
    }
  }

  function changeTab(value) {
    setStatus(value);
    setPage(1);
    setNotice("");
  }

  return (
    <div>
      <h1>Note approval queue</h1>
      <p className="muted">
        Check each new note, then approve it or decline it with a reason. You cannot approve your own notes, so they do
        not appear here.
      </p>

      <div className="queue-tabs">
        {TABS.map((tab) => (
          <button key={tab.value} className={status === tab.value ? "active" : ""} onClick={() => changeTab(tab.value)}>
            {tab.label}
            {tab.value === "pending" && data ? ` (${data.pendingCount})` : ""}
          </button>
        ))}
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading && !data && <p className="muted">Loading...</p>}

      {data && data.notes.length === 0 && !loading && (
        <p className="muted">{status === "pending" ? "Nothing is waiting for approval. Great job!" : `No ${status} notes yet.`}</p>
      )}

      {data && (
        <div className="queue-list">
          {data.notes.map((note) => (
            <QueueItem
              key={note.id}
              note={note}
              busy={busy}
              onApprove={(id) => decide(id, "approve")}
              onDecline={(id, reason) => decide(id, "decline", { reason })}
            />
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
