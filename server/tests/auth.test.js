import test from 'node:test';
import assert from 'node:assert/strict';
import { generateToken, verifyToken } from '../middleware/auth.js';

test('Auth Module — Token Generation & Verification', async (t) => {
  await t.test('generateToken creates valid JWT that decodes correctly', () => {
    const payload = {
      id: 'usr_test_123',
      username: 'TestCoder',
      email: 'test@codetogether.dev',
      avatar: '/assets/avatar-petros.png',
    };

    const token = generateToken(payload);
    assert.ok(token, 'Token should be generated');
    assert.strictEqual(typeof token, 'string', 'Token should be a string');

    const decoded = verifyToken(token);
    assert.ok(decoded, 'Decoded payload should be present');
    assert.strictEqual(decoded.username, 'TestCoder');
    assert.strictEqual(decoded.email, 'test@codetogether.dev');
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
