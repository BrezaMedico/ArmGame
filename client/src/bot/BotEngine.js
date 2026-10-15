// client/src/bot/BotEngine.js
// Offline & Instant Bot Controller with 3 Difficulty Levels

const BOT_NAMES = [
  "Viktor 'The Bear'",
  "Marcus Ironfist",
  "Alex Stone",
  "Dmitri Steel",
  "Bryan Hammer",
  "Kenji Thunder",
];

const BOT_APPEARANCES = [
  { skinColor: 0xe0ac69, shirtColor: 0x2563eb, hairColor: 0x1e293b },
  { skinColor: 0xd99b66, shirtColor: 0xdc2626, hairColor: 0x451a03 },
  { skinColor: 0xf5d0b0, shirtColor: 0x16a34a, hairColor: 0xd97706 },
  { skinColor: 0x8d5524, shirtColor: 0x9333ea, hairColor: 0x0f172a },
];

export class BotEngine {
  constructor({ difficulty = 'normal', onRoundStart, onStateUpdate, onMatchEnded }) {
    this.difficulty = difficulty; // 'easy' | 'normal' | 'hard'
    this.onRoundStart = onRoundStart;
    this.onStateUpdate = onStateUpdate;
    this.onMatchEnded = onMatchEnded;

    this.botProfile = {
      name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
      appearance: BOT_APPEARANCES[Math.floor(Math.random() * BOT_APPEARANCES.length)],
      difficulty,
    };

    this.reset();
  }

  reset() {
    this.currentRound = 0;
    this.p1Score = 0;
    this.botScore = 0;
    this.p1Streak = 0;
    this.botStreak = 0;
    this.p1Stats = { hits: 0, misses: 0, maxStreak: 0 };
    this.botStats = { hits: 0, misses: 0, maxStreak: 0 };
    this.tilt = 0.0; // -1.0 to 1.0 (positive: p1 win)
    this.isFinished = false;
    this.startTime = Date.now();
    this.activeRoundData = null;
    this.botActionTimeout = null;
    this.roundTimeout = null;
  }

  start() {
    this.reset();
    this.nextRound();
  }

  nextRound() {
    if (this.isFinished) return;

    this.currentRound++;
    const clockwise = this.currentRound % 2 === 1;

    // Difficulty scaling
    const roundFactor = Math.min(this.currentRound, 12);
    let targetSize = 54 - roundFactor * 1.8;
    let needleSpeed = 240 + roundFactor * 12;

    if (this.difficulty === 'easy') {
      targetSize = Math.max(38, targetSize + 6);
      needleSpeed = Math.max(200, needleSpeed - 30);
    } else if (this.difficulty === 'hard') {
      targetSize = Math.max(26, targetSize - 6);
      needleSpeed = Math.min(440, needleSpeed + 40);
    }

    const targetAngle = Math.floor(Math.random() * 300) + 30;
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const targetColor = colors[(this.currentRound - 1) % colors.length];

    const roundData = {
      roundNumber: this.currentRound,
      targetAngle,
      targetSize,
      needleSpeed,
      clockwise,
      targetColor,
      startTime: Date.now(),
      p1Submitted: false,
      botSubmitted: false,
    };

    this.activeRoundData = roundData;
    this.onRoundStart(roundData);

    // Schedule bot's simulated action
    this.scheduleBotAction(roundData);

    // Max duration for the round before expiring
    const fullRotationTime = (360 / needleSpeed) * 1000;
    this.roundTimeout = setTimeout(() => {
      this.evaluateRoundExpire();
    }, fullRotationTime * 2.2);
  }

  scheduleBotAction(roundData) {
    if (this.botActionTimeout) clearTimeout(this.botActionTimeout);

    // Hit probability based on difficulty
    let hitProbability = 0.72; // Normal
    if (this.difficulty === 'easy') hitProbability = 0.44;
    if (this.difficulty === 'hard') hitProbability = 0.88;

    const willHit = Math.random() < hitProbability;

    // Human-like simulated timing delay (0.8s - 1.8s)
    const reactionDelay = 800 + Math.random() * 900;

    this.botActionTimeout = setTimeout(() => {
      if (this.isFinished || !this.activeRoundData || this.activeRoundData.roundNumber !== roundData.roundNumber) return;

      this.activeRoundData.botSubmitted = true;
      if (willHit) {
        this.botStats.hits++;
        this.botStreak++;
        this.botStats.maxStreak = Math.max(this.botStats.maxStreak, this.botStreak);
        this.botScore += 1;
      } else {
        this.botStats.misses++;
        this.botStreak = 0;
        this.botScore = Math.max(0, this.botScore - 1);
      }

      this.updateTilt();

      // Check if both have acted
      if (this.activeRoundData.p1Submitted) {
        this.finalizeRound();
      }
    }, reactionDelay);
  }

  handlePlayerInput({ roundNumber, hit, accuracy }) {
    if (this.isFinished) return;

    if (this.botActionTimeout) clearTimeout(this.botActionTimeout);
    if (this.roundTimeout) clearTimeout(this.roundTimeout);

    if (hit) {
      this.p1Stats.hits++;
      this.p1Streak++;
      this.p1Stats.maxStreak = Math.max(this.p1Stats.maxStreak, this.p1Streak);
      this.p1Score += 1;
    } else {
      this.p1Stats.misses++;
      this.p1Streak = 0;
      this.p1Score = Math.max(0, this.p1Score - 1);
    }

    // Bot resolves its counter-reaction immediately
    let hitProbability = 0.70; // Normal
    if (this.difficulty === 'easy') hitProbability = 0.42;
    if (this.difficulty === 'hard') hitProbability = 0.86;

    const botHits = Math.random() < hitProbability;
    if (botHits) {
      this.botStats.hits++;
      this.botStreak++;
      this.botStats.maxStreak = Math.max(this.botStats.maxStreak, this.botStreak);
      this.botScore += 1;
    } else {
      this.botStats.misses++;
      this.botStreak = 0;
      this.botScore = Math.max(0, this.botScore - 1);
    }

    this.updateTilt();

    // Advance to next round instantly with zero delay!
    if (!this.isFinished) {
      this.nextRound();
    }
  }

  evaluateRoundExpire() {
    if (this.isFinished || !this.activeRoundData) return;

    if (!this.activeRoundData.p1Submitted) {
      this.activeRoundData.p1Submitted = true;
      this.p1Stats.misses++;
      this.p1Streak = 0;
      this.p1Score = Math.max(0, this.p1Score - 1);
    }
    if (!this.activeRoundData.botSubmitted) {
      this.activeRoundData.botSubmitted = true;
      this.botStats.misses++;
      this.botStreak = 0;
      this.botScore = Math.max(0, this.botScore - 1);
    }

    this.updateTilt();
    this.finalizeRound();
  }

  updateTilt() {
    const diff = this.p1Score - this.botScore;
    const MAX_PIN_POINTS = 6;
    this.tilt = Math.max(-1.0, Math.min(1.0, diff / MAX_PIN_POINTS));

    this.onStateUpdate({
      tilt: this.tilt,
      p1Score: this.p1Score,
      botScore: this.botScore,
      p1Streak: this.p1Streak,
      botStreak: this.botStreak,
    });

    if (this.tilt >= 1.0) {
      this.endGame('p1', 'pin');
    } else if (this.tilt <= -1.0) {
      this.endGame('bot', 'pin');
    }
  }

  finalizeRound() {
    if (this.roundTimeout) clearTimeout(this.roundTimeout);
    if (!this.isFinished) {
      setTimeout(() => this.nextRound(), 700);
    }
  }

  endGame(winner, reason) {
    if (this.isFinished) return;
    this.isFinished = true;

    if (this.botActionTimeout) clearTimeout(this.botActionTimeout);
    if (this.roundTimeout) clearTimeout(this.roundTimeout);

    this.onMatchEnded({
      winnerRole: winner,
      winnerName: winner === 'p1' ? 'Kamu' : this.botProfile.name,
      reason,
      p1Stats: this.p1Stats,
      botStats: this.botStats,
      duration: Math.round((Date.now() - this.startTime) / 1000),
      finalTilt: this.tilt,
    });
  }

  destroy() {
    this.isFinished = true;
    if (this.botActionTimeout) clearTimeout(this.botActionTimeout);
    if (this.roundTimeout) clearTimeout(this.roundTimeout);
  }
}
