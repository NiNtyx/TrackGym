import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { AppState } from '../types';

interface HomeScreenProps {
  state: AppState;
  onDismiss: () => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 18) return 'Bonjour';
  return 'Bonsoir';
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getDayName(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'long' });
}

function getTodayDayId(state: AppState): string | null {
  const program = state.programs.find((p) => p.id === state.settings.currentProgramId);
  if (!program) return null;
  const today = new Date().getDay();
  const dayMap: Record<number, string[]> = {
    1: ['lundi', 'lun', 'monday'],
    2: ['mardi', 'mar', 'tuesday'],
    3: ['mercredi', 'mer', 'wednesday'],
    4: ['jeudi', 'jeu', 'thursday'],
    5: ['vendredi', 'ven', 'friday'],
    6: ['samedi', 'sam', 'saturday'],
    0: ['dimanche', 'dim', 'sunday'],
  };
  const targets = dayMap[today] || [];
  const matched = program.days.find((d) =>
    targets.some((t) => d.name.toLowerCase().includes(t))
  );
  return matched?.id ?? null;
}

function getTodaySession(state: AppState): { sessionName: string; dayName: string; programName: string } | null {
  const program = state.programs.find((p) => p.id === state.settings.currentProgramId);
  if (!program) return null;
  const dayId = getTodayDayId(state);
  if (!dayId) return null;
  const day = program.days.find((d) => d.id === dayId);
  if (!day) return null;
  return { sessionName: day.sessionName, dayName: day.name, programName: program.name };
}
}

export function HomeScreen({ state, onDismiss }: HomeScreenProps) {
  const [now, setNow] = useState(new Date());
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const session = getTodaySession(state);
  const greeting = getGreeting();
  const dayLabel = getDayName(now);
  const time = formatTime(now);

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: dragY }}
      exit={{ y: '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.6, bottom: 0 }}
      onDrag={(_, info) => {
        if (info.offset.y < 0) setDragY(info.offset.y);
      }}
      onDragEnd={(_, info) => {
        if (info.offset.y < -120 || info.velocity.y < -500) {
          onDismiss();
        } else {
          setDragY(0);
        }
      }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 select-none cursor-grab active:cursor-grabbing"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      {/* Home screen (shown once per day) */}
      <AnimatePresence>
        {showHome && <HomeScreen state={state} onDismiss={dismissHome} />}
      </AnimatePresence>
    >
      {/* Logo qui tourne */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 12, ease: 'linear', repeat: Infinity }}
        className="mb-10"
      >
        <img
          src={`${import.meta.env.BASE_URL}icon.png`}
          alt="Logo"
          className="w-40 h-40 object-contain"
          style={{ filter: 'drop-shadow(0 8px 32px rgba(255,255,255,0.15))' }}
        />
      </motion.div>

      {/* Greeting */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold mb-2"
      >
        {greeting}
      </motion.h1>

      {/* Heure */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-5xl font-light tabular-nums mb-8"
        style={{ color: 'var(--text-secondary)' }}
      >
        {time}
      </motion.p>

      {/* Séance du jour */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-16"
      >
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Aujourd'hui · {dayLabel}
        </p>
        {session ? (
          <p className="text-xl font-semibold">{session.sessionName}</p>
        ) : (
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            Pas de séance prévue
          </p>
        )}
      </motion.div>

      {/* Slide indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, -8, 0] }}
        transition={{
          opacity: { delay: 0.6 },
          y: { duration: 1.5, ease: 'easeInOut', repeat: Infinity, delay: 0.6 },
        }}
        className="absolute bottom-12 flex flex-col items-center gap-2"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ChevronUp size={28} />
        <p className="text-xs">Glissez vers le haut</p>
      </motion.div>
    </motion.div>
  );
}