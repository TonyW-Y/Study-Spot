// Procedural ambient soundscapes built with the Web Audio API (no audio files).
import { getAudioContext } from './chime';

export type AmbientId = 'rain' | 'cafe' | 'fire' | 'waves';

export const AMBIENT_SOUNDS: { id: AmbientId; label: string; emoji: string }[] = [
  { id: 'rain', label: 'Rain on the window', emoji: '🌧️' },
  { id: 'cafe', label: 'Café murmur', emoji: '☕' },
  { id: 'fire', label: 'Crackling fireplace', emoji: '🔥' },
  { id: 'waves', label: 'Ocean waves', emoji: '🌊' },
];

type NoiseColor = 'white' | 'pink' | 'brown';
const bufferCache: Partial<Record<NoiseColor, AudioBuffer>> = {};

function noiseBuffer(ac: AudioContext, color: NoiseColor): AudioBuffer {
  const cached = bufferCache[color];
  if (cached) return cached;
  const length = ac.sampleRate * 4;
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    if (color === 'white') data[i] = white;
    else if (color === 'pink') {
      // Paul Kellet's refined pink noise filter
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    } else {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  bufferCache[color] = buffer;
  return buffer;
}

function loopNoise(ac: AudioContext, color: NoiseColor): AudioBufferSourceNode {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, color);
  src.loop = true;
  // Random offset so layered loops don't phase-align
  src.start(0, Math.random() * 3);
  return src;
}

function filter(ac: AudioContext, type: BiquadFilterType, frequency: number, Q = 0.7) {
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = frequency;
  f.Q.value = Q;
  return f;
}

/** A short filtered noise "tick" (raindrop, ember crackle) */
function burst(ac: AudioContext, out: AudioNode, opts: { freq: number; q: number; dur: number; gain: number; type?: BiquadFilterType }) {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, 'white');
  const f = filter(ac, opts.type ?? 'bandpass', opts.freq, opts.q);
  const g = ac.createGain();
  const t = ac.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(opts.gain, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 3, opts.dur + 0.05);
}

/** A soft cup/spoon clink */
function clink(ac: AudioContext, out: AudioNode, gain: number) {
  const t = ac.currentTime;
  const base = 1800 + Math.random() * 1600;
  [1, 2.76].forEach((mult, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = base * mult;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain / (i + 1), t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.55);
  });
}

interface Voice {
  gain: GainNode;
  stop: () => void;
}

function buildVoice(ac: AudioContext, id: AmbientId, dest: AudioNode): Voice {
  const out = ac.createGain();
  out.gain.value = 0;
  out.connect(dest);
  const sources: AudioScheduledSourceNode[] = [];
  const timers: number[] = [];
  const every = (fn: () => void, min: number, max: number) => {
    const loop = () => {
      fn();
      timers.push(window.setTimeout(loop, min + Math.random() * (max - min)));
    };
    timers.push(window.setTimeout(loop, min + Math.random() * (max - min)));
  };

  if (id === 'rain') {
    const hiss = loopNoise(ac, 'pink');
    const hp = filter(ac, 'highpass', 600);
    const lp = filter(ac, 'lowpass', 7000);
    const g = ac.createGain();
    g.gain.value = 0.55;
    hiss.connect(hp).connect(lp).connect(g).connect(out);
    const rumble = loopNoise(ac, 'brown');
    const rg = ac.createGain();
    rg.gain.value = 0.25;
    rumble.connect(filter(ac, 'lowpass', 350)).connect(rg).connect(out);
    sources.push(hiss, rumble);
    every(() => burst(ac, out, { freq: 2500 + Math.random() * 3500, q: 4, dur: 0.03 + Math.random() * 0.04, gain: 0.15 + Math.random() * 0.25 }), 25, 140);
  }

  if (id === 'cafe') {
    const murmur = loopNoise(ac, 'brown');
    const bp = filter(ac, 'bandpass', 450, 0.6);
    const mg = ac.createGain();
    mg.gain.value = 0.7;
    // Slow swells in the room's chatter
    const lfo = ac.createOscillator();
    const lfoGain = ac.createGain();
    lfo.frequency.value = 0.13;
    lfoGain.gain.value = 0.25;
    lfo.connect(lfoGain).connect(mg.gain);
    lfo.start();
    murmur.connect(bp).connect(mg).connect(out);
    const voices = loopNoise(ac, 'pink');
    const vg = ac.createGain();
    vg.gain.value = 0.12;
    voices.connect(filter(ac, 'bandpass', 900, 1.2)).connect(vg).connect(out);
    sources.push(murmur, voices, lfo);
    every(() => clink(ac, out, 0.05 + Math.random() * 0.06), 1800, 6500);
  }

  if (id === 'fire') {
    const roar = loopNoise(ac, 'brown');
    const rg = ac.createGain();
    rg.gain.value = 0.8;
    roar.connect(filter(ac, 'lowpass', 280)).connect(rg).connect(out);
    sources.push(roar);
    every(() => {
      const pops = 1 + Math.floor(Math.random() * 4);
      for (let i = 0; i < pops; i++) {
        timers.push(window.setTimeout(() =>
          burst(ac, out, { freq: 1500 + Math.random() * 4000, q: 1, dur: 0.008 + Math.random() * 0.02, gain: 0.3 + Math.random() * 0.4, type: 'highpass' }),
        i * (20 + Math.random() * 60)));
      }
    }, 120, 900);
  }

  if (id === 'waves') {
    const surf = loopNoise(ac, 'pink');
    const lp = filter(ac, 'lowpass', 900);
    const wg = ac.createGain();
    wg.gain.value = 0.35;
    const lfo = ac.createOscillator();
    const lfoGain = ac.createGain();
    lfo.frequency.value = 0.09; // ~11s per wave
    lfoGain.gain.value = 0.33;
    lfo.connect(lfoGain).connect(wg.gain);
    const lfo2 = ac.createGain();
    lfo2.gain.value = 500;
    lfo.connect(lfo2).connect(lp.frequency);
    lfo.start();
    surf.connect(lp).connect(wg).connect(out);
    sources.push(surf, lfo);
  }

  return {
    gain: out,
    stop: () => {
      timers.forEach((t) => window.clearTimeout(t));
      sources.forEach((s) => {
        try { s.stop(); } catch { /* already stopped */ }
      });
      out.disconnect();
    },
  };
}

class AmbientEngine {
  private master: GainNode | null = null;
  private voices = new Map<AmbientId, Voice>();

  private ensure(): AudioContext | null {
    const ac = getAudioContext();
    if (!ac) return null;
    if (!this.master) {
      this.master = ac.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(ac.destination);
    }
    return ac;
  }

  setMaster(volume: number) {
    const ac = this.ensure();
    if (!ac || !this.master) return;
    this.master.gain.setTargetAtTime(volume, ac.currentTime, 0.15);
  }

  /** volume 0..1; 0 tears the voice down to save CPU */
  setVolume(id: AmbientId, volume: number) {
    const ac = this.ensure();
    if (!ac || !this.master) return;
    let voice = this.voices.get(id);
    if (volume <= 0) {
      if (voice) {
        voice.gain.gain.setTargetAtTime(0, ac.currentTime, 0.2);
        const v = voice;
        this.voices.delete(id);
        window.setTimeout(() => v.stop(), 900);
      }
      return;
    }
    if (!voice) {
      voice = buildVoice(ac, id, this.master);
      this.voices.set(id, voice);
    }
    // Perceptual curve so the slider feels even
    voice.gain.gain.setTargetAtTime(volume * volume, ac.currentTime, 0.25);
  }

  stopAll() {
    Array.from(this.voices.keys()).forEach((id) => this.setVolume(id, 0));
  }
}

export const ambient = new AmbientEngine();
