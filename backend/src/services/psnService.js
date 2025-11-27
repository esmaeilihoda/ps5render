import * as psn from 'psn-api';

// Lightweight wrapper to expose a couple helpers used by match verification
async function exchangeRefreshToken(refreshToken) {
  if (!refreshToken) return null;
  const candidates = [
    'refreshAuth',
    'exchangeRefreshToken',
    'exchangeRefreshTokenForAuthTokens',
    'getAccessTokenFromRefreshToken',
    ['oauth', 'refreshToken']
  ];

  for (const c of candidates) {
    try {
      if (Array.isArray(c)) {
        const [ns, fn] = c;
        if (psn[ns] && typeof psn[ns][fn] === 'function') return await psn[ns][fn](refreshToken);
      } else if (typeof psn[c] === 'function') {
        return await psn[c](refreshToken);
      }
    } catch (err) {
      // continue
    }
  }
  throw new Error('psnService.exchangeRefreshToken: no supported method found');
}

async function getRecentGameplay(accessToken, limit = 10) {
  if (!accessToken) return [];
  const candidates = ['getRecentlyPlayed', 'getRecentGameplay', 'getRecentTitles', ['user', 'getRecentlyPlayed']];
  for (const c of candidates) {
    try {
      if (Array.isArray(c)) {
        const [ns, fn] = c;
        if (psn[ns] && typeof psn[ns][fn] === 'function') return await psn[ns][fn](accessToken, limit);
      } else if (typeof psn[c] === 'function') {
        return await psn[c](accessToken, limit);
      }
    } catch (err) {
      // continue
    }
  }
  // If not available, return empty array
  return [];
}

export default {
  exchangeRefreshToken,
  getRecentGameplay
};
