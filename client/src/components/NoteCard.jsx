import { Link } from "react-router-dom";
import { fileKindLabel, formatDate } from "../utils/format.js";

// One note in a list. Used by Browse (FR-3), Saved notes (FR-4) and My uploads (FR-2).
export default function NoteCard({ note, showStatus = false }) {
  const shortDescription =
    note.description.length > 140 ? `${note.description.slice(0, 140)}...` : note.description;

  return (
    <article className="note-card">
      <div className="note-card-top">
        <span className="badge badge-kind">{fileKindLabel(note.fileKind)}</span>
        {showStatus && <span className={`badge badge-${note.status}`}>{note.status}</span>}
      </div>

      <h3 className="note-card-title">
        <Link to={`/notes/${note.id}`}>{note.title}</Link>
      </h3>

      <p className="note-card-meta">
        {note.subject}
        {note.className ? ` | ${note.className}` : ""}
      </p>

      <p className="note-card-desc">{shortDescription}</p>

      {note.tags.length > 0 && (
        <div className="tag-list">
          {note.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="note-card-footer">
        By {note.authorName} | {formatDate(note.createdAt)}
        <br />
        {note.likesCount} likes | {note.downloadsCount} downloads
      </p>
    </article>
  );
}
