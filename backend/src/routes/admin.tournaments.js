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
currency: z.enum(['TOMAN', 'USDT']).default('TOMAN'),
prizeDistribution: z.array(z.object({
  position: z.number().int().min(1),
  prize: z.number().int().min(0),
  percentage: z.number().min(0).max(100).optional()
})).optional().nullable(),
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
    const matches = await prisma.match.findMany({ 
      where: { tournamentId }, 
      orderBy: { round: 'asc' },
      include: {
        player1: { include: { user: { select: { name: true, psnId: true } } } },
        player2: { include: { user: { select: { name: true, psnId: true } } } },
        winner: { include: { user: { select: { name: true, psnId: true } } } }
      }
    });
    res.json({ success: true, matches });
  } catch (err) {
    console.error('List matches error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Finalize tournament and distribute prizes
// POST /api/admin/tournaments/:id/finalize
router.post('/:id/finalize', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: true,
        matches: { include: { winner: { include: { user: true } } } }
      }
    });
    
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
    if (tournament.status === 'COMPLETED') return res.status(400).json({ success: false, message: 'Already finalized' });
    if (!tournament.prizeDistribution || tournament.prizeDistribution.length === 0) {
      return res.status(400).json({ success: false, message: 'Prize distribution not configured' });
    }
    
    // Calculate rankings
    const participantStats = {};
    tournament.participants.forEach(p => {
      participantStats[p.id] = { participantId: p.id, userId: p.userId, wins: 0, points: 0 };
    });
    
    tournament.matches.forEach(match => {
      if (match.status === 'COMPLETED' && match.winnerId && participantStats[match.winnerId]) {
        participantStats[match.winnerId].wins += 1;
        participantStats[match.winnerId].points += 3;
      }
    });
    
    const rankings = Object.values(participantStats).sort((a, b) => b.wins - a.wins || b.points - a.points);
    
    // Distribute prizes
    const transactions = [];
    const prizeDistribution = Array.isArray(tournament.prizeDistribution) ? tournament.prizeDistribution : [];
      
    for (const prizeConfig of prizeDistribution) {
      const { position, prize } = prizeConfig;
      if (position <= rankings.length && prize > 0) {
        const winner = rankings[position - 1];
        const currency = tournament.currency || 'TOMAN';
        const updateData = currency === 'TOMAN'
          ? { balanceToman: { increment: prize } }
          : { balanceUsdt: { increment: prize } };
        
        await prisma.user.update({ where: { id: winner.userId }, data: updateData });
        
        const transaction = await prisma.transaction.create({
          data: {
            userId: winner.userId,
            amount: prize,
            currency,
            type: 'PRIZE_PAYOUT',
            description: `Prize for position ${position} in ${tournament.title}`,
            status: 'SUCCESS',
            gateway: 'INTERNAL'
          }
        });
        transactions.push(transaction);
      }
    }
    
    await prisma.tournament.update({ where: { id: tournamentId }, data: { status: 'COMPLETED' } });
    
    res.json({
      success: true,
      message: `Tournament finalized. ${transactions.length} prize(s) distributed.`,
      rankings: rankings.map((r, idx) => ({ position: idx + 1, ...r })),
      transactions
    });
  } catch (err) {
    console.error('Finalize tournament error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get tournament participants
router.get('/:id/participants', async (req, res) => {
  try {
    const participants = await prisma.participant.findMany({
      where: { tournamentId: req.params.id },
      include: { user: { select: { id: true, name: true, psnId: true } } },
      orderBy: { joinedAt: 'asc' }
    });
    res.json({ success: true, participants });
  } catch (err) {
    console.error('Get participants error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get tournament matches
router.get('/:id/matches', async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { tournamentId: req.params.id },
      include: {
        player1: { include: { user: { select: { id: true, name: true, psnId: true } } } },
        player2: { include: { user: { select: { id: true, name: true, psnId: true } } } },
        winner: { include: { user: { select: { id: true, name: true, psnId: true } } } }
      },
      orderBy: [{ round: 'asc' }, { createdAt: 'asc' }]
    });
    res.json({ success: true, matches });
  } catch (err) {
    console.error('Get matches error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a match
router.post('/:id/matches', async (req, res) => {
  try {
    const { player1Id, player2Id, round } = req.body;
    
    if (!player1Id || !player2Id) {
      return res.status(400).json({ success: false, message: 'Both players required' });
    }
    
    if (player1Id === player2Id) {
      return res.status(400).json({ success: false, message: 'Cannot match player against themselves' });
    }
    
    // Verify both are participants
    const participants = await prisma.participant.findMany({
      where: {
        tournamentId: req.params.id,
        id: { in: [player1Id, player2Id] },
        status: 'APPROVED'
      }
    });
    
    if (participants.length !== 2) {
      return res.status(400).json({ success: false, message: 'Both players must be approved participants' });
    }
    
    const match = await prisma.match.create({
      data: {
        tournamentId: req.params.id,
        player1Id,
        player2Id,
        round: round || 1,
        status: 'SCHEDULED',
        scheduledAt: new Date()
      },
      include: {
        player1: { include: { user: { select: { id: true, name: true, psnId: true } } } },
        player2: { include: { user: { select: { id: true, name: true, psnId: true } } } }
      }
    });
    
    res.json({ success: true, match });
  } catch (err) {
    console.error('Create match error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update match (scores, winner, status)
router.put('/:tournamentId/matches/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { score1, score2, status, winnerId } = req.body;
    
    const updateData = {};
    if (typeof score1 !== 'undefined') updateData.score1 = parseInt(score1);
    if (typeof score2 !== 'undefined') updateData.score2 = parseInt(score2);
    if (status) updateData.status = status;
    
    // Auto-determine winner from scores if not provided
    if (typeof score1 !== 'undefined' && typeof score2 !== 'undefined') {
      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (!match) {
        return res.status(404).json({ success: false, message: 'Match not found' });
      }
      
      if (score1 > score2) {
        updateData.winnerId = match.player1Id;
      } else if (score2 > score1) {
        updateData.winnerId = match.player2Id;
      }
    }
    
    if (winnerId) updateData.winnerId = winnerId;
    
    const updated = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        player1: { include: { user: { select: { id: true, name: true, psnId: true } } } },
        player2: { include: { user: { select: { id: true, name: true, psnId: true } } } },
        winner: { include: { user: { select: { id: true, name: true, psnId: true } } } }
      }
    });
    
    res.json({ success: true, match: updated });
  } catch (err) {
    console.error('Update match error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;