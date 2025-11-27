import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { apiGet } from '../services/api';
import { GAMES_CONFIG } from '../data/games';
import {
  Trophy,
  Calendar,
  Users,
  ChevronRight,
  Gamepad2,
  Target,
  Swords,
  Shield,
  Zap,
  TrendingUp,
  Flag,
  Crosshair,
  AlertTriangle,
  User,
  Award
} from 'lucide-react';
import '../styles/HomePage.css';
import '../styles/SignUpPage.css';

// Icon mapping for mode cards
const ICON_MAP = {
  Gamepad2,
  Trophy,
  TrendingUp,
  Users,
  Target,
  Shield,
  Zap,
  Flag,
  Crosshair,
  AlertTriangle,
  User,
  Award,
  Swords
};

export default function GameHubPage() {
  const { gameId } = useParams();
  const config = GAMES_CONFIG[gameId];
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiGet('/api/tournaments');
        const items = Array.isArray(res) ? res : (res.items || res || []);
        // Filter tournaments by game title (case-insensitive)
        const filtered = items.filter(
          t =>
            t &&
            config &&
            (
              (t.game && t.game.toLowerCase().includes(config.title.toLowerCase())) ||
              (t.title && t.title.toLowerCase().includes(config.title.toLowerCase()))
            )
        );
        if (!cancelled) setTournaments(filtered);
      } catch (err) {
        if (!cancelled) setTournaments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [gameId, config]);

  if (!config) {
    return (
      <div className="signup-wrapper">
        <Navbar />
        <div style={{ padding: 48, textAlign: 'center' }}>
          <h1>Game not found</h1>
          <p>This game hub does not exist.</p>
          <Link to="/" className="btn-primary" style={{ marginTop: 24 }}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ps-darker)' }}>
      <Navbar />

      {/* Hero Section with Game Branding */}
      <section
        style={{
          position: 'relative',
          padding: '140px 32px 80px',
          overflow: 'hidden',
          background: config.gradient
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
            zIndex: 0
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: 'center' }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 50,
                marginBottom: 24,
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}
            >
              <Gamepad2 size={18} />
              Game Hub
            </div>
            <h1
              className="signup-title text-gradient"
              style={{
                fontSize: 64,
                fontWeight: 900,
                marginBottom: 24,
                lineHeight: 1.1,
                textShadow: '0 4px 20px rgba(0,0,0,0.5)'
              }}
            >
              {config.title}
            </h1>
            <p
              style={{
                fontSize: 20,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.9)',
                maxWidth: 800,
                margin: '0 auto 32px',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)'
              }}
            >
              {config.description}
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#tournaments" className="btn-primary" style={{ fontSize: 16, padding: '16px 32px' }}>
                <Trophy size={20} />
                View Tournaments
              </a>
              <a href="#formats" className="btn-secondary" style={{ fontSize: 16, padding: '16px 32px' }}>
                <Swords size={20} />
                See Formats
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tournament Formats Section */}
      <section id="formats" style={{ padding: '80px 32px', background: 'var(--ps-darker)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <h2 style={{ fontSize: 42, fontWeight: 900, marginBottom: 16 }}>
              Tournament <span className="text-gradient">Formats</span>
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 700, margin: '0 auto' }}>
              Multiple competitive modes to test your skills
            </p>
          </motion.div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24
            }}
          >
            {config.modes.map((mode, idx) => {
              const IconComponent = ICON_MAP[mode.icon] || Gamepad2;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -8, boxShadow: `0 12px 40px ${config.accentColor}40` }}
                  style={{
                    padding: 32,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${config.accentColor}30, ${config.accentColor}10)`,
                      border: `2px solid ${config.accentColor}`,
                      borderRadius: 16,
                      marginBottom: 20
                    }}
                  >
                    <IconComponent size={32} style={{ color: config.accentColor }} />
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{mode.name}</h3>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    {mode.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section style={{ padding: '60px 32px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 style={{ fontSize: 32, fontWeight: 800, marginBottom: 20, textAlign: 'center' }}>
              <Shield size={28} style={{ verticalAlign: 'middle', marginRight: 12, color: config.accentColor }} />
              Tournament Rules
            </h3>
            <div
              style={{
                padding: 28,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                fontSize: 16,
                lineHeight: 1.8,
                color: 'rgba(255,255,255,0.85)'
              }}
            >
              {config.rules}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tournaments List */}
      <section id="tournaments" style={{ padding: '80px 32px', background: 'var(--ps-darker)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 42, fontWeight: 900, marginBottom: 48, textAlign: 'center' }}>
            Active <span className="text-gradient">Tournaments</span>
          </h2>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              Loading tournaments…
            </div>
          ) : tournaments.length === 0 ? (
            <div
              style={{
                padding: 60,
                textAlign: 'center',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20
              }}
            >
              <Trophy size={56} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 16 }} />
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
                No tournaments available yet
              </h3>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>
                Check back soon for upcoming {config.title} tournaments!
              </p>
            </div>
          ) : (
            <div className="tournaments-grid">
              {tournaments.map((tournament, index) => (
                <motion.div
                  key={tournament.id}
                  className="tournament-card card-hover"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  whileHover={{ y: -8 }}
                >
                  <div className="tournament-header">
                    <div className="tournament-badge">
                      <Trophy size={14} />
                      <span>{tournament.status}</span>
                    </div>
                    <div className="tournament-prize">
                      {typeof tournament.prizePool === 'number'
                        ? tournament.prizePool.toLocaleString()
                        : tournament.prizePool}{' '}
                      Toman
                    </div>
                  </div>
                  <h3 className="tournament-name">{tournament.title}</h3>
                  <div className="tournament-info">
                    <div className="info-item">
                      <Calendar size={16} />
                      <span>
                        {tournament.startAt
                          ? new Date(tournament.startAt).toLocaleDateString()
                          : '—'}
                      </span>
                    </div>
                    <div className="info-item">
                      <Users size={16} />
                      <span>
                        {tournament.currentPlayers || 0}/{tournament.maxPlayers}
                      </span>
                    </div>
                  </div>
                  <div className="tournament-footer">
                    <div className="entry-fee">
                      Entry:{' '}
                      <span>
                        {tournament.entryFee > 0 ? `${tournament.entryFee} Toman` : 'Free'}
                      </span>
                    </div>
                    <Link to={`/tournaments/${tournament.id}`} className="join-btn">
                      Join Tournament
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
