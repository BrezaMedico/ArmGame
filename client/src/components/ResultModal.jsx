// client/src/components/ResultModal.jsx
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Frown, RotateCcw, Home, Award, Zap, Clock, Target } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

export function ResultModal({
  isWinner,
  winnerName,
  reason,
  stats,
  duration = 0,
  onPlayAgain,
  onGoHome,
}) {
  useEffect(() => {
    if (isWinner) {
      soundManager.playVictory();
      // Confetti burst
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#ffffff'],
        });
      } catch (e) {
        console.error('Confetti error', e);
      }
    } else {
      soundManager.playDefeat();
    }
  }, [isWinner]);

  const totalAttempts = (stats?.hits || 0) + (stats?.misses || 0);
  const accuracy = totalAttempts > 0 ? Math.round((stats.hits / totalAttempts) * 100) : 0;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(9, 11, 16, 0.88)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 70,
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <div className="glass-panel" style={{
        padding: '36px 44px',
        maxWidth: 480,
        width: '90%',
        textAlign: 'center',
        position: 'relative',
        boxShadow: isWinner
          ? '0 0 60px rgba(245, 158, 11, 0.35)'
          : '0 0 40px rgba(239, 68, 68, 0.2)',
      }}>
        {/* Big Icon */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isWinner
            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
            : 'linear-gradient(135deg, #64748b, #334155)',
          boxShadow: isWinner ? '0 0 30px #f59e0b' : 'none',
        }}>
          {isWinner ? <Trophy size={44} color="#ffffff" /> : <Frown size={44} color="#ffffff" />}
        </div>

        {/* Title */}
        <h2 className="font-heading" style={{
          fontSize: 48,
          letterSpacing: 2,
          margin: '0 0 4px',
          color: isWinner ? '#f59e0b' : '#f87171',
          textShadow: '0 2px 12px rgba(0,0,0,0.8)',
        }}>
          {isWinner ? 'KAMU MENANG!' : 'KAMU KALAH'}
        </h2>

        <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 24 }}>
          {reason === 'forfeit'
            ? 'Lawan menyerah atau terputus dari pertandingan.'
            : isWinner
            ? 'Kemenangan Pin Telak! Tangan lawan berhasil dihempaskan ke meja.'
            : 'Tanganmu terhempas ke bantalan meja. Coba lagi!'}
        </p>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 28,
          textAlign: 'left',
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
              <Target size={14} color="#60a5fa" />
              <span>AKURASI</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
              {accuracy}%
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
              <Zap size={14} color="#f59e0b" />
              <span>MAX STREAK</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
              {stats?.maxStreak || 0}x
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4ade80' }}>
              <Award size={14} color="#4ade80" />
              <span>TOTAL HIT</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
              {stats?.hits || 0}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#a78bfa' }}>
              <Clock size={14} color="#a78bfa" />
              <span>DURASI</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
              {duration}s
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 14 }}>
          <button
            onClick={() => {
              soundManager.playClick();
              onPlayAgain();
            }}
            className="btn-primary"
            style={{ flex: 1, fontSize: 18, padding: '12px 18px' }}
          >
            <RotateCcw size={20} />
            <span>MAIN LAGI</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onGoHome();
            }}
            className="btn-secondary"
            style={{ flex: 1, fontSize: 18, padding: '12px 18px' }}
          >
            <Home size={20} />
            <span>HOME</span>
          </button>
        </div>
      </div>
    </div>
  );
}
