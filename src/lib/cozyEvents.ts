// Tiny typed event bus so cozy widgets (timer, breathing, pet) can react to each other.

export type FocusPhase = 'idle' | 'focus' | 'break';

interface CozyEventMap {
  'focus-phase': { phase: FocusPhase; running: boolean };
  'focus-complete': { completed: number };
  'breathing': { active: boolean };
  'open-breathing': Record<string, never>;
}

const target = new EventTarget();

export function emitCozy<K extends keyof CozyEventMap>(type: K, detail: CozyEventMap[K]) {
  target.dispatchEvent(new CustomEvent(type, { detail }));
}

export function onCozy<K extends keyof CozyEventMap>(type: K, handler: (detail: CozyEventMap[K]) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<CozyEventMap[K]>).detail);
  target.addEventListener(type, listener);
  return () => target.removeEventListener(type, listener);
}
