// Shared types for study locations (both mock and OSM data)

export interface Location {
  id: string;
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  ratings: {
    wifi: number;
    outlets: number;
    noise: number;
    seating: number;
    overall: number;
  };
  reviewCount: number;
  distance?: string;
  image?: string;
  description: string;
  hours?: string;
  amenities?: string[];
  // OSM-specific data (optional for backward compatibility)
  osmData?: {
    type: string;
    id: number;
    tags: Record<string, string>;
  };
}

export interface Review {
  id: string;
  locationId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  ratings: {
    wifi: number;
    outlets: number;
    noise: number;
    seating: number;
  };
  comment: string;
  date: string;
  helpful: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  reviewCount: number;
  bookmarks: string[];
}

// Category types for type safety
export type LocationCategory = 
  | 'cafe' 
  | 'library' 
  | 'coworking' 
  | 'coworking_space'
  | 'restaurant' 
  | 'university' 
  | 'college'
  | 'community_centre'
  | 'public_building';

// Filter state interface
export interface FilterState {
  categories: string[];
  distance: number;
  ratings: {
    wifi: number;
    outlets: number;
    noise: number;
    seating: number;
    overall: number;
  };
}
