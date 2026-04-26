import { AppState, Settings } from '../types';
import { DEFAULT_PROGRAMS } from '../data/programs';

const STORAGE_KEY = 'gym_tracker_v1';

function getDefaultDayId(programId: string): string {
  const prog = DEFAULT_PROGRAMS.find((p) => p.id === programId);
  return prog?.days[0]?.id ?? '';
}

export function getDefaultState(): AppState {
  return {
    programs: DEFAULT_PROGRAMS,
    sessions: [],
    prs: {},
    freeLog: [],
    settings: {
      theme: 'auto',
      currentProgramId: 'original',
      currentWeek: 1,
      currentDayId: getDefaultDayId('original'),
    },
    lastModified: new Date().toISOString(),
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const defaults = getDefaultState();
    return {
      programs: parsed.programs ?? defaults.programs,
      sessions: parsed.sessions ?? [],
      prs: parsed.prs ?? {},
      freeLog: parsed.freeLog ?? [],
      settings: { ...defaults.settings, ...(parsed.settings ?? {}) },
      lastModified: parsed.lastModified ?? defaults.lastModified,
    };
  } catch {
    return getDefaultState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastModified: new Date().toISOString() }));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

export function exportState(state: AppState): void {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gymtracker-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importState(json: string): AppState {
  const parsed = JSON.parse(json) as Partial<AppState>;
  const defaults = getDefaultState();
  return {
    programs: parsed.programs ?? defaults.programs,
    sessions: parsed.sessions ?? [],
    prs: parsed.prs ?? {},
    freeLog: parsed.freeLog ?? [],
    settings: { ...defaults.settings, ...(parsed.settings ?? {}) },
    lastModified: new Date().toISOString(),
  };
}

export function updateSettings(state: AppState, settings: Partial<Settings>): AppState {
  return { ...state, settings: { ...state.settings, ...settings } };
}
