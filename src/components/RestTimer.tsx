import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef, useCallback } from 'react';
import { SkipForward } from 'lucide-react';

interface RestTimerProps {
  seconds: number;
  onClose: () => void;
}

function beep(ctx: AudioContext, freq = 880, dur = 0.1) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

export function RestTimer({ seconds: initialSeconds, onClose }: RestTimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    if (remaining <= 0) {
      try { beep(getAudioCtx(), 660, 0.3); } catch { /* audio/vibration unavailable */ }
      try { navigator.vibrate?.([100, 50, 100]); } catch { /* audio/vibration unavailable */ }
      onClose();
      return;
    }
    const tick = setInterval(() => {
      setRemaining((r) => {
        if (r <= 4 && r > 1) {
          try { beep(getAudioCtx(), 440, 0.08); } catch { /* audio/vibration unavailable */ }
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [isRunning, remaining, onClose, getAudioCtx]);

  const progress = remaining / initialSeconds;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="glass rounded-3xl p-8 flex flex-col items-center gap-6 mx-4"
          style={{ minWidth: 280 }}
        >
          <p className="text-tertiary-ios text-sm font-semibold tracking-widest uppercase">Repos</p>

          <div className="relative" style={{ width: 200, height: 200 }}>
            <svg width="200" height="200" className="absolute inset-0 -rotate-90">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth="6" />
              <motion.circle
                cx="100" cy="100" r={radius}
                fill="none"
                stroke="var(--ios-blue)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-primary tabular-nums">
                {mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : secs}
              </span>
              <span className="text-tertiary-ios text-sm">secondes</span>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsRunning((r) => !r)}
              className="px-5 py-2.5 rounded-2xl font-semibold text-sm"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            >
              {isRunning ? 'Pause' : 'Reprendre'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-1.5"
              style={{ background: 'var(--ios-blue)', color: '#fff' }}
            >
              <SkipForward size={14} />
              Passer
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
