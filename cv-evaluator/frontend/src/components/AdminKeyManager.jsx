/**
 * ==============================================================================
 * AdminKeyManager.jsx - Multi-API Key Pool & Dynamic OAuth Configuration Panel
 * ==============================================================================
 * 
 * This component provides an administrative UI to:
 * 1. Register multiple API keys (Groq, Gemini, OpenAI) for automatic key rotation.
 * 2. Configure Google OAuth 2.0 (Client ID & Client Secret) dynamically.
 * 3. Enforce security re-authentication:
 *    - For Password Accounts: Requires re-entering current admin password.
 *    - For Google OAuth Accounts: Automatically validates active Google session.
 * 4. Display exact counts of stored and active keys in the database pool.
 * 5. Keep sensitive keys masked in the UI at all times (e.g., 'gsk_************3aB9').
 * ==============================================================================
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  IconKey,
  IconCpu,
  IconSparkles,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconAlertTriangle,
  IconRefresh
} from './Icons';

export default function AdminKeyManager() {
  // ---------------------------------------------------------------------------
  // 1. Authentication & Token Resolution
  // ---------------------------------------------------------------------------
  const { token, user } = useAuth();
  
  // Safely resolve the active authorization token from context or localStorage
  const activeToken = useMemo(() => {
    return token || 
      (typeof localStorage !== 'undefined' ? (localStorage.getItem('cv_eval_token') || localStorage.getItem('token') || '') : '');
  }, [token]);

  // Headers for authenticated backend requests
  const authHeaders = useMemo(() => {
    return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
  }, [activeToken]);

  // Helper to append the token query parameter for proxies that drop Authorization headers
  const withTokenQuery = (url) => {
    if (!activeToken) return url;
    const delimiter = url.includes('?') ? '&' : '?';
    return `${url}${delimiter}token=${encodeURIComponent(activeToken)}`;
  };

  // Check if current administrator authenticated via Google Sign-In
  const isGoogleUser = user?.provider === 'google';

  // ---------------------------------------------------------------------------
  // 2. Component State: API Key Pool
  // ---------------------------------------------------------------------------
  const [keysList, setKeysList] = useState([]);
  const [keyStats, setKeyStats] = useState({
    total: 0,
    active: 0,
    envFallbackConfigured: false,
    envFallbackMasked: null,
  });
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [keyError, setKeyError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State: Adding a new key to the pool
  const [provider, setProvider] = useState('groq');
  const [label, setLabel] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isSubmittingKey, setIsSubmittingKey] = useState(false);

  // ---------------------------------------------------------------------------
  // 3. Component State: Google OAuth Configuration
  // ---------------------------------------------------------------------------
  const [oauthConfig, setOAuthConfig] = useState({
    client_id: '',
    masked_secret: '',
    has_secret: false,
    user_requires_password: !isGoogleUser,
  });
  const [oauthClientIdInput, setOauthClientIdInput] = useState('');
  const [oauthClientSecretInput, setOauthClientSecretInput] = useState('');
  const [showOauthSecret, setShowOauthSecret] = useState(false);
  const [oauthPasswordInput, setOauthPasswordInput] = useState('');
  const [isSavingOauth, setIsSavingOauth] = useState(false);
  const [oauthSuccess, setOauthSuccess] = useState(null);
  const [oauthError, setOauthError] = useState(null);

  // ---------------------------------------------------------------------------
  // 4. Data Fetching
  // ---------------------------------------------------------------------------
  // Fetch active system API keys from the server
  const fetchKeys = async () => {
    setLoadingKeys(true);
    setKeyError(null);
    try {
      const url = withTokenQuery('/api/admin/system-keys');
      const res = await fetch(url, { headers: authHeaders });
      
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access denied (403): Administrator privileges required to view or manage API keys.');
        }
        throw new Error(`Server returned HTTP ${res.status} while fetching API keys.`);
      }

      const data = await res.json();
      
      let list = [];
      let totalCount = 0;
      let activeCount = 0;
      let envConfigured = false;
      let envMasked = null;

      if (Array.isArray(data)) {
        list = data;
        totalCount = data.length;
        activeCount = data.filter((k) => k.is_active).length;
      } else if (data && typeof data === 'object') {
        list = Array.isArray(data.keys) ? data.keys : [];
        totalCount = typeof data.total_keys === 'number' ? data.total_keys : list.length;
        activeCount = typeof data.active_keys === 'number' ? data.active_keys : list.filter((k) => k.is_active).length;
        envConfigured = Boolean(data.env_fallback_configured);
        envMasked = data.env_fallback_masked || null;
      }

      setKeysList(list);
      setKeyStats({
        total: totalCount,
        active: activeCount,
        envFallbackConfigured: envConfigured,
        envFallbackMasked: envMasked,
      });
    } catch (e) {
      setKeyError(e.message || 'Could not fetch system API keys.');
    } finally {
      setLoadingKeys(false);
    }
  };

  // Fetch current Google OAuth settings
  const fetchOAuthConfig = async () => {
    try {
      const url = withTokenQuery('/api/admin/oauth-config');
      const res = await fetch(url, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setOAuthConfig(data);
        setOauthClientIdInput(data.client_id || '');
      }
    } catch (e) {
      console.warn('Could not load OAuth config:', e);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchOAuthConfig();
  }, [activeToken]);

  // ---------------------------------------------------------------------------
  // 5. Actions: Add New API Key
  // ---------------------------------------------------------------------------
  const handleAddKey = async (e) => {
    e.preventDefault();
    setKeyError(null);
    setSuccessMsg(null);

    if (!apiKeyInput.trim()) {
      setKeyError('Please provide an API key.');
      return;
    }

    // Security Check: If administrator created account via password, require confirmation
    const requiresPassword = oauthConfig.user_requires_password && !isGoogleUser;
    if (requiresPassword && !adminPasswordInput) {
      setKeyError('Please enter your administrator password to authorize adding a system key.');
      return;
    }

    setIsSubmittingKey(true);
    try {
      const url = withTokenQuery('/api/admin/system-keys/add');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          label: label.trim() || `${provider.toUpperCase()} Key`,
          api_key: apiKeyInput.trim(),
          confirm_password: adminPasswordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save API key.');
      }

      setSuccessMsg(`Successfully added ${provider.toUpperCase()} key to the pool.`);
      setApiKeyInput('');
      setLabel('');
      setAdminPasswordInput('');
      fetchKeys();
    } catch (err) {
      setKeyError(err.message);
    } finally {
      setIsSubmittingKey(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 6. Actions: Delete API Key
  // ---------------------------------------------------------------------------
  const handleDeleteKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key from the system pool?')) return;
    setKeyError(null);
    setSuccessMsg(null);

    let password = '';
    const requiresPassword = oauthConfig.user_requires_password && !isGoogleUser;
    if (requiresPassword) {
      password = window.prompt('Security Verification: Please confirm your Administrator password to delete this key:');
      if (!password) return;
    }

    try {
      const url = withTokenQuery(`/api/admin/system-keys/${keyId}`);
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm_password: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete key.');
      setSuccessMsg('Key deleted successfully.');
      fetchKeys();
    } catch (e) {
      setKeyError(e.message);
    }
  };

  // ---------------------------------------------------------------------------
  // 7. Actions: Toggle Key Active/Inactive
  // ---------------------------------------------------------------------------
  const handleToggleActive = async (keyId) => {
    try {
      const url = withTokenQuery(`/api/admin/system-keys/${keyId}/toggle`);
      const res = await fetch(url, {
        method: 'POST',
        headers: authHeaders,
      });
      if (res.ok) {
        fetchKeys();
      } else {
        const data = await res.json();
        setKeyError(data.error || 'Could not toggle key state.');
      }
    } catch (e) {
      console.warn('Could not toggle key:', e);
    }
  };

  // ---------------------------------------------------------------------------
  // 8. Actions: Save Google OAuth Config
  // ---------------------------------------------------------------------------
  const handleSaveOauth = async (e) => {
    e.preventDefault();
    setOauthError(null);
    setOauthSuccess(null);

    // Security Check: Re-authentication check for password accounts
    const requiresPassword = oauthConfig.user_requires_password && !isGoogleUser;
    if (requiresPassword && !oauthPasswordInput) {
      setOauthError('Please enter your administrator password to confirm OAuth configuration updates.');
      return;
    }

    setIsSavingOauth(true);
    try {
      const url = withTokenQuery('/api/admin/oauth-config');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: oauthClientIdInput.trim(),
          client_secret: oauthClientSecretInput.trim(),
          confirm_password: oauthPasswordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save OAuth settings.');

      setOauthSuccess('Google OAuth configuration updated successfully.');
      setOauthClientSecretInput('');
      setOauthPasswordInput('');
      fetchOAuthConfig();
    } catch (err) {
      setOauthError(err.message);
    } finally {
      setIsSavingOauth(false);
    }
  };

  // Determine whether this session requires typing an administrator password
  const requiresPassword = oauthConfig.user_requires_password && !isGoogleUser;

  // Breakdown by provider for summary badges
  const groqCount = keysList.filter((k) => k.provider === 'groq').length;
  const geminiCount = keysList.filter((k) => k.provider === 'gemini').length;
  const openaiCount = keysList.filter((k) => k.provider === 'openai').length;

  // ---------------------------------------------------------------------------
  // 9. Component Render
  // ---------------------------------------------------------------------------
  return (
    <div style={{ marginTop: 24 }}>
      {/* --- SYSTEM API KEY POOL (GROQ, GEMINI, OPENAI) --- */}
      <div className="card" style={{ borderTop: '3px solid var(--accent)' }}>
        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>System Multi-API Key Pool (Groq / Gemini / OpenAI)</span>
            <span
              className="tag tag-blue"
              style={{ fontSize: '0.8rem', padding: '4px 10px', fontWeight: 700, letterSpacing: '0.02em' }}
            >
              {keyStats.total} {keyStats.total === 1 ? 'Key' : 'Keys'} Stored ({keyStats.active} Active)
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={fetchKeys}
          >
            <IconRefresh width={14} height={14} /> Refresh Keys
          </button>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
          Register multiple API keys for <strong>Groq (free tier)</strong> or other providers. The evaluator automatically rotates between active keys if rate limits or quota errors occur. Keys are stored encrypted and masked in the UI.
        </p>

        {/* --- KEY POOL STATUS STRIP --- */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 16,
            background: 'var(--surface-sunken)',
            padding: 12,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Pool Keys Count
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
              {keyStats.total} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>({keyStats.active} Active)</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Rotation Engine
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: keyStats.active > 1 ? 'var(--green)' : keyStats.active === 1 ? 'var(--blue)' : 'var(--amber)', marginTop: 4 }}>
              {keyStats.active > 1
                ? 'Automatic Failover Active'
                : keyStats.active === 1
                ? 'Single Active Key'
                : keyStats.envFallbackConfigured
                ? 'Backend .env Fallback'
                : 'No Keys Configured'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Provider Breakdown
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <span className="tag tag-green" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>Groq: {groqCount}</span>
              <span className="tag tag-purple" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>Gemini: {geminiCount}</span>
              <span className="tag tag-neutral" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>OpenAI: {openaiCount}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Server .env Key
            </div>
            <div style={{ fontSize: '0.84rem', marginTop: 4, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {keyStats.envFallbackMasked ? keyStats.envFallbackMasked : 'None configured'}
            </div>
          </div>
        </div>

        {keyError && (
          <div className="alert alert-danger" style={{ marginBottom: 14, padding: '8px 12px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconAlertTriangle width={16} height={16} /> {keyError}
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: 14, padding: '8px 12px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconCheck width={16} height={16} /> {successMsg}
          </div>
        )}

        {/* Existing Keys Table */}
        {loadingKeys ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Loading API keys...</div>
        ) : keysList.length === 0 ? (
          <div style={{ padding: '16px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No system API keys registered in database pool. Evaluator will use server .env fallback if available, or add your first key below.
          </div>
        ) : (
          <div className="dash-table-container" style={{ marginBottom: 20 }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Label</th>
                  <th>Masked Key</th>
                  <th>Status</th>
                  <th>Failure Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {keysList.map((k) => (
                  <tr key={k.id} className="dash-table-row">
                    <td>
                      <span className={`tag ${k.provider === 'groq' ? 'tag-green' : k.provider === 'gemini' ? 'tag-purple' : 'tag-neutral'}`} style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                        {k.provider}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{k.label}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', letterSpacing: '0.05em' }}>
                      {k.masked_key}
                    </td>
                    <td>
                      <span className={`tag ${k.is_active ? 'tag-green' : 'tag-neutral'}`}>
                        {k.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: (k.failure_count || 0) > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                      {k.failure_count || 0} fails
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ fontSize: '0.76rem', padding: '3px 8px' }}
                          onClick={() => handleToggleActive(k.id)}
                        >
                          {k.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ fontSize: '0.76rem', padding: '3px 8px', color: 'var(--red)' }}
                          onClick={() => handleDeleteKey(k.id)}
                        >
                          <IconTrash width={14} height={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Key Form */}
        <form onSubmit={handleAddKey} style={{ background: 'var(--surface-sunken)', padding: 16, borderRadius: 'var(--radius-md)', marginTop: 12 }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: 12 }}>
            Add API Key to Pool
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>Provider</label>
              <select
                className="input-select"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="groq">Groq (Llama 3.3 / Free Tier - gsk_...)</option>
                <option value="gemini">Google Gemini (AIza...)</option>
                <option value="openai">OpenAI (sk-...)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>Key Label / Account Name</label>
              <input
                type="text"
                className="input-text"
                placeholder="e.g. Primary Groq Key"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>API Secret Key</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKeyInput ? 'text' : 'password'}
                className="input-text"
                placeholder={provider === 'groq' ? 'gsk_...' : provider === 'gemini' ? 'AIza...' : 'sk-...'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{ width: '100%', paddingRight: 40, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showKeyInput ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
              </button>
            </div>
          </div>

          {/* Re-authentication check for password accounts */}
          {requiresPassword ? (
            <div style={{ background: 'var(--amber-tint)', border: '1px solid var(--amber-border)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.82rem', fontWeight: 600, color: 'var(--amber-dark, #b45309)' }}>
                <span>Security Verification Required</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                You logged in with a password account (<strong>@{user?.username}</strong>). Please enter your administrator password to authorize adding this key:
              </p>
              <input
                type="password"
                className="input-text"
                placeholder="Current administrator password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                style={{ maxWidth: 320 }}
                autoComplete="current-password"
              />
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Authenticated via active Google OAuth session. Administrator password confirmation is waived.
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmittingKey || !apiKeyInput.trim()}
            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
          >
            {isSubmittingKey ? 'Encrypting & Saving...' : 'Save Key to System Pool'}
          </button>
        </form>
      </div>

      {/* --- GOOGLE OAUTH CONFIGURATION --- */}
      <div className="card" style={{ marginTop: 24, borderTop: '3px solid var(--purple)' }}>
        <div className="card-title">
          <span>Google OAuth 2.0 Dynamic Settings</span>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
          Configure Google Sign-In credentials dynamically without modifying environment files. Stored securely with authenticated encryption.
        </p>

        {oauthError && (
          <div className="alert alert-danger" style={{ marginBottom: 14, padding: '8px 12px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconAlertTriangle width={16} height={16} /> {oauthError}
          </div>
        )}
        {oauthSuccess && (
          <div className="alert alert-success" style={{ marginBottom: 14, padding: '8px 12px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconCheck width={16} height={16} /> {oauthSuccess}
          </div>
        )}

        <form onSubmit={handleSaveOauth} style={{ background: 'var(--surface-sunken)', padding: 16, borderRadius: 'var(--radius-md)' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>Google OAuth Client ID</label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
              value={oauthClientIdInput}
              onChange={(e) => setOauthClientIdInput(e.target.value)}
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>
              Google OAuth Client Secret {oauthConfig.has_secret && <span style={{ color: 'var(--green)', fontWeight: 400 }}>(Currently configured: {oauthConfig.masked_secret})</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showOauthSecret ? 'text' : 'password'}
                className="input-text"
                placeholder={oauthConfig.has_secret ? 'Enter new secret to replace existing' : 'GOCSPX-...'}
                value={oauthClientSecretInput}
                onChange={(e) => setOauthClientSecretInput(e.target.value)}
                style={{ width: '100%', paddingRight: 40, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowOauthSecret(!showOauthSecret)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showOauthSecret ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
              </button>
            </div>
          </div>

          {requiresPassword ? (
            <div style={{ background: 'var(--amber-tint)', border: '1px solid var(--amber-border)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.82rem', fontWeight: 600, color: 'var(--amber-dark, #b45309)' }}>
                <span>Security Verification Required</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Please enter your administrator password to authorize updating Google OAuth configuration:
              </p>
              <input
                type="password"
                className="input-text"
                placeholder="Current administrator password"
                value={oauthPasswordInput}
                onChange={(e) => setOauthPasswordInput(e.target.value)}
                style={{ maxWidth: 320 }}
                autoComplete="current-password"
              />
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Authenticated via active Google OAuth session. Administrator password confirmation is waived.
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSavingOauth || (!oauthClientIdInput && !oauthClientSecretInput)}
            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
          >
            {isSavingOauth ? 'Saving OAuth Config...' : 'Update Google OAuth Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
