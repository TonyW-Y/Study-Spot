import type { Location } from '@/types/location';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  joinDate: string;
}

export interface StoredUser extends PublicUser {
  passwordHash: string;
  salt: string;
}

export interface StoredReview {
  id: string;
  locationId: string;
  /** Snapshot so Profile can render reviews for spots that aren't loaded */
  location: Pick<Location, 'id' | 'name' | 'category' | 'address'>;
  userId: string;
  userName: string;
  ratings: { wifi: number; outlets: number; noise: number; seating: number };
  comment: string;
  date: string;
}

export type PetKind = 'cat' | 'dog' | 'bunny';

export interface Preferences {
  pet: PetKind;
  petName: string;
  petVisible: boolean;
}

export interface AppContextValue {
  user: PublicUser | null;
  signup: (name: string, email: string, password: string) => Promise<PublicUser>;
  login: (email: string, password: string) => Promise<PublicUser>;
  logout: () => void;

  bookmarks: Location[];
  isBookmarked: (locationId: string) => boolean;
  toggleBookmark: (location: Location) => boolean;

  reviews: StoredReview[];
  reviewsFor: (locationId: string) => StoredReview[];
  saveReview: (
    location: Location,
    data: { ratings: StoredReview['ratings']; comment: string },
    existingId?: string
  ) => StoredReview | null;
  deleteReview: (reviewId: string) => void;

  customSpots: Location[];
  addSpot: (spot: Omit<Location, 'id' | 'source' | 'createdBy'>) => Location;

  preferences: Preferences;
  setPreferences: (patch: Partial<Preferences>) => void;
}
