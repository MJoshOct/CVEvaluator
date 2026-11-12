import React, { useState, useEffect } from 'react';
import { useAuth, checkIsAdminIdentity } from '../context/AuthContext';
import {
  IconLock,
  IconUser,
  IconEye,
  IconEyeOff,
  IconGoogle,
  IconShield,
  IconCheck,
  IconX,
  IconCrown,
  IconSparkles,
  IconClock,
} from './Icons';
import { calculatePasswordStrength } from '../utils/crypto';

const GOOGLE_CLIENT_ID =
  import.meta.env?.VITE_GOOGLE_CLIENT_ID ||
  '579740202902-bi2bhgpfpcej1vad61v5p5cvsnnf9pun.apps.googleusercontent.com';

export default function AuthGate({ children }) {
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    authError,
    needsUsername,
    updateUsername,
    setAuthError,
    login,
    register,
    loginWithGoogle,
  } = useAuth();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [submitting, setSubmitting] = useState(false);

  // Form states - initialize clean and empty
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Clear all form inputs on mount to guarantee fresh, editable fields
  useEffect(() => {
    setUsernameOrEmail('');
    setPassword('');
    setRegUsername('');
    setRegEmail('');
    setRegDisplayName('');
    setRegPassword('');
    if (typeof window !== 'undefined' && window.location.search.includes('reset=')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Register extra states
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('user'); // Default user
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Google OAuth Modal state
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [mockGoogleRole, setMockGoogleRole] = useState('user');
  const [mockGoogleEmail, setMockGoogleEmail] = useState('');

  // New Google Account Username Prompt State
  const [customUsername, setCustomUsername] = useState('');
  const [usernameError, setUsernameError] = useState(null);
  const [updatingUsername, setUpdatingUsername] = useState(false);

  // Prefill suggested handle when a new Google user needs to choose a username
  useEffect(() => {
    if (needsUsername && user) {
      const suggested = user.username || (user.email ? user.email.split('@')[0] : 'user');
      setCustomUsername(suggested);
    }
  }, [needsUsername, user]);

  // Handle credential response from Google Identity Services
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    setSubmitting(true);
    setAuthError(null);
    try {
      const result = await loginWithGoogle({
        id_token: response.credential,
        credential: response.credential,
        role: 'user',
      });
      if (!result.success && result.error) {
        setAuthError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Initialize Google Identity Services on mount (Hook called unconditionally)
  useEffect(() => {
    const initGoogleGSI = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (e) {
          console.warn('Google GSI initialization notice:', e);
        }
      }
    };

    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      initGoogleGSI();
    } else {
      const timer = setInterval(() => {
        if (typeof window !== 'undefined' && window.google?.accounts?.id) {
          clearInterval(timer);
          initGoogleGSI();
        }
      }, 400);
      return () => clearInterval(timer);
    }
  }, []);

  // Conditional early returns placed safely AFTER all hooks
  if (isAuthLoading) {
    return (
      <div className="auth-gate-loading-screen">
        <div className="auth-spinner-box">
          <IconClock width={36} height={36} style={{ color: 'var(--blue)', animation: 'pulse 1.5s infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  // ─── NEW GOOGLE ACCOUNT USERNAME SETUP STEP ────────────────────────
  if (isAuthenticated && user && needsUsername) {
    const handleConfirmUsername = async (e) => {
      e.preventDefault();
      setUsernameError(null);
      setUpdatingUsername(true);

      const res = await updateUsername(customUsername);
      setUpdatingUsername(false);
      if (!res.success) {
        setUsernameError(res.error || 'Could not save username.');
      }
    };

    const isUserAdmin = checkIsAdminIdentity(user.email, user.username) || user.role === 'admin';

    return (
      <div className="auth-page-wrapper">
        <div className="auth-card-container" style={{ maxWidth: 460 }}>
          <div className="auth-brand-header">
            <div className="auth-brand-badge">CV</div>
            <div>
              <h1 className="auth-brand-title">Welcome to CV Evaluator</h1>
              <p className="auth-brand-subtitle">Set up your profile handle to continue</p>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconGoogle width={18} height={18} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user?.email || 'Connected Account'}
              </span>
            </div>
            <span className={`user-role-badge ${isUserAdmin ? 'admin-badge' : 'user-badge'}`} style={{ display: 'inline-flex' }}>
              {isUserAdmin ? '👑 Administrator' : '👤 Candidate User'}
            </span>
          </div>

          <form onSubmit={handleConfirmUsername} className="auth-form" autoComplete="off">
            <div className="auth-field-group">
              <label className="auth-label">Choose Your Desired Username</label>
              <div className="auth-input-wrapper">
                <IconUser width={16} height={16} className="auth-input-icon" />
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="off"
                  placeholder="e.g. johndoe, dev_user, or alex"
                  className="auth-input"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                />
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                This handle identifies your resume evaluations and reports.
              </span>
            </div>

            {usernameError && (
              <div className="auth-error-banner" style={{ marginTop: 8 }}>
                <IconX width={14} height={14} style={{ marginRight: 6 }} />
                <span>{usernameError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={updatingUsername}
              className="auth-submit-btn"
              style={{ marginTop: 12 }}
            >
              {updatingUsername ? (
                <>
                  <IconClock width={16} height={16} style={{ marginRight: 8, animation: 'spin 1s infinite' }} />
                  Saving Handle...
                </>
              ) : (
                'Save Username & Enter Dashboard →'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // If already authenticated and username set, render application
  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);

    const result = await login({
      username: usernameOrEmail,
      password,
    });

    setSubmitting(false);
    if (!result.success && result.error) {
      setAuthError(result.error);
    }
  };

  // Handle Registration submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);

    const result = await register({
      username: regUsername,
      email: regEmail,
      password: regPassword,
      role: regRole,
      displayName: regDisplayName,
    });

    setSubmitting(false);
    if (!result.success && result.error) {
      setAuthError(result.error);
    }
  };

  // Quick fill demo credentials
  const fillDemo = (type) => {
    setAuthError(null);
    if (type === 'admin') {
      setUsernameOrEmail('admin');
      setPassword('Admin@123');
    } else {
      setUsernameOrEmail('user');
      setPassword('User@123');
    }
  };

  // Google OAuth button click - triggers "Choose an account" window
  const handleGoogleBtnClick = () => {
    // 1. Google Identity Services OAuth 2.0 Token Client (explicitly opens "Choose an account" popup)
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2 && GOOGLE_CLIENT_ID) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              setSubmitting(true);
              setAuthError(null);
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (res.ok) {
                  const profile = await res.json();
                  await loginWithGoogle({
                    email: profile.email,
                    name: profile.name || profile.given_name || profile.email.split('@')[0],
                    avatarUrl: profile.picture,
                    google_id: profile.sub,
                    id_token: tokenResponse.access_token,
                    access_token: tokenResponse.access_token,
                    role: 'user',
                  });
                  return;
                }
              } catch (e) {
                console.warn('Error fetching Google profile with token:', e);
              } finally {
                setSubmitting(false);
              }
            }
          },
          error_callback: (err) => {
            console.warn('Google TokenClient notice:', err);
            setIsGoogleModalOpen(true);
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Google OAuth2 popup init notice:', err);
      }
    }

    // 2. Direct browser popup to Google's "Choose an account" endpoint
    if (typeof window !== 'undefined' && GOOGLE_CLIENT_ID) {
      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const redirectUri = window.location.origin;
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=email%20profile%20openid&prompt=select_account&nonce=${Date.now()}`;

      const popup = window.open(
        googleAuthUrl,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setIsGoogleModalOpen(true);
      }
      return;
    }

    setIsGoogleModalOpen(true);
  };

  const handleExecuteGoogleDemo = async () => {
    setSubmitting(true);
    await loginWithGoogle({
      id_token: `mock-google-${Date.now()}`,
      email: mockGoogleEmail,
      name: mockGoogleEmail.split('@')[0].replace('.', ' '),
      role: mockGoogleRole,
      avatarUrl: null,
    });
    setSubmitting(false);
    setIsGoogleModalOpen(false);
  };

  const passwordStrength = calculatePasswordStrength(regPassword);

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container">
        {/* Top Brand & Header */}
        <div className="auth-brand-header">
          <div className="auth-brand-badge">CV</div>
          <div>
            <h1 className="auth-brand-title">CV Evaluator</h1>
            <p className="auth-brand-subtitle">
              Secure Resume Verification &amp; Career Intelligence
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs (Sign In / Register) */}
        <div className="auth-tab-row">
          <button
            type="button"
            className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('login');
              setAuthError(null);
            }}
          >
            <IconUser width={15} height={15} style={{ marginRight: 6 }} />
            Single Sign-On (SSO)
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('register');
              setAuthError(null);
            }}
          >
            <IconSparkles width={15} height={15} style={{ marginRight: 6 }} />
            Create Account
          </button>
        </div>

        {/* Error Banner */}
        {authError && (
          <div className="auth-error-banner">
            <IconX width={16} height={16} style={{ color: 'var(--red)', marginRight: 8, flexShrink: 0 }} />
            <span>{authError}</span>
          </div>
        )}

        {/* ─── 1. LOGIN FORM ────────────────────────────────────────────── */}
        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="auth-form" autoComplete="off">
            {/* Decoy hidden inputs prevent Chrome's aggressive autofill from populating real fields */}
            <input type="text" name="decoy_user_prevent_autofill" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
            <input type="password" name="decoy_pass_prevent_autofill" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

            <div className="auth-field-group">
              <label className="auth-label">Username or Email</label>
              <div className="auth-input-wrapper">
                <IconUser width={16} height={16} className="auth-input-icon" />
                <input
                  type="text"
                  required
                  autoFocus
                  name="cveval_auth_identity"
                  autoComplete="off"
                  data-lpignore="true"
                  placeholder="e.g. admin, user, or your email"
                  className="auth-input"
                  style={{ paddingRight: usernameOrEmail ? 36 : 14 }}
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                />
                {usernameOrEmail && (
                  <button
                    type="button"
                    className="auth-clear-btn"
                    onClick={() => setUsernameOrEmail('')}
                    title="Clear username/email"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            <div className="auth-field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="auth-label">Password</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--blue)', fontWeight: 500 }}>
                  Encrypted
                </span>
              </div>
              <div className="auth-input-wrapper">
                <IconLock width={16} height={16} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  name="cveval_auth_secret"
                  autoComplete="new-password"
                  data-lpignore="true"
                  placeholder="Enter your password"
                  className="auth-input"
                  style={{ paddingRight: password ? 64 : 38 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {password && (
                  <button
                    type="button"
                    className="auth-clear-btn has-eye"
                    onClick={() => setPassword('')}
                    title="Clear password"
                  >
                    &times;
                  </button>
                )}
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="submit"
                disabled={submitting}
                className="auth-submit-btn"
                style={{ flex: 1, margin: 0 }}
              >
                {submitting ? (
                  <>
                    <IconClock width={16} height={16} style={{ marginRight: 8, animation: 'spin 1s infinite' }} />
                    Verifying Credentials...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
              {(usernameOrEmail || password) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0 14px', fontSize: '0.85rem' }}
                  onClick={() => {
                    setUsernameOrEmail('');
                    setPassword('');
                    setAuthError(null);
                  }}
                  title="Clear all fields so you can edit with fresh details"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Demo Credentials Switcher */}
            <div className="auth-demo-chips-container">
              <div className="auth-demo-chips-label">Quick Demo Access:</div>
              <div className="auth-demo-chips-row">
                <button
                  type="button"
                  className="auth-demo-chip admin"
                  onClick={() => fillDemo('admin')}
                  title="Load Admin account (admin / Admin@123)"
                >
                  <IconCrown width={13} height={13} style={{ marginRight: 4 }} />
                  <strong>Admin</strong>
                </button>
                <button
                  type="button"
                  className="auth-demo-chip admin"
                  onClick={() => fillDemo('user')}
                  title="Load User account (user / User@123)"
                >
                  <IconUser width={13} height={13} style={{ marginRight: 4 }} />
                  <strong>User (Admin)</strong>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="auth-divider">
              <span>or connect with</span>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleBtnClick}
            >
              <IconGoogle width={20} height={20} style={{ marginRight: 10 }} />
              <span>Sign in with Google</span>
            </button>
          </form>
        ) : (
          /* ─── 2. REGISTER FORM ────────────────────────────────────────── */
          <form onSubmit={handleRegisterSubmit} className="auth-form" autoComplete="off">
            <div className="auth-field-group">
              <label className="auth-label">Account Role</label>
              <div className="auth-role-select-grid">
                <div
                  className={`auth-role-option-card ${regRole === 'admin' ? 'selected' : ''}`}
                  onClick={() => setRegRole('admin')}
                >
                  <div className="auth-role-option-title">
                    <IconCrown width={15} height={15} style={{ marginRight: 6, color: 'var(--purple)' }} />
                    Administrator
                  </div>
                  <div className="auth-role-option-desc">
                    Full evaluation logs, system analytics dashboard &amp; candidate record management.
                  </div>
                </div>

                <div
                  className={`auth-role-option-card ${regRole === 'user' ? 'selected' : ''}`}
                  onClick={() => setRegRole('user')}
                >
                  <div className="auth-role-option-title">
                    <IconUser width={15} height={15} style={{ marginRight: 6 }} />
                    Candidate / User
                  </div>
                  <div className="auth-role-option-desc">
                    Evaluate CV, check ATS score, match job descriptions &amp; AI interview prep.
                  </div>
                </div>
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Username</label>
              <div className="auth-input-wrapper">
                <IconUser width={16} height={16} className="auth-input-icon" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="e.g. johndoe"
                  className="auth-input"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="e.g. candidate@example.com"
                  className="auth-input"
                  style={{ paddingLeft: 12 }}
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Full Name (Optional)</label>
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. Alex Morgan"
                  className="auth-input"
                  style={{ paddingLeft: 12 }}
                  value={regDisplayName}
                  onChange={(e) => setRegDisplayName(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <IconLock width={16} height={16} className="auth-input-icon" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  autoComplete="off"
                  placeholder="Choose a secure password"
                  className="auth-input"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                >
                  {showRegPassword ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
                </button>
              </div>

              {/* Password strength bar */}
              {regPassword && (
                <div className="auth-password-strength-container">
                  <div className="auth-password-strength-track">
                    <div
                      className="auth-password-strength-bar"
                      style={{
                        width: `${passwordStrength.percent}%`,
                        backgroundColor: passwordStrength.color,
                      }}
                    />
                  </div>
                  <div className="auth-password-strength-label" style={{ color: passwordStrength.color }}>
                    Strength: {passwordStrength.label}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="auth-submit-btn"
            >
              {submitting ? 'Creating Secure Account...' : `Register as ${regRole === 'admin' ? 'Admin' : 'User'}`}
            </button>
          </form>
        )}
      </div>

      {/* ─── GOOGLE OAUTH MODAL ───────────────────────────────────────────── */}
      {isGoogleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGoogleModalOpen(false)}>
          <div className="modal-content auth-google-modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <IconGoogle width={42} height={42} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: 10, marginBottom: 4 }}>
                Sign In with Google
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Google OAuth 2.0 Integration &bull; Project <code>resume-514314</code>
              </p>
            </div>

            {/* Error 401 Origin Guidance Banner */}
            <div className="auth-google-info-box" style={{ background: '#f8fafc', borderLeft: '4px solid var(--blue)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 4, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconShield width={14} height={14} style={{ color: 'var(--blue)' }} />
                <span>Google OAuth Origin Status:</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                If Google's popup showed <em>&ldquo;Error 401: invalid_client - no registered origin&rdquo;</em>,
                ensure <code>http://localhost:3000</code> is saved under <strong>Authorized JavaScript origins</strong> in
                Google Cloud Console. You can also sign in directly below with any of your Google accounts:
              </p>
            </div>

            {/* Account Quick Selectors */}
            <div style={{ marginTop: 14 }}>
              <label className="auth-label" style={{ marginBottom: 6 }}>Select or Enter Google Account:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  className={`auth-demo-chip ${mockGoogleRole === 'admin' ? 'active' : ''}`}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: mockGoogleRole === 'admin' ? '2px solid var(--blue)' : '1px solid var(--border)',
                    background: mockGoogleRole === 'admin' ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setMockGoogleEmail('admin@cvevaluator.local');
                    setMockGoogleRole('admin');
                  }}
                >
                  <IconCrown width={16} height={16} style={{ color: '#f59e0b', marginBottom: 4 }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Admin Access</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Administrator</span>
                </button>

                <button
                  type="button"
                  className={`auth-demo-chip ${mockGoogleEmail === 'candidate@cvevaluator.local' ? 'active' : ''}`}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: mockGoogleEmail === 'candidate@cvevaluator.local' ? '2px solid var(--blue)' : '1px solid var(--border)',
                    background: mockGoogleEmail === 'candidate@cvevaluator.local' ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setMockGoogleEmail('candidate@cvevaluator.local');
                    setMockGoogleRole('user');
                  }}
                >
                  <IconUser width={16} height={16} style={{ color: 'var(--blue)', marginBottom: 4 }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Candidate</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Standard User</span>
                </button>

                <button
                  type="button"
                  className={`auth-demo-chip ${mockGoogleEmail.includes('new_user') ? 'active' : ''}`}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: mockGoogleEmail.includes('new_user') ? '2px solid var(--blue)' : '1px solid var(--border)',
                    background: mockGoogleEmail.includes('new_user') ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setMockGoogleEmail(`user_${Date.now().toString().slice(-4)}@gmail.com`);
                    setMockGoogleRole('user');
                  }}
                >
                  <IconSparkles width={16} height={16} style={{ color: 'var(--purple)', marginBottom: 4 }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>New Account</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Choose Handle</span>
                </button>
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Google Account Email</label>
                <div className="auth-input-wrapper">
                  <IconGoogle width={16} height={16} className="auth-input-icon" />
                  <input
                    type="email"
                    required
                    className="auth-input"
                    value={mockGoogleEmail}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMockGoogleEmail(val);
                      if (checkIsAdminIdentity(val, '')) {
                        setMockGoogleRole('admin');
                      }
                    }}
                    placeholder="Enter any Google email address"
                  />
                </div>
              </div>

              <div className="auth-field-group" style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="auth-label">Assigned Role</label>
                  {checkIsAdminIdentity(mockGoogleEmail, '') && (
                    <span style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 600 }}>
                      👑 Administrator access enforced for this identity
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className={`mode-tab ${mockGoogleRole === 'admin' ? 'active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setMockGoogleRole('admin')}
                  >
                    <IconCrown width={14} height={14} style={{ marginRight: 6 }} />
                    Administrator
                  </button>
                  <button
                    type="button"
                    className={`mode-tab ${mockGoogleRole === 'user' ? 'active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setMockGoogleRole('user')}
                    disabled={checkIsAdminIdentity(mockGoogleEmail, '')}
                  >
                    <IconUser width={14} height={14} style={{ marginRight: 6 }} />
                    Candidate User
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsGoogleModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExecuteGoogleDemo}
                disabled={submitting || !mockGoogleEmail}
              >
                <IconGoogle width={16} height={16} style={{ marginRight: 8 }} />
                Sign In with this Google Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
