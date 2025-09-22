// Overpass API service for fetching OpenStreetMap study locations
export interface OSMLocation {
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
  osmData?: {
    type: string;
    id: number;
    tags: Record<string, string>;
  };
}

// Default ratings for OSM locations (since OSM doesn't have user ratings)
const getDefaultRatings = (category: string) => {
  const baseRatings = {
    wifi: 3.5,
    outlets: 3.0,
    noise: 4.0,
    seating: 3.5,
    overall: 3.5,
  };

  // Adjust ratings based on category
  switch (category) {
    case 'library':
      return { ...baseRatings, wifi: 4.5, noise: 4.8, seating: 4.2, overall: 4.3 };
    case 'university':
    case 'college':
      return { ...baseRatings, wifi: 4.2, noise: 4.0, seating: 4.0, overall: 4.1 };
    case 'coworking_space':
      return { ...baseRatings, wifi: 4.8, outlets: 4.6, noise: 3.8, seating: 4.3, overall: 4.4 };
    case 'cafe':
      return { ...baseRatings, wifi: 3.8, outlets: 3.2, noise: 3.0, seating: 3.8, overall: 3.5 };
    case 'community_centre':
    case 'public_building':
      return { ...baseRatings, wifi: 3.2, outlets: 2.8, noise: 4.2, seating: 3.8, overall: 3.5 };
    default:
      return baseRatings;
  }
};

// Generate description based on category and OSM tags
const generateDescription = (category: string, tags: Record<string, string>): string => {
  const name = tags.name || 'Study Location';
  
  switch (category) {
    case 'library':
      return `${name} - A public library offering quiet study spaces and resources.`;
    case 'university':
    case 'college':
      return `${name} - Educational institution with study areas and academic resources.`;
    case 'coworking_space':
      return `${name} - Modern coworking space designed for productivity and collaboration.`;
    case 'cafe':
      return `${name} - Coffee shop with seating and WiFi for casual study sessions.`;
    case 'community_centre':
      return `${name} - Community facility with meeting rooms and study areas.`;
    case 'public_building':
      return `${name} - Public building with accessible study spaces.`;
    default:
      return `${name} - Study location with basic amenities.`;
  }
};

// Generate amenities based on OSM tags
const generateAmenities = (tags: Record<string, string>): string[] => {
  const amenities: string[] = [];
  
  if (tags.internet_access === 'yes' || tags.wifi === 'yes') amenities.push('Free WiFi');
  if (tags.amenity === 'library') amenities.push('Books & Resources', 'Quiet Zones');
  if (tags.amenity === 'cafe') amenities.push('Coffee', 'Food');
  if (tags.amenity === 'coworking_space') amenities.push('Meeting Rooms', 'Networking');
  if (tags.amenity === 'university' || tags.amenity === 'college') amenities.push('Academic Resources');
  if (tags.wheelchair === 'yes') amenities.push('Wheelchair Accessible');
  if (tags.opening_hours) amenities.push('Scheduled Hours');
  
  return amenities.length > 0 ? amenities : ['Basic Amenities'];
};

// Convert OSM element to our location format
const convertOSMElement = (element: any, category: string): OSMLocation => {
  const tags = element.tags || {};
  const name = tags.name || `${category.charAt(0).toUpperCase() + category.slice(1)} Location`;
  
  // Generate address from available tags
  let address = '';
  if (tags['addr:street'] && tags['addr:housenumber']) {
    address = `${tags['addr:housenumber']} ${tags['addr:street']}`;
    if (tags['addr:city']) address += `, ${tags['addr:city']}`;
    if (tags['addr:state']) address += `, ${tags['addr:state']}`;
    if (tags['addr:postcode']) address += ` ${tags['addr:postcode']}`;
  } else if (tags['addr:full']) {
    address = tags['addr:full'];
  } else {
    address = 'Address not available';
  }

  return {
    id: `${element.type}_${element.id}`,
    name,
    address,
    category,
    latitude: element.lat,
    longitude: element.lon,
    ratings: getDefaultRatings(category),
    reviewCount: Math.floor(Math.random() * 50) + 10, // Mock review count
    description: generateDescription(category, tags),
    hours: tags.opening_hours || 'Hours not specified',
    amenities: generateAmenities(tags),
    osmData: {
      type: element.type,
      id: element.id,
      tags,
    },
  };
};

// Overpass API query for study locations - optimized for speed and coverage
const buildOverpassQuery = (lat: number, lon: number, radiusKm: number = 5): string => {
  const radius = radiusKm * 1000; // Convert to meters
  
  return `
    [out:json][timeout:15];
    (
      node["amenity"~"^(library|cafe|community_centre|university|college|school)$"](around:${radius},${lat},${lon});
      way["amenity"~"^(library|cafe|community_centre|university|college|school)$"](around:${radius},${lat},${lon});
      node["building"~"^(university|college|library|school|public|academic)$"](around:${radius},${lat},${lon});
      way["building"~"^(university|college|library|school|public|academic)$"](around:${radius},${lat},${lon});
      node["name"~"university|college|library|school|institute|academy"](around:${radius},${lat},${lon});
      way["name"~"university|college|library|school|institute|academy"](around:${radius},${lat},${lon});
    );
    out center;
  `;
};

// Fallback mock data for when OSM API fails - more comprehensive
const getFallbackLocations = (lat: number, lon: number): OSMLocation[] => {
  // Generate diverse mock locations around the user's position
  const mockLocations: OSMLocation[] = [
    {
      id: 'fallback_1',
      name: 'Central Public Library',
      address: '123 Main St, Your City',
      category: 'library',
      latitude: lat + 0.01,
      longitude: lon + 0.01,
      ratings: { wifi: 4.5, outlets: 4.2, noise: 4.8, seating: 4.0, overall: 4.4 },
      reviewCount: 45,
      description: 'A quiet public library with excellent study spaces and WiFi.',
      hours: 'Mon-Fri: 9 AM - 8 PM, Sat-Sun: 10 AM - 6 PM',
      amenities: ['Free WiFi', 'Power Outlets', 'Quiet Zones', 'Study Rooms'],
    },
    {
      id: 'fallback_2',
      name: 'Corner Cafe',
      address: '456 Oak Ave, Your City',
      category: 'cafe',
      latitude: lat - 0.005,
      longitude: lon + 0.008,
      ratings: { wifi: 3.8, outlets: 3.5, noise: 3.2, seating: 4.0, overall: 3.6 },
      reviewCount: 32,
      description: 'Cozy coffee shop perfect for casual study sessions.',
      hours: 'Daily: 6 AM - 10 PM',
      amenities: ['Free WiFi', 'Coffee', 'Food', 'Outdoor Seating'],
    },
    {
      id: 'fallback_3',
      name: 'Community Center',
      address: '789 Pine St, Your City',
      category: 'community_centre',
      latitude: lat + 0.008,
      longitude: lon - 0.012,
      ratings: { wifi: 3.5, outlets: 3.0, noise: 4.0, seating: 3.8, overall: 3.6 },
      reviewCount: 28,
      description: 'Community facility with meeting rooms and study areas.',
      hours: 'Mon-Fri: 8 AM - 9 PM, Sat: 9 AM - 5 PM',
      amenities: ['Meeting Rooms', 'Study Areas', 'Parking'],
    },
    {
      id: 'fallback_4',
      name: 'University Library',
      address: '100 University Ave, Your City',
      category: 'university',
      latitude: lat + 0.015,
      longitude: lon - 0.005,
      ratings: { wifi: 4.8, outlets: 4.5, noise: 4.9, seating: 4.3, overall: 4.6 },
      reviewCount: 67,
      description: 'University library with extensive study spaces and academic resources.',
      hours: '24/7 during exam periods',
      amenities: ['Premium WiFi', 'Power Outlets', 'Study Rooms', 'Academic Resources', 'Computers'],
    },
    {
      id: 'fallback_5',
      name: 'Student Center',
      address: '200 Campus Dr, Your City',
      category: 'university',
      latitude: lat + 0.012,
      longitude: lon + 0.003,
      ratings: { wifi: 4.2, outlets: 4.0, noise: 3.5, seating: 4.1, overall: 4.0 },
      reviewCount: 89,
      description: 'Student center with study lounges and group meeting areas.',
      hours: 'Mon-Fri: 7 AM - 11 PM, Sat-Sun: 9 AM - 9 PM',
      amenities: ['Free WiFi', 'Group Study Rooms', 'Food Court', 'Printing Services'],
    },
    {
      id: 'fallback_6',
      name: 'Coffee Bean & Tea Leaf',
      address: '300 Commercial St, Your City',
      category: 'cafe',
      latitude: lat - 0.008,
      longitude: lon - 0.010,
      ratings: { wifi: 4.0, outlets: 3.8, noise: 3.0, seating: 3.9, overall: 3.7 },
      reviewCount: 54,
      description: 'Popular coffee chain with reliable WiFi and comfortable seating.',
      hours: 'Daily: 5:30 AM - 10 PM',
      amenities: ['Free WiFi', 'Power Outlets', 'Coffee', 'Pastries', 'Outdoor Seating'],
    },
    {
      id: 'fallback_7',
      name: 'City Hall',
      address: '400 Government Blvd, Your City',
      category: 'public_building',
      latitude: lat - 0.012,
      longitude: lon + 0.015,
      ratings: { wifi: 3.2, outlets: 2.8, noise: 4.2, seating: 3.5, overall: 3.4 },
      reviewCount: 23,
      description: 'Public building with accessible study areas and meeting rooms.',
      hours: 'Mon-Fri: 8 AM - 5 PM',
      amenities: ['Public WiFi', 'Meeting Rooms', 'Wheelchair Accessible', 'Parking'],
    },
    {
      id: 'fallback_8',
      name: 'Tech Hub Co-working',
      address: '500 Innovation Dr, Your City',
      category: 'coworking_space',
      latitude: lat + 0.005,
      longitude: lon - 0.008,
      ratings: { wifi: 4.9, outlets: 4.8, noise: 3.8, seating: 4.5, overall: 4.5 },
      reviewCount: 156,
      description: 'Modern coworking space designed for productivity and collaboration.',
      hours: '24/7 for members',
      amenities: ['Premium WiFi', 'Power Outlets', 'Meeting Rooms', 'Coffee', 'Networking Events'],
    },
  ];

  return mockLocations;
};

// Fetch study locations from Overpass API with performance optimization
export const fetchStudyLocations = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<OSMLocation[]> => {
  try {
    console.log('Fetching study locations from OSM...');
    const query = buildOverpassQuery(latitude, longitude, radiusKm);
    
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Overpass API error: ${response.status}, using fallback data`);
      return getFallbackLocations(latitude, longitude);
    }

    const data = await response.json();
    console.log('OSM API response:', data);
    
    if (!data.elements || data.elements.length === 0) {
      console.warn('No OSM data found, using fallback data');
      return getFallbackLocations(latitude, longitude);
    }

    const elements = data.elements || [];

    // Convert OSM elements to our location format
    const locations: OSMLocation[] = [];
    const seenIds = new Set<string>();

    elements.forEach((element: any) => {
      if (!element.lat || !element.lon) return; // Skip elements without coordinates
      
      const tags = element.tags || {};
      let category = 'cafe'; // default
      
      // Determine category from tags with improved logic
      const name = (tags.name || '').toLowerCase();
      const building = (tags.building || '').toLowerCase();
      const amenity = (tags.amenity || '').toLowerCase();
      const buildingUse = (tags['building:use'] || '').toLowerCase();
      
      if (amenity === 'library' || building === 'library' || name.includes('library')) {
        category = 'library';
      } else if (amenity === 'university' || building === 'university' || buildingUse === 'university' || 
                 name.includes('university') || name.includes('western university') || 
                 name.includes('campus') || name.includes('student')) {
        category = 'university';
      } else if (amenity === 'college' || building === 'college' || buildingUse === 'college' || 
                 name.includes('college')) {
        category = 'college';
      } else if (amenity === 'coworking_space') {
        category = 'coworking_space';
      } else if (amenity === 'cafe') {
        category = 'cafe';
      } else if (amenity === 'community_centre') {
        category = 'community_centre';
      } else if (building === 'public' || buildingUse === 'public' || 
                 amenity === 'public_building' || name.includes('public building') ||
                 name.includes('city hall') || name.includes('government')) {
        category = 'public_building';
      } else if (building === 'school' || buildingUse === 'school' || 
                 name.includes('school') || name.includes('institute') || 
                 name.includes('academy')) {
        category = 'university'; // Treat schools and institutes as university-like
      }

      const location = convertOSMElement(element, category);
      
      // Avoid duplicates
      if (!seenIds.has(location.id)) {
        seenIds.add(location.id);
        locations.push(location);
      }
    });

    // Always supplement with fallback data to ensure we have enough locations
    console.log(`Found ${locations.length} OSM locations, supplementing with fallback data`);
    const fallbackLocations = getFallbackLocations(latitude, longitude);
    fallbackLocations.forEach(loc => {
      if (!seenIds.has(loc.id)) {
        locations.push(loc);
      }
    });

    console.log(`Total study locations: ${locations.length}`);
    return locations;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('OSM API request timed out, using fallback data');
    } else {
      console.error('Error fetching study locations:', error);
    }
    console.log('Using fallback data due to API error');
    return getFallbackLocations(latitude, longitude);
  }
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Add distance to locations based on user position
export const addDistancesToLocations = (
  locations: OSMLocation[],
  userLat: number,
  userLon: number
): OSMLocation[] => {
  return locations.map(location => {
    const distance = calculateDistance(userLat, userLon, location.latitude, location.longitude);
    return {
      ...location,
      distance: `${distance.toFixed(distance < 10 ? 1 : 0)} km`,
    };
  });
};
