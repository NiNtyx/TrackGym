import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Trophy, TrendingUp, Layers, Dumbbell, LucideIcon } from 'lucide-react';
import { AppState, PR } from '../../types';

interface StatsTabProps {
  state: AppState;
}

type Metric = '1rm' | 'poids' | 'volume';

function est1RM(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function SummaryTile({ icon: Icon, label, value, color }: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: 'var(--bg-secondary)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${color}20` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-xl font-bold text-primary leading-none">{value}</p>
    </div>
  );
}

export function StatsTab({ state }: StatsTabProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>('1rm');

  const prs = Object.values(state.prs) as PR[];

  // Summary stats
  const totalSessions = state.sessions.length;
  const totalSets = useMemo(
    () => state.sessions.reduce((acc, s) => acc + s.exercises.reduce((a, e) => a + e.sets.length, 0), 0),
    [state.sessions]
  );
  const totalVolume = useMemo(
    () =>
      state.sessions.reduce(
        (acc, s) =>
          acc +
          s.exercises.reduce(
            (a, e) =>
              a + e.sets.reduce((b, set) => b + (set.weight ?? 0) * (set.reps ?? 0), 0),
            0
          ),
        0
      ) / 1000,
    [state.sessions]
  );
  const totalPRs = prs.length;

  // All exercises across programs
  const allExercises = useMemo(() => {
    const map = new Map<string, string>();
    state.programs.forEach((p) => p.days.forEach((d) => d.exercises.forEach((e) => map.set(e.id, e.name))));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [state.programs]);

  // PR list sorted by 1RM
  const prsSorted = [...prs].sort((a, b) => b.estimated1RM - a.estimated1RM);

  // Chart data for selected exercise
  const chartData = useMemo(() => {
    if (!selectedExerciseId) return [];
    const exerciseId = selectedExerciseId;

    return state.sessions
      .filter((s) => s.exercises.some((e) => e.exerciseId === exerciseId))
      .map((s) => {
        const exLog = s.exercises.find((e) => e.exerciseId === exerciseId);
        if (!exLog) return null;
        const validSets = exLog.sets.filter((set) => set.weight && set.reps);
        if (!validSets.length) return null;
        const maxWeight = Math.max(...validSets.map((set) => set.weight ?? 0));
        const max1RM = Math.max(
          ...validSets.map((set) => est1RM(set.weight ?? 0, set.reps ?? 0))
        );
        const totalVol = validSets.reduce((a, set) => a + (set.weight ?? 0) * (set.reps ?? 0), 0);
        return {
          date: formatDate(s.date),
          '1rm': Math.round(max1RM * 10) / 10,
          poids: maxWeight,
          volume: Math.round(totalVol),
        };
      })
      .filter(Boolean);
  }, [selectedExerciseId, state.sessions]);

  const selectedName = allExercises.find((e) => e.id === selectedExerciseId)?.name ?? '';

  const metricLabels: Record<Metric, string> = {
    '1rm': '1RM estimé (kg)',
    poids: 'Poids max (kg)',
    volume: 'Volume (kg)',
  };

  const chartMin = chartData.length
    ? Math.min(...chartData.map((d) => (d as Record<Metric, number>)[metric])) * 0.9
    : 0;
  const chartMax = chartData.length
    ? Math.max(...chartData.map((d) => (d as Record<Metric, number>)[metric])) * 1.05
    : 100;

  const evolution = chartData.length >= 2
    ? (((chartData[chartData.length - 1] as Record<Metric, number>)[metric] /
        (chartData[0] as Record<Metric, number>)[metric] - 1) * 100).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-primary safe-bottom-nav">
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-3xl font-bold text-primary">Stats</h1>
      </div>

      {/* Summary grid */}
      <div className="px-4 mb-5 grid grid-cols-2 gap-3">
        <SummaryTile icon={Dumbbell} label="Séances" value={String(totalSessions)} color="var(--ios-blue)" />
        <SummaryTile icon={Layers} label="Séries totales" value={String(totalSets)} color="var(--ios-green)" />
        <SummaryTile
          icon={TrendingUp}
          label="Volume total"
          value={`${totalVolume.toFixed(1)} t`}
          color="var(--ios-orange)"
        />
        <SummaryTile icon={Trophy} label="Records (PR)" value={String(totalPRs)} color="var(--ios-red)" />
      </div>

      {/* Exercise selector */}
      <div className="px-4 mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Progression par exercice
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {allExercises.map((ex) => (
            <motion.button
              key={ex.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => setSelectedExerciseId(ex.id === selectedExerciseId ? null : ex.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background:
                  selectedExerciseId === ex.id ? 'var(--ios-blue)' : 'var(--bg-secondary)',
                color: selectedExerciseId === ex.id ? '#fff' : 'var(--text-primary)',
                boxShadow:
                  selectedExerciseId === ex.id
                    ? '0 4px 12px rgba(0,122,255,0.3)'
                    : '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              {ex.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {selectedExerciseId && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mb-5"
        >
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--bg-secondary)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-base text-primary">{selectedName}</p>
              {evolution && (
                <span
                  className="text-sm font-bold"
                  style={{ color: parseFloat(evolution) >= 0 ? 'var(--ios-green)' : 'var(--ios-red)' }}
                >
                  {parseFloat(evolution) >= 0 ? '+' : ''}{evolution}%
                </span>
              )}
            </div>

            {/* Metric toggle */}
            <div className="flex gap-1 mb-4 rounded-xl p-1" style={{ background: 'var(--bg-tertiary)' }}>
              {(['1rm', 'poids', 'volume'] as Metric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: metric === m ? 'var(--bg-secondary)' : 'transparent',
                    color: metric === m ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  {m === '1rm' ? '1RM' : m === 'poids' ? 'Poids' : 'Volume'}
                </button>
              ))}
            </div>

            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[chartMin, chartMax]}
                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 12,
                      fontSize: 12,
                      color: 'var(--text-primary)',
                    }}
                    formatter={(value: unknown) => [`${value} kg`, metricLabels[metric]]}
                  />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    stroke="var(--ios-blue)"
                    strokeWidth={2.5}
                    dot={{ fill: 'var(--ios-blue)', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: 'var(--ios-blue)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center">
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Aucune donnée pour cet exercice
                </p>
              </div>
            )}

            {chartData.length > 0 && (
              <div className="flex justify-around mt-3 pt-3" style={{ borderTop: '1px solid var(--separator)' }}>
                {[
                  { label: 'Min', value: Math.min(...chartData.map((d) => (d as Record<Metric, number>)[metric])) },
                  { label: 'Max', value: Math.max(...chartData.map((d) => (d as Record<Metric, number>)[metric])) },
                  { label: 'Dernier', value: (chartData[chartData.length - 1] as Record<Metric, number>)[metric] },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                    <p className="font-bold text-base text-primary">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* PR list */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Records Personnels
        </p>
        {prsSorted.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <Trophy size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
            <p style={{ color: 'var(--text-tertiary)' }}>Aucun PR pour l'instant</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Complétez des séances pour voir vos records
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-secondary)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            {prsSorted.map((pr, i) => (
              <div key={pr.exerciseId}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-primary">{pr.exerciseName}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(pr.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: 'var(--ios-orange)' }}>
                      1RM {pr.estimated1RM.toFixed(1)} kg
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                      {pr.maxWeight} kg max
                    </p>
                  </div>
                </div>
                {i < prsSorted.length - 1 && (
                  <div style={{ borderBottom: '1px solid var(--separator)', marginLeft: 16 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
