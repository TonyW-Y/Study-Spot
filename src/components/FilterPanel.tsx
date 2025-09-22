import { useState, useEffect } from "react";
import { Filter, MapPin, Wifi, Zap, Volume2, Users } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "./ui/enhanced-button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FilterState } from "@/types/location";

interface FilterPanelProps {
  filters: FilterState; // 👈 parent-controlled filters
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
  onClose?: () => void;
}

const FilterPanel = ({ filters, onFiltersChange, className, onClose }: FilterPanelProps) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  
  const categories = [
    { id: "cafe", label: "Cafes" },
    { id: "library", label: "Libraries" },
    { id: "coworking_space", label: "Co-working" },
    { id: "university", label: "Universities" },
    { id: "college", label: "Colleges" },
    { id: "community_centre", label: "Community Centers" },
    { id: "public_building", label: "Public Buildings" },
  ];

  const ratingFilters = [
    { key: "wifi", label: "Wi-Fi", icon: Wifi },
    { key: "outlets", label: "Outlets", icon: Zap },
    { key: "noise", label: "Noise", icon: Volume2 },
    { key: "seating", label: "Seating", icon: Users },
    { key: "overall", label: "Overall", icon: MapPin },
  ];

  // Sync local filters with props when they change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const updatedCategories = checked
      ? [...localFilters.categories, categoryId]
      : localFilters.categories.filter((cat) => cat !== categoryId);

    setLocalFilters({ ...localFilters, categories: updatedCategories });
  };

  const handleDistanceChange = (value: number[]) => {
    setLocalFilters({ ...localFilters, distance: value[0] });
  };

  const handleRatingChange = (category: string, value: number[]) => {
    setLocalFilters({
      ...localFilters,
      ratings: { ...localFilters.ratings, [category]: value[0] },
    });
  };

  const resetFilters = () => {
    const clearedFilters: FilterState = {
      categories: [],
      distance: 1,
      ratings: { wifi: 0, outlets: 0, noise: 0, seating: 0, overall: 0 },
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    if (onClose) onClose();
  };

  const saveFilters = () => {
    onFiltersChange(localFilters);
    if (onClose) onClose();
  };

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Categories</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const allCategoryIds = categories.map(cat => cat.id);
                const isAllSelected = allCategoryIds.every(id => localFilters.categories.includes(id));
                
                if (isAllSelected) {
                  // Deselect all
                  setLocalFilters({ ...localFilters, categories: [] });
                } else {
                  // Select all
                  setLocalFilters({ ...localFilters, categories: allCategoryIds });
                }
              }}
              className="text-xs h-6 px-2"
            >
              {categories.every(cat => localFilters.categories.includes(cat.id)) ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={category.id}
                  checked={localFilters.categories.includes(category.id)}
                  onCheckedChange={(checked) =>
                    handleCategoryChange(category.id, checked as boolean)
                  }
                />
                <Label htmlFor={category.id} className="text-sm">
                  {category.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Distance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Distance</Label>
            <span className="text-sm text-muted-foreground">
              {localFilters.distance === 5 ? "5+ km" : `${localFilters.distance} km`}
            </span>
          </div>
          <Slider
            value={[localFilters.distance]}
            onValueChange={handleDistanceChange}
            max={5}
            min={0.5}
            step={0.5}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Minimum Ratings */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Minimum Ratings</Label>
          {ratingFilters.map((filter) => {
            const Icon = filter.icon;
            return (
              <div key={filter.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm">{filter.label}</Label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {localFilters.ratings[
                      filter.key as keyof typeof localFilters.ratings
                    ] || "Any"}
                  </span>
                </div>
                <Slider
                  value={[
                    localFilters.ratings[filter.key as keyof typeof localFilters.ratings],
                  ]}
                  onValueChange={(value) => handleRatingChange(filter.key, value)}
                  max={5}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between gap-2 border-t pt-4">
        <Button variant="outline" className="flex-1" onClick={resetFilters}>
          Reset
        </Button>
        <Button className="flex-1" onClick={saveFilters}>
          Save
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FilterPanel;
