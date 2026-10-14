# NoteHub setup guide (skeleton)

Follow these steps once on your computer.

## 1. Put the files in your repo folder

1. Unzip `notehub-skeleton.zip`.
2. Open your cloned `notehub` folder (in GitHub Desktop: `Repository > Show in Explorer`).
3. Copy everything from the unzipped folder into it: `server`, `client`, `.gitignore`, `SETUP.md`.
4. If asked about `.gitignore`, choose **Replace**.

## 2. Server setup

Open the `server` folder in a terminal (in VS Code: `Terminal > New Terminal`, then `cd server`).

1. Install packages:

        npm install

2. Create your secret file. Copy `.env.example` to a new file named `.env` (same folder):

   - Windows: `copy .env.example .env`
   - Mac/Linux: `cp .env.example .env`

3. Open `.env` and fill in:
   - `MONGO_URI`: your MongoDB Atlas link, with `notehub` before the `?`
   - `JWT_SECRET`: any long random text
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD`: for your first admin account

4. Start the server:

        npm run dev

   You should see `MongoDB connected` and `NoteHub server running on http://localhost:5000`.

5. Create the first admin account (open a second terminal in `server`, run once):

        npm run seed:admin

## 3. Client setup

Open another terminal in the `client` folder.

        npm install
        npm run dev

Open the link it shows (normally http://localhost:5173). You should see the NoteHub navbar and placeholder pages.

## 4. Quick check

- http://localhost:5000/api/health shows `{"status":"ok","app":"NoteHub"}`
- http://localhost:5000/api/auth/ping shows the FR-1 placeholder message

## Rules for everyone

- Never commit the `.env` file. It holds secrets. (`.gitignore` already blocks it.)
- Pull before you push.
- Only push your own feature folders.

## Where each feature lives

| FR | Server folder (`server/features/`) | Client folder (`client/src/features/`) | Owner |
|---|---|---|---|
| FR-1 | fr01-auth | fr01-auth | Member 1 |
| FR-2 | fr02-note-upload | fr02-note-upload | Member 2 |
| FR-3 | fr03-browse-search | fr03-browse-search | Member 3 |
| FR-4 | fr04-note-details | fr04-note-details | Member 1 |
| FR-5 | fr05-approval-queue | fr05-approval-queue | Member 2 |
| FR-6 | fr06-reviewer-roles | fr06-reviewer-roles | Member 3 |
| FR-7 | fr07-reviews | fr07-reviews | Member 1 |
| FR-8 | fr08-feedback | fr08-feedback | Member 2 |
| FR-9 | fr09-points | fr09-points | Member 3 |
| FR-10 | fr10-usage-limits | fr10-usage-limits | Member 1 |
| FR-11 | fr11-communities | fr11-communities | Member 2 |
| FR-12 | fr12-ai-summary | fr12-ai-summary | Member 3 |
