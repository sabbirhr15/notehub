# FR-7 Note Reviews (Member 1)

**Files:** `server/features/fr07-reviews/{index,controller}.js`, `server/models/Review.js`, `server/seed/makeReviewer.js` (temporary), `client/src/features/fr07-reviews/{ReviewsSection,MyNoteReviewsPage}.jsx` + `reviews.css`. `NoteDetailsPage.jsx` (FR-4) renders `ReviewsSection` for approved notes.

## Flow
1. A **reviewer or admin** opens an approved note and sends a rating (1 to 5) and a comment (10 to 500 characters). The review starts as `pending`.
2. The **note's author** opens `/my-reviews` and approves or rejects it.
3. On approve, the review becomes public on the note page and the reviewer earns **+5 points** through `services/points.js`. A rejected review is never shown and earns nothing.

## API
- `POST /api/reviews/note/:noteId` (reviewer, admin): create. Not on your own note, not on a note that is not approved, only one review per reviewer per note (409).
- `GET /api/reviews/note/:noteId` (public): approved reviews, average rating, the caller's own review, and `canReview` (tells the page whether to show the form).
- `GET /api/reviews/mine`: reviews I wrote, any status.
- `GET /api/reviews/incoming?status=`: reviews written on my notes.
- `POST /api/reviews/:id/approve` and `/reject`: only the note's author, only while pending.

## Test it
1. Use three accounts: author (member), reviewer, and a second member. Run `npm run dev:make-reviewer -- reviewer@example.com` in `server/`, then log in again as that reviewer.
2. Author uploads a note and it gets approved (FR-5, or `npm run dev:approve-all`).
3. Reviewer writes a review on that note. Try a second review, a rating of 6, and reviewing the reviewer's own note.
4. Author opens **My reviews**, approves it, then checks the note page and the reviewer's points.

## Likely questions
- *Why can points not be paid twice?* Approving is one atomic database update that only matches a `pending` review, and a `pointsAwarded` flag flips from false to true once.
- *Why a unique index on note + reviewer?* The database itself blocks a second review, even if two requests arrive together.
- *Why does the author decide?* It is the course rule: a review counts only after the author approves it.
