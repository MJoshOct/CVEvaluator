import React, { useEffect, useState } from 'react';

const EMPTY_STATS = {
  total_evaluations: 0,
  legitimate_count: 0,
  legitimate_rate: 0,
  avg_ats_score: 0,
  avg_predefined_score: 0,
  avg_ai_score: 0,
  role_breakdown: {},
  recent_evaluations: [],
};

function roleLabel(id) {
  return id ? id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Unknown';
}

function scoreColor(score) {
  if (score == null) return 'var(--text-muted)';
  if (score >= 75) return 'var(--green)';
  if (score >= 50) return 'var(--blue)';
  if (score >= 30) return 'var(--amber)';
  return 'var(--red)';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function UserDashboard({ onOpenRecord, refreshKey = 0 }) {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/history?limit=50'),
      ]);
      if (!statsRes.ok) throw new Error('Could not load dashboard stats.');
      const statsData = await statsRes.json();
      setStats({ ...EMPTY_STATS, ...statsData });
      if (historyRes.ok) {
        setHistory(await historyRes.json());
      }
    } catch (err) {
      setError(err.message || 'Dashboard failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this evaluation from history?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const roleEntries = Object.entries(stats.role_breakdown || {});
  const maxRoleCount = roleEntries.reduce((m, [, n]) => Math.max(m, n), 1);
  const rows = history.length ? history : (stats.recent_evaluations || []);

  return (
    <div>
      <div
        className="card"
        style={{
          background: 'var(--blue-tint)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-sm)',
              background: '#ffffff',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              flexShrink: 0,
            }}
          >
            📊
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>
              Evaluation Dashboard
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Aggregated ATS, role-match, and AI scores from saved evaluations. Login is optional — every service runs as a guest.
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="status-banner fail" style={{ marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div className="status-title">Dashboard error</div>
            <div className="status-details">{error}</div>
          </div>
        </div>
      )}

      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <span className="dash-stat-label">Evaluations</span>
          <b className="dash-stat-value">{stats.total_evaluations}</b>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Legitimate CVs</span>
          <b className="dash-stat-value">{stats.legitimate_count}</b>
          <span className="dash-stat-hint">{stats.legitimate_rate}% pass rate</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Avg ATS score</span>
          <b className="dash-stat-value" style={{ color: scoreColor(stats.avg_ats_score) }}>
            {Math.round(stats.avg_ats_score)}
          </b>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Avg role match</span>
          <b className="dash-stat-value" style={{ color: scoreColor(stats.avg_predefined_score) }}>
            {Math.round(stats.avg_predefined_score)}%
          </b>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Avg AI score</span>
          <b className="dash-stat-value" style={{ color: scoreColor(stats.avg_ai_score) }}>
            {Math.round(stats.avg_ai_score)}
          </b>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">
          <span>Target role mix</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {roleEntries.length} roles
          </span>
        </div>
        {roleEntries.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No evaluations yet. Run the Resume Evaluator to populate this dashboard.
          </p>
        ) : (
          <div className="dash-role-list">
            {roleEntries.map(([role, count]) => (
              <div key={role} className="dash-role-row">
                <div className="dash-role-meta">
                  <span>{roleLabel(role)}</span>
                  <strong>{count}</strong>
                </div>
                <div className="dash-role-track">
                  <i style={{ width: `${Math.max(8, (count / maxRoleCount) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          <span>Recent evaluations</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Click a row to reopen the full report
          </span>
        </div>
        {loading && rows.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading history…</p>
        ) : rows.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 12px' }}>
            <div className="empty-state-icon">📭</div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 6 }}>Nothing here yet</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Evaluate a CV to see ATS scores, role matches, and history on this dashboard.
            </p>
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Target role</th>
                  <th>ATS</th>
                  <th>Match</th>
                  <th>AI</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onOpenRecord?.(item.id)}
                    className="dash-table-row"
                  >
                    <td>
                      <div className="dash-candidate">
                        {item.candidate_name || `Evaluation #${item.id}`}
                      </div>
                      {item.is_legitimate === false && (
                        <span className="tag tag-danger">Invalid CV</span>
                      )}
                    </td>
                    <td>{roleLabel(item.target_role)}</td>
                    <td style={{ color: scoreColor(item.ats_score), fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {item.ats_score != null ? Math.round(item.ats_score) : '—'}
                    </td>
                    <td style={{ color: scoreColor(item.predefined_score), fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {item.predefined_score != null ? `${Math.round(item.predefined_score)}%` : '—'}
                    </td>
                    <td style={{ color: scoreColor(item.ai_score), fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {item.ai_score != null ? Math.round(item.ai_score) : '—'}
                    </td>
                    <td className="dash-date">{formatDate(item.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost"
                        disabled={deletingId === item.id}
                        onClick={(e) => handleDelete(item.id, e)}
                      >
                        {deletingId === item.id ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
