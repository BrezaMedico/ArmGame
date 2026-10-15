// client/src/components/InviteModal.jsx
import React, { useState } from 'react';
import { Copy, Check, Users, ArrowRight, X, Loader2 } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

export function InviteModal({
  roomCode,
  isHost,
  players = [],
  onCreateRoom,
  onJoinRoom,
  onClose,
  errorMessage,
}) {
  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState(roomCode ? 'host' : 'create'); // 'create' | 'host' | 'join'

  const shareUrl = roomCode ? `${window.location.origin}${window.location.pathname}?room=${roomCode}` : '';

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      soundManager.playClick();
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      soundManager.playClick();
      setTimeout(() => setCopied(false), 2500);
    });
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
        padding: '32px 40px',
        maxWidth: 460,
        width: '90%',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Close button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <X size={22} />
        </button>

        <h2 className="font-heading" style={{
          fontSize: 34,
          letterSpacing: 2,
          color: '#f8fafc',
          marginBottom: 6,
        }}>
          MAIN BERSAMA TEMAN
        </h2>

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
          }}>
            {errorMessage}
          </div>
        )}

        {/* If room is created and waiting for friend */}
        {roomCode ? (
          <div>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
              Bagikan link atau kode berikut kepada temanmu:
            </p>

            {/* Big Room Code Box */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.45)',
              border: '2px dashed #f59e0b',
              borderRadius: 14,
              padding: '16px 24px',
              marginBottom: 18,
            }}>
              <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase' }}>
                KODE ROOM
              </div>
              <div style={{
                fontSize: 42,
                fontWeight: 900,
                color: '#f59e0b',
                letterSpacing: 6,
                fontFamily: 'monospace',
                cursor: 'pointer',
              }} onClick={handleCopyCode}>
                {roomCode}
              </div>
            </div>

            {/* Share Link Button */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              <button
                onClick={handleCopyLink}
                className="btn-primary"
                style={{ flex: 1, fontSize: 18, padding: '12px 18px' }}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
                <span>{copied ? 'LINK TERSALIN!' : 'SALIN LINK UNDANGAN'}</span>
              </button>
            </div>

            {/* Connected players status */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 20,
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 700 }}>
                STATUS PEMAIN ({players.length}/2):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {players.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                    <span style={{ color: '#10b981' }}>●</span>
                    <span style={{ fontWeight: 600 }}>{p.playerName}</span>
                    {p.isHost && <span style={{ fontSize: 11, color: '#f59e0b', border: '1px solid #f59e0b', padding: '1px 5px', borderRadius: 4 }}>HOST</span>}
                  </div>
                ))}
                {players.length < 2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                    <Loader2 size={14} className="radar-spin" color="#f59e0b" />
                    <span>Menunggu teman bergabung melalui link...</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ width: '100%', fontSize: 16 }}
            >
              Batalkan Room
            </button>
          </div>
        ) : (
          /* Mode Selector: Buat Room Baru atau Masuk ke Room */
          <div>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
              Buat room baru untuk mengundang teman, atau masukkan kode room temanmu:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Button: Buat Room */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  onCreateRoom();
                }}
                className="btn-primary pulse-glow"
                style={{ width: '100%', fontSize: 20 }}
              >
                <Users size={22} />
                <span>BUAT ROOM BARU</span>
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: '#64748b',
                fontSize: 12,
                fontWeight: 700,
              }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                <span>ATAU GABUNG ROOM</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              </div>

              {/* Input: Gabung dengan kode */}
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="KODE ROOM (cth: ARM921)"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => {
                    if (joinCodeInput.trim()) {
                      soundManager.playClick();
                      onJoinRoom(joinCodeInput.trim());
                    }
                  }}
                  disabled={!joinCodeInput.trim()}
                  className="btn-secondary"
                  style={{
                    padding: '12px 20px',
                    opacity: joinCodeInput.trim() ? 1 : 0.5,
                  }}
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
