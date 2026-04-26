import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, RotateCcw, Sun, Moon, Monitor, ChevronRight, Trash2, Copy, Check, LucideIcon } from 'lucide-react';
import { AppState } from '../../types';
import { exportState, importState } from '../../store';
import { ProgramEditor } from './ProgramEditor';
import { FreeLogSection } from './FreeLogSection';

interface ReglagesTabProps {
  state: AppState;
  onUpdate: (updater: (s: AppState) => AppState) => void;
  onResetWeek: () => void;
}

type ThemeOption = 'auto' | 'light' | 'dark';
const THEME_OPTIONS: { id: ThemeOption; label: string; Icon: LucideIcon }[] = [
  { id: 'auto', label: 'Auto', Icon: Monitor },
  { id: 'light', label: 'Clair', Icon: Sun },
  { id: 'dark', label: 'Sombre', Icon: Moon },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-widest px-4 mb-2" style={{ color: 'var(--text-tertiary)' }}>
        {title}
      </p>
      <div className="rounded-2xl overflow-hidden mx-4" style={{ background: 'var(--bg-secondary)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ icon, label, desc, right, onClick, destructive }: {
  icon?: React.ReactNode;
  label: string;
  desc?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3.5 ios-separator last:border-0"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: destructive ? 'var(--ios-red)' : 'var(--text-primary)' }}>
          {label}
        </p>
        {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>}
      </div>
      {right ?? (onClick && <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />)}
    </motion.div>
  );
}

export function ReglagesTab({ state, onUpdate, onResetWeek }: ReglagesTabProps) {
  const [showProgramEditor, setShowProgramEditor] = useState(false);
  const [showFreeLog, setShowFreeLog] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const newState = importState(ev.target?.result as string);
        onUpdate(() => newState);
      } catch {
        alert('Fichier invalide');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const copyForClaude = () => {
    const recent = state.sessions.slice(-5);
    const exerciseNameById = new Map<string, string>();
    state.programs.forEach((p) =>
      p.days.forEach((d) => d.exercises.forEach((e) => exerciseNameById.set(e.id, e.name)))
    );

    const sessionsText = recent
      .map((s) => {
        const prog = state.programs.find((p) => p.id === s.programId);
        const day = prog?.days.find((d) => d.id === s.dayId);
        const header = `## ${s.date} — ${prog?.name ?? s.programId} / ${day?.name ?? s.dayId} (S${s.week})`;
        const lines = s.exercises
          .map((ex) => {
            const name = exerciseNameById.get(ex.exerciseId) ?? ex.exerciseId;
            const sets = ex.sets
              .map((set, i) =>
                set.weight != null && set.reps != null
                  ? `S${i + 1} ${set.weight}kg×${set.reps}`
                  : null
              )
              .filter(Boolean)
              .join(' · ');
            const note = ex.note ? ` — note: ${ex.note}` : '';
            return sets ? `- ${name}: ${sets}${note}` : null;
          })
          .filter(Boolean)
          .join('\n');
        return `${header}\n${lines || '(aucune série complétée)'}`;
      })
      .join('\n\n');

    const prsText = Object.values(state.prs)
      .sort((a, b) => b.estimated1RM - a.estimated1RM)
      .map(
        (pr) =>
          `- ${pr.exerciseName}: ${pr.maxWeight}kg max · 1RM ${pr.estimated1RM.toFixed(1)}kg · vol ${pr.maxVolume}kg (${pr.date})`
      )
      .join('\n');

    const text = [
      '# Suivi musculation — 5 dernières séances',
      '',
      sessionsText || '(aucune séance)',
      '',
      '# Records personnels',
      '',
      prsText || '(aucun PR)',
    ].join('\n');

    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const confirmReset = () => {
    if (confirm('Réinitialiser la semaine ? Les données actuelles seront perdues.')) {
      onResetWeek();
    }
  };

  return (
    <div className="min-h-screen bg-primary safe-bottom-nav">
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2 mb-4">
        <h1 className="text-3xl font-bold text-primary">Réglages</h1>
      </div>

      {/* Programmes */}
      <Section title="Programmes">
        <Row
          label="Éditeur de programme"
          desc={`${state.programs.length} programmes configurés`}
          onClick={() => setShowProgramEditor(true)}
        />
      </Section>

      {/* Log libre */}
      <Section title="Log libre">
        <Row
          label="Exercices libres"
          desc={`${state.freeLog.length} entrées`}
          onClick={() => setShowFreeLog(true)}
        />
        <Row
          label={copied ? 'Copié !' : 'Copier pour Claude'}
          desc="Formate les 5 dernières séances pour Claude AI"
          icon={copied ? <Check size={18} style={{ color: 'var(--ios-green)' }} /> : <Copy size={18} style={{ color: 'var(--ios-blue)' }} />}
          onClick={copyForClaude}
          right={copied ? undefined : <></>}
        />
      </Section>

      {/* Apparence */}
      <Section title="Apparence">
        <div className="px-4 py-3">
          <p className="text-sm font-medium mb-2 text-primary">Thème</p>
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            {THEME_OPTIONS.map(({ id, label, Icon }) => (
              <motion.button
                key={id}
                whileTap={{ scale: 0.93 }}
                onClick={() => onUpdate((s) => ({ ...s, settings: { ...s.settings, theme: id } }))}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: state.settings.theme === id ? 'var(--bg-secondary)' : 'transparent',
                  color: state.settings.theme === id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  boxShadow: state.settings.theme === id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Icon size={14} />
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </Section>

      {/* Données */}
      <Section title="Données">
        <Row
          label="Exporter les données"
          desc="Sauvegarder toutes vos données en JSON"
          icon={<Download size={18} style={{ color: 'var(--ios-blue)' }} />}
          onClick={() => exportState(state)}
          right={<></>}
        />
        <Row
          label="Importer des données"
          desc="Restaurer depuis un fichier JSON"
          icon={<Upload size={18} style={{ color: 'var(--ios-green)' }} />}
          onClick={() => fileRef.current?.click()}
          right={<></>}
        />
        <Row
          label="Réinitialiser la semaine"
          desc="Remet la semaine courante à 1"
          icon={<RotateCcw size={18} style={{ color: 'var(--ios-orange)' }} />}
          onClick={confirmReset}
          right={<></>}
        />
        <Row
          label="Effacer toutes les données"
          destructive
          icon={<Trash2 size={18} style={{ color: 'var(--ios-red)' }} />}
          onClick={() => {
            if (confirm('Effacer TOUTES les données ? Cette action est irréversible.')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          right={<></>}
        />
      </Section>

      <div className="px-4 py-4 text-center">
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>GymTracker — Stockage local uniquement</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {state.sessions.length} séances · {Object.keys(state.prs).length} PR
        </p>
      </div>

      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* Program Editor Modal */}
      <AnimatePresence>
        {showProgramEditor && (
          <ProgramEditor
            programs={state.programs}
            onSave={(programs) => {
              onUpdate((s) => ({ ...s, programs }));
              setShowProgramEditor(false);
            }}
            onClose={() => setShowProgramEditor(false)}
          />
        )}
      </AnimatePresence>

      {/* Free Log Modal */}
      <AnimatePresence>
        {showFreeLog && (
          <FreeLogSection
            entries={state.freeLog}
            onAdd={(entry) => onUpdate((s) => ({ ...s, freeLog: [...s.freeLog, { ...entry, id: Date.now().toString(), date: new Date().toISOString().split('T')[0] }] }))}
            onClose={() => setShowFreeLog(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
