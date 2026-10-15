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
  // Clamped tilt (-1.0 to 1.0; positive: player winning)
  const clampedTilt = Math.max(-1.0, Math.min(1.0, tilt || 0));

  // In 3D FPP perspective (right-hand arm wrestling):
  // When Player wins (tilt > 0): arms push towards the left pad (-X), indicator moves left towards 0% ("PIN LAWAN")
  // When Opponent wins (tilt < 0): arms push towards the right pad (+X), indicator moves right towards 100% ("PIN KAMU")
  // Center is neutral 50% ("SEIMBANG")
  const indicatorPos = Math.max(0, Math.min(100, 50 - clampedTilt * 50));
  const isWinning = clampedTilt > 0;
  const isLosing = clampedTilt < 0;

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
            <span style={{ color: isWinning ? '#4ade80' : '#22c55e', transition: 'color 0.2s' }}>PIN LAWAN</span>
            <span style={{ color: '#94a3b8' }}>SEIMBANG</span>
            <span style={{ color: isLosing ? '#f87171' : '#ef4444', transition: 'color 0.2s' }}>PIN KAMU</span>
          </div>

          {/* Bar track */}
          <div style={{
            width: '100%',
            height: 14,
            background: 'rgba(0, 0, 0, 0.55)',
            borderRadius: 7,
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}>
            {/* Center mark */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 2,
              marginLeft: -1,
              background: 'rgba(255, 255, 255, 0.45)',
              zIndex: 3,
            }} />

            {/* Dynamic Tug Pin Indicator */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${indicatorPos}%`,
                width: 14,
                marginLeft: -7,
                background: '#f59e0b',
                borderRadius: 7,
                boxShadow: '0 0 12px #f59e0b, 0 0 4px #ffffff',
                transition: 'left 0.15s ease-out',
                zIndex: 4,
              }}
            />

            {/* Left side momentum (Player pushing opponent towards PIN LAWAN) */}
            {isWinning && (
              <div
                style={{
                  position: 'absolute',
                  left: `${indicatorPos}%`,
                  top: 0,
                  bottom: 0,
                  width: `${50 - indicatorPos}%`,
                  background: 'linear-gradient(270deg, #10b981, #22c55e)',
                  transition: 'left 0.15s ease-out, width 0.15s ease-out',
                  zIndex: 2,
                }}
              />
            )}

            {/* Right side momentum (Opponent pushing player towards PIN KAMU) */}
            {isLosing && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: `${indicatorPos - 50}%`,
                  background: 'linear-gradient(90deg, #f87171, #ef4444)',
                  transition: 'width 0.15s ease-out',
                  zIndex: 2,
                }}
              />
            )}
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
