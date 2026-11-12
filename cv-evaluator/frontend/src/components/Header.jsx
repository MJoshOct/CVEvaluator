import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IconUser, IconCrown, IconLogOut, IconShield, IconGoogle } from './Icons';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const hasAvatarImg = Boolean(user?.avatarUrl && !imgError);
  const displayHandle = user?.username || (user?.email ? user.email.split('@')[0] : 'user');

  return (
    <header className="header">
      <div className="brand">
        <div className="brand-icon">CV</div>
        <div>
          <h1 className="brand-title">CV Evaluator</h1>
          <p className="brand-subtitle">AI-powered resume analysis &amp; evaluation</p>
        </div>
      </div>

      {user && (
        <div className="header-user-panel" ref={dropdownRef}>
          {/* Role Badge */}
          <div className={`user-role-badge ${isAdmin ? 'admin-badge' : 'user-badge'}`}>
            {isAdmin ? (
              <>
                <IconCrown width={13} height={13} style={{ marginRight: 4, color: '#f59e0b' }} />
                <span>Admin</span>
              </>
            ) : (
              <>
                <IconUser width={13} height={13} style={{ marginRight: 4, color: 'var(--blue)' }} />
                <span>User</span>
              </>
            )}
          </div>

          {/* Circular Profile Avatar Button */}
          <div className="header-profile-container">
            <button
              type="button"
              className={`header-avatar-btn ${isDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-label="User profile and account settings"
              aria-expanded={isDropdownOpen}
              title={`Profile: @${displayHandle} (${user.email || 'SSO'})`}
            >
              {hasAvatarImg ? (
                <img
                  src={user.avatarUrl}
                  alt={displayHandle}
                  className="header-avatar-img"
                  onError={() => setImgError(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="header-avatar-default">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </button>

            {/* Profile Dropdown Popover */}
            {isDropdownOpen && (
              <div className="profile-dropdown-card">
                <div className="profile-dropdown-header">
                  <div className="profile-dropdown-avatar">
                    {hasAvatarImg ? (
                      <img
                        src={user.avatarUrl}
                        alt={displayHandle}
                        className="header-avatar-img"
                        onError={() => setImgError(true)}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="header-avatar-default" style={{ width: '100%', height: '100%' }}>
                        <svg
                          width="26"
                          height="26"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="profile-dropdown-details">
                    <div className="profile-dropdown-username">@{displayHandle}</div>
                    <div className="profile-dropdown-email">{user.email || 'Local Account'}</div>
                  </div>
                </div>

                <div className="profile-dropdown-meta">
                  <div className="profile-dropdown-meta-row">
                    <span className="profile-dropdown-meta-label">Access Level</span>
                    <span className={`user-role-badge ${isAdmin ? 'admin-badge' : 'user-badge'}`} style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                      {isAdmin ? '👑 Administrator' : '👤 Candidate'}
                    </span>
                  </div>
                  <div className="profile-dropdown-meta-row">
                    <span className="profile-dropdown-meta-label">Sign-in Method</span>
                    <span className="profile-dropdown-meta-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {user.provider === 'google' ? (
                        <>
                          <IconGoogle width={13} height={13} />
                          <span>Google OAuth</span>
                        </>
                      ) : (
                        <>
                          <IconShield width={13} height={13} style={{ color: 'var(--blue)' }} />
                          <span>Single Sign-On</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="profile-dropdown-logout-btn"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  title="Sign out of your account"
                >
                  <IconLogOut width={15} height={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
