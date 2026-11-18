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

const BUILD_GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID || '';

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
  const [googleClientId, setGoogleClientId] = useState(BUILD_GOOGLE_CLIENT_ID);

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

  // Prefer the active server-side OAuth client; use the build-time value if
  // the backend is temporarily unavailable (for example during local dev).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/oauth-config', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((config) => {
        if (cancelled) return;
        const runtimeClientId = config?.is_enabled ? config.google_client_id?.trim() : '';
        if (runtimeClientId) setGoogleClientId(runtimeClientId);
      })
      .catch((error) => {
        console.warn('Could not load the active Google OAuth client:', error);
      });
    return () => { cancelled = true; };
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
              {isUserAdmin ? 'Administrator' : 'Candidate User'}
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

  // Google OAuth button click - triggers "Choose an account" window
  const handleGoogleBtnClick = () => {
    setAuthError(null);
    if (!googleClientId) {
      setAuthError('Google sign-in is not configured. Set a Web application client ID in Admin → AI & OAuth.');
      return;
    }
    if (!window.google?.accounts?.oauth2) {
      setAuthError('Google Identity Services did not load. Check your network connection and reload this page.');
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'email profile openid',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          // If the user closed or dismissed the popup, do nothing
          if (
            tokenResponse?.error === 'popup_closed_by_user' ||
            tokenResponse?.error === 'access_denied' ||
            tokenResponse?.error === 'user_cancel'
          ) {
            return;
          }
          if (tokenResponse?.error) {
            setAuthError(`Google sign-in error: ${tokenResponse.error}`);
            return;
          }
          if (!tokenResponse?.access_token) {
            setAuthError('Google did not return an access token. Please try again.');
            return;
          }

          setSubmitting(true);
          setAuthError(null);
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            if (!res.ok) throw new Error('Google could not verify the selected account.');
            const profile = await res.json();
            const result = await loginWithGoogle({
              email: profile.email,
              name: profile.name || profile.given_name || profile.email.split('@')[0],
              avatarUrl: profile.picture,
              google_id: profile.sub,
              access_token: tokenResponse.access_token,
              role: 'user',
            });
            if (!result.success) setAuthError(result.error || 'Google sign-in could not be completed.');
          } catch (error) {
            setAuthError(error.message || 'Google sign-in could not be completed.');
          } finally {
            setSubmitting(false);
          }
        },
        error_callback: (error) => {
          // Suppress error on user-initiated cancellation (clicking 'X' or closing popup)
          const isCancelled =
            error?.type === 'popup_closed' ||
            error?.type === 'popup_closed_by_user' ||
            error?.error === 'popup_closed_by_user' ||
            error?.error === 'access_denied';
          if (!isCancelled) {
            console.warn('Google TokenClient error:', error);
            setAuthError(`Google rejected sign-in from ${window.location.origin}. Please ensure this origin is authorized in Google Cloud Console.`);
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (error) {
      console.warn('Google OAuth popup could not be opened:', error);
      setAuthError(error.message || 'Google sign-in could not be opened.');
    }
  };

  const passwordStrength = calculatePasswordStrength(regPassword);

  return (
    <div className="auth-page-wrapper">
      <section className="auth-welcome-panel" aria-label="CV Evaluator overview">
        <div className="auth-welcome-top">
          <div className="auth-brand-badge">CV</div>
          <span>CV EVALUATOR</span>
        </div>
        <div className="auth-welcome-copy">
          <span className="auth-welcome-kicker">YOUR NEXT MOVE STARTS HERE</span>
          <h1>Make your experience<br />stand out.</h1>
          <p>Turn your resume into a clear plan for your next opportunity with focused, practical feedback.</p>
        </div>
        <img className="auth-hero-image" src="/mockups/login-hero-career.svg" alt="Career profile and progress illustration" />
        <div className="auth-welcome-foot"><IconShield width={16} height={16} /><span>Your account and resume stay private.</span></div>
      </section>
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
            Sign in
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
            Create account
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
            <div className="auth-form-intro"><h2>Welcome back</h2><p>Sign in to continue to your workspace.</p></div>
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
                  placeholder="enter your email or username"
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
              <label className="auth-label">Password</label>
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
              {submitting ? 'Creating Secure Account...' : 'Register'}
            </button>
          </form>
        )}
      </div>

    </div>
  );
}