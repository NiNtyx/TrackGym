import { motion } from 'framer-motion';
import { Dumbbell, BarChart2, Calendar, Timer, Settings, LucideIcon } from 'lucide-react';

export type Tab = 'seance' | 'stats' | 'calendrier' | 'timers' | 'reglages';

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'seance', label: 'Séance', Icon: Dumbbell },
  { id: 'stats', label: 'Stats', Icon: BarChart2 },
  { id: 'calendrier', label: 'Calendrier', Icon: Calendar },
  { id: 'timers', label: 'Timers', Icon: Timer },
  { id: 'reglages', label: 'Réglages', Icon: Settings },
];

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

function vibrate(ms: number) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 tab-bar glass border-t border-[var(--glass-border)]">
      <div className="flex items-start justify-around pt-2 px-2">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <motion.button
              key={id}
              onClick={() => { vibrate(30); onChange(id); }}
              className="flex flex-col items-center gap-0.5 min-w-0 flex-1 py-1 px-1 rounded-xl"
              whileTap={{ scale: 0.88 }}
              transition={{ duration: 0.12 }}
            >
              <motion.div
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  style={{ color: isActive ? 'var(--ios-blue)' : 'var(--text-tertiary)' }}
                />
              </motion.div>
              <span
                className="text-[10px] font-medium tracking-tight truncate"
                style={{ color: isActive ? 'var(--ios-blue)' : 'var(--text-tertiary)' }}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
