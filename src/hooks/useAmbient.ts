import { useCallback, useEffect, useState } from 'react';
import { ambient, AMBIENT_SOUNDS, AmbientId } from '@/lib/ambient';
import { readJSON, writeJSON } from '@/lib/storage';

interface AmbientPrefs {
  volumes: Record<AmbientId, number>;
  master: number;
}

const DEFAULTS: AmbientPrefs = {
  volumes: { rain: 0.5, cafe: 0, fire: 0, waves: 0 },
  master: 0.8,
};

export function useAmbient() {
  const [prefs, setPrefs] = useState<AmbientPrefs>(() => {
    const saved = readJSON<Partial<AmbientPrefs>>('ambient', {});
    return { ...DEFAULTS, ...saved, volumes: { ...DEFAULTS.volumes, ...saved.volumes } };
  });
  // Never autoplay on load; browsers require a user gesture anyway
  const [playing, setPlaying] = useState(false);

  useEffect(() => writeJSON('ambient', prefs), [prefs]);

  useEffect(() => {
    if (!playing) {
      ambient.stopAll();
      return;
    }
    ambient.setMaster(prefs.master);
    AMBIENT_SOUNDS.forEach(({ id }) => ambient.setVolume(id, prefs.volumes[id]));
  }, [playing, prefs]);

  useEffect(() => () => ambient.stopAll(), []);

  const setVolume = useCallback((id: AmbientId, volume: number) => {
    setPrefs((p) => ({ ...p, volumes: { ...p.volumes, [id]: volume } }));
    if (volume > 0) setPlaying(true);
  }, []);

  const setMaster = useCallback((master: number) => setPrefs((p) => ({ ...p, master })), []);

  const anyOn = Object.values(prefs.volumes).some((v) => v > 0);

  const toggle = useCallback(() => {
    // If everything is at zero, start with a little rain
    if (!playing && !anyOn) setPrefs((p) => ({ ...p, volumes: { ...p.volumes, rain: 0.5 } }));
    setPlaying(!playing);
  }, [playing, anyOn]);

  return { prefs, playing: playing && anyOn, setVolume, setMaster, toggle, setPlaying };
}

export type AmbientApi = ReturnType<typeof useAmbient>;
