import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, MapPin, Clock, Star, Wifi, Zap, Volume2, Armchair, Heart, Share2, Navigation,
  Loader2, Pencil, Trash2, MessageCircleHeart,
} from "lucide-react";
import { toast } from "sonner";
import ReviewForm, { ReviewData } from "@/components/ReviewForm";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Location } from "@/types/location";
import { fetchStudyLocations, addDistancesToLocations } from "@/services/overpassApi";
import { getCategory } from "@/lib/categories";
import { useApp } from "@/context/app-context";
import { withCommunityRatings, reviewAverage } from "@/lib/ratings";
import { findCachedLocation } from "@/lib/nearbyCache";
import { cn } from "@/lib/utils";

const RATING_CATEGORIES = [
  { key: "wifi", label: "Wi-Fi Speed", icon: Wifi },
  { key: "outlets", label: "Power Outlets", icon: Zap },
  { key: "noise", label: "Quietness", icon: Volume2 },
  { key: "seating", label: "Seating", icon: Armchair },
] as const;

const initials = (name: string) =>
  name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const LocationDetail = () => {
  const { id } = useParams();
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const { user, customSpots, bookmarks, reviews, reviewsFor, saveReview, deleteReview, isBookmarked, toggleBookmark } = useApp();

  const [baseLocation, setBaseLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Resolve the spot: router state → community spots → saved → cache → refetch
  useEffect(() => {
    if (!id) return;
    const fromState = (routerLocation.state as { location?: Location } | null)?.location;
    const local =
      (fromState?.id === id ? fromState : undefined) ??
      customSpots.find((s) => s.id === id) ??
      bookmarks.find((b) => b.id === id) ??
      findCachedLocation(id);

    if (local) {
      setBaseLocation(local);
      return;
    }
    if (!("geolocation" in navigator)) {
      setError("We couldn't find this spot.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const found = addDistancesToLocations(
            await fetchStudyLocations(pos.coords.latitude, pos.coords.longitude, 5),
            pos.coords.latitude,
            pos.coords.longitude
          ).find((l) => l.id === id);
          if (found) setBaseLocation(found);
          else setError("We couldn't find this spot.");
        } catch {
          setError("Failed to load this spot.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("We couldn't find this spot.");
        setLoading(false);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only resolve when the id changes
  }, [id]);

  const location = useMemo(
    () => (baseLocation ? withCommunityRatings(baseLocation, reviews) : null),
    [baseLocation, reviews]
  );
  const spotReviews = id ? reviewsFor(id) : [];
  const myReview = user ? spotReviews.find((r) => r.userId === user.id) : undefined;
  const editing = editingId ? spotReviews.find((r) => r.id === editingId) : undefined;
  const editingInitial = useMemo<ReviewData | undefined>(
    () => (editing ? { ratings: editing.ratings, comment: editing.comment } : undefined),
    [editing]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
        <h1 className="text-2xl font-bold">Warming up the details…</h1>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mb-4 text-6xl">🧭</div>
        <h1 className="mb-2 text-2xl font-bold">{error ?? "Spot not found"}</h1>
        <p className="mb-6 text-muted-foreground">It may have moved, or the link is from a different area.</p>
        <Link to="/">
          <Button variant="hero">Back to the map</Button>
        </Link>
      </div>
    );
  }

  const meta = getCategory(location.category);
  const saved = isBookmarked(location.id);

  const handleReview = (data: ReviewData) => {
    const result = saveReview(baseLocation!, data, editingId ?? undefined);
    if (!result) {
      toast.error("Please log in to leave a review");
      return;
    }
    toast.success(editingId ? "Review updated ✨" : "Thanks for sharing! 💛", {
      description: "Your review helps other students find their spot.",
    });
    setEditingId(null);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: location.name, text: `Study spot: ${location.name}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!", { description: "Send it to your study buddy." });
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") toast.error("Couldn't share this link");
    }
  };

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 animate-fade-up">
      <Button variant="ghost" className="mb-4 gap-2" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Hero banner */}
      <div
        className="relative mb-6 overflow-hidden rounded-3xl p-6 shadow-lg sm:p-10"
        style={{ backgroundImage: meta.gradient }}
      >
        {location.image && (
          <img src={location.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        )}
        <span className="pointer-events-none absolute -right-6 -bottom-10 select-none text-[12rem] leading-none opacity-20">
          {meta.emoji}
        </span>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-[#3a2516]">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold backdrop-blur">
                {meta.emoji} {meta.label}
              </span>
              {location.source === "community" && (
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold backdrop-blur">🌱 Added by the community</span>
              )}
              {location.source === "sample" && (
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold backdrop-blur">Sample spot</span>
              )}
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">{location.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold opacity-80">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{location.address}</span>
              {location.distance && <span>• {location.distance} away</span>}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Star className="h-5 w-5 fill-current" />
              <span className="text-xl font-bold">{location.ratings.overall.toFixed(1)}</span>
              <span className="text-sm opacity-75">({location.reviewCount} reviews)</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-pressed={saved}
              aria-label={saved ? "Remove from saved" : "Save spot"}
              className={cn("h-11 w-11 border-white/60 bg-white/75 text-[#3a2516] backdrop-blur hover:bg-white", saved && "text-rose-500")}
              onClick={() => {
                const now = toggleBookmark(baseLocation!);
                toast(now ? "Saved to your cozy list 💛" : "Removed from saved spots");
              }}
            >
              <Heart className={cn("h-5 w-5", saved && "fill-current")} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Share"
              className="h-11 w-11 border-white/60 bg-white/75 text-[#3a2516] backdrop-blur hover:bg-white"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">About this spot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="leading-relaxed text-foreground/90">{location.description}</p>
              <div className="grid gap-5 sm:grid-cols-2">
                {RATING_CATEGORIES.map(({ key, label, icon: Icon }) => {
                  const rating = location.ratings[key];
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="rounded-2xl bg-accent p-2.5 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-semibold">{label}</span>
                          <span className="font-bold">{rating.toFixed(1)}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-gradient-primary transition-all duration-700" style={{ width: `${(rating / 5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {location.source !== "community" && spotReviews.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Ratings are estimates based on the type of place until students leave reviews.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <MessageCircleHeart className="h-5 w-5 text-primary" />
                Student reviews ({spotReviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {spotReviews.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mb-2 text-4xl">🫖</div>
                  <p className="text-muted-foreground">No reviews yet. Be the first to share how studying here feels.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {spotReviews.map((review) => {
                    const mine = user?.id === review.userId;
                    return (
                      <li key={review.id} className="rounded-2xl bg-muted/50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                            {initials(review.userName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-bold">{review.userName}</span>
                                {mine && <span className="ml-2 text-xs text-primary">(you)</span>}
                                <div className="text-xs text-muted-foreground">
                                  {new Date(review.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-secondary text-secondary" />
                                <span className="font-bold">{reviewAverage(review.ratings).toFixed(1)}</span>
                                {mine && (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit review" onClick={() => setEditingId(review.id)}>
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      aria-label="Delete review"
                                      onClick={() => {
                                        deleteReview(review.id);
                                        if (editingId === review.id) setEditingId(null);
                                        toast("Review deleted");
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                            {review.comment && <p className="mt-2 text-sm leading-relaxed">{review.comment}</p>}
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {RATING_CATEGORIES.map(({ key, label }) => (
                                <span key={key} className="rounded-full bg-card px-2 py-0.5">
                                  {label} {review.ratings[key]}★
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {user ? (
            editing ? (
              <ReviewForm title="Edit your review" initial={editingInitial} onSubmit={handleReview} onCancel={() => setEditingId(null)} />
            ) : myReview ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">You've reviewed this spot. Thank you! 💛</p>
                <Button variant="outline" className="mt-3 gap-2" onClick={() => setEditingId(myReview.id)}>
                  <Pencil className="h-4 w-4" /> Edit my review
                </Button>
              </Card>
            ) : (
              <ReviewForm onSubmit={handleReview} />
            )
          ) : (
            <Card className="p-6 text-center">
              <div className="mb-2 text-3xl">✍️</div>
              <p className="mb-4 text-muted-foreground">Log in to rate Wi-Fi, outlets, quietness and seating here.</p>
              <Link to="/login" state={{ from: routerLocation.pathname }}>
                <Button variant="hero">Log in to review</Button>
              </Link>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="font-display text-lg">Quick info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-bold">Hours</div>
                  <div className="text-sm text-muted-foreground">{location.hours || "Not specified"}</div>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-bold">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {(location.amenities?.length ? location.amenities : ["No details yet"]).map((amenity) => (
                    <span key={amenity} className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
              <Separator />
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="hero" className="w-full gap-2">
                  <Navigation className="h-4 w-4" />
                  Get directions
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LocationDetail;
