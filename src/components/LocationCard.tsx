import { Heart, MapPin, Star, Wifi, Zap, Volume2, Armchair } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Location } from "@/types/location";
import { getCategory } from "@/lib/categories";
import { useApp } from "@/context/app-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LocationCardProps {
  location: Location;
  className?: string;
  selected?: boolean;
  compact?: boolean;
  onHover?: (id: string | null) => void;
}

const RATING_KEYS = [
  { key: "wifi", label: "Wi-Fi", icon: Wifi },
  { key: "outlets", label: "Outlets", icon: Zap },
  { key: "noise", label: "Quiet", icon: Volume2 },
  { key: "seating", label: "Seats", icon: Armchair },
] as const;

const LocationCard = ({ location, className, selected, compact, onHover }: LocationCardProps) => {
  const { name, address, category, ratings, reviewCount, image, distance, source } = location;
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark } = useApp();
  const meta = getCategory(category);
  const saved = isBookmarked(location.id);

  const open = () => navigate(`/location/${location.id}`, { state: { location } });

  const onHeart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nowSaved = toggleBookmark(location);
    toast(nowSaved ? "Saved to your cozy list 💛" : "Removed from saved spots", {
      description: name,
    });
  };

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open())}
      onMouseEnter={() => onHover?.(location.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-sm backdrop-blur-sm",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "ring-2 ring-primary",
        className
      )}
    >
      {/* Illustrated header */}
      <div
        className={cn("relative overflow-hidden", compact ? "h-20" : "h-32")}
        style={{ backgroundImage: meta.gradient }}
      >
        {image ? (
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <>
            <span className="absolute -right-4 -bottom-6 text-[7rem] leading-none opacity-25 select-none transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
              {meta.emoji}
            </span>
            <span className={cn("absolute left-4 select-none drop-shadow-sm animate-float", compact ? "top-3 text-3xl" : "top-5 text-5xl")}>
              {meta.emoji}
            </span>
          </>
        )}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card/90 to-transparent" />

        <button
          type="button"
          onClick={onHeart}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save spot"}
          className={cn(
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/85 shadow-md backdrop-blur transition-transform hover:scale-110 active:scale-95",
            saved ? "text-rose-500" : "text-muted-foreground"
          )}
        >
          <Heart className={cn("h-4 w-4", saved && "fill-current")} />
        </button>

        <div className="absolute left-3 bottom-2 flex gap-1.5">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm", meta.badge)}>
            {meta.label}
          </span>
          {source === "community" && (
            <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-xs font-bold text-foreground shadow-sm">
              🌱 Community
            </span>
          )}
          {source === "sample" && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground shadow-sm">
              Sample
            </span>
          )}
        </div>
      </div>

      <div className={cn("space-y-3", compact ? "p-3" : "p-4")}>
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight text-foreground line-clamp-1">{name}</h3>
          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{address}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-secondary text-secondary" />
            <span className="font-bold">{ratings.overall.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviewCount})</span>
          </div>
          {distance && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
              {distance}
            </span>
          )}
        </div>

        {!compact && (
          <div className="grid grid-cols-4 gap-2">
            {RATING_KEYS.map(({ key, label, icon: Icon }) => {
              const value = ratings[key];
              return (
                <div key={key} className="space-y-1" title={`${label}: ${value.toFixed(1)} / 5`}>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    <span className="font-semibold text-foreground">{value.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-primary"
                      style={{ width: `${(value / 5) * 100}%` }}
                    />
                  </div>
                  <div className="text-center text-[10px] font-medium text-muted-foreground">{label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
};

export default LocationCard;
