// server/server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GameManager } from './gameManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Allow frontend connection from localhost:5173 (dev) or production domains
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

const gameManager = new GameManager(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: gameManager.rooms.size,
    queuedPlayers: gameManager.matchmakingQueue.length,
    timestamp: new Date().toISOString(),
  });
});

// Socket.io handlers
io.on('connection', (socket) => {
  // 1. Auto Matchmaking
  socket.on('join_queue', (data) => {
    gameManager.joinQueue(socket, data || {});
  });

  socket.on('leave_queue', () => {
    gameManager.leaveQueue(socket);
  });

  // 2. Custom Room (Invite Friend)
  socket.on('create_custom_room', (data) => {
    gameManager.createCustomRoom(socket, data || {});
  });

  socket.on('join_custom_room', (data) => {
    gameManager.joinCustomRoom(socket, data || {});
  });

  socket.on('leave_custom_room', () => {
    gameManager.leaveRoom(socket);
  });

  // 3. Gameplay Input
  socket.on('submit_timing', (data) => {
    gameManager.handlePlayerInput(socket, data || {});
  });

  // 4. Forfeit / Leave Match
  socket.on('forfeit_match', () => {
    gameManager.leaveRoom(socket);
  });

  // 5. Disconnection
  socket.on('disconnect', () => {
    gameManager.handleDisconnect(socket);
  });
});

// Serve static frontend files if built in client/dist
const distPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[ARM CLASH 3D] Game Server listening on http://localhost:${PORT}`);
});
