import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import { setupSocket } from './socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

import { isOriginAllowed } from './utils/corsUtil.js';

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'CodeTogether',
    tagline: 'Code • Collaborate • Build Together',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.send('CodeTogether Backend API & WebSocket Server is Running.');
});

// Global error handling middleware to always return JSON rather than raw HTML 500
app.use((err, req, res, next) => {
  console.error('[Server Error Handler]:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

// Socket.IO Setup with strict CORS matching allowedOrigins
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Socket CORS Error: Origin ${origin} not permitted`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
});

setupSocket(io);


// Start Server
async function startServer() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`[CodeTogether] Server running on port ${PORT}`);
    console.log(`[CodeTogether] REST API ready at http://localhost:${PORT}/api/health`);
  });
}

startServer();
