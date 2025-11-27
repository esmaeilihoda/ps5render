import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { apiGet, apiPost } from '../services/api';
import '../styles/SignUpPage.css';

export default function WalletPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [balance, setBalance] = useState('0');
  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState({ toman: 0, usdt: 0 });
  const [depositCurrency, setDepositCurrency] = useState('TOMAN');
  const [depositAmount, setDepositAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '...' }

  // Format balance helper
  function formatBalance(bal) {
    if (!bal) return '0';
    try {
      const n = Number(bal);
      return Number.isFinite(n) ? n.toLocaleString() : String(bal).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } catch {
      return String(bal);
    }
  }

  // Get currency from transaction
  function getTransactionCurrency(tx) {
    // Check metadata first
    if (tx.metadata && tx.metadata.currency) {
      return tx.metadata.currency === 'USD' ? 'USDT' : tx.metadata.currency;
    }
    // Fallback to gateway
    if (tx.gateway === 'PAYMENT4') return 'USDT';
    if (tx.gateway === 'ZARRINPAL') return 'Toman';
    // Default based on type
    return 'Toman';
  }

  // Fetch wallet data on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await apiGet('/api/wallet');
        if (!cancelled) {
          setBalances({
            toman: data.walletBalance ?? data.balanceToman ?? user?.balanceToman ?? user?.walletBalance ?? 0,
            usdt: data.usdtBalance ?? user?.balanceUsdt ?? 0,
          });
          setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        }
      } catch (err) {
        console.error('Failed to load wallet', err);
        if (!cancelled) {
          setMessage({ type: 'error', text: err.message || 'Failed to load wallet data' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.id, user?.walletBalance]);

  // Check URL params for payment status (redirect from gateway)
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      setMessage({ type: 'success', text: 'Deposit Successful! Your wallet has been updated.' });
      // clear the ?status param after showing message
      setTimeout(() => {
        navigate('/wallet', { replace: true });
      }, 100);
    } else if (status === 'failed') {
      setMessage({ type: 'error', text: 'Payment Failed. Please try again or contact support.' });
      setTimeout(() => {
        navigate('/wallet', { replace: true });
      }, 100);
    }
  }, [searchParams, navigate]);

  // Handle amount input with thousand separators
  function handleAmountChange(value) {
    // Remove all non-digit characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    setDepositAmount(cleaned);
    
    // Format for display with thousand separators
    if (cleaned) {
      const parts = cleaned.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setDisplayAmount(parts.join('.'));
    } else {
      setDisplayAmount('');
    }
  }

  // Deposit handler
  async function handleDeposit(e) {
    e.preventDefault();
    setMessage(null);
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }
    setDepositing(true);
    try {
      let res;
      if (depositCurrency === 'TOMAN') {
        res = await apiPost('/api/wallet/deposit/zarrinpal', { amount: amt });
      } else {
        res = await apiPost('/api/wallet/deposit/payment4', { amount: amt });
      }
      if (res.url) {
        window.location.href = res.url;
      } else {
        setMessage({ type: 'success', text: 'Deposit initiated. Please follow payment instructions.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Deposit request failed.' });
    } finally {
      setDepositing(false);
    }
  }

  // Transaction type label and icon
  function getTransactionIcon(type) {
    const t = String(type || '').toUpperCase();
    if (t.includes('DEPOSIT') || t.includes('PRIZE')) return <ArrowDownLeft size={20} className="tx-icon-in" />;
    if (t.includes('ENTRY') || t.includes('FEE') || t.includes('WITHDRAWAL')) return <ArrowUpRight size={20} className="tx-icon-out" />;
    return <History size={20} />;
  }

  function getStatusIcon(status) {
    const s = String(status || '').toUpperCase();
    if (s === 'SUCCESS' || s === 'COMPLETED') return <CheckCircle size={16} style={{ color: 'var(--ps-green)' }} />;
    if (s === 'FAILED' || s === 'CANCELED') return <XCircle size={16} style={{ color: 'var(--ps-red)' }} />;
    return <Clock size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />;
  }

  if (loading) {
    return (
      <div className="signup-wrapper">
        <Navbar />
        <div style={{ padding: 48, textAlign: 'center' }}>Loading wallet...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="signup-wrapper">
        <Navbar />
        <div style={{ padding: 48, textAlign: 'center' }}>Please log in to view your wallet.</div>
      </div>
    );
  }

  return (
    <div className="signup-wrapper">
      <Navbar />
      <div className="signup-card" style={{ maxWidth: 1000, margin: '24px auto' }}>
        <h1 className="signup-title text-gradient">Wallet</h1>
        <p className="signup-subtitle">Manage your funds and view transaction history</p>

        {/* Message Banner */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={message.type === 'success' ? 'alert' : 'alert alert-error'}
            style={{ marginBottom: 20 }}
          >
            {message.text}
          </motion.div>
        )}

        {/* Balance Card */}
        <motion.div
          className="signup-card"
          style={{
            background: 'linear-gradient(135deg, rgba(0,112,204,0.15), rgba(0,217,255,0.08))',
            border: '1px solid rgba(0,217,255,0.3)',
            padding: 32,
            marginBottom: 24,
            textAlign: 'center'
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <Wallet size={32} style={{ color: 'var(--ps-electric)' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Current Balances</h2>
          </div>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
                {formatBalance(balances.toman)} <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>Toman</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Iranian Rial</div>
            </div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
                {formatBalance(balances.usdt)} <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>USDT</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Crypto</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 16 }}>
            Available for tournament entries and withdrawals
          </div>
        </motion.div>

        {/* Deposit Card */}
        <motion.div
          className="signup-card"
          style={{ padding: 24, marginBottom: 24 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: '18px' }}>
            <TrendingUp size={20} style={{ color: 'var(--ps-green)' }} />
            Deposit Funds
          </h3>
          <form onSubmit={handleDeposit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                Select Payment Method
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  style={{ 
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: 8,
                    border: depositCurrency === 'TOMAN' ? '2px solid var(--ps-electric)' : '2px solid rgba(255,255,255,0.1)',
                    background: depositCurrency === 'TOMAN' ? 'linear-gradient(135deg, rgba(0,112,204,0.3), rgba(0,217,255,0.2))' : 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setDepositCurrency('TOMAN')}
                >
                  Toman (Zarrinpal)
                </button>
                <button
                  type="button"
                  style={{ 
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: 8,
                    border: depositCurrency === 'USDT' ? '2px solid var(--ps-electric)' : '2px solid rgba(255,255,255,0.1)',
                    background: depositCurrency === 'USDT' ? 'linear-gradient(135deg, rgba(0,112,204,0.3), rgba(0,217,255,0.2))' : 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setDepositCurrency('USDT')}
                >
                  USDT (Payment4)
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                Amount ({depositCurrency === 'USDT' ? 'USDT' : 'Toman'})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={displayAmount}
                onChange={e => handleAmountChange(e.target.value)}
                placeholder={depositCurrency === 'USDT' ? 'e.g., 10.50' : 'e.g., 10,000'}
                style={{ 
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 8,
                  border: '2px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--ps-electric)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <button 
              className="btn-primary" 
              type="submit" 
              disabled={depositing}
              style={{ 
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: 700
              }}
            >
              {depositing
                ? 'Processing...'
                : depositCurrency === 'TOMAN'
                ? 'Pay with Zarrinpal'
                : 'Pay with Payment4'}
            </button>
          </form>
          <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            {depositCurrency === 'USDT'
              ? 'Secure payment powered by Payment4. Min deposit: 0.0001 USDT.'
              : 'Secure payment powered by ZarinPal. Min deposit: 1,000 Toman.'}
          </div>
        </motion.div>

        {/* Transaction History Card */}
        <motion.div
          className="signup-card"
          style={{ padding: 24 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={20} style={{ color: 'var(--ps-electric)' }} />
            Transaction History
          </h3>

          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.6)' }}>
              No transactions yet. Start by depositing funds!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                    <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Description</th>
                    <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: 12, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const date = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—';
                    const amountStr = String(tx.amount ?? '0');
                    const isPositive = !amountStr.startsWith('-');
                    const displayAmount = isPositive ? `+${formatBalance(amountStr)}` : formatBalance(amountStr);
                    const amountColor = isPositive ? 'var(--ps-green)' : 'var(--ps-red)';

                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: 12, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{date}</td>
                        <td style={{ padding: 12, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {getTransactionIcon(tx.type)}
                          <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{tx.type || 'Transaction'}</span>
                        </td>
                        <td style={{ padding: 12, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{tx.description || '—'}</td>
                        <td style={{ padding: 12, fontSize: 16, fontWeight: 700, color: amountColor, textAlign: 'right' }}>
                          {displayAmount} <span style={{ fontSize: 12 }}>{getTransactionCurrency(tx)}</span>
                        </td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {getStatusIcon(tx.status)}
                            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
                              {tx.status || 'PENDING'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      <style>{`
        .tx-icon-in {
          color: var(--ps-green);
        }
        .tx-icon-out {
          color: var(--ps-red);
        }
      `}</style>
    </div>
  );
}
