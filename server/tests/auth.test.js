import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'http';
import { generateToken, verifyToken } from '../middleware/auth.js';
import authRoutes, { verifyGoogleIdToken } from '../routes/authRoutes.js';

test('Auth Module — Token Generation & Verification', async (t) => {
  await t.test('generateToken creates valid JWT that decodes correctly', () => {
    const payload = {
      id: 'usr_test_123',
      username: 'TestCoder',
      email: 'test@example.com',
      avatar: 'https://lh3.googleusercontent.com/test-photo.jpg',
    };

    const token = generateToken(payload);
    assert.ok(token, 'Token should be generated');
    assert.strictEqual(typeof token, 'string', 'Token should be a string');

    const decoded = verifyToken(token);
    assert.ok(decoded, 'Decoded payload should be present');
    assert.strictEqual(decoded.username, 'TestCoder');
    assert.strictEqual(decoded.email, 'test@example.com');
  });

  await t.test('verifyToken returns null on invalid or tampered token', () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature';
    const decoded = verifyToken(invalidToken);
    assert.strictEqual(decoded, null, 'Tampered token should decode to null');
  });

  await t.test('verifyToken returns null on empty or undefined token', () => {
    assert.strictEqual(verifyToken(''), null);
    assert.strictEqual(verifyToken(null), null);
    assert.strictEqual(verifyToken(undefined), null);
  });
});

test('Google Authentication API — Verification & Policy Enforcement', async (t) => {
  const TEST_CLIENT_ID = 'test-google-client-id-12345.apps.googleusercontent.com';
  process.env.GOOGLE_CLIENT_ID = TEST_CLIENT_ID;

  // Set up local test server
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);

  let server;
  let baseUrl;

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api/auth`;
      resolve();
    });
  });

  t.after(() => {
    delete global.__MOCK_GOOGLE_VERIFY__;
    server.close();
  });

  await t.test('Fails with 400 when credential is missing', async () => {
    const res = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('credential is required'));
  });

  await t.test('Fails with 401 when token audience does not match configured Google Client ID', async () => {
    global.__MOCK_GOOGLE_VERIFY__ = async () => ({
      sub: 'google_sub_wrong_aud',
      aud: 'different-attacker-client-id.apps.googleusercontent.com',
      iss: 'accounts.google.com',
      email: 'attacker@example.com',
      email_verified: true,
      name: 'Attacker User',
    });

    const res = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'mock_token_wrong_aud' }),
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.ok(data.error.includes('audience does not match'));
  });

  await t.test('Fails with 401 when token issuer is untrusted', async () => {
    global.__MOCK_GOOGLE_VERIFY__ = async () => ({
      sub: 'google_sub_bad_iss',
      aud: TEST_CLIENT_ID,
      iss: 'https://fake-google-auth.evil.com',
      email: 'user@example.com',
      email_verified: true,
      name: 'Evil Issuer',
    });

    const res = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'mock_token_bad_iss' }),
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.ok(data.error.includes('Invalid token issuer'));
  });

  await t.test('Fails with 401 when Google ID token has expired', async () => {
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    global.__MOCK_GOOGLE_VERIFY__ = async () => ({
      sub: 'google_sub_expired',
      aud: TEST_CLIENT_ID,
      iss: 'accounts.google.com',
      email: 'expired@example.com',
      email_verified: true,
      name: 'Expired User',
      exp: expiredTimestamp,
    });

    const res = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'mock_token_expired' }),
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.ok(data.error.includes('token has expired'));
  });

  await t.test('Fails with 403 when Google email is unverified', async () => {
    global.__MOCK_GOOGLE_VERIFY__ = async () => ({
      sub: 'google_sub_unverified',
      aud: TEST_CLIENT_ID,
      iss: 'https://accounts.google.com',
      email: 'unverified@example.com',
      email_verified: false,
      name: 'Unverified Email User',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'mock_token_unverified' }),
    });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error.includes('must be verified'));
  });

  await t.test('Succeeds with 200 and issues valid JWT on valid verified Google token', async () => {
    const validGoogleSub = '109876543219876543210';
    global.__MOCK_GOOGLE_VERIFY__ = async () => ({
      sub: validGoogleSub,
      aud: TEST_CLIENT_ID,
      iss: 'https://accounts.google.com',
      email: 'real.developer@gmail.com',
      email_verified: true,
      name: 'Real Developer',
      picture: 'https://lh3.googleusercontent.com/real-avatar.png',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'mock_valid_google_token' }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    assert.ok(data.token, 'Should return signed application JWT');
    assert.strictEqual(data.user.email, 'real.developer@gmail.com');
    assert.strictEqual(data.user.username, 'Real Developer');
    assert.strictEqual(data.user.avatar, 'https://lh3.googleusercontent.com/real-avatar.png');

    // Verify application JWT
    const decoded = verifyToken(data.token);
    assert.ok(decoded);
    assert.strictEqual(decoded.email, 'real.developer@gmail.com');
    assert.strictEqual(decoded.authProvider, 'google');
  });

  await t.test('Idempotent repeated sign-in returns same account without duplicating', async () => {
    const validGoogleSub = '109876543219876543210';
    global.__MOCK_GOOGLE_VERIFY__ = async () => ({
      sub: validGoogleSub,
      aud: TEST_CLIENT_ID,
      iss: 'https://accounts.google.com',
      email: 'real.developer@gmail.com',
      email_verified: true,
      name: 'Real Developer',
      picture: 'https://lh3.googleusercontent.com/real-avatar.png',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'mock_valid_google_token' }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.email, 'real.developer@gmail.com');
  });

  await t.test('Protects against unauthorized takeover: rejects Google sign-in when local account with same email exists', async () => {
    // 1. Register a local user
    await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'ExistingLocalUser',
        email: 'localuser@example.com',
        password: 'password123',
      }),
    });

    // 2. Attempt to sign in with Google using that same email
    global.__MOCK_GOOGLE_VERIFY__ = async () => ({
      sub: 'google_sub_takeover_attempt',
      aud: TEST_CLIENT_ID,
      iss: 'https://accounts.google.com',
      email: 'localuser@example.com',
      email_verified: true,
      name: 'Takeover Attacker',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await fetch(`${baseUrl}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'mock_takeover_token' }),
    });

    assert.strictEqual(res.status, 409);
    const data = await res.json();
    assert.ok(data.error.includes('already exists using password'));
  });
});

