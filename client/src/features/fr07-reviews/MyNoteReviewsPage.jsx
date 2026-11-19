// FR-7: Note Reviews  (Owner: Member 1)
// Route: /my-reviews
// Tab 1: reviews that reviewers wrote on MY notes (I approve or reject them).
// Tab 2: reviews I wrote on other people's notes (any reviewer or admin).
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatDate } from "../../utils/format.js";
import { Stars } from "./ReviewsSection.jsx";
import "./reviews.css";

const STATUS_BADGE = { pending: "badge-pending", approved: "badge-approved", rejected: "badge-declined" };

function ReviewCard({ review, showReviewer, onDecide, busyId }) {
  return (
    <article className="review-card">
      <div className="note-card-top">
        <h3>
          <Link to={`/notes/${review.noteId}`}>{review.noteTitle || "Note"}</Link>
        </h3>
        <span className={`badge ${STATUS_BADGE[review.status]}`}>{review.status}</span>
      </div>
      <div className="review-head">
        <Stars value={review.rating} />
        {showReviewer && <strong>{review.reviewerName}</strong>}
        <span className="muted">{formatDate(review.createdAt)}</span>
      </div>
      <p className="review-comment">{review.comment}</p>
      {onDecide && review.status === "pending" && (
        <div className="btn-row review-actions">
          <button className="btn-primary" disabled={busyId === review.id} onClick={() => onDecide(review.id, "approve")}>
            Approve
          </button>
          <button disabled={busyId === review.id} onClick={() => onDecide(review.id, "reject")}>
            Reject
          </button>
        </div>
      )}
    </article>
  );
}

export default function MyNoteReviewsPage() {
  const { user } = useAuth();
  const canWrite = user && (user.role === "reviewer" || user.role === "admin");

  const [tab, setTab] = useState("incoming");
  const [filter, setFilter] = useState("pending");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const url = tab === "incoming" ? `/api/reviews/incoming?status=${filter}` : "/api/reviews/mine";
    return api
      .get(url)
      .then(({ data }) => setReviews(data.reviews))
      .catch((err) => setError(errorMessage(err, "Could not load reviews.")))
      .finally(() => setLoading(false));
  }, [tab, filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDecide(id, action) {
    setNotice("");
    setError("");
    setBusyId(id);
    try {
      await api.post(`/api/reviews/${id}/${action}`);
      setNotice(action === "approve" ? "Review approved. It is now public." : "Review rejected.");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <h1>Reviews</h1>

      <div className="tabs">
        <button className={tab === "incoming" ? "active" : ""} onClick={() => setTab("incoming")}>
          On my notes
        </button>
        {canWrite && (
          <button className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>
            Written by me
          </button>
        )}
      </div>

      {tab === "incoming" && (
        <>
          <p className="muted">
            A review is shown on your note only after you approve it. The reviewer earns points when you approve.
          </p>
          <div className="tabs">
            {["pending", "approved", "rejected"].map((value) => (
              <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </>
      )}

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading...</p>}

      {!loading && !error && reviews.length === 0 && (
        <p className="muted">
          {tab === "incoming"
            ? `No ${filter} reviews on your notes.`
            : "You have not written any reviews yet. Open an approved note to review it."}
        </p>
      )}

      <div className="review-list">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            showReviewer={tab === "incoming"}
            onDecide={tab === "incoming" ? handleDecide : null}
            busyId={busyId}
          />
        ))}
      </div>
    </div>
  );
}
