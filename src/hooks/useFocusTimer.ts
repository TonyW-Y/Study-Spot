import { useCallback, useEffect, useRef, useState } from 'react';
import { readJSON, writeJSON } from '@/lib/storage';
import { emitCozy } from '@/lib/cozyEvents';
import { playChime } from '@/lib/chime';

export type TimerPhase = 'focus' | 'break';

export interface TimerState {
  phase: TimerPhase;
  running: boolean;
  /** Epoch ms when the current phase ends (only meaningful while running) */
  endsAt: number | null;
  /** Remaining ms while paused */
  remaining: number;
  focusMin: number;
  breakMin: number;
  completed: number;
  /** yyyy-mm-dd the `completed` counter belongs to */
  day: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const initial = (): TimerState => ({
  phase: 'focus',
  running: false,
  endsAt: null,
  remaining: 25 * 60_000,
  focusMin: 25,
  breakMin: 5,
  completed: 0,
  day: today(),
});

const load = (): TimerState => {
  const saved = { ...initial(), ...readJSON<Partial<TimerState>>('timer', {}) };
  if (saved.day !== today()) return { ...saved, completed: 0, day: today() };
  return saved;
};

export const formatMs = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export function useFocusTimer() {
  const [state, setState] = useState<TimerState>(load);
  const [now, setNow] = useState(() => Date.now());
  const baseTitle = useRef(document.title);

  useEffect(() => writeJSON('timer', state), [state]);

  const remaining = state.running && state.endsAt ? Math.max(0, state.endsAt - now) : state.remaining;
  const total = (state.phase === 'focus' ? state.focusMin : state.breakMin) * 60_000;
  const progress = total ? 1 - remaining / total : 0;

  // Tick while running
  useEffect(() => {
    if (!state.running) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [state.running]);

  // Phase transitions
  useEffect(() => {
    if (!state.running || !state.endsAt || now < state.endsAt) return;
    if (state.phase === 'focus') {
      const completed = state.completed + 1;
      playChime('up');
      emitCozy('focus-complete', { completed });
      const breakMs = state.breakMin * 60_000;
      setState((s) => ({ ...s, phase: 'break', completed, running: true, endsAt: Date.now() + breakMs, remaining: breakMs }));
    } else {
      playChime('down');
      const focusMs = state.focusMin * 60_000;
      setState((s) => ({ ...s, phase: 'focus', running: false, endsAt: null, remaining: focusMs }));
    }
  }, [now, state]);

  // Broadcast phase so the companion can react
  useEffect(() => {
    emitCozy('focus-phase', { phase: state.phase, running: state.running });
  }, [state.phase, state.running]);

  // Show the countdown in the tab title while running
  useEffect(() => {
    if (!state.running) {
      document.title = baseTitle.current;
      return;
    }
    document.title = `${state.phase === 'focus' ? '📖' : '🍵'} ${formatMs(remaining)} · ${state.phase === 'focus' ? 'Focus' : 'Break'}`;
  }, [state.running, state.phase, remaining]);

  useEffect(() => () => void (document.title = baseTitle.current), []);

  const start = useCallback(() => {
    setNow(Date.now());
    setState((s) => ({ ...s, running: true, endsAt: Date.now() + s.remaining }));
  }, []);

  const pause = useCallback(() => {
    setState((s) => ({
      ...s,
      running: false,
      endsAt: null,
      remaining: s.endsAt ? Math.max(0, s.endsAt - Date.now()) : s.remaining,
    }));
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({ ...s, running: false, endsAt: null, remaining: (s.phase === 'focus' ? s.focusMin : s.breakMin) * 60_000 }));
  }, []);

  const skip = useCallback(() => {
    setState((s) => {
      const phase: TimerPhase = s.phase === 'focus' ? 'break' : 'focus';
      const ms = (phase === 'focus' ? s.focusMin : s.breakMin) * 60_000;
      return { ...s, phase, running: false, endsAt: null, remaining: ms };
    });
  }, []);

  const setPreset = useCallback((focusMin: number, breakMin: number) => {
    setState((s) => ({
      ...s,
      focusMin,
      breakMin,
      running: false,
      endsAt: null,
      phase: 'focus',
      remaining: focusMin * 60_000,
    }));
  }, []);

  return { state, remaining, progress, start, pause, reset, skip, setPreset };
}

export type FocusTimerApi = ReturnType<typeof useFocusTimer>;
