import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
  const { token, isAdmin, getAllUsers, updateUserRole, clearAllDatabaseUsers } = useAuth();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [history, setHistory] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch('/api/dashboard/stats', { headers: authHeaders }),
        fetch('/api/history?limit=50', { headers: authHeaders }),
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

    if (isAdmin && getAllUsers) {
      setLoadingUsers(true);
      try {
        const uList = await getAllUsers();
        setUsersList(uList);
      } catch (e) {
        console.warn('Could not load user accounts:', e);
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey, token]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this evaluation from history?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
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
              {isAdmin ? 'Admin Console & Analytics' : 'Candidate Evaluation History'}
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              {isAdmin
                ? 'System-wide evaluation metrics, legitimacy verification pass rates, and candidate records management.'
                : 'Personal evaluation scores, ATS compliance metrics, and resume feedback history.'}
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

      {/* ─── ADMIN ACCOUNTS & DATABASE ROLES ──────────────────────────────── */}
      {isAdmin && (
        <div className="card" style={{ marginTop: 24, borderTop: '3px solid var(--purple)' }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.1rem' }}>👥</span>
              <span>System User Accounts &amp; Database Roles</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {usersList.length} Accounts Registered
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '4px 10px', color: 'var(--red)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to clear the database of all registered accounts and evaluations? This will reset the database clean.')) return;
                  if (clearAllDatabaseUsers) {
                    await clearAllDatabaseUsers();
                  }
                }}
              >
                Clear Database &amp; Emails
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Overview of all registered accounts. The primary administrator account is <strong>admin</strong> and default candidate account is <strong>user</strong>.
          </p>

          {loadingUsers ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading user accounts from database...
            </div>
          ) : usersList.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              No user accounts found.
            </div>
          ) : (
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Username / Handle</th>
                    <th>Email Address</th>
                    <th>Sign-In Provider</th>
                    <th>Assigned Role</th>
                    <th>Role Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const isAccountAdmin = u.role === 'admin' || u.is_staff;
                    return (
                      <tr key={u.id || u.username} className="dash-table-row">
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isAccountAdmin && <span title="Administrator">👑</span>}
                            <span>@{u.username}</span>
                          </div>
                          {u.display_name && u.display_name !== u.username && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{u.display_name}</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.84rem' }}>{u.email}</td>
                        <td>
                          <span className={`tag ${u.provider === 'google' ? 'tag-purple' : 'tag-neutral'}`} style={{ textTransform: 'capitalize' }}>
                            {u.provider || 'local'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`user-role-badge ${isAccountAdmin ? 'admin-badge' : 'user-badge'}`}
                            style={{ display: 'inline-flex' }}
                          >
                            {isAccountAdmin ? '👑 Administrator' : '👤 Candidate User'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-ghost"
                            style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                            onClick={async () => {
                              const targetRole = isAccountAdmin ? 'user' : 'admin';
                              await updateUserRole(u.id, u.username, targetRole);
                              if (getAllUsers) {
                                const refreshed = await getAllUsers();
                                setUsersList(refreshed);
                              }
                            }}
                          >
                            {isAccountAdmin ? 'Demote to User' : 'Promote to Admin'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
