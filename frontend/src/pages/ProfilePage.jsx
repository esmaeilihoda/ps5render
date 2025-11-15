import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Trophy,
  TrendingUp,
  Calendar,
  DollarSign,
  Award,
  Target,
  Zap,
  Crown,
  Settings,
  Wallet,
  History
} from 'lucide-react';
import Navbar from '../components/Navbar';
import '../styles/ProfilePage.css';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();

  // data fetching state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profilePayload, setProfilePayload] = useState(null);
  const [npsso, setNpsso] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'transactions', label: 'Transactions', icon: DollarSign }
  ];

  // Keep design static placeholders for fields we haven't wired yet
  const userProfileStatic = {
    avatar: '🎮',
    level: 'Diamond',
    rank: 42,
    totalEarnings: '$78,450',
    winRate: 72,
    wins: 68,
    losses: 27
  };

  // Effect to load profile data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await api.users.getUserProfile(user.id);
        if (!cancelled) setProfilePayload(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  async function handleLinkPsn(e) {
    e.preventDefault();
    setLinking(true);
    setLinkError(null);
    try {
      await api.users.linkPsnAccount(npsso);
      const data = await api.users.getUserProfile(user.id);
      setProfilePayload(data);
      setNpsso('');
    } catch (err) {
      setLinkError(err.message || 'Failed to link PSN account');
    } finally {
      setLinking(false);
    }
  }

  const walletBalances = [
    { currency: 'USD', amount: '$1,234.50', icon: DollarSign },
    { currency: 'Rial', amount: '۵۲,۱۰۰,۰۰۰', icon: DollarSign },
    { currency: 'USDT', amount: '0.5432', icon: DollarSign }
  ];

  // recentTournaments will be sourced from profilePayload.tournaments when available

  const recentTransactions = [
    {
      id: 1,
      type: 'Prize',
      description: 'FIFA 24 Champions - 1st Place',
      amount: '+$5,000',
      date: 'Oct 15, 2025',
      status: 'completed'
    },
    {
      id: 2,
      type: 'Entry',
      description: 'Warzone Tournament Entry',
      amount: '-$35',
      date: 'Oct 12, 2025',
      status: 'completed'
    },
    {
      id: 3,
      type: 'Deposit',
      description: 'Wallet Deposit',
      amount: '+$500',
      date: 'Oct 10, 2025',
      status: 'completed'
    },
    {
      id: 4,
      type: 'Withdrawal',
      description: 'Bank Transfer',
      amount: '-$2,000',
      date: 'Oct 8, 2025',
      status: 'pending'
    }
  ];

  const achievements = [
    { icon: Crown, title: 'Champion', description: 'Won 50+ tournaments' },
    { icon: Trophy, title: 'Elite Player', description: 'Reached Diamond tier' },
    { icon: Zap, title: 'Streak Master', description: '10 consecutive wins' },
    { icon: Award, title: 'Top Earner', description: 'Earned $50K+' }
  ];

  // Loading / error states
  if (loading) return (
    <div className="profile-page">
      <Navbar />
      <div style={{ padding: 48, textAlign: 'center' }}>Loading...</div>
    </div>
  );

  if (error) return (
    <div className="profile-page">
      <Navbar />
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--ps-red)' }}>Error: {error}</div>
    </div>
  );

  const publicUser = profilePayload?.user || null;
  const tournaments = Array.isArray(profilePayload?.tournaments) ? profilePayload.tournaments : [];
  const psn = profilePayload?.psn || null;

  // If not verified, show linking card centered
  if (!publicUser?.isPsnVerified) {
    return (
      <div className="profile-page">
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="psn-link-card" style={{ background: 'rgba(0,10,31,0.85)', padding: 24, borderRadius: 12, width: 640 }}>
            <h2 style={{ marginBottom: 12 }}>Link your PSN account</h2>
            <p>Paste your <strong>npsso</strong> code below to verify the PlayStation Network account you used during sign-up.</p>
            <form onSubmit={handleLinkPsn} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <input
                type="text"
                placeholder="Paste your npsso code here"
                value={npsso}
                onChange={(e) => setNpsso(e.target.value)}
                style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-primary" type="submit" disabled={linking || !npsso.trim()}>
                  {linking ? 'Linking...' : 'Link PSN Account'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setNpsso('')}>Clear</button>
              </div>
              {linkError && <div style={{ color: 'var(--ps-red)' }}>{linkError}</div>}
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Verified user view
  const displayName = publicUser?.psnId || 'Player';
  const tournamentsCount = tournaments.length;

  return (
    <div className="profile-page">
      <Navbar />

      {/* Verified profile design */}
      <section className="profile-hero">
        <div className="profile-hero-bg"></div>
        <div className="profile-hero-content">
          <motion.div
            className="profile-card-main"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="profile-header">
              <div className="profile-avatar-large">
                <div className="avatar-glow-profile"></div>
                <span>{userProfileStatic.avatar}</span>
              </div>
              <div className="profile-info-header">
                <h1 className="profile-name">{profilePayload?.user?.psnId || 'Player'}</h1>
                <div className="profile-meta">
                  <div className="profile-level">
                    <Crown size={16} />
                    <span>{userProfileStatic.level}</span>
                  </div>
                  <div className="profile-rank">
                    Global Rank #{userProfileStatic.rank}
                  </div>
                </div>
              </div>
              <button className="settings-btn">
                <Settings size={20} />
              </button>
            </div>

            <div className="profile-stats-grid">
              <div className="profile-stat-card">
                <DollarSign size={24} className="stat-icon" />
                <div className="stat-content">
                  <div className="stat-value-profile">{userProfileStatic.totalEarnings}</div>
                  <div className="stat-label-profile">Total Earnings</div>
                </div>
              </div>

              <div className="profile-stat-card">
                <Target size={24} className="stat-icon" />
                <div className="stat-content">
                  <div className="stat-value-profile">{userProfileStatic.winRate}%</div>
                  <div className="stat-label-profile">Win Rate</div>
                </div>
              </div>

              <div className="profile-stat-card">
                <Trophy size={24} className="stat-icon" />
                <div className="stat-content">
                  <div className="stat-value-profile">{tournamentsCount}</div>
                  <div className="stat-label-profile">Tournaments</div>
                </div>
              </div>

              <div className="profile-stat-card">
                <TrendingUp size={24} className="stat-icon" />
                <div className="stat-content">
                  <div className="stat-value-profile">{userProfileStatic.wins}W/{userProfileStatic.losses}L</div>
                  <div className="stat-label-profile">Record</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="profile-content">
        <div className="profile-container">
          <div className="profile-sidebar">
            <div className="wallet-section">
              <div className="section-title-small">
                <Wallet size={20} />
                <span>Wallet Balances</span>
              </div>

              <div className="wallet-cards">
                {walletBalances.map((balance, index) => (
                  <motion.div
                    key={balance.currency}
                    className="wallet-card"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="wallet-currency">{balance.currency}</div>
                    <div className="wallet-amount">{balance.amount}</div>
                  </motion.div>
                ))}
              </div>

              <button className="wallet-action-btn">
                <DollarSign size={18} />
                Manage Wallet
              </button>
            </div>

            <div className="achievements-section">
              <div className="section-title-small">
                <Award size={20} />
                <span>Achievements</span>
              </div>

              <div className="achievements-grid">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    className="achievement-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <achievement.icon size={32} className="achievement-icon" />
                    <div className="achievement-info">
                      <div className="achievement-title">{achievement.title}</div>
                      <div className="achievement-description">{achievement.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="profile-main">
            <div className="tabs-navigation">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="tab-content">
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="content-section">
                    <h3 className="content-title">Performance Overview</h3>
                    <div className="performance-chart">
                      <div className="chart-placeholder">
                        <TrendingUp size={48} />
                        <p>Performance chart coming soon</p>
                      </div>
                    </div>
                  </div>

                  <div className="content-section">
                    <h3 className="content-title">Recent Activity</h3>
                    <div className="activity-list">
                      {tournaments.slice(0, 3).map((tournament, idx) => {
                        const id = tournament?.id ?? tournament?._id ?? idx;
                        const title = tournament?.name || tournament?.title || tournament?.game || 'Tournament';
                        const date = tournament?.date || tournament?.startDate || tournament?.createdAt || '—';
                        const placement = tournament?.placement || tournament?.position || (tournament?.result?.placement) || '—';
                        const prize = tournament?.prize || tournament?.reward || tournament?.prizePool || '—';
                        const status = (tournament?.status || tournament?.outcome || '').toString().toLowerCase() || (String(placement).toLowerCase().includes('1') ? 'won' : 'lost');

                        return (
                          <div key={id} className="activity-item">
                            <Trophy size={20} />
                            <div className="activity-info">
                              <div className="activity-title">{title}</div>
                              <div className="activity-meta">
                                {date} • {placement} Place
                              </div>
                            </div>
                            <div className={`activity-prize ${status}`}>
                              {prize}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'tournaments' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="content-section">
                    <h3 className="content-title">Tournament History</h3>
                    <div className="tournaments-list">
                      {tournaments.map((tournament, idx) => {
                        const id = tournament?.id ?? tournament?._id ?? idx;
                        const title = tournament?.name || tournament?.title || tournament?.game || 'Tournament';
                        const date = tournament?.date || tournament?.startDate || tournament?.createdAt || '—';
                        const placement = tournament?.placement || tournament?.position || (tournament?.result?.placement) || '—';
                        const prize = tournament?.prize || tournament?.reward || tournament?.prizePool || '—';
                        const status = (tournament?.status || tournament?.outcome || '').toString().toLowerCase() || (String(placement).toLowerCase().includes('1') ? 'won' : 'lost');

                        return (
                          <div key={id} className="tournament-history-card">
                            <div className="tournament-history-header">
                              <div className="tournament-history-game">{title}</div>
                              <div className={`tournament-history-status ${status}`}>
                                {status === 'won' ? 'Won' : 'Lost'}
                              </div>
                            </div>
                            <div className="tournament-history-details">
                              <div className="history-detail">
                                <Calendar size={16} />
                                <span>{date}</span>
                              </div>
                              <div className="history-detail">
                                <Award size={16} />
                                <span>{placement} Place</span>
                              </div>
                              <div className="history-detail prize">
                                <Trophy size={16} />
                                <span>{prize}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'transactions' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="content-section">
                    <h3 className="content-title">Transaction History</h3>
                    <div className="transactions-list">
                      {recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="transaction-card">
                          <div className="transaction-icon">
                            <History size={20} />
                          </div>
                          <div className="transaction-info">
                            <div className="transaction-type">{transaction.type}</div>
                            <div className="transaction-description">{transaction.description}</div>
                            <div className="transaction-date">{transaction.date}</div>
                          </div>
                          <div className="transaction-right">
                            <div className={`transaction-amount ${transaction.amount.startsWith('+') ? 'positive' : 'negative'}`}>
                              {transaction.amount}
                            </div>
                            <div className={`transaction-status status-${transaction.status}`}>
                              {transaction.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
