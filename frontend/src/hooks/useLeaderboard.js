import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useLeaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const playersData = await api.players.getAll();

      const formattedPlayers = playersData
        .map((player, index) => ({
          rank: index + 1,
          prevRank: index + 1,
          name: player.fullName,
          avatar: '🎮',
          earnings: `$${(Math.random() * 100000).toFixed(0)}`,
          wins: Math.floor(Math.random() * 100),
          losses: Math.floor(Math.random() * 50),
          winRate: Math.floor(Math.random() * 100),
          tournaments: Math.floor(Math.random() * 100),
          level: ['Diamond', 'Platinum', 'Gold', 'Silver'][Math.floor(Math.random() * 4)],
          badge: ['Champion', 'Elite', 'Pro', 'Rising', 'Contender', 'Amateur'][
            Math.floor(Math.random() * 6)
          ],
        }))
        .sort((a, b) => b.wins - a.wins);

      setPlayers(formattedPlayers);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    players,
    loading,
    error,
    refetch: fetchLeaderboard,
  };
};
