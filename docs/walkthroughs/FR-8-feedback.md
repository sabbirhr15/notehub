# FR-8 Feedback and Suggestions (Member 2)

**Files:** `server/features/fr08-feedback/{index,controller}.js`, `server/models/Feedback.js`, `client/src/features/fr08-feedback/{FeedbackPage,FeedbackAdminPage}.jsx` + `feedback.css`

## Flow
- Any logged-in user opens `/feedback`, picks a type (suggestion, bug report, other) and writes 10 to 1000 characters.
- The admin opens `/admin/feedback`, filters by status or type, sets the status (`new`, `reviewed`, `resolved`) and may write a short answer.
- The user sees the status and the admin's answer under "Your previous feedback".
- One account can send at most 10 feedback messages in 24 hours, so the admin page cannot be flooded.

## API
- `POST /api/feedback` (login): create.
- `GET /api/feedback/mine` (login): my own feedback.
- `GET /api/feedback?status=&type=&page=` (admin): everything, with the sender's name and email, plus `newCount`.
- `PATCH /api/feedback/:id` (admin): `{ status?, adminNote? }`.

## Test it
1. As a member, send a suggestion and a bug report (try a message that is too short).
2. As the admin, open **All feedback**, filter by type, mark one as resolved with an answer.
3. As the member, open **Feedback** again and check the status and the answer.
4. As a member, open `/admin/feedback` directly: you get "Not allowed".

## Likely questions
- *Why is the admin check on the server too?* The client only hides the page. `requireRole("admin")` on the routes is the real protection.
- *Is the AI feedback analysis part of this?* No. It is a later AI phase (see PROGRESS notes).
