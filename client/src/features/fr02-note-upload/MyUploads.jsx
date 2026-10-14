// FR-2: Note Upload  (Owner: Member 2)
// The list of the user's own uploads, shown under the upload form.
import { useEffect, useState } from "react";
import api, { errorMessage } from "../../api/axios.js";
import NoteCard from "../../components/NoteCard.jsx";

// Changing refreshKey makes the list load again (the upload page does this after each upload).
export default function MyUploads({ refreshKey }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/upload/mine")
      .then(({ data }) => {
        if (!cancelled) setNotes(data.notes);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Could not load your uploads."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <section>
      <h2>My uploads</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && !error && notes.length === 0 && (
        <p className="muted">You have not uploaded any notes yet.</p>
      )}

      <div className="upload-list">
        {notes.map((note) => (
          <div key={note.id}>
            <NoteCard note={note} showStatus />
            {note.status === "declined" && note.declineReason && (
              <p className="alert alert-error upload-decline">Declined: {note.declineReason}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
