"""
================================================================================
Cryptographic Utilities & Key Masking for CV Evaluator
================================================================================
This module provides:
1. Symmetric encryption/decryption for storing API keys (Groq, Gemini, OpenAI)
   and OAuth secrets securely in PostgreSQL database at rest.
2. Safe masking utilities (e.g., 'gsk_************3aB9') so keys are never
   exposed in plaintext on the frontend or in logs.
================================================================================
"""

import base64
import hashlib
import hmac
import os
from django.conf import settings


def _get_key_bytes() -> bytes:
    """
    Derives a deterministic 256-bit (32-byte) binary cryptographic key from Django's
    SECRET_KEY setting using SHA-256. This ensures the encryption key stays in sync
    with the server configuration without requiring extra key management infrastructure.
    """
    raw_secret = getattr(settings, 'SECRET_KEY', 'default-cveval-key-2026').encode('utf-8')
    return hashlib.sha256(raw_secret).digest()


def encrypt_secret(plain_text: str) -> str:
    """
    Encrypts a plaintext secret (such as a Groq API key or Google OAuth Client Secret)
    before saving it to the database.

    Strategy:
    - If 'cryptography' library is available, uses standard Fernet (AES-128-CBC + HMAC).
    - Built-in fallback: Uses HMAC-SHA256 keystream encryption with a 16-byte random salt
      and Message Authentication Code (MAC) for authenticated encryption.
    """
    if not plain_text:
        return ""

    # Strategy A: Use Fernet if cryptography is installed
    try:
        from cryptography.fernet import Fernet
        key = base64.urlsafe_b64encode(_get_key_bytes())
        f = Fernet(key)
        encrypted = f.encrypt(plain_text.encode('utf-8'))
        return "fernet:" + encrypted.decode('utf-8')
    except ImportError:
        pass

    # Strategy B: Built-in secure authenticated keystream cipher
    salt = os.urandom(16)  # 16-byte random initialization vector / salt
    key = _get_key_bytes()
    text_bytes = plain_text.encode('utf-8')

    # Generate pseudo-random keystream blocks using HMAC-SHA256
    keystream = bytearray()
    counter = 0
    while len(keystream) < len(text_bytes):
        h = hmac.new(key, salt + counter.to_bytes(4, 'big'), hashlib.sha256)
        keystream.extend(h.digest())
        counter += 1

    # XOR plaintext bytes with keystream bytes
    cipher_bytes = bytes([b ^ k for b, k in zip(text_bytes, keystream[:len(text_bytes)])])
    token = salt + cipher_bytes

    # Append HMAC tag for tamper resistance
    mac = hmac.new(key, token, hashlib.sha256).digest()[:16]
    return "std:" + base64.urlsafe_b64encode(token + mac).decode('utf-8')


def decrypt_secret(cipher_text: str) -> str:
    """
    Decrypts an encrypted secret retrieved from the database back into plaintext
    for backend AI API calls.

    Raises ValueError if the ciphertext has been modified or corrupted.
    """
    if not cipher_text:
        return ""

    # Case A: Fernet format
    if cipher_text.startswith("fernet:"):
        from cryptography.fernet import Fernet
        key = base64.urlsafe_b64encode(_get_key_bytes())
        f = Fernet(key)
        decrypted = f.decrypt(cipher_text[7:].encode('utf-8'))
        return decrypted.decode('utf-8')

    # Case B: Built-in standard authenticated cipher format
    elif cipher_text.startswith("std:"):
        raw = base64.urlsafe_b64decode(cipher_text[4:].encode('utf-8'))
        key = _get_key_bytes()
        mac = raw[-16:]
        token = raw[:-16]

        # Verify authentication tag to detect any tampering
        expected_mac = hmac.new(key, token, hashlib.sha256).digest()[:16]
        if not hmac.compare_digest(mac, expected_mac):
            raise ValueError("Secret integrity check failed (invalid MAC signature).")

        salt = token[:16]
        cipher_bytes = token[16:]

        # Re-derive keystream
        keystream = bytearray()
        counter = 0
        while len(keystream) < len(cipher_bytes):
            h = hmac.new(key, salt + counter.to_bytes(4, 'big'), hashlib.sha256)
            keystream.extend(h.digest())
            counter += 1

        # Decrypt by XORing back with keystream
        plain_bytes = bytes([b ^ k for b, k in zip(cipher_bytes, keystream[:len(cipher_bytes)])])
        return plain_bytes.decode('utf-8')

    # Unencrypted legacy string fallback
    return cipher_text


def mask_secret(secret: str, prefix_len: int = 4, suffix_len: int = 4) -> str:
    """
    Masks a sensitive API key or secret for safe display in the Admin Dashboard.
    Example:
      'gsk_1234567890abcdef' -> 'gsk_************cdef'
      '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' -> 'GOCS************X9T'
    """
    if not secret:
        return ""
    clean = secret.strip()
    if len(clean) <= (prefix_len + suffix_len):
        return "********"
    prefix = clean[:prefix_len]
    suffix = clean[-suffix_len:]
    return f"{prefix}************{suffix}"
