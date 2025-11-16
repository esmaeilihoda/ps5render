import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRouter from './routes/auth.js';
import adminTournamentsRouter from './routes/admin.tournaments.js';
import tournamentsRouter from './routes/tournaments.js';
import usersRouter from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 5001;
// If CLIENT_ORIGIN is set, split into an array of allowed origins. If not set,
// leave it empty so we don't default to a localhost origin in production.
const ORIGINS = (process.env.CLIENT_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);

// If ORIGINS is provided use that array. Otherwise allow the request origin
// to be reflected (useful when frontend and backend share origin or the host
// supplies dynamic origins). This avoids hardcoding localhost in production.
app.use(cors({ origin: ORIGINS.length ? ORIGINS : true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/admin/tournaments', adminTournamentsRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', authRouter);

app.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }));

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});