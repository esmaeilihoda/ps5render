import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../services/api';
import '../styles/SignUpPage.css';

const psnPattern = /^[A-Za-z][A-Za-z0-9_-]{2,15}$/;

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    psnId: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Please enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      e.password = 'Min 8 chars with letters and numbers';
    }
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match';
    if (!psnPattern.test(form.psnId)) e.psnId = 'PSN ID: start with a letter, 3–16 chars, letters/numbers/_/-';
    if (!form.acceptTerms) e.acceptTerms = 'Please accept the terms';
    return e;
  }

  async function onSubmit(evn) {
    evn.preventDefault();
    setServerError('');
    setSuccess('');
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setLoading(true);
    try {
      const res = await apiPost('/api/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        psnId: form.psnId.trim(),
        acceptTerms: form.acceptTerms
      });
      setSuccess(res.message || 'Account created. Please log in.');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setServerError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div className="signup-wrapper">
      <div className="signup-card card-hover">
        <h1 className="signup-title text-gradient">Create account</h1>
        <p className="signup-subtitle">Join tournaments, register your PSN ID, and compete.</p>

        {success && <div className="alert">{success}</div>}
        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form className="form-grid" onSubmit={onSubmit}>
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={e => update('name', e.target.value)} />
            {errors.name && <div className="error">{errors.name}</div>}
          </div>

          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => update('email', e.target.value)} />
            {errors.email && <div className="error">{errors.email}</div>}
          </div>

          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={e => update('password', e.target.value)} />
            {errors.password && <div className="error">{errors.password}</div>}
          </div>

          <div>
            <label className="label">Confirm password</label>
            <input className="input" type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
            {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
          </div>

          <div>
            <label className="label">PSN ID</label>
            <input className="input" value={form.psnId} onChange={e => update('psnId', e.target.value)} />
            {errors.psnId && <div className="error">{errors.psnId}</div>}
          </div>

          <div className="checkbox-row">
            <input
              id="terms"
              type="checkbox"
              checked={form.acceptTerms}
              onChange={e => update('acceptTerms', e.target.checked)}
            />
            <label htmlFor="terms">I accept the Terms and Rules</label>
          </div>
          {errors.acceptTerms && <div className="error">{errors.acceptTerms}</div>}

          <button className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}