import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Gamepad2,
  Medal,
  User,
  Menu,
  X,
  Wallet,
  Globe,
  LogIn,
  LogOut,
  UserPlus
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { language, changeLanguage, t } = useLanguage();
  const { isAuthenticated, user, token, logout } = useAuth();
  const [walletInfo, setWalletInfo] = useState({ walletBalance: '0', usdtBalance: '0' });

  function formatCompactBalance(bal) {
    try {
      if (bal === undefined || bal === null) return '0';
      const num = Number(bal);
      if (isNaN(num)) return String(bal);
      
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      }
      return num.toLocaleString();
    } catch (e) {
      return String(bal ?? '0');
    }
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchWallet() {
      if (!isAuthenticated || !token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/wallet`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!cancelled && res.ok && data?.success) {
          setWalletInfo({
            walletBalance: data.walletBalance ?? '0',
            usdtBalance: data.usdtBalance ?? '0'
          });
        }
      } catch {}
    }
    fetchWallet();
    const id = setInterval(fetchWallet, 20000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isAuthenticated, token]);

  function handleLogout() {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  }

  const navLinks = [
    { path: '/', label: t('navbar.home'), icon: Gamepad2 },
    { path: '/tournaments', label: t('navbar.tournaments'), icon: Trophy },
    { path: '/leaderboard', label: t('navbar.leaderboard'), icon: Medal },
    { path: '/profile', label: t('navbar.profile'), icon: User },
  ];

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'fa', label: 'فا' },
    { code: 'ar', label: 'العربية' },
    { code: 'tr', label: 'TR' }
  ];

  return (
    <>
      <motion.nav
        className={`navbar ${isScrolled ? 'scrolled' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" onClick={() => setIsMobileMenuOpen(false)}>
            <motion.div
              className="logo-icon"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Gamepad2 size={32} />
            </motion.div>
            <div className="logo-text">
              <span className="logo-main">PS5</span>
              <span className="logo-sub">ARENA</span>
            </div>
          </Link>

          <div className="navbar-center">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <link.icon size={18} />
                <span>{link.label}</span>
                {location.pathname === link.path && (
                  <motion.div
                    className="active-indicator"
                    layoutId="activeTab"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}

            {/* Admin links for admins (tournaments + transactions) */}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <div className="admin-nav">
                <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <span>Tournaments</span>
                </Link>
                <Link to="/admin/transactions" className={`nav-link ${location.pathname === '/admin/transactions' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <span>Transactions</span>
                </Link>
              </div>
            )}
          </div>

          <div className="navbar-right">
            {isAuthenticated && user && (
              <Link
                to="/wallet"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ textDecoration: 'none' }}
              >
                <motion.div 
                  className="wallet-display" 
                  whileHover={{ scale: 1.05 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 14px',
                    background: 'rgba(0, 217, 255, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 217, 255, 0.3)'
                  }}
                >
                  <Wallet size={20} style={{ color: 'var(--ps-electric)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '10px', opacity: 0.7, marginRight: '4px' }}>IRT</span>
                      {formatCompactBalance(walletInfo.walletBalance)}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '9px', opacity: 0.7, marginRight: '4px' }}>USDT</span>
                      {formatCompactBalance(walletInfo.usdtBalance)}
                    </span>
                  </div>
                </motion.div>
              </Link>
            )}

            <div className="language-selector">
              <Globe size={18} />
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="language-dropdown"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>

            {!isAuthenticated ? (
              <>
                <Link to="/login" className="login-btn" onClick={() => setIsMobileMenuOpen(false)}>
                  <LogIn size={18} />
                  <span>{t('navbar.login')}</span>
                </Link>
                <Link to="/signup" className="login-btn" onClick={() => setIsMobileMenuOpen(false)}>
                  <UserPlus size={18} />
                  <span>Sign up</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="login-btn" onClick={() => setIsMobileMenuOpen(false)}>
                  <User size={18} />
                  <span>{t('navbar.profile')}</span>
                </Link>
                <motion.button
                  className="login-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  <span>{t('navbar.logout') || 'Logout'}</span>
                </motion.button>
              </>
            )}

            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="mobile-menu-content">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`mobile-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <link.icon size={24} />
                  <span>{link.label}</span>
                </Link>
              ))}

              {/* Wallet link in mobile menu */}
              {isAuthenticated && user && (
                <Link
                  to="/wallet"
                  className="mobile-nav-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Wallet size={24} />
                  <span>Wallet: {formatCompactBalance(walletInfo.walletBalance)} IRT / {formatCompactBalance(walletInfo.usdtBalance)} USDT</span>
                </Link>
              )}

              {/* Admin links in mobile menu */}
              {isAuthenticated && user?.role === 'ADMIN' && (
                <div style={{ display: 'flex', gap: 8, padding: 8 }}>
                  <Link to="/admin" className="mobile-login-btn" onClick={() => setIsMobileMenuOpen(false)}>Tournaments</Link>
                  <Link to="/admin/transactions" className="mobile-login-btn" onClick={() => setIsMobileMenuOpen(false)}>Transactions</Link>
                </div>
              )}

              <div className="mobile-menu-footer">

                {!isAuthenticated ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Link
                      to="/login"
                      className="mobile-login-btn"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LogIn size={20} />
                      <span>{t('navbar.login')}</span>
                    </Link>
                    <Link
                      to="/signup"
                      className="mobile-login-btn"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <UserPlus size={20} />
                      <span>Sign up</span>
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Link
                      to="/profile"
                      className="mobile-login-btn"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User size={20} />
                      <span>{t('navbar.profile')}</span>
                    </Link>
                    <button className="mobile-login-btn" onClick={handleLogout}>
                      <LogOut size={20} />
                      <span>{t('navbar.logout') || 'Logout'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
