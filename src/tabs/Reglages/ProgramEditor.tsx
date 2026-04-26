import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Program, Day, Exercise } from '../../types';

interface ProgramEditorProps {
  programs: Program[];
  onSave: (programs: Program[]) => void;
  onClose: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function ProgramEditor({ programs: initialPrograms, onSave, onClose }: ProgramEditorProps) {
  const [programs, setPrograms] = useState<Program[]>(JSON.parse(JSON.stringify(initialPrograms)));
  const [activeProgramId, setActiveProgramId] = useState(initialPrograms[0]?.id ?? '');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const activeProgram = programs.find((p) => p.id === activeProgramId);

  const updateProgram = (updater: (p: Program) => Program) => {
    setPrograms((prev) => prev.map((p) => (p.id === activeProgramId ? updater(p) : p)));
  };

  const updateDay = (dayId: string, updater: (d: Day) => Day) => {
    updateProgram((p) => ({ ...p, days: p.days.map((d) => (d.id === dayId ? updater(d) : d)) }));
  };

  const updateExercise = (dayId: string, exId: string, updater: (e: Exercise) => Exercise) => {
    updateDay(dayId, (d) => ({ ...d, exercises: d.exercises.map((e) => (e.id === exId ? updater(e) : e)) }));
  };

  const addDay = () => {
    updateProgram((p) => ({
      ...p,
      days: [...p.days, {
        id: uid(), name: 'Nouveau jour', sessionName: 'Séance',
        warmup: '', muscleBadges: [], exercises: [],
      }],
    }));
  };

  const removeDay = (dayId: string) => {
    updateProgram((p) => ({ ...p, days: p.days.filter((d) => d.id !== dayId) }));
  };

  const addExercise = (dayId: string) => {
    updateDay(dayId, (d) => ({
      ...d,
      exercises: [...d.exercises, {
        id: uid(), name: 'Nouvel exercice', muscles: [],
        sets: 3, repsRange: '10-12', restSeconds: 90, description: '',
      }],
    }));
  };

  const removeExercise = (dayId: string, exId: string) => {
    updateDay(dayId, (d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== exId) }));
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      className="fixed inset-0 z-[80] flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Header */}
      <div className="safe-top" />
      <div className="flex items-center justify-between px-4 py-3 ios-separator">
        <motion.button whileTap={{ scale: 0.92 }} onClick={onClose} className="w-9 h-9 flex items-center justify-center">
          <X size={22} style={{ color: 'var(--text-primary)' }} />
        </motion.button>
        <h2 className="font-bold text-base text-primary">Éditeur de programme</h2>
        <motion.button whileTap={{ scale: 0.92 }}
          onClick={() => onSave(programs)}
          className="px-4 py-1.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--ios-blue)', color: '#fff' }}>
          Sauver
        </motion.button>
      </div>

      {/* Program tabs */}
      <div className="flex gap-2 px-4 py-3 ios-separator overflow-x-auto scrollbar-hide">
        {programs.map((p) => (
          <motion.button key={p.id} whileTap={{ scale: 0.93 }}
            onClick={() => setActiveProgramId(p.id)}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: activeProgramId === p.id ? 'var(--ios-blue)' : 'var(--bg-secondary)',
              color: activeProgramId === p.id ? '#fff' : 'var(--text-primary)',
            }}>
            {p.name}
          </motion.button>
        ))}
      </div>

      {/* Days */}
      <div className="flex-1 overflow-y-auto">
        {activeProgram?.days.map((day) => (
          <div key={day.id} style={{ borderBottom: '1px solid var(--separator)' }}>
            {/* Day header */}
            <div className="flex items-center px-4 py-3">
              <motion.button whileTap={{ scale: 0.92 }}
                className="flex-1 flex items-center gap-2"
                onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}>
                {expandedDay === day.id ? <ChevronUp size={16} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />}
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm text-primary">{day.name} — {day.sessionName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{day.exercises.length} exercices</p>
                </div>
              </motion.button>
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => removeDay(day.id)}>
                <Trash2 size={16} style={{ color: 'var(--ios-red)' }} />
              </motion.button>
            </div>

            {expandedDay === day.id && (
              <div className="px-4 pb-3">
                {/* Day fields */}
                {[
                  { label: 'Nom du jour', value: day.name, key: 'name' },
                  { label: 'Nom de la séance', value: day.sessionName, key: 'sessionName' },
                  { label: 'Échauffement', value: day.warmup, key: 'warmup' },
                ].map(({ label, value, key }) => (
                  <div key={key} className="mb-2">
                    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                    <input
                      value={value}
                      onChange={(e) => updateDay(day.id, (d) => ({ ...d, [key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                ))}

                {/* Exercises */}
                <p className="text-xs font-semibold mt-3 mb-2" style={{ color: 'var(--text-tertiary)' }}>Exercices</p>
                {day.exercises.map((ex) => (
                  <div key={ex.id} className="rounded-xl p-3 mb-2" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <input
                        value={ex.name}
                        onChange={(e) => updateExercise(day.id, ex.id, (e2) => ({ ...e2, name: e.target.value }))}
                        className="flex-1 font-semibold text-sm bg-transparent outline-none text-primary mr-2"
                        placeholder="Nom de l'exercice"
                      />
                      <motion.button whileTap={{ scale: 0.88 }} onClick={() => removeExercise(day.id, ex.id)}>
                        <Trash2 size={14} style={{ color: 'var(--ios-red)' }} />
                      </motion.button>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <p className="text-[10px] mb-1" style={{ color: 'var(--text-tertiary)' }}>Séries</p>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={ex.sets}
                          onChange={(e) => updateExercise(day.id, ex.id, (ex2) => ({ ...ex2, sets: parseInt(e.target.value) || 1 }))}
                          className="w-full px-2 py-1.5 rounded-lg text-sm outline-none text-center"
                          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] mb-1" style={{ color: 'var(--text-tertiary)' }}>Reps</p>
                        <input
                          value={ex.repsRange}
                          onChange={(e) => updateExercise(day.id, ex.id, (ex2) => ({ ...ex2, repsRange: e.target.value }))}
                          className="w-full px-2 py-1.5 rounded-lg text-sm outline-none text-center"
                          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] mb-1" style={{ color: 'var(--text-tertiary)' }}>Repos (s)</p>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={ex.restSeconds}
                          onChange={(e) => updateExercise(day.id, ex.id, (ex2) => ({ ...ex2, restSeconds: parseInt(e.target.value) || 60 }))}
                          className="w-full px-2 py-1.5 rounded-lg text-sm outline-none text-center"
                          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-[10px] mb-1" style={{ color: 'var(--text-tertiary)' }}>Muscles (séparés par virgule)</p>
                      <input
                        value={ex.muscles.join(', ')}
                        onChange={(e) => updateExercise(day.id, ex.id, (ex2) => ({ ...ex2, muscles: e.target.value.split(',').map((m) => m.trim()).filter(Boolean) }))}
                        className="w-full px-2 py-1.5 rounded-lg text-sm outline-none"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                ))}
                <motion.button whileTap={{ scale: 0.93 }}
                  onClick={() => addExercise(day.id)}
                  className="flex items-center gap-2 py-2 text-sm font-semibold"
                  style={{ color: 'var(--ios-blue)' }}>
                  <Plus size={16} /> Ajouter un exercice
                </motion.button>
              </div>
            )}
          </div>
        ))}

        <div className="px-4 py-3">
          <motion.button whileTap={{ scale: 0.93 }}
            onClick={addDay}
            className="flex items-center gap-2 py-2 text-sm font-semibold"
            style={{ color: 'var(--ios-blue)' }}>
            <Plus size={16} /> Ajouter un jour
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
