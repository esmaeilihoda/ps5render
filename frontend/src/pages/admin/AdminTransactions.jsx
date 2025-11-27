import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import '../../styles/SignUpPage.css';

export default function AdminTransactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await api.admin.transactions.list(statusFilter ? { status: statusFilter } : {});
      console.log('Admin transactions loaded:', res.items?.length, 'items');
      setItems(res.items || []);
    } catch (e) {
      console.error('Failed to load admin transactions:', e);
      alert('Failed to load transactions: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function setStatus(id, status) {
    if (!confirm(`Set transaction ${id} to ${status}?`)) return;
    try {
      await api.admin.transactions.update(id, { status });
      await load();
    } catch (e) {
      alert(e.message || 'Failed');
    }
  }

  return (
    <div className="signup-wrapper">
      <div className="signup-card" style={{ width: '100%', maxWidth: 1100 }}>
        <h1 className="signup-title text-gradient">Admin • Transactions</h1>
        <p className="signup-subtitle">List and reconcile wallet transactions</p>

        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input">
            <option value="">All statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
          <button className="btn-primary" onClick={load}>Refresh</button>
        </div>

        {loading ? <div style={{ padding: 20, textAlign: 'center' }}>Loading transactions...</div> : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
            No transactions found{statusFilter ? ` with status "${statusFilter}"` : ''}.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #003066' }}>
                  <th style={{ padding: 8 }}>ID</th>
                  <th style={{ padding: 8 }}>User</th>
                  <th style={{ padding: 8 }}>Amount</th>
                  <th style={{ padding: 8 }}>Gateway</th>
                  <th style={{ padding: 8 }}>Authority</th>
                  <th style={{ padding: 8 }}>Status</th>
                  <th style={{ padding: 8 }}>Created</th>
                  <th style={{ padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #001a3d' }}>
                    <td style={{ padding: 8, fontSize: 12 }}>{tx.id.slice(0, 8)}...</td>
                    <td style={{ padding: 8 }}>{tx.user?.email || tx.userId}</td>
                    <td style={{ padding: 8, fontWeight: 600 }}>
                      {String(tx.amount)} {tx.metadata?.currency === 'USD' ? 'USDT' : tx.gateway === 'PAYMENT4' ? 'USDT' : 'Toman'}
                    </td>
                    <td style={{ padding: 8 }}>{tx.gateway}</td>
                    <td style={{ padding: 8 }}>{tx.authority}</td>
                    <td style={{ padding: 8 }}>{tx.status}</td>
                    <td style={{ padding: 8 }}>{new Date(tx.createdAt).toLocaleString()}</td>
                    <td style={{ padding: 8, display: 'flex', gap: 8 }}>
                      {tx.status !== 'SUCCESS' && <button className="btn-primary" onClick={() => setStatus(tx.id, 'SUCCESS')}>Mark SUCCESS</button>}
                      {tx.status !== 'FAILED' && <button className="btn-primary" onClick={() => setStatus(tx.id, 'FAILED')}>Mark FAILED</button>}
                      {tx.status !== 'REFUNDED' && <button className="btn-primary" onClick={() => setStatus(tx.id, 'REFUNDED')}>Mark REFUNDED</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
