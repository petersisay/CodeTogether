import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import roomRoutes from '../routes/roomRoutes.js';
import { generateToken } from '../middleware/auth.js';

test('Room & File Authorization API Tests', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/rooms', roomRoutes);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/rooms`;

  const validToken = generateToken({
    id: 'user_tester',
    username: 'TestPetros',
    email: 'tester@codetogether.dev',
    avatar: '/assets/avatar-petros.png',
  });

  t.after(() => {
    server.close();
  });

  await t.test('GET /api/rooms returns room list without requiring auth', async () => {
    const res = await fetch(baseUrl);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data), 'Rooms should be an array');
    assert.ok(data.length > 0, 'Default rooms should be present');
  });

  await t.test('POST /api/rooms fails with 401 when unauthenticated', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'UnauthorizedRoom' }),
    });
    assert.strictEqual(res.status, 401, 'Should reject unauthenticated room creation');
  });

  await t.test('POST /api/rooms succeeds with 201 when authenticated', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ name: 'Authorized_Test_Room', description: 'Testing auth' }),
    });
    assert.strictEqual(res.status, 201, 'Should create room with valid token');
    const data = await res.json();
    assert.strictEqual(data.name, 'Authorized_Test_Room');
    assert.strictEqual(data.creator, 'TestPetros');
  });

  await t.test('POST /api/rooms/:name/files fails with 401 when unauthenticated', async () => {
    const res = await fetch(`${baseUrl}/Authorized_Test_Room/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'hacker.js', content: 'alert(1)' }),
    });
    assert.strictEqual(res.status, 401, 'Should reject unauthenticated file creation');
  });

  await t.test('POST /api/rooms/:name/files succeeds with 201 when authenticated', async () => {
    const res = await fetch(`${baseUrl}/Authorized_Test_Room/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ filename: 'helper.js', content: 'export const x = 1;\n' }),
    });
    assert.strictEqual(res.status, 201, 'Should create file with valid token');
  });

  await t.test('PUT /api/rooms/:name/files/:filename fails with 401 when unauthenticated', async () => {
    const res = await fetch(`${baseUrl}/Authorized_Test_Room/files/helper.js`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'malicious modification' }),
    });
    assert.strictEqual(res.status, 401, 'Should reject unauthenticated file modification');
  });

  await t.test('PUT /api/rooms/:name/files/:filename succeeds with 200 when authenticated', async () => {
    const res = await fetch(`${baseUrl}/Authorized_Test_Room/files/helper.js`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ content: 'export const x = 42;\n' }),
    });
    assert.strictEqual(res.status, 200, 'Should update file with valid token');
  });

  await t.test('DELETE /api/rooms/:name/files/:filename fails with 401 when unauthenticated', async () => {
    const res = await fetch(`${baseUrl}/Authorized_Test_Room/files/helper.js`, {
      method: 'DELETE',
    });
    assert.strictEqual(res.status, 401, 'Should reject unauthenticated file deletion');
  });

  await t.test('DELETE /api/rooms/:name/files/:filename succeeds with 200 when authenticated', async () => {
    const res = await fetch(`${baseUrl}/Authorized_Test_Room/files/helper.js`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert.strictEqual(res.status, 200, 'Should delete file with valid token');
  });
});
