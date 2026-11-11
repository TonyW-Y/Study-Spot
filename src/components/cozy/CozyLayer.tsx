import { Timer } from "lucide-react";
import Companion from "@/components/companion/Companion";
import CozyDock, { DockItem } from "./CozyDock";
import FocusTimer from "./FocusTimer";
import { formatMs, useFocusTimer } from "@/hooks/useFocusTimer";

/** Everything that floats above the pages: the support animal and the cozy tool dock */
const CozyLayer = () => {
  const timer = useFocusTimer();
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
  ];

  return (
    <>
      <Companion />
      <CozyDock items={items} />
    </>
  );
};

export default CozyLayer;
