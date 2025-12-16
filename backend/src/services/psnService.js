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
  getRecentGameplay,
  
  /**
   * Verify match result from PSN API
   * @param {string} accessToken - PSN access token
   * @param {string} gameTitle - Game title (e.g., 'EA Sports FC 26')
   * @param {string} player1PsnId - Player 1's PSN ID
   * @param {string} player2PsnId - Player 2's PSN ID
   * @param {Date} matchDate - Match date to verify against
   * @returns {Promise<{winner: string, score1: number, score2: number}|null>}
   */
  async verifyMatchResult(accessToken, gameTitle, player1PsnId, player2PsnId, matchDate) {
    try {
      // Get recent gameplay for both players
      const player1Games = await getRecentGameplay(accessToken, 20);
      const player2Games = await getRecentGameplay(accessToken, 20);
      
      // Filter by game title and date range (within 24 hours of match)
      const matchWindow = 24 * 60 * 60 * 1000; // 24 hours in ms
      const matchTimestamp = matchDate.getTime();
      
      const player1Matches = player1Games.filter(game => 
        game.title?.includes(gameTitle) &&
        Math.abs(new Date(game.lastPlayedDateTime).getTime() - matchTimestamp) < matchWindow
      );
      
      const player2Matches = player2Games.filter(game => 
        game.title?.includes(gameTitle) &&
        Math.abs(new Date(game.lastPlayedDateTime).getTime() - matchTimestamp) < matchWindow
      );
      
      // Try to extract scores from game stats
      // This is game-specific - for FIFA/EA FC, look for match results
      // Note: PSN API may not provide detailed match scores for all games
      // This is a simplified implementation that would need game-specific logic
      
      if (player1Matches.length > 0 && player2Matches.length > 0) {
        // For now, return null indicating manual verification needed
        // In production, this would parse game-specific stats
        return null;
      }
      
      return null;
    } catch (err) {
      console.error('PSN match verification error:', err);
      return null;
    }
  },
  
  /**
   * Get player statistics from PSN
   * @param {string} accessToken - PSN access token
   * @param {string} psnId - Player's PSN ID
   * @param {string} gameTitle - Game title
   * @returns {Promise<Object>}
   */
  async getPlayerStats(accessToken, psnId, gameTitle) {
    try {
      // This would require game-specific API calls
      // For now, return basic info
      const recentGames = await getRecentGameplay(accessToken, 50);
      const gameStats = recentGames.filter(g => g.title?.includes(gameTitle));
      
      return {
        gamesPlayed: gameStats.length,
        lastPlayed: gameStats[0]?.lastPlayedDateTime || null,
        playTime: gameStats.reduce((sum, g) => sum + (g.playDuration || 0), 0)
      };
    } catch (err) {
      console.error('Get player stats error:', err);
      return null;
    }
  }
};
