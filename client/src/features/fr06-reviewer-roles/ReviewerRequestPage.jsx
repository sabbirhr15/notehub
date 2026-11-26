// FR-6: Reviewer Role Management  (Owner: Member 3)
// Route: /reviewer-request  (any logged-in user)
// A member sees how close they are to the requirements (20 approved notes, 100 likes) and can ask the admin
// to make them a reviewer.
import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatDate } from "../../utils/format.js";
import "./reviewers.css";

function Progress({ label, value, target }) {
  const percent = Math.min(100, Math.round((value / target) * 100));
  return (
    <div>
      <div className="progress-label">
        <span>{label}</span>
        <strong className={value >= target ? "ok-text" : ""}>
          {value} / {target}
        </strong>
      </div>
      <div className="progress-bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={target}>
        <div className={value >= target ? "done" : ""} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function ReviewerRequestPage() {
  const { user, login } = useAuth();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    return api
      .get("/api/reviewer-requests/me")
      .then(({ data: result }) => {
        setData(result);
        // The admin may have changed my role since I logged in. Keep the saved user in step,
        // so the menu shows the right links without logging in again.
        const token = localStorage.getItem("notehub_token");
        if (token && user && result.role !== user.role) login(token, { ...user, role: result.role });
      })
      .catch((err) => setError(errorMessage(err, "Could not load your status.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await api.post("/api/reviewer-requests", { message });
      setMessage("");
      setNotice("Your request was sent. The admin will look at it soon.");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return error ? <div className="alert alert-error">{error}</div> : <p className="muted">Loading...</p>;
  }

  const latest = data.latestRequest;
  const isStaff = data.role === "reviewer" || data.role === "admin";
  const pending = latest && latest.status === "pending";

  return (
    <div>
      <h1>Become a reviewer</h1>
      <p className="muted">
        Reviewers check new notes and write reviews. You can ask to become one after you have {data.required.uploads}{" "}
        approved notes and {data.required.likes} likes.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      {isStaff ? (
        <div className="alert alert-success">
          {data.role === "admin" ? "You are an admin, so you can already do everything a reviewer can." : "You are a reviewer. Thank you for helping the community!"}
        </div>
      ) : (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Your progress</h2>
          <div className="progress-list">
            <Progress label="Approved notes" value={data.approvedUploads} target={data.required.uploads} />
            <Progress label="Likes received" value={data.likesReceived} target={data.required.likes} />
          </div>

          {latest && (
            <div className={`alert ${latest.status === "approved" ? "alert-success" : latest.status === "rejected" ? "alert-error" : "alert-info"}`}>
              Your last request ({formatDate(latest.createdAt)}) is <strong>{latest.status}</strong>.
              {latest.adminNote ? ` Admin: ${latest.adminNote}` : ""}
            </div>
          )}

          {pending ? (
            <p className="muted">Please wait for the admin to decide on your request.</p>
          ) : data.eligible ? (
            <form className="form" onSubmit={handleSubmit} style={{ maxWidth: "none" }}>
              <div className="form-group">
                <label htmlFor="rr-message">Why do you want to be a reviewer? (optional)</label>
                <textarea
                  id="rr-message"
                  value={message}
                  maxLength={300}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell the admin a little about yourself."
                />
                <span className="form-hint">{message.length}/300</span>
              </div>
              <div className="btn-row">
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? "Sending..." : "Send request"}
                </button>
              </div>
            </form>
          ) : (
            <p className="muted">You can send a request as soon as both bars are full.</p>
          )}
        </section>
      )}
    </div>
  );
}
