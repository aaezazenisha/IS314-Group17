# JAATCampusStay Hostel Room Booking System

JAATCampusStay is the IS314 Group 17 university hostel accommodation portal.
This redesign preserves the working Stage 1 student account module and prepares
the shared visual and navigation foundation for the remaining group modules.

## Requirements

- Node.js 18 or newer
- npm

## Install and set up the database

```bash
npm install
npm run db:migrate
```

The migration creates `data/hostel.sqlite` with the `users` and `sessions`
tables. The local database and its WAL files are ignored by Git.

## Run locally

```bash
npm start
```

Open <http://localhost:3000>. For development with automatic restart, use
`npm run dev`. Set `PORT` to use another port, such as
`PORT=4000 npm start`.

## Stage 1 student account testing

1. Open the landing page and choose **Student login** or **Create student account**.
2. Register with a unique Student ID, full name, email, phone number, and a
   password of at least 8 characters.
3. Confirm required-field, email-format, password-match, short-password, and
   duplicate-account validation.
4. Log in with either the Student ID or registered email and password. The
   optional Remember Me checkbox extends the session duration.
5. Confirm `/dashboard` and `/profile` redirect to login after logout.
6. Edit the profile and confirm the updated values persist in SQLite.

## Admin login status

The `/admin/login` interface and `/admin/dashboard` route boundary are prepared
for the separate Admin Dashboard & Reports module. There is no public admin
registration and no hard-coded admin credential. Admin form submission
intentionally returns a clear not-yet-configured message rather than pretending
to authenticate. Students cannot use their student session to access an admin
dashboard.

## Implemented and prepared modules

**Implemented:** responsive JAATCampusStay landing/login experience, student
registration, bcrypt password hashing, database authentication, HTTP-only
sessions, logout, protected student dashboard, profile viewing/editing, and
validation.

**Integration placeholders:** room search (`/find-room`), bookings
(`/my-booking`), notifications (`/notifications`), and payments (`/payments`).
These routes show honest empty states and do not invent room, booking, payment,
or notification data.

**Prepared for future integration:** responsive student sidebar, separate admin
login boundary, administration branding, and reusable card/form styling.

## Project structure

- `server.js` - Express routes, validation, authentication, sessions, and placeholders
- `db.js` and `scripts/migrate.js` - SQLite connection and schema migration
- `views/` - EJS public, student portal, admin shell, and shared partials
- `public/styles.css` - responsive JAATCampusStay design system
- `data/` - local SQLite database created on first run
