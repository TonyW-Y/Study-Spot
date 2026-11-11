import { useParams, Link, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Star, Wifi, Zap, Volume2, Users, Heart, Share2, ExternalLink, Loader2 } from "lucide-react";
import ReviewForm from "@/components/ReviewForm";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Location } from "@/types/location";
import { getCategory } from "@/lib/categories";
import { fetchStudyLocations, addDistancesToLocations } from "@/services/overpassApi";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const LocationDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const locationState = useLocation();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to get location from state first (passed from Home component)
  useEffect(() => {
    if (locationState.state?.location) {
      setLocation(locationState.state.location);
      return;
    }

    // If not in state, try to fetch from OSM (fallback)
    if (id) {
      setLoading(true);
      setError(null);
      
      // Get user location for fetching nearby locations
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const osmLocations = await fetchStudyLocations(
                pos.coords.latitude,
                pos.coords.longitude,
                5
              );
              
              const locationsWithDistance = addDistancesToLocations(
                osmLocations,
                pos.coords.latitude,
                pos.coords.longitude
              );
              
              const foundLocation = locationsWithDistance.find(loc => loc.id === id);
              if (foundLocation) {
                setLocation(foundLocation);
              } else {
                setError("Location not found");
              }
            } catch (err) {
              setError("Failed to load location details");
            } finally {
              setLoading(false);
            }
          },
          () => {
            setError("Unable to access location");
            setLoading(false);
          }
        );
      } else {
        setError("Geolocation not supported");
        setLoading(false);
      }
    }
  }, [id, locationState.state]);

  // Mock reviews for now (OSM doesn't have user reviews)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Loading location details...</h1>
        </div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {error || "Location not found"}
          </h1>
          <Link to="/">
            <Button variant="hero">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const meta = getCategory(location.category);

  const ratingCategories = [
    { key: 'wifi', label: 'Wi-Fi Speed', icon: Wifi, color: 'text-blue-500' },
    { key: 'outlets', label: 'Power Outlets', icon: Zap, color: 'text-yellow-500' },
    { key: 'noise', label: 'Noise Level', icon: Volume2, color: 'text-green-500' },
    { key: 'seating', label: 'Seating', icon: Users, color: 'text-purple-500' },
  ];

  const handleReviewSubmit = () => {
    toast({
      title: "Review submitted!",
      description: "Thank you for sharing your experience.",
    });
  };

  const handleBookmark = () => {
    toast({
      title: "Bookmarked!",
      description: "Added to your saved locations.",
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Location link copied to clipboard.",
    });
  };

  const handleGetDirections = () => {
    const hasCoords = typeof location.latitude === 'number' && typeof location.longitude === 'number';
    const destination = hasCoords
      ? `${location.latitude},${location.longitude}`
      : encodeURIComponent(location.address || location.name);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card className="overflow-hidden">
              {location.image && (
                <div className="h-64 bg-muted">
                  <img 
                    src={location.image} 
                    alt={location.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold text-foreground">{location.name}</h1>
                      <Badge className={meta.badge}>
                        {meta.emoji} {meta.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{location.address}</span>
                      {location.distance && (
                        <>
                          <span>•</span>
                          <span className="text-primary">{location.distance}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-secondary fill-secondary" />
                        <span className="font-semibold text-lg">{location.ratings.overall.toFixed(1)}</span>
                        <span className="text-muted-foreground">({location.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handleBookmark}>
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-foreground">{location.description}</p>
              </CardHeader>
            </Card>

            {/* Ratings Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Study Environment Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {ratingCategories.map((category) => {
                    const Icon = category.icon;
                    const rating = location.ratings[category.key as keyof typeof location.ratings];
                    return (
                      <div key={category.key} className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-muted ${category.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm">{category.label}</span>
                            <span className="font-semibold">{rating.toFixed(1)}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${(rating / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Reviews - Coming Soon */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  User reviews for this location are not yet available. 
                  This feature will be added in a future update.
                </p>
              </CardContent>
            </Card>

            {/* Review Form */}
            <ReviewForm onSubmit={handleReviewSubmit} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">Hours</div>
                    <div className="text-sm text-muted-foreground">{location.hours}</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-sm mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {location.amenities?.map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <Button variant="outline" className="w-full gap-2" onClick={handleGetDirections}>
                  <ExternalLink className="w-4 h-4" />
                  Get Directions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDetail;