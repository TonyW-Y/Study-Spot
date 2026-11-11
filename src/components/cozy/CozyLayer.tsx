import { useCallback, useEffect, useState } from "react";
import { Headphones, Timer, Wind } from "lucide-react";
import { toast } from "sonner";
import BreathingBreak from "./BreathingBreak";
import { onCozy } from "@/lib/cozyEvents";
import Companion from "@/components/companion/Companion";
import CozyDock, { DockItem } from "./CozyDock";
import FocusTimer from "./FocusTimer";
import { formatMs, useFocusTimer } from "@/hooks/useFocusTimer";
import { useAmbient } from "@/hooks/useAmbient";
import AmbientMixer from "./AmbientMixer";

/** Everything that floats above the pages: the support animal and the cozy tool dock */
const CozyLayer = () => {
  const timer = useFocusTimer();
  const sounds = useAmbient();
  const [breathing, setBreathing] = useState(false);
  const closeBreathing = useCallback(() => setBreathing(false), []);

  // Offer a breathing break whenever a focus session finishes
  useEffect(() => {
    const offDone = onCozy("focus-complete", () => {
      toast("Focus session complete 🎉", {
        description: "Time for a little break. Want to breathe together?",
        action: { label: "Breathe 🍃", onClick: () => setBreathing(true) },
        duration: 10000,
      });
    });
    const offOpen = onCozy("open-breathing", () => setBreathing(true));
    return () => {
      offDone();
      offOpen();
    };
  }, []);
  const showBadge = timer.state.running || timer.progress > 0.001;

  const items: DockItem[] = [
    {
      id: "timer",
      label: "Focus timer",
      icon: <Timer className="h-5 w-5" />,
      badge: showBadge ? formatMs(timer.remaining) : undefined,
      active: timer.state.running,
      content: <FocusTimer timer={timer} />,
    },
    {
      id: "sounds",
      label: "Cozy sounds",
      icon: <Headphones className={sounds.playing ? "h-5 w-5 animate-float" : "h-5 w-5"} />,
      active: sounds.playing,
      content: <AmbientMixer api={sounds} />,
    },
    {
      id: "breathe",
      label: "Breathe",
      icon: <Wind className="h-5 w-5" />,
      active: breathing,
      onClick: () => setBreathing(true),
    },
  ];

  return (
    <>
      <Companion />
      <CozyDock items={items} />
      <BreathingBreak open={breathing} onClose={closeBreathing} />
    </>
  );
};

export default CozyLayer;
