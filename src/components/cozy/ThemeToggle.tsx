import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Sun ↔ moon toggle between "cozy day" and "cozy night" */
const ThemeToggle = ({ className }: { className?: string }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to cozy day mode" : "Switch to cozy night mode"}
      title={isDark ? "Cozy day" : "Cozy night"}
      className={cn(
        "relative h-9 w-16 rounded-full border border-border bg-muted/80 shadow-inner transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all duration-500",
          isDark ? "translate-x-7 bg-[#3b2f4a] text-amber-200" : "translate-x-0 bg-secondary text-secondary-foreground"
        )}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
    </button>
  );
};

export default ThemeToggle;
