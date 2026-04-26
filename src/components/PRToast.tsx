import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useEffect } from 'react';
import { PRType } from '../types';

interface PRToastProps {
  visible: boolean;
  exerciseName: string;
  prType: PRType | null;
  onDismiss: () => void;
}

const PR_LABELS: Record<PRType, string> = {
  weight: 'Poids max battu',
  '1rm': '1RM estimé battu',
  volume: 'Volume max battu',
};

export function PRToast({ visible, exerciseName, prType, onDismiss }: PRToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed top-4 left-4 right-4 z-[100] glass rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{
            background: 'rgba(255, 159, 10, 0.9)',
            border: '1px solid rgba(255,200,80,0.4)',
            boxShadow: '0 8px 32px rgba(255,159,10,0.3)',
            marginTop: 'env(safe-area-inset-top, 0px)',
          }}
          onClick={onDismiss}
        >
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Nouveau Record Personnel !</p>
            <p className="text-white/90 text-xs">
              {exerciseName}
              {prType ? ` — ${PR_LABELS[prType]}` : ''}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
