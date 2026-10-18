import express from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
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

// 0. GOOGLE ID TOKEN VERIFICATION HELPER
export async function verifyGoogleIdToken(credential, clientId) {
  if (!credential) {
    throw new Error('Missing Google credential');
  }

  // Hook for automated test mock injection
  if (typeof global.__MOCK_GOOGLE_VERIFY__ === 'function') {
    return global.__MOCK_GOOGLE_VERIFY__(credential, clientId);
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });
  return ticket.getPayload();
}

// 1. GOOGLE SIGN-IN
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google ID token credential is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('[Google Auth] GOOGLE_CLIENT_ID environment variable is missing.');
      return res.status(500).json({ error: 'Google authentication is not configured on this server' });
    }

    let payload;
    try {
      payload = await verifyGoogleIdToken(credential, clientId);
    } catch (err) {
      console.error('[Google Auth Error]: Verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid or expired Google credential' });
    }

    if (!payload || !payload.sub) {
      return res.status(401).json({ error: 'Invalid Google token: missing subject identifier' });
    }

    // Verify audience
    if (payload.aud !== clientId) {
      return res.status(401).json({ error: 'Token audience does not match configured Google Client ID' });
    }

    // Verify issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!validIssuers.includes(payload.iss)) {
      return res.status(401).json({ error: 'Invalid token issuer' });
    }

    // Check expiration
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) {
      return res.status(401).json({ error: 'Google ID token has expired' });
    }

    // Enforce verified email policy
    if (payload.email_verified === false) {
      return res.status(403).json({ error: 'Google account email must be verified' });
    }

    if (!payload.email) {
      return res.status(400).json({ error: 'Google token does not contain an email address' });
    }

    const googleId = payload.sub;
    const email = payload.email.trim().toLowerCase();
    const displayName = (payload.name && payload.name.trim()) || email.split('@')[0];
    const avatar = payload.picture || '';

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      // 1. Check if user already linked with this googleId
      let user = await User.findOne({ googleId });

      if (user) {
        // Update avatar if updated in Google profile
        if (avatar && user.avatar !== avatar) {
          user.avatar = avatar;
          await user.save();
        }
      } else {
        // 2. Check if account with same email exists
        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
          if (existingEmailUser.authProvider === 'local' && !existingEmailUser.googleId) {
            return res.status(409).json({
              error: 'An account with this email already exists using password authentication. To prevent unauthorized takeover, automatic account linking is disabled. Please sign in with your password.',
            });
          }
          if (existingEmailUser.googleId && existingEmailUser.googleId !== googleId) {
            return res.status(409).json({
              error: 'An account with this email is already associated with a different Google account.',
            });
          }
        }

        // 3. Create new Google user
        user = await User.create({
          googleId,
          email,
          username: displayName,
          avatar,
          authProvider: 'google',
          emailVerified: true,
        });
      }

      const token = generateToken({
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        authProvider: 'google',
      });

      return res.json({
        message: 'Google authentication successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          authProvider: 'google',
        },
      });
    }

    // In production without DB connection
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        error: 'Database unavailable. Cannot persist Google authentication without MongoDB.',
      });
    }

    // Development offline memory store fallback
    console.warn('[Auth] MongoDB not connected; using development in-memory store for Google auth.');
    let memUser = null;
    for (const u of memoryUsers.values()) {
      if (u.googleId === googleId) {
        memUser = u;
        break;
      }
    }

    if (!memUser) {
      for (const u of memoryUsers.values()) {
        if (u.email === email && (!u.googleId || u.authProvider === 'local')) {
          return res.status(409).json({
            error: 'An account with this email already exists using password authentication. Automatic linking is disabled.',
          });
        }
      }

      const newId = 'google_user_' + googleId.slice(-8);
      memUser = {
        id: newId,
        googleId,
        username: displayName,
        email,
        avatar,
        authProvider: 'google',
        emailVerified: true,
      };
      memoryUsers.set(newId, memUser);
    }

    const token = generateToken({
      id: memUser.id,
      username: memUser.username,
      email: memUser.email,
      avatar: memUser.avatar,
      authProvider: 'google',
    });

    return res.json({
      message: 'Google authentication successful (development mode)',
      token,
      user: {
        id: memUser.id,
        username: memUser.username,
        email: memUser.email,
        avatar: memUser.avatar,
        authProvider: 'google',
      },
    });
  } catch (err) {
    console.error('[Google Auth Unexpected Error]:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'User record collision during sign-in. Please try again.' });
    }
    return res.status(500).json({ error: 'Server error during Google authentication' });
  }
});

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

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      // MongoDB is connected: strictly persist to DB
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
        avatar: avatar || '',
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
    }

    // If MongoDB is NOT connected
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        error: 'Database unavailable. Cannot persist user registration in production without MongoDB.',
      });
    }

    // Safe development fallback only when offline / no DB configured
    console.warn('[Auth] MongoDB not connected; using development in-memory user registry.');
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
      avatar: avatar || '',
      authProvider: 'local',
    };

    memoryUsers.set(newUserId, memoryUser);

    const token = generateToken({
      id: newUserId,
      username,
      email: memoryUser.email,
      avatar: memoryUser.avatar,
    });

    return res.status(201).json({
      message: 'Registration successful (development mode)',
      token,
      user: {
        id: newUserId,
        username,
        email: memoryUser.email,
        avatar: memoryUser.avatar,
      },
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }
    res.status(500).json({ error: error.message || 'Server error during registration' });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

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

    // In production without DB connection
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        error: 'Database unavailable. Cannot authenticate user in production without MongoDB.',
      });
    }

    // Development offline fallback
    console.warn('[Auth] MongoDB not connected; verifying credentials from development memory store.');
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
      message: 'Login successful (development mode)',
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
    res.status(500).json({ error: error.message || 'Server error during login' });
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
