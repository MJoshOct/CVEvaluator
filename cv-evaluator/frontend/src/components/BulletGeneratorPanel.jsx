import React, { useState } from 'react';
import {
  IconSparkles,
  IconFile,
  IconX,
  IconCheck,
  IconAlertTriangle
} from './Icons';

const SAMPLE_BULLETS = [
  'Worked on backend APIs using Python and helped the team fix database bugs.',
  'Responsible for creating React dashboards and talking to customers about requirements.',
  'Did unit testing for code and assisted with deployment pipelines.'
];

export default function BulletGeneratorPanel({ apiKey, onApiKeyChange, roles = [] }) {
  const [selectedRole, setSelectedRole] = useState(roles[0]?.id || 'software_development');
  const [bullets, setBullets] = useState(['', '', '']);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddBullet = () => {
    if (bullets.length >= 10) return;
    setBullets([...bullets, '']);
  };

  const handleRemoveBullet = (index) => {
    if (bullets.length <= 1) {
      setBullets(['']);
      return;
    }
    setBullets(bullets.filter((_, i) => i !== index));
  };

  const handleBulletChange = (index, val) => {
    const updated = [...bullets];
    updated[index] = val;
    setBullets(updated);
  };

  const handleLoadSampleBullets = () => {
    setBullets([...SAMPLE_BULLETS]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const activeBullets = bullets.map((b) => b.trim()).filter(Boolean);
    if (activeBullets.length === 0) {
      setError('Please provide at least one bullet point to rewrite.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/bullet-rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-AI-API-Key': apiKey.trim() } : {})
        },
        body: JSON.stringify({
          bullets: activeBullets,
          role: selectedRole,
          api_key: apiKey ? apiKey.trim() : undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Failed to rewrite bullet points.' }));
        throw new Error(errData.error || errData.detail || 'Bullet rewrite request failed.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while generating rewrites.');
    } finally {
      setLoading(false);
    }
  };

  const rewritesList = Array.isArray(result)
    ? result
    : result?.rewrites || result?.bullet_rewrites || result?.suggested_bullet_rewrites || [];

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconSparkles width={16} height={16} />
            <span>AI Resume Bullet Point Enhancer</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleLoadSampleBullets}
            style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconFile width={13} height={13} />
            Load Sample Bullets
          </button>
        </div>

        {/* Role Selector */}
        <div style={{ marginBottom: 16 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>
            Target Industry / Role Context
          </div>
          <div className="roles-grid">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`role-pill ${selectedRole === r.id ? 'active' : ''}`}
                onClick={() => setSelectedRole(r.id)}
              >
                <span className="role-name">{r.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginBottom: 16,
            lineHeight: 1.55,
            background: 'var(--blue-tint)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            borderLeft: '3px solid var(--blue)'
          }}
        >
          Enter your existing CV bullet points below. The AI will rewrite them using the <strong>STAR (Situation, Task, Action, Result)</strong> format, infusing strong action verbs and quantifiable metrics.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Dynamic Bullets List */}
          <div style={{ marginBottom: 16 }}>
            {bullets.map((bullet, idx) => (
              <div key={idx} className="bullet-input-row">
                <span
                  style={{
                    paddingTop: 12,
                    fontSize: '0.8rem',
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    width: 20
                  }}
                >
                  {idx + 1}.
                </span>
                <textarea
                  className="bullet-input"
                  rows={2}
                  placeholder={`e.g. Responsible for building APIs in Python and working with databases...`}
                  value={bullet}
                  onChange={(e) => handleBulletChange(idx, e.target.value)}
                />
                <button
                  type="button"
                  className="bullet-remove-btn"
                  onClick={() => handleRemoveBullet(idx)}
                  title="Remove this bullet"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <IconX width={12} height={12} />
                </button>
              </div>
            ))}

            {bullets.length < 10 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleAddBullet}
                style={{ fontSize: '0.82rem', marginTop: 4 }}
              >
                + Add Another Bullet ({bullets.length}/10)
              </button>
            )}
          </div>

          {/* API Key Box */}
          <div className="api-key-box" style={{ marginBottom: 16 }}>
            <div className="api-key-header">
              <span>AI Model API Key (Groq Free / Gemini / OpenAI)</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {apiKey && <IconCheck width={11} height={11} />}
                {apiKey ? 'Key Provided' : 'Optional (Free Groq / Fallback)'}
              </span>
            </div>
            <input
              type="password"
              className="api-input"
              placeholder="Enter API Key (e.g. gsk_... for Groq, AIza... for Gemini, sk-... for OpenAI)"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
            />
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <IconAlertTriangle width={15} height={15} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            disabled={loading}
          >
            {loading ? (
              <span>Synthesizing High-Impact Bullets...</span>
            ) : (
              <>
                <IconSparkles width={15} height={15} />
                <span>Generate Stronger Bullets</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Loading animation */}
      {loading && (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <IconSparkles width={42} height={42} style={{ color: 'var(--blue)', animation: 'pulse 1.5s infinite' }} />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 8 }}>
            Transforming Into Executive STAR Bullets...
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Applying strong action verbs, highlighting business impact, and quantifying achievements.
          </p>
        </div>
      )}

      {/* Results */}
      {rewritesList.length > 0 && !loading && (
        <div className="card">
          <div className="card-title">
            <span>Enhanced High-Impact Bullet Points</span>
            <span className="tag tag-success">{rewritesList.length} Rewrites Generated</span>
          </div>

          <div>
            {rewritesList.map((item, idx) => {
              const original = item.original || item.original_example || item.before || '';
              const improved = item.improved || item.improved_version || item.after || '';
              const actionVerb =
                item.action_verb ||
                item.verb ||
                (improved ? improved.split(' ')[0].replace(/[^a-zA-Z]/g, '') : null);

              return (
                <div key={idx} className="bullet-rewrite-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Bullet #{idx + 1}
                    </span>
                    {actionVerb && (
                      <span className="action-verb-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconSparkles width={11} height={11} />
                        {actionVerb}
                      </span>
                    )}
                  </div>

                  {original && (
                    <div className="bullet-original">
                      <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconX width={12} height={12} />
                        Original Version:
                      </div>
                      <div>{original}</div>
                    </div>
                  )}

                  <div className="bullet-improved">
                    <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <IconCheck width={12} height={12} />
                      STAR Optimized Version:
                    </div>
                    <div>{improved}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
