// FR-4: Note Details, Like and Save  (Owner: Member 1)
// Route: /notes/:id  (anyone can read the details. Like, save and download need a login.)
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api, { errorMessage } from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { fileKindLabel, formatDate, formatSize } from "../../utils/format.js";
import "./notes.css";

// A failed download sends its JSON error as a blob. This reads the message out of it.
async function downloadErrorMessage(err) {
  const data = err.response && err.response.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (parsed.message) return parsed.message;
    } catch (e) {
      // fall through to the generic message
    }
  }
  return errorMessage(err, "Could not download the file. Please try again.");
}

export default function NoteDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState(null); // { type: "error" | "success", text }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    api
      .get(`/api/notes/${id}`)
      .then(({ data }) => {
        if (!cancelled) setNote(data.note);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err, "Could not load this note."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  async function handleLike() {
    setMessage(null);
    setBusy(true);
    try {
      const { data } = await api.post(`/api/notes/${id}/like`);
      setNote({ ...note, likedByMe: true, likesCount: data.likesCount });
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveToggle() {
    setMessage(null);
    setBusy(true);
    try {
      if (note.savedByMe) {
        await api.delete(`/api/notes/${id}/save`);
        setNote({ ...note, savedByMe: false });
      } else {
        await api.post(`/api/notes/${id}/save`);
        setNote({ ...note, savedByMe: true });
      }
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    setMessage(null);
    setBusy(true);
    try {
      const response = await api.get(`/api/notes/${id}/download`, { responseType: "blob" });
      // The browser cannot attach the login token to a plain link, so we fetch the file
      // with the API client and hand it to the browser as a download.
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = note.fileName || "note";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage({ type: "error", text: await downloadErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="muted">Loading note...</p>;
  if (loadError) {
    return (
      <div>
        <div className="alert alert-error">{loadError}</div>
        <Link to="/">Back to all notes</Link>
      </div>
    );
  }

  const approved = note.status === "approved";

  return (
    <div className="note-detail">
      <p>
        <Link to="/">&larr; All notes</Link>
      </p>

      {note.status === "pending" && (
        <div className="alert alert-info">
          This note is waiting for approval. Only you and the reviewers can see it.
        </div>
      )}
      {note.status === "declined" && (
        <div className="alert alert-error">
          This note was declined.
          {note.declineReason ? ` Reason: ${note.declineReason}` : ""}
        </div>
      )}

      <div className="card">
        <div className="note-detail-badges">
          <span className="badge badge-kind">{fileKindLabel(note.fileKind)}</span>
          {!approved && <span className={`badge badge-${note.status}`}>{note.status}</span>}
        </div>

        <h1 className="note-detail-title">{note.title}</h1>
        <p className="note-detail-description">{note.description}</p>

        {note.summary && (
          <div className="note-detail-summary">
            <strong>Summary</strong>
            <p>{note.summary}</p>
          </div>
        )}

        {note.tags.length > 0 && (
          <div className="tag-list">
            {note.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <dl className="detail-meta">
          <dt>Subject</dt>
          <dd>{note.subject}</dd>
          {note.className && (
            <>
              <dt>Class</dt>
              <dd>{note.className}</dd>
            </>
          )}
          <dt>Uploaded by</dt>
          <dd>{note.authorName}</dd>
          <dt>Uploaded on</dt>
          <dd>{formatDate(note.createdAt)}</dd>
          <dt>File</dt>
          <dd>
            {note.fileName}
            {note.fileSize ? ` (${formatSize(note.fileSize)})` : ""}
          </dd>
          <dt>Likes</dt>
          <dd>{note.likesCount}</dd>
          <dt>Downloads</dt>
          <dd>{note.downloadsCount}</dd>
        </dl>

        {message && (
          <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
            {message.text}
          </div>
        )}

        {user ? (
          <div className="btn-row">
            <button
              onClick={handleLike}
              disabled={busy || note.likedByMe || note.isOwner || !approved}
              title={note.isOwner ? "You cannot like your own note" : undefined}
            >
              {note.likedByMe ? "Liked" : "Like"}
            </button>
            <button onClick={handleSaveToggle} disabled={busy || !approved}>
              {note.savedByMe ? "Remove from saved" : "Save for later"}
            </button>
            <button className="btn-primary" onClick={handleDownload} disabled={busy}>
              Download file
            </button>
          </div>
        ) : (
          <p className="alert alert-info">
            <Link to="/login" state={{ from: location.pathname }}>
              Log in
            </Link>{" "}
            to like, save or download this note.
          </p>
        )}
      </div>
    </div>
  );
}
