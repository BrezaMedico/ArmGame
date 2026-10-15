// client/src/components/MatchmakingModal.jsx
import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

export function MatchmakingModal({ onCancel }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(9, 11, 16, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60,
    }}>
      <div className="glass-panel" style={{
        padding: '36px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: 420,
        width: '90%',
        boxShadow: '0 0 50px rgba(245, 158, 11, 0.25)',
      }}>
        {/* Animated Radar Pulse */}
        <div style={{
          position: 'relative',
          width: 100,
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          {/* Radar Circles */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid rgba(245, 158, 11, 0.2)',
          }} />
          <div style={{
            position: 'absolute',
            inset: 15,
            borderRadius: '50%',
            border: '2px solid rgba(245, 158, 11, 0.4)',
          }} />
          <div style={{
            position: 'absolute',
            inset: 30,
            borderRadius: '50%',
            border: '2px solid rgba(245, 158, 11, 0.6)',
          }} />

          {/* Sweeping Radar Scanner */}
          <div
            className="radar-spin"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, rgba(245, 158, 11, 0.45) 0deg, transparent 90deg, transparent 360deg)',
            }}
          />

          <Loader2 size={36} color="#f59e0b" className="radar-spin" />
        </div>

        <h2 className="font-heading" style={{
          fontSize: 32,
          letterSpacing: 2,
          color: '#f8fafc',
          margin: '0 0 8px 0',
        }}>
          MENCARI LAWAN...
        </h2>

        <p style={{
          color: '#94a3b8',
          fontSize: 14,
          marginBottom: 16,
        }}>
          Menghubungkan ke pemain lain di antrean matchmaking...
        </p>

        <div style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#f59e0b',
          fontFamily: 'monospace',
          marginBottom: 28,
        }}>
          {formatTime(elapsed)}
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            onCancel();
          }}
          className="btn-danger"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
          <span>BATALKAN PENCARIAN</span>
        </button>
      </div>
    </div>
  );
}
