# FR-3 Browse, Search and Filter (Member 3)

**Files:** `server/features/fr03-browse-search/{index,controller}.js`, `client/src/features/fr03-browse-search/{BrowsePage.jsx,browse.css}`

## Flow
1. Home page (`/`, public) calls `GET /api/browse/filters` to fill the subject/class/tag dropdowns, and `GET /api/browse` for the notes.
2. Server query always starts with `status: approved`. Then optional: search text (partial, case-insensitive over title, subject, class, tags, description, summary), subject, class, tag, sort (newest / most liked / most downloaded), page and limit (max 50).
3. Search text is escaped so characters like `+` or `(` cannot break the query.
4. The page waits 400 ms after typing stops before searching, changing a filter returns to page 1, and a Clear button resets everything.

## Test it
Search a partial word, combine subject + tag, change sort, go to page 2, search `c++`.

## Likely questions
- *Why regex instead of a text index?* Text indexes only match whole words; students expect "graph" to find "graphs".
