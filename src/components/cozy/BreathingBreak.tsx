import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/enhanced-button";
import { emitCozy } from "@/lib/cozyEvents";
import { cn } from "@/lib/utils";

const PHASES = [
  { label: "Breathe in", hint: "slowly through your nose", scale: 1 },
  { label: "Hold", hint: "soft shoulders", scale: 1 },
  { label: "Breathe out", hint: "let it all go", scale: 0.45 },
  { label: "Hold", hint: "rest here", scale: 0.45 },
] as const;

const SECONDS = 4;
const CYCLES = 4; // 4 × 16s ≈ 1 minute

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Guided 1-minute box-breathing overlay */
const BreathingBreak = ({ open, onClose }: Props) => {
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds since Begin
  const step = Math.floor(elapsed / SECONDS);
  const tick = SECONDS - (elapsed % SECONDS);

  const done = step >= CYCLES * PHASES.length;
  const phase = PHASES[step % PHASES.length];

  // Reset whenever it opens
  useEffect(() => {
    if (open) {
      setStarted(false);
      setElapsed(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    emitCozy("breathing", { active: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      emitCozy("breathing", { active: false });
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !started || done) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [open, started, done]);

  if (!open) return null;

  const scale = !started ? 0.6 : done ? 0.7 : phase.scale;
  const cycle = Math.min(CYCLES, Math.floor(step / PHASES.length) + 1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Breathing break"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-6 backdrop-blur-xl animate-in fade-in duration-500"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-sage/25 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-lamp/30 blur-3xl animate-float [animation-delay:2s]" />
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full bg-card/80 p-2.5 shadow-md transition hover:scale-105"
        aria-label="Close breathing break"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 20px)" }}
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative flex flex-col items-center text-center">
        <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-sage/60 via-secondary/40 to-primary/40 shadow-[0_0_80px_10px_hsl(var(--sage)/0.35)] ease-in-out"
            style={{ transform: `scale(${scale})`, transition: `transform ${SECONDS}s ease-in-out` }}
          />
          <div
            className="absolute inset-6 rounded-full border-2 border-card/60 ease-in-out"
            style={{ transform: `scale(${scale})`, transition: `transform ${SECONDS}s ease-in-out` }}
          />
          <div className="relative" aria-live="polite">
            {!started ? (
              <div className="text-5xl">🍃</div>
            ) : done ? (
              <div className="text-5xl">🌷</div>
            ) : (
              <>
                <div className="font-display text-3xl font-bold">{phase.label}</div>
                <div className="mt-1 text-5xl font-bold tabular-nums text-primary">{tick}</div>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 max-w-sm">
          {!started ? (
            <>
              <h2 className="text-3xl font-bold">Take a breath with me</h2>
              <p className="mt-2 text-muted-foreground">
                One minute of box breathing: in for 4, hold for 4, out for 4, hold for 4. Studies can wait.
              </p>
              <Button variant="hero" size="lg" className="mt-6" onClick={() => setStarted(true)} autoFocus>
                Begin
              </Button>
            </>
          ) : done ? (
            <>
              <h2 className="text-3xl font-bold">Beautifully done</h2>
              <p className="mt-2 text-muted-foreground">Notice how your shoulders feel. You can come back here anytime.</p>
              <div className="mt-6 flex justify-center gap-2">
                <Button variant="outline" onClick={() => setElapsed(0)}>Again</Button>
                <Button variant="hero" onClick={onClose} autoFocus>Back to studying</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg text-muted-foreground">{phase.hint}</p>
              <div className="mt-4 flex justify-center gap-2" aria-label={`Round ${cycle} of ${CYCLES}`}>
                {Array.from({ length: CYCLES }).map((_, i) => (
                  <span
                    key={i}
                    className={cn("h-2 w-8 rounded-full transition-colors", i < cycle ? "bg-primary" : "bg-muted")}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreathingBreak;
