import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStoreContext as useStore } from '../../store/StoreContext';
import { ExerciseCard } from './ExerciseCard';
import { RestTimer } from '../../components/RestTimer';
import { PRToast } from '../../components/PRToast';
import { Day, Program, PRType } from '../../types';

export function SeanceTab() {
  const store = useStore();
  const { state, update } = store;
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [prToast, setPrToast] = useState<{ visible: boolean; name: string; type: PRType | null }>({
    visible: false,
    name: '',
    type: null,
  });

  const currentProgram: Program | undefined = state.programs.find(
    (p) => p.id === state.settings.currentProgramId
  );
  const currentDay: Day | undefined = currentProgram?.days.find(
    (d) => d.id === state.settings.currentDayId
  );

  // Get existing session from state (reactive, no side effects)
  const session = store.getCurrentSession();

  // Create session if missing when a valid day is selected
  useEffect(() => {
    if (!currentDay) return;
    if (!store.getCurrentSession()) {
      try { store.getOrCreateSession(); } catch { /* haptics unavailable */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings.currentProgramId, state.settings.currentDayId, state.settings.currentWeek]);

  const handleSetChange = useCallback(
    (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: number | null) => {
      const currentSession = store.getCurrentSession();
      if (!currentSession) return;

      store.updateSet(currentSession.id, exerciseId, setIndex, field, value);

      // Check PR when both weight and reps exist
      const ex = currentDay?.exercises.find((e) => e.id === exerciseId);
      if (!ex) return;
      const exLog = currentSession.exercises.find((e) => e.exerciseId === exerciseId);
      if (!exLog) return;
      const currentSet = exLog.sets[setIndex];
      const updated = { ...currentSet, [field]: value };
      if (updated.weight && updated.reps) {
        const prType = store.checkAndUpdatePR(exerciseId, ex.name, updated.weight, updated.reps);
        if (prType) {
          setPrToast({ visible: true, name: ex.name, type: prType });
          try { navigator.vibrate?.([50, 30, 80]); } catch { /* haptics unavailable */ }
        }
      }
    },
    [currentDay, store]
  );

  const isPRSet = useCallback(
    (exerciseId: string, setIndex: number): boolean => {
      const currentSession = store.getCurrentSession();
      if (!currentSession) return false;
      const exLog = currentSession.exercises.find((e) => e.exerciseId === exerciseId);
      if (!exLog) return false;
      const s = exLog.sets[setIndex];
      if (!s.weight || !s.reps) return false;
      return store.isPR(exerciseId, s.weight, s.reps);
    },
    [store]
  );

  return (
    <div className="min-h-screen bg-primary safe-bottom-nav">
      <PRToast
        visible={prToast.visible}
        exerciseName={prToast.name}
        prType={prToast.type}
        onDismiss={() => setPrToast((p) => ({ ...p, visible: false }))}
      />
      {restSeconds !== null && (
        <RestTimer seconds={restSeconds} onClose={() => setRestSeconds(null)} />
      )}

      {/* Large Title Header */}
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-3xl font-bold text-primary">Séance</h1>
      </div>

      {/* Program Toggle */}
      <div className="px-4 mb-3">
        <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--bg-tertiary)' }}>
          {state.programs.map((prog) => (
            <motion.button
              key={prog.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                const firstDay = prog.days[0]?.id ?? '';
                update((s) => ({
                  ...s,
                  settings: { ...s.settings, currentProgramId: prog.id, currentDayId: firstDay },
                }));
              }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background: state.settings.currentProgramId === prog.id ? 'var(--bg-secondary)' : 'transparent',
                color: state.settings.currentProgramId === prog.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: state.settings.currentProgramId === prog.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {prog.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Week Selector */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {Array.from({ length: 8 }, (_, i) => i + 1).map((w) => (
            <motion.button
              key={w}
              whileTap={{ scale: 0.9 }}
              onClick={() => update((s) => ({ ...s, settings: { ...s.settings, currentWeek: w } }))}
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
              style={{
                background: state.settings.currentWeek === w ? 'var(--ios-blue)' : 'var(--bg-secondary)',
                color: state.settings.currentWeek === w ? '#fff' : 'var(--text-tertiary)',
                boxShadow: state.settings.currentWeek === w ? '0 4px 12px rgba(0,122,255,0.35)' : 'none',
              }}
            >
              S{w}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Day Selector */}
      {currentProgram && (
        <div className="px-4 mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {currentProgram.days.map((day) => (
              <motion.button
                key={day.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => update((s) => ({ ...s, settings: { ...s.settings, currentDayId: day.id } }))}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: state.settings.currentDayId === day.id ? 'var(--ios-blue)' : 'var(--bg-secondary)',
                  color: state.settings.currentDayId === day.id ? '#fff' : 'var(--text-primary)',
                  boxShadow:
                    state.settings.currentDayId === day.id
                      ? '0 4px 12px rgba(0,122,255,0.35)'
                      : '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {day.name}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Session Header Card */}
      {currentDay && (
        <div className="px-4 mb-4">
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, #007AFF, #0056CC)',
              boxShadow: '0 8px 24px rgba(0,122,255,0.3)',
            }}
          >
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
              {currentDay.name} — Semaine {state.settings.currentWeek}
            </p>
            <h2 className="text-white text-2xl font-bold">{currentDay.sessionName}</h2>
            <p className="text-white/80 text-xs mt-2">{currentDay.warmup}</p>
            <div className="flex gap-2 flex-wrap mt-3">
              {currentDay.muscleBadges.map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exercises */}
      {currentDay && session ? (
        <div className="px-4 flex flex-col gap-3 pb-4">
          {currentDay.exercises.map((exercise) => {
            const exLog = session.exercises.find((e) => e.exerciseId === exercise.id);
            if (!exLog) return null;
            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ExerciseCard
                  exercise={exercise}
                  log={exLog}
                  session={session}
                  onSetChange={(setIndex, field, value) =>
                    handleSetChange(exercise.id, setIndex, field, value)
                  }
                  onNoteChange={(note) => {
                    const s = store.getCurrentSession();
                    if (s) store.updateNote(s.id, exercise.id, note);
                  }}
                  onRestStart={(secs) => {
                    try { navigator.vibrate?.(50); } catch { /* haptics unavailable */ }
                    setRestSeconds(secs);
                  }}
                  isPRSet={(setIndex) => isPRSet(exercise.id, setIndex)}
                  prevData={(setIndex) => store.getPreviousSetData(exercise.id, setIndex)}
                />
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center py-20">
          <p style={{ color: 'var(--text-tertiary)' }}>
            {currentDay ? 'Chargement de la séance...' : 'Sélectionner un programme et un jour'}
          </p>
        </div>
      )}
    </div>
  );
}
