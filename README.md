# NoteHub

A student notes sharing platform. Students upload notes, reviewers approve them, and other students browse, like, save and download them. Built as a 3-person course project.

**Stack:** React 18 (Vite) + React Router, Node.js + Express, MongoDB Atlas (Mongoose), JWT login, Multer + GridFS for file storage.

## Run it locally

Needs Node.js 18+ and a free MongoDB Atlas cluster.

**Server** (open a terminal in `server/`)

    npm install
    copy .env.example .env        (Mac/Linux: cp .env.example .env)

Fill in `.env`: `MONGO_URI` (with `notehub` before the `?`), `JWT_SECRET` (any long random text), and `ADMIN_*` for the first admin. Then:

    npm run dev                   # http://localhost:5000
    npm run seed:admin            # once, creates the admin account

**Client** (second terminal in `client/`)

    npm install
    npm run dev                   # http://localhost:5173

Health check: http://localhost:5000/api/health

> Until the approval queue (FR-5, Module 2) is built, new uploads stay "pending". To test browsing, run `npm run dev:approve-all` in `server/` to approve every pending note.

## Project structure

    server/
      features/frXX-name/   one folder per functional requirement (index.js + controller.js)
      models/               User, Note, Interaction, PointTransaction
      middleware/           auth (JWT), error handler
      services/             shared logic (points, download gate)
      utils/                file checks, response shaping
      config/               database and GridFS
    client/src/
      features/frXX-name/   pages for each requirement
      components/           shared UI (navbar, note card, protected route)
      routes.jsx            every page is registered here once

Each server feature exports `{ basePath, router }` and is loaded automatically by `server/app.js`, so one member's work never needs edits in another member's files.

| FR | Feature | Owner |
|---|---|---|
| FR-1 | Registration and login | Member 1 |
| FR-2 | Note upload | Member 2 |
| FR-3 | Browse, search, filter | Member 3 |
| FR-4 | Note details, like, save, download | Member 1 |
| FR-5 to FR-12 | Modules 2 and 3 | in progress |

## Team workflow

1. **Pull** in GitHub Desktop before you start.
2. Work only inside your own feature folders.
3. **Commit**, then **Pull** again, then **Push**.
4. Never commit `.env` (it is in `.gitignore`).

Changes to shared files (models, middleware, utils, `routes.jsx`) are pushed by Sabbir first.

## Key rules in the app

- Files: PDF, PNG, JPG, WEBP, DOCX, PPTX, max 10 MB. The file type is checked by extension and by the file's real content.
- Every note needs an English description (max 500 characters).
- New notes are pending until a reviewer or admin approves them. Pending and declined notes are visible only to the author and staff.
- Files are download-only. The details page and description are free to read.
- A note can be liked once, not by its author. Downloading your own note is not counted.

## How we built it

We planned the requirements, data model and folder structure ourselves, then used an AI assistant (Claude) to help write and review code module by module. We read through each feature, ran it, and can explain how the request flows from the page to the database. The walkthroughs in `docs/walkthroughs/` describe each feature in detail. Backend flows (auth, upload validation, search, like/save, download) were tested against a database before hand-over.
