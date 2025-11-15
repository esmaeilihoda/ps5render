import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [groupsData, matchesData] = await Promise.all([
        api.groups.getAll(),
        api.matches.getAll(),
      ]);

      setGroups(groupsData);

      const formattedTournaments = matchesData.map((match) => {
        const group = groupsData.find((g) => g.id === match.groupId);
        return {
          id: match.id,
          game: group?.name || 'Unknown Tournament',
          date: new Date(match.kickoffAt).toLocaleDateString(),
          time: new Date(match.kickoffAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          homeTeam: match.home?.fullName || 'Team A',
          awayTeam: match.away?.fullName || 'Team B',
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          status: match.status,
          prize: '$5,000',
          players: 50,
          maxPlayers: 100,
          entry: '$25',
          tier: 'Standard',
          region: 'Global',
        };
      });

      setTournaments(formattedTournaments);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch tournaments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  return {
    tournaments,
    groups,
    loading,
    error,
    refetch: fetchTournaments,
  };
};
