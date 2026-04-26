import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { SetLog } from '../../types';

interface SetRowProps {
  index: number;
  setLog: SetLog;
  prevSet: SetLog | null;
  isPR: boolean;
  onChange: (field: keyof SetLog, value: number | null) => void;
  onRestStart: () => void;
}

export function SetRow({ index, setLog, prevSet, isPR, onChange, onRestStart }: SetRowProps) {
  const isComplete = setLog.weight !== null && setLog.reps !== null;

  return (
    <motion.div
      layout
      className="flex items-center gap-2 py-2"
      initial={false}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          background: isComplete ? 'var(--ios-green)' : 'var(--bg-tertiary)',
          color: isComplete ? '#fff' : 'var(--text-tertiary)',
        }}
      >
        {index + 1}
      </div>

      <div className="flex-1 flex gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            inputMode="decimal"
            placeholder={prevSet?.weight != null ? String(prevSet.weight) : 'kg'}
            value={setLog.weight ?? ''}
            onChange={(e) => {
              const v = e.target.value === '' ? null : parseFloat(e.target.value);
              onChange('weight', isNaN(v as number) ? null : v);
            }}
            className="w-full text-center py-2 rounded-xl text-sm font-semibold outline-none border transition-colors"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              borderColor: isComplete ? 'var(--ios-green)' : 'transparent',
            }}
          />
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            kg
          </span>
        </div>

        <div className="flex-1 relative">
          <input
            type="number"
            inputMode="numeric"
            placeholder={prevSet?.reps != null ? String(prevSet.reps) : 'reps'}
            value={setLog.reps ?? ''}
            onChange={(e) => {
              const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
              onChange('reps', isNaN(v as number) ? null : v);
            }}
            className="w-full text-center py-2 rounded-xl text-sm font-semibold outline-none border transition-colors"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              borderColor: isComplete ? 'var(--ios-green)' : 'transparent',
            }}
          />
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            reps
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isPR && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Trophy size={16} style={{ color: 'var(--ios-orange)' }} />
          </motion.div>
        )}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onRestStart}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
        >
          Repos
        </motion.button>
      </div>
    </motion.div>
  );
}
