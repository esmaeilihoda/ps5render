import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { apiGet, apiPost } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Coins, Calendar, Users, DollarSign, Zap, Target } from 'lucide-react';
import '../styles/SignUpPage.css';

export default function TournamentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load tournament + matches
  useEffect(() => {
    if (!id) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        // Fetch tournament details
        const tRes = await apiGet('/api/tournaments/' + id);
        if (!cancel) {
          if (tRes.success && tRes.tournament) {
            setTournament(tRes.tournament);
          } else {
            setTournament(null);
          }
        }

        // Fetch matches for bracket display
        try {
          const mRes = await apiGet('/api/tournaments/' + id + '/matches');
          const list = mRes.matches || mRes.items || (Array.isArray(mRes) ? mRes : []);
          if (!cancel && Array.isArray(list)) {
            setMatches(list);
          }
        } catch (e) {
          console.warn('Failed to load matches', e);
        }
      } catch (err) {
        if (!cancel) {
          setTournament(null);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id]);

  // Group matches by round and sort by matchOrder
  const rounds = useMemo(() => {
    const grouped = {};
    for (const m of matches) {
      const r = Number(m.round || 1);
      if (!grouped[r]) grouped[r] = [];
      grouped[r].push(m);
    }
    return Object.keys(grouped)
      .map(r => {
        const arr = grouped[r];
        arr.sort((a, b) => (a.matchOrder || 0) - (b.matchOrder || 0));
        return { round: Number(r), matches: arr };
      })
      .sort((a, b) => a.round - b.round);
  }, [matches]);

  // Champion logic (if tournament is completed)
  const champion = useMemo(() => {
    if (!tournament || tournament.status !== 'COMPLETED' || matches.length === 0) return null;

    // Find the final round
    const maxRound = Math.max(...matches.map(m => Number(m.round || 0)));
    const finals = matches.filter(m => Number(m.round || 0) === maxRound);
    const finalMatch = finals.find(m => m.status === 'COMPLETED' && m.winnerId) || finals[0];

    if (!finalMatch || !finalMatch.winnerId) return null;

    const winnerPid = finalMatch.winnerId;
    const p1 = finalMatch.player1;
    const p2 = finalMatch.player2;

    // Determine winner name from participant data
    if (p1 && p1.id === winnerPid) {
      const u = p1.user;
      return { name: (u && (u.name || u.psnId || u.email)) || p1.displayName || 'Player' };
    }
    if (p2 && p2.id === winnerPid) {
      const u = p2.user;
      return { name: (u && (u.name || u.psnId || u.email)) || p2.displayName || 'Player' };
    }
    return null;
  }, [tournament, matches]);

  async function handleJoin() {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check wallet balance before joining
    const entryFee = Number(tournament?.entryFee || 0);
    const balance = Number(user?.walletBalance || 0);

    if (entryFee > 0 && balance < entryFee) {
      const proceed = window.confirm(
        `Insufficient funds. You need ${entryFee.toLocaleString()} Toman but have ${balance.toLocaleString()} Toman. Would you like to go to the wallet page to deposit funds?`
      );
      if (proceed) {
        navigate('/wallet');
      }
      return;
    }

    setJoining(true);
    try {
      const res = await apiPost('/api/tournaments/' + id + '/join');
      if (res.success) {
        alert('Successfully joined tournament!');
        // Reload tournament to show updated participant count
        const tRes = await apiGet('/api/tournaments/' + id);
        if (tRes.success) setTournament(tRes.tournament);
      } else {
        alert(res.message || 'Failed to join tournament');
      }
    } catch (err) {
      const msg = err.message || 'Join failed';
      if (/insufficient/i.test(msg)) {
        const proceed = window.confirm('Insufficient funds. Go to wallet page?');
        if (proceed) navigate('/wallet');
      } else {
        alert(msg);
      }
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="signup-wrapper">
        <Navbar />
        <div style={{ padding: 48, textAlign: 'center' }}>Loading tournament...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="signup-wrapper">
        <Navbar />
        <div style={{ padding: 48, textAlign: 'center' }}>Tournament not found.</div>
      </div>
    );
  }

  const canJoin = tournament.status === 'PUBLISHED' || tournament.status === 'OPEN';
  const startDate = tournament.startAt ? new Date(tournament.startAt).toLocaleString() : '—';
  const prizeDisplay = Number(tournament.prizePool || 0).toLocaleString();
  const entryDisplay = tournament.entryFee > 0 ? Number(tournament.entryFee).toLocaleString() + ' Toman' : 'Free';

  return (
    <div className="signup-wrapper" style={{ paddingTop: 100, minHeight: '100vh' }}>
      <Navbar />
      <div className="signup-card" style={{ maxWidth: 1100, margin: '24px auto 80px' }}>
        {/* Champion Banner (if completed) */}
        {champion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              marginBottom: 32,
              padding: 28,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,140,0,0.1))',
              border: '2px solid rgba(255,215,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              boxShadow: '0 8px 32px rgba(255,215,0,0.2)'
            }}
          >
            <Trophy size={64} style={{ color: '#FFD700', filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.8))' }} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: '#FFD700',
                textTransform: 'uppercase',
                marginBottom: 8,
                opacity: 0.9
              }}>
                🏆 TOURNAMENT CHAMPION
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FFD700', marginBottom: 10, textShadow: '0 2px 10px rgba(255,215,0,0.5)' }}>
                {champion.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, color: '#fff', fontWeight: 600 }}>
                <Coins size={22} style={{ color: '#FFD700' }} />
                <span>Prize Won: <strong style={{ color: '#FFD700' }}>{prizeDisplay} Toman</strong></span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tournament Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
            {/* Left: Info */}
            <div style={{ flex: '1 1 420px' }}>
              <h1 className="signup-title text-gradient" style={{ marginBottom: 8, fontSize: 42 }}>
                {tournament.title}
              </h1>
              <div style={{ fontSize: 18, color: '#00d9ff', marginBottom: 20, fontWeight: 700, letterSpacing: 0.5 }}>
                {tournament.game}
              </div>

              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 24
              }}>
                <div style={{
                  background: 'rgba(0,112,204,0.12)',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid rgba(0,217,255,0.25)'
                }}>
                  <div style={{
                    fontSize: 11,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    color: '#00d9ff',
                    fontWeight: 700,
                    marginBottom: 8
                  }}>
                    Entry Fee
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{entryDisplay}</div>
                </div>

                <div style={{
                  background: 'rgba(255,215,0,0.12)',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid rgba(255,215,0,0.4)'
                }}>
                  <div style={{
                    fontSize: 11,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    color: '#FFD700',
                    fontWeight: 700,
                    marginBottom: 8
                  }}>
                    Prize Pool
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#FFD700' }}>
                    {prizeDisplay} Toman
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0,112,204,0.12)',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid rgba(0,217,255,0.25)'
                }}>
                  <div style={{
                    fontSize: 11,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    color: '#00d9ff',
                    fontWeight: 700,
                    marginBottom: 8
                  }}>
                    Start Date
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{startDate}</div>
                </div>

                <div style={{
                  background: 'rgba(0,255,136,0.1)',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid rgba(0,255,136,0.3)'
                }}>
                  <div style={{
                    fontSize: 11,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    color: '#00ff88',
                    fontWeight: 700,
                    marginBottom: 8
                  }}>
                    Status
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#00ff88', textTransform: 'uppercase' }}>
                    {tournament.status}
                  </div>
                </div>
              </div>

              {/* Join Button */}
              {canJoin && (
                <button
                  className="btn-primary"
                  onClick={handleJoin}
                  disabled={joining}
                  style={{
                    minWidth: 240,
                    padding: '16px 32px',
                    fontSize: 17,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: 'center',
                    marginTop: 8,
                    background: 'var(--gradient-primary)',
                    boxShadow: '0 4px 20px rgba(0,217,255,0.4)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#000a1f',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Zap size={22} />
                  {joining ? 'Joining…' : 'Join Tournament'}
                </button>
              )}

              {!canJoin && tournament.status === 'COMPLETED' && !champion && (
                <div style={{ marginTop: 20, color: '#00d9ff', fontSize: 15, padding: 12, background: 'rgba(0,217,255,0.1)', borderRadius: 8, border: '1px solid rgba(0,217,255,0.3)' }}>
                  Tournament completed – awaiting final results.
                </div>
              )}
            </div>

            {/* Right: Image */}
            <div style={{ flex: '1 1 460px', minHeight: 280 }}>
              {tournament.imageUrl ? (
                <img
                  src={tournament.imageUrl}
                  alt="Tournament"
                  style={{
                    width: '100%',
                    maxHeight: 320,
                    objectFit: 'cover',
                    borderRadius: 16,
                    border: '2px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 320,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(0,112,204,0.25), rgba(0,217,255,0.15))',
                    border: '2px solid rgba(0,217,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 72
                  }}
                >
                  🎮
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 32 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            <button
              style={{
                background: activeTab === 'overview' ? 'var(--gradient-primary)' : 'rgba(0,112,204,0.15)',
                border: activeTab === 'overview' ? 'none' : '1px solid rgba(0,217,255,0.3)',
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 800,
                borderRadius: 12,
                color: activeTab === 'overview' ? '#000a1f' : '#00d9ff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                letterSpacing: 0.5,
                textTransform: 'uppercase'
              }}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              style={{
                background: activeTab === 'bracket' ? 'var(--gradient-primary)' : 'rgba(0,112,204,0.15)',
                border: activeTab === 'bracket' ? 'none' : '1px solid rgba(0,217,255,0.3)',
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 800,
                borderRadius: 12,
                color: activeTab === 'bracket' ? '#000a1f' : '#00d9ff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                letterSpacing: 0.5,
                textTransform: 'uppercase'
              }}
              onClick={() => setActiveTab('bracket')}
            >
              Bracket
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'grid', gap: 32 }}
            >
              <div>
                <h3 style={{ marginBottom: 14, fontSize: 22, fontWeight: 800, color: '#00d9ff' }}>Description</h3>
                <div style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.7,
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 15,
                  background: 'rgba(0,112,204,0.08)',
                  padding: 16,
                  borderRadius: 10,
                  border: '1px solid rgba(0,217,255,0.15)'
                }}>
                  {tournament.description || 'No description provided.'}
                </div>
              </div>
              <div>
                <h3 style={{ marginBottom: 14, fontSize: 22, fontWeight: 800, color: '#00d9ff' }}>Rules</h3>
                <div style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.7,
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 15,
                  background: 'rgba(0,112,204,0.08)',
                  padding: 16,
                  borderRadius: 10,
                  border: '1px solid rgba(0,217,255,0.15)'
                }}>
                  {tournament.rules || 'No rules provided.'}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'bracket' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {rounds.length === 0 && (
                <div style={{
                  padding: 40,
                  background: 'rgba(0,112,204,0.08)',
                  borderRadius: 16,
                  textAlign: 'center',
                  color: '#00d9ff',
                  fontSize: 16,
                  fontWeight: 600,
                  border: '1px solid rgba(0,217,255,0.2)'
                }}>
                  No matches scheduled yet. Check back later!
                </div>
              )}


              {rounds.map(r => (
                <div key={r.round} style={{ marginBottom: 36 }}>
                  <h4 style={{
                    marginBottom: 18,
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#00d9ff',
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    textShadow: '0 0 10px rgba(0,217,255,0.5)'
                  }}>
                    Round {r.round}
                  </h4>
                  <div style={{ display: 'grid', gap: 14 }}>
                    {r.matches.map(m => {
                      const p1Name = m.player1?.user?.psnId || m.player1?.user?.name || m.player1?.displayName || 'TBD';
                      const p2Name = m.player2
                        ? (m.player2?.user?.psnId || m.player2?.user?.name || m.player2?.displayName || 'TBD')
                        : 'Bye';
                      const winnerPid = m.winnerId;
                      const isP1Win = winnerPid && m.player1?.id === winnerPid;
                      const isP2Win = winnerPid && m.player2?.id === winnerPid;

                      return (
                        <div
                          key={m.id}
                          style={{
                            padding: 20,
                            borderRadius: 12,
                            background: 'rgba(0,112,204,0.1)',
                            border: '1px solid rgba(0,217,255,0.25)',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 12
                          }}>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>
                              <span style={{ color: isP1Win ? '#00ff88' : '#fff' }}>{p1Name}</span>
                              <span style={{ margin: '0 10px', color: '#00d9ff', fontWeight: 600 }}>vs</span>
                              <span style={{ color: isP2Win ? '#00ff88' : '#fff' }}>{p2Name}</span>
                            </div>
                            <div style={{
                              fontSize: 12,
                              fontWeight: 800,
                              letterSpacing: 0.8,
                              textTransform: 'uppercase',
                              color: m.status === 'COMPLETED' ? '#00ff88' : '#00d9ff',
                              background: m.status === 'COMPLETED' ? 'rgba(0,255,136,0.15)' : 'rgba(0,217,255,0.15)',
                              padding: '6px 12px',
                              borderRadius: 8
                            }}>
                              {m.status || 'PENDING'}
                            </div>
                          </div>
                          {(typeof m.score1 === 'number' || typeof m.score2 === 'number') && (
                            <div style={{
                              marginTop: 12,
                              fontSize: 15,
                              fontWeight: 700,
                              color: '#fff',
                              padding: '8px 12px',
                              background: 'rgba(0,217,255,0.1)',
                              borderRadius: 8,
                              display: 'inline-block'
                            }}>
                              Score: <span style={{ color: '#00d9ff' }}>{m.score1 != null ? m.score1 : '—'}</span> – <span style={{ color: '#00d9ff' }}>{m.score2 != null ? m.score2 : '—'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
