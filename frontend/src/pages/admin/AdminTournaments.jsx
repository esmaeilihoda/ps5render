import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { GAMES_CONFIG } from '../../data/games';
import '../../styles/SignUpPage.css';

// Convert Date → "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
function toLocalInputValue(d) {
  const pad = (n) => (n < 10 ? '0' + n : n);
  const dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return dt.toISOString().slice(0, 16);
}

const emptyForm = {
  title: '',
  gameSlug: '',
  game: '',
  mode: '',
  imageUrl: '',
  entryFee: 0,
  prizePool: 0,
  maxPlayers: 16,
  startAt: toLocalInputValue(new Date(Date.now() + 24 * 3600 * 1000)),
  description: '',
  rules: '',
  status: 'DRAFT',
  currency: 'TOMAN', // NEW: currency field
};

export default function AdminTournaments() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => items, [items]);
  const isEditing = !!editId;

  // Get available modes based on selected game
  const availableModes = useMemo(() => {
    if (!form.gameSlug || !GAMES_CONFIG[form.gameSlug]) return [];
    return GAMES_CONFIG[form.gameSlug].modes || [];
  }, [form.gameSlug]);

  async function loadList() {
    setLoading(true);
    setServerError('');
    try {
      const res = await api.admin.tournaments.list(q ? { q } : {});
      setItems(res.items || []);
    } catch (e) {
      setServerError(e.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []); // initial load

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // When game changes, reset mode and auto-fill game field
      if (field === 'gameSlug') {
        const gameConfig = GAMES_CONFIG[value];
        if (gameConfig) {
          next.game = gameConfig.title;
          next.mode = '';
          next.description = gameConfig.description || '';
          next.rules = gameConfig.rules || '';
        }
      }

      // When mode changes, auto-update title and description
      if (field === 'mode' && value && form.gameSlug) {
        const gameConfig = GAMES_CONFIG[form.gameSlug];
        const modeObj = gameConfig.modes.find(m => m.name === value);
        if (modeObj) {
          next.title = `${gameConfig.title} - ${value}`;
          next.description = `${gameConfig.description}\n\nTournament Format: ${modeObj.desc}`;
        }
      }

      // When currency changes, reset entryFee/prizePool
      if (field === 'currency') {
        next.entryFee = 0;
        next.prizePool = 0;
      }

      return next;
    });
  }

  function reset() {
    setForm(emptyForm);
    setEditId(null);
  }

  function startCreate() {
    reset();
  }

  function startEdit(item) {
    // Find matching game slug from title
    let matchedSlug = '';
    for (const [slug, config] of Object.entries(GAMES_CONFIG)) {
      if (item.game && item.game.includes(config.title)) {
        matchedSlug = slug;
        break;
      }
    }

    setEditId(item.id);
    setForm({
      id: item.id,
      title: item.title || '',
      gameSlug: matchedSlug,
      game: item.game || '',
      mode: '', // mode is embedded in title, so leave empty for manual edit
      imageUrl: item.imageUrl || '',
      entryFee: item.entryFee || 0,
      prizePool: item.prizePool || 0,
      maxPlayers: item.maxPlayers || 16,
      startAt: toLocalInputValue(new Date(item.startAt)),
      description: item.description || '',
      rules: item.rules || '',
      status: item.status || 'DRAFT',
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setServerError('');
    setSuccess('');
    try {
      if (!form.title?.trim()) throw new Error('Title is required');
      if (!form.game?.trim()) throw new Error('Game is required');
      if (!form.startAt) throw new Error('Start date/time is required');

      const payload = {
        title: form.title.trim(),
        game: form.game.trim(),
        description: form.description?.trim() || '',
        rules: form.rules?.trim() || '',
        imageUrl: form.imageUrl?.trim() || null,
        startAt: new Date(form.startAt).toISOString(),
        entryFee: form.currency === 'USDT' ? Number(form.entryFee) : parseInt(form.entryFee, 10),
        prizePool: form.currency === 'USDT' ? Number(form.prizePool) : parseInt(form.prizePool, 10),
        maxPlayers: Math.max(2, parseInt(form.maxPlayers, 10) || 16),
        status: form.status || 'DRAFT',
        currency: form.currency,
      };

      if (isEditing) {
        await api.admin.tournaments.update(form.id, payload);
        setSuccess('Tournament updated');
      } else {
        await api.admin.tournaments.create(payload);
        setSuccess('Tournament created');
      }
      await loadList();
      reset();
    } catch (err) {
      // Show server-side field errors if present
      if (err?.details) {
        const firstField = Object.keys(err.details)[0];
        const firstMsg = err.details[firstField]?.[0];
        setServerError(firstMsg || err.message || 'Save failed');
      } else {
        setServerError(err.message || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this tournament?')) return;
    try {
      await api.admin.tournaments.remove(id);
      await loadList();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  }

  async function setStatus(id, status) {
    try {
      await api.admin.tournaments.setStatus(id, status);
      await loadList();
    } catch (e) {
      alert(e.message || 'Update status failed');
    }
  }

  return (
    <div className="signup-wrapper">
      <div className="signup-card" style={{ width: '100%', maxWidth: 1100 }}>
        <h1 className="signup-title text-gradient">Admin • Tournaments</h1>
        <p className="signup-subtitle">Create and manage tournaments</p>

        {serverError && <div className="alert alert-error">{serverError}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="form-grid" onSubmit={onSubmit} style={{ marginBottom: 20 }}>
          {/* Game Selection Dropdown */}
          <div>
            <label className="label">Game</label>
            <select
              className="input"
              value={form.gameSlug}
              onChange={e => update('gameSlug', e.target.value)}
              required
              style={{ cursor: 'pointer' }}
            >
              <option value="">-- Select Game --</option>
              {Object.entries(GAMES_CONFIG).map(([slug, config]) => (
                <option key={slug} value={slug}>
                  {config.title}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selection Dropdown (conditional) */}
          {form.gameSlug && availableModes.length > 0 && (
            <div>
              <label className="label">Tournament Format</label>
              <select
                className="input"
                value={form.mode}
                onChange={e => update('mode', e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">-- Select Format --</option>
                {availableModes.map((mode) => (
                  <option key={mode.name} value={mode.name}>
                    {mode.name} - {mode.desc}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
                Selecting a format will auto-fill the title and description
              </div>
            </div>
          )}

          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={form.title} 
              onChange={e => update('game', e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="label">Image URL</label>
            <input className="input" value={form.imageUrl} onChange={e => update('imageUrl', e.target.value)} />
          </div>

          {/* Currency Selection */}
          <div>
            <label className="label">Currency</label>
            <select
              className="input"
              value={form.currency}
              onChange={e => update('currency', e.target.value)}
              required
              style={{ cursor: 'pointer' }}
            >
              <option value="TOMAN">Toman</option>
              <option value="USDT">USDT (Crypto)</option>
            </select>
          </div>

          <div>
            <label className="label">Entry Fee ({form.currency})</label>
            <input
              className="input"
              type={form.currency === 'USDT' ? 'number' : 'number'}
              step={form.currency === 'USDT' ? '0.0001' : '1'}
              min="0"
              value={form.entryFee}
              onChange={e => update('entryFee', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Prize Pool ({form.currency})</label>
            <input
              className="input"
              type={form.currency === 'USDT' ? 'number' : 'number'}
              step={form.currency === 'USDT' ? '0.0001' : '1'}
              min="0"
              value={form.prizePool}
              onChange={e => update('prizePool', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Max Players</label>
            <input
              className="input"
              type="number"
              value={form.maxPlayers}
              onChange={e => update('maxPlayers', e.target.value)}
              min="2"
              required
            />
          </div>

          <div>
            <label className="label">Start at</label>
            <input
              className="input"
              type="datetime-local"
              value={form.startAt}
              onChange={e => update('startAt', e.target.value)}
              required
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={4}
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Auto-filled from game config"
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Rules</label>
            <textarea
              className="input"
              rows={5}
              value={form.rules}
              onChange={e => update('rules', e.target.value)}
              placeholder="Auto-filled from game config"
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
            <button className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
            {isEditing && (
              <button
                type="button"
                className="btn-primary"
                onClick={startCreate}
                style={{ background: 'linear-gradient(135deg,#666,#999)' }}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
          <input
            className="input"
            placeholder="Search title or game..."
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <button className="btn-primary" onClick={loadList}>Search</button>
          <button className="btn-primary" onClick={startCreate} style={{ marginLeft: 'auto' }}>
            New Tournament
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #003066' }}>
                  <th style={{ padding: 8 }}>Title</th>
                  <th style={{ padding: 8 }}>Game</th>
                  <th style={{ padding: 8 }}>Start</th>
                  <th style={{ padding: 8 }}>Entry</th>
                  <th style={{ padding: 8 }}>Prize</th>
                  <th style={{ padding: 8 }}>Max</th>
                  <th style={{ padding: 8 }}>Status</th>
                  <th style={{ padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #001a3d' }}>
                    <td style={{ padding: 8 }}>{t.title}</td>
                    <td style={{ padding: 8 }}>{t.game}</td>
                    <td style={{ padding: 8 }}>{new Date(t.startAt).toLocaleString()}</td>
                    <td style={{ padding: 8 }}>${t.entryFee}</td>
                    <td style={{ padding: 8 }}>${t.prizePool}</td>
                    <td style={{ padding: 8 }}>{t.maxPlayers}</td>
                    <td style={{ padding: 8 }}>{t.status}</td>
                    <td style={{ padding: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn-primary" onClick={() => navigate(`/admin/tournaments/${t.id}`)}>Manage</button>
                      <button className="btn-primary" onClick={() => startEdit(t)}>Edit</button>
                      <button
                        className="btn-primary"
                        onClick={() => remove(t.id)}
                        style={{ background: 'linear-gradient(135deg,#8b0000,#ff1744)' }}
                      >
                        Delete
                      </button>
                      {t.status !== 'PUBLISHED' && (
                        <button className="btn-primary" onClick={() => setStatus(t.id, 'PUBLISHED')}>Publish</button>
                      )}
                      {t.status !== 'COMPLETED' && (
                        <button className="btn-primary" onClick={() => setStatus(t.id, 'COMPLETED')}>Complete</button>
                      )}
                      {t.status !== 'CANCELED' && (
                        <button className="btn-primary" onClick={() => setStatus(t.id, 'CANCELED')}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan="8" style={{ padding: 10, color: '#b8d8ff' }}>
                      No tournaments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}