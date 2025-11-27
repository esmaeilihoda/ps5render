import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/tournaments - Public endpoint to list tournaments
router.get('/', async (req, res) => {
  try {
    // Show PUBLISHED and COMPLETED tournaments to public
    // Hide DRAFT and CANCELED ones
    const tournaments = await prisma.tournament.findMany({
      where: { 
        status: {
          in: ['PUBLISHED', 'COMPLETED']
        }
      },
      orderBy: { startAt: 'asc' },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            psnId: true
          }
        }
      }
    });

    // Map to frontend-friendly format
    const items = tournaments.map(t => ({
      id: t.id,
      title: t.title,
      game: t.game,
      description: t.description,
      rules: t.rules,
      imageUrl: t.imageUrl,
      startAt: t.startAt,
      entryFee: t.entryFee,
      prizePool: t.prizePool,
      maxPlayers: t.maxPlayers,
      status: t.status,
      createdBy: t.createdBy
    }));

    res.json({ success: true, items });
  } catch (err) {
    console.error('List tournaments error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tournaments/:id - Get single tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            psnId: true
          }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    // Only show PUBLISHED and COMPLETED tournaments to public
    // Hide DRAFT and CANCELED
    if (!['PUBLISHED', 'COMPLETED'].includes(tournament.status)) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    res.json({
      success: true,
      tournament: {
        id: tournament.id,
        title: tournament.title,
        game: tournament.game,
        description: tournament.description,
        rules: tournament.rules,
        imageUrl: tournament.imageUrl,
        startAt: tournament.startAt,
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool,
        maxPlayers: tournament.maxPlayers,
        status: tournament.status,
        createdBy: tournament.createdBy
      }
    });
  } catch (err) {
    console.error('Get tournament error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

// POST /api/tournaments/:id/join - authenticated users join a tournament
router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const userId = req.user.id;

    // Ensure tournament exists and is PUBLISHED
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
    if (tournament.status !== 'PUBLISHED') return res.status(400).json({ success: false, message: 'Tournament not open for joining' });

    // Multi-currency join logic
    const currency = tournament.currency || 'TOMAN';
    const entryFee = Number(tournament.entryFee) || 0;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let sufficient = false;
    if (currency === 'TOMAN') {
      sufficient = Number(user.balanceToman) >= entryFee;
    } else if (currency === 'USDT') {
      sufficient = Number(user.balanceUsdt) >= entryFee;
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported currency' });
    }
    if (!sufficient) {
      return res.status(400).json({ success: false, message: 'Insufficient funds' });
    }

    // Deduct funds and create transaction
    const updateData = currency === 'TOMAN'
      ? { balanceToman: { decrement: entryFee } }
      : { balanceUsdt: { decrement: entryFee } };

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await prisma.transaction.create({
      data: {
        userId,
        amount: entryFee,
        currency,
        gateway: 'INTERNAL',
        status: 'SUCCESS',
        type: 'ENTRY_FEE',
        description: `Tournament entry fee for ${tournament.title}`,
      },
    });

    // Check if participant already exists
    const existing = await prisma.participant.findFirst({ where: { tournamentId, userId } });
    if (existing) return res.status(200).json({ success: true, participant: existing });

    // Create participant (default status PENDING)
    const participant = await prisma.participant.create({
      data: { tournamentId, userId }
    });

    res.status(201).json({ success: true, participant });
  } catch (err) {
    console.error('Join tournament error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* 
 * STATUS MAPPING:
 * 
 * Backend (Prisma) → Frontend (UI)
 * ----------------------------------
 * DRAFT           → (hidden from public, admin only)
 * PUBLISHED       → Mapped to 'open', 'upcoming', or 'live' based on startAt time
 * COMPLETED       → 'completed'
 * CANCELED        → (hidden from public)
 * 
 * The frontend (TournamentsPage.jsx) handles the time-based mapping:
 * - If startAt is in the future → 'open' or 'upcoming'
 * - If startAt <= now → 'live'
 * - If status is COMPLETED → 'completed'
 */