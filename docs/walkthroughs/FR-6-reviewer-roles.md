# FR-6 Reviewer Role Management (Member 3)

**Files:** `server/features/fr06-reviewer-roles/{index,controller}.js`, `server/models/ReviewerRequest.js` (shared model), `client/src/features/fr06-reviewer-roles/{ReviewerRequestPage,ManageReviewersPage}.jsx` + `reviewers.css`

## Flow
- A **member** opens **Become a reviewer** (`/reviewer-request`). Two progress bars show approved notes (need 20) and likes received (need 100). When both are full, the member can send a request with an optional message.
- The **admin** opens **Reviewers** (`/admin/reviewers`). Tab *Requests*: approve or reject each request, with an optional short note for the user. Tab *Current reviewers*: make any user a reviewer by email (no requirements needed), or remove the reviewer role again.
- Approving a request (or promoting by email) sets `User.role` to `reviewer`. The new reviewer can then use the approval queue (FR-5) and write reviews (FR-7).

## API (`/api/reviewer-requests`)
- `GET /me` (login): my role, my numbers, the requirements, my latest request.
- `POST /` (login): send a request. Refused if you are not a plain member (400), do not meet the requirements (403), or already have a pending request (409).
- `GET /?status=pending|approved|rejected&page=` (admin): requests with each user's numbers.
- `POST /:id/approve` and `POST /:id/reject` (admin): body `{ adminNote? }`. Only a pending request can be decided (409 otherwise).
- `GET /reviewers` (admin), `POST /promote` with `{ email }` (admin), `POST /demote/:userId` (admin). Admins cannot be demoted.

## How the numbers are counted
Approved notes = notes of the user with status `approved`. Likes = the sum of `likesCount` over those notes. Pending and declined notes do not count.

## Test it
1. Run `npm run seed:admin` once, and log in as the admin.
2. Register two members. For one of them, create 20 approved notes with 100 likes in total (or, for a quick test, use **Make reviewer** with the email).
3. As that member open **Become a reviewer**, check the bars, and send a request.
4. As the admin approve it. Log in again as the member (or just open the request page): the menu now shows **Approval queue**.
5. As the admin try an unknown email, remove a reviewer, and try to remove an admin (refused).

## Likely questions
- *Why does an admin approval not check the requirements again?* The admin may decide to make an exception, and the page shows the numbers so the admin can see them.
- *Why only `role: "member"` is changed on approve?* So an admin can never be downgraded to reviewer by mistake.
- *Where is the security?* The pages only hide things. `requireRole("admin")` on the server routes is the real protection.
- *Why a plain find and a loop for the counts?* It is simple and gives the same result on every MongoDB version.
