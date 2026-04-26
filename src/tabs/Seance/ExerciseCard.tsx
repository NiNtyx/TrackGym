import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Exercise, ExerciseLog, SessionLog } from '../../types';
import { SetRow } from './SetRow';

interface ExerciseCardProps {
  exercise: Exercise;
  log: ExerciseLog;
  session: SessionLog;
  onSetChange: (setIndex: number, field: 'weight' | 'reps', value: number | null) => void;
  onNoteChange: (note: string) => void;
  onRestStart: (seconds: number) => void;
  isPRSet: (setIndex: number) => boolean;
  prevData: (setIndex: number) => { weight: number | null; reps: number | null } | null;
}

function tagLabel(tag?: string) {
  if (tag === 'added') return { text: '✦ Ajouté', color: 'var(--ios-blue)' };
  if (tag === 'improved') return { text: '⬆ Amélioré', color: 'var(--ios-green)' };
  return null;
}

export function ExerciseCard({
  exercise, log, onSetChange, onNoteChange, onRestStart, isPRSet, prevData,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showNote, setShowNote] = useState(false);

  const allDone = log.sets.every((s) => s.weight !== null && s.reps !== null);
  const restMins = Math.floor(exercise.restSeconds / 60);
  const restSecs = exercise.restSeconds % 60;
  const restLabel = restMins > 0 ? `${restMins}'${String(restSecs).padStart(2, '0')}"` : `${restSecs}"`;
  const tag = tagLabel(exercise.tag);

  const handleSetChange = useCallback(
    (setIndex: number, field: 'weight' | 'reps', value: number | null) => {
      onSetChange(setIndex, field, value);
    },
    [onSetChange]
  );

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--bg-secondary)',
        border: `1.5px solid ${allDone ? 'var(--ios-green)' : 'transparent'}`,
        boxShadow: allDone
          ? '0 4px 20px rgba(48,209,88,0.15)'
          : '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <motion.div
        className="flex items-start justify-between p-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-base text-primary leading-tight">{exercise.name}</h3>
            {tag && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${tag.color}20`, color: tag.color }}
              >
                {tag.text}
              </span>
            )}
          </div>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {exercise.muscles.join(' · ')}
          </p>
          <p className="text-[12px] mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {exercise.sets}×{exercise.repsRange} — Repos {restLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {allDone && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'var(--ios-green)' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
          {expanded ? (
            <ChevronUp size={18} style={{ color: 'var(--text-tertiary)' }} />
          ) : (
            <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />
          )}
        </div>
      </motion.div>

      {/* Sets */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-2" style={{ borderTop: '1px solid var(--separator)' }}>
              <div className="pt-2">
                {log.sets.map((setLog, i) => (
                  <div key={i}>
                    <SetRow
                      index={i}
                      setLog={setLog}
                      prevSet={prevData(i)}
                      isPR={isPRSet(i)}
                      onChange={(field, value) => handleSetChange(i, field, value)}
                      onRestStart={() => onRestStart(exercise.restSeconds)}
                    />
                    {i < log.sets.length - 1 && (
                      <div style={{ borderBottom: '1px solid var(--separator)', marginLeft: 32 }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Note toggle */}
              <div className="mt-3 mb-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowNote((s) => !s)}
                  className="text-[12px] font-medium"
                  style={{ color: 'var(--ios-blue)' }}
                >
                  {showNote ? 'Masquer note' : 'Ajouter une note'}
                </motion.button>
                <AnimatePresence>
                  {showNote && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-2"
                    >
                      <textarea
                        value={log.note}
                        onChange={(e) => onNoteChange(e.target.value)}
                        placeholder="Sensation, forme, remarque..."
                        rows={2}
                        className="w-full rounded-xl p-3 text-sm outline-none resize-none"
                        style={{
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
