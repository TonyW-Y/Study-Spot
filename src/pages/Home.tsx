import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Map from "@/components/Map";
import LocationCard from "@/components/LocationCard";
import FilterPanel from "@/components/FilterPanel";
import { Button } from "@/components/ui/enhanced-button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, MapIcon, List, Filter, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Location, FilterState } from "@/types/location";
import { fetchStudyLocations, addDistancesToLocations } from "@/services/overpassApi";

const ALL_CATEGORIES = ["cafe", "library", "coworking_space", "university", "college", "community_centre", "public_building"];
const FETCH_RADIUS_KM = 5;
const defaultFilters = (): FilterState => ({
  categories: [...ALL_CATEGORIES],
  distance: 5,
  ratings: { wifi: 0, outlets: 0, noise: 0, seating: 0, overall: 0 },
});
import heroImage from "@/assets/hero-studyspot.jpg";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Master filters state
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Mobile drawer open/close
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Get user's current location and fetch study locations
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userPos = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLocation(userPos);
        
        try {
          // Fetch study locations from OSM
          const osmLocations = await fetchStudyLocations(
            userPos.latitude,
            userPos.longitude,
            FETCH_RADIUS_KM
          );
          
          // Add distances to locations
          const locationsWithDistance = addDistancesToLocations(
            osmLocations,
            userPos.latitude,
            userPos.longitude
          );
          
          setLocations(locationsWithDistance);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to fetch study locations");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Unable to access your location. Please enable location services and try again.");
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }
    );
  }, []);

  // Filter locations based on search and filters
  const filteredLocations = useMemo(() => {
    return locations
      .filter((location) => {
        const matchesSearch =
          !debouncedQuery ||
          location.name.toLowerCase().includes(debouncedQuery) ||
          location.address.toLowerCase().includes(debouncedQuery) ||
          location.category.replace(/_/g, " ").includes(debouncedQuery);

        const matchesCategory =
          filters.categories.length === 0 || filters.categories.includes(location.category);

        // Slider max (5) means "5+ km" i.e. no distance limit
        const matchesDistance =
          filters.distance >= 5 || location.distanceKm == null || location.distanceKm <= filters.distance;

        const matchesRatings = Object.entries(filters.ratings).every(([key, minRating]) => {
          if (minRating === 0) return true;
          return location.ratings[key as keyof typeof location.ratings] >= minRating;
        });

        return matchesSearch && matchesCategory && matchesDistance && matchesRatings;
      })
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [locations, debouncedQuery, filters]);

  const handleLocationClick = useCallback(
    (locationId: string) => {
      setSelectedLocationId(locationId);
      const location = locations.find((loc) => loc.id === locationId);
      navigate(`/location/${locationId}`, { state: { location } });
    },
    [locations, navigate]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-hero overflow-hidden">
        <img
          src={heroImage}
          alt="Study spots"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-center w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4">
              Find Your Perfect Study Spot
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/90 mb-4 md:mb-6 max-w-2xl mx-auto px-4">
              Discover cafes, libraries, and coworking spaces optimized for productivity. Rated
              by students and remote workers like you.
            </p>

            {/* Search Bar */}
            <div className="max-w-sm md:max-w-md mx-auto relative px-4">
              <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/95 backdrop-blur border-0 shadow-lg text-sm md:text-base"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Sidebar Filter - desktop only, map view only */}
          <div className="hidden lg:block lg:w-80 space-y-4 md:space-y-6">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              className="lg:sticky lg:top-20"
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-4 md:space-y-6">
            {/* View Toggle & Results */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                  Study Spots Near You
                </h2>
                <p className="text-muted-foreground mt-1">
                  {filteredLocations.length} locations found
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 lg:hidden">
                      <Filter className="w-4 h-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-6">
                      <h2 className="text-lg font-semibold mb-4">Filters</h2>
                      <FilterPanel
                        filters={filters}
                        onFiltersChange={setFilters}
                        onClose={() => setDrawerOpen(false)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="gap-2 flex-1 sm:flex-initial"
                >
                  <MapIcon className="w-4 h-4" />
                  Map
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="gap-2 flex-1 sm:flex-initial"
                >
                  <List className="w-4 h-4" />
                  List
                </Button>
              </div>
            </div>

            {/* Content Area */}
            {loading ? (
              <Card className="p-8 text-center">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Finding study spots near you...
                </h3>
                <p className="text-muted-foreground">
                  Please wait while we search for nearby libraries, cafes, and study spaces.
                </p>
              </Card>
            ) : error ? (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : viewMode === "map" ? (
              <div className="flex flex-col xl:grid xl:grid-cols-3 gap-4 md:gap-6">
                {/* Map */}
                <div className="xl:col-span-2 order-2 xl:order-1">
                  <Map
                    locations={filteredLocations}
                    onLocationClick={handleLocationClick}
                    userLocation={userLocation}
                    className="h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px]"
                  />
                </div>

                {/* Location Cards */}
                <div className="order-1 xl:order-2 space-y-3 md:space-y-4 max-h-48 sm:max-h-64 xl:max-h-[600px] overflow-y-auto">
                  {filteredLocations.map((location) => (
                    <LocationCard
                      key={location.id}
                      location={location}
                      className={`${
                        selectedLocationId === location.id ? "ring-2 ring-primary" : ""
                      } text-sm xl:text-base`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* List View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredLocations.map((location) => (
                  <LocationCard key={location.id} location={location} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredLocations.length === 0 && (
              <Card className="p-8 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No study spots found
                </h3>
                <p className="text-muted-foreground mb-4">
                  No study locations match your current filters. Try adjusting your search criteria or expanding your search radius.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters(defaultFilters());
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
