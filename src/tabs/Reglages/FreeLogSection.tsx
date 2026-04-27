import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import { FreeLogEntry, SetLog } from '../../types';

interface FreeLogSectionProps {
  entries: FreeLogEntry[];
  onAdd: (entry: Omit<FreeLogEntry, 'id' | 'date'>) => void;
  onClose: () => void;
}

function emptySet(): SetLog {
  return { weight: null, reps: null };
}

export function FreeLogSection({ entries, onAdd, onClose }: FreeLogSectionProps) {
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState<SetLog[]>([emptySet(), emptySet(), emptySet()]);
  const [note, setNote] = useState('');

  const updateSet = (i: number, field: keyof SetLog, value: string) => {
    const v = value === '' ? null : parseFloat(value);
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: isNaN(v as number) ? null : v } : s)));
  };

  const handleAdd = () => {
    if (!exerciseName.trim()) return;
    onAdd({ exerciseName: exerciseName.trim(), sets, note });
    setExerciseName('');
    setSets([emptySet(), emptySet(), emptySet()]);
    setNote('');
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
      <div className="safe-top" />
      <div className="flex items-center justify-between px-4 py-3 ios-separator">
        <motion.button whileTap={{ scale: 0.92 }} onClick={onClose} className="w-9 h-9 flex items-center justify-center">
          <X size={22} style={{ color: 'var(--text-primary)' }} />
        </motion.button>
        <h2 className="font-bold text-base text-primary">Log libre</h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* New entry form */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-secondary)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="font-semibold text-sm mb-3 text-primary">Nouvel exercice</p>
          <input
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            placeholder="Nom de l'exercice"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          />

          {/* Sets */}
          {sets.map((set, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <span className="w-5 shrink-0 flex items-center justify-center text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>
                {i + 1}
              </span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="kg"
                value={set.weight ?? ''}
                onChange={(e) => updateSet(i, 'weight', e.target.value)}
                className="flex-1 min-w-0 text-center px-2 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="reps"
                value={set.reps ?? ''}
                onChange={(e) => updateSet(i, 'reps', e.target.value)}
                className="flex-1 min-w-0 text-center px-2 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setSets((prev) => prev.filter((_, idx) => idx !== i))}
                className="w-7 h-9 shrink-0 flex items-center justify-center"
              >
                <Trash2 size={14} style={{ color: 'var(--ios-red)' }} />
              </motion.button>
            </div>
          ))}

          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setSets((prev) => [...prev, emptySet()])}
            className="flex items-center gap-1.5 text-xs font-semibold mt-1 mb-3"
            style={{ color: 'var(--ios-blue)' }}
          >
            <Plus size={14} /> Ajouter une série
          </motion.button>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optionnel)"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none mb-3"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          />

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleAdd}
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--ios-blue)', color: '#fff' }}
          >
            Enregistrer
          </motion.button>
        </div>

        {/* History */}
        {entries.length > 0 && (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
              Historique
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              {[...entries].reverse().map((entry, i) => (
                <div key={entry.id}>
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-primary">{entry.exerciseName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(entry.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {entry.sets.filter((s) => s.weight && s.reps).map((s, j) => (
                        <span key={j} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {s.weight}kg × {s.reps}
                        </span>
                      ))}
                    </div>
                    {entry.note && (
                      <p className="text-xs mt-1 italic" style={{ color: 'var(--text-tertiary)' }}>{entry.note}</p>
                    )}
                  </div>
                  {i < entries.length - 1 && <div style={{ borderBottom: '1px solid var(--separator)', marginLeft: 16 }} />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
