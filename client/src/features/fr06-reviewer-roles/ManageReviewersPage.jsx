// FR-6: Reviewer Role Management  (Owner: Member 3)
// Route: /admin/reviewers  (admin only)
// Tab 1: reviewer requests (approve or reject). Tab 2: current reviewers (add by email, remove).
import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../../api/axios.js";
import { formatDate } from "../../utils/format.js";
import "./reviewers.css";

const STATUS_BADGE = { pending: "badge-pending", approved: "badge-approved", rejected: "badge-declined" };

function RequestItem({ request, onDecide, busy }) {
  const [adminNote, setAdminNote] = useState("");
  return (
    <article className="role-item">
      <div className="role-head">
        <strong>{request.userName}</strong>
        <span className="muted">{request.userEmail}</span>
        <span className={`badge ${STATUS_BADGE[request.status]}`}>{request.status}</span>
        <span className="muted">{formatDate(request.createdAt)}</span>
      </div>
      <div>
        <span className={request.approvedUploads >= 20 ? "ok-text" : "no-text"}>{request.approvedUploads} approved notes</span>
        {" | "}
        <span className={request.likesReceived >= 100 ? "ok-text" : "no-text"}>{request.likesReceived} likes</span>
        {request.status === "pending" && !request.meetsRequirements && (
          <span className="muted"> (below the requirements, you may still approve)</span>
        )}
      </div>
      {request.message && <p className="role-text">&ldquo;{request.message}&rdquo;</p>}
      {request.status !== "pending" && request.adminNote && <p className="role-text muted">Admin note: {request.adminNote}</p>}

      {request.status === "pending" && (
        <div className="role-actions">
          <input
            type="text"
            value={adminNote}
            maxLength={300}
            placeholder="Short note for the user (optional)"
            onChange={(event) => setAdminNote(event.target.value)}
            aria-label="Note for the user"
          />
          <button className="btn-primary" disabled={busy} onClick={() => onDecide(request.id, "approve", adminNote)}>
            Approve
          </button>
          <button className="btn-danger" disabled={busy} onClick={() => onDecide(request.id, "reject", adminNote)}>
            Reject
          </button>
        </div>
      )}
    </article>
  );
}

export default function ManageReviewersPage() {
  const [tab, setTab] = useState("requests");
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState(null);
  const [reviewers, setReviewers] = useState(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const request =
      tab === "requests"
        ? api.get("/api/reviewer-requests", { params: { status, page } }).then(({ data }) => setRequests(data))
        : api.get("/api/reviewer-requests/reviewers").then(({ data }) => setReviewers(data.reviewers));
    return request.catch((err) => setError(errorMessage(err, "Could not load the list."))).finally(() => setLoading(false));
  }, [tab, status, page]);

  // A new tab, filter or page starts clean. (run() below keeps its error, even though it reloads the list.)
  useEffect(() => {
    setError("");
    load();
  }, [load]);

  async function run(action, successText) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successText);
      await load();
    } catch (err) {
      setError(errorMessage(err));
      await load();
    } finally {
      setBusy(false);
    }
  }

  const decide = (id, action, adminNote) =>
    run(
      () => api.post(`/api/reviewer-requests/${id}/${action}`, { adminNote }),
      action === "approve" ? "Request approved. The user is now a reviewer." : "Request rejected."
    );

  function handlePromote(event) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Please enter the user's email.");
      return;
    }
    run(async () => {
      await api.post("/api/reviewer-requests/promote", { email });
      setEmail("");
    }, "The user is now a reviewer.");
  }

  function handleRemove(person) {
    if (!window.confirm(`Remove the reviewer role from ${person.name}?`)) return;
    run(() => api.post(`/api/reviewer-requests/demote/${person.id}`), `${person.name} is a normal member again.`);
  }

  return (
    <div>
      <h1>Reviewer management</h1>

      <div className="role-tabs">
        <button className={tab === "requests" ? "active" : ""} onClick={() => { setTab("requests"); setNotice(""); }}>
          Requests{requests && tab === "requests" ? ` (${requests.pendingCount} pending)` : ""}
        </button>
        <button className={tab === "reviewers" ? "active" : ""} onClick={() => { setTab("reviewers"); setNotice(""); }}>
          Current reviewers
        </button>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading...</p>}

      {tab === "requests" && (
        <>
          <div className="role-tabs">
            {["pending", "approved", "rejected"].map((value) => (
              <button key={value} className={status === value ? "active" : ""} onClick={() => { setStatus(value); setPage(1); }}>
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>

          {requests && !loading && requests.requests.length === 0 && <p className="muted">No {status} requests.</p>}

          <div className="role-list">
            {requests &&
              requests.requests.map((request) => (
                <RequestItem key={request.id} request={request} busy={busy} onDecide={decide} />
              ))}
          </div>

          {requests && requests.totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {requests.page} of {requests.totalPages}</span>
              <button disabled={page >= requests.totalPages || loading} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {tab === "reviewers" && (
        <>
          <form className="promote-form" onSubmit={handlePromote}>
            <input
              type="email"
              value={email}
              placeholder="Make someone a reviewer: type their email"
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Email of the user"
            />
            <button type="submit" className="btn-primary" disabled={busy}>Make reviewer</button>
          </form>
          <p className="muted">As an admin you can do this for anyone, even if they do not meet the requirements.</p>

          {reviewers && !loading && reviewers.length === 0 && <p className="muted">There are no reviewers yet.</p>}

          <div className="role-list">
            {reviewers &&
              reviewers.map((person) => (
                <article key={person.id} className="role-item">
                  <div className="role-head">
                    <strong>{person.name}</strong>
                    <span className="muted">{person.email}</span>
                    <span className="muted">{person.approvedUploads} approved notes | {person.likesReceived} likes</span>
                  </div>
                  <div className="role-actions">
                    <button className="btn-danger" disabled={busy} onClick={() => handleRemove(person)}>
                      Remove reviewer role
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
