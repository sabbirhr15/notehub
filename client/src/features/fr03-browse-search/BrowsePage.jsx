// FR-3: Browse, Search and Filter Notes  (Owner: Member 3)
// Route: /  (public)
import { useEffect, useState } from "react";
import api, { errorMessage } from "../../api/axios.js";
import NoteCard from "../../components/NoteCard.jsx";
import "./browse.css";

const EMPTY_FILTERS = { q: "", subject: "", className: "", tag: "", sort: "newest", page: 1 };

export default function BrowsePage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchText, setSearchText] = useState(""); // what the user is typing
  const [options, setOptions] = useState({ subjects: [], classNames: [], tags: [] });
  const [result, setResult] = useState({ notes: [], page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load the dropdown values once.
  useEffect(() => {
    api
      .get("/api/browse/filters")
      .then(({ data }) => setOptions(data))
      .catch(() => {}); // the page still works without the dropdowns
  }, []);

  // Wait until the user stops typing for a moment, then search. This avoids a request per key press.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => (current.q === searchText.trim() ? current : { ...current, q: searchText.trim(), page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Load the notes whenever a filter, the sort order or the page changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .get("/api/browse", { params: filters })
      .then(({ data }) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Could not load notes."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  function changeFilter(name, value) {
    setFilters({ ...filters, [name]: value, page: 1 }); // a new filter always starts from page 1
  }

  function clearAll() {
    setSearchText("");
    setFilters(EMPTY_FILTERS);
  }

  const hasFilters = filters.q || filters.subject || filters.className || filters.tag || filters.sort !== "newest";

  return (
    <div>
      <h1>Browse notes</h1>

      <div className="toolbar">
        <input
          type="search"
          className="toolbar-wide"
          placeholder="Search by title, subject, tag or description"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          aria-label="Search notes"
        />

        <select value={filters.subject} onChange={(e) => changeFilter("subject", e.target.value)} aria-label="Subject">
          <option value="">All subjects</option>
          {options.subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select value={filters.className} onChange={(e) => changeFilter("className", e.target.value)} aria-label="Class">
          <option value="">All classes</option>
          {options.classNames.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select value={filters.tag} onChange={(e) => changeFilter("tag", e.target.value)} aria-label="Tag">
          <option value="">All tags</option>
          {options.tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select value={filters.sort} onChange={(e) => changeFilter("sort", e.target.value)} aria-label="Sort by">
          <option value="newest">Newest first</option>
          <option value="likes">Most liked</option>
          <option value="downloads">Most downloaded</option>
        </select>
      </div>

      {hasFilters && (
        <p className="browse-clear">
          <button onClick={clearAll}>Clear search and filters</button>
        </p>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading notes...</p>}

      {!loading && !error && (
        <p className="muted browse-count">
          {result.total} {result.total === 1 ? "note" : "notes"} found
        </p>
      )}

      {!loading && !error && result.notes.length === 0 && (
        <p className="muted">No notes match. Try a different search or clear the filters.</p>
      )}

      <div className="note-grid">
        {result.notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>

      {result.pages > 1 && (
        <div className="pagination">
          <button disabled={loading || result.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>
            Previous
          </button>
          <span>
            Page {result.page} of {result.pages}
          </span>
          <button
            disabled={loading || result.page >= result.pages}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
