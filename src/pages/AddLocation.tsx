import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const AddLocation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    category: "",
    description: "",
    hours: "",
    amenities: [] as string[],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: "cafe", label: "Cafe" },
    { value: "library", label: "Library" },
    { value: "coworking", label: "Coworking Space" },
    { value: "restaurant", label: "Restaurant" },
  ];

  const amenityOptions = [
    "Free WiFi",
    "Power Outlets",
    "Quiet Environment",
    "Meeting Rooms",
    "Coffee/Tea",
    "Outdoor Seating",
    "Parking Available",
    "Food Available",
    "24/7 Access",
    "Air Conditioning",
    "Printing Services",
    "Study Rooms",
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked
        ? [...prev.amenities, amenity]
        : prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.name || !formData.address || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    try {
      console.log("Submitting location:", formData);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Location Added Successfully!",
        description: "Your study spot has been submitted for review.",
      });
      
      // Reset form
      setFormData({
        name: "",
        address: "",
        category: "",
        description: "",
        hours: "",
        amenities: [],
      });
      
      // Navigate back to home after success
      setTimeout(() => navigate("/"), 1500);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Add a New Study Spot
          </h1>
          <p className="text-muted-foreground">
            Help fellow students and remote workers by sharing your favorite places to study and work.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Location Details
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="required">Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Blue Bottle Coffee"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category" className="required">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="required">Address *</Label>
                  <Input
                    id="address"
                    placeholder="e.g. 123 Main St, San Francisco, CA 94102"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us what makes this place great for studying or working..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              {/* Hours */}
              <div className="space-y-2">
                <Label htmlFor="hours" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Operating Hours
                </Label>
                <Input
                  id="hours"
                  placeholder="e.g. Mon-Fri: 7:00 AM - 9:00 PM, Sat-Sun: 8:00 AM - 8:00 PM"
                  value={formData.hours}
                  onChange={(e) => handleInputChange("hours", e.target.value)}
                />
              </div>

              {/* Amenities */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Amenities
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select all amenities available at this location
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenityOptions.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={formData.amenities.includes(amenity)}
                        onCheckedChange={(checked) =>
                          handleAmenityChange(amenity, checked as boolean)
                        }
                      />
                      <Label htmlFor={amenity} className="text-sm">
                        {amenity}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding Location..." : "Add Study Spot"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Your submission will be reviewed before appearing on the map
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddLocation;