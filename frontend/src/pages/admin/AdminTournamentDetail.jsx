import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, API_URL } from '../../services/api';
import { Trophy, Users, Calendar, DollarSign, Award, CheckCircle } from 'lucide-react';
import '../../styles/SignUpPage.css';

export default function AdminTournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [matchForm, setMatchForm] = useState({ player1Id: '', player2Id: '', round: 1 });
  const [editingMatch, setEditingMatch] = useState(null);
  const [prizeForm, setPrizeForm] = useState([{ position: 1, prize: 0, percentage: 0 }]);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [tRes, pRes, mRes] = await Promise.all([
        api.admin.tournaments.getOne(id),
        fetch(`${API_URL}/api/admin/tournaments/${id}/participants`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()).catch(() => ({ participants: [] })),
        fetch(`${API_URL}/api/admin/tournaments/${id}/matches`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()).catch(() => ({ matches: [] }))
      ]);

      console.log('Tournament data:', tRes);
      console.log('Participants data:', pRes);
      console.log('Matches data:', mRes);

      setTournament(tRes.tournament);
      setParticipants(pRes.participants || []);
      setMatches(mRes.matches || []);
      
      // Initialize prize form from tournament data
      if (tRes.tournament.prizeDistribution && Array.isArray(tRes.tournament.prizeDistribution)) {
        setPrizeForm(tRes.tournament.prizeDistribution);
      }
    } catch (e) {
      console.error('Load data error:', e);
      setError(e.message || 'Failed to load tournament');
    } finally {
      setLoading(false);
    }
  }

  async function createMatch(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_URL}/api/admin/tournaments/${id}/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(matchForm)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create match');
      }
      
      setSuccess('Match created successfully');
      setMatchForm({ player1Id: '', player2Id: '', round: 1 });
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function updateMatch(matchId, updates) {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_URL}/api/admin/tournaments/${id}/matches/${matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update match');
      }
      
      setSuccess('Match updated successfully');
      setEditingMatch(null);
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function savePrizeDistribution() {
    setError('');
    setSuccess('');
    try {
      await api.admin.tournaments.update(id, {
        ...tournament,
        prizeDistribution: prizeForm
      });
      setSuccess('Prize distribution saved');
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function finalizeTournament() {
    if (!confirm('Finalize tournament and distribute prizes? This cannot be undone.')) return;
    
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_URL}/api/admin/tournaments/${id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to finalize tournament');
      }
      
      const data = await response.json();
      setSuccess(data.message || 'Tournament finalized successfully!');
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  function addPrizeRow() {
    setPrizeForm([...prizeForm, { position: prizeForm.length + 1, prize: 0, percentage: 0 }]);
  }

  function updatePrizeRow(index, field, value) {
    const updated = [...prizeForm];
    updated[index][field] = field === 'position' ? parseInt(value) : parseFloat(value);
    setPrizeForm(updated);
  }

  function removePrizeRow(index) {
    setPrizeForm(prizeForm.filter((_, i) => i !== index));
  }

  if (loading) return <div className="signup-wrapper"><div className="signup-card">Loading...</div></div>;
  if (!tournament) return <div className="signup-wrapper"><div className="signup-card">Tournament not found</div></div>;

  const currencySymbol = tournament.currency === 'USDT' ? '$' : 'T';
  const approvedParticipants = participants.filter(p => p.status === 'APPROVED');

  return (
    <div className="signup-wrapper">
      <div className="signup-card" style={{ width: '100%', maxWidth: 1200 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 className="signup-title text-gradient">{tournament.title}</h1>
            <p className="signup-subtitle">{tournament.game} • {tournament.status}</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/admin')}>
            ← Back to List
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Tournament Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div style={{ padding: 16, background: 'rgba(0,217,255,0.1)', borderRadius: 12, border: '1px solid rgba(0,217,255,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Users size={20} color="#00d9ff" />
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>Participants</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{approvedParticipants.length}/{tournament.maxPlayers}</div>
          </div>
          <div style={{ padding: 16, background: 'rgba(255,215,0,0.1)', borderRadius: 12, border: '1px solid rgba(255,215,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Trophy size={20} color="#ffd700" />
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>Prize Pool</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{currencySymbol}{tournament.prizePool.toLocaleString()}</div>
          </div>
          <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Calendar size={20} color="#ffffff" />
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>Start Date</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{new Date(tournament.startAt).toLocaleString()}</div>
          </div>
        </div>

        {/* Prize Distribution Configuration */}
        <div style={{ marginBottom: 32, padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
          <h2 style={{ marginBottom: 8, fontSize: 20 }}>Prize Distribution</h2>
          <p style={{ marginBottom: 16, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
            Configure how prizes are distributed to winners. Position 1 = 1st place, Position 2 = 2nd place, etc.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px 80px', gap: 12, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Position</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Prize Amount ({currencySymbol})</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Percentage (%)</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Action</div>
          </div>
          {prizeForm.map((prize, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px 80px', gap: 12, marginBottom: 12, alignItems: 'center' }}>
              <input
                type="number"
                className="input"
                placeholder="1"
                value={prize.position}
                onChange={e => updatePrizeRow(idx, 'position', e.target.value)}
              />
              <input
                type="number"
                className="input"
                placeholder="0"
                value={prize.prize}
                onChange={e => updatePrizeRow(idx, 'prize', e.target.value)}
              />
              <input
                type="number"
                className="input"
                placeholder="0"
                value={prize.percentage}
                onChange={e => updatePrizeRow(idx, 'percentage', e.target.value)}
              />
              <button
                className="btn-primary"
                onClick={() => removePrizeRow(idx)}
                style={{ background: 'linear-gradient(135deg,#8b0000,#ff1744)', minWidth: 80 }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn-primary" onClick={addPrizeRow}>+ Add Prize Position</button>
            <button className="btn-primary" onClick={savePrizeDistribution}>Save Distribution</button>
          </div>
        </div>

        {/* Participants List */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 16, fontSize: 20 }}>Participants ({participants.length} total, {approvedParticipants.length} approved)</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #003066' }}>
                  <th style={{ padding: 8 }}>Player</th>
                  <th style={{ padding: 8 }}>PSN ID</th>
                  <th style={{ padding: 8 }}>Phone</th>
                  <th style={{ padding: 8 }}>Status</th>
                  <th style={{ padding: 8 }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: 16, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                      No participants yet. Players need to join this tournament.
                    </td>
                  </tr>
                ) : (
                  participants.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #001a3d' }}>
                      <td style={{ padding: 8 }}>{p.user?.name || 'Unknown'}</td>
                      <td style={{ padding: 8 }}>{p.user?.psnId || '—'}</td>
                      <td style={{ padding: 8 }}>{p.user?.phone || '—'}</td>
                      <td style={{ padding: 8 }}>{p.status}</td>
                      <td style={{ padding: 8 }}>{new Date(p.joinedAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Match */}
        <div style={{ marginBottom: 32, padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
          <h2 style={{ marginBottom: 8, fontSize: 20 }}>Create New Match</h2>
          <p style={{ marginBottom: 16, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
            Create a match between two participants. Round number is used to organize tournament brackets (1 = First Round, 2 = Quarter Finals, etc.).
          </p>
          <form onSubmit={createMatch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Player 1</label>
              <select
                className="input"
                value={matchForm.player1Id}
                onChange={e => setMatchForm({...matchForm, player1Id: e.target.value})}
                required
                style={{ width: '100%' }}
              >
                <option value="">Select Player 1</option>
                {approvedParticipants.map(p => (
                  <option key={p.id} value={p.id}>{p.user?.name} ({p.user?.psnId})</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Player 2</label>
              <select
                className="input"
                value={matchForm.player2Id}
                onChange={e => setMatchForm({...matchForm, player2Id: e.target.value})}
                required
                style={{ width: '100%' }}
              >
                <option value="">Select Player 2</option>
                {approvedParticipants.map(p => (
                  <option key={p.id} value={p.id}>{p.user?.name} ({p.user?.psnId})</option>
                ))}
              </select>
            </div>
            <div style={{ width: 120 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Round Number</label>
              <input
                type="number"
                className="input"
                placeholder="1"
                min="1"
                value={matchForm.round}
                onChange={e => setMatchForm({...matchForm, round: parseInt(e.target.value)})}
                style={{ width: '100%' }}
              />
            </div>
            <button className="btn-primary" type="submit">Create Match</button>
          </form>
        </div>

        {/* Matches List */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 16, fontSize: 20 }}>Matches ({matches.length})</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #003066' }}>
                  <th style={{ padding: 8 }}>Round</th>
                  <th style={{ padding: 8 }}>Player 1</th>
                  <th style={{ padding: 8 }}>Score</th>
                  <th style={{ padding: 8 }}>Player 2</th>
                  <th style={{ padding: 8 }}>Score</th>
                  <th style={{ padding: 8 }}>Status</th>
                  <th style={{ padding: 8 }}>Winner</th>
                  <th style={{ padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #001a3d' }}>
                    <td style={{ padding: 8 }}>R{m.round}</td>
                    <td style={{ padding: 8 }}>{m.player1?.user?.name || '—'}</td>
                    <td style={{ padding: 8 }}>
                      {editingMatch === m.id ? (
                        <input
                          type="number"
                          className="input"
                          defaultValue={m.score1 || 0}
                          id={`score1-${m.id}`}
                          style={{ width: 60 }}
                        />
                      ) : (m.score1 ?? '—')}
                    </td>
                    <td style={{ padding: 8 }}>{m.player2?.user?.name || '—'}</td>
                    <td style={{ padding: 8 }}>
                      {editingMatch === m.id ? (
                        <input
                          type="number"
                          className="input"
                          defaultValue={m.score2 || 0}
                          id={`score2-${m.id}`}
                          style={{ width: 60 }}
                        />
                      ) : (m.score2 ?? '—')}
                    </td>
                    <td style={{ padding: 8 }}>{m.status}</td>
                    <td style={{ padding: 8 }}>{m.winner?.user?.name || '—'}</td>
                    <td style={{ padding: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {editingMatch === m.id ? (
                        <>
                          <button
                            className="btn-primary"
                            onClick={() => {
                              const score1 = parseInt(document.getElementById(`score1-${m.id}`).value);
                              const score2 = parseInt(document.getElementById(`score2-${m.id}`).value);
                              updateMatch(m.id, { score1, score2, status: 'COMPLETED' });
                            }}
                          >
                            Save
                          </button>
                          <button
                            className="btn-primary"
                            onClick={() => setEditingMatch(null)}
                            style={{ background: 'linear-gradient(135deg,#666,#999)' }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn-primary"
                          onClick={() => setEditingMatch(m.id)}
                        >
                          Edit Scores
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Finalize Tournament */}
        {tournament.status === 'PUBLISHED' && matches.length > 0 && (
          <div style={{ padding: 20, background: 'rgba(0,255,136,0.1)', borderRadius: 12, border: '1px solid rgba(0,255,136,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Award size={24} color="#00ff88" />
              <h2 style={{ fontSize: 20, margin: 0 }}>Finalize Tournament</h2>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
              This will calculate final rankings, distribute prizes to winners, and mark the tournament as COMPLETED. This action cannot be undone.
            </p>
            <button
              className="btn-primary"
              onClick={finalizeTournament}
              style={{ background: 'linear-gradient(135deg,#00ff88,#00d97f)' }}
            >
              <CheckCircle size={18} />
              Finalize & Distribute Prizes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
