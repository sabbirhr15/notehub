// FR-4: Note Details, Like and Save  (Owner: Member 1)
// Route: /saved  (login required)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../../api/axios.js";
import NoteCard from "../../components/NoteCard.jsx";
import "./notes.css";

export default function SavedNotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/notes/saved")
      .then(({ data }) => {
        if (!cancelled) setNotes(data.notes);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Could not load your saved notes."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRemove(noteId) {
    setError("");
    try {
      await api.delete(`/api/notes/${noteId}/save`);
      setNotes((current) => current.filter((note) => note.id !== noteId));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div>
      <h1>Saved notes</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading...</p>}

      {!loading && notes.length === 0 && !error && (
        <p className="muted">
          You have not saved any notes yet. <Link to="/">Browse notes</Link> and use "Save for later".
        </p>
      )}

      <div className="note-grid">
        {notes.map((note) => (
          <div key={note.id} className="saved-item">
            <NoteCard note={note} />
            <button onClick={() => handleRemove(note.id)}>Remove from saved</button>
          </div>
        ))}
      </div>
    </div>
  );
}
