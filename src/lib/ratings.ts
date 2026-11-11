import type { Location } from '@/types/location';
import type { StoredReview } from '@/context/types';

// How much the estimated base rating "counts" relative to one real review.
const PRIOR_WEIGHT = 2;

const KEYS = ['wifi', 'outlets', 'noise', 'seating'] as const;

export const reviewAverage = (r: StoredReview['ratings']) =>
  (r.wifi + r.outlets + r.noise + r.seating) / 4;

/** Blend community reviews into a location's displayed ratings. */
export function withCommunityRatings(location: Location, reviews: StoredReview[]): Location {
  const mine = reviews.filter((r) => r.locationId === location.id);
  if (mine.length === 0) return location;

  const blended = { ...location.ratings };
  for (const key of KEYS) {
    const sum = mine.reduce((acc, r) => acc + r.ratings[key], 0);
    blended[key] = (location.ratings[key] * PRIOR_WEIGHT + sum) / (PRIOR_WEIGHT + mine.length);
  }
  blended.overall = KEYS.reduce((acc, k) => acc + blended[k], 0) / KEYS.length;

  return {
    ...location,
    ratings: blended,
    reviewCount: location.reviewCount + mine.length,
  };
}
