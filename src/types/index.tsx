export interface Exercise {
  id: string;
  name: string;
  muscles: string[];
  sets: number;
  repsRange: string;
  restSeconds: number;
  description: string;
  tag?: 'added' | 'improved';
  isBodyweight?: boolean;
}

export interface Day {
  id: string;
  name: string;
  sessionName: string;
  warmup: string;
  muscleBadges: string[];
  exercises: Exercise[];
}

export interface Program {
  id: string;
  name: string;
  days: Day[];
}

export interface SetLog {
  weight: number | null;
  reps: number | null;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
  note: string;
  rpe?: number;
  done?: boolean;
}

export interface SessionLog {
  id: string;
  date: string;
  programId: string;
  dayId: string;
  week: number;
  exercises: ExerciseLog[];
  completedAt?: string;
}

export interface PR {
  exerciseId: string;
  exerciseName: string;
  date: string;
  maxWeight: number;
  estimated1RM: number;
  maxVolume: number;
}

export type PRType = 'weight' | '1rm' | 'volume';

export interface FreeLogEntry {
  id: string;
  date: string;
  exerciseName: string;
  sets: SetLog[];
  note: string;
}

export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  currentProgramId: string;
  currentWeek: number;
  currentDayId: string;
}

export interface AppState {
  programs: Program[];
  sessions: SessionLog[];
  prs: Record<string, PR>;
  freeLog: FreeLogEntry[];
  settings: Settings;
  lastModified: string;
}
