import Message from './models/Message.js';
import Room from './models/Room.js';
import { initialRoomData } from './routes/roomRoutes.js';

// Map of active rooms -> Map of socket.id -> user info
const activeRoomSessions = new Map();

export function setupSocket(io) {
  io.on('connection', (socket) => {
    let currentRoom = null;
    let currentUser = null;
    let currentAvatar = '/assets/avatar-petros.png';
    let currentFile = 'App.jsx';

    console.log(`[Socket] Connected: ${socket.id}`);

    // Helper to broadcast presence for a room
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

      // If room has participants, broadcast real list
      io.to(roomName).emit('presence:list', {
        room: roomName,
        count: participants.length,
        collaborators: participants,
      });
    };

    // 1. JOIN ROOM
    socket.on('room:join', async ({ room = 'ASTU_DreamTeam', user = 'Petros', avatar, file = 'App.jsx' }) => {
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
      currentUser = user;
      currentAvatar = avatar || '/assets/avatar-petros.png';
      currentFile = file;

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

      console.log(`[Socket] User '${currentUser}' joined '${room}' (socket: ${socket.id})`);

      // Broadcast updated presence to everyone in the room
      broadcastPresence(room);

      // Send initial room files and messages to the newly joined client
      let roomFiles = {};
      if (initialRoomData[room] && initialRoomData[room].files) {
        initialRoomData[room].files.forEach((f) => {
          roomFiles[f.filename] = f.content;
        });
      }

      socket.emit('room:state', {
        room,
        files: roomFiles,
      });
    });

    // 2. ACTIVE FILE SWITCH
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

    // 3. CODE CHANGE SYNC
    socket.on('code:change', async ({ room, file, code }) => {
      const targetRoom = room || currentRoom;
      if (!targetRoom || !file) return;

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

      // Broadcast to other collaborators in room
      socket.to(targetRoom).emit('code:update', {
        room: targetRoom,
        file,
        code,
        sender: currentUser,
      });

      // Update MongoDB asynchronously
      try {
        await Room.findOneAndUpdate(
          { name: targetRoom, 'files.filename': file },
          { $set: { 'files.$.content': code } }
        ).catch(() => {});
      } catch (err) {}
    });

    // 4. CHAT MESSAGE SYNC
    socket.on('chat:send', async ({ room, message }) => {
      const targetRoom = room || currentRoom;
      if (!targetRoom || !message) return;

      // Store in memory
      if (initialRoomData[targetRoom]) {
        if (!initialRoomData[targetRoom].messages) {
          initialRoomData[targetRoom].messages = [];
        }
        initialRoomData[targetRoom].messages.push(message);
      }

      // Broadcast to everyone else in room
      socket.to(targetRoom).emit('chat:message', message);

      // Persist to MongoDB
      try {
        await Message.create({
          room: targetRoom,
          sender: message.sender,
          time: message.time,
          text: message.text,
          avatar: message.avatar,
        }).catch(() => {});
      } catch (err) {}
    });

    // 5. FILE CREATED OR DELETED
    socket.on('file:create', ({ room, file }) => {
      const targetRoom = room || currentRoom;
      socket.to(targetRoom).emit('file:created', file);
    });

    socket.on('file:delete', ({ room, filename }) => {
      const targetRoom = room || currentRoom;
      socket.to(targetRoom).emit('file:deleted', { filename });
    });

    // 6. DISCONNECT
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      if (currentRoom) {
        const roomMap = activeRoomSessions.get(currentRoom);
        if (roomMap) {
          roomMap.delete(socket.id);
          broadcastPresence(currentRoom);
        }
      }
    });
  });
}
