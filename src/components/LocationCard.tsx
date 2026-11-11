import { MapPin, Star, Wifi, Zap, Volume2, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/enhanced-button";
import { useNavigate } from "react-router-dom";
import { Location } from "@/types/location";
import { getCategory } from "@/lib/categories";

interface LocationCardProps {
  location: Location;
  className?: string;
}

const LocationCard = ({ location, className }: LocationCardProps) => {
  const { name, address, category, ratings, reviewCount, image, distance } = location;
  const navigate = useNavigate();

  const meta = getCategory(category);

  const getRatingIcon = (type: string) => {
    switch (type) {
      case 'wifi': return Wifi;
      case 'outlets': return Zap;
      case 'noise': return Volume2;
      case 'seating': return Users;
      default: return Star;
    }
  };

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${className}`}>
      {image && (
        <div className="h-48 bg-muted overflow-hidden">
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground line-clamp-1">{name}</h3>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">{address}</span>
              {distance && <span className="text-primary">• {distance}</span>}
            </div>
          </div>
          
          <Badge className={meta.badge}>
            {meta.emoji} {meta.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-secondary fill-secondary" />
            <span className="font-medium text-sm">{ratings.overall.toFixed(1)}</span>
          </div>
          <span className="text-muted-foreground text-sm">({reviewCount} reviews)</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-4 gap-3 mb-4">
          {Object.entries(ratings).filter(([key]) => key !== 'overall').map(([key, rating]) => {
            const Icon = getRatingIcon(key);
            return (
              <div key={key} className="text-center">
                <div className="flex justify-center mb-1">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-xs font-medium text-foreground">{rating.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground capitalize">{key}</div>
              </div>
            );
          })}
        </div>

        <Button 
          variant="card" 
          className="w-full"
          onClick={() => navigate(`/location/${location.id}`, { 
            state: { location } 
          })}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default LocationCard;