import express from 'express';
import Room from '../models/Room.js';
import Message from '../models/Message.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'CodeTogether',
    tagline: 'Code • Collaborate • Build Together',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Get all rooms
router.get('/rooms', async (req, res) => {
  try {
    const defaultRooms = [
      { name: 'ASTU_DreamTeam', online: 3, dotColor: 'bg-emerald-400' },
      { name: 'Web Development', online: 2, dotColor: 'bg-emerald-400' },
      { name: 'React Project', online: 1, dotColor: 'bg-blue-400' },
      { name: 'General Chat', online: 0, dotColor: 'bg-slate-500' },
    ];

    try {
      const dbRooms = await Room.find().lean();
      if (dbRooms && dbRooms.length > 0) {
        return res.json(dbRooms);
      }
    } catch (e) {}

    res.json(defaultRooms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get room details & files
router.get('/rooms/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const room = await Room.findOne({ name }).lean();
    if (room) {
      return res.json(room);
    }
    res.json({
      name,
      description: 'Collaborative coding workspace',
      files: [],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Get messages for a room
router.get('/rooms/:name/messages', async (req, res) => {
  const { name } = req.params;
  try {
    const messages = await Message.find({ room: name }).sort({ createdAt: 1 }).lean();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Post a new message
router.post('/rooms/:name/messages', async (req, res) => {
  const { name } = req.params;
  const { sender, text, time, avatar } = req.body;

  if (!sender || !text) {
    return res.status(400).json({ error: 'Sender and text are required' });
  }

  try {
    const newMsg = await Message.create({
      room: name,
      sender,
      text,
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: avatar || '/assets/avatar-petros.png',
    });
    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save message' });
  }
});

export default router;
