import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/SignUpPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = location.state?.from?.pathname || '/profile';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setServerError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate(next, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-wrapper">
      <div className="signup-card card-hover">
        <h1 className="signup-title text-gradient">Sign in</h1>
        <p className="signup-subtitle">
          Welcome back! Enter your credentials.
        </p>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form className="form-grid" onSubmit={onSubmit}>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ marginTop: 12, color: '#cfe7ff' }}>
          No account?{' '}
          <Link to="/signup" style={{ color: '#00d9ff' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
