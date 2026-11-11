import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapIcon, List, SlidersHorizontal, LocateFixed, MapPinned, X } from "lucide-react";
import Map from "@/components/Map";
import LocationCard from "@/components/LocationCard";
import FilterPanel from "@/components/FilterPanel";
import CozyScene from "@/components/cozy/CozyScene";
import { Button } from "@/components/ui/enhanced-button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Location, FilterState } from "@/types/location";
import { fetchStudyLocations, addDistancesToLocations } from "@/services/overpassApi";
import { geocodePlace } from "@/services/geocode";
import { CATEGORIES, CATEGORY_IDS, getCategory } from "@/lib/categories";
import { useApp } from "@/context/app-context";
import { withCommunityRatings } from "@/lib/ratings";
import { loadNearby, saveNearby } from "@/lib/nearbyCache";
import { DEFAULT_CENTER } from "@/lib/mapbox";
import { cn } from "@/lib/utils";

const FETCH_RADIUS_KM = 5;

const defaultFilters = (): FilterState => ({
  categories: [...CATEGORY_IDS],
  distance: 5,
  ratings: { wifi: 0, outlets: 0, noise: 0, seating: 0, overall: 0 },
});

const QUOTES = [
  "Small steps every day add up to big things. 🌱",
  "You don't have to finish today, just begin. ☕",
  "Rest is part of the work. Breathe in, breathe out. 🍃",
  "Progress, not perfection. You've got this. 💛",
  "One page at a time. One sip at a time. 📖",
  "Be gentle with yourself, you're learning. 🌙",
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return { text: "Burning the midnight oil", emoji: "🌙" };
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "🍵" };
  if (h < 21) return { text: "Good evening", emoji: "🕯️" };
  return { text: "Cozy night", emoji: "🌙" };
};

interface Area {
  latitude: number;
  longitude: number;
  label?: string;
  /** true when this is the user's real GPS position */
  isUser: boolean;
}

const Home = () => {
  const navigate = useNavigate();
  const { user, customSpots, reviews } = useApp();

  const cached = useMemo(() => loadNearby(), []);
  const [area, setArea] = useState<Area | null>(() =>
    cached ? { ...cached.center, label: cached.label, isUser: !cached.label } : null
  );
  const [locations, setLocations] = useState<Location[]>(() => cached?.locations ?? []);
  const [loading, setLoading] = useState(!cached);
  const [notice, setNotice] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [slow, setSlow] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeOpen, setPlaceOpen] = useState(false);
  const [placeBusy, setPlaceBusy] = useState(false);

  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const hello = useMemo(greeting, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const t = setInterval(() => setQuoteIndex((i) => (i + 1) % QUOTES.length), 9000);
    return () => clearInterval(t);
  }, []);

  const loadArea = useCallback(async (next: Area) => {
    setArea(next);
    setLoading(true);
    setCanRetry(false);
    setSlow(false);
    const slowTimer = window.setTimeout(() => setSlow(true), 6000);
    try {
      const found = addDistancesToLocations(
        await fetchStudyLocations(next.latitude, next.longitude, FETCH_RADIUS_KM),
        next.latitude,
        next.longitude
      );
      setLocations(found);
      if (found.every((l) => l.source === "sample")) {
        // Don't cache sample data so the next visit tries OpenStreetMap again
        setNotice("OpenStreetMap is busy right now, so these are sample spots for the moment.");
        setCanRetry(true);
      } else {
        saveNearby({ center: { latitude: next.latitude, longitude: next.longitude }, label: next.label, locations: found });
      }
    } finally {
      window.clearTimeout(slowTimer);
      setLoading(false);
      setSlow(false);
    }
  }, []);

  const locateMe = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setNotice("Your browser can't share location, so try searching for a city instead.");
      if (!area) loadArea({ ...DEFAULT_CENTER, isUser: false });
      return;
    }
    setLoading(true);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => loadArea({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, isUser: true }),
      () => {
        setNotice(`Location is off, so we're showing ${DEFAULT_CENTER.label}. Search for your city or enable location.`);
        loadArea({ ...DEFAULT_CENTER, isUser: false });
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }
    );
  }, [area, loadArea]);

  // First visit (or stale cache): ask for location
  useEffect(() => {
    if (!cached) locateMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const searchPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeQuery.trim()) return;
    setPlaceBusy(true);
    try {
      const result = await geocodePlace(placeQuery);
      if (!result) {
        setNotice(`We couldn't find "${placeQuery}". Try a city or neighbourhood name.`);
        return;
      }
      setNotice(null);
      setPlaceOpen(false);
      await loadArea({ ...result, isUser: false });
    } catch {
      setNotice("Place search isn't available right now.");
    } finally {
      setPlaceBusy(false);
    }
  };

  // Merge community spots + blend in student reviews
  const allLocations = useMemo(() => {
    const community = area
      ? addDistancesToLocations(customSpots, area.latitude, area.longitude)
      : customSpots;
    return [...community, ...locations].map((l) => withCommunityRatings(l, reviews));
  }, [customSpots, locations, reviews, area]);

  const filteredLocations = useMemo(() => {
    return allLocations
      .filter((location) => {
        const matchesSearch =
          !debouncedQuery ||
          location.name.toLowerCase().includes(debouncedQuery) ||
          location.address.toLowerCase().includes(debouncedQuery) ||
          getCategory(location.category).label.toLowerCase().includes(debouncedQuery);
        const matchesCategory =
          filters.categories.length === 0 || filters.categories.includes(location.category);
        // Slider max (5) means "5+ km", so no limit
        const matchesDistance =
          filters.distance >= 5 || location.distanceKm == null || location.distanceKm <= filters.distance;
        const matchesRatings = Object.entries(filters.ratings).every(([key, minRating]) => {
          if (minRating === 0) return true;
          return location.ratings[key as keyof typeof location.ratings] >= minRating;
        });
        return matchesSearch && matchesCategory && matchesDistance && matchesRatings;
      })
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [allLocations, debouncedQuery, filters]);

  const handleLocationClick = useCallback(
    (locationId: string) => {
      const location = allLocations.find((loc) => loc.id === locationId);
      navigate(`/location/${locationId}`, { state: { location } });
    },
    [allLocations, navigate]
  );

  const allSelected = filters.categories.length === CATEGORY_IDS.length;
  const toggleChip = (id: string) => {
    setFilters((prev) => {
      // From "all", tapping a chip focuses on just that category
      if (prev.categories.length === CATEGORY_IDS.length) return { ...prev, categories: [id] };
      const has = prev.categories.includes(id);
      const next = has ? prev.categories.filter((c) => c !== id) : [...prev.categories, id];
      return { ...prev, categories: next.length ? next : [...CATEGORY_IDS] };
    });
  };

  const resetAll = () => {
    setSearchQuery("");
    setFilters(defaultFilters());
  };

  const firstName = user?.name.split(" ")[0];
  const mapCenter = useMemo(
    () => (area ? { latitude: area.latitude, longitude: area.longitude } : null),
    [area]
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 pb-6 pt-8 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-12 lg:px-8">
          <div className="animate-fade-up">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur">
              <span>{hello.emoji}</span> {hello.text}{firstName ? `, ${firstName}` : ""}
            </p>
            <h1 className="text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Find your <span className="text-gradient-warm italic">cozy corner</span> to study.
            </h1>
            <p
              key={quoteIndex}
              className="mt-4 max-w-lg text-lg text-muted-foreground animate-fade-up"
              aria-live="polite"
            >
              {QUOTES[quoteIndex]}
            </p>

            {/* Search */}
            <div className="mt-6 max-w-xl space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search cafés, libraries, campuses…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search study spots"
                  className="h-14 rounded-full border-border/80 bg-card/95 pl-14 pr-12 text-base shadow-lg"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
                  <MapPinned className="h-4 w-4 text-primary" />
                  {area ? (area.isUser ? "Near you" : `Around ${area.label ?? "selected area"}`) : "Finding you…"}
                </span>
                <button type="button" className="font-bold text-primary hover:underline" onClick={() => setPlaceOpen((v) => !v)}>
                  Change area
                </button>
                {!area?.isUser && (
                  <button type="button" className="inline-flex items-center gap-1 font-bold text-primary hover:underline" onClick={locateMe}>
                    <LocateFixed className="h-3.5 w-3.5" /> Use my location
                  </button>
                )}
              </div>

              {placeOpen && (
                <form onSubmit={searchPlace} className="flex gap-2 animate-fade-up">
                  <Input
                    autoFocus
                    placeholder="City, neighbourhood or campus"
                    value={placeQuery}
                    onChange={(e) => setPlaceQuery(e.target.value)}
                    aria-label="Search an area"
                    className="rounded-full"
                  />
                  <Button type="submit" variant="hero" disabled={placeBusy}>
                    {placeBusy ? "Looking…" : "Go"}
                  </Button>
                </form>
              )}
            </div>
          </div>

          <CozyScene className="hidden md:block" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Category chips */}
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          <button type="button" className="cozy-chip shrink-0" data-active={allSelected} onClick={() => setFilters((p) => ({ ...p, categories: [...CATEGORY_IDS] }))}>
            ✨ All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className="cozy-chip shrink-0"
              data-active={!allSelected && filters.categories.includes(c.id)}
              aria-pressed={!allSelected && filters.categories.includes(c.id)}
              onClick={() => toggleChip(c.id)}
            >
              <span>{c.emoji}</span> {c.plural}
            </button>
          ))}
        </div>

        {notice && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-secondary/50 bg-secondary/15 p-4 text-sm animate-fade-up">
            <span className="text-lg">🧡</span>
            <p className="flex-1">
              {notice}
              {canRetry && area && (
                <button type="button" className="ml-2 font-bold text-primary hover:underline" onClick={() => { setNotice(null); loadArea(area); }}>
                  Try again
                </button>
              )}
            </p>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="hidden lg:block lg:w-80 lg:shrink-0">
            <FilterPanel filters={filters} onFiltersChange={setFilters} className="lg:sticky lg:top-24" />
          </aside>

          <div className="min-w-0 flex-1 space-y-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">Study spots {area?.isUser ? "near you" : "around here"}</h2>
                <p className="mt-1 text-muted-foreground">
                  {loading ? (slow ? "OpenStreetMap is a little busy. Still looking… ☕" : "Brewing results…") : `${filteredLocations.length} cozy ${filteredLocations.length === 1 ? "place" : "places"} found`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 lg:hidden">
                      <SlidersHorizontal className="h-4 w-4" /> Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[22rem] max-w-[90vw] overflow-y-auto bg-background p-4">
                    <SheetTitle className="sr-only">Filters</SheetTitle>
                    <FilterPanel filters={filters} onFiltersChange={setFilters} onClose={() => setDrawerOpen(false)} className="mt-6" />
                  </SheetContent>
                </Sheet>

                <div className="flex rounded-full border border-border bg-card/70 p-1 shadow-sm" role="tablist" aria-label="View mode">
                  {([
                    ["map", MapIcon, "Map"],
                    ["list", List, "List"],
                  ] as const).map(([mode, Icon, label]) => (
                    <button
                      key={mode}
                      type="button"
                      role="tab"
                      aria-selected={viewMode === mode}
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition-all",
                        viewMode === mode ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {viewMode === "map" ? (
              <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                <Map
                  locations={filteredLocations}
                  onLocationClick={handleLocationClick}
                  userLocation={mapCenter}
                  showUserMarker={!!area?.isUser}
                  highlightedId={hoveredId}
                  className="h-[360px] sm:h-[440px] xl:h-[620px]"
                />
                <div className="space-y-4 xl:max-h-[620px] xl:overflow-y-auto xl:pr-1">
                  {loading && locations.length === 0
                    ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-3xl" />)
                    : filteredLocations.map((location) => (
                        <LocationCard key={location.id} location={location} compact onHover={setHoveredId} selected={hoveredId === location.id} />
                      ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {loading && locations.length === 0
                  ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-3xl" />)
                  : filteredLocations.map((location) => <LocationCard key={location.id} location={location} />)}
              </div>
            )}

            {!loading && filteredLocations.length === 0 && (
              <Card className="p-10 text-center">
                <div className="mb-3 text-5xl animate-float">🔍</div>
                <h3 className="mb-2 text-xl font-bold">No spots match… yet</h3>
                <p className="mx-auto mb-5 max-w-md text-muted-foreground">
                  Try loosening the filters, searching another area, or add a place you love.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={resetAll}>Clear filters</Button>
                  <Button variant="hero" onClick={() => navigate("/add")}>Add a spot</Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
