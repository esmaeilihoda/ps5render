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
import { useLanguage } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import '../styles/HomePage.css';

const HomePage = () => {
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const { t } = useLanguage();

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
      status: t('home.open')
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
      status: t('home.open')
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
      status: t('home.open')
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
    { icon: Users, value: '25K+', label: t('home.activePlayers') },
    { icon: Trophy, value: '1,200+', label: t('home.tournaments') },
    { icon: DollarSign, value: '$2.5M', label: t('home.prizePool') },
    { icon: Crown, value: '500+', label: t('home.champions') }
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
            <span>{t('home.badge')}</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {t('home.title1')}
            <br />
            <span className="text-gradient glow">{t('home.title2')}</span>
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {t('home.description1')}
            <br />
            {t('home.description2')}
          </motion.p>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link to="/tournaments" className="btn-primary">
              <Trophy size={20} />
              <span>{t('home.browseTournaments')}</span>
              <ChevronRight size={20} />
            </Link>
            <button className="btn-secondary">
              <Play size={20} />
              <span>{t('home.watchLive')}</span>
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
            <h2 className="section-title">{t('home.featuredGames')}</h2>
            <p className="section-subtitle">{t('home.featuredGamesSubtitle')}</p>
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
                    {t('home.live')}
                  </div>
                </div>
                <h3 className="game-name">{game.name}</h3>
                <div className="game-stats">
                  <div className="game-stat">
                    <Users size={16} />
                    <span>{game.players} {t('home.players')}</span>
                  </div>
                  <div className="game-stat prize">
                    <Trophy size={16} />
                    <span>{game.prize}</span>
                  </div>
                </div>
                <button className="game-action-btn">
                  {t('home.joinTournament')}
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
            <h2 className="section-title">{t('home.upcomingTournaments')}</h2>
            <p className="section-subtitle">{t('home.upcomingSubtitle')}</p>
            <Link to="/tournaments" className="view-all-link">
              {t('home.viewAll')} <ChevronRight size={18} />
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
                    {Math.round((tournament.players / tournament.maxPlayers) * 100)}% {t('home.full')}
                  </span>
                </div>

                <div className="tournament-footer">
                  <div className="entry-fee">
                    {t('home.entry')}: <span>{tournament.entry}</span>
                  </div>
                  <button className="join-btn">
                    {t('home.joinNow')}
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
            <h2 className="section-title">{t('home.topChampions')}</h2>
            <p className="section-subtitle">{t('home.topChampionsSubtitle')}</p>
            <Link to="/leaderboard" className="view-all-link">
              {t('home.fullLeaderboard')} <ChevronRight size={18} />
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
                  <div className="player-wins">{player.wins} {t('home.wins')}</div>
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
            <h2 className="cta-title">{t('home.ctaTitle')}</h2>
            <p className="cta-description">{t('home.ctaDescription')}</p>
            <div className="cta-buttons">
              <button className="btn-primary large">
                <Trophy size={24} />
                <span>{t('home.createAccount')}</span>
              </button>
              <button className="btn-secondary large">
                <Gamepad2 size={24} />
                <span>{t('home.learnMore')}</span>
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
            <p>{t('home.footerDescription')}</p>
          </div>
          <div className="footer-section">
            <h4>{t('home.platform')}</h4>
            <a href="#">{t('home.tournaments')}</a>
            <a href="#">{t('home.fullLeaderboard')}</a>
            <a href="#">{t('home.liveStreams')}</a>
            <a href="#">{t('home.prizePool')}</a>
          </div>
          <div className="footer-section">
            <h4>{t('home.support')}</h4>
            <a href="#">{t('home.helpCenter')}</a>
            <a href="#">{t('home.rules')}</a>
            <a href="#">{t('home.faq')}</a>
            <a href="#">{t('home.contact')}</a>
          </div>
          <div className="footer-section">
            <h4>{t('home.legal')}</h4>
            <a href="#">{t('home.terms')}</a>
            <a href="#">{t('home.privacy')}</a>
            <a href="#">{t('home.cookies')}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{t('home.copyright')}</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
