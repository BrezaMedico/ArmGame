// client/src/App.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SceneManager } from './three/SceneManager';
import { HomeScreen } from './components/HomeScreen';
import { MatchmakingModal } from './components/MatchmakingModal';
import { InviteModal } from './components/InviteModal';
import { HUD } from './components/HUD';
import { TimingNeedle } from './components/TimingNeedle';
import { ResultModal } from './components/ResultModal';
import { soundManager } from './audio/SoundManager';
import { BotEngine } from './bot/BotEngine';

export default function App() {
  const canvasContainerRef = useRef(null);
  const sceneManagerRef = useRef(null);
  const socketRef = useRef(null);
  const botEngineRef = useRef(null);

  // Identity
  const [playerId] = useState(() => {
    let id = localStorage.getItem('armclash_player_id');
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('armclash_player_id', id);
    }
    return id;
  });

  const [playerName, setPlayerName] = useState(() => {
    let name = localStorage.getItem('armclash_player_name');
    if (!name) {
      name = `Player-${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('armclash_player_name', name);
    }
    return name;
  });

  // Game UI Flow State: 'home' | 'matchmaking' | 'invite' | 'countdown' | 'playing' | 'result'
  const [screenState, setScreenState] = useState('home');
  const [serverStatus, setServerStatus] = useState('connecting');

  // Match info
  const [matchType, setMatchType] = useState('bot'); // 'online' | 'bot'
  const [role, setRole] = useState('player1'); // 'player1' | 'player2'
  const [opponent, setOpponent] = useState({ name: 'Lawan', avatar: 'avatar2' });
  const [countdownNumber, setCountdownNumber] = useState(null); // 3, 2, 1, 'FIGHT!'

  // Custom Room state
  const [customRoomCode, setCustomRoomCode] = useState(null);
  const [customPlayers, setCustomPlayers] = useState([]);
  const [roomError, setRoomError] = useState(null);

  // Gameplay state
  const [tilt, setTilt] = useState(0.0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerStreak, setPlayerStreak] = useState(0);
  const [activeRoundData, setActiveRoundData] = useState(null);
  const [matchResult, setMatchResult] = useState(null);

  // Audio state
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);

  const updatePlayerName = (newName) => {
    setPlayerName(newName);
    localStorage.setItem('armclash_player_name', newName);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  const roleRef = useRef('player1');
  const playerNameRef = useRef(playerName);
  const playerIdRef = useRef(playerId);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  // 1. Initialize 3D SceneManager
  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const sm = new SceneManager(canvasContainerRef.current);
    sceneManagerRef.current = sm;

    return () => {
      sm.dispose();
    };
  }, []);

  // 2. Initialize Socket.IO connection (Runs once on mount)
  useEffect(() => {
    const backendUrl = window.location.port === '5173'
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : window.location.origin;

    const s = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });
    socketRef.current = s;

    s.on('connect', () => {
      setServerStatus('connected');
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        setScreenState('invite');
        setCustomRoomCode(roomParam.toUpperCase());
        s.emit('join_custom_room', {
          roomCode: roomParam.toUpperCase(),
          playerId: playerIdRef.current,
          playerName: playerNameRef.current,
        });
      }
    });

    s.on('disconnect', () => {
      setServerStatus('disconnected');
    });

    s.on('connect_error', () => {
      setServerStatus('disconnected');
    });

    // Custom Room events
    s.on('custom_room_created', ({ roomCode, players }) => {
      setCustomRoomCode(roomCode);
      setCustomPlayers(players);
      setRoomError(null);
    });

    s.on('custom_room_updated', ({ roomCode, players }) => {
      setCustomRoomCode(roomCode);
      setCustomPlayers(players);
      setRoomError(null);
    });

    s.on('room_error', ({ message }) => {
      setRoomError(message);
    });

    // Match Found
    s.on('match_found', ({ roomId, role: assignedRole, opponent }) => {
      setMatchType('online');
      roleRef.current = assignedRole;
      setRole(assignedRole);
      setOpponent(opponent);
      setScreenState('countdown');
      setTilt(0);
      setPlayerScore(0);
      setOpponentScore(0);
      setPlayerStreak(0);
      sceneManagerRef.current?.setViewMode('match');
      sceneManagerRef.current?.wrestlers.setTilt(0, 0.4);
    });

    // Countdown tick (3, 2, 1, GO)
    s.on('countdown_tick', ({ count }) => {
      setCountdownNumber(count === 0 ? 'FIGHT!' : count);
      soundManager.playCountdownBeep(count === 0);
    });

    s.on('match_start', () => {
      setCountdownNumber(null);
      setScreenState('playing');
    });

    // Synchronized round start
    s.on('round_start', (roundData) => {
      setActiveRoundData(roundData);
    });

    // State update from server
    s.on('game_state_update', (data) => {
      const isP1 = roleRef.current === 'player1';
      const myTilt = isP1 ? data.tilt : -data.tilt;
      const myScore = isP1 ? data.p1Score : data.p2Score;
      const theirScore = isP1 ? data.p2Score : data.p1Score;
      const myStreak = isP1 ? data.p1Streak : data.p2Streak;

      setTilt(myTilt);
      setPlayerScore(myScore);
      setOpponentScore(theirScore);
      setPlayerStreak(myStreak);

      sceneManagerRef.current?.wrestlers.setTilt(myTilt, 0.6);
      soundManager.playArmStrain();
    });

    // Match ended
    s.on('match_ended', (data) => {
      const isWinner = data.winnerRole === roleRef.current;
      const stats = roleRef.current === 'player1' ? data.p1Stats : data.p2Stats;

      setMatchResult({
        isWinner,
        winnerName: data.winnerName,
        reason: data.reason,
        stats,
        duration: data.duration,
      });

      sceneManagerRef.current?.onPinSlam(isWinner);
      soundManager.playTableSlam();
      setTimeout(() => {
        setScreenState('result');
      }, 1200);
    });

    s.on('opponent_left', ({ message }) => {
      setMatchResult({
        isWinner: true,
        winnerName: playerNameRef.current,
        reason: 'forfeit',
        stats: { hits: 0, misses: 0, maxStreak: 0 },
        duration: 0,
      });
      setScreenState('result');
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // Start background ambient on first interaction
  const handleUserActivity = () => {
    soundManager.ensureContext();
    soundManager.startParkAmbient();
  };

  // --- Auto Matchmaking Handler ---
  const handleStartAutoMatch = () => {
    handleUserActivity();
    setScreenState('matchmaking');
    socketRef.current?.emit('join_queue', {
      playerId,
      playerName,
    });
  };

  const handleCancelAutoMatch = () => {
    socketRef.current?.emit('leave_queue');
    setScreenState('home');
  };

  // --- Invite Friend Handlers ---
  const handleOpenInvite = () => {
    handleUserActivity();
    setScreenState('invite');
    setCustomRoomCode(null);
    setCustomPlayers([]);
    setRoomError(null);
  };

  const handleCreateCustomRoom = () => {
    socketRef.current?.emit('create_custom_room', {
      playerId,
      playerName,
    });
  };

  const handleJoinCustomRoom = (code) => {
    socketRef.current?.emit('join_custom_room', {
      roomCode: code,
      playerId,
      playerName,
    });
  };

  const handleCancelInvite = () => {
    socketRef.current?.emit('leave_custom_room');
    setScreenState('home');
    setCustomRoomCode(null);
    // Clear URL search params
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // --- Bot Match Handlers ---
  const handleStartBotMatch = (difficulty = 'normal') => {
    handleUserActivity();
    setMatchType('bot');
    setRole('player1');
    setScreenState('countdown');
    setTilt(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerStreak(0);

    sceneManagerRef.current?.setViewMode('match');
    sceneManagerRef.current?.wrestlers.setTilt(0, 0.4);

    const bot = new BotEngine({
      difficulty,
      onRoundStart: (roundData) => {
        setActiveRoundData(roundData);
      },
      onStateUpdate: (data) => {
        setTilt(data.tilt);
        setPlayerScore(data.p1Score);
        setOpponentScore(data.botScore);
        setPlayerStreak(data.p1Streak);
        sceneManagerRef.current?.wrestlers.setTilt(data.tilt, 0.6);
        soundManager.playArmStrain();
      },
      onMatchEnded: (data) => {
        const isWinner = data.winnerRole === 'p1';
        setMatchResult({
          isWinner,
          winnerName: isWinner ? playerName : data.winnerName,
          reason: data.reason,
          stats: data.p1Stats,
          duration: data.duration,
        });
        sceneManagerRef.current?.onPinSlam(isWinner);
        soundManager.playTableSlam();
        setTimeout(() => {
          setScreenState('result');
        }, 1200);
      },
    });

    botEngineRef.current = bot;
    setOpponent({ name: bot.botProfile.name, avatar: 'avatar_bot' });
    sceneManagerRef.current?.wrestlers.setOpponentAppearance(bot.botProfile.appearance);

    // 3, 2, 1 Countdown
    let count = 3;
    setCountdownNumber(count);
    soundManager.playCountdownBeep(false);

    const countInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownNumber(count);
        soundManager.playCountdownBeep(false);
      } else if (count === 0) {
        setCountdownNumber('FIGHT!');
        soundManager.playCountdownBeep(true);
      } else {
        clearInterval(countInterval);
        setCountdownNumber(null);
        setScreenState('playing');
        bot.start();
      }
    }, 1000);
  };

  // --- Timing Input Submission ---
  const handleTimingInput = useCallback(({ roundNumber, hit, accuracy }) => {
    if (hit) {
      sceneManagerRef.current?.onHitSuccess();
    } else {
      sceneManagerRef.current?.onHitMiss();
    }

    if (matchType === 'bot') {
      botEngineRef.current?.handlePlayerInput({ roundNumber, hit, accuracy });
    } else {
      socketRef.current?.emit('submit_timing', { roundNumber, hit, accuracy });
    }
  }, [matchType]);

  // Forfeit / Return to menu
  const handleForfeit = () => {
    if (matchType === 'bot') {
      botEngineRef.current?.destroy();
    } else {
      socketRef.current?.emit('forfeit_match');
    }
    setScreenState('home');
    sceneManagerRef.current?.setViewMode('menu');
    sceneManagerRef.current?.wrestlers.setTilt(0, 0.3);
  };

  const handlePlayAgain = () => {
    if (matchType === 'bot') {
      handleStartBotMatch(botEngineRef.current?.difficulty || 'normal');
    } else {
      handleStartAutoMatch();
    }
  };

  const handleGoHome = () => {
    if (botEngineRef.current) {
      botEngineRef.current.destroy();
    }
    setScreenState('home');
    sceneManagerRef.current?.setViewMode('menu');
    sceneManagerRef.current?.wrestlers.setTilt(0, 0.3);
  };

  return (
    <div
      onClick={handleUserActivity}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#090b10',
      }}
    >
      {/* 3D WebGL Canvas Layer */}
      <div
        ref={canvasContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />

      {/* 1. Home Screen UI */}
      {screenState === 'home' && (
        <HomeScreen
          playerName={playerName}
          onUpdatePlayerName={updatePlayerName}
          serverStatus={serverStatus}
          onStartAutoMatch={handleStartAutoMatch}
          onOpenInviteModal={handleOpenInvite}
          onStartBotMatch={handleStartBotMatch}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 2. Matchmaking Modal */}
      {screenState === 'matchmaking' && (
        <MatchmakingModal onCancel={handleCancelAutoMatch} />
      )}

      {/* 3. Invite Friend Modal */}
      {screenState === 'invite' && (
        <InviteModal
          roomCode={customRoomCode}
          isHost={customPlayers[0]?.playerId === playerId}
          players={customPlayers}
          onCreateRoom={handleCreateCustomRoom}
          onJoinRoom={handleJoinCustomRoom}
          onClose={handleCancelInvite}
          errorMessage={roomError}
        />
      )}

      {/* 4. Match Countdown Overlay (3, 2, 1, FIGHT!) */}
      {screenState === 'countdown' && countdownNumber && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40,
          pointerEvents: 'none',
          background: 'rgba(9, 11, 16, 0.45)',
          backdropFilter: 'blur(4px)',
        }}>
          {/* Versus Tag */}
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 4,
            color: '#f59e0b',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            {playerName} VS {opponent.name}
          </div>

          <div
            className="font-heading"
            style={{
              fontSize: 'clamp(80px, 15vw, 140px)',
              color: countdownNumber === 'FIGHT!' ? '#ef4444' : '#f8fafc',
              textShadow: '0 4px 25px rgba(0,0,0,0.9), 0 0 50px rgba(245, 158, 11, 0.5)',
              animation: 'hitPop 0.4s ease-out',
            }}
          >
            {countdownNumber}
          </div>
        </div>
      )}

      {/* 5. Active Match Gameplay HUD & Needle Minigame */}
      {screenState === 'playing' && (
        <>
          <HUD
            playerName={playerName}
            opponentName={opponent.name}
            tilt={tilt}
            playerScore={playerScore}
            opponentScore={opponentScore}
            playerStreak={playerStreak}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onForfeit={handleForfeit}
          />

          <div style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 30,
            pointerEvents: 'none',
          }}>
            <TimingNeedle
              roundData={activeRoundData}
              onInputSubmit={handleTimingInput}
              disabled={false}
              streak={playerStreak}
            />
          </div>
        </>
      )}

      {/* 6. Victory / Defeat Modal */}
      {screenState === 'result' && matchResult && (
        <ResultModal
          isWinner={matchResult.isWinner}
          winnerName={matchResult.winnerName}
          reason={matchResult.reason}
          stats={matchResult.stats}
          duration={matchResult.duration}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
        />
      )}
    </div>
  );
}
