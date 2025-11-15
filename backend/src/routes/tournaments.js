import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

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