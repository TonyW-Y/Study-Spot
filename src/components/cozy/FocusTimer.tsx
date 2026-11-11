import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/enhanced-button";
import { cn } from "@/lib/utils";
import { FocusTimerApi, formatMs } from "@/hooks/useFocusTimer";

const PRESETS = [
  { focus: 25, rest: 5, label: "Classic" },
  { focus: 50, rest: 10, label: "Deep" },
  { focus: 15, rest: 3, label: "Gentle" },
];

const R = 54;
const C = 2 * Math.PI * R;

const FocusTimer = ({ timer }: { timer: FocusTimerApi }) => {
  const { state, remaining, progress, start, pause, reset, skip, setPreset } = timer;
  const isFocus = state.phase === "focus";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">Focus timer</h3>
          <p className="text-xs text-muted-foreground">Work in cozy little sprints, then rest.</p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            isFocus ? "bg-primary/15 text-primary" : "bg-sage-soft text-foreground"
          )}
        >
          {isFocus ? "📖 Focus" : "🍵 Break"}
        </span>
      </div>

      <div className="relative mx-auto h-40 w-40">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          <circle cx="64" cy="64" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke={isFocus ? "hsl(var(--primary))" : "hsl(var(--sage))"}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - Math.min(1, Math.max(0, progress)))}
            className="transition-[stroke-dashoffset] duration-500 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold tabular-nums" aria-live="off">{formatMs(remaining)}</span>
          <span className="text-xs font-semibold text-muted-foreground">
            {state.running ? (isFocus ? "you've got this" : "breathe & stretch") : "paused"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="icon" onClick={reset} aria-label="Reset timer" title="Reset">
          <RotateCcw className="h-4 w-4" />
        </Button>
        {state.running ? (
          <Button variant="hero" size="lg" className="w-32 gap-2" onClick={pause}>
            <Pause className="h-4 w-4" /> Pause
          </Button>
        ) : (
          <Button variant="hero" size="lg" className="w-32 gap-2" onClick={start}>
            <Play className="h-4 w-4" /> {progress > 0.001 ? "Resume" : "Start"}
          </Button>
        )}
        <Button variant="outline" size="icon" onClick={skip} aria-label={isFocus ? "Skip to break" : "Skip to focus"} title="Skip">
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => {
          const active = state.focusMin === p.focus && state.breakMin === p.rest;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => setPreset(p.focus, p.rest)}
              aria-pressed={active}
              className={cn(
                "rounded-2xl border px-2 py-2 text-center text-xs transition-all",
                active ? "border-primary bg-primary/10 font-bold" : "border-border hover:bg-accent"
              )}
            >
              <div className="font-bold">{p.label}</div>
              <div className="text-muted-foreground">{p.focus}/{p.rest} min</div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-3 py-2 text-sm">
        <span className="font-semibold">Today</span>
        <span className="flex items-center gap-1" aria-label={`${state.completed} sessions completed today`}>
          {state.completed === 0 ? (
            <span className="text-muted-foreground">No sessions yet</span>
          ) : (
            <>
              {Array.from({ length: Math.min(state.completed, 8) }).map((_, i) => (
                <span key={i}>🍅</span>
              ))}
              {state.completed > 8 && <span className="font-bold">+{state.completed - 8}</span>}
            </>
          )}
        </span>
      </div>
    </div>
  );
};

export default FocusTimer;
