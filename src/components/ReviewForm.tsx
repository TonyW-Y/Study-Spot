import { useEffect, useState } from "react";
import { Star, Wifi, Zap, Volume2, Armchair } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "./ui/enhanced-button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ReviewData {
  ratings: { wifi: number; outlets: number; noise: number; seating: number };
  comment: string;
}

interface ReviewFormProps {
  onSubmit: (review: ReviewData) => void;
  onCancel?: () => void;
  initial?: ReviewData;
  title?: string;
}

const EMPTY = { wifi: 0, outlets: 0, noise: 0, seating: 0 };

const CATEGORIES = [
  { key: "wifi", label: "Wi-Fi Speed", icon: Wifi, description: "Internet connection quality" },
  { key: "outlets", label: "Power Outlets", icon: Zap, description: "How easy is it to find a plug?" },
  { key: "noise", label: "Quietness", icon: Volume2, description: "5 = library-quiet, 1 = very loud" },
  { key: "seating", label: "Seating Comfort", icon: Armchair, description: "Comfy chairs & table space" },
] as const;

const HINTS = ["", "Not great", "Okay", "Good", "Great", "Perfect!"];

const StarRating = ({
  rating,
  onChange,
  label,
}: {
  rating: number;
  onChange: (rating: number) => void;
  label: string;
}) => {
  const [hover, setHover] = useState(0);
  const shown = hover || rating;
  return (
    <div className="flex items-center gap-2" onMouseLeave={() => setHover(0)}>
      <div className="flex" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            className="rounded-full p-1 transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                star <= shown ? "fill-secondary text-secondary" : "text-muted-foreground/40"
              )}
            />
          </button>
        ))}
      </div>
      <span className="text-xs font-semibold text-muted-foreground">{HINTS[shown]}</span>
    </div>
  );
};

const ReviewForm = ({ onSubmit, onCancel, initial, title = "Leave a Review" }: ReviewFormProps) => {
  const [ratings, setRatings] = useState(initial?.ratings ?? EMPTY);
  const [comment, setComment] = useState(initial?.comment ?? "");

  useEffect(() => {
    setRatings(initial?.ratings ?? EMPTY);
    setComment(initial?.comment ?? "");
  }, [initial]);

  const remaining = Object.values(ratings).filter((r) => r === 0).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (remaining > 0) return;
    onSubmit({ ratings, comment: comment.trim() });
    if (!initial) {
      setRatings(EMPTY);
      setComment("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {CATEGORIES.map(({ key, label, icon: Icon, description }) => (
              <div key={key} className="space-y-1 rounded-2xl bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-bold">{label}</Label>
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
                <StarRating
                  label={label}
                  rating={ratings[key]}
                  onChange={(r) => setRatings((prev) => ({ ...prev, [key]: r }))}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Anything else? (optional)</Label>
            <Textarea
              id="comment"
              placeholder="Best seat by the window, busy after 3pm, great chai…"
              value={comment}
              maxLength={600}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="text-right text-xs text-muted-foreground">{comment.length}/600</div>
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="hero" className="flex-1" disabled={remaining > 0}>
              {remaining > 0 ? `Rate ${remaining} more categor${remaining === 1 ? "y" : "ies"}` : initial ? "Update Review" : "Submit Review"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
