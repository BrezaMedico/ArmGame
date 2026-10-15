// client/src/components/HUD.jsx
import React from 'react';
import { Volume2, VolumeX, LogOut } from 'lucide-react';

export function HUD({
  playerName,
  opponentName,
  tilt, // -1.0 to 1.0 (positive: player winning)
  playerScore = 0,
  opponentScore = 0,
  playerStreak = 0,
  isMuted,
  onToggleMute,
  onForfeit,
}) {
  // Normalize tilt (-1 to 1) to percentage for the tug-of-war meter: 0% (opp win) to 100% (player win)
  // tilt = 0 -> 50%
  const pinPercent = Math.max(0, Math.min(100, (tilt + 1) * 50));

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      padding: '16px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      pointerEvents: 'none',
      zIndex: 20,
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}>
        {/* Player Profile (Left) */}
        <div className="glass-panel" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderLeft: '4px solid #ef4444',
          pointerEvents: 'auto',
        }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>
            💪
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
              {playerName || 'Kamu'}
            </div>
            <div style={{ fontSize: 13, color: '#fca5a5', fontWeight: 600 }}>
              Skor: {playerScore} {playerStreak > 1 && `🔥 ${playerStreak}x`}
            </div>
          </div>
        </div>

        {/* Center Tug-Of-War Momentum Bar */}
        <div className="glass-panel" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px 24px',
          minWidth: 320,
          maxWidth: 420,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1,
            marginBottom: 6,
            textTransform: 'uppercase',
          }}>
            <span style={{ color: '#60a5fa' }}>PIN LAWAN</span>
            <span style={{ color: '#94a3b8' }}>SEIMBANG</span>
            <span style={{ color: '#f87171' }}>PIN KAMU</span>
          </div>

          {/* Bar track */}
          <div style={{
            width: '100%',
            height: 14,
            background: 'rgba(0, 0, 0, 0.45)',
            borderRadius: 7,
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            {/* Center mark */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 2,
              background: 'rgba(255, 255, 255, 0.4)',
              zIndex: 3,
            }} />

            {/* Dynamic Tug Pin Indicator */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${100 - pinPercent}%`,
                width: 14,
                marginLeft: -7,
                background: '#f59e0b',
                borderRadius: 7,
                boxShadow: '0 0 10px #f59e0b',
                transition: 'left 0.15s ease-out',
                zIndex: 4,
              }}
            />

            {/* Left side momentum (Player pushing opponent) */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${Math.max(0, (1 - (tilt + 1) / 2) * 100)}%`,
                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                transition: 'width 0.15s ease-out',
              }}
            />

            {/* Right side momentum (Opponent pushing player) */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: `${Math.max(0, ((tilt + 1) / 2) * 100)}%`,
                background: 'linear-gradient(270deg, #ef4444, #f87171)',
                transition: 'width 0.15s ease-out',
              }}
            />
          </div>
        </div>

        {/* Opponent Profile (Right) */}
        <div className="glass-panel" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderRight: '4px solid #3b82f6',
          pointerEvents: 'auto',
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
              {opponentName || 'Lawan'}
            </div>
            <div style={{ fontSize: 13, color: '#93c5fd', fontWeight: 600 }}>
              Skor: {opponentScore}
            </div>
          </div>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>
            🥊
          </div>
        </div>
      </div>

      {/* Top right quick utilities (Sound + Leave) */}
      <div style={{
        position: 'absolute',
        top: 80,
        right: 24,
        display: 'flex',
        gap: 10,
        pointerEvents: 'auto',
      }}>
        <button
          onClick={onToggleMute}
          className="glass-panel"
          style={{
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
            color: '#cbd5e1',
          }}
          title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <button
          onClick={onForfeit}
          className="glass-panel"
          style={{
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
            color: '#f87171',
          }}
          title="Menyerah / Keluar"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
