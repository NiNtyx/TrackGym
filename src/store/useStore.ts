import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, SessionLog, ExerciseLog, SetLog, FreeLogEntry, Program, PRType } from '../types';
import { loadState, saveState } from './index';

export function useStore() {
  const [state, setState] = useState<AppState>(loadState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    saveState(state);
  }, [state]);

  const update = useCallback((updater: (s: AppState) => AppState) => {
    setState((prev) => updater(prev));
  }, []);

  // Session management
  const getCurrentSession = useCallback((): SessionLog | undefined => {
    const { currentProgramId, currentDayId, currentWeek } = state.settings;
    const today = new Date().toISOString().split('T')[0];
    return state.sessions.find(
      (s) =>
        s.programId === currentProgramId &&
        s.dayId === currentDayId &&
        s.week === currentWeek &&
        s.date === today
    );
  }, [state]);

  const getOrCreateSession = useCallback((): SessionLog => {
    const existing = getCurrentSession();
    if (existing) return existing;

    const { currentProgramId, currentDayId, currentWeek } = state.settings;
    const prog = state.programs.find((p) => p.id === currentProgramId);
    const day = prog?.days.find((d) => d.id === currentDayId);
    if (!day) throw new Error('Day not found');

    const newSession: SessionLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      programId: currentProgramId,
      dayId: currentDayId,
      week: currentWeek,
      exercises: day.exercises.map((ex) => ({
        exerciseId: ex.id,
        sets: Array.from({ length: ex.sets }, () => ({ weight: null, reps: null })),
        note: '',
      })),
    };

    update((s) => ({ ...s, sessions: [...s.sessions, newSession] }));
    return newSession;
  }, [state, getCurrentSession, update]);

  const updateSet = useCallback(
    (sessionId: string, exerciseId: string, setIndex: number, field: keyof SetLog, value: number | null) => {
      update((s) => {
        const sessions = s.sessions.map((session) => {
          if (session.id !== sessionId) return session;
          const exercises = session.exercises.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex;
            const sets = ex.sets.map((set, i) =>
              i === setIndex ? { ...set, [field]: value } : set
            );
            return { ...ex, sets };
          });
          return { ...session, exercises };
        });
        return { ...s, sessions };
      });
    },
    [update]
  );

  const updateNote = useCallback(
    (sessionId: string, exerciseId: string, note: string) => {
      update((s) => ({
        ...s,
        sessions: s.sessions.map((session) =>
          session.id !== sessionId
            ? session
            : {
                ...session,
                exercises: session.exercises.map((ex) =>
                  ex.exerciseId !== exerciseId ? ex : { ...ex, note }
                ),
              }
        ),
      }));
    },
    [update]
  );

  const updateExerciseLog = useCallback(
    (sessionId: string, exerciseId: string, updates: Partial<ExerciseLog>) => {
      update((s) => ({
        ...s,
        sessions: s.sessions.map((session) =>
          session.id !== sessionId
            ? session
            : {
                ...session,
                exercises: session.exercises.map((ex) =>
                  ex.exerciseId !== exerciseId ? ex : { ...ex, ...updates }
                ),
              }
        ),
      }));
    },
    [update]
  );

  // PR detection
  const checkAndUpdatePR = useCallback(
    (exerciseId: string, exerciseName: string, weight: number, reps: number): PRType | null => {
      const est1RM = weight * (1 + reps / 30);
      const volume = weight * reps;
      const existing = stateRef.current.prs[exerciseId];

      const beatsWeight = !existing || weight > existing.maxWeight;
      const beats1RM = !existing || est1RM > existing.estimated1RM;
      const beatsVolume = !existing || volume > existing.maxVolume;

      if (!beatsWeight && !beats1RM && !beatsVolume) return null;

      // Priority: heaviest single rep > strongest estimated 1RM > biggest volume.
      const type: PRType = beatsWeight ? 'weight' : beats1RM ? '1rm' : 'volume';

      update((s) => ({
        ...s,
        prs: {
          ...s.prs,
          [exerciseId]: {
            exerciseId,
            exerciseName,
            date: new Date().toISOString().split('T')[0],
            maxWeight: Math.max(weight, existing?.maxWeight ?? 0),
            estimated1RM: Math.max(est1RM, existing?.estimated1RM ?? 0),
            maxVolume: Math.max(volume, existing?.maxVolume ?? 0),
          },
        },
      }));
      return type;
    },
    [update]
  );

  const isPR = useCallback(
    (exerciseId: string, weight: number, reps: number): boolean => {
      const existing = state.prs[exerciseId];
      if (!existing || !weight || !reps) return false;
      const est1RM = weight * (1 + reps / 30);
      const volume = weight * reps;
      return weight > existing.maxWeight || est1RM > existing.estimated1RM || volume > existing.maxVolume;
    },
    [state.prs]
  );

  // Previous week data for smart placeholders
  const getPreviousSetData = useCallback(
    (exerciseId: string, setIndex: number): SetLog | null => {
      const { currentProgramId, currentDayId, currentWeek } = state.settings;
      const prevWeekSessions = state.sessions.filter(
        (s) =>
          s.programId === currentProgramId &&
          s.dayId === currentDayId &&
          s.week === currentWeek - 1
      );
      if (!prevWeekSessions.length) return null;
      const lastSession = prevWeekSessions[prevWeekSessions.length - 1];
      const exLog = lastSession.exercises.find((e) => e.exerciseId === exerciseId);
      return exLog?.sets[setIndex] ?? null;
    },
    [state]
  );

  // Free log
  const addFreeLogEntry = useCallback(
    (entry: Omit<FreeLogEntry, 'id' | 'date'>) => {
      const newEntry: FreeLogEntry = {
        ...entry,
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
      };
      update((s) => ({ ...s, freeLog: [...s.freeLog, newEntry] }));
    },
    [update]
  );

  // Program management
  const updatePrograms = useCallback(
    (programs: Program[]) => {
      update((s) => ({ ...s, programs }));
    },
    [update]
  );

  const resetWeek = useCallback(() => {
    update((s) => ({
      ...s,
      settings: { ...s.settings, currentWeek: 1 },
    }));
  }, [update]);

  return {
    state,
    update,
    getCurrentSession,
    getOrCreateSession,
    updateSet,
    updateNote,
    updateExerciseLog,
    checkAndUpdatePR,
    isPR,
    getPreviousSetData,
    addFreeLogEntry,
    updatePrograms,
    resetWeek,
  };
}
