import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRouter from './routes/auth.js';
import adminTournamentsRouter from './routes/admin.tournaments.js';
import adminTransactionsRouter from './routes/admin.transactions.js';
import tournamentsRouter from './routes/tournaments.js';
import usersRouter from './routes/users.js';
import matchesRouter from './routes/matches.js';
import walletRouter from './routes/wallet.js';
import otpRouter from './routes/otp.js';

const app = express();
const PORT = process.env.PORT || 5001;
const ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());

app.use(cors({ origin: ORIGINS, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/admin/tournaments', adminTournamentsRouter);
app.use('/api/admin/transactions', adminTransactionsRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/otp', otpRouter);

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', authRouter);

app.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }));
// Export app for testing. Only listen when not in test mode.
export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}