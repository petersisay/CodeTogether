import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Fallback in-memory user registry for seamless local or offline dev
const memoryUsers = new Map();

// Helper to find user in memory by email or username
function findMemoryUser(identifier) {
  for (const user of memoryUsers.values()) {
    if (user.email === identifier.toLowerCase() || user.username === identifier) {
      return user;
    }
  }
  return null;
}

// 1. REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Try MongoDB
    try {
      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username }],
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Username or email already in use' });
      }

      const user = await User.create({
        username,
        email: email.toLowerCase(),
        password,
        avatar: avatar || '/assets/avatar-petros.png',
      });

      const token = generateToken({
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      });

      return res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
      });
    } catch (dbError) {
      // Memory fallback if MongoDB not connected
      if (findMemoryUser(email) || findMemoryUser(username)) {
        return res.status(409).json({ error: 'Username or email already in use' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUserId = 'user_' + Date.now();
      const memoryUser = {
        id: newUserId,
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        avatar: avatar || '/assets/avatar-petros.png',
      };

      memoryUsers.set(newUserId, memoryUser);

      const token = generateToken({
        id: newUserId,
        username,
        email: memoryUser.email,
        avatar: memoryUser.avatar,
      });

      return res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: newUserId,
          username,
          email: memoryUser.email,
          avatar: memoryUser.avatar,
        },
      });
    }
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    // Try MongoDB first
    try {
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      });

      if (user) {
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken({
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        });

        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
          },
        });
      }
    } catch (dbErr) {
      // Continue to check memory
    }

    // Check memory store
    const memUser = findMemoryUser(identifier);
    if (!memUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMemMatch = await bcrypt.compare(password, memUser.password);
    if (!isMemMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: memUser.id,
      username: memUser.username,
      email: memUser.email,
      avatar: memUser.avatar,
    });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: memUser.id,
        username: memUser.username,
        email: memUser.email,
        avatar: memUser.avatar,
      },
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// 3. GET CURRENT USER
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

export default router;
