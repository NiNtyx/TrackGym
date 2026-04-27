import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TabBar, Tab } from './components/TabBar';
import { SeanceTab } from './tabs/Seance';
import { StatsTab } from './tabs/Stats';
import { CalendarTab } from './tabs/Calendar';
import { TimersTab } from './tabs/Timers';
import { ReglagesTab } from './tabs/Reglages';
import { StoreProvider, useStoreContext } from './store/StoreContext';
import { HomeScreen } from './components/HomeScreen';

function useTheme(theme: 'light' | 'dark' | 'auto') {
  useEffect(() => {
    const apply = (dark: boolean) => {
      document.documentElement.classList.toggle('dark', dark);
    };
    if (theme === 'dark') { apply(true); return; }
    if (theme === 'light') { apply(false); return; }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);
}

function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = useCallback(async () => {
    if (!prompt) return;
    await prompt.prompt();
    setPrompt(null);
  }, [prompt]);

  return { canInstall: !!prompt, install };
}

function useServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .catch(() => {});
    }
  }, []);
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function useHomeScreen() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const [show, setShow] = useState(() => {
    try {
      return localStorage.getItem('home_seen_date') !== todayKey;
    } catch {
      return true;
    }
  });
  const dismiss = () => {
    try {
      localStorage.setItem('home_seen_date', todayKey);
    } catch {}
    setShow(false);
  };
  return { show, dismiss };
}

const TAB_TRANSITIONS = {
  enter: { opacity: 0, x: 16 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

function AppInner() {
  const [tab, setTab] = useState<Tab>('seance');
  const { state, update, resetWeek } = useStoreContext();

  useTheme(state.settings.theme);
  useServiceWorker();
  const { canInstall, install } = useInstallPrompt();
  const { show: showHome, dismiss: dismissHome } = useHomeScreen();

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Install banner */}
      <AnimatePresence>
        {canInstall && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-[60] glass rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
          >
            <div>
              <p className="font-bold text-sm text-primary">Installer GymTracker</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Accès rapide depuis l'écran d'accueil</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={install}
              className="px-4 py-2 rounded-xl font-semibold text-sm ml-3"
              style={{ background: 'var(--ios-blue)', color: '#fff' }}
            >
              Installer
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          variants={TAB_TRANSITIONS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        >
          {tab === 'seance' && <SeanceTab />}
          {tab === 'stats' && <StatsTab state={state} />}
          {tab === 'calendrier' && <CalendarTab state={state} />}
          {tab === 'timers' && <TimersTab />}
          {tab === 'reglages' && (
            <ReglagesTab
              state={state}
              onUpdate={update}
              onResetWeek={resetWeek}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Tab Bar */}
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}