import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import psnService from '../services/psnService.js';
import bracketService from '../services/bracketService.js';

const router = express.Router();

// POST /api/matches/:matchId/verify-psn
router.post('/:matchId/verify-psn', requireAuth, async (req, res) => {
  const { matchId } = req.params;
  try {
    const match = await prisma.match.findUnique({ where: { id: matchId }, include: { player1: { include: { user: true } }, player2: { include: { user: true } }, tournament: true } });
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    // Determine participants' PSN refresh tokens
    const p1Token = match.player1?.user?.psnRefreshToken;
    const p2Token = match.player2?.user?.psnRefreshToken;

    // Collect recent gameplay for both players
    const results = {};
    if (p1Token) {
      try {
        const p1Auth = await psnService.exchangeRefreshToken(p1Token);
        const access = p1Auth?.access_token || p1Auth?.accessToken || null;
        const recent = await psnService.getRecentGameplay(access, 10);
        results.player1 = recent;
      } catch (e) { results.player1Error = String(e); }
    }
    if (p2Token) {
      try {
        const p2Auth = await psnService.exchangeRefreshToken(p2Token);
        const access = p2Auth?.access_token || p2Auth?.accessToken || null;
        const recent = await psnService.getRecentGameplay(access, 10);
        results.player2 = recent;
      } catch (e) { results.player2Error = String(e); }
    }

    // Simple heuristic: if one player's recent gameplay shows the tournament.game title within last 2 hours, mark as winner
    const gameKey = match.tournament?.game || match.tournament?.title || null;
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    let decidedWinner = null;
    if (gameKey && results.player1 && Array.isArray(results.player1)) {
      if (results.player1.some(r => (new Date(r.playedAt || r.date || 0)).getTime() > twoHoursAgo && String(r.title || r.name || '').toLowerCase().includes(String(gameKey).toLowerCase()))) decidedWinner = 'player1';
    }
    if (!decidedWinner && gameKey && results.player2 && Array.isArray(results.player2)) {
      if (results.player2.some(r => (new Date(r.playedAt || r.date || 0)).getTime() > twoHoursAgo && String(r.title || r.name || '').toLowerCase().includes(String(gameKey).toLowerCase()))) decidedWinner = 'player2';
    }

    if (!decidedWinner) return res.json({ success: false, message: 'Unable to determine winner from recent PSN activity', results });

    const winnerParticipantId = decidedWinner === 'player1' ? match.player1Id : match.player2Id;
    const loserParticipantId = decidedWinner === 'player1' ? match.player2Id : match.player1Id;

    // Update match record as completed
    await prisma.match.update({ where: { id: matchId }, data: { status: 'COMPLETED', winnerId: winnerParticipantId } });

    // Advance bracket (best-effort)
    try { await bracketService.advanceWinner(matchId); } catch (e) { console.warn('advanceWinner error', e); }

    return res.json({ success: true, winner: winnerParticipantId });
  } catch (err) {
    console.error('POST /api/matches/:matchId/verify-psn error:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
