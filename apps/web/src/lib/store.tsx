import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { TodaySnapshot } from '@svaraa/shared';
import { api, type Session } from './api';

type ConnectionHealth = 'live' | 'polling' | 'degraded';

type Ctx = {
  session: Session | null;
  setSession: (s: Session | null) => void;
  today: TodaySnapshot | null;
  refreshToday: () => Promise<void>;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  locale: 'en' | 'hi' | 'ta';
  setLocale: (l: 'en' | 'hi' | 'ta') => void;
  simpleMode: boolean;
  setSimpleMode: (v: boolean) => void;
  connectionHealth: ConnectionHealth;
};

const AppCtx = createContext<Ctx | null>(null);
const KEY = 'svaraa.session';

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch {
      return null;
    }
  });
  const [today, setToday] = useState<TodaySnapshot | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );
  const [locale, setLocale] = useState<'en' | 'hi' | 'ta'>('en');
  const [simpleMode, setSimpleMode] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth>('live');

  const setSession = useCallback((s: Session | null) => {
    setSessionState(s);
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  }, []);

  const refreshToday = useCallback(async () => {
    if (!session?.tenantId) return;
    try {
      const t = (await api.getToday(session)) as TodaySnapshot;
      setToday(t);
      setConnectionHealth((h) => (h === 'degraded' ? 'polling' : h));
    } catch {
      setConnectionHealth('degraded');
    }
  }, [session]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    refreshToday().catch(() => undefined);
  }, [refreshToday]);

  useEffect(() => {
    if (!session?.tenantId) return;
    let sseAlive = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    const startPoll = () => {
      if (pollTimer) return;
      setConnectionHealth('polling');
      pollTimer = setInterval(() => {
        refreshToday().catch(() => setConnectionHealth('degraded'));
      }, 30_000);
    };

    const stopPoll = () => {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = undefined;
    };

    const closeSse = api.openSse(session, (name) => {
      sseAlive = true;
      setConnectionHealth('live');
      stopPoll();
      if (name === 'pendant' || name === 'timeline' || name === 'incident' || name === 'ready') {
        refreshToday().catch(() => undefined);
      }
    });

    // If SSE never fires ready within 4s, fall back to poll
    const watchdog = window.setTimeout(() => {
      if (!sseAlive) startPoll();
    }, 4000);

    return () => {
      window.clearTimeout(watchdog);
      stopPoll();
      closeSse();
    };
  }, [session, refreshToday]);

  const value = useMemo(
    () => ({
      session,
      setSession,
      today,
      refreshToday,
      theme,
      setTheme,
      locale,
      setLocale,
      simpleMode,
      setSimpleMode,
      connectionHealth,
    }),
    [session, setSession, today, refreshToday, theme, locale, simpleMode, connectionHealth],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}
