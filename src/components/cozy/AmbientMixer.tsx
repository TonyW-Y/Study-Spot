import { Pause, Play, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/enhanced-button";
import { AMBIENT_SOUNDS } from "@/lib/ambient";
import { AmbientApi } from "@/hooks/useAmbient";
import { cn } from "@/lib/utils";

const AmbientMixer = ({ api }: { api: AmbientApi }) => {
  const { prefs, playing, setVolume, setMaster, toggle } = api;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">Cozy sounds</h3>
          <p className="text-xs text-muted-foreground">Mix your own background. Headphones recommended.</p>
        </div>
        <Button variant={playing ? "hero" : "outline"} size="icon" onClick={toggle} aria-label={playing ? "Pause sounds" : "Play sounds"}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>

      <ul className="space-y-3">
        {AMBIENT_SOUNDS.map(({ id, label, emoji }) => {
          const v = prefs.volumes[id];
          const on = playing && v > 0;
          return (
            <li key={id} className={cn("rounded-2xl border p-3 transition-colors", on ? "border-primary/40 bg-primary/5" : "border-border")}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  <span className={cn("text-lg", on && "animate-float")}>{emoji}</span> {label}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">{Math.round(v * 100)}%</span>
              </div>
              <Slider
                value={[v]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([val]) => setVolume(id, val)}
                aria-label={`${label} volume`}
              />
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-2">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <Slider value={[prefs.master]} min={0} max={1} step={0.05} onValueChange={([m]) => setMaster(m)} aria-label="Master volume" />
      </div>
    </div>
  );
};

export default AmbientMixer;
