// client/src/components/HomeScreen.jsx
import React, { useState } from 'react';
import { Play, Users, Bot, Edit2, Check, HelpCircle, Volume2, VolumeX, Shield, Trophy } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

export function HomeScreen({
  playerName,
  onUpdatePlayerName,
  serverStatus, // 'connected' | 'connecting' | 'disconnected'
  onStartAutoMatch,
  onOpenInviteModal,
  onStartBotMatch,
  isMuted,
  onToggleMute,
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showBotDifficulty, setShowBotDifficulty] = useState(false);

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdatePlayerName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 32px',
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        pointerEvents: 'auto',
      }}>
        {/* Player Name Profile Editor */}
        <div className="glass-panel" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 18px',
        }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>
            💪
          </div>

          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="text"
                value={tempName}
                maxLength={16}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid #f59e0b',
                  borderRadius: 6,
                  color: '#fff',
                  padding: '4px 8px',
                  fontSize: 14,
                  outline: 'none',
                  width: 140,
                }}
                autoFocus
              />
              <button
                onClick={handleSaveName}
                style={{
                  background: '#f59e0b',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: '#000',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                  IDENTITAS PEMAIN
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                  {playerName}
                </div>
              </div>
              <button
                onClick={() => {
                  setTempName(playerName);
                  setIsEditingName(true);
                  soundManager.playClick();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4,
                }}
                title="Ganti Nama"
              >
                <Edit2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Server Status & Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Server Connection Badge */}
          <div className="glass-panel" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: serverStatus === 'connected' ? '#10b981' : serverStatus === 'connecting' ? '#f59e0b' : '#ef4444',
              boxShadow: `0 0 8px ${serverStatus === 'connected' ? '#10b981' : serverStatus === 'connecting' ? '#f59e0b' : '#ef4444'}`,
            }} />
            <span style={{ color: '#cbd5e1' }}>
              {serverStatus === 'connected' ? 'Server Online' : serverStatus === 'connecting' ? 'Menghubungkan...' : 'Offline'}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="glass-panel"
            style={{
              padding: 10,
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

          {/* Help Button */}
          <button
            onClick={() => {
              setShowHowToPlay(true);
              soundManager.playClick();
            }}
            className="glass-panel"
            style={{
              padding: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              color: '#cbd5e1',
            }}
            title="Cara Bermain"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

      {/* Center Hero Banner & Main Action Menu */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 'auto 0',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 28, pointerEvents: 'auto' }}>
          <div style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 4,
            color: '#f59e0b',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            TOURNAMENT ONLINE PANCO 3D
          </div>
          <h1 className="font-heading" style={{
            fontSize: 'clamp(52px, 8vw, 84px)',
            lineHeight: 0.95,
            margin: 0,
            color: '#f8fafc',
            textShadow: '0 4px 20px rgba(0,0,0,0.8), 0 0 40px rgba(245,158,11,0.3)',
            letterSpacing: 3,
          }}>
            ARM CLASH <span style={{ color: '#f59e0b' }}>3D</span>
          </h1>
          <div style={{
            color: '#94a3b8',
            fontSize: 'clamp(14px, 2vw, 17px)',
            marginTop: 8,
            maxWidth: 480,
          }}>
            Uji refleks dan kekuatan panco kamu dalam sudut pandang orang pertama!
          </div>
        </div>

        {/* Action Buttons Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          maxWidth: 380,
          pointerEvents: 'auto',
        }}>
          {/* 1. AUTO MATCH (Primary Featured) */}
          <button
            onClick={() => {
              soundManager.playClick();
              onStartAutoMatch();
            }}
            className="btn-primary pulse-glow"
            style={{ width: '100%' }}
          >
            <Play size={26} fill="currentColor" />
            <span>AUTO MATCH</span>
          </button>

          {/* 2. UNDANG TEMAN */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenInviteModal();
            }}
            className="btn-secondary"
            style={{ width: '100%' }}
          >
            <Users size={22} />
            <span>UNDANG TEMAN</span>
          </button>

          {/* 3. LAWAN BOT */}
          <button
            onClick={() => {
              soundManager.playClick();
              setShowBotDifficulty(true);
            }}
            className="btn-secondary"
            style={{ width: '100%' }}
          >
            <Bot size={22} />
            <span>LAWAN BOT</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{
        textAlign: 'center',
        fontSize: 13,
        color: '#64748b',
        pointerEvents: 'auto',
      }}>
        Kontrol: Tekan <b>SPACE</b> / <b>ENTER</b> atau Tap tombol saat jarum berada di target warna.
      </div>

      {/* Bot Difficulty Selector Modal */}
      {showBotDifficulty && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          pointerEvents: 'auto',
        }}>
          <div className="glass-panel" style={{
            padding: 32,
            width: '90%',
            maxWidth: 440,
            textAlign: 'center',
          }}>
            <h2 className="font-heading" style={{ fontSize: 32, color: '#f8fafc', marginBottom: 8 }}>
              PILIH TINGKAT KESULITAN BOT
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
              Pilih lawan AI untuk latihan panco kamu:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowBotDifficulty(false);
                  onStartBotMatch('easy');
                }}
                className="btn-secondary"
                style={{
                  justifyContent: 'space-between',
                  borderColor: '#22c55e',
                  background: 'rgba(34, 197, 94, 0.1)',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#4ade80', fontWeight: 700 }}>EASY (Pemula)</div>
                  <div style={{ fontSize: 12, color: '#86efac' }}>Bot santai, sering miss timing</div>
                </div>
                <span>🟢</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowBotDifficulty(false);
                  onStartBotMatch('normal');
                }}
                className="btn-secondary"
                style={{
                  justifyContent: 'space-between',
                  borderColor: '#3b82f6',
                  background: 'rgba(59, 130, 246, 0.1)',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#60a5fa', fontWeight: 700 }}>NORMAL (Seimbang)</div>
                  <div style={{ fontSize: 12, color: '#93c5fd' }}>Refleks bagus, tantangan pas</div>
                </div>
                <span>🟡</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowBotDifficulty(false);
                  onStartBotMatch('hard');
                }}
                className="btn-secondary"
                style={{
                  justifyContent: 'space-between',
                  borderColor: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.1)',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#f87171', fontWeight: 700 }}>HARD (Master)</div>
                  <div style={{ fontSize: 12, color: '#fca5a5' }}>Kecepatan tinggi, akurasi mematikan</div>
                </div>
                <span>🔴</span>
              </button>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                setShowBotDifficulty(false);
              }}
              className="btn-secondary"
              style={{ marginTop: 20, width: '100%', fontSize: 16, padding: '10px 0' }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          pointerEvents: 'auto',
        }}>
          <div className="glass-panel" style={{
            padding: 32,
            width: '90%',
            maxWidth: 500,
            textAlign: 'left',
          }}>
            <h2 className="font-heading" style={{ fontSize: 32, color: '#f59e0b', marginBottom: 16, textAlign: 'center' }}>
              CARA BERMAIN
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14, color: '#cbd5e1' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>🎯</span>
                <div>
                  <strong style={{ color: '#fff' }}>Timing Jarum:</strong> Jarum berputar mengelilingi lingkaran. Tekan <b>SPACE</b> atau tombol <b>TARIK!</b> tepat saat jarum menyentuh area warna target.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>🔄</span>
                <div>
                  <strong style={{ color: '#fff' }}>Arah Bergantian:</strong> Arah putaran jarum berganti setiap ronde! Dari searah jarum jam (↻) menjadi berlawanan arah (↺).
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <div>
                  <strong style={{ color: '#fff' }}>Sistem Kekuatan:</strong> Setiap hit tepat memberi <b>+1 Kekuatan</b>. Kesalahan timing mengurangi <b>-1 Kekuatan</b>.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>🏆</span>
                <div>
                  <strong style={{ color: '#fff' }}>Kemenangan Pin:</strong> Dorong tangan lawan hingga menyentuh bantalan meja untuk memenangkan pertandingan!
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                setShowHowToPlay(false);
              }}
              className="btn-primary"
              style={{ marginTop: 24, width: '100%', fontSize: 20, padding: '12px 0' }}
            >
              MENGERTI & MAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
