// client/src/components/TimingNeedle.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundManager } from '../audio/SoundManager';

const TARGET_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export function TimingNeedle({
  roundData,
  onInputSubmit,
  disabled,
  streak = 0,
}) {
  const [needleAngle, setNeedleAngle] = useState(0);
  const [feedback, setFeedback] = useState(null);

  // Responsive target & direction state that flips INSTANTLY on keypress
  const [isClockwise, setIsClockwise] = useState(roundData?.clockwise ?? true);
  const [currentTargetAngle, setCurrentTargetAngle] = useState(roundData?.targetAngle ?? 180);
  const [currentTargetSize, setCurrentTargetSize] = useState(roundData?.targetSize ?? 46);
  const [currentTargetColor, setCurrentTargetColor] = useState(roundData?.targetColor ?? '#22c55e');

  const animRef = useRef(null);
  const angleRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const directionRef = useRef(roundData?.clockwise ? 1 : -1);
  const lastActionTimeRef = useRef(0);
  const colorIndexRef = useRef(0);

  // Sync when roundData arrives from server/bot without disrupting continuous rotation
  useEffect(() => {
    if (!roundData) return;
    if (roundData.targetAngle !== undefined) {
      setCurrentTargetAngle(roundData.targetAngle);
    }
    if (roundData.targetSize !== undefined) {
      setCurrentTargetSize(roundData.targetSize);
    }
    if (roundData.targetColor) {
      setCurrentTargetColor(roundData.targetColor);
    }
    if (roundData.clockwise !== undefined) {
      setIsClockwise(roundData.clockwise);
      directionRef.current = roundData.clockwise ? 1 : -1;
    }
  }, [roundData?.roundNumber]);

  // Continuous smooth animation loop
  useEffect(() => {
    if (disabled) return;

    const animate = (currentTime) => {
      const dt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      const speed = roundData?.needleSpeed || 280; // degrees per second
      angleRef.current = (angleRef.current + directionRef.current * speed * dt) % 360;
      if (angleRef.current < 0) angleRef.current += 360;

      setNeedleAngle(angleRef.current);
      animRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [disabled, roundData?.needleSpeed]);

  // Action trigger: INSTANT direction flip & INSTANT target relocation
  const handleAction = useCallback(() => {
    if (disabled) return;

    const now = performance.now();
    // 140ms debounce to prevent key-repeat spam while keeping input ultra-responsive
    if (now - lastActionTimeRef.current < 140) return;
    lastActionTimeRef.current = now;

    const current = angleRef.current;
    const target = currentTargetAngle;
    const halfSize = currentTargetSize / 2;

    // Angular distance accounting for 360 wrap
    let diff = Math.abs(current - target);
    if (diff > 180) diff = 360 - diff;

    const isHit = diff <= halfSize;
    const isPerfect = diff <= halfSize * 0.35;

    if (isHit) {
      const accuracy = isPerfect ? 1.0 : 0.8;
      setFeedback({
        type: isPerfect ? 'perfect' : 'hit',
        text: isPerfect ? 'PERFECT! +1' : 'GOOD! +1',
        id: now,
      });
      soundManager.playHitSuccess(isPerfect);
      onInputSubmit({
        roundNumber: roundData?.roundNumber || 1,
        hit: true,
        accuracy,
      });
    } else {
      setFeedback({
        type: 'miss',
        text: 'MISS! -1',
        id: now,
      });
      soundManager.playHitMiss();
      onInputSubmit({
        roundNumber: roundData?.roundNumber || 1,
        hit: false,
        accuracy: 0,
      });
    }

    // --- INSTANT DIRECTION REVERSAL ---
    directionRef.current = -directionRef.current;
    setIsClockwise(directionRef.current > 0);

    // --- INSTANT NEW RANDOM TARGET ANGLE & COLOR ---
    // Pick an angle at least 70 degrees away from current position for fair reaction
    const randomOffset = 70 + Math.floor(Math.random() * 200);
    const newTargetAngle = (current + directionRef.current * randomOffset + 360) % 360;
    setCurrentTargetAngle(Math.round(newTargetAngle));

    colorIndexRef.current = (colorIndexRef.current + 1) % TARGET_COLORS.length;
    setCurrentTargetColor(TARGET_COLORS[colorIndexRef.current]);
  }, [disabled, currentTargetAngle, currentTargetSize, onInputSubmit, roundData?.roundNumber]);

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

  // Arc calculation for SVG Target Slice
  const radius = 80;
  const cx = 110;
  const cy = 110;
  const targetHalf = currentTargetSize / 2;
  const startDeg = (currentTargetAngle - targetHalf + 360) % 360;
  const endDeg = (currentTargetAngle + targetHalf + 360) % 360;

  const toRad = (deg) => (deg - 90) * (Math.PI / 180);
  const x1 = cx + radius * Math.cos(toRad(startDeg));
  const y1 = cy + radius * Math.sin(toRad(startDeg));
  const x2 = cx + radius * Math.cos(toRad(endDeg));
  const y2 = cy + radius * Math.sin(toRad(endDeg));

  const largeArcFlag = currentTargetSize > 180 ? 1 : 0;
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
          key={feedback.id}
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

          {/* Target Zone Arc (Updates immediately!) */}
          <path
            d={targetArcPath}
            fill="none"
            stroke={currentTargetColor}
            strokeWidth="16"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 10px ${currentTargetColor})`,
              transition: 'stroke 0.15s ease',
            }}
          />

          {/* Needle Pointer (Flips direction instantly!) */}
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
            color: isClockwise ? '#38bdf8' : '#f43f5e',
            textTransform: 'uppercase',
            transition: 'color 0.1s ease',
          }}>
            {isClockwise ? 'SEARAH ↻' : 'BERLAWANAN ↺'}
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
        disabled={disabled}
        className="btn-primary"
        style={{
          marginTop: 14,
          padding: '12px 36px',
          fontSize: 22,
          letterSpacing: 2,
          opacity: disabled ? 0.6 : 1,
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
