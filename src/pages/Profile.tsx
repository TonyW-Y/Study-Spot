import { Link, Navigate } from "react-router-dom";
import { Star, Calendar, Heart, MapPinPlus, LogOut, Timer } from "lucide-react";
import LocationCard from "@/components/LocationCard";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/context/app-context";
import { getCategory } from "@/lib/categories";
import { reviewAverage } from "@/lib/ratings";
import { readJSON } from "@/lib/storage";

const EmptyState = ({ emoji, title, text, cta }: { emoji: string; title: string; text: string; cta: string }) => (
  <div className="py-14 text-center">
    <div className="mb-3 text-5xl animate-float">{emoji}</div>
    <h3 className="mb-1 text-lg font-bold">{title}</h3>
    <p className="mb-5 text-muted-foreground">{text}</p>
    <Link to="/">
      <Button variant="hero">{cta}</Button>
    </Link>
  </div>
);

const Profile = () => {
  const { user, bookmarks, reviews, customSpots, logout } = useApp();

  if (!user) return <Navigate to="/login" replace state={{ from: "/profile" }} />;

  const myReviews = reviews.filter((r) => r.userId === user.id);
  const mySpots = customSpots.filter((s) => s.createdBy === user.id);
  const avgGiven = myReviews.length
    ? (myReviews.reduce((acc, r) => acc + reviewAverage(r.ratings), 0) / myReviews.length).toFixed(1)
    : "–";
  const focusSessions = readJSON<{ completed?: number }>("timer", {}).completed ?? 0;

  const stats = [
    { label: "Saved", value: bookmarks.length, icon: Heart },
    { label: "Reviews", value: myReviews.length, icon: Star },
    { label: "Avg given", value: avgGiven, icon: Star },
    { label: "Focus sessions", value: focusSessions, icon: Timer },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-up">
      <Card className="mb-8 overflow-hidden">
        <div className="h-28 bg-gradient-hero" />
        <CardContent className="-mt-12 pb-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-gradient-primary text-3xl font-bold text-primary-foreground shadow-lg">
              {user.name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Joined {new Date(user.joinDate).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
              </div>
            </div>
            <Button variant="outline" className="gap-2 self-start md:self-end" onClick={logout}>
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl bg-muted/60 p-4 text-center">
                <Icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                <div className="font-display text-2xl font-bold">{value}</div>
                <div className="text-xs font-semibold text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="saved" className="w-full">
        <TabsList className="mb-4 grid h-auto w-full grid-cols-3 rounded-full bg-muted p-1">
          <TabsTrigger value="saved" className="gap-2 rounded-full py-2"><Heart className="h-4 w-4" />Saved</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2 rounded-full py-2"><Star className="h-4 w-4" />Reviews</TabsTrigger>
          <TabsTrigger value="spots" className="gap-2 rounded-full py-2"><MapPinPlus className="h-4 w-4" />My spots</TabsTrigger>
        </TabsList>

        <TabsContent value="saved">
          {bookmarks.length ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((l) => <LocationCard key={l.id} location={l} />)}
            </div>
          ) : (
            <Card><EmptyState emoji="💛" title="No saved spots yet" text="Tap the heart on any spot to keep it here." cta="Explore study spots" /></Card>
          )}
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            {myReviews.length ? (
              <ul className="divide-y divide-border">
                {myReviews.map((r) => {
                  const meta = getCategory(r.location.category);
                  return (
                    <li key={r.id}>
                      <Link to={`/location/${r.locationId}`} className="flex items-start gap-4 p-5 transition-colors hover:bg-accent/50">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ backgroundImage: meta.gradient }}>
                          {meta.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="truncate font-bold">{r.location.name}</h3>
                            <span className="flex shrink-0 items-center gap-1 text-sm font-bold">
                              <Star className="h-4 w-4 fill-secondary text-secondary" />
                              {reviewAverage(r.ratings).toFixed(1)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString()}</div>
                          {r.comment && <p className="mt-1 line-clamp-2 text-sm">{r.comment}</p>}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState emoji="✍️" title="No reviews yet" text="Your reviews help other students find their calm corner." cta="Find places to review" />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="spots">
          {mySpots.length ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {mySpots.map((l) => <LocationCard key={l.id} location={l} />)}
            </div>
          ) : (
            <Card>
              <div className="py-14 text-center">
                <div className="mb-3 text-5xl animate-float">🌱</div>
                <h3 className="mb-1 text-lg font-bold">You haven't added a spot yet</h3>
                <p className="mb-5 text-muted-foreground">Know a hidden gem? Share it with everyone.</p>
                <Link to="/add"><Button variant="hero">Add a study spot</Button></Link>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
