// FR-7: Note Reviews  (Owner: Member 1)
// Shown at the bottom of the note details page for approved notes.
// Everyone sees approved reviews. A reviewer or admin also gets a form to write one.
import { useEffect, useState } from "react";
import api, { errorMessage } from "../../api/axios.js";
import { formatDate } from "../../utils/format.js";
import "./reviews.css";

export function Stars({ value }) {
  const full = Math.round(value);
  return (
    <span className="stars" aria-label={`${value} out of 5`}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
}

export default function ReviewsSection({ noteId }) {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  function load() {
    return api
      .get(`/api/reviews/note/${noteId}`)
      .then(({ data: result }) => {
        setData(result);
        setLoadError("");
      })
      .catch((err) => setLoadError(errorMessage(err, "Could not load reviews.")));
  }

  useEffect(() => {
    setData(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);
    if (rating < 1) {
      setMessage({ type: "error", text: "Please choose a rating from 1 to 5." });
      return;
    }
    if (comment.trim().length < 10) {
      setMessage({ type: "error", text: "Please write at least 10 characters." });
      return;
    }
    setBusy(true);
    try {
      await api.post(`/api/reviews/note/${noteId}`, { rating, comment });
      setRating(0);
      setComment("");
      setMessage({ type: "success", text: "Review sent. It will show up after the note's author approves it." });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  if (loadError) return <div className="alert alert-error">{loadError}</div>;
  if (!data) return <p className="muted">Loading reviews...</p>;

  return (
    <section className="card reviews-section">
      <h2 style={{ marginTop: 0 }}>Reviews</h2>

      {data.count > 0 ? (
        <div className="reviews-summary">
          <Stars value={data.average} />
          <strong>{data.average.toFixed(1)} / 5</strong>
          <span className="muted">
            ({data.count} {data.count === 1 ? "review" : "reviews"})
          </span>
        </div>
      ) : (
        <p className="muted">No reviews yet.</p>
      )}

      {data.reviews.map((review) => (
        <div key={review.id} className="review-item">
          <div className="review-head">
            <Stars value={review.rating} />
            <strong>{review.reviewerName}</strong>
            <span className="muted">{formatDate(review.createdAt)}</span>
          </div>
          <p className="review-comment">{review.comment}</p>
        </div>
      ))}

      {data.mine && data.mine.status !== "approved" && (
        <div className={`alert ${data.mine.status === "rejected" ? "alert-error" : "alert-info"}`}>
          {data.mine.status === "pending"
            ? "Your review is waiting for the author's approval."
            : "The author did not approve your review, so it is not shown."}
        </div>
      )}

      {message && (
        <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>{message.text}</div>
      )}

      {data.canReview && (
        <form className="form review-form" onSubmit={handleSubmit}>
          <h3 style={{ margin: 0 }}>Write a review</h3>
          <div className="form-group">
            <label>Rating</label>
            <div className="rating-picker" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  className={rating === value ? "selected" : ""}
                  onClick={() => setRating(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="review-comment">Your review</label>
            <textarea
              id="review-comment"
              value={comment}
              maxLength={500}
              onChange={(event) => setComment(event.target.value)}
              placeholder="What is good about this note? What could be better?"
            />
            <span className="form-hint">10 to 500 characters ({comment.length}/500). You earn 5 points when the author approves it.</span>
          </div>
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Sending..." : "Send review"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
