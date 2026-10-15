// server/gameManager.js
export class GameManager {
  constructor(io) {
    this.io = io;
    this.matchmakingQueue = []; // array of { socketId, playerId, playerName, avatar }
    this.rooms = new Map(); // roomId -> RoomData
    this.playerToRoom = new Map(); // socketId -> roomId
  }

  // Handle player entering matchmaking queue
  joinQueue(socket, { playerId, playerName, avatar }) {
    // Remove if already in queue
    this.leaveQueue(socket);

    // If player is already in an active room, handle cleanup
    const existingRoomId = this.playerToRoom.get(socket.id);
    if (existingRoomId) {
      this.leaveRoom(socket);
    }

    const player = {
      socketId: socket.id,
      playerId: playerId || `guest_${socket.id.substring(0, 6)}`,
      playerName: playerName || 'Player',
      avatar: avatar || 'avatar1',
    };

    this.matchmakingQueue.push(player);
    socket.emit('queue_joined', { position: this.matchmakingQueue.length });

    // Check if we can match two players
    this.processQueue();
  }

  leaveQueue(socket) {
    const idx = this.matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (idx !== -1) {
      this.matchmakingQueue.splice(idx, 1);
      socket.emit('queue_left');
    }
  }

  processQueue() {
    while (this.matchmakingQueue.length >= 2) {
      const p1 = this.matchmakingQueue.shift();
      const p2 = this.matchmakingQueue.shift();

      // Check if both sockets are still connected
      const socket1 = this.io.sockets.sockets.get(p1.socketId);
      const socket2 = this.io.sockets.sockets.get(p2.socketId);

      if (!socket1) {
        if (socket2) this.matchmakingQueue.unshift(p2);
        continue;
      }
      if (!socket2) {
        if (socket1) this.matchmakingQueue.unshift(p1);
        continue;
      }

      // Create new match room
      const roomId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      this.createMatchRoom(roomId, p1, p2, false);
    }
  }

  // Create Custom Room for Invite Friend
  createCustomRoom(socket, { playerId, playerName, avatar }) {
    this.leaveQueue(socket);
    this.leaveRoom(socket);

    // Generate readable 6-character code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let roomCode = '';
    for (let i = 0; i < 6; i++) {
      roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const host = {
      socketId: socket.id,
      playerId: playerId || `guest_${socket.id.substring(0, 6)}`,
      playerName: playerName || 'Host',
      avatar: avatar || 'avatar1',
      isHost: true,
      ready: true,
    };

    const roomData = {
      id: roomCode,
      code: roomCode,
      isCustom: true,
      status: 'waiting', // 'waiting' | 'countdown' | 'playing' | 'ended'
      players: [host],
      hostId: socket.id,
      createdAt: Date.now(),
      gameState: null,
    };

    this.rooms.set(roomCode, roomData);
    this.playerToRoom.set(socket.id, roomCode);
    socket.join(roomCode);

    socket.emit('custom_room_created', {
      roomCode,
      players: roomData.players,
    });
  }

  joinCustomRoom(socket, { roomCode, playerId, playerName, avatar }) {
    this.leaveQueue(socket);
    this.leaveRoom(socket);

    const code = (roomCode || '').trim().toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      socket.emit('room_error', { message: 'Room tidak ditemukan atau sudah berakhir.' });
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('room_error', { message: 'Room sudah penuh (maksimal 2 pemain).' });
      return;
    }

    if (room.status !== 'waiting') {
      socket.emit('room_error', { message: 'Pertandingan di room ini sudah berlangsung.' });
      return;
    }

    const guest = {
      socketId: socket.id,
      playerId: playerId || `guest_${socket.id.substring(0, 6)}`,
      playerName: playerName || 'Challenger',
      avatar: avatar || 'avatar2',
      isHost: false,
      ready: true,
    };

    room.players.push(guest);
    this.playerToRoom.set(socket.id, code);
    socket.join(code);

    this.io.to(code).emit('custom_room_updated', {
      roomCode: code,
      players: roomDataFormatted(room.players),
      canStart: true,
    });

    // Automatically start countdown after short preparation delay
    setTimeout(() => {
      if (this.rooms.has(code) && this.rooms.get(code).players.length === 2 && this.rooms.get(code).status === 'waiting') {
        const p1 = room.players[0];
        const p2 = room.players[1];
        this.initializeMatch(room, p1, p2);
      }
    }, 1500);
  }

  createMatchRoom(roomId, p1, p2, isCustom = false) {
    const s1 = this.io.sockets.sockets.get(p1.socketId);
    const s2 = this.io.sockets.sockets.get(p2.socketId);

    if (s1) s1.join(roomId);
    if (s2) s2.join(roomId);

    this.playerToRoom.set(p1.socketId, roomId);
    this.playerToRoom.set(p2.socketId, roomId);

    const roomData = {
      id: roomId,
      code: isCustom ? roomId : null,
      isCustom,
      status: 'countdown',
      players: [p1, p2],
      gameState: null,
      roundTimer: null,
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, roomData);
    this.initializeMatch(roomData, p1, p2);
  }

  initializeMatch(roomData, p1, p2) {
    const roomId = roomData.id;
    roomData.status = 'countdown';

    // Notify both players that match is found
    const s1 = this.io.sockets.sockets.get(p1.socketId);
    const s2 = this.io.sockets.sockets.get(p2.socketId);

    if (s1) {
      s1.emit('match_found', {
        roomId,
        role: 'player1',
        me: p1,
        opponent: p2,
      });
    }
    if (s2) {
      s2.emit('match_found', {
        roomId,
        role: 'player2',
        me: p2,
        opponent: p1,
      });
    }

    // Initialize game balance state
    // tilt: 0 is center. +1 is player 1 win (opponent pinned). -1 is player 2 win (player 1 pinned).
    // Target threshold: 6 points difference to pin
    const MAX_POINTS = 6;
    roomData.gameState = {
      p1Score: 0,
      p2Score: 0,
      p1Streak: 0,
      p2Streak: 0,
      p1Stats: { hits: 0, misses: 0, maxStreak: 0 },
      p2Stats: { hits: 0, misses: 0, maxStreak: 0 },
      tilt: 0.0, // range -1.0 to 1.0
      currentRound: 0,
      clockwise: true,
      activeRoundData: null,
      isFinished: false,
      startTime: Date.now(),
    };

    // 3, 2, 1, FIGHT countdown
    let count = 3;
    const countInterval = setInterval(() => {
      this.io.to(roomId).emit('countdown_tick', { count });
      count--;
      if (count < 0) {
        clearInterval(countInterval);
        roomData.status = 'playing';
        this.io.to(roomId).emit('match_start');
        this.startNextRound(roomData);
      }
    }, 1000);
  }

  startNextRound(roomData) {
    if (!roomData || roomData.status !== 'playing' || roomData.gameState.isFinished) return;

    const gs = roomData.gameState;
    gs.currentRound++;

    // Alternating direction: round 1 clockwise, round 2 counter-clockwise, etc.
    gs.clockwise = gs.currentRound % 2 === 1;

    // Target angle between 30 and 330 degrees
    const targetAngle = Math.floor(Math.random() * 300) + 30;

    // Dynamic difficulty: as round increases, needle spins slightly faster and target shrinks
    const roundFactor = Math.min(gs.currentRound, 15);
    const targetSize = Math.max(30, 56 - roundFactor * 1.6); // degrees
    const needleSpeed = Math.min(420, 240 + roundFactor * 12); // degrees per second

    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const targetColor = colors[(gs.currentRound - 1) % colors.length];

    const roundData = {
      roundNumber: gs.currentRound,
      targetAngle,
      targetSize,
      needleSpeed,
      clockwise: gs.clockwise,
      targetColor,
      startTime: Date.now(),
      duration: 360 / needleSpeed * 1000 * 2.5, // allow 2.5 full rotations
      p1Submitted: false,
      p2Submitted: false,
    };

    gs.activeRoundData = roundData;

    this.io.to(roomData.id).emit('round_start', {
      roundNumber: roundData.roundNumber,
      targetAngle: roundData.targetAngle,
      targetSize: roundData.targetSize,
      needleSpeed: roundData.needleSpeed,
      clockwise: roundData.clockwise,
      targetColor: roundData.targetColor,
      startTime: roundData.startTime,
    });

    // Auto expire round if no one hits in time
    if (roomData.roundTimer) clearTimeout(roomData.roundTimer);
    roomData.roundTimer = setTimeout(() => {
      if (roomData.status === 'playing' && !gs.isFinished && gs.activeRoundData?.roundNumber === roundData.roundNumber) {
        // If someone didn't submit, count as miss
        this.evaluateRoundTimeout(roomData);
      }
    }, roundData.duration + 500);
  }

  handlePlayerInput(socket, { roundNumber, hit, accuracy }) {
    const roomId = this.playerToRoom.get(socket.id);
    if (!roomId) return;
    const roomData = this.rooms.get(roomId);
    if (!roomData || roomData.status !== 'playing') return;

    const gs = roomData.gameState;
    if (gs.isFinished) return;

    const rd = gs.activeRoundData;
    if (!rd || rd.roundNumber !== roundNumber) return;

    const isP1 = roomData.players[0].socketId === socket.id;
    const isP2 = roomData.players[1].socketId === socket.id;

    if (isP1) {
      if (rd.p1Submitted) return; // Prevent double input in same round
      rd.p1Submitted = true;
      this.applyPlayerScore(gs, 'p1', hit, accuracy);
    } else if (isP2) {
      if (rd.p2Submitted) return;
      rd.p2Submitted = true;
      this.applyPlayerScore(gs, 'p2', hit, accuracy);
    }

    // Broadcast current game state
    this.broadcastGameState(roomData, isP1 ? 'p1' : 'p2', hit);

    // If both submitted, schedule next round immediately
    if (rd.p1Submitted && rd.p2Submitted) {
      if (roomData.roundTimer) clearTimeout(roomData.roundTimer);
      if (!gs.isFinished) {
        setTimeout(() => this.startNextRound(roomData), 50);
      }
    }
  }

  evaluateRoundTimeout(roomData) {
    const gs = roomData.gameState;
    const rd = gs.activeRoundData;
    if (!rd) return;

    if (!rd.p1Submitted) {
      rd.p1Submitted = true;
      this.applyPlayerScore(gs, 'p1', false, 0);
    }
    if (!rd.p2Submitted) {
      rd.p2Submitted = true;
      this.applyPlayerScore(gs, 'p2', false, 0);
    }

    this.broadcastGameState(roomData, null, false);

    if (!gs.isFinished) {
      setTimeout(() => this.startNextRound(roomData), 50);
    }
  }

  applyPlayerScore(gs, playerKey, hit, accuracy = 1) {
    const isP1 = playerKey === 'p1';
    const stats = isP1 ? gs.p1Stats : gs.p2Stats;

    if (hit) {
      stats.hits++;
      if (isP1) {
        gs.p1Streak++;
        stats.maxStreak = Math.max(stats.maxStreak, gs.p1Streak);
        gs.p1Score += 1;
      } else {
        gs.p2Streak++;
        stats.maxStreak = Math.max(stats.maxStreak, gs.p2Streak);
        gs.p2Score += 1;
      }
    } else {
      stats.misses++;
      if (isP1) {
        gs.p1Streak = 0;
        gs.p1Score = Math.max(0, gs.p1Score - 1);
      } else {
        gs.p2Streak = 0;
        gs.p2Score = Math.max(0, gs.p2Score - 1);
      }
    }

    // Calculate dynamic tilt:
    // Range is -1.0 to 1.0. A net difference of 6 points pins the opponent.
    const diff = gs.p1Score - gs.p2Score;
    const MAX_PIN_POINTS = 6;
    gs.tilt = Math.max(-1.0, Math.min(1.0, diff / MAX_PIN_POINTS));

    // Check Win/Loss conditions
    if (gs.tilt >= 1.0) {
      this.endMatch(gs, 'player1', 'pin');
    } else if (gs.tilt <= -1.0) {
      this.endMatch(gs, 'player2', 'pin');
    }
  }

  broadcastGameState(roomData, actingPlayer, hit) {
    const gs = roomData.gameState;
    this.io.to(roomData.id).emit('game_state_update', {
      tilt: gs.tilt,
      p1Score: gs.p1Score,
      p2Score: gs.p2Score,
      p1Streak: gs.p1Streak,
      p2Streak: gs.p2Streak,
      actingPlayer,
      hit,
    });
  }

  endMatch(roomDataOrGs, winnerRole, reason) {
    // If passed gameState directly, find room
    let targetRoom = null;
    for (const [rId, room] of this.rooms.entries()) {
      if (room.gameState === roomDataOrGs) {
        targetRoom = room;
        break;
      }
    }
    if (!targetRoom && roomDataOrGs.id) {
      targetRoom = roomDataOrGs;
    }
    if (!targetRoom) return;

    const gs = targetRoom.gameState;
    if (gs.isFinished) return;
    gs.isFinished = true;
    targetRoom.status = 'ended';

    if (targetRoom.roundTimer) clearTimeout(targetRoom.roundTimer);

    const p1 = targetRoom.players[0];
    const p2 = targetRoom.players[1];

    const isP1Winner = winnerRole === 'p1' || winnerRole === 'player1';
    const normalizedWinnerRole = isP1Winner ? 'player1' : 'player2';
    const normalizedRoleShort = isP1Winner ? 'p1' : 'p2';

    const matchResult = {
      winnerRole: normalizedWinnerRole,
      winnerRoleShort: normalizedRoleShort,
      winnerName: isP1Winner ? p1.playerName : p2.playerName,
      winnerId: isP1Winner ? p1.playerId : p2.playerId,
      reason,
      p1Stats: gs.p1Stats,
      p2Stats: gs.p2Stats,
      duration: Math.round((Date.now() - gs.startTime) / 1000),
      finalTilt: gs.tilt,
    };

    this.io.to(targetRoom.id).emit('match_ended', matchResult);
  }

  leaveRoom(socket) {
    const roomId = this.playerToRoom.get(socket.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    this.playerToRoom.delete(socket.id);

    if (!room) return;

    socket.leave(roomId);

    // If waiting in custom room
    if (room.status === 'waiting') {
      room.players = room.players.filter(p => p.socketId !== socket.id);
      if (room.players.length === 0) {
        this.rooms.delete(roomId);
      } else {
        // If host left, make guest the host
        if (room.hostId === socket.id) {
          room.hostId = room.players[0].socketId;
          room.players[0].isHost = true;
        }
        this.io.to(roomId).emit('custom_room_updated', {
          roomCode: room.code,
          players: roomDataFormatted(room.players),
          canStart: false,
        });
      }
      return;
    }

    // If game in progress
    if (room.status === 'playing' || room.status === 'countdown') {
      const remainingPlayer = room.players.find(p => p.socketId !== socket.id);
      const disconnectedPlayer = room.players.find(p => p.socketId === socket.id);

      if (remainingPlayer && !room.gameState?.isFinished) {
        const isRemainingP1 = room.players[0].socketId === remainingPlayer.socketId;
        this.endMatch(room, isRemainingP1 ? 'player1' : 'player2', 'forfeit');
        this.io.to(remainingPlayer.socketId).emit('opponent_left', {
          message: `${disconnectedPlayer?.playerName || 'Lawan'} telah keluar dari pertandingan.`,
        });
      }

      this.rooms.delete(roomId);
    }
  }

  handleDisconnect(socket) {
    this.leaveQueue(socket);

    const roomId = this.playerToRoom.get(socket.id);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room) {
      this.playerToRoom.delete(socket.id);
      return;
    }

    // In waiting rooms, leave immediately
    if (room.status === 'waiting') {
      this.leaveRoom(socket);
      return;
    }

    // In active match, allow 4 seconds for transient reconnection before forfeiting
    if (room.status === 'playing' || room.status === 'countdown') {
      if (room.disconnectTimer) clearTimeout(room.disconnectTimer);
      room.disconnectTimer = setTimeout(() => {
        if (!room.gameState?.isFinished && this.rooms.has(roomId)) {
          this.leaveRoom(socket);
        }
      }, 4000);
    }
  }
}

function roomDataFormatted(players) {
  return players.map(p => ({
    playerId: p.playerId,
    playerName: p.playerName,
    avatar: p.avatar,
    isHost: p.isHost,
  }));
}
