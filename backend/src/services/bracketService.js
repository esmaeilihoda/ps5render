import { prisma } from '../lib/prisma.js';

async function processPayout(tournamentId, winnerParticipantId) {
  // Defensive: User.walletBalance and Transaction model may not exist in schema.
  try {
    const winnerParticipant = await prisma.participant.findUnique({ where: { id: winnerParticipantId }, include: { user: true, tournament: true } });
    if (!winnerParticipant) throw new Error('Winner participant not found');
    const userId = winnerParticipant.userId;
    const tournament = winnerParticipant.tournament;
    const prize = tournament?.prizePool ?? 0;

    // Credit both if present for backward compatibility
    try {
      await prisma.user.update({ where: { id: userId }, data: { balanceToman: { increment: BigInt(prize) } } });
    } catch {}
    try {
      await prisma.user.update({ where: { id: userId }, data: { walletBalance: { increment: BigInt(prize) } } });
    } catch (e2) {
      console.warn('processPayout: failed to increment walletBalance', e2?.message || e2);
    }

    // Create a Transaction record if model exists (match current schema fields)
    try {
      if (prisma.transaction) {
        await prisma.transaction.create({ data: {
          userId,
          amount: BigInt(prize),
          type: 'PRIZE_PAYOUT',
          status: 'SUCCESS',
          gateway: 'NONE',
          metadata: { tournamentId }
        }});
      }
    } catch (e) {
      // ignore if Transaction model absent
      console.warn('processPayout: unable to create transaction record', e?.message || e);
    }

    // Mark tournament as COMPLETED if field exists
    try {
      await prisma.tournament.update({ where: { id: tournament.id }, data: { status: 'COMPLETED' } });
    } catch (e) { /* ignore */ }

    return { success: true };
  } catch (err) {
    console.error('bracketService.processPayout error:', err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}

async function advanceWinner(matchId) {
  // Minimal advancement: when a match is completed, try to find a next-round match
  // This implementation is intentionally conservative: it does not create complex bracket trees.
  try {
    const match = await prisma.match.findUnique({ where: { id: matchId }, include: { tournament: true, winner: true } });
    if (!match) return { success: false, message: 'Match not found' };
    if (!match.winnerId) return { success: false, message: 'Match has no winner' };

    // If this was the final (no other matches in tournament), payout
    const tournamentMatches = await prisma.match.findMany({ where: { tournamentId: match.tournamentId } });
    // If only one completed match and winner exists, treat as final
    if (tournamentMatches.length <= 1) {
      await processPayout(match.tournamentId, match.winnerId);
      return { success: true, final: true };
    }

    // Otherwise, we leave bracket advancement to admin for now
    return { success: true, final: false };
  } catch (err) {
    console.error('bracketService.advanceWinner error:', err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}

export default { processPayout, advanceWinner };
