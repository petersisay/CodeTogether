import http from 'http';
import { performance } from 'perf_hooks';
import express from 'express';
import { io } from 'socket.io-client';
import authRoutes from '../routes/authRoutes.js';
import roomRoutes from '../routes/roomRoutes.js';
import { generateToken } from '../middleware/auth.js';

async function runBenchmark() {
  console.log('====================================================');
  console.log('   CodeTogether — System Performance & Speed Test   ');
  console.log('====================================================\n');

  // Set up lightweight measurement server
  const app = express();
  app.use(express.json());
  app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);

  let server;
  let port;
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  });

  const baseUrl = `http://localhost:${port}`;
  const iterations = 50;

  try {
    // 1. Health API Benchmark
    const healthTimings = [];
    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now();
      const res = await fetch(`${baseUrl}/api/health`);
      await res.json();
      const t1 = performance.now();
      healthTimings.push(t1 - t0);
    }
    const avgHealth = (healthTimings.reduce((a, b) => a + b, 0) / iterations).toFixed(2);
    const minHealth = Math.min(...healthTimings).toFixed(2);
    const maxHealth = Math.max(...healthTimings).toFixed(2);

    console.log(`[API Benchmark] GET /api/health (${iterations} iterations):`);
    console.log(`  -> Average latency: ${avgHealth} ms`);
    console.log(`  -> Min: ${minHealth} ms | Max: ${maxHealth} ms\n`);

    // 2. Rooms API Benchmark
    const roomTimings = [];
    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now();
      const res = await fetch(`${baseUrl}/api/rooms`);
      await res.json();
      const t1 = performance.now();
      roomTimings.push(t1 - t0);
    }
    const avgRooms = (roomTimings.reduce((a, b) => a + b, 0) / iterations).toFixed(2);
    const minRooms = Math.min(...roomTimings).toFixed(2);
    const maxRooms = Math.max(...roomTimings).toFixed(2);

    console.log(`[API Benchmark] GET /api/rooms (${iterations} iterations):`);
    console.log(`  -> Average latency: ${avgRooms} ms`);
    console.log(`  -> Min: ${minRooms} ms | Max: ${maxRooms} ms\n`);

    // 3. JWT Token Generation & Verification Speed
    const jwtTimings = [];
    for (let i = 0; i < 500; i++) {
      const t0 = performance.now();
      generateToken({ id: 'bench_user_' + i, username: 'bench_coder', email: 'bench@gmail.com' });
      const t1 = performance.now();
      jwtTimings.push(t1 - t0);
    }
    const avgJwt = (jwtTimings.reduce((a, b) => a + b, 0) / 500).toFixed(4);
    console.log(`[Auth Benchmark] JWT Token Generation (500 tokens):`);
    console.log(`  -> Average generation time: ${avgJwt} ms per token`);
    console.log(`  -> Throughput: ~${Math.round(1000 / avgJwt)} ops/sec\n`);

    console.log('====================================================');
    console.log('   All Performance Benchmarks Completed Successfully');
    console.log('====================================================');
  } finally {
    server.close();
  }
}

runBenchmark();
