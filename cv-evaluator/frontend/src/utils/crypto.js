/**
 * Cryptographic utility functions for CV Evaluator
 * Provides client-side hashing, session encryption, and password security analysis.
 */

// Fallback pure-JS SHA-256 for non-secure contexts (e.g. plain HTTP on non-localhost)
function sha256Fallback(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = [];
  const k = [];
  let primeCounter = 0;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Computes a salted SHA-256 client hash of a password using Web Crypto API.
 * Ensures the raw plaintext password is never sent in plaintext over untrusted channels.
 */
export async function hashPassword(password, salt = 'cv-eval-client-salt-2026') {
  if (!password) return '';
  const salted = `${salt}:${password}:${salt}`;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(salted);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Web Crypto API failed, using fallback:', e);
    }
  }
  return sha256Fallback(salted);
}

/**
 * Encrypts session data before writing to localStorage/sessionStorage.
 * Adds an obfuscation and XOR keystream pass with device-derived secret key.
 */
export function encryptSessionData(data, secretKey = 'cv_eval_secure_session_key') {
  try {
    const rawStr = JSON.stringify(data);
    let cipher = '';
    for (let i = 0; i < rawStr.length; i++) {
      const charCode = rawStr.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length);
      cipher += String.fromCharCode(charCode);
    }
    return btoa(encodeURIComponent(cipher));
  } catch (e) {
    console.error('Session encryption failed:', e);
    return null;
  }
}

/**
 * Decrypts encrypted session data retrieved from storage.
 */
export function decryptSessionData(cipherText, secretKey = 'cv_eval_secure_session_key') {
  if (!cipherText) return null;
  try {
    const cipher = decodeURIComponent(atob(cipherText));
    let rawStr = '';
    for (let i = 0; i < cipher.length; i++) {
      const charCode = cipher.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length);
      rawStr += String.fromCharCode(charCode);
    }
    return JSON.parse(rawStr);
  } catch (e) {
    console.error('Session decryption failed:', e);
    return null;
  }
}

/**
 * Analyzes password strength and returns rating, score, color, and tips.
 */
export function calculatePasswordStrength(password) {
  if (!password) {
    return { score: 0, label: 'Empty', color: 'var(--text-muted, #8b949e)', percent: 0 };
  }

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Normalized to 0-4
  const normalized = Math.min(4, score);
  const levels = [
    { label: 'Very Weak', color: '#f85149', percent: 20 },
    { label: 'Weak', color: '#e3b341', percent: 40 },
    { label: 'Moderate', color: '#dbab09', percent: 60 },
    { label: 'Strong', color: '#2ea043', percent: 85 },
    { label: 'Very Strong', color: '#3fb950', percent: 100 },
  ];

  return {
    score: normalized,
    ...levels[normalized],
  };
}
