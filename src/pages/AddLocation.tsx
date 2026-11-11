import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Tag, LocateFixed, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LocationPicker from "@/components/LocationPicker";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { useApp } from "@/context/app-context";
import { loadNearby } from "@/lib/nearbyCache";
import { DEFAULT_CENTER } from "@/lib/mapbox";
import { getDefaultRatings } from "@/services/overpassApi";
import { cn } from "@/lib/utils";

const AMENITIES = [
  "Free WiFi", "Power Outlets", "Quiet Environment", "Group Tables", "Coffee/Tea",
  "Outdoor Seating", "Parking", "Food Available", "Open Late", "Air Conditioning",
  "Printing", "Study Rooms", "Wheelchair Accessible", "Natural Light",
];

type Coords = { latitude: number; longitude: number };

const AddLocation = () => {
  const navigate = useNavigate();
  const { addSpot, user } = useApp();

  const [form, setForm] = useState({ name: "", address: "", category: "", description: "", hours: "" });
  const [amenities, setAmenities] = useState<string[]>([]);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [center, setCenter] = useState<Coords>(() => loadNearby()?.center ?? DEFAULT_CENTER);
  const [locating, setLocating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Start the picker near the user if we don't know where they are yet
  useEffect(() => {
    if (loadNearby() || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCenter({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => undefined,
      { timeout: 8000 }
    );
  }, []);

  const set = (field: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location isn't available in this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const c = { latitude: p.coords.latitude, longitude: p.coords.longitude };
        setCoords(c);
        setCenter(c);
        setLocating(false);
      },
      () => {
        toast.error("Couldn't get your location. Tap the map instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const missing = [
    !form.name.trim() && "a name",
    !form.category && "a category",
    !form.address.trim() && "an address",
    !coords && "a pin on the map",
  ].filter(Boolean) as string[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (missing.length) {
      toast.error("Almost there!", { description: `Please add ${missing.join(", ")}.` });
      return;
    }
    const meta = getCategory(form.category);
    const spot = addSpot({
      name: form.name.trim(),
      address: form.address.trim(),
      category: form.category,
      latitude: coords!.latitude,
      longitude: coords!.longitude,
      description: form.description.trim() || `${form.name.trim()}: a ${meta.label.toLowerCase()} shared by a fellow student.`,
      hours: form.hours.trim() || undefined,
      amenities,
      ratings: getDefaultRatings(form.category),
      reviewCount: 0,
    });
    toast.success("Your spot is on the map! 🌱", { description: "Thanks for helping other students find their corner." });
    navigate(`/location/${spot.id}`, { state: { location: spot } });
  };

  const meta = form.category ? getCategory(form.category) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-up">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-primary text-3xl shadow-glow animate-float">
          🌱
        </div>
        <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Share a hidden gem</h1>
        <p className="text-muted-foreground">
          Know a calm corner with good Wi-Fi and comfy chairs? Put it on the map for everyone.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <Sparkles className="h-5 w-5 text-primary" /> The basics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="e.g. The Reading Nook Café" value={form.name} onChange={(e) => set("name", e.target.value)}
                aria-invalid={submitted && !form.name.trim()} />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={form.category === c.id}
                    data-active={form.category === c.id}
                    onClick={() => set("category", c.id)}
                    className="cozy-chip"
                  >
                    <span>{c.emoji}</span> {c.label}
                  </button>
                ))}
              </div>
              {submitted && !form.category && <p className="text-xs text-destructive">Pick a category</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">What makes it great?</Label>
              <Textarea id="description" placeholder="Big windows, quiet upstairs, friendly baristas…" value={form.description}
                onChange={(e) => set("description", e.target.value)} className="min-h-[100px]" maxLength={500} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <MapPin className="h-5 w-5 text-primary" /> Where is it?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input id="address" placeholder="e.g. 123 Main St, Springfield" value={form.address}
                onChange={(e) => set("address", e.target.value)} aria-invalid={submitted && !form.address.trim()} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={cn("text-sm", submitted && !coords ? "text-destructive" : "text-muted-foreground")}>
                {coords ? "📍 Pin placed! Drag it to fine-tune." : "Tap the map to drop a pin *"}
              </p>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={useMyLocation} disabled={locating}>
                <LocateFixed className="h-4 w-4" /> {locating ? "Locating…" : "I'm here now"}
              </Button>
            </div>
            <LocationPicker center={center} value={coords} onChange={setCoords} emoji={meta?.emoji} color={meta?.color} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <Tag className="h-5 w-5 text-primary" /> Nice details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="hours" className="flex items-center gap-2"><Clock className="h-4 w-4" /> Hours</Label>
              <Input id="hours" placeholder="e.g. Mon–Fri 7am–9pm, Sat–Sun 8am–8pm" value={form.hours} onChange={(e) => set("hours", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => {
                  const on = amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={on}
                      data-active={on}
                      onClick={() => setAmenities((prev) => (on ? prev.filter((x) => x !== a) : [...prev, a]))}
                      className="cozy-chip text-xs"
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Button type="submit" variant="hero" size="xl" className="w-full">
            Add study spot ✨
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {user ? "Your spot shows up right away on your map." : "Tip: log in so the spot is credited to you."} Spots are saved in this browser.
          </p>
        </div>
      </form>
    </div>
  );
};

export default AddLocation;
