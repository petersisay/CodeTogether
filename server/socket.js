import Message from './models/Message.js';
import Room from './models/Room.js';
import mongoose from 'mongoose';
import { verifyToken } from './middleware/auth.js';
import { initialRoomData, isUserAuthorizedForRoom } from './routes/roomRoutes.js';

// Map of active rooms -> Map of socket.id -> user info
const activeRoomSessions = new Map();

export function getRoomOnlineCount(roomName) {
  return activeRoomSessions.get(roomName)?.size || 0;
}

// Map of active meetings -> Map of socket.id -> participant info
const activeMeetingSessions = new Map();

// File version tracking: `${room}:${file}` -> versionNumber
const fileVersions = new Map();

export function setupSocket(io) {
  // 0. Handshake Authentication Middleware
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization &&
        socket.handshake.headers.authorization.split(' ')[1]);

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        socket.user = decoded; // { id, username, email, avatar }
        return next();
      }
    }
    // Allow unauthenticated connection but mark user as null
    socket.user = null;
    next();
  });

  io.on('connection', (socket) => {
    let currentRoom = null;
    let currentMeeting = null;
    let currentFile = 'App.jsx';

    console.log(`[Socket] Connected: ${socket.id} (Authenticated: ${socket.user ? socket.user.username : 'Anonymous'})`);

    // Dynamic re-authentication after login
    socket.on('auth:authenticate', ({ token }) => {
      if (!token) return;
      const decoded = verifyToken(token);
      if (decoded) {
        socket.user = decoded;
        socket.emit('auth:success', { user: socket.user });
        console.log(`[Socket] Socket ${socket.id} authenticated as ${socket.user.username}`);
      } else {
        socket.emit('auth:error', { error: 'Invalid or expired token' });
      }
    });

    // Helper to broadcast presence for a workspace room
    const broadcastPresence = (roomName) => {
      if (!roomName) return;
      const roomMap = activeRoomSessions.get(roomName);
      const participants = [];

      if (roomMap && roomMap.size > 0) {
        for (const [sId, info] of roomMap.entries()) {
          participants.push({
            id: sId,
            name: info.name,
            avatar: info.avatar,
            activity: info.activity || `Editing ${info.currentFile || 'App.jsx'}`,
            statusColor: 'bg-emerald-400',
          });
        }
      }

      io.to(roomName).emit('presence:list', {
        room: roomName,
        count: participants.length,
        collaborators: participants,
      });
    };

    // =========================================================================
    // 1. WORKSPACE COLLABORATION EVENTS
    // =========================================================================

    // Join Collaboration Room
    socket.on('room:join', async ({ room = 'ASTU_DreamTeam', file = 'App.jsx' }) => {
      if (!socket.user) {
        return socket.emit('error:unauthorized', {
          message: 'Authentication required to join collaboration room',
        });
      }

      // Verify room-level authorization for private rooms
      const isConnected = mongoose.connection.readyState === 1;
      let roomDoc = null;
      if (isConnected) {
        try {
          roomDoc = await Room.findOne({ name: room }).lean();
        } catch (e) {}
      } else if (initialRoomData[room]) {
        roomDoc = initialRoomData[room];
      }

      if (roomDoc && !isUserAuthorizedForRoom(roomDoc, socket.user.username)) {
        return socket.emit('error:unauthorized', {
          message: 'Access denied: You are not authorized to join this private room',
        });
      }

      // Leave previous room if any
      if (currentRoom) {
        socket.leave(currentRoom);
        const prevMap = activeRoomSessions.get(currentRoom);
        if (prevMap) {
          prevMap.delete(socket.id);
          broadcastPresence(currentRoom);
        }
      }

      currentRoom = room;
      currentFile = file;
      const currentUser = socket.user.username;
      const currentAvatar = socket.user.avatar || '';

      socket.join(room);

      if (!activeRoomSessions.has(room)) {
        activeRoomSessions.set(room, new Map());
      }

      activeRoomSessions.get(room).set(socket.id, {
        name: currentUser,
        avatar: currentAvatar,
        currentFile,
        activity: `Editing ${currentFile}`,
      });

      console.log(`[Socket] Verified User '${currentUser}' joined room '${room}'`);
      broadcastPresence(room);

      // Send initial room files to client
      let roomFiles = {};

      if (isConnected) {
        try {
          const dbRoom = await Room.findOne({ name: room }).lean();
          if (dbRoom && dbRoom.files) {
            dbRoom.files.forEach((f) => {
              roomFiles[f.filename] = f.content;
            });
          }
        } catch (e) {
          console.error('[Socket Room State DB Error]:', e);
        }
      }

      if (Object.keys(roomFiles).length === 0 && initialRoomData[room]?.files) {
        initialRoomData[room].files.forEach((f) => {
          roomFiles[f.filename] = f.content;
        });
      }

      socket.emit('room:state', {
        room,
        files: roomFiles,
      });
    });

    // Active File Switch
    socket.on('file:switch', ({ room, file }) => {
      const targetRoom = room || currentRoom;
      if (!targetRoom) return;

      currentFile = file;
      const roomMap = activeRoomSessions.get(targetRoom);
      if (roomMap && roomMap.has(socket.id)) {
        const userObj = roomMap.get(socket.id);
        userObj.currentFile = file;
        userObj.activity = `Editing ${file}`;
        broadcastPresence(targetRoom);
      }
    });

    // Real-Time Code Change with Version Collision Detection
    socket.on('code:change', async ({ room, file, code, version = 0, cursorLine = 1 }) => {
      if (!socket.user) {
        return socket.emit('error:unauthorized', { message: 'Authentication required to edit code' });
      }

      const targetRoom = room || currentRoom;
      if (!targetRoom || !file) return;

      const fileKey = `${targetRoom}:${file}`;
      const serverVersion = (fileVersions.get(fileKey) || 0) + 1;
      fileVersions.set(fileKey, serverVersion);

      // Check collision
      let hasCollision = false;
      if (version > 0 && serverVersion - version > 3) {
        hasCollision = true;
      }

      // Update in memory cache
      if (initialRoomData[targetRoom]) {
        const targetFile = initialRoomData[targetRoom].files.find((f) => f.filename === file);
        if (targetFile) {
          targetFile.content = code;
        } else {
          initialRoomData[targetRoom].files.push({
            filename: file,
            content: code,
            language: file.endsWith('.css') ? 'css' : 'javascript',
          });
        }
      }

      // Broadcast to other collaborators with version & sender identity
      socket.to(targetRoom).emit('code:update', {
        room: targetRoom,
        file,
        code,
        version: serverVersion,
        sender: socket.user.username,
        cursorLine,
        hasCollision,
      });

      // Update MongoDB asynchronously
      const isConnected = mongoose.connection.readyState === 1;
      if (isConnected) {
        try {
          await Room.findOneAndUpdate(
            { name: targetRoom, 'files.filename': file },
            { $set: { 'files.$.content': code } }
          );
        } catch (err) {
          console.error('[Socket DB Code Save Error]:', err.message);
        }
      }
    });

    // Real-Time Chat Message (Single source of persistence to eliminate duplicates)
    socket.on('chat:send', async ({ room, text }) => {
      if (!socket.user) {
        return socket.emit('error:unauthorized', { message: 'Authentication required to send chat' });
      }

      const targetRoom = room || currentRoom;
      if (!targetRoom || !text || !text.trim()) return;

      const senderName = socket.user.username;
      const senderAvatar = socket.user.avatar || '';
      const now = new Date();
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

      const messageObj = {
        id: Date.now(),
        room: targetRoom,
        sender: senderName,
        text: text.trim(),
        avatar: senderAvatar,
        time: timeStr,
      };

      // Store in memory
      if (initialRoomData[targetRoom]) {
        if (!initialRoomData[targetRoom].messages) {
          initialRoomData[targetRoom].messages = [];
        }
        initialRoomData[targetRoom].messages.push(messageObj);
      }

      // Broadcast to everyone in room including sender (or sender ack)
      io.to(targetRoom).emit('chat:message', messageObj);

      // Persist to MongoDB
      const isConnected = mongoose.connection.readyState === 1;
      if (isConnected) {
        try {
          await Message.create({
            room: targetRoom,
            sender: senderName,
            time: timeStr,
            text: text.trim(),
            avatar: senderAvatar,
          });
        } catch (err) {
          console.error('[Socket DB Chat Save Error]:', err.message);
        }
      }
    });

    // File Create / Delete
    socket.on('file:create', ({ room, file }) => {
      if (!socket.user) return;
      const targetRoom = room || currentRoom;
      socket.to(targetRoom).emit('file:created', file);
    });

    socket.on('file:delete', ({ room, filename }) => {
      if (!socket.user) return;
      const targetRoom = room || currentRoom;
      socket.to(targetRoom).emit('file:deleted', { filename });
    });

    // =========================================================================
    // 2. VOICE & VIDEO WEBRTC SIGNALING EVENTS
    // =========================================================================

    // Join Meeting
    socket.on('meeting:join', ({ meetingId, mediaType = 'audio-video' }) => {
      if (!socket.user) {
        return socket.emit('meeting:error', { message: 'Authentication required to join call' });
      }

      if (!meetingId) return;

      // Leave previous meeting if any
      if (currentMeeting && currentMeeting !== meetingId) {
        const prevMeetingMap = activeMeetingSessions.get(currentMeeting);
        if (prevMeetingMap) {
          prevMeetingMap.delete(socket.id);
          socket.to(currentMeeting).emit('meeting:user-left', {
            socketId: socket.id,
            username: socket.user.username,
          });
        }
        socket.leave(currentMeeting);
      }

      currentMeeting = meetingId;
      socket.join(meetingId);

      if (!activeMeetingSessions.has(meetingId)) {
        activeMeetingSessions.set(meetingId, new Map());
      }

      const meetingMap = activeMeetingSessions.get(meetingId);

      const participantInfo = {
        socketId: socket.id,
        userId: socket.user.id,
        username: socket.user.username,
        avatar: socket.user.avatar || '',
        mediaType,
        micActive: true,
        cameraActive: mediaType === 'audio-video',
        isSpeaking: false,
        joinedAt: new Date().toISOString(),
      };

      // Send existing participants to the newly joined peer
      const existingParticipants = Array.from(meetingMap.values());
      socket.emit('meeting:participants', {
        meetingId,
        participants: existingParticipants,
        self: participantInfo,
      });

      // Register new participant
      meetingMap.set(socket.id, participantInfo);

      // Notify others in meeting
      socket.to(meetingId).emit('meeting:user-joined', participantInfo);

      console.log(`[Meeting] User '${socket.user.username}' joined meeting '${meetingId}' (Type: ${mediaType}, Active: ${meetingMap.size})`);
    });

    // WebRTC Offer forwarding
    socket.on('webrtc:offer', ({ targetSocketId, offer, meetingId }) => {
      if (!socket.user || !targetSocketId || !offer) return;
      io.to(targetSocketId).emit('webrtc:offer', {
        fromSocketId: socket.id,
        fromUser: socket.user,
        offer,
        meetingId,
      });
    });

    // WebRTC Answer forwarding
    socket.on('webrtc:answer', ({ targetSocketId, answer, meetingId }) => {
      if (!socket.user || !targetSocketId || !answer) return;
      io.to(targetSocketId).emit('webrtc:answer', {
        fromSocketId: socket.id,
        answer,
        meetingId,
      });
    });

    // WebRTC ICE Candidate forwarding
    socket.on('webrtc:ice-candidate', ({ targetSocketId, candidate, meetingId }) => {
      if (!socket.user || !targetSocketId || !candidate) return;
      io.to(targetSocketId).emit('webrtc:ice-candidate', {
        fromSocketId: socket.id,
        candidate,
        meetingId,
      });
    });

    // Media status toggle (Mute / Unmute / Camera on/off / Speaking indicator)
    socket.on('webrtc:media-toggle', ({ meetingId, micActive, cameraActive, isSpeaking }) => {
      const targetMeeting = meetingId || currentMeeting;
      if (!targetMeeting) return;

      const meetingMap = activeMeetingSessions.get(targetMeeting);
      if (meetingMap && meetingMap.has(socket.id)) {
        const participant = meetingMap.get(socket.id);
        if (typeof micActive === 'boolean') participant.micActive = micActive;
        if (typeof cameraActive === 'boolean') participant.cameraActive = cameraActive;
        if (typeof isSpeaking === 'boolean') participant.isSpeaking = isSpeaking;

        socket.to(targetMeeting).emit('webrtc:media-toggle', {
          socketId: socket.id,
          micActive: participant.micActive,
          cameraActive: participant.cameraActive,
          isSpeaking: participant.isSpeaking,
        });
      }
    });

    // Explicit Leave Meeting
    socket.on('meeting:leave', ({ meetingId }) => {
      const targetMeeting = meetingId || currentMeeting;
      if (!targetMeeting) return;

      const meetingMap = activeMeetingSessions.get(targetMeeting);
      if (meetingMap) {
        meetingMap.delete(socket.id);
        socket.to(targetMeeting).emit('meeting:user-left', {
          socketId: socket.id,
          username: socket.user ? socket.user.username : 'Collaborator',
        });
        if (meetingMap.size === 0) {
          activeMeetingSessions.delete(targetMeeting);
        }
      }

      socket.leave(targetMeeting);
      currentMeeting = null;
      console.log(`[Meeting] Socket ${socket.id} left meeting '${targetMeeting}'`);
    });

    // =========================================================================
    // 3. DISCONNECT & CLEANUP
    // =========================================================================
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);

      // Clean up workspace room
      if (currentRoom) {
        const roomMap = activeRoomSessions.get(currentRoom);
        if (roomMap) {
          roomMap.delete(socket.id);
          broadcastPresence(currentRoom);
        }
      }

      // Clean up meeting session
      if (currentMeeting) {
        const meetingMap = activeMeetingSessions.get(currentMeeting);
        if (meetingMap) {
          meetingMap.delete(socket.id);
          socket.to(currentMeeting).emit('meeting:user-left', {
            socketId: socket.id,
            username: socket.user ? socket.user.username : 'Collaborator',
          });
          if (meetingMap.size === 0) {
            activeMeetingSessions.delete(currentMeeting);
          }
        }
      }
    });
  });
}

