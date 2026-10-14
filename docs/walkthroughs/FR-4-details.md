# FR-4 Note Details, Like, Save, Download (Member 1)

**Files:** `server/features/fr04-note-details/{index,controller}.js`, `server/services/downloadGate.js`, `server/models/Interaction.js`, `client/src/features/fr04-note-details/{NoteDetailsPage,SavedNotesPage}.jsx`

## Flow
- `GET /api/notes/:id` (public, token optional): approved notes are visible to everyone; pending/declined only to the author and staff. The decline reason is hidden from others. Returns `likedByMe`, `savedByMe`, `isOwner`.
- `POST /api/notes/:id/like`: once per user, not on your own note, approved only (409 if repeated). Increases `likesCount`.
- `POST/DELETE /api/notes/:id/save`, `GET /api/notes/saved`: personal reading list.
- `GET /api/notes/:id/download`: login required. Calls `authorizeDownload` (currently always allowed; FR-10 will add the daily/monthly limit here without changing this route), streams the file from GridFS, logs a download and increases `downloadsCount` only for approved notes not owned by the downloader.
- Browsers cannot attach a login token to a normal link, so the page downloads through axios as a blob and saves it.

## Test it
Open a note logged out (details visible, buttons ask for login), like twice, like your own note, save/unsave, download and open the file.

## Likely questions
- *Why does like use a unique key?* The database itself blocks double likes even if two requests arrive together.
