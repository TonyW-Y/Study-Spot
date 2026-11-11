import { ReactNode, useState } from "react";
import { PawPrint } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PetSettings from "@/components/companion/PetSettings";
import { cn } from "@/lib/utils";

export interface DockItem {
  id: string;
  label: string;
  icon: ReactNode;
  /** Small status text/badge shown next to the icon (e.g. remaining time) */
  badge?: ReactNode;
  active?: boolean;
  content?: ReactNode;
  onClick?: () => void;
  width?: string;
}

const DockButton = ({ item, open }: { item: DockItem; open?: boolean }) => (
  <span
    className={cn(
      "flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold transition-all",
      open || item.active ? "bg-primary text-primary-foreground shadow-md" : "text-foreground hover:bg-accent"
    )}
  >
    {item.icon}
    {item.badge ? <span className="tabular-nums">{item.badge}</span> : <span className="sr-only lg:not-sr-only">{item.label}</span>}
  </span>
);

/** Floating bottom-right dock that groups the cozy tools */
const CozyDock = ({ items = [] }: { items?: DockItem[] }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const all: DockItem[] = [
    ...items,
    { id: "pet", label: "Buddy", icon: <PawPrint className="h-5 w-5" />, content: <PetSettings />, width: "w-80" },
  ];

  return (
    <div
      className="fixed right-3 z-50 sm:right-5"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
    >
      <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card/85 p-1 shadow-lg backdrop-blur-md" role="toolbar" aria-label="Cozy tools">
        {all.map((item) =>
          item.content ? (
            <Popover key={item.id} open={openId === item.id} onOpenChange={(o) => setOpenId(o ? item.id : null)}>
              <PopoverTrigger asChild>
                <button type="button" aria-label={item.label} title={item.label} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <DockButton item={item} open={openId === item.id} />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" sideOffset={12} className={cn("rounded-3xl p-4 shadow-lg", item.width ?? "w-80")}>
                {item.content}
              </PopoverContent>
            </Popover>
          ) : (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              aria-label={item.label}
              title={item.label}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <DockButton item={item} />
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default CozyDock;
