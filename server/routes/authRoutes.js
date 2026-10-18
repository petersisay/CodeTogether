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

// Helper: Validate Google Credential Token with strict security checks
export async function validateGoogleCredential(credential) {
  if (!credential) {
    const err = new Error('Google ID token credential is required');
    err.status = 400;
    throw err;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error('Google authentication is not configured on this server');
    err.status = 500;
    throw err;
  }

  let payload;
  try {
    payload = await verifyGoogleIdToken(credential, clientId);
  } catch (err) {
    const error = new Error('Invalid or expired Google credential');
    error.status = 401;
    throw error;
  }

  if (!payload || !payload.sub) {
    const err = new Error('Invalid Google token: missing subject identifier');
    err.status = 401;
    throw err;
  }

  // Verify audience
  if (payload.aud !== clientId) {
    const err = new Error('Token audience does not match configured Google Client ID');
    err.status = 401;
    throw err;
  }

  // Verify issuer
  const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
  if (!validIssuers.includes(payload.iss)) {
    const err = new Error('Invalid token issuer');
    err.status = 401;
    throw err;
  }

  // Check expiration
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSec) {
    const err = new Error('Google ID token has expired');
    err.status = 401;
    throw err;
  }

  // Enforce verified email policy
  if (payload.email_verified === false) {
    const err = new Error('Google account email must be verified');
    err.status = 403;
    throw err;
  }

  if (!payload.email) {
    const err = new Error('Google token does not contain an email address');
    err.status = 400;
    throw err;
  }

  const googleId = payload.sub;
  const email = payload.email.trim().toLowerCase();
  const displayName = (payload.name && payload.name.trim()) || email.split('@')[0];
  const avatar = payload.picture || '';

  return { payload, googleId, email, displayName, avatar };
}

// 1. GOOGLE VERIFY ENDPOINT (Checks if account exists, returns user profile or prompts for username)
router.post('/google/verify', async (req, res) => {
  try {
    const { credential } = req.body;
    const { googleId, email, displayName, avatar } = await validateGoogleCredential(credential);

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      let user = await User.findOne({ googleId });
      if (!user) {
        user = await User.findOne({ email });
      }

      if (user) {
        const token = generateToken({
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          authProvider: user.authProvider || 'google',
        });

        return res.json({
          exists: true,
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            authProvider: user.authProvider || 'google',
          },
        });
      }

      const suggestedUsername = displayName
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20) || email.split('@')[0].replace(/[^a-z0-9_]/g, '');

      return res.json({
        exists: false,
        email,
        displayName,
        avatar,
        suggestedUsername,
      });
    }

    // In-memory fallback
    let memUser = null;
    for (const u of memoryUsers.values()) {
      if (u.googleId === googleId || u.email === email) {
        memUser = u;
        break;
      }
    }

    if (memUser) {
      const token = generateToken({
        id: memUser.id,
        username: memUser.username,
        email: memUser.email,
        avatar: memUser.avatar,
        authProvider: memUser.authProvider || 'google',
      });

      return res.json({
        exists: true,
        token,
        user: {
          id: memUser.id,
          username: memUser.username,
          email: memUser.email,
          avatar: memUser.avatar,
          authProvider: memUser.authProvider || 'google',
        },
      });
    }

    const suggestedUsername = displayName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20) || email.split('@')[0].replace(/[^a-z0-9_]/g, '');

    return res.json({
      exists: false,
      email,
      displayName,
      avatar,
      suggestedUsername,
    });
  } catch (err) {
    console.error('[Google Verify Error]:', err.message);
    return res.status(err.status || 500).json({ error: err.message || 'Google verification failed' });
  }
});

// 2. GOOGLE SIGN-IN & REGISTRATION
router.post('/google', async (req, res) => {
  try {
    const { credential, username: customUsername, password: customPassword } = req.body;
    const { googleId, email, displayName, avatar } = await validateGoogleCredential(credential);

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      // 1. Check if user already linked with this googleId
      let user = await User.findOne({ googleId });

      if (user) {
        // Update avatar if updated in Google profile
        if (avatar && user.avatar !== avatar) {
          user.avatar = avatar;
        }
        // If user is setting a password for subsequent logins
        if (customPassword && customPassword.length >= 6 && !user.password) {
          user.password = customPassword;
        }
        await user.save();
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
          user = existingEmailUser;
        } else {
          // 3. Create new Google user with preferred username and optional password
          const desiredUsername = (customUsername && customUsername.trim()) || displayName;

          if (desiredUsername.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters long' });
          }

          // Check if desired username is already taken by another account
          const usernameConflict = await User.findOne({ username: desiredUsername });
          if (usernameConflict) {
            return res.status(409).json({
              error: `Username "${desiredUsername}" is already taken. Please choose another username.`,
            });
          }

          const newUserDoc = {
            googleId,
            email,
            username: desiredUsername,
            avatar,
            authProvider: 'google',
            emailVerified: true,
          };

          if (customPassword && customPassword.length >= 6) {
            newUserDoc.password = customPassword;
          }

          user = await User.create(newUserDoc);
        }
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

      const desiredUsername = (customUsername && customUsername.trim()) || displayName;
      if (desiredUsername.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long' });
      }

      for (const u of memoryUsers.values()) {
        if (u.username === desiredUsername) {
          return res.status(409).json({
            error: `Username "${desiredUsername}" is already taken. Please choose another username.`,
          });
        }
      }

      let hashedPassword = undefined;
      if (customPassword && customPassword.length >= 6) {
        hashedPassword = await bcrypt.hash(customPassword, 10);
      }

      const newId = 'google_user_' + googleId.slice(-8);
      memUser = {
        id: newId,
        googleId,
        username: desiredUsername,
        email,
        password: hashedPassword,
        avatar,
        authProvider: 'google',
        emailVerified: true,
      };
      memoryUsers.set(newId, memUser);
    } else {
      if (customPassword && customPassword.length >= 6 && !memUser.password) {
        memUser.password = await bcrypt.hash(customPassword, 10);
      }
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
    return res.status(err.status || 500).json({ error: err.message || 'Server error during Google authentication' });
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

      if (!user.password && user.authProvider === 'google') {
        return res.status(401).json({
          error: 'This account was registered with Google without a password. Please sign in using the "Sign in with Google" button.',
        });
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

    if (!memUser.password && memUser.authProvider === 'google') {
      return res.status(401).json({
        error: 'This account was registered with Google without a password. Please sign in using the "Sign in with Google" button.',
      });
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
