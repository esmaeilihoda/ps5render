import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../services/api';
import '../styles/SignUpPage.css';

const psnPattern = /^[A-Za-z][A-Za-z0-9_-]{2,15}$/;
const phonePattern = /^09\d{9}$/;

export default function SignUpPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: phone, 2: otp, 3: details
  const [form, setForm] = useState({
    phone: '',
    otpCode: '',
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
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  function validatePhone() {
    const e = {};
    const phone = form.phone.replace(/\D/g, '');
    if (!phonePattern.test(phone) && !(phone.length === 10 && phone.startsWith('9'))) {
      e.phone = 'Invalid phone number (e.g. 09123456789)';
    }
    return e;
  }

  function validateOtp() {
    const e = {};
    if (form.otpCode.length !== 6 || !/^\d{6}$/.test(form.otpCode)) {
      e.otpCode = 'Verification code must be 6 digits';
    }
    return e;
  }

  function validateDetails() {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Please enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email address';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      e.password = 'Min 8 chars with letters and numbers';
    }
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match';
    if (!psnPattern.test(form.psnId)) e.psnId = 'PSN ID must start with a letter, 3-16 chars';
    if (!form.acceptTerms) e.acceptTerms = 'Please accept the terms';
    return e;
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    setServerError('');
    const v = validatePhone();
    setErrors(v);
    if (Object.keys(v).length) return;

    setLoading(true);
    try {
      const res = await apiPost('/api/otp/send', { phone: form.phone });
      if (res.success) {
        setOtpSent(true);
        setStep(2);
        setCountdown(60);
        setSuccess('Verification code sent to your phone');
      } else {
        setServerError(res.message || 'Failed to send code');
      }
    } catch (err) {
      setServerError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setServerError('');
    const v = validateOtp();
    setErrors(v);
    if (Object.keys(v).length) return;

    setLoading(true);
    try {
      const res = await apiPost('/api/otp/verify', { 
        phone: form.phone, 
        code: form.otpCode 
      });
      if (res.success && res.verified) {
        setPhoneVerified(true);
        setStep(3);
        setSuccess('Phone number verified!');
      } else {
        setServerError(res.message || 'Invalid verification code');
      }
    } catch (err) {
      setServerError(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setServerError('');
    setSuccess('');
    const v = validateDetails();
    setErrors(v);
    if (Object.keys(v).length) return;

    if (!phoneVerified) {
      setServerError('Please verify your phone number first');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost('/api/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        password: form.password,
        psnId: form.psnId.trim(),
        acceptTerms: form.acceptTerms
      });
      setSuccess(res.message || 'Account created! Please log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      if (err.requiresPhoneVerification) {
        setPhoneVerified(false);
        setStep(1);
      }
      setServerError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (countdown > 0) return;
    setServerError('');
    setLoading(true);
    try {
      const res = await apiPost('/api/otp/send', { phone: form.phone });
      if (res.success) {
        setCountdown(60);
        setSuccess('New code sent!');
      } else {
        setServerError(res.message || 'Failed to resend code');
      }
    } catch (err) {
      setServerError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function goBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  return (
    <div className="signup-wrapper">
      <div className="signup-card card-hover">
        <h1 className="signup-title text-gradient">Create Account</h1>
        
        {/* Progress indicator */}
        <div className="signup-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Phone</span>
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Verify</span>
          </div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Details</span>
          </div>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {serverError && <div className="alert alert-error">{serverError}</div>}

        {/* Step 1: Phone Number */}
        {step === 1 && (
          <form className="form-grid" onSubmit={handleSendOtp}>
            <p className="signup-subtitle">Enter your phone number to get started</p>
            <div>
              <label className="label">Phone Number</label>
              <input 
                className="input" 
                type="tel"
                dir="ltr"
                placeholder="09123456789"
                value={form.phone} 
                onChange={e => update('phone', e.target.value)} 
              />
              {errors.phone && <div className="error">{errors.phone}</div>}
            </div>
            <button className="btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Get Verification Code'}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form className="form-grid" onSubmit={handleVerifyOtp}>
            <p className="signup-subtitle">
              Enter the verification code sent to {form.phone}
            </p>
            <div>
              <label className="label">Verification Code</label>
              <input 
                className="input otp-input" 
                type="text"
                dir="ltr"
                maxLength={6}
                placeholder="123456"
                value={form.otpCode} 
                onChange={e => update('otpCode', e.target.value.replace(/\D/g, ''))} 
                autoFocus
              />
              {errors.otpCode && <div className="error">{errors.otpCode}</div>}
            </div>
            
            <div className="otp-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={handleResendOtp}
                disabled={countdown > 0 || loading}
              >
                {countdown > 0 ? `Resend (${countdown}s)` : 'Resend Code'}
              </button>
            </div>

            <button type="button" className="btn-link" onClick={goBack}>
              ← Change phone number
            </button>
          </form>
        )}

        {/* Step 3: Registration Details */}
        {step === 3 && (
          <form className="form-grid" onSubmit={handleRegister}>
            <p className="signup-subtitle">
              ✓ Phone {form.phone} verified. Complete your profile.
            </p>

            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={e => update('name', e.target.value)} />
              {errors.name && <div className="error">{errors.name}</div>}
            </div>

            <div>
              <label className="label">Email</label>
              <input className="input" type="email" dir="ltr" value={form.email} onChange={e => update('email', e.target.value)} />
              {errors.email && <div className="error">{errors.email}</div>}
            </div>

            <div>
              <label className="label">Password</label>
              <input className="input" type="password" dir="ltr" value={form.password} onChange={e => update('password', e.target.value)} />
              {errors.password && <div className="error">{errors.password}</div>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input className="input" type="password" dir="ltr" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
              {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
            </div>

            <div>
              <label className="label">PSN ID</label>
              <input className="input" dir="ltr" value={form.psnId} onChange={e => update('psnId', e.target.value)} />
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <p className="signup-footer">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
}