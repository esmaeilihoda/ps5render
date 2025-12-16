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
  Star,
  Instagram
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import '../styles/HomePage.css';

const HomePage = () => {
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const { t } = useLanguage();

  const featuredGames = [
    { slug: 'fc-26', name: 'EA Sports FC 26', players: '12.5K+', prize: '$100,000' },
    { slug: 'cod-warzone', name: 'Call of Duty: Warzone', players: '45K+', prize: '$150,000' },
    { slug: 'battlefield-6', name: 'Battlefield 6', players: '8.2K+', prize: '$75,000' },
    { slug: 'fortnite', name: 'Fortnite', players: '50K+', prize: '$200,000' }
  ];
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.tournaments.list();
        // api.tournaments.list returns an array or object; handle both
        const items = Array.isArray(res) ? res : (res.items || res || []);
        const filtered = (items || [])
          .filter((t) => t && (t.status === 'PUBLISHED' || t.status === 'IN_PROGRESS' || t.status === 'OPEN'))
          .sort((a, b) => new Date(a.startAt || a.createdAt || 0) - new Date(b.startAt || b.createdAt || 0))
          .slice(0, 3)
          .map((t) => ({
            id: t.id,
            title: t.title || t.name || t.game,
            entryFee: t.entryFee ?? t.entry ?? 0,
            prizePool: t.prizePool ?? t.prize ?? 0,
            currentPlayers: t.currentPlayers ?? t.players ?? t.playerCount ?? 0,
            maxPlayers: t.maxPlayers ?? t.maxPlayers ?? 0,
            startAt: t.startAt || t.startDate || t.createdAt,
            status: t.status || t.state || t.phase
          }));
        if (!cancelled) setUpcomingTournaments(filtered);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load tournaments for HomePage', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
            <a 
              href="https://instagram.com/g4r_official" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-secondary"
            >
              <Instagram size={20} />
              <span>Join Community</span>
              <ChevronRight size={20} />
            </a>
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
                <Link to={`/games/${game.slug}`} className="game-action-btn">
                  {t('home.joinTournament')}
                  <ChevronRight size={18} />
                </Link>
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
                  <div className="tournament-prize">
                    {tournament.currency === 'USDT' ? '$' : 'T'}
                    {typeof tournament.prizePool === 'number' ? tournament.prizePool.toLocaleString() : tournament.prizePool}
                  </div>
                </div>

                <h3 className="tournament-name">{tournament.title}</h3>

                <div className="tournament-info">
                  <div className="info-item">
                    <Calendar size={16} />
                    <span>{tournament.startAt ? new Date(tournament.startAt).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="info-item">
                    <Users size={16} />
                    <span>{tournament.currentPlayers}/{tournament.maxPlayers}</span>
                  </div>
                </div>

                <div className="tournament-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(tournament.currentPlayers && tournament.maxPlayers) ? (tournament.currentPlayers / tournament.maxPlayers) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {tournament.maxPlayers ? `${Math.round((tournament.currentPlayers / tournament.maxPlayers) * 100)}% ${t('home.full')}` : '—'}
                  </span>
                </div>

                <div className="tournament-footer">
                  <div className="entry-fee">
                    {t('home.entry')}: <span>{tournament.entryFee && Number(tournament.entryFee) > 0 ? (`${tournament.currency === 'USDT' ? '$' : 'T'}${Number(tournament.entryFee).toLocaleString()}`) : 'Free'}</span>
                  </div>
                  <Link to={'/tournaments/' + tournament.id} className="join-btn">
                    {t('home.joinNow')}
                    <ChevronRight size={16} />
                  </Link>
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
              <Link to="/signup" className="btn-primary large">
                <Trophy size={24} />
                <span>{t('home.createAccount')}</span>
                <ChevronRight size={24} />
              </Link>
              <Link to="/tournaments" className="btn-secondary large">
                <Gamepad2 size={24} />
                <span>Browse Games</span>
                <ChevronRight size={24} />
              </Link>
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
            <a href="#" title="Coming Soon">{t('home.tournaments')}</a>
            <a href="#" title="Coming Soon">{t('home.fullLeaderboard')}</a>
            <a href="#" title="Coming Soon">{t('home.liveStreams')}</a>
            <a href="#" title="Coming Soon">{t('home.prizePool')}</a>
          </div>
          <div className="footer-section">
            <h4>{t('home.support')}</h4>
            <a href="#" title="Coming Soon">{t('home.helpCenter')}</a>
            <a href="#" title="Coming Soon">{t('home.rules')}</a>
            <a href="#" title="Coming Soon">{t('home.faq')}</a>
            <a href="#" title="Coming Soon">{t('home.contact')}</a>
          </div>
          <div className="footer-section">
            <h4>{t('home.legal')}</h4>
            <a href="#" title="Coming Soon">{t('home.terms')}</a>
            <a href="#" title="Coming Soon">{t('home.privacy')}</a>
            <a href="#" title="Coming Soon">{t('home.cookies')}</a>
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
