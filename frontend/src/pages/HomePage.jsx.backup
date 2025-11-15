import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Zap,
  Users,
  TrendingUp,
  Crown,
  Gamepad2,
  Calendar,
  DollarSign,
  ChevronRight,
  Play,
  Star
} from 'lucide-react';
import Navbar from '../components/Navbar';
import '../styles/HomePage.css';

const HomePage = () => {
  const [activeGameIndex, setActiveGameIndex] = useState(0);

  const featuredGames = [
    { name: 'FIFA 24', players: '2.5K+', prize: '$50,000' },
    { name: 'Call of Duty', players: '3.2K+', prize: '$75,000' },
    { name: 'NBA 2K24', players: '1.8K+', prize: '$35,000' },
    { name: 'Mortal Kombat', players: '1.2K+', prize: '$25,000' }
  ];

  const upcomingTournaments = [
    {
      id: 1,
      game: 'FIFA 24 Champions',
      date: 'Oct 25, 2025',
      time: '18:00 UTC',
      prize: '$50,000',
      players: 2547,
      maxPlayers: 3000,
      entry: '$25',
      status: 'Open'
    },
    {
      id: 2,
      game: 'Warzone Battle Royale',
      date: 'Oct 28, 2025',
      time: '20:00 UTC',
      prize: '$75,000',
      players: 3104,
      maxPlayers: 5000,
      entry: '$35',
      status: 'Open'
    },
    {
      id: 3,
      game: 'NBA 2K Pro League',
      date: 'Nov 2, 2025',
      time: '19:00 UTC',
      prize: '$35,000',
      players: 1876,
      maxPlayers: 2500,
      entry: '$20',
      status: 'Open'
    }
  ];

  const topPlayers = [
    { rank: 1, name: 'Shadow_King', earnings: '$127,450', wins: 48, avatar: '👑' },
    { rank: 2, name: 'ProGamer_X', earnings: '$98,230', wins: 42, avatar: '⚡' },
    { rank: 3, name: 'Elite_Warrior', earnings: '$85,670', wins: 38, avatar: '🎯' },
    { rank: 4, name: 'Champion_99', earnings: '$72,100', wins: 35, avatar: '🔥' },
    { rank: 5, name: 'Gaming_Legend', earnings: '$65,890', wins: 31, avatar: '💎' }
  ];

  const stats = [
    { icon: Users, value: '25K+', label: 'Active Players' },
    { icon: Trophy, value: '1,200+', label: 'Tournaments' },
    { icon: DollarSign, value: '$2.5M', label: 'Prize Pool' },
    { icon: Crown, value: '500+', label: 'Champions' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGameIndex((prev) => (prev + 1) % featuredGames.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredGames.length]);

  return (
    <div className="home-page">
      <Navbar />

      <section className="hero-section">
        <div className="hero-background">
          <div className="grid-overlay"></div>
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>

        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Zap size={16} />
            <span>World's Premier PS5 Tournament Platform</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Compete. Conquer.
            <br />
            <span className="text-gradient glow">Claim Glory.</span>
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Join thousands of elite gamers in high-stakes PS5 tournaments.
            <br />
            Compete globally, win massive prizes, and build your legacy.
          </motion.p>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link to="/tournaments" className="btn-primary">
              <Trophy size={20} />
              <span>Browse Tournaments</span>
              <ChevronRight size={20} />
            </Link>
            <button className="btn-secondary">
              <Play size={20} />
              <span>Watch Live</span>
            </button>
          </motion.div>

          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <stat.icon size={24} />
                <div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <div className="floating-card">
            <Gamepad2 size={64} className="gamepad-icon" />
            <div className="card-glow"></div>
          </div>
        </motion.div>
      </section>

      <section className="featured-games">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Featured Games</h2>
            <p className="section-subtitle">Top competitive titles this season</p>
          </div>

          <div className="games-grid">
            {featuredGames.map((game, index) => (
              <motion.div
                key={index}
                className={`game-card ${index === activeGameIndex ? 'active' : ''}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="game-card-header">
                  <div className="game-icon">
                    <Gamepad2 size={32} />
                  </div>
                  <div className="game-status">
                    <span className="status-dot"></span>
                    LIVE
                  </div>
                </div>
                <h3 className="game-name">{game.name}</h3>
                <div className="game-stats">
                  <div className="game-stat">
                    <Users size={16} />
                    <span>{game.players} Players</span>
                  </div>
                  <div className="game-stat prize">
                    <Trophy size={16} />
                    <span>{game.prize}</span>
                  </div>
                </div>
                <button className="game-action-btn">
                  Join Tournament
                  <ChevronRight size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="tournaments-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Upcoming Tournaments</h2>
            <p className="section-subtitle">Register now and secure your spot</p>
            <Link to="/tournaments" className="view-all-link">
              View All <ChevronRight size={18} />
            </Link>
          </div>

          <div className="tournaments-grid">
            {upcomingTournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                className="tournament-card card-hover"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="tournament-header">
                  <div className="tournament-badge">
                    <Star size={14} />
                    <span>{tournament.status}</span>
                  </div>
                  <div className="tournament-prize">{tournament.prize}</div>
                </div>

                <h3 className="tournament-name">{tournament.game}</h3>

                <div className="tournament-info">
                  <div className="info-item">
                    <Calendar size={16} />
                    <span>{tournament.date}</span>
                  </div>
                  <div className="info-item">
                    <Users size={16} />
                    <span>{tournament.players}/{tournament.maxPlayers}</span>
                  </div>
                </div>

                <div className="tournament-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(tournament.players / tournament.maxPlayers) * 100}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {Math.round((tournament.players / tournament.maxPlayers) * 100)}% Full
                  </span>
                </div>

                <div className="tournament-footer">
                  <div className="entry-fee">
                    Entry: <span>{tournament.entry}</span>
                  </div>
                  <button className="join-btn">
                    Join Now
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="leaderboard-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Top Champions</h2>
            <p className="section-subtitle">This season's elite performers</p>
            <Link to="/leaderboard" className="view-all-link">
              Full Leaderboard <ChevronRight size={18} />
            </Link>
          </div>

          <div className="leaderboard-container">
            {topPlayers.map((player, index) => (
              <motion.div
                key={player.rank}
                className={`leaderboard-item ${player.rank <= 3 ? `rank-${player.rank}` : ''}`}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ x: 10 }}
              >
                <div className="player-rank">
                  {player.rank <= 3 ? (
                    <Crown size={24} className={`crown-icon rank-${player.rank}`} />
                  ) : (
                    <span>#{player.rank}</span>
                  )}
                </div>
                <div className="player-avatar">{player.avatar}</div>
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="player-wins">{player.wins} Wins</div>
                </div>
                <div className="player-earnings">{player.earnings}</div>
                <TrendingUp size={20} className="trend-icon" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-container">
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="cta-title">Ready to Become a Champion?</h2>
            <p className="cta-description">
              Join the ultimate PS5 gaming arena. Register now and start your journey to glory.
            </p>
            <div className="cta-buttons">
              <button className="btn-primary large">
                <Trophy size={24} />
                <span>Create Account</span>
              </button>
              <button className="btn-secondary large">
                <Gamepad2 size={24} />
                <span>Learn More</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <div className="footer-logo">
              <Gamepad2 size={32} />
              <span>PS5 ARENA</span>
            </div>
            <p>The world's premier PlayStation 5 tournament platform.</p>
          </div>
          <div className="footer-section">
            <h4>Platform</h4>
            <a href="#">Tournaments</a>
            <a href="#">Leaderboard</a>
            <a href="#">Live Streams</a>
            <a href="#">Prize Pool</a>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Rules</a>
            <a href="#">FAQ</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 PS5 Arena. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
