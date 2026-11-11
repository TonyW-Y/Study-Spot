// Soft, synthesized bell. No audio files needed.

let ctx: AudioContext | null = null;

export const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

/** Play a gentle two-note chime (rising for "break", falling for "back to focus") */
export function playChime(kind: 'up' | 'down' = 'up', volume = 0.25) {
  const ac = getAudioContext();
  if (!ac) return;
  const notes = kind === 'up' ? [659.25, 987.77] : [987.77, 659.25]; // E5 → B5
  notes.forEach((freq, i) => {
    const start = ac.currentTime + i * 0.28;
    const osc = ac.createOscillator();
    const overtone = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    overtone.type = 'sine';
    osc.frequency.value = freq;
    overtone.frequency.value = freq * 2.01;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.6);
    const overGain = ac.createGain();
    overGain.gain.value = 0.25;
    osc.connect(gain);
    overtone.connect(overGain).connect(gain);
    gain.connect(ac.destination);
    osc.start(start);
    overtone.start(start);
    osc.stop(start + 1.7);
    overtone.stop(start + 1.7);
  });
}
