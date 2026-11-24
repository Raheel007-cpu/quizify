import { useEffect, useRef, useState } from 'react';
import styles from './Timer.module.css';

const formatTime = (totalSeconds) => {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

function Timer({ expiresAt, initialRemainingSeconds, onExpire }) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (expiresAt) {
      return Math.max(
        0,
        Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
    }
    return Math.max(0, initialRemainingSeconds || 0);
  });

  const expiredCalledRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredCalledRef.current = false;

    const computeRemaining = () => {
      if (!expiresAt) return 0;
      return Math.max(
        0,
        Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
    };

    const tick = () => {
      const next = computeRemaining();
      setRemainingSeconds(next);
      if (next <= 0 && !expiredCalledRef.current) {
        expiredCalledRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [expiresAt]);

  const isCritical = remainingSeconds <= 20;
  const isWarning = remainingSeconds > 20 && remainingSeconds <= 60;

  return (
    <div
      className={`${styles.timer} ${isCritical ? styles.critical : ''} ${
        isWarning ? styles.warning : ''
      }`}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining ${formatTime(remainingSeconds)}`}
    >
      <span className={styles.label}>Time Left</span>
      <span className={styles.clock}>{formatTime(remainingSeconds)}</span>
    </div>
  );
}

export default Timer;
