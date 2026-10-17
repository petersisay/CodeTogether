import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { setupSocket } from '../socket.js';
import { generateToken } from '../middleware/auth.js';

test('Socket.IO Authorization & WebRTC Signaling Integration Tests', async (t) => {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  setupSocket(io);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const serverUrl = `http://localhost:${port}`;

  const tokenUser1 = generateToken({
    id: 'user_petros_1',
    username: 'Petros',
    email: 'petros@codetogether.dev',
    avatar: '/assets/avatar-petros.png',
  });

  const tokenUser2 = generateToken({
    id: 'user_habtu_2',
    username: 'Habtu',
    email: 'habtu@codetogether.dev',
    avatar: '/assets/avatar-habtu.png',
  });

  t.after(() => {
    io.close();
    server.close();
  });

  await t.test('Unauthenticated socket fails room:join with unauthorized error', async () => {
    const client = Client(serverUrl, { transports: ['websocket'] });

    await new Promise((resolve) => client.on('connect', resolve));

    const errorPromise = new Promise((resolve) => {
      client.on('error:unauthorized', (data) => resolve(data));
    });

    client.emit('room:join', { room: 'ASTU_DreamTeam' });
    const err = await errorPromise;
    assert.ok(err.message.includes('Authentication required'));

    client.disconnect();
  });

  await t.test('Authenticated socket connects and successfully joins room', async () => {
    const client = Client(serverUrl, {
      auth: { token: tokenUser1 },
      transports: ['websocket'],
    });

    await new Promise((resolve) => client.on('connect', resolve));

    const statePromise = new Promise((resolve) => {
      client.on('room:state', (data) => resolve(data));
    });

    client.emit('room:join', { room: 'ASTU_DreamTeam' });
    const state = await statePromise;
    assert.strictEqual(state.room, 'ASTU_DreamTeam');
    assert.ok(state.files, 'Room state should contain files');

    client.disconnect();
  });

  await t.test('Real-time code change broadcasts with version sequence to collaborators', async () => {
    const client1 = Client(serverUrl, {
      auth: { token: tokenUser1 },
      transports: ['websocket'],
    });
    const client2 = Client(serverUrl, {
      auth: { token: tokenUser2 },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise((resolve) => client1.on('connect', resolve)),
      new Promise((resolve) => client2.on('connect', resolve)),
    ]);

    client1.emit('room:join', { room: 'ASTU_DreamTeam' });
    client2.emit('room:join', { room: 'ASTU_DreamTeam' });

    // Wait for room join
    await new Promise((r) => setTimeout(r, 100));

    const codeUpdatePromise = new Promise((resolve) => {
      client2.on('code:update', (data) => resolve(data));
    });

    client1.emit('code:change', {
      room: 'ASTU_DreamTeam',
      file: 'App.jsx',
      code: 'const test = "sync";',
      version: 1,
      cursorLine: 5,
    });

    const received = await codeUpdatePromise;
    assert.strictEqual(received.code, 'const test = "sync";');
    assert.strictEqual(received.sender, 'Petros');
    assert.strictEqual(received.cursorLine, 5);
    assert.ok(received.version >= 1);

    client1.disconnect();
    client2.disconnect();
  });

  await t.test('WebRTC Meeting: join, participants exchange, and media toggling', async () => {
    const client1 = Client(serverUrl, {
      auth: { token: tokenUser1 },
      transports: ['websocket'],
    });
    const client2 = Client(serverUrl, {
      auth: { token: tokenUser2 },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise((resolve) => client1.on('connect', resolve)),
      new Promise((resolve) => client2.on('connect', resolve)),
    ]);

    const meetingId = 'meeting_test_room';

    // 1. Client 1 joins meeting
    client1.emit('meeting:join', { meetingId, mediaType: 'audio-video' });

    // 2. Client 2 joins and triggers meeting:user-joined on Client 1
    const userJoinedPromise = new Promise((resolve) => {
      client1.on('meeting:user-joined', (peer) => resolve(peer));
    });

    // Client 2 also receives participants list containing Client 1
    const participantsPromise = new Promise((resolve) => {
      client2.on('meeting:participants', (data) => resolve(data));
    });

    client2.emit('meeting:join', { meetingId, mediaType: 'audio-video' });

    const [newPeer, existingPeers] = await Promise.all([userJoinedPromise, participantsPromise]);

    assert.strictEqual(newPeer.username, 'Habtu');
    assert.strictEqual(newPeer.mediaType, 'audio-video');
    assert.strictEqual(existingPeers.participants.length, 1);
    assert.strictEqual(existingPeers.participants[0].username, 'Petros');

    // 3. WebRTC Offer Forwarding
    const offerPromise = new Promise((resolve) => {
      client1.on('webrtc:offer', (data) => resolve(data));
    });

    client2.emit('webrtc:offer', {
      meetingId,
      targetSocketId: client1.id,
      offer: { type: 'offer', sdp: 'fake-sdp-offer' },
    });

    const offerData = await offerPromise;
    assert.strictEqual(offerData.fromSocketId, client2.id);
    assert.strictEqual(offerData.offer.sdp, 'fake-sdp-offer');

    // 4. WebRTC Answer Forwarding
    const answerPromise = new Promise((resolve) => {
      client2.on('webrtc:answer', (data) => resolve(data));
    });

    client1.emit('webrtc:answer', {
      meetingId,
      targetSocketId: client2.id,
      answer: { type: 'answer', sdp: 'fake-sdp-answer' },
    });

    const answerData = await answerPromise;
    assert.strictEqual(answerData.fromSocketId, client1.id);
    assert.strictEqual(answerData.answer.sdp, 'fake-sdp-answer');

    // 5. WebRTC ICE Candidate Forwarding
    const candidatePromise = new Promise((resolve) => {
      client1.on('webrtc:ice-candidate', (data) => resolve(data));
    });

    client2.emit('webrtc:ice-candidate', {
      meetingId,
      targetSocketId: client1.id,
      candidate: { candidate: 'candidate:1 1 UDP ...' },
    });

    const candidateData = await candidatePromise;
    assert.strictEqual(candidateData.candidate.candidate, 'candidate:1 1 UDP ...');

    // 6. Media Status Toggle (Mic / Camera / Speaking)
    const mediaTogglePromise = new Promise((resolve) => {
      client1.on('webrtc:media-toggle', (status) => resolve(status));
    });

    client2.emit('webrtc:media-toggle', {
      meetingId,
      micActive: false,
      cameraActive: true,
      isSpeaking: true,
    });

    const mediaStatus = await mediaTogglePromise;
    assert.strictEqual(mediaStatus.socketId, client2.id);
    assert.strictEqual(mediaStatus.micActive, false);
    assert.strictEqual(mediaStatus.cameraActive, true);
    assert.strictEqual(mediaStatus.isSpeaking, true);

    // 7. Meeting Leave
    const userLeftPromise = new Promise((resolve) => {
      client1.on('meeting:user-left', (data) => resolve(data));
    });

    client2.emit('meeting:leave', { meetingId });
    const leftData = await userLeftPromise;
    assert.strictEqual(leftData.username, 'Habtu');

    client1.disconnect();
    client2.disconnect();
  });
});
