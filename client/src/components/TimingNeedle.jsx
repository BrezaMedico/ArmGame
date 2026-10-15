// client/src/components/TimingNeedle.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundManager } from '../audio/SoundManager';

export function TimingNeedle({
  roundData,
  onInputSubmit,
  disabled,
  streak = 0,
}) {
  const [needleAngle, setNeedleAngle] = useState(0);
  const [feedback, setFeedback] = useState(null); // { type: 'perfect' | 'hit' | 'miss', text: string }
  const [hasActed, setHasActed] = useState(false);

  const animRef = useRef(null);
  const angleRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Reset when roundData changes
  useEffect(() => {
    if (!roundData) return;
    setHasActed(false);
    setFeedback(null);
    lastTimeRef.current = performance.now();

    // Start angle is opposite the target to allow good reaction time
    const startAngle = (roundData.targetAngle + 180) % 360;
    angleRef.current = startAngle;
    setNeedleAngle(startAngle);
  }, [roundData?.roundNumber]);

  // Animation Loop for Needle Rotation
  useEffect(() => {
    if (!roundData || disabled) return;

    const animate = (currentTime) => {
      const dt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      const speed = roundData.needleSpeed || 260; // degrees per second
      const direction = roundData.clockwise ? 1 : -1;

      angleRef.current = (angleRef.current + direction * speed * dt) % 360;
      if (angleRef.current < 0) angleRef.current += 360;

      setNeedleAngle(angleRef.current);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [roundData, disabled]);

  // Action trigger
  const handleAction = useCallback(() => {
    if (disabled || hasActed || !roundData) return;
    setHasActed(true);

    const current = angleRef.current;
    const target = roundData.targetAngle;
    const halfSize = roundData.targetSize / 2;

    // Angular distance calculation (accounting for 360 degree wrap)
    let diff = Math.abs(current - target);
    if (diff > 180) diff = 360 - diff;

    const isHit = diff <= halfSize;
    const isPerfect = diff <= halfSize * 0.35;

    if (isHit) {
      const accuracy = isPerfect ? 1.0 : 0.8;
      setFeedback({
        type: isPerfect ? 'perfect' : 'hit',
        text: isPerfect ? 'PERFECT! +1' : 'GOOD! +1',
      });
      soundManager.playHitSuccess(isPerfect);
      onInputSubmit({
        roundNumber: roundData.roundNumber,
        hit: true,
        accuracy,
      });
    } else {
      setFeedback({
        type: 'miss',
        text: 'MISS! -1',
      });
      soundManager.playHitMiss();
      onInputSubmit({
        roundNumber: roundData.roundNumber,
        hit: false,
        accuracy: 0,
      });
    }
  }, [disabled, hasActed, roundData, onInputSubmit]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction]);

  if (!roundData) return null;

  // Arc calculation for SVG Target Slice
  const radius = 80;
  const cx = 110;
  const cy = 110;
  const targetHalf = roundData.targetSize / 2;
  const startDeg = (roundData.targetAngle - targetHalf + 360) % 360;
  const endDeg = (roundData.targetAngle + targetHalf + 360) % 360;

  const toRad = (deg) => (deg - 90) * (Math.PI / 180);
  const x1 = cx + radius * Math.cos(toRad(startDeg));
  const y1 = cy + radius * Math.sin(toRad(startDeg));
  const x2 = cx + radius * Math.cos(toRad(endDeg));
  const y2 = cy + radius * Math.sin(toRad(endDeg));

  const largeArcFlag = roundData.targetSize > 180 ? 1 : 0;
  const targetArcPath = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

  // Needle tip coordinates
  const needleRad = toRad(needleAngle);
  const nx = cx + (radius + 2) * Math.cos(needleRad);
  const ny = cy + (radius + 2) * Math.sin(needleRad);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      pointerEvents: 'auto',
    }}>
      {/* Floating combat feedback */}
      {feedback && (
        <div
          className="float-feedback"
          style={{
            top: '-35px',
            color: feedback.type === 'miss' ? '#ef4444' : feedback.type === 'perfect' ? '#fbbf24' : '#10b981',
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* Circular Gauge */}
      <div
        style={{
          width: 220,
          height: 220,
          position: 'relative',
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className={feedback?.type === 'miss' ? 'shake' : feedback ? 'hit-pop' : ''}
      >
        <svg width="220" height="220" style={{ position: 'absolute', top: 0, left: 0 }}>
          {/* Background circle track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="16"
          />

          {/* Target Zone Arc */}
          <path
            d={targetArcPath}
            fill="none"
            stroke={roundData.targetColor || '#22c55e'}
            strokeWidth="16"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 10px ${roundData.targetColor || '#22c55e'})`,
              transition: 'stroke 0.3s ease',
            }}
          />

          {/* Needle Pointer */}
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 6px #ffffff)',
            }}
          />
          {/* Center Hub */}
          <circle cx={cx} cy={cy} r="10" fill="#f8fafc" />
          <circle cx={cx} cy={cy} r="4" fill="#0f172a" />
        </svg>

        {/* Center Prompt & Streak */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          marginTop: 2,
        }}>
          <span style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1.5,
            color: roundData.clockwise ? '#38bdf8' : '#f43f5e',
            textTransform: 'uppercase',
          }}>
            {roundData.clockwise ? 'SEARAH ↻' : 'BERLAWANAN ↺'}
          </span>
          {streak > 1 && (
            <span style={{
              fontSize: 14,
              fontWeight: 900,
              color: '#f59e0b',
              marginTop: 2,
            }}>
              🔥 {streak}x
            </span>
          )}
        </div>
      </div>

      {/* Action Button (Touch & Mobile Friendly) */}
      <button
        onClick={handleAction}
        disabled={disabled || hasActed}
        className="btn-primary"
        style={{
          marginTop: 14,
          padding: '12px 36px',
          fontSize: 22,
          letterSpacing: 2,
          opacity: disabled || hasActed ? 0.6 : 1,
          transform: disabled || hasActed ? 'scale(0.96)' : 'none',
        }}
      >
        <span>TARIK!</span>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          background: 'rgba(0,0,0,0.25)',
          padding: '3px 8px',
          borderRadius: 6,
          fontFamily: 'var(--font-primary)',
        }}>
          SPACE
        </span>
      </button>
    </div>
  );
}
