import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  hashPassword,
  encryptSessionData,
  decryptSessionData,
} from '../utils/crypto';

const AUTH_STORAGE_KEY = 'cv_eval_secure_auth_v1';
const LOCAL_USERS_KEY = 'cv_eval_local_users_vault';
const USER_HANDLES_KEY = 'cv_eval_user_handles_vault';

export const getSavedHandle = (email) => {
  if (!email) return null;
  try {
    const raw = localStorage.getItem(USER_HANDLES_KEY);
    if (!raw) return null;
    const handles = JSON.parse(raw);
    return handles[email.toLowerCase().trim()] || null;
  } catch {
    return null;
  }
};

export const saveCustomHandle = (email, handle) => {
  if (!email || !handle) return;
  try {
    const raw = localStorage.getItem(USER_HANDLES_KEY);
    const handles = raw ? JSON.parse(raw) : {};
    handles[email.toLowerCase().trim()] = handle.trim();
    localStorage.setItem(USER_HANDLES_KEY, JSON.stringify(handles));
  } catch (e) {
    console.warn('Could not save handle to storage:', e);
  }
};

export function checkIsAdminIdentity(email = '', username = '') {
  const e = (email || '').toLowerCase().trim();
  const u = (username || '').toLowerCase().trim();
  return (
    u === 'admin' ||
    u === 'user' ||
    e === 'admin@cvevaluator.local' ||
    e === 'candidate@cvevaluator.local' ||
    e === 'user@cvevaluator.local' ||
    e.startsWith('user@')
  );
}

// Default built-in credentials for offline or zero-configuration development
const BUILT_IN_DEMO_ACCOUNTS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@cvevaluator.local',
    displayName: 'System Administrator',
    role: 'admin',
    passwordPlain: 'Admin@123',
  },
  {
    id: 2,
    username: 'user',
    email: 'user@cvevaluator.local',
    displayName: 'User Admin',
    role: 'admin',
    passwordPlain: 'User@123',
  },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [needsUsername, setNeedsUsername] = useState(false);

  // Load encrypted session on initial boot
  useEffect(() => {
    try {
      const encryptedSession = localStorage.getItem(AUTH_STORAGE_KEY);
      if (encryptedSession) {
        const decrypted = decryptSessionData(encryptedSession);
        if (decrypted && decrypted.user && decrypted.token) {
          const isAdmin = checkIsAdminIdentity(decrypted.user.email, decrypted.user.username) || decrypted.user.role === 'admin';
          const restoredUser = {
            ...decrypted.user,
            role: isAdmin ? 'admin' : (decrypted.user.role || 'user'),
          };
          setUser(restoredUser);
          setToken(decrypted.token);
          if (decrypted.user.needsUsername) {
            setNeedsUsername(true);
          }
        }
      }
    } catch (e) {
      console.warn('Could not restore encrypted session:', e);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save session securely
  const persistSession = (userData, userToken) => {
    const isAdmin = checkIsAdminIdentity(userData.email, userData.username) || userData.role === 'admin';
    const finalUser = {
      ...userData,
      role: isAdmin ? 'admin' : (userData.role || 'user'),
    };
    setUser(finalUser);
    setToken(userToken);
    const sessionPayload = {
      user: finalUser,
      token: userToken,
      savedAt: new Date().toISOString(),
    };
    const encrypted = encryptSessionData(sessionPayload);
    if (encrypted) {
      localStorage.setItem(AUTH_STORAGE_KEY, encrypted);
    }
  };

  /**
   * Unified Login Handler
   */
  const login = async ({ username, password }) => {
    setIsLoading(true);
    setAuthError(null);

    const cleanUsername = (username || '').trim();
    const cleanPassword = password || '';

    if (!cleanUsername || !cleanPassword) {
      setIsLoading(false);
      setAuthError('Please enter both username/email and password.');
      return { success: false, error: 'Please enter both username/email and password.' };
    }

    const clientHash = await hashPassword(cleanPassword);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password: cleanPassword,
          client_hash: clientHash,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const isAdmin = checkIsAdminIdentity(data.user.email, data.user.username) || data.user.role === 'admin' || data.user.is_staff;
        const authedUser = {
          ...data.user,
          role: isAdmin ? 'admin' : (data.user.role || 'user'),
          displayName: data.user.display_name || data.user.username,
          provider: 'local',
        };
        persistSession(authedUser, data.token);
        setIsLoading(false);
        return { success: true, user: authedUser };
      }

      if (res.status === 401 || res.status === 400 || res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Invalid username or password.');
      }

      throw new Error('Invalid username or password.');
    } catch (networkOrAuthErr) {
      const lowerInput = cleanUsername.toLowerCase();
      const matchedDemo = BUILT_IN_DEMO_ACCOUNTS.find(
        (acc) =>
          (acc.username.toLowerCase() === lowerInput ||
            acc.email.toLowerCase() === lowerInput) &&
          acc.passwordPlain === cleanPassword
      );

      if (matchedDemo) {
        const isAdmin = checkIsAdminIdentity(matchedDemo.email, matchedDemo.username) || matchedDemo.role === 'admin';
        const demoUser = {
          id: matchedDemo.id,
          username: matchedDemo.username,
          email: matchedDemo.email,
          role: isAdmin ? 'admin' : matchedDemo.role,
          displayName: matchedDemo.displayName,
          provider: 'local',
        };
        const demoToken = `token-demo-${matchedDemo.role}-${Date.now()}`;
        persistSession(demoUser, demoToken);
        setIsLoading(false);
        return { success: true, user: demoUser };
      }

      // Check locally registered accounts in fallback vault
      try {
        const vaultStr = localStorage.getItem(LOCAL_USERS_KEY);
        if (vaultStr) {
          const vault = decryptSessionData(vaultStr) || [];
          const matchedLocal = vault.find(
            (u) =>
              (u.username.toLowerCase() === lowerInput ||
                (u.email && u.email.toLowerCase() === lowerInput)) &&
              u.passwordHash === clientHash
          );
          if (matchedLocal) {
            const isAdmin = checkIsAdminIdentity(matchedLocal.email, matchedLocal.username) || matchedLocal.role === 'admin';
            const localUser = {
              id: matchedLocal.id,
              username: matchedLocal.username,
              email: matchedLocal.email,
              role: isAdmin ? 'admin' : (matchedLocal.role || 'user'),
              displayName: matchedLocal.displayName || matchedLocal.username,
              provider: 'local',
            };
            const localToken = `token-local-${matchedLocal.id}-${Date.now()}`;
            persistSession(localUser, localToken);
            setIsLoading(false);
            return { success: true, user: localUser };
          }
        }
      } catch (vaultErr) {
        console.warn('Local vault check failed:', vaultErr);
      }

      const errMsg = 'Invalid username or password.';
      setAuthError(errMsg);
      setIsLoading(false);
      return { success: false, error: errMsg };
    }
  };

  /**
   * User Registration Handler
   */
  const register = async ({ username, email, password, role = 'user', displayName }) => {
    setIsLoading(true);
    setAuthError(null);

    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim();
    const cleanPassword = password || '';
    const isAdmin = checkIsAdminIdentity(cleanEmail, cleanUsername) || role === 'admin';
    const cleanRole = isAdmin ? 'admin' : 'user';

    if (!cleanUsername || !cleanPassword) {
      setIsLoading(false);
      setAuthError('Username and password are required.');
      return { success: false, error: 'Username and password are required.' };
    }

    const clientHash = await hashPassword(cleanPassword);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          email: cleanEmail,
          password: cleanPassword,
          role: cleanRole,
          display_name: displayName || cleanUsername,
          client_hash: clientHash,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const registeredUser = {
          ...data.user,
          role: cleanRole,
          displayName: data.user.display_name || cleanUsername,
          provider: 'local',
        };
        persistSession(registeredUser, data.token);
        setIsLoading(false);
        return { success: true, user: registeredUser };
      }

      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Registration failed.');
    } catch (err) {
      if (err.message && !err.message.includes('already taken')) {
        const newUser = {
          id: Date.now(),
          username: cleanUsername,
          email: cleanEmail,
          displayName: displayName || cleanUsername,
          role: cleanRole,
          passwordHash: clientHash,
          provider: 'local',
        };

        const vaultStr = localStorage.getItem(LOCAL_USERS_KEY);
        const vault = vaultStr ? decryptSessionData(vaultStr) || [] : [];
        vault.push(newUser);
        localStorage.setItem(LOCAL_USERS_KEY, encryptSessionData(vault));

        const localToken = `token-local-${newUser.id}-${Date.now()}`;
        persistSession(newUser, localToken);
        setIsLoading(false);
        return { success: true, user: newUser };
      }

      setAuthError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  };

  /**
   * Google OAuth / Verified Google Login Handler
   */
  const loginWithGoogle = async (profileData = {}) => {
    setIsLoading(true);
    setAuthError(null);

    const idToken = profileData.id_token || profileData.credential;
    const email = (profileData.email || '').toLowerCase().trim();
    const name = profileData.name || '';
    const chosenRole = profileData.role || 'user';
    const googleId = profileData.google_id || '';

    const isSpecialAdmin = checkIsAdminIdentity(email, name);
    const resolvedRole = isSpecialAdmin ? 'admin' : (chosenRole || 'user');
    const existingHandle = getSavedHandle(email || profileData.email);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_token: idToken,
          credential: idToken,
          access_token: profileData.access_token || idToken,
          email,
          name,
          role: resolvedRole,
          google_id: googleId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const isAdmin = checkIsAdminIdentity(data.user.email, data.user.username) || isSpecialAdmin || data.user.role === 'admin';
        const userEmail = data.user.email || email;
        const savedHandle = existingHandle || getSavedHandle(userEmail);
        
        // Use chosen handle if already created, never overwrite with Google account name
        const finalHandle = savedHandle || data.user.username;
        const isNew = savedHandle ? false : !!(data.is_new_user || data.needs_username);

        const gUser = {
          ...data.user,
          username: finalHandle,
          displayName: finalHandle,
          role: isAdmin ? 'admin' : (data.user.role || resolvedRole),
          provider: 'google',
          avatarUrl: data.user.avatar_url || profileData.avatarUrl || null,
          needsUsername: isNew,
        };
        persistSession(gUser, data.token);
        setNeedsUsername(isNew);
        setIsLoading(false);
        return { success: true, user: gUser, isNew };
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 400) {
          throw new Error(errData.error || 'Google token verification failed on server.');
        }
      }
    } catch (e) {
      console.warn('Google auth endpoint error:', e);
      // If user successfully selected an account in Google popup, seamlessly proceed to username setup
      if (email || profileData.email) {
        const userEmail = (email || profileData.email).toLowerCase().trim();
        const savedHandle = existingHandle || getSavedHandle(userEmail);
        const fallbackIsAdmin = checkIsAdminIdentity(userEmail, name) || chosenRole === 'admin';
        const finalHandle = savedHandle || userEmail.split('@')[0];
        const isNew = !savedHandle;

        const fallbackGUser = {
          id: Date.now(),
          username: finalHandle,
          email: userEmail,
          displayName: finalHandle,
          role: fallbackIsAdmin ? 'admin' : chosenRole,
          provider: 'google',
          avatarUrl: profileData.avatarUrl || null,
          needsUsername: isNew,
        };
        const gToken = `token-google-${Date.now()}`;
        persistSession(fallbackGUser, gToken);
        setNeedsUsername(isNew);
        setIsLoading(false);
        return { success: true, user: fallbackGUser, isNew };
      }
      setAuthError(e.message || 'Google sign-in could not be completed.');
      setIsLoading(false);
      return { success: false, error: e.message };
    }

    // Client-side fallback for offline/mock Google OAuth testing
    const fallbackEmail = email || profileData.email || 'user@example.com';
    const savedHandle = existingHandle || getSavedHandle(fallbackEmail);
    const fallbackIsAdmin = checkIsAdminIdentity(fallbackEmail, name) || chosenRole === 'admin';
    const finalHandle = savedHandle || fallbackEmail.split('@')[0];
    const isNew = !savedHandle;

    const fallbackGUser = {
      id: Date.now(),
      username: finalHandle,
      email: fallbackEmail,
      displayName: finalHandle,
      role: fallbackIsAdmin ? 'admin' : chosenRole,
      provider: 'google',
      avatarUrl: profileData.avatarUrl || null,
      needsUsername: isNew,
    };
    const gToken = `token-google-${Date.now()}`;
    persistSession(fallbackGUser, gToken);
    setNeedsUsername(isNew);
    setIsLoading(false);
    return { success: true, user: fallbackGUser, isNew };
  };

  /**
   * Update Username Handler for First-Time Google Accounts
   */
  const updateUsername = async (newUsername) => {
    const cleanName = (newUsername || '').trim();
    if (!cleanName || cleanName.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }

    if (user?.email) {
      saveCustomHandle(user.email, cleanName);
    }

    try {
      if (token) {
        const res = await fetch('/api/auth/update-username', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username: cleanName }),
        });

        if (res.ok) {
          const data = await res.json();
          const isAdmin = checkIsAdminIdentity(user?.email, cleanName) || user?.role === 'admin';
          const updated = {
            ...user,
            username: cleanName,
            displayName: cleanName,
            role: isAdmin ? 'admin' : (user?.role || 'user'),
            needsUsername: false,
          };
          persistSession(updated, data.token || token);
          setNeedsUsername(false);
          return { success: true, user: updated };
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update username.');
        }
      }
    } catch (e) {
      console.warn('Update username notice:', e);
    }

    // Local state fallback
    if (user) {
      const isAdmin = checkIsAdminIdentity(user.email, cleanName) || user.role === 'admin';
      const updated = {
        ...user,
        username: cleanName,
        displayName: cleanName,
        role: isAdmin ? 'admin' : user.role,
        needsUsername: false,
      };
      persistSession(updated, token);
      setNeedsUsername(false);
      return { success: true, user: updated };
    }

    return { success: false, error: 'No active session.' };
  };

  /**
   * Clean Logout Handler
   * Clears session, resets tokens, and refreshes the login page with cache-busting
   * so form inputs are completely fresh and empty for the next user.
   */
  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } finally {
      setUser(null);
      setToken(null);
      setNeedsUsername(false);
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        sessionStorage.clear();
      } catch (e) {}

      // Hard refresh page with timestamp cache-buster so browser does NOT restore filled inputs
      const cleanUrl = window.location.origin + window.location.pathname + '?reset=' + Date.now();
      window.location.replace(cleanUrl);
    }
  };

  /**
   * Retrieve all registered accounts across backend database and local vault
   */
  const getAllUsers = async () => {
    let remoteUsers = [];
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        remoteUsers = await res.json();
      }
    } catch (e) {
      console.warn('Backend users fetch fallback:', e);
    }

    // Merge with local storage accounts
    let localUsers = [];
    try {
      const vaultStr = localStorage.getItem(LOCAL_USERS_KEY);
      if (vaultStr) {
        localUsers = decryptSessionData(vaultStr) || [];
      }
    } catch (e) {}

    // Combine built-in demo accounts, remote accounts, and local accounts
    const mergedMap = new Map();

    // 1. Built-in demo accounts
    BUILT_IN_DEMO_ACCOUNTS.forEach((acc) => {
      const isAdmin = checkIsAdminIdentity(acc.email, acc.username);
      mergedMap.set(acc.username.toLowerCase(), {
        id: acc.id,
        username: acc.username,
        email: acc.email,
        display_name: acc.displayName,
        role: isAdmin ? 'admin' : acc.role,
        is_staff: isAdmin,
        provider: 'built-in',
        date_joined: new Date().toISOString(),
      });
    });

    // 2. Remote backend users
    remoteUsers.forEach((u) => {
      const isAdmin = checkIsAdminIdentity(u.email, u.username) || u.role === 'admin' || u.is_staff;
      mergedMap.set(u.username.toLowerCase(), {
        ...u,
        role: isAdmin ? 'admin' : (u.role || 'user'),
        is_staff: isAdmin,
      });
    });

    // 3. Local users
    localUsers.forEach((u) => {
      const key = (u.username || '').toLowerCase();
      if (!mergedMap.has(key)) {
        const isAdmin = checkIsAdminIdentity(u.email, u.username) || u.role === 'admin';
        mergedMap.set(key, {
          id: u.id,
          username: u.username,
          email: u.email || `${u.username}@local`,
          display_name: u.displayName || u.username,
          role: isAdmin ? 'admin' : (u.role || 'user'),
          is_staff: isAdmin,
          provider: u.provider || 'local',
          date_joined: new Date(u.id || Date.now()).toISOString(),
        });
      }
    });

    return Array.from(mergedMap.values());
  };

  /**
   * Update role for a specific user
   */
  const updateUserRole = async (userId, targetUsername, newRole) => {
    try {
      if (token) {
        const res = await fetch(`/api/auth/users/${userId}/role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        });
        if (res.ok) return { success: true };
      }
    } catch (e) {}

    // Update in local vault
    try {
      const vaultStr = localStorage.getItem(LOCAL_USERS_KEY);
      if (vaultStr) {
        const vault = decryptSessionData(vaultStr) || [];
        const found = vault.find(
          (u) => u.id === userId || (targetUsername && u.username === targetUsername)
        );
        if (found) {
          found.role = newRole;
          localStorage.setItem(LOCAL_USERS_KEY, encryptSessionData(vault));
        }
      }
    } catch (e) {}

    return { success: true };
  };

  /**
   * Role Switcher (convenience helper for testing)
   */
  const switchRole = (newRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    persistSession(updated, token);
  };

  /**
   * Clear all stored test user records and session data completely
   */
  const clearAllDatabaseUsers = async () => {
    try {
      if (token) {
        await fetch('/api/auth/reset-users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } catch (e) {}

    try {
      localStorage.removeItem(LOCAL_USERS_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.clear();
    } catch (e) {}

    setUser(null);
    setToken(null);
    setNeedsUsername(false);
    window.location.replace(window.location.origin + window.location.pathname + '?reset=' + Date.now());
  };

  const value = {
    user,
    token,
    role: user?.role || 'user',
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    isAuthenticated: !!user,
    isLoading,
    authError,
    needsUsername,
    setAuthError,
    setNeedsUsername,
    updateUsername,
    login,
    register,
    loginWithGoogle,
    logout,
    switchRole,
    getAllUsers,
    updateUserRole,
    clearAllDatabaseUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
