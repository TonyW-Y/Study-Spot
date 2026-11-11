import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import type { Location } from '@/types/location';
import { AppContext } from './app-context';
import type {
  AppContextValue,
  Preferences,
  PublicUser,
  StoredReview,
  StoredUser,
} from './types';
import { hashPassword, readJSON, uid, writeJSON } from '@/lib/storage';

const GUEST = 'guest';
const DEMO_EMAIL = 'demo@studyspot.com';
const DEMO_PASSWORD = 'demo123';

const DEFAULT_PREFS: Preferences = { pet: 'cat', petName: 'Mochi', petVisible: true };

const toPublic = ({ id, name, email, joinDate }: StoredUser): PublicUser => ({ id, name, email, joinDate });

/** Persisted state hook */
function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readJSON(key, initial));
  useEffect(() => writeJSON(key, value), [key, value]);
  return [value, setValue] as const;
}

async function createUser(name: string, email: string, password: string): Promise<StoredUser> {
  const salt = uid();
  return {
    id: uid(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    joinDate: new Date().toISOString(),
    salt,
    passwordHash: await hashPassword(password, salt),
  };
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = usePersisted<StoredUser[]>('users', []);
  const [sessionId, setSessionId] = usePersisted<string | null>('session', null);
  const [bookmarkMap, setBookmarkMap] = usePersisted<Record<string, Location[]>>('bookmarks', {});
  const [reviews, setReviews] = usePersisted<StoredReview[]>('reviews', []);
  const [customSpots, setCustomSpots] = usePersisted<Location[]>('customSpots', []);
  const [storedPrefs, setStoredPrefs] = usePersisted<Preferences>('preferences', DEFAULT_PREFS);
  const preferences = useMemo(() => ({ ...DEFAULT_PREFS, ...storedPrefs }), [storedPrefs]);

  const stored = users.find((u) => u.id === sessionId) ?? null;
  const user = useMemo(() => (stored ? toPublic(stored) : null), [stored]);
  const ownerKey = user?.id ?? GUEST;

  const signup = useCallback<AppContextValue['signup']>(
    async (name, email, password) => {
      const normalized = email.trim().toLowerCase();
      if (users.some((u) => u.email === normalized)) {
        throw new Error('An account with this email already exists.');
      }
      const created = await createUser(name, normalized, password);
      setUsers((prev) => [...prev, created]);
      setSessionId(created.id);
      // Carry over anything saved while browsing as a guest
      setBookmarkMap((prev) => {
        const guest = prev[GUEST];
        if (!guest?.length) return prev;
        const { [GUEST]: _omit, ...rest } = prev;
        return { ...rest, [created.id]: guest };
      });
      return toPublic(created);
    },
    [users, setUsers, setSessionId, setBookmarkMap]
  );

  const login = useCallback<AppContextValue['login']>(
    async (email, password) => {
      const normalized = email.trim().toLowerCase();
      let found = users.find((u) => u.email === normalized);

      // Seed the demo account the first time it's used
      if (!found && normalized === DEMO_EMAIL && password === DEMO_PASSWORD) {
        found = await createUser('Demo Student', DEMO_EMAIL, DEMO_PASSWORD);
        const demo = found;
        setUsers((prev) => [...prev, demo]);
      }

      if (!found || (await hashPassword(password, found.salt)) !== found.passwordHash) {
        throw new Error('Invalid email or password.');
      }
      setSessionId(found.id);
      return toPublic(found);
    },
    [users, setUsers, setSessionId]
  );

  const logout = useCallback(() => setSessionId(null), [setSessionId]);

  const bookmarks = useMemo(() => bookmarkMap[ownerKey] ?? [], [bookmarkMap, ownerKey]);

  const isBookmarked = useCallback(
    (locationId: string) => bookmarks.some((b) => b.id === locationId),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    (location: Location) => {
      const already = bookmarks.some((b) => b.id === location.id);
      setBookmarkMap((prev) => {
        const list = prev[ownerKey] ?? [];
        return {
          ...prev,
          [ownerKey]: already ? list.filter((b) => b.id !== location.id) : [location, ...list],
        };
      });
      return !already;
    },
    [bookmarks, ownerKey, setBookmarkMap]
  );

  const reviewsFor = useCallback(
    (locationId: string) =>
      reviews
        .filter((r) => r.locationId === locationId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [reviews]
  );

  const saveReview = useCallback<AppContextValue['saveReview']>(
    (location, data, existingId) => {
      if (!user) return null;
      const review: StoredReview = {
        id: existingId ?? uid(),
        locationId: location.id,
        location: {
          id: location.id,
          name: location.name,
          category: location.category,
          address: location.address,
        },
        userId: user.id,
        userName: user.name,
        ratings: data.ratings,
        comment: data.comment,
        date: new Date().toISOString(),
      };
      setReviews((prev) =>
        existingId ? prev.map((r) => (r.id === existingId ? review : r)) : [review, ...prev]
      );
      return review;
    },
    [user, setReviews]
  );

  const deleteReview = useCallback(
    (reviewId: string) => setReviews((prev) => prev.filter((r) => r.id !== reviewId)),
    [setReviews]
  );

  const addSpot = useCallback<AppContextValue['addSpot']>(
    (spot) => {
      const created: Location = {
        ...spot,
        id: `community_${uid()}`,
        source: 'community',
        createdBy: user?.id ?? GUEST,
      };
      setCustomSpots((prev) => [created, ...prev]);
      return created;
    },
    [user, setCustomSpots]
  );

  const setPreferences = useCallback(
    (patch: Partial<Preferences>) => setStoredPrefs((prev) => ({ ...DEFAULT_PREFS, ...prev, ...patch })),
    [setStoredPrefs]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      signup,
      login,
      logout,
      bookmarks,
      isBookmarked,
      toggleBookmark,
      reviews,
      reviewsFor,
      saveReview,
      deleteReview,
      customSpots,
      addSpot,
      preferences,
      setPreferences,
    }),
    [user, signup, login, logout, bookmarks, isBookmarked, toggleBookmark, reviews, reviewsFor,
      saveReview, deleteReview, customSpots, addSpot, preferences, setPreferences]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
