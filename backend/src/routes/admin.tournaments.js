import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All endpoints are admin-only
router.use(requireAuth, requireAdmin);

const TournamentSchema = z.object({
title: z.string().min(3).max(100),
game: z.string().min(2).max(50),
description: z.string().max(2000).optional().nullable(),
rules: z.string().max(5000).optional().nullable(),
imageUrl: z.string().url().optional().nullable(),
entryFee: z.coerce.number().int().min(0),
prizePool: z.coerce.number().int().min(0),
maxPlayers: z.coerce.number().int().min(2).max(1024),
startAt: z.coerce.date(),
});

const Status = z.enum(['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELED']);

// List with optional q/status filters + pagination
router.get('/', async (req, res) => {
try {
const q = (req.query.q || '').toString().trim();
const status = req.query.status;
const page = Math.max(1, parseInt(req.query.page) || 1);
const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
const where = {};
if (q) {
  where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { game: { contains: q, mode: 'insensitive' } },
  ];
}
if (status && Status.safeParse(status).success) where.status = status;

const [items, total] = await Promise.all([
  prisma.tournament.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  }),
  prisma.tournament.count({ where }),
]);

res.json({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
} catch (err) {
console.error('List tournaments error', err);
res.status(500).json({ success: false, message: 'Server error' });
}
});

// Create
router.post('/', async (req, res) => {
try {
const parsed = TournamentSchema.safeParse(req.body);
if (!parsed.success) {
return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
}
const data = parsed.data;
const created = await prisma.tournament.create({
data: { ...data, createdById: req.user.id },
});
res.status(201).json({ success: true, tournament: created });
} catch (err) {
console.error('Create tournament error', err);
res.status(500).json({ success: false, message: 'Server error' });
}
});

// Read one
router.get('/:id', async (req, res) => {
const t = await prisma.tournament.findUnique({ where: { id: req.params.id } });
if (!t) return res.status(404).json({ success: false, message: 'Not found' });
res.json({ success: true, tournament: t });
});

// Update
router.put('/:id', async (req, res) => {
try {
const parsed = TournamentSchema.safeParse(req.body);
if (!parsed.success) {
return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
}
const updated = await prisma.tournament.update({
where: { id: req.params.id },
data: parsed.data,
});
res.json({ success: true, tournament: updated });
} catch (err) {
console.error('Update tournament error', err);
res.status(500).json({ success: false, message: 'Server error' });
}
});

// Delete
router.delete('/:id', async (req, res) => {
try {
await prisma.tournament.delete({ where: { id: req.params.id } });
res.json({ success: true });
} catch (err) {
console.error('Delete tournament error', err);
res.status(500).json({ success: false, message: 'Server error' });
}
});

// Change status
router.patch('/:id/status', async (req, res) => {
const s = Status.safeParse(req.body?.status);
if (!s.success) return res.status(400).json({ success: false, message: 'Invalid status' });
const updated = await prisma.tournament.update({
where: { id: req.params.id },
data: { status: s.data },
});
res.json({ success: true, tournament: updated });
});

export default router;

// Matches management (admin-only)
// Create a match: POST /api/admin/tournaments/:id/matches
router.post('/:id/matches', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const { player1Id, player2Id, round = 1, psnMatchId } = req.body || {};

    // simple validation
    if (!player1Id || !player2Id) return res.status(400).json({ success: false, message: 'player1Id and player2Id required' });

    // ensure participants belong to tournament
    const p1 = await prisma.participant.findUnique({ where: { id: player1Id } });
    const p2 = await prisma.participant.findUnique({ where: { id: player2Id } });
    if (!p1 || p1.tournamentId !== tournamentId) return res.status(400).json({ success: false, message: 'player1 invalid' });
    if (!p2 || p2.tournamentId !== tournamentId) return res.status(400).json({ success: false, message: 'player2 invalid' });

    const match = await prisma.match.create({
      data: {
        tournamentId,
        player1Id,
        player2Id,
        round: Number(round) || 1,
        psnMatchId: psnMatchId || null,
      }
    });

    res.status(201).json({ success: true, match });
  } catch (err) {
    console.error('Create match error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a match: PUT /api/admin/tournaments/:id/matches/:matchId
router.put('/:id/matches/:matchId', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const matchId = req.params.matchId;
    const { score1, score2, status, psnMatchId, round } = req.body || {};

    const existing = await prisma.match.findUnique({ where: { id: matchId } });
    if (!existing || existing.tournamentId !== tournamentId) return res.status(404).json({ success: false, message: 'Match not found' });

    const data = {};
    if (typeof score1 !== 'undefined') data.score1 = score1 === null ? null : Number(score1);
    if (typeof score2 !== 'undefined') data.score2 = score2 === null ? null : Number(score2);
    if (status) data.status = status;
    if (typeof psnMatchId !== 'undefined') data.psnMatchId = psnMatchId;
    if (typeof round !== 'undefined') data.round = Number(round);

    // compute winner if status is COMPLETED or both scores provided
    let winnerId = existing.winnerId;
    const newScore1 = typeof data.score1 !== 'undefined' ? data.score1 : existing.score1;
    const newScore2 = typeof data.score2 !== 'undefined' ? data.score2 : existing.score2;
    const newStatus = data.status || existing.status;
    if (newStatus === 'COMPLETED' && typeof newScore1 === 'number' && typeof newScore2 === 'number') {
      if (newScore1 > newScore2) winnerId = existing.player1Id;
      else if (newScore2 > newScore1) winnerId = existing.player2Id;
      else winnerId = null; // draw
      data.winnerId = winnerId;
    }

    const updated = await prisma.match.update({ where: { id: matchId }, data });
    res.json({ success: true, match: updated });
  } catch (err) {
    console.error('Update match error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// List matches for a tournament
router.get('/:id/matches', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const matches = await prisma.match.findMany({ where: { tournamentId }, orderBy: { round: 'asc' } });
    res.json({ success: true, matches });
  } catch (err) {
    console.error('List matches error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});