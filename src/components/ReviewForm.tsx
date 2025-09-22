import { useState } from "react";
import { Star, Wifi, Zap, Volume2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "./ui/enhanced-button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  onSubmit: (review: ReviewData) => void;
  isSubmitting?: boolean;
}

interface ReviewData {
  ratings: {
    wifi: number;
    outlets: number;
    noise: number;
    seating: number;
  };
  comment: string;
}

const ReviewForm = ({ onSubmit, isSubmitting = false }: ReviewFormProps) => {
  const [ratings, setRatings] = useState({
    wifi: 0,
    outlets: 0,
    noise: 0,
    seating: 0,
  });
  const [comment, setComment] = useState("");

  const ratingCategories = [
    { key: 'wifi', label: 'Wi-Fi Speed', icon: Wifi, description: 'Internet connection quality' },
    { key: 'outlets', label: 'Power Outlets', icon: Zap, description: 'Availability of charging spots' },
    { key: 'noise', label: 'Noise Level', icon: Volume2, description: 'How quiet is it for studying?' },
    { key: 'seating', label: 'Seating Comfort', icon: Users, description: 'Quality and availability of seats' },
  ];

  const handleRatingChange = (category: string, rating: number) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allRatingsProvided = Object.values(ratings).every(rating => rating > 0);
    if (!allRatingsProvided) {
      alert("Please provide ratings for all categories");
      return;
    }

    onSubmit({
      ratings,
      comment: comment.trim(),
    });

    // Reset form
    setRatings({ wifi: 0, outlets: 0, noise: 0, seating: 0 });
    setComment("");
  };

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="p-1 rounded transition-colors hover:bg-muted"
          >
            <Star
              className={cn(
                "w-5 h-5 transition-colors",
                star <= rating
                  ? "text-secondary fill-secondary"
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Categories */}
          <div className="space-y-4">
            {ratingCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">{category.label}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                  <StarRating
                    rating={ratings[category.key as keyof typeof ratings]}
                    onRatingChange={(rating) => handleRatingChange(category.key, rating)}
                  />
                </div>
              );
            })}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Additional Comments (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share more details about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="hero"
            className="w-full"
            disabled={isSubmitting || Object.values(ratings).some(rating => rating === 0)}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;