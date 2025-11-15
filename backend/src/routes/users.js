import express from 'express';
import * as psn from 'psn-api';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import psnService from '../lib/psnService.js';

const router = express.Router();

function _extractRefreshToken(obj) {
  if (!obj) return null;
  return obj.refresh_token || obj.refreshToken || obj.refresh || obj.token || null;
}

async function _exchangeNpsso(npsso) {
  const candidates = [
    'getRefreshTokenFromNpsso',
    'exchangeNpsso',
    'exchangeNpssoForRefreshToken',
    'getRefreshToken',
    ['oauth', 'getRefreshTokenFromNpsso'],
    ['oauth', 'exchangeNpsso']
  ];

  let lastError = null;
  for (const c of candidates) {
    try {
      if (Array.isArray(c)) {
        const [ns, fn] = c;
        if (psn[ns] && typeof psn[ns][fn] === 'function') {
          const res = await psn[ns][fn](npsso);
          const token = _extractRefreshToken(res);
          if (token) return { token, raw: res };
        }
      } else if (typeof psn[c] === 'function') {
        const res = await psn[c](npsso);
        const token = _extractRefreshToken(res);
        if (token) return { token, raw: res };
      }
    } catch (err) {
      lastError = err;
      // eslint-disable-next-line no-console
      console.warn(`psn users route: candidate ${Array.isArray(c) ? c.join('.') : c} failed:`, err?.message || err);
    }
  }

  throw lastError || new Error('psn-api: no supported npsso exchange method found');
}

function _extractPsnOnlineId(profile) {
  if (!profile) return null;
  // Common field names observed in various responses
  return (
    profile.onlineId ||
    profile.onlineid ||
    profile.accountId ||
    profile.account_id ||
    profile.profileName ||
    profile.username ||
    (profile.user && (profile.user.onlineId || profile.user.accountId)) ||
    null
  );
}

/**
 * POST /link-psn
 * Body: { npsso: string }
 * Protected: requireAuth (req.user.id available)
 */
router.post('/link-psn', requireAuth, async (req, res) => {
  const { npsso } = req.body || {};
  if (!npsso) return res.status(400).json({ success: false, message: 'Missing npsso in request body' });

  try {
    // 1) Exchange npsso for a refresh token
    const exchange = await _exchangeNpsso(npsso);
    const refreshToken = exchange?.token;
    if (!refreshToken) {
      return res.status(500).json({ success: false, message: 'Failed to obtain refresh token from PSN' });
    }

    // 2) Use psnService to fetch profile (and optionally library). It expects a refresh token to obtain access token and profile.
    const profileResult = await psnService.getProfileData(refreshToken);
    if (!profileResult.success) {
      return res.status(502).json({ success: false, message: 'Failed to fetch PSN profile', detail: profileResult.error });
    }

    const profile = profileResult.profile;
    const onlineId = _extractPsnOnlineId(profile);
    if (!onlineId) {
      return res.status(502).json({ success: false, message: 'Unable to determine PSN Online ID from profile' });
    }

    // 3) Load current user from DB to compare stored psnId
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.psnId) {
      return res.status(400).json({ success: false, message: 'No PSN ID on your account to verify against' });
    }

    // 4) Validate ownership
    if (String(onlineId).toLowerCase() !== String(user.psnId).toLowerCase()) {
      return res.status(403).json({ success: false, message: 'PSN ID mismatch. You can only link the account you signed up with.' });
    }

    // 5) Update user record with refresh token and mark verified
    await prisma.user.update({ where: { id: req.user.id }, data: { psnRefreshToken: refreshToken, isPsnVerified: true } });

    return res.json({ success: true, message: 'PSN account linked and verified' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('POST /api/users/link-psn error:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /profile/:userId
 * Public endpoint to fetch a user's profile page data.
 * Combines: public user info, tournament history, and PSN profile/library (if verified).
 */
router.get('/profile/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params || {};
  if (!userId) return res.status(400).json({ success: false, message: 'Missing userId parameter' });

  try {
    // Fetch the user (including psnRefreshToken privately)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Public user info (omit passwordHash and psnRefreshToken)
    const publicUser = {
      id: user.id,
      email: user.email,
      psnId: user.psnId,
      isPsnVerified: user.isPsnVerified
    };

    // 1) Tournaments created by the user
    const createdTournaments = await prisma.tournament.findMany({ where: { createdById: userId } });

    // 2) Tournaments the user participated in (if a participants relation exists)
    let participatedTournaments = [];
    try {
      participatedTournaments = await prisma.tournament.findMany({ where: { participants: { some: { id: userId } } } });
    } catch (err) {
      // If the relation doesn't exist, skip — createdTournaments will still be returned
      // eslint-disable-next-line no-console
      console.warn('participants relation not present on Tournament model; skipping participatedTournaments');
    }

    // combine and dedupe tournaments by id
    const map = new Map();
    for (const t of createdTournaments) map.set(t.id, t);
    for (const t of participatedTournaments) map.set(t.id, t);
    const tournamentHistory = Array.from(map.values());

    // 3) If PSN is verified, fetch PSN profile & library using stored refresh token
    let psnData = null;
    if (user.isPsnVerified && user.psnRefreshToken) {
      try {
        const result = await psnService.getProfileData(user.psnRefreshToken);
        if (result.success) {
          psnData = { profile: result.profile, library: result.library };
        } else {
          // non-fatal: include error info but don't fail the whole request
          psnData = { error: result.error };
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to fetch PSN data for user', userId, err?.message || err);
        psnData = { error: { message: 'Failed to fetch PSN data' } };
      }
    }

    return res.json({ success: true, user: publicUser, tournaments: tournamentHistory, psn: psnData });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /api/users/profile/:userId error:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
