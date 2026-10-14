# FR-2 Note Upload (Member 2)

**Files:** `server/features/fr02-note-upload/{index,controller}.js`, `server/utils/noteFiles.js`, `server/config/gridfs.js`, `server/models/Note.js`, `client/src/features/fr02-note-upload/{UploadPage,MyUploads}.jsx`

## Flow
1. Logged-in user fills title, subject, class, tags, description (required) and picks a file. The page checks size/type first for quick feedback.
2. Sent as multipart form data to `POST /api/upload`. Multer keeps the file in memory (limit 10 MB).
3. Server re-validates the text fields, then `checkNoteFile`: extension whitelist **and** magic-byte check, so a renamed `.exe` is rejected.
4. File is saved to MongoDB GridFS (bucket `notefiles`); a Note is created with status `pending`. If creating the Note fails, the stored file is deleted.
5. `GET /api/upload/mine` lists the user's own uploads with status and decline reason.

## Test it
Upload a PDF and a DOCX; try a .exe, a renamed text file called .pdf, a file over 10 MB, and a missing description.

## Likely questions
- *Why GridFS?* Hosting services have temporary disks; storing files in the database keeps them.
- *Why check the content as well as the extension?* Extensions are easy to fake.
