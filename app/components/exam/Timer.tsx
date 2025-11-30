/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  duration: number; // seconds left
  onTimeUp: () => void;
  compact?: boolean;
}

const formatTime = (secs: number) => {
  const mm = Math.floor(secs / 60);
  const ss = secs % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

export default function Timer({ duration, onTimeUp, compact = false }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => setTimeLeft(duration), [duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, onTimeUp]);

  if (compact) {
    return <span className="font-mono text-sm">{formatTime(timeLeft)}</span>;
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white border text-sm font-mono">
      <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none"><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
}
