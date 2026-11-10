import React, { useState } from 'react';
import {
  IconKey,
  IconCpu,
  IconSparkles,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconRefresh
} from './Icons';

const PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq',
    prefix: 'gsk_',
    badge: 'Free · Recommended',
    badgeColor: 'var(--green)',
    badgeBg: 'var(--green-tint)',
    badgeBorder: 'var(--green-border)',
    link: 'https://console.groq.com/keys',
    model: 'Llama 3.3 70B & Multi-Model Pool',
    Icon: IconSparkles,
    desc: 'Free API, ultra-fast. Auto-switches between 70B, 8B, Gemma 2, and Mixtral if rate limits occur.',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    prefix: 'AIza',
    badge: 'Free Tier',
    badgeColor: 'var(--blue)',
    badgeBg: 'var(--blue-tint)',
    badgeBorder: 'rgba(56,189,248,0.25)',
    link: 'https://aistudio.google.com/app/apikey',
    model: 'Gemini 1.5 Flash & Flash-8B',
    Icon: IconCpu,
    desc: 'Google AI Studio. Auto-switches between Flash, Flash-8B, and 2.0-Flash if quota limits occur.',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    prefix: 'sk-',
    badge: 'Paid',
    badgeColor: 'var(--amber)',
    badgeBg: 'var(--amber-tint)',
    badgeBorder: 'var(--amber-border)',
    link: 'https://platform.openai.com/api-keys',
    model: 'GPT-4o Mini & GPT-3.5',
    Icon: IconKey,
    desc: 'Paid credits. Auto-switches between GPT-4o Mini and GPT-3.5 if rate limits occur.',
  },
];

export default function ApiKeyModal({ isOpen, onClose, currentKey, onSaveKey }) {
  const [keyInput, setKeyInput] = useState(currentKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [modelCheckResult, setModelCheckResult] = useState(null);

  if (!isOpen) return null;

  const detectedProvider = PROVIDERS.find((p) => keyInput.trim().startsWith(p.prefix));

  const handleSave = () => {
    onSaveKey(keyInput.trim());
    onClose();
  };

  const handleClear = () => {
    setKeyInput('');
    setModelCheckResult(null);
    onSaveKey('');
    onClose();
  };

  const handleCheckModels = async () => {
    const key = keyInput.trim();
    if (!key) {
      alert('Please enter an API key first to check available models.');
      return;
    }

    setIsChecking(true);
    setModelCheckResult(null);

    try {
      const res = await fetch('/api/check-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key })
      });
      if (res.ok) {
        const data = await res.json();
        setModelCheckResult(data);
      } else {
        setModelCheckResult({
          valid: false,
          message: `Server returned HTTP ${res.status}. Could not verify key.`
        });
      }
    } catch (e) {
      setModelCheckResult({
        valid: false,
        message: `Network error verifying key: ${e.message}`
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640, width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-sm)',
              background: 'var(--blue-tint)', border: '1px solid rgba(37, 99, 235, 0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--blue)'
            }}>
              <IconKey width={16} height={16} />
            </div>
            <div>
              <div className="modal-title">AI Model &amp; Auto-Switch Configuration</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Multi-model usage checking with automatic rate limit &amp; quota failover
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconX width={14} height={14} />
          </button>
        </div>

        {/* Security Notice */}
        <div className="tip-box info" style={{ marginBottom: 16, fontSize: '0.8rem', lineHeight: 1.5 }}>
          <strong>Auto-Switch Protection:</strong> Keys are stored only in your local browser storage. If a model reaches rate limits (TPM/RPM) or has no remaining usage, the system <strong>automatically checks and switches</strong> to the next available model without interrupting your evaluation.
        </div>

        {/* Supported Providers List */}
        <div style={{ marginBottom: 16 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Supported Auto-Switch Providers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {PROVIDERS.map((p) => {
              const ProvIcon = p.Icon;
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                    fontSize: '0.83rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ color: p.badgeColor, display: 'inline-flex', alignItems: 'center' }}>
                      <ProvIcon width={14} height={14} />
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.84rem' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.desc}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px',
                      borderRadius: 'var(--radius-pill)', color: p.badgeColor,
                      background: p.badgeBg, border: `1px solid ${p.badgeBorder}`,
                    }}>
                      {p.badge}
                    </span>
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--blue)', textDecoration: 'underline' }}
                    >
                      Get key →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Input */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Enter API Key (Supports Single or Multi-Key Fallback)
            </label>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Comma-separated keys supported
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              className="api-input"
              placeholder="gsk_... (Groq) or AIza... (Gemini) or sk-... (OpenAI)"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setModelCheckResult(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2px 6px',
                borderRadius: 'var(--radius-xs)', transition: 'color 0.15s',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {showKey ? <IconEyeOff width={14} height={14} /> : <IconEye width={14} height={14} />}
            </button>
          </div>

          {/* Key Check Action Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div>
              {detectedProvider && (
                <span style={{ color: detectedProvider.badgeColor, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <IconCheck width={12} height={12} />
                  Detected: <strong>{detectedProvider.name}</strong> key
                </span>
              )}
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleCheckModels}
              disabled={isChecking || !keyInput.trim()}
              style={{ fontSize: '0.78rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <IconRefresh width={13} height={13} style={{ animation: isChecking ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isChecking ? 'Checking Models...' : 'Check Available Models & Usage'}</span>
            </button>
          </div>
        </div>

        {/* Model Check Results Banner */}
        {modelCheckResult && (
          <div style={{
            background: modelCheckResult.valid ? 'var(--green-tint)' : 'var(--red-tint)',
            border: `1px solid ${modelCheckResult.valid ? 'var(--green-border)' : 'var(--red-border)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            marginBottom: 18,
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: modelCheckResult.valid ? '#166534' : 'var(--accent-red)', marginBottom: 6 }}>
              {modelCheckResult.valid ? <IconCheck width={14} height={14} /> : <IconAlertTriangle width={14} height={14} />}
              <span>{modelCheckResult.message}</span>
            </div>

            {modelCheckResult.models && modelCheckResult.models.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#14532d', marginBottom: 4 }}>
                  Models Registered for Auto-Switching ({modelCheckResult.models.length} Available):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
                  {modelCheckResult.models.map((m, idx) => (
                    <div 
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid rgba(22, 101, 52, 0.2)',
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: '0.74rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 6
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.id}
                      </span>
                      <span style={{ color: '#166534', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>
                        {m.status || 'Ready'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
          {currentKey ? (
            <button
              type="button"
              className="btn-ghost"
              style={{ color: 'var(--red)', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              onClick={handleClear}
            >
              <IconTrash width={13} height={13} />
              Clear Key
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleSave}>Save Key &amp; Enable Auto-Switch</button>
          </div>
        </div>
      </div>
    </div>
  );
}
