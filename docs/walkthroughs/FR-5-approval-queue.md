# FR-5 Note Approval Queue (Member 2)

**Files:** `server/features/fr05-approval-queue/{index,controller}.js`, `client/src/features/fr05-approval-queue/{ApprovalQueuePage.jsx,approval.css}`

## Flow
- New notes are `pending` (FR-2). Reviewers and admins open `/review/queue`.
- **Approve:** the note becomes `approved`, `reviewedBy` and `reviewedAt` are saved, and the author gets **+20 points** (`POINT_RULES.NOTE_APPROVED`) through `services/points.js`.
- **Decline:** needs a written reason (5 to 300 characters). The note becomes `declined` and the author sees the reason on the note page (FR-4).
- Nobody can approve or decline their own note, and their own notes are hidden from their queue.

## API (reviewer, admin)
- `GET /api/approvals?status=pending|approved|declined&page=` : pending is oldest first, the other tabs newest first. Also returns `pendingCount`.
- `POST /api/approvals/:id/approve`
- `POST /api/approvals/:id/decline` with `{ reason }`

## Test it
1. Make a reviewer: `npm run dev:make-reviewer -- reviewer@example.com`, then log in again.
2. Upload a note with another account, then open **Approval queue** as the reviewer.
3. Approve one (check the author's points), decline another without a reason (error), then with a reason (the author sees it).
4. Try approving a note you uploaded yourself: it is not in your queue.

## Likely questions
- *What if two reviewers click Approve together?* The update only matches `status: "pending"`, so exactly one succeeds and the other gets "already approved". The author is paid once.
- *Where does the +20 come from?* One shared rule table, `POINT_RULES` in `services/points.js`.
