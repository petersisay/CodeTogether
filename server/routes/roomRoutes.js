import express from 'express';
import mongoose from 'mongoose';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import { authenticateToken } from '../middleware/auth.js';
import { getRoomOnlineCount } from '../socket.js';

const router = express.Router();


// Default seed rooms and files matching reference image
export const initialRoomData = {
  'ASTU_DreamTeam': {
    name: 'ASTU_DreamTeam',
    description: 'Main project room for ASTU Dream Team collaboration',
    dotColor: 'bg-emerald-400',
    files: [
      {
        filename: 'App.jsx',
        language: 'javascript',
        content: `import { useState, useEffect } from 'react';
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
      },
      {
        filename: 'index.js',
        language: 'javascript',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './style.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      },
      {
        filename: 'style.css',
        language: 'css',
        content: `/* CodeTogether styles */
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
    ],
    messages: [],
  },
  'Web Development': {
    name: 'Web Development',
    description: 'Frontend & backend web development workshop',
    dotColor: 'bg-emerald-400',
    files: [
      {
        filename: 'index.html',
        language: 'html',
        content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Web Development</title>\n</head>\n<body>\n  <h1>Welcome to Web Dev Room</h1>\n</body>\n</html>',
      },
    ],
    messages: [],
  },
  'React Project': {
    name: 'React Project',
    description: 'React components and hooks prototyping',
    dotColor: 'bg-blue-400',
    files: [
      {
        filename: 'Component.jsx',
        language: 'javascript',
        content: 'export default function Component() {\n  return <div>React Component</div>;\n}',
      },
    ],
    messages: [],
  },
  'General Chat': {
    name: 'General Chat',
    description: 'General discussions, questions, and team syncs',
    dotColor: 'bg-slate-500',
    files: [
      {
        filename: 'notes.txt',
        language: 'plaintext',
        content: 'Meeting notes and quick snippets.',
      },
    ],
    messages: [],
  },
};

// 1. GET ALL ROOMS
router.get('/', async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
      const dbRooms = await Room.find().lean();
      if (dbRooms && dbRooms.length > 0) {
        const enrichedRooms = dbRooms.map((r) => ({
          ...r,
          onlineCount: getRoomOnlineCount(r.name),
        }));
        return res.json(enrichedRooms);
      }
    }
  } catch (err) {
    console.error('[Rooms GET Error]:', err);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Failed to retrieve rooms from database' });
    }
  }

  // Fallback memory list
  const list = Object.values(initialRoomData).map((r) => ({
    name: r.name,
    description: r.description,
    dotColor: r.dotColor,
    onlineCount: getRoomOnlineCount(r.name),
    fileCount: r.files ? r.files.length : 0,
  }));
  res.json(list);
});

// 2. CREATE A NEW ROOM (Authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const cleanName = name.trim().replace(/\s+/g, '_');
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      const existing = await Room.findOne({ name: cleanName });
      if (existing) {
        return res.status(409).json({ error: 'Room with this name already exists' });
      }

      const newRoom = await Room.create({
        name: cleanName,
        description: description || 'Collaborative coding room',
        dotColor: 'bg-blue-400',
        creator: req.user.username,
        authorizedUsers: [req.user.username],
        files: [
          {
            filename: 'main.js',
            language: 'javascript',
            content: `// Welcome to ${cleanName}!\nconsole.log("Ready to code together!");\n`,
          },
        ],
      });

      return res.status(201).json(newRoom);
    }

    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Database unavailable in production' });
    }

    // Dev fallback
    if (initialRoomData[cleanName]) {
      return res.status(409).json({ error: 'Room with this name already exists' });
    }

    initialRoomData[cleanName] = {
      name: cleanName,
      description: description || 'Collaborative coding room',
      dotColor: 'bg-blue-400',
      creator: req.user.username,
      authorizedUsers: [req.user.username],
      files: [
        {
          filename: 'main.js',
          language: 'javascript',
          content: `// Welcome to ${cleanName}!\nconsole.log("Ready to code together!");\n`,
        },
      ],
      messages: [],
    };

    return res.status(201).json(initialRoomData[cleanName]);
  } catch (error) {
    console.error('[Room Create Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to create room' });
  }
});

// 3. GET ROOM DETAILS & FILES
router.get('/:name', async (req, res) => {
  const { name } = req.params;

  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
      const dbRoom = await Room.findOne({ name }).lean();
      if (dbRoom) {
        return res.json(dbRoom);
      }
    }
  } catch (err) {
    console.error('[Room Details Error]:', err);
  }

  if (initialRoomData[name]) {
    return res.json(initialRoomData[name]);
  }

  // Create on-the-fly room
  const dynamicRoom = {
    name,
    description: 'Collaborative coding workspace',
    dotColor: 'bg-blue-400',
    files: [
      {
        filename: 'App.jsx',
        language: 'javascript',
        content: `// Room: ${name}\nexport default function App() {\n  return <div>CodeTogether Room: ${name}</div>;\n}`,
      },
    ],
  };
  initialRoomData[name] = dynamicRoom;
  res.json(dynamicRoom);
});

// 4. CREATE NEW FILE IN ROOM (Authenticated)
router.post('/:name/files', authenticateToken, async (req, res) => {
  const { name } = req.params;
  const { filename, content } = req.body;

  if (!filename || !filename.trim()) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  const cleanFilename = filename.trim();

  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
      const dbRoom = await Room.findOne({ name });
      if (dbRoom) {
        const exists = dbRoom.files.some((f) => f.filename === cleanFilename);
        if (exists) {
          return res.status(409).json({ error: 'File already exists in this room' });
        }
        dbRoom.files.push({
          filename: cleanFilename,
          content: content || '',
          language: cleanFilename.endsWith('.css') ? 'css' : 'javascript',
        });
        await dbRoom.save();
        return res.status(201).json({ message: 'File created', file: dbRoom.files[dbRoom.files.length - 1] });
      }
    }
  } catch (err) {
    console.error('[File Create DB Error]:', err);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Failed to create file in database' });
    }
  }

  if (initialRoomData[name]) {
    const exists = initialRoomData[name].files.some((f) => f.filename === cleanFilename);
    if (exists) {
      return res.status(409).json({ error: 'File already exists in this room' });
    }
    const newFile = {
      filename: cleanFilename,
      content: content || `// ${cleanFilename}\n`,
      language: cleanFilename.endsWith('.css') ? 'css' : 'javascript',
    };
    initialRoomData[name].files.push(newFile);
    return res.status(201).json({ message: 'File created', file: newFile });
  }

  res.status(404).json({ error: 'Room not found' });
});

// 5. UPDATE / SAVE FILE CONTENT (Authenticated)
router.put('/:name/files/:filename', authenticateToken, async (req, res) => {
  const { name, filename } = req.params;
  const { content } = req.body;

  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
      const dbRoom = await Room.findOne({ name });
      if (dbRoom) {
        const file = dbRoom.files.find((f) => f.filename === filename);
        if (file) {
          file.content = content;
          await dbRoom.save();
          return res.json({ message: 'File updated successfully', filename });
        }
      }
    }
  } catch (err) {
    console.error('[File Update DB Error]:', err);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Failed to update file in database' });
    }
  }

  if (initialRoomData[name]) {
    const file = initialRoomData[name].files.find((f) => f.filename === filename);
    if (file) {
      file.content = content;
      return res.json({ message: 'File updated successfully', filename });
    }
  }

  res.status(404).json({ error: 'File not found' });
});

// 6. DELETE FILE FROM ROOM (Authenticated)
router.delete('/:name/files/:filename', authenticateToken, async (req, res) => {
  const { name, filename } = req.params;

  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
      const dbRoom = await Room.findOne({ name });
      if (dbRoom) {
        dbRoom.files = dbRoom.files.filter((f) => f.filename !== filename);
        await dbRoom.save();
        return res.json({ message: 'File deleted successfully', filename });
      }
    }
  } catch (err) {
    console.error('[File Delete DB Error]:', err);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Failed to delete file from database' });
    }
  }

  if (initialRoomData[name]) {
    initialRoomData[name].files = initialRoomData[name].files.filter((f) => f.filename !== filename);
    return res.json({ message: 'File deleted successfully', filename });
  }

  res.status(404).json({ error: 'File not found' });
});

// 7. GET CHAT MESSAGES
router.get('/:name/messages', async (req, res) => {
  const { name } = req.params;

  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
      const messages = await Message.find({ room: name }).sort({ createdAt: 1 }).lean();
      if (messages && messages.length > 0) {
        return res.json(messages);
      }
    }
  } catch (err) {
    console.error('[Get Messages DB Error]:', err);
  }

  const memMessages = (initialRoomData[name] && initialRoomData[name].messages) || [];
  res.json(memMessages);
});

// 8. POST CHAT MESSAGE (Authenticated, with sender derived from token)
router.post('/:name/messages', authenticateToken, async (req, res) => {
  const { name } = req.params;
  const { text, avatar, time } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  const senderName = req.user.username;
  const senderAvatar = req.user.avatar || avatar || '';
  const now = new Date();
  const timeStr = time || `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  const messageObj = {
    id: Date.now(),
    room: name,
    sender: senderName,
    text: text.trim(),
    avatar: senderAvatar,
    time: timeStr,
  };

  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
      const created = await Message.create(messageObj);
      return res.status(201).json(created);
    }
  } catch (err) {
    console.error('[Message Post DB Error]:', err);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Failed to persist message' });
    }
  }

  if (initialRoomData[name]) {
    if (!initialRoomData[name].messages) {
      initialRoomData[name].messages = [];
    }
    initialRoomData[name].messages.push(messageObj);
  }

  res.status(201).json(messageObj);
});

// 9. EXPORT ROOM PROJECT FILES (Authenticated)
router.get('/:name/export', authenticateToken, async (req, res) => {
  const { name } = req.params;

  try {
    const isConnected = mongoose.connection.readyState === 1;
    let room = null;

    if (isConnected) {
      room = await Room.findOne({ name }).lean();
    } else if (initialRoomData[name]) {
      room = initialRoomData[name];
    }

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Sanitize file list to ensure no path traversal or directory escaping
    const safeFiles = (room.files || []).map((f) => {
      const cleanPath = (f.filename || '')
        .replace(/\0/g, '')
        .replace(/^[a-zA-Z]:/, '')
        .replace(/\\/g, '/')
        .split('/')
        .filter((part) => part && part !== '.' && part !== '..')
        .join('/');

      return {
        filename: cleanPath || 'unnamed_file',
        content: f.content || '',
        language: f.language || 'plaintext',
      };
    });

    return res.json({
      room: name,
      exportedAt: new Date().toISOString(),
      requestedBy: req.user.username,
      fileCount: safeFiles.length,
      files: safeFiles,
    });
  } catch (err) {
    console.error('[Room Export Error]:', err);
    res.status(500).json({ error: 'Failed to export room files' });
  }
});

export default router;

