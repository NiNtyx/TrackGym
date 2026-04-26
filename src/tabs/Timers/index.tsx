import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Plus } from 'lucide-react';
import { CircleProgress } from './CircleProgress';

type TimerMode = 'emom' | 'amrap' | 'tabata' | 'chipper';

function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  }, []);

  const beep = useCallback((freq = 880, dur = 0.12, volume = 0.3) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch { /* audio/haptics unavailable */ }
  }, [getCtx]);

  return { beep };
}

function vibrate(pattern: number | number[]) {
  try { navigator.vibrate?.(pattern); } catch { /* audio/haptics unavailable */ }
}

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : String(s);
}

interface InputFieldProps {
  label: string;
  value: number;
  min?: number;
  onChange: (v: number) => void;
}

function InputField({ label, value, min = 1, onChange }: InputFieldProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
        >
          −
        </motion.button>
        <span className="w-12 text-center font-bold text-xl text-primary">{value}</span>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
        >
          +
        </motion.button>
      </div>
    </div>
  );
}

function EMOMTimer() {
  const [totalMinutes, setTotalMinutes] = useState(10);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const { beep } = useAudio();

  const total = totalMinutes * 60;
  const remaining = total - elapsed;
  const currentRound = Math.floor(elapsed / 60) + 1;
  const secondsInMinute = elapsed % 60;
  const minuteProgress = secondsInMinute / 60;

  useEffect(() => {
    if (!running || elapsed >= total) return;
    const tick = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next % 60 === 0 && next < total) {
          beep(880, 0.15);
          vibrate(80);
        }
        if (next >= total) {
          beep(660, 0.4);
          vibrate([100, 50, 100]);
          setRunning(false);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [running, elapsed, total, beep]);

  const reset = () => { setElapsed(0); setRunning(false); };

  if (elapsed >= total) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <p className="text-4xl font-bold text-ios-green">Terminé !</p>
        <motion.button whileTap={{ scale: 0.92 }} onClick={reset}
          className="px-6 py-3 rounded-2xl font-semibold" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
          Recommencer
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {!running && elapsed === 0 && (
        <div className="flex gap-6 mb-2">
          <InputField label="Durée (min)" value={totalMinutes} min={1} onChange={setTotalMinutes} />
        </div>
      )}
      <CircleProgress progress={1 - minuteProgress} color="var(--ios-blue)" size={220} strokeWidth={10}>
        <p className="text-5xl font-bold text-primary tabular-nums">{60 - secondsInMinute}</p>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>sec restantes</p>
        <p className="text-xs font-semibold mt-1" style={{ color: 'var(--ios-blue)' }}>
          Round {currentRound}/{totalMinutes}
        </p>
      </CircleProgress>
      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Temps restant : {fmt(remaining)}</p>
      <div className="flex gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setRunning((r) => !r)}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'var(--ios-blue)', boxShadow: '0 6px 20px rgba(0,122,255,0.4)' }}>
          {running ? <Pause size={24} color="#fff" /> : <Play size={24} color="#fff" fill="#fff" />}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={reset}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-tertiary)' }}>
          <RotateCcw size={22} style={{ color: 'var(--text-primary)' }} />
        </motion.button>
      </div>
    </div>
  );
}

function AMRAPTimer() {
  const [totalMinutes, setTotalMinutes] = useState(10);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const { beep } = useAudio();

  const total = totalMinutes * 60;
  const remaining = total - elapsed;

  useEffect(() => {
    if (!running || elapsed >= total) return;
    const tick = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= total) {
          beep(660, 0.4);
          vibrate([100, 50, 100]);
          setRunning(false);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [running, elapsed, total, beep]);

  const reset = () => { setElapsed(0); setRounds(0); setRunning(false); };

  return (
    <div className="flex flex-col items-center gap-6">
      {!running && elapsed === 0 && (
        <InputField label="Durée (min)" value={totalMinutes} min={1} onChange={setTotalMinutes} />
      )}
      <CircleProgress progress={remaining / total} color="var(--ios-green)" size={220} strokeWidth={10}>
        <p className="text-5xl font-bold text-primary tabular-nums">{fmt(remaining)}</p>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>restant</p>
      </CircleProgress>
      <div className="flex flex-col items-center gap-1">
        <p className="text-6xl font-bold" style={{ color: 'var(--ios-green)' }}>{rounds}</p>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>rounds complétés</p>
      </div>
      <div className="flex gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setRunning((r) => !r)}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'var(--ios-blue)', boxShadow: '0 6px 20px rgba(0,122,255,0.4)' }}>
          {running ? <Pause size={24} color="#fff" /> : <Play size={24} color="#fff" fill="#fff" />}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => { setRounds((r) => r + 1); beep(660, 0.08); vibrate(30); }}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'var(--ios-green)', boxShadow: '0 6px 20px rgba(48,209,88,0.4)' }}>
          <Plus size={26} color="#fff" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={reset}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-tertiary)' }}>
          <RotateCcw size={22} style={{ color: 'var(--text-primary)' }} />
        </motion.button>
      </div>
    </div>
  );
}

function TabataTimer() {
  const [workSecs, setWorkSecs] = useState(20);
  const [restSecs, setRestSecs] = useState(10);
  const [totalRounds, setTotalRounds] = useState(8);
  const [phase, setPhase] = useState<'work' | 'rest'>('work');
  const [elapsed, setElapsed] = useState(0);
  const [round, setRound] = useState(1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const { beep } = useAudio();

  const phaseDuration = phase === 'work' ? workSecs : restSecs;
  const remaining = phaseDuration - elapsed;
  const progress = remaining / phaseDuration;

  const reset = () => { setElapsed(0); setPhase('work'); setRound(1); setRunning(false); setDone(false); };

  useEffect(() => {
    if (!running || done) return;
    const tick = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= phaseDuration) {
          if (phase === 'work') {
            beep(660, 0.15);
            vibrate(60);
            setPhase('rest');
            return 0;
          } else {
            if (round >= totalRounds) {
              beep(880, 0.5);
              vibrate([100, 50, 100, 50, 100]);
              setDone(true);
              setRunning(false);
              return 0;
            }
            beep(880, 0.15);
            vibrate(80);
            setRound((r) => r + 1);
            setPhase('work');
            return 0;
          }
        }
        if (next >= phaseDuration - 3) { beep(440, 0.06); }
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [running, elapsed, phase, phaseDuration, round, totalRounds, done, beep]);

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <p className="text-4xl font-bold text-ios-green">Terminé !</p>
        <p style={{ color: 'var(--text-tertiary)' }}>{totalRounds} rounds complétés</p>
        <motion.button whileTap={{ scale: 0.92 }} onClick={reset}
          className="px-6 py-3 rounded-2xl font-semibold" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
          Recommencer
        </motion.button>
      </div>
    );
  }

  const isWork = phase === 'work';
  const phaseColor = isWork ? 'var(--ios-green)' : 'var(--ios-orange)';

  return (
    <div className="flex flex-col items-center gap-6">
      {!running && elapsed === 0 && (
        <div className="flex gap-4 flex-wrap justify-center">
          <InputField label="Work (sec)" value={workSecs} min={5} onChange={setWorkSecs} />
          <InputField label="Rest (sec)" value={restSecs} min={5} onChange={setRestSecs} />
          <InputField label="Rounds" value={totalRounds} min={1} onChange={setTotalRounds} />
        </div>
      )}
      <CircleProgress progress={progress} color={phaseColor} size={220} strokeWidth={10}>
        <p
          className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: phaseColor }}
        >
          {isWork ? 'Work' : 'Rest'}
        </p>
        <p className="text-6xl font-bold text-primary tabular-nums">{remaining}</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Round {round}/{totalRounds}</p>
      </CircleProgress>
      <div className="flex gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setRunning((r) => !r)}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: phaseColor, boxShadow: `0 6px 20px ${isWork ? 'rgba(48,209,88,0.4)' : 'rgba(255,159,10,0.4)'}` }}>
          {running ? <Pause size={24} color="#fff" /> : <Play size={24} color="#fff" fill="#fff" />}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={reset}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-tertiary)' }}>
          <RotateCcw size={22} style={{ color: 'var(--text-primary)' }} />
        </motion.button>
      </div>
    </div>
  );
}

function ChipperTimer() {
  const [capMinutes, setCapMinutes] = useState(20);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const { beep } = useAudio();

  const cap = capMinutes * 60;
  const isOver = elapsed >= cap;

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= cap) {
          beep(660, 0.4);
          vibrate([200, 100, 200]);
          setRunning(false);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [running, cap, beep]);

  const reset = () => { setElapsed(0); setRunning(false); };

  return (
    <div className="flex flex-col items-center gap-6">
      {!running && elapsed === 0 && (
        <InputField label="Cap (min)" value={capMinutes} min={1} onChange={setCapMinutes} />
      )}
      <CircleProgress
        progress={elapsed / cap}
        color={isOver ? 'var(--ios-red)' : 'var(--ios-orange)'}
        size={220}
        strokeWidth={10}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>
          {isOver ? 'Temps dépassé !' : 'Temps écoulé'}
        </p>
        <p className="text-5xl font-bold text-primary tabular-nums">{fmt(elapsed)}</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Cap : {fmt(cap)}</p>
      </CircleProgress>
      <div className="flex gap-3">
        {!isOver && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setRunning((r) => !r)}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'var(--ios-orange)', boxShadow: '0 6px 20px rgba(255,159,10,0.4)' }}>
            {running ? <Pause size={24} color="#fff" /> : <Play size={24} color="#fff" fill="#fff" />}
          </motion.button>
        )}
        <motion.button whileTap={{ scale: 0.9 }} onClick={reset}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-tertiary)' }}>
          <RotateCcw size={22} style={{ color: 'var(--text-primary)' }} />
        </motion.button>
      </div>
    </div>
  );
}

const MODES: { id: TimerMode; label: string; desc: string }[] = [
  { id: 'emom', label: 'EMOM', desc: 'Every Minute On the Minute' },
  { id: 'amrap', label: 'AMRAP', desc: 'As Many Rounds As Possible' },
  { id: 'tabata', label: 'Tabata', desc: 'Work / Rest alterné' },
  { id: 'chipper', label: 'Chipper', desc: 'Contre la montre avec cap' },
];

export function TimersTab() {
  const [mode, setMode] = useState<TimerMode>('emom');

  return (
    <div className="min-h-screen bg-primary safe-bottom-nav">
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-3xl font-bold text-primary">Timers</h1>
      </div>

      {/* Mode selector */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {MODES.map((m) => (
            <motion.button
              key={m.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => setMode(m.id)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: mode === m.id ? 'var(--ios-blue)' : 'var(--bg-secondary)',
                color: mode === m.id ? '#fff' : 'var(--text-primary)',
                boxShadow: mode === m.id ? '0 4px 12px rgba(0,122,255,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              {m.label}
            </motion.button>
          ))}
        </div>
        <p className="text-xs mt-2 px-1" style={{ color: 'var(--text-tertiary)' }}>
          {MODES.find((m) => m.id === mode)?.desc}
        </p>
      </div>

      {/* Timer */}
      <div className="px-4">
        <div
          className="rounded-3xl p-6"
          style={{ background: 'var(--bg-secondary)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {mode === 'emom' && <EMOMTimer />}
              {mode === 'amrap' && <AMRAPTimer />}
              {mode === 'tabata' && <TabataTimer />}
              {mode === 'chipper' && <ChipperTimer />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
