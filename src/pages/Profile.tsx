import { useState } from "react";
import { Star, MapPin, Calendar, Heart, Edit2, Settings } from "lucide-react";
import LocationCard from "@/components/LocationCard";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { mockUser, mockLocations, mockReviews } from "@/data/mockData";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("reviews");
  
  // Get user's reviews
  const userReviews = mockReviews.filter(review => review.userId === mockUser.id);
  
  // Get bookmarked locations
  const bookmarkedLocations = mockLocations.filter(location => 
    mockUser.bookmarks.includes(location.id)
  );

  // Get locations with reviews for review tab display
  const reviewsWithLocations = userReviews.map(review => ({
    ...review,
    location: mockLocations.find(loc => loc.id === review.locationId)
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={mockUser.avatar} />
                <AvatarFallback className="text-2xl font-semibold">
                  {mockUser.name[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-foreground">{mockUser.name}</h1>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </div>
                  <p className="text-muted-foreground">{mockUser.email}</p>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(mockUser.joinDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}</span>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{mockUser.reviewCount}</div>
                    <div className="text-sm text-muted-foreground">Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{mockUser.bookmarks.length}</div>
                    <div className="text-sm text-muted-foreground">Bookmarks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">4.2</div>
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="gap-2 md:self-start">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="w-4 h-4" />
              My Reviews
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="gap-2">
              <Heart className="w-4 h-4" />
              Bookmarks
            </TabsTrigger>
          </TabsList>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-secondary" />
                  My Reviews ({userReviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsWithLocations.length > 0 ? (
                  <div className="space-y-6">
                    {reviewsWithLocations.map((review) => (
                      <div key={review.id} className="space-y-4">
                        <div className="flex items-start gap-4">
                          {review.location?.image && (
                            <img 
                              src={review.location.image} 
                              alt={review.location.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground">
                                {review.location?.name}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {review.location?.category}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-secondary fill-secondary" />
                                <span className="text-sm font-medium">
                                  {Object.values(review.ratings).reduce((a, b) => a + b, 0) / 4}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.date).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <p className="text-foreground text-sm mb-3">{review.comment}</p>
                            
                            <div className="grid grid-cols-4 gap-4">
                              {Object.entries(review.ratings).map(([category, rating]) => (
                                <div key={category} className="text-center">
                                  <div className="text-xs text-muted-foreground capitalize">{category}</div>
                                  <div className="text-sm font-medium">{rating}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-1">
                              {review.helpful} helpful votes
                            </div>
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No reviews yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Start reviewing study spots to help other students!
                    </p>
                    <Button variant="hero">Find Places to Review</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-destructive" />
                  Saved Locations ({bookmarkedLocations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookmarkedLocations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookmarkedLocations.map((location) => (
                      <LocationCard key={location.id} location={location} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No bookmarks yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Save your favorite study spots for quick access!
                    </p>
                    <Button variant="hero">Explore Study Spots</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;