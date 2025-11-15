import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Calendar,
  Users,
  Filter,
  Search,
  Clock,
  Target,
  Zap,
  Star,
  Loader
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import '../styles/TournamentsPage.css';

function toCard(t) {
  const start = new Date(t.startAt);
  const now = new Date();
  const hoursUntilStart = (start - now) / (1000 * 60 * 60); // Convert ms to hours

  // Map backend status to UI buckets
  let status = 'open';
  
  if (t.status === 'COMPLETED') {
    status = 'completed';
  } else if (t.status === 'CANCELED') {
    return null; // Don't show canceled tournaments
  } else if (t.status === 'PUBLISHED') {
    if (start <= now) {
      // Tournament has started
      status = 'live';
    } else if (hoursUntilStart <= 24) {
      // Starting within 24 hours
      status = 'upcoming';
    } else {
      // Starting more than 24 hours away
      status = 'open';
    }
  } else {
    // DRAFT or other statuses shouldn't be visible to public
    return null;
  }

  const prize = Number(t.prizePool ?? 0);
  const entry = Number(t.entryFee ?? 0);

  const tier = prize >= 5000 ? 'Elite' : prize >= 1000 ? 'Premium' : 'Standard';

  return {
    id: t.id,
    game: t.title || t.game,
    status,
    date: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    time: start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    prize: `$${prize.toLocaleString()}`,
    entry: entry > 0 ? `$${entry.toFixed(2)}` : 'Free',
    players: 0, // Wire this later when join is implemented
    maxPlayers: t.maxPlayers || 0,
    tier,
    region: 'Global',
    startAt: t.startAt,
  };
}

const TournamentsPage = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.tournaments.list(); // GET /api/tournaments
        if (!cancel) {
          const mapped = (res.items || []).map(toCard).filter(Boolean);
          setItems(mapped);
        }
      } catch (e) {
        if (!cancel) setError(e.message || 'Failed to load tournaments');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const filters = [
    { id: 'all', label: t('tournaments.all') },
    { id: 'open', label: t('tournaments.open') },
    { id: 'upcoming', label: t('tournaments.upcoming') },
    { id: 'live', label: t('tournaments.live') },
    { id: 'completed', label: t('tournaments.completed') }
  ];

  const filteredTournaments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((tour) => {
      const matchesFilter = selectedFilter === 'all' || tour.status === selectedFilter;
      const matchesSearch = !q || tour.game.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [items, selectedFilter, searchQuery]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'status-live';
      case 'open': return 'status-open';
      case 'upcoming': return 'status-upcoming';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  return (
    <div className="tournaments-page">
      <section className="tournaments-hero">
        <div className="hero-bg-pattern"></div>
        <div className="tournaments-hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="hero-badge">
              <Trophy size={20} />
              <span>{t('tournaments.badge') || 'Compete & Win'}</span>
            </div>
            <h1 className="tournaments-hero-title">
              {t('tournaments.title') || 'Tournament'} <span className="text-gradient">{t('tournaments.titleGradient') || 'Arena'}</span>
            </h1>
            <p className="tournaments-hero-description">
              {t('tournaments.description') || 'Browse and join competitive PS5 tournaments across all major titles'}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="tournaments-main">
        <div className="tournaments-container">
          <div className="tournaments-controls">
            <div className="search-bar">
              <Search size={20} />
              <input
                type="text"
                placeholder={t('tournaments.search') || 'Search tournaments...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-tabs">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  className={`filter-tab ${selectedFilter === filter.id ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="loading-state">
              <Loader className="spin" size={28} />
              <span>Loading tournaments…</span>
            </div>
          )}

          {error && !loading && (
            <div className="no-results">
              <Filter size={48} />
              <h3>Error loading tournaments</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="tournaments-grid">
                {filteredTournaments.map((tournament, index) => (
                  <motion.div
                    key={tournament.id}
                    className="tournament-card-full"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                  >
                    <div className="tournament-card-header">
                      <div className={`tournament-status ${getStatusColor(tournament.status)}`}>
                        {tournament.status === 'live' && <span className="status-dot-pulse"></span>}
                        {tournament.status.toUpperCase()}
                      </div>
                      <div className="tournament-tier">
                        <Star size={14} />
                        {tournament.tier}
                      </div>
                    </div>

                    <h3 className="tournament-card-title">{tournament.game}</h3>

                    <div className="tournament-card-stats">
                      <div className="stat-row">
                        <div className="stat-item-inline">
                          <Calendar size={16} />
                          <span>{tournament.date}</span>
                        </div>
                        <div className="stat-item-inline">
                          <Clock size={16} />
                          <span>{tournament.time}</span>
                        </div>
                      </div>

                      <div className="stat-row">
                        <div className="stat-item-inline">
                          <Users size={16} />
                          <span>{tournament.players}/{tournament.maxPlayers} Players</span>
                        </div>
                        <div className="stat-item-inline region">
                          <Target size={16} />
                          <span>{tournament.region}</span>
                        </div>
                      </div>
                    </div>

                    <div className="tournament-progress-section">
                      <div className="progress-bar-full">
                        <div
                          className="progress-fill-full"
                          style={{ width: `${tournament.maxPlayers ? (tournament.players / tournament.maxPlayers) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <span>
                          {tournament.maxPlayers
                            ? `${Math.round((tournament.players / tournament.maxPlayers) * 100)}% Full`
                            : '—'}
                        </span>
                        <span>
                          {tournament.maxPlayers
                            ? `${Math.max(0, tournament.maxPlayers - tournament.players)} spots left`
                            : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="tournament-card-footer">
                      <div className="prize-pool">
                        <Trophy size={20} />
                        <div>
                          <div className="prize-label">Prize Pool</div>
                          <div className="prize-amount">{tournament.prize}</div>
                        </div>
                      </div>
                      <div className="entry-section">
                        <div className="entry-price">{tournament.entry}</div>
                        <button className="join-tournament-btn">
                          <Zap size={18} />
                          Join Now
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredTournaments.length === 0 && (
                <div className="no-results">
                  <Filter size={48} />
                  <h3>{t('tournaments.noResults') || 'No tournaments found'}</h3>
                  <p>{t('tournaments.noResultsDescription') || 'Try adjusting your filters or search query'}</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default TournamentsPage;