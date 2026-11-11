import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/context/app-context";
import { onCozy } from "@/lib/cozyEvents";
import { PETS, PetPose } from "./pets";
import "./companion.css";

const PET_MESSAGES = [
  "You're doing great 💛",
  "Sip some water? 💧",
  "One step at a time 🌱",
  "I believe in you!",
  "Proud of you for showing up ✨",
  "Remember to unclench your shoulders 🍃",
  "It's okay to take a break 🫖",
  "You've got this! 💪",
  "Purr-fect progress 🐾",
  "Deep breath in… and out 🌬️",
];

const AMBIENT_MESSAGES = [
  "Psst, how about a stretch? 🙆",
  "Your focus is looking cozy today ☕",
  "Did you drink water lately? 💧",
  "Little breaks keep the brain happy 🧠",
];

const SPEED = 42; // px / second
const MARGIN = 8;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

interface Heart { id: number; dx: number; emoji: string }

const Companion = () => {
  const { preferences } = useApp();
  const { pet, petName, petVisible } = preferences;
  const Pet = PETS[pet].Component;

  const size = typeof window !== "undefined" && window.innerWidth < 640 ? 60 : 76;

  const wrapRef = useRef<HTMLDivElement>(null);
  const x = useRef(0);
  const targetX = useRef(0);
  const until = useRef(0);
  const poseRef = useRef<PetPose>("idle");
  const focusMode = useRef(false);
  const mouse = useRef<{ x: number; y: number } | null>(null);
  const reduced = useRef(prefersReducedMotion());

  const [pose, setPoseState] = useState<PetPose>("idle");
  const [facingLeft, setFacingLeft] = useState(false);
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null);
  const [hearts, setHearts] = useState<Heart[]>([]);

  const setPose = useCallback((p: PetPose, durationMs = 0) => {
    poseRef.current = p;
    until.current = performance.now() + durationMs;
    setPoseState(p);
  }, []);

  const say = useCallback((text: string, ms = 4200) => {
    const id = Date.now();
    setBubble({ text, id });
    window.setTimeout(() => setBubble((b) => (b?.id === id ? null : b)), ms);
  }, []);

  const maxX = useCallback(() => Math.max(MARGIN, window.innerWidth - size - MARGIN), [size]);

  const walkTo = useCallback(
    (tx: number) => {
      targetX.current = Math.min(maxX(), Math.max(MARGIN, tx));
      setFacingLeft(targetX.current < x.current);
      setPose("walk");
    },
    [maxX, setPose]
  );

  const nextBehavior = useCallback(() => {
    if (focusMode.current) {
      setPose("sleep", 60_000);
      return;
    }
    if (reduced.current) {
      setPose(Math.random() < 0.5 ? "sit" : "idle", rand(6000, 12000));
      return;
    }
    const r = Math.random();
    if (r < 0.45) {
      const m = mouse.current;
      // Sometimes wander over to say hi when the cursor is near the bottom
      if (m && m.y > window.innerHeight - 180 && Math.random() < 0.4) walkTo(m.x - size / 2);
      else {
        let tx = rand(MARGIN, maxX());
        if (Math.abs(tx - x.current) < 120) tx = x.current > window.innerWidth / 2 ? tx - 200 : tx + 200;
        walkTo(tx);
      }
    } else if (r < 0.7) setPose("idle", rand(2000, 4500));
    else if (r < 0.9) setPose("sit", rand(4000, 9000));
    else setPose("sleep", rand(9000, 18000));
  }, [maxX, setPose, size, walkTo]);

  // Initial position + main animation loop
  useEffect(() => {
    if (!petVisible) return;
    x.current = reduced.current ? maxX() - 16 : rand(MARGIN, maxX());
    let raf = 0;
    let last = performance.now();
    setPose("idle", 1500);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (poseRef.current === "walk") {
        const dx = targetX.current - x.current;
        const step = Math.sign(dx) * SPEED * dt;
        if (Math.abs(dx) <= Math.abs(step) + 0.5) {
          x.current = targetX.current;
          nextBehavior();
        } else {
          x.current += step;
        }
      } else if (now > until.current) {
        nextBehavior();
      }
      if (wrapRef.current) wrapRef.current.style.transform = `translate3d(${x.current}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      x.current = Math.min(x.current, maxX());
      targetX.current = Math.min(targetX.current, maxX());
    };
    const onMove = (e: PointerEvent) => (mouse.current = { x: e.clientX, y: e.clientY });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [petVisible, maxX, nextBehavior, setPose]);

  // React to the focus timer & breathing exercise
  useEffect(() => {
    const offFocus = onCozy("focus-phase", ({ phase, running }) => {
      const wasFocus = focusMode.current;
      focusMode.current = phase === "focus" && running;
      if (focusMode.current && !wasFocus) {
        say(`Focus time! I'll nap quietly 😴`, 3500);
        if (!reduced.current) walkTo(maxX() - 10);
      } else if (!focusMode.current && phase === "break" && running) {
        setPose("happy", 2200);
        say("Break time! Stretch with me 🙆");
      } else if (!focusMode.current && wasFocus && poseRef.current === "sleep") {
        setPose("idle", 1500);
      }
    });
    const offDone = onCozy("focus-complete", ({ completed }) => {
      setPose("happy", 2500);
      say(completed > 1 ? `${completed} sessions done today! 🎉` : "First session done! 🎉");
    });
    const offBreath = onCozy("breathing", ({ active }) => {
      if (active) setPose("sit", 60_000);
      else {
        setPose("happy", 1800);
        say("That felt nice 🍃");
      }
    });
    return () => {
      offFocus();
      offDone();
      offBreath();
    };
  }, [maxX, say, setPose, walkTo]);

  // Occasional gentle check-ins
  useEffect(() => {
    if (!petVisible) return;
    let t: number;
    const schedule = () => {
      t = window.setTimeout(() => {
        if (!focusMode.current && poseRef.current !== "sleep" && document.visibilityState === "visible") {
          say(pick(AMBIENT_MESSAGES));
        }
        schedule();
      }, rand(90_000, 150_000));
    };
    schedule();
    return () => window.clearTimeout(t);
  }, [petVisible, say]);

  const handlePet = () => {
    const wasSleeping = poseRef.current === "sleep";
    setPose("happy", 1800);
    say(wasSleeping ? "*yawn* oh hi! 💛" : pick(PET_MESSAGES));
    const burst = Array.from({ length: 4 }, (_, i) => ({
      id: Date.now() + i,
      dx: rand(-22, 22),
      emoji: pick(["💛", "🧡", "💕", "✨"]),
    }));
    setHearts((h) => [...h, ...burst]);
    window.setTimeout(() => setHearts((h) => h.filter((x) => !burst.some((b) => b.id === x.id))), 1500);
  };

  if (!petVisible) return null;

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none fixed left-0 z-40"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)", width: size, height: size * 0.8 }}
    >
      {/* Speech bubble (not mirrored) */}
      {bubble && (
        <div
          key={bubble.id}
          role="status"
          className="pet-bubble absolute bottom-full left-1/2 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-2xl border border-border bg-card px-3 py-2 text-center text-xs font-bold text-foreground shadow-lg"
        >
          {bubble.text}
          <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-card" />
        </div>
      )}

      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute bottom-3/4 left-1/2 text-lg animate-float-up"
          style={{ marginLeft: h.dx }}
          aria-hidden
        >
          {h.emoji}
        </span>
      ))}

      {pose === "sleep" && (
        <div className="pet-zzz absolute right-1 top-0 text-sm" aria-hidden>
          <span>z</span><span>z</span><span>Z</span>
        </div>
      )}

      <button
        type="button"
        onClick={handlePet}
        className="pet pointer-events-auto h-full w-full cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-pose={pose}
        aria-label={`${petName} the ${PETS[pet].label.toLowerCase()}. Click to pet`}
        title={`${petName} · click to pet`}
      >
        <div className="pet-hop h-full w-full">
          <div className="h-full w-full transition-transform duration-200" style={{ transform: facingLeft ? "scaleX(-1)" : undefined }}>
            <Pet pose={pose} />
          </div>
        </div>
      </button>
    </div>
  );
};

export default Companion;
