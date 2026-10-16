import Message from './models/Message.js';
import Room from './models/Room.js';

// In-memory store for active room states, participants, and file contents
const memoryStore = {
  rooms: {
    'ASTU_DreamTeam': {
      users: new Map(),
      files: {
        'App.jsx': `import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';

function App() {
  const [messages, setMessages] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('message', (data) => {
        setMessages(prev => [...prev, data]);
      });
    }

    return () => {
      socket?.off('message');
    };
  }, [socket]);

  return (
    <div className="app">
      <h1>CodeTogether</h1>
      <p>Real-time coding. Real connections.</p>
    </div>
  );
}

export default App;`,
        'index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './style.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
        'style.css': `/* CodeTogether styles */
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #070B14;
  color: #F8FAFC;
  font-family: 'Inter', sans-serif;
}

h1 {
  font-size: 2.5rem;
  color: #38BDF8;
  margin-bottom: 0.5rem;
}`,
      },
      messages: [
        {
          id: 1,
          sender: 'Petros',
          time: '10:24',
          text: 'This looks great! 🚀',
          avatar: '/assets/avatar-petros.png',
        },
        {
          id: 2,
          sender: 'Habtu',
          time: '10:25',
          text: 'I added the new function. Check it out.',
          avatar: '/assets/avatar-habtu.png',
        },
        {
          id: 3,
          sender: 'Mekdes',
          time: '10:26',
          text: "Nice! Let's test it now. ✅",
          avatar: '/assets/avatar-mekdes.png',
        },
      ],
    },
    'Web Development': {
      users: new Map(),
      files: {},
      messages: [],
    },
    'React Project': {
      users: new Map(),
      files: {},
      messages: [],
    },
    'General Chat': {
      users: new Map(),
      files: {},
      messages: [],
    },
  },
};

export function setupSocket(io) {
  io.on('connection', (socket) => {
    let currentRoom = null;
    let currentUser = null;

    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join room
    socket.on('room:join', async ({ room = 'ASTU_DreamTeam', user = 'Petros' }) => {
      if (currentRoom) {
        socket.leave(currentRoom);
        if (memoryStore.rooms[currentRoom]) {
          memoryStore.rooms[currentRoom].users.delete(socket.id);
          io.to(currentRoom).emit('presence:update', {
            room: currentRoom,
            count: memoryStore.rooms[currentRoom].users.size,
          });
        }
      }

      currentRoom = room;
      currentUser = user;
      socket.join(room);

      // Initialize room in memory if not exists
      if (!memoryStore.rooms[room]) {
        memoryStore.rooms[room] = { users: new Map(), files: {}, messages: [] };
      }

      memoryStore.rooms[room].users.set(socket.id, {
        id: socket.id,
        user,
        joinedAt: new Date(),
      });

      console.log(`[Socket] User '${user}' joined room '${room}' (socket: ${socket.id})`);

      // Broadcast updated count
      io.to(room).emit('presence:update', {
        room,
        count: memoryStore.rooms[room].users.size,
      });

      // Send initial state to the joining user
      socket.emit('room:state', {
        room,
        files: memoryStore.rooms[room].files,
        messages: memoryStore.rooms[room].messages,
      });
    });

    // Real-time code change
    socket.on('code:change', async ({ room, file, code }) => {
      const targetRoom = room || currentRoom;
      if (!targetRoom) return;

      if (!memoryStore.rooms[targetRoom]) {
        memoryStore.rooms[targetRoom] = { users: new Map(), files: {}, messages: [] };
      }

      // Update memory store
      memoryStore.rooms[targetRoom].files[file] = code;

      // Broadcast to other collaborators in room
      socket.to(targetRoom).emit('code:update', {
        file,
        code,
        sender: currentUser,
      });

      // Optional async save to MongoDB if connected
      try {
        await Room.findOneAndUpdate(
          { name: targetRoom, 'files.filename': file },
          { $set: { 'files.$.content': code } },
          { upsert: false }
        ).catch(() => {});
      } catch (err) {}
    });

    // Real-time chat message
    socket.on('chat:send', async ({ room, message }) => {
      const targetRoom = room || currentRoom;
      if (!targetRoom || !message) return;

      if (!memoryStore.rooms[targetRoom]) {
        memoryStore.rooms[targetRoom] = { users: new Map(), files: {}, messages: [] };
      }

      memoryStore.rooms[targetRoom].messages.push(message);

      // Broadcast to all participants in the room except sender (sender adds locally)
      socket.to(targetRoom).emit('chat:message', message);

      // Optional async save to MongoDB
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

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      if (currentRoom && memoryStore.rooms[currentRoom]) {
        memoryStore.rooms[currentRoom].users.delete(socket.id);
        io.to(currentRoom).emit('presence:update', {
          room: currentRoom,
          count: memoryStore.rooms[currentRoom].users.size,
        });
      }
    });
  });
}
