import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  TrendingUp,
  TrendingDown,
  Trophy,
  Zap,
  Target,
  Award,
  Medal
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLeaderboard } from '../hooks/useLeaderboard';
import Navbar from '../components/Navbar';
import '../styles/LeaderboardPage.css';

const LeaderboardPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const { t } = useLanguage();
  const { players: apiPlayers, loading, error } = useLeaderboard();

  const periods = [
    { id: 'daily', label: t('leaderboard.daily') },
    { id: 'weekly', label: t('leaderboard.weekly') },
    { id: 'monthly', label: t('leaderboard.monthly') },
    { id: 'alltime', label: t('leaderboard.allTime') }
  ];

  const leaderboardData = apiPlayers.length > 0 ? apiPlayers : [
    {
      rank: 1,
      prevRank: 2,
      name: 'Shadow_King',
      avatar: '👑',
      earnings: '$127,450',
      wins: 48,
      losses: 12,
      winRate: 80,
      tournaments: 60,
      level: 'Diamond',
      badge: 'Champion'
    },
    {
      rank: 2,
      prevRank: 1,
      name: 'ProGamer_X',
      avatar: '⚡',
      earnings: '$98,230',
      wins: 42,
      losses: 15,
      winRate: 74,
      tournaments: 57,
      level: 'Diamond',
      badge: 'Elite'
    },
    {
      rank: 3,
      prevRank: 3,
      name: 'Elite_Warrior',
      avatar: '🎯',
      earnings: '$85,670',
      wins: 38,
      losses: 18,
      winRate: 68,
      tournaments: 56,
      level: 'Platinum',
      badge: 'Pro'
    },
    {
      rank: 4,
      prevRank: 5,
      name: 'Champion_99',
      avatar: '🔥',
      earnings: '$72,100',
      wins: 35,
      losses: 20,
      winRate: 64,
      tournaments: 55,
      level: 'Platinum',
      badge: 'Pro'
    },
    {
      rank: 5,
      prevRank: 4,
      name: 'Gaming_Legend',
      avatar: '💎',
      earnings: '$65,890',
      wins: 31,
      losses: 22,
      winRate: 58,
      tournaments: 53,
      level: 'Gold',
      badge: 'Rising'
    },
    {
      rank: 6,
      prevRank: 7,
      name: 'Apex_Predator',
      avatar: '🦅',
      earnings: '$58,340',
      wins: 29,
      losses: 24,
      winRate: 55,
      tournaments: 53,
      level: 'Gold',
      badge: 'Rising'
    },
    {
      rank: 7,
      prevRank: 6,
      name: 'Cyber_Ninja',
      avatar: '🥷',
      earnings: '$52,780',
      wins: 27,
      losses: 26,
      winRate: 51,
      tournaments: 53,
      level: 'Gold',
      badge: 'Contender'
    },
    {
      rank: 8,
      prevRank: 9,
      name: 'Thunder_Strike',
      avatar: '⚔️',
      earnings: '$48,920',
      wins: 25,
      losses: 28,
      winRate: 47,
      tournaments: 53,
      level: 'Silver',
      badge: 'Contender'
    },
    {
      rank: 9,
      prevRank: 8,
      name: 'Phoenix_Rising',
      avatar: '🔱',
      earnings: '$44,560',
      wins: 23,
      losses: 30,
      winRate: 43,
      tournaments: 53,
      level: 'Silver',
      badge: 'Amateur'
    },
    {
      rank: 10,
      prevRank: 10,
      name: 'Dark_Knight',
      avatar: '🛡️',
      earnings: '$41,230',
      wins: 21,
      losses: 32,
      winRate: 40,
      tournaments: 53,
      level: 'Silver',
      badge: 'Amateur'
    }
  ];

  const getRankChange = (rank, prevRank) => {
    if (rank < prevRank) return 'up';
    if (rank > prevRank) return 'down';
    return 'same';
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Diamond':
        return 'level-diamond';
      case 'Platinum':
        return 'level-platinum';
      case 'Gold':
        return 'level-gold';
      case 'Silver':
        return 'level-silver';
      default:
        return '';
    }
  };

  return (
    <div className="leaderboard-page">
      <Navbar />

      <section className="leaderboard-hero">
        <div className="hero-bg-leaderboard"></div>
        <div className="leaderboard-hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="hero-badge">
              <Crown size={20} />
              <span>Hall of Champions</span>
            </div>
            <h1 className="leaderboard-hero-title">
              Global <span className="text-gradient">Leaderboard</span>
            </h1>
            <p className="leaderboard-hero-description">
              Track the world's best PS5 tournament players
            </p>
          </motion.div>
        </div>
      </section>

      <section className="leaderboard-main">
        <div className="leaderboard-container">
          <div className="period-selector">
            {periods.map((period) => (
              <button
                key={period.id}
                className={`period-btn ${selectedPeriod === period.id ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(period.id)}
              >
                {period.label}
              </button>
            ))}
          </div>

          <div className="top-three">
            {leaderboardData.slice(0, 3).map((player, index) => (
              <motion.div
                key={player.rank}
                className={`podium-card rank-${player.rank}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <div className="podium-rank">
                  <Crown className={`crown-large rank-${player.rank}`} />
                  <span className="rank-number">#{player.rank}</span>
                </div>

                <div className="podium-avatar">
                  <div className="avatar-glow"></div>
                  <span>{player.avatar}</span>
                </div>

                <h3 className="podium-name">{player.name}</h3>
                <div className="podium-badge">{player.badge}</div>

                <div className="podium-stats">
                  <div className="podium-stat">
                    <Trophy size={20} />
                    <div>
                      <div className="stat-value">{player.wins}</div>
                      <div className="stat-label">Wins</div>
                    </div>
                  </div>
                  <div className="podium-stat">
                    <Target size={20} />
                    <div>
                      <div className="stat-value">{player.winRate}%</div>
                      <div className="stat-label">Win Rate</div>
                    </div>
                  </div>
                </div>

                <div className="podium-earnings">{player.earnings}</div>
              </motion.div>
            ))}
          </div>

          <div className="leaderboard-table">
            <div className="table-header">
              <div className="col-rank">Rank</div>
              <div className="col-player">Player</div>
              <div className="col-stats">Stats</div>
              <div className="col-earnings">Earnings</div>
            </div>

            <div className="table-body">
              {leaderboardData.slice(3).map((player, index) => (
                <motion.div
                  key={player.rank}
                  className="table-row"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ x: 10 }}
                >
                  <div className="col-rank">
                    <div className="rank-display">
                      <span className="rank-num">#{player.rank}</span>
                      <div className={`rank-trend trend-${getRankChange(player.rank, player.prevRank)}`}>
                        {getRankChange(player.rank, player.prevRank) === 'up' && <TrendingUp size={16} />}
                        {getRankChange(player.rank, player.prevRank) === 'down' && <TrendingDown size={16} />}
                        {getRankChange(player.rank, player.prevRank) === 'same' && <span>-</span>}
                      </div>
                    </div>
                  </div>

                  <div className="col-player">
                    <div className="player-info-full">
                      <div className="player-avatar-small">{player.avatar}</div>
                      <div className="player-details">
                        <div className="player-name-row">
                          <span className="player-name">{player.name}</span>
                          <span className={`player-level ${getLevelColor(player.level)}`}>
                            <Medal size={12} />
                            {player.level}
                          </span>
                        </div>
                        <div className="player-badge-small">{player.badge}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-stats">
                    <div className="stats-grid">
                      <div className="stat-mini">
                        <span className="stat-mini-label">W/L</span>
                        <span className="stat-mini-value">{player.wins}/{player.losses}</span>
                      </div>
                      <div className="stat-mini">
                        <span className="stat-mini-label">Win Rate</span>
                        <span className="stat-mini-value rate">{player.winRate}%</span>
                      </div>
                      <div className="stat-mini">
                        <span className="stat-mini-label">Tournaments</span>
                        <span className="stat-mini-value">{player.tournaments}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-earnings">
                    <div className="earnings-display">{player.earnings}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LeaderboardPage;
