import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppState } from '../../types';

interface CalendarTabProps {
  state: AppState;
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function CalendarTab({ state }: CalendarTabProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [direction, setDirection] = useState(0);

  const trainedDates = useMemo(() => {
    const set = new Set<string>();
    state.sessions.forEach((s) => set.add(s.date));
    return set;
  }, [state.sessions]);

  const todayStr = isoDate(now.getFullYear(), now.getMonth(), now.getDate());

  // Build calendar grid
  const cells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    let weekday = firstDay.getDay(); // 0=Sun
    weekday = weekday === 0 ? 6 : weekday - 1; // make Mon=0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const list: (number | null)[] = Array.from({ length: weekday }, () => null);
    for (let d = 1; d <= daysInMonth; d++) list.push(d);
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [viewYear, viewMonth]);

  const navigate = (delta: number) => {
    setDirection(delta);
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  // Stats
  const sessionsThisMonth = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    return state.sessions.filter((s) => s.date.startsWith(prefix)).length;
  }, [state.sessions, viewYear, viewMonth]);

  const sessionsThisWeek = useMemo(() => {
    const today = new Date();
    const mon = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - (day === 0 ? 6 : day - 1);
    mon.setDate(diff);
    const monStr = isoDate(mon.getFullYear(), mon.getMonth(), mon.getDate());
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const sunStr = isoDate(sun.getFullYear(), sun.getMonth(), sun.getDate());
    return state.sessions.filter((s) => s.date >= monStr && s.date <= sunStr).length;
  }, [state.sessions]);

  const sessionsTotal = state.sessions.length;

  return (
    <div className="min-h-screen bg-primary safe-bottom-nav">
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-3xl font-bold text-primary">Calendrier</h1>
      </div>

      {/* Month Navigator */}
      <div className="px-4 mb-4">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-secondary)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          {/* Month Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <ChevronLeft size={18} style={{ color: 'var(--text-primary)' }} />
            </motion.button>

            <AnimatePresence mode="wait" initial={false}>
              <motion.h2
                key={`${viewYear}-${viewMonth}`}
                initial={{ x: direction * 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction * -40, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-bold text-primary"
              >
                {MONTHS_FR[viewMonth]} {viewYear}
              </motion.h2>
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate(1)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <ChevronRight size={18} style={{ color: 'var(--text-primary)' }} />
            </motion.button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-2 pb-1">
            {DAYS_FR.map((d) => (
              <div key={d} className="text-center py-1">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                  {d}
                </span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${viewYear}-${viewMonth}`}
              initial={{ x: direction * 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-7 px-2 pb-3 gap-y-1"
            >
              {cells.map((day, i) => {
                if (!day) {
                  return <div key={`empty-${i}`} />;
                }
                const dateStr = isoDate(viewYear, viewMonth, day);
                const isTrained = trainedDates.has(dateStr);
                const isToday = dateStr === todayStr;
                const isTrainedToday = isTrained && isToday;

                return (
                  <div key={day} className="flex items-center justify-center py-1">
                    <motion.div
                      whileTap={{ scale: 0.88 }}
                      className="w-9 h-9 rounded-full flex items-center justify-center relative"
                      style={{
                        background: isTrainedToday
                          ? 'var(--ios-orange)'
                          : isTrained
                          ? 'var(--ios-green)'
                          : isToday
                          ? 'var(--ios-blue)'
                          : 'transparent',
                      }}
                    >
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color:
                            isTrained || isToday ? '#fff' : 'var(--text-primary)',
                        }}
                      >
                        {day}
                      </span>
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 pb-3 flex-wrap">
            {[
              { color: 'var(--ios-green)', label: 'Entraîné' },
              { color: 'var(--ios-orange)', label: "Aujourd'hui entraîné" },
              { color: 'var(--ios-blue)', label: "Aujourd'hui" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Cette semaine', value: sessionsThisWeek },
          { label: 'Ce mois', value: sessionsThisMonth },
          { label: 'Total', value: sessionsTotal },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl p-4 text-center"
            style={{ background: 'var(--bg-secondary)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <p className="text-2xl font-bold text-primary">{value}</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
