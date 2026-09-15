const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const { database } = require('./db');

const app = express();
const port = Number(process.env.PORT) || 3000;
const sessionCookie = 'hostel_session';
const sessionDuration = 1000 * 60 * 60 * 24 * 7;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function normalize(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createSession(userId, response) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + sessionDuration;
  database.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'
  ).run(hashToken(token), userId, expiresAt);
  response.cookie(sessionCookie, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: sessionDuration
  });
}

function destroySession(request, response) {
  const token = request.cookies[sessionCookie];
  if (token) {
    database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
  }
  response.clearCookie(sessionCookie);
}

// The session token is random in the browser and only its SHA-256 hash is stored.
function loadUser(request, response, next) {
  const token = request.cookies[sessionCookie];
  request.user = null;
  if (token) {
    const session = database.prepare(`
      SELECT users.id, users.student_id, users.full_name, users.email, users.phone
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    `).get(hashToken(token), Date.now());
    if (session) request.user = session;
  }
  next();
}

function requireAuth(request, response, next) {
  if (!request.user) return response.redirect('/login?error=Please+log+in+to+continue');
  next();
}

function renderWithMessage(request, response, template, data = {}) {
  response.render(template, { ...data, user: request.user, error: request.query.error, success: request.query.success });
}

app.use(loadUser);

app.get('/', (request, response) => {
  if (request.user) return response.redirect('/dashboard');
  renderWithMessage(request, response, 'landing');
});

app.get('/register', (request, response) => {
  renderWithMessage(request, response, 'register', { form: {} });
});

app.post('/register', async (request, response) => {
  const form = {
    studentId: normalize(request.body.studentId),
    fullName: normalize(request.body.fullName),
    email: normalize(request.body.email).toLowerCase(),
    phone: normalize(request.body.phone)
  };
  const password = request.body.password || '';
  const confirmPassword = request.body.confirmPassword || '';
  const errors = [];

  if (!form.studentId || !form.fullName || !form.email || !form.phone || !password || !confirmPassword) {
    errors.push('Please complete every required field.');
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.push('Enter a valid email address.');
  }
  if (password.length < 8) errors.push('Password must be at least 8 characters.');
  if (password !== confirmPassword) errors.push('Password and Confirm Password must match.');

  if (errors.length) {
    return response.status(400).render('register', {
      user: request.user,
      form,
      error: errors.join(' ')
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = database.prepare(`
      INSERT INTO users (student_id, full_name, email, phone, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `).run(form.studentId, form.fullName, form.email, form.phone, passwordHash);
    createSession(result.lastInsertRowid, response);
    response.redirect('/dashboard?success=Your+account+was+created+successfully.');
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(400).render('register', {
        user: request.user,
        form,
        error: 'That Student ID or email address is already registered.'
      });
    }
    console.error('Registration failed:', error);
    response.status(500).render('register', { user: request.user, form, error: 'Registration could not be completed. Please try again.' });
  }
});

app.get('/login', (request, response) => {
  renderWithMessage(request, response, 'login', { form: {} });
});

app.post('/login', async (request, response) => {
  const studentId = normalize(request.body.studentId);
  const password = request.body.password || '';
  const account = database.prepare('SELECT * FROM users WHERE student_id = ?').get(studentId);
  const validPassword = account ? await bcrypt.compare(password, account.password_hash) : false;

  if (!account || !validPassword) {
    return response.status(401).render('login', {
      user: request.user,
      form: { studentId },
      error: 'Student ID or password is incorrect.'
    });
  }
  createSession(account.id, response);
  response.redirect('/dashboard');
});

app.post('/logout', (request, response) => {
  destroySession(request, response);
  response.redirect('/?success=You+have+been+logged+out.');
});

app.get('/dashboard', requireAuth, (request, response) => {
  renderWithMessage(request, response, 'dashboard');
});

app.get('/profile', requireAuth, (request, response) => {
  renderWithMessage(request, response, 'profile', { form: request.user });
});

app.post('/profile', requireAuth, (request, response) => {
  const fullName = normalize(request.body.fullName);
  const email = normalize(request.body.email).toLowerCase();
  const phone = normalize(request.body.phone);
  if (!fullName || !email || !phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).render('profile', {
      user: request.user,
      form: { ...request.user, full_name: fullName, email, phone },
      error: 'Please provide a full name, phone number, and valid email address.'
    });
  }
  try {
    database.prepare(`
      UPDATE users SET full_name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(fullName, email, phone, request.user.id);
    response.redirect('/profile?success=Your+profile+was+updated.');
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(400).render('profile', {
        user: request.user,
        form: { ...request.user, full_name: fullName, email, phone },
        error: 'That email address is already in use.'
      });
    }
    console.error('Profile update failed:', error);
    response.status(500).render('profile', { user: request.user, form: request.user, error: 'Profile could not be updated.' });
  }
});

app.use((request, response) => response.status(404).render('404', { user: request.user }));

app.listen(port, () => {
  console.log(`Hostel Booking System running at http://localhost:${port}`);
});
