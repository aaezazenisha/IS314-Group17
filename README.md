# CampusStay Hostel Room Booking System

Stage 1 of the IS314 Group 17 project: a working student account module for the
Hostel Room Booking System. This stage includes a responsive landing page,
student registration, secure login/logout, database-backed sessions, a protected
dashboard, and profile viewing/editing. Room listings, booking, payment,
notification, administration, and reports are intentionally reserved for later
stages.

## Requirements

- Node.js 18 or newer
- npm

## Installation and database setup

```bash
npm install
npm run db:migrate
```

The migration creates `data/hostel.sqlite` automatically. The database and its
WAL files are ignored by Git, so every developer gets a local database.

## Running the application

```bash
npm start
```

Open <http://localhost:3000>. During development, `npm run dev` starts Node's
watch mode and restarts the server when source files change. Set `PORT` to use
a different port, for example `PORT=4000 npm start`.

## Testing Stage 1 manually

1. Open the landing page and select **Create a student account**.
2. Submit an incomplete form, an invalid email, a short password, and mismatched
   passwords to verify validation messages.
3. Register with a unique Student ID and email. The password is stored as a
   bcrypt hash, never as plain text.
4. Confirm the dashboard is shown after registration. Open `/dashboard` in a
   private window or after logging out to verify unauthenticated access is
   redirected to login.
5. Log out, log in again with the database-backed credentials, and update the
   name, email, or phone number from **My profile**.
6. Try registering the same Student ID or email again to verify duplicate
   accounts are rejected.

## Project structure

- `server.js` - Express routes, validation, authentication, and session handling
- `db.js` and `scripts/migrate.js` - SQLite connection and schema migration
- `views/` - EJS pages and shared navigation/footer partials
- `public/styles.css` - responsive application styling
- `data/` - local SQLite database created on first run (ignored by Git)
