import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import apiRoutes from './routes/api.js';
import { setupSocket } from './socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive CORS for smooth deployment across Vercel & Render
    },
    credentials: true,
  })
);

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
});

setupSocket(io);

// Root route
app.get('/', (req, res) => {
  res.send('CodeTogether Backend API & WebSocket Server is Running.');
});

// Start Server
async function startServer() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`[CodeTogether] Server running on port ${PORT}`);
    console.log(`[CodeTogether] REST API ready at http://localhost:${PORT}/api/health`);
  });
}

startServer();
