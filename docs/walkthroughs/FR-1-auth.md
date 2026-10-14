# FR-1 Registration and Login (Member 1)

**Files:** `server/features/fr01-auth/{index,controller}.js`, `server/middleware/auth.js`, `server/models/User.js`, `client/src/features/fr01-auth/{LoginPage,RegisterPage}.jsx`, `client/src/context/AuthContext.jsx`

## Flow
1. Register page posts `{name,email,password}` to `POST /api/auth/register`.
2. Server validates (name 2-60 chars, valid email, password 6-72), rejects a duplicate email with 409, hashes the password with bcryptjs, saves the user, returns `{token,user}`.
3. Client stores the token via `AuthContext.login(token,user)`; axios adds `Authorization: Bearer <token>` to every request.
4. `GET /api/auth/me` returns the current user (used to restore login after a refresh).
5. Login does the same check and returns the same message ("Invalid email or password") for wrong email or wrong password, so nobody can find out which emails exist.
6. `protect` middleware verifies the JWT (7 days) on protected routes. A 401 anywhere sends the user to /login, and after login they return to the page they wanted.

## Test it
Register, log out, log in, refresh the page (still logged in), try a wrong password, try the same email twice.

## Likely questions
- *Why not store plain passwords?* They are hashed; hashes cannot be reversed.
- *Why JWT?* Stateless; the server needs no session storage.
- *Why bcryptjs?* Pure JavaScript version of bcrypt, installs without build tools on any computer.
