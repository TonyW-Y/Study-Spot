// Single source of truth for study-spot categories (labels, emoji, colours)

export interface CategoryMeta {
  id: string;
  label: string;
  plural: string;
  emoji: string;
  /** Hex colour used for map markers */
  color: string;
  /** Tailwind classes for badges */
  badge: string;
  /** CSS gradient used for card headers */
  gradient: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'cafe', label: 'Café', plural: 'Cafés', emoji: '☕', color: '#C9773B',
    badge: 'bg-[#f6e3cf] text-[#8a4b1f] dark:bg-[#4a3220] dark:text-[#f3c99a]',
    gradient: 'linear-gradient(135deg,#f7d9b5,#e9a96e)' },
  { id: 'library', label: 'Library', plural: 'Libraries', emoji: '📚', color: '#6B8F71',
    badge: 'bg-[#dfeadb] text-[#3f5e44] dark:bg-[#2d3d2e] dark:text-[#bfd8bd]',
    gradient: 'linear-gradient(135deg,#dbe8d3,#9dbb97)' },
  { id: 'coworking_space', label: 'Co-working', plural: 'Co-working', emoji: '💻', color: '#5E7FA3',
    badge: 'bg-[#dde6f0] text-[#3a5675] dark:bg-[#26354a] dark:text-[#bcd0e6]',
    gradient: 'linear-gradient(135deg,#dce6f2,#9db5d1)' },
  { id: 'university', label: 'University', plural: 'Universities', emoji: '🎓', color: '#8E6BA8',
    badge: 'bg-[#ebe0f1] text-[#5e3f78] dark:bg-[#3a2c47] dark:text-[#d9c2ea]',
    gradient: 'linear-gradient(135deg,#ece0f3,#bfa1d6)' },
  { id: 'college', label: 'College', plural: 'Colleges', emoji: '🏫', color: '#A86B8E',
    badge: 'bg-[#f3e0ea] text-[#7a3f5f] dark:bg-[#472c3b] dark:text-[#eac2d8]',
    gradient: 'linear-gradient(135deg,#f5e0ea,#d6a1bd)' },
  { id: 'community_centre', label: 'Community Center', plural: 'Community Centers', emoji: '🏡', color: '#D08A4E',
    badge: 'bg-[#fae6d2] text-[#8f5320] dark:bg-[#4a3422] dark:text-[#f0c89e]',
    gradient: 'linear-gradient(135deg,#fbe3c8,#e8b07c)' },
  { id: 'public_building', label: 'Public Building', plural: 'Public Buildings', emoji: '🏛️', color: '#8A7F72',
    badge: 'bg-[#ebe6df] text-[#5a5147] dark:bg-[#3a352f] dark:text-[#d8cfc3]',
    gradient: 'linear-gradient(135deg,#ece6dd,#bfb3a3)' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

const FALLBACK: CategoryMeta = CATEGORIES[0];

export const getCategory = (id: string): CategoryMeta =>
  CATEGORIES.find((c) => c.id === id) ?? {
    ...FALLBACK,
    id,
    label: id.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
    plural: id,
    emoji: '📍',
  };
