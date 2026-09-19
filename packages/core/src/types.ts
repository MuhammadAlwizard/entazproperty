import type { Category, TranslationLang } from './categories';

export type ListingTranslation = {
  title?: string;
  summary?: string;
  description?: string;
  location?: string;
  /** Only the free-text fields (see translatableMetaFields) */
  meta?: Record<string, string>;
};
export type ListingTranslations = Partial<Record<TranslationLang, ListingTranslation>>;

export type TestimonialTranslations = Partial<Record<TranslationLang, { quote?: string; origin?: string }>>;

export type Listing = {
  id: number;
  category: Category;
  slug: string;
  title: string;
  summary: string;
  description: string;
  price: number;
  location: string;
  address: string;
  mapsUrl: string;
  images: string[];
  meta: Record<string, string>;
  translations: ListingTranslations;
  published: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ListingInput = {
  category: Category;
  title: string;
  summary: string;
  description: string;
  price: number;
  location: string;
  address: string;
  mapsUrl: string;
  images: string[];
  meta: Record<string, string>;
  translations: ListingTranslations;
  published: boolean;
  featured: boolean;
};

export type Testimonial = {
  id: number;
  name: string;
  origin: string;
  quote: string;
  /** Optional customer photo (upload URL). Empty = show initials instead. */
  photo: string;
  translations: TestimonialTranslations;
  rating: number;
  published: boolean;
  sortOrder: number;
};

export type TestimonialInput = Omit<Testimonial, 'id' | 'sortOrder'>;

/**
 * heroImages holds one photo URL per line, in display order (first = main photo).  
 * heroImagesMobile is the optional portrait set for tall screens (phones held upright): photo N replaces
 * photo N of heroImages there, and a missing one falls back to the wide photo.
 */
export const SETTING_KEYS = ['whatsapp', 'email', 'address', 'instagram', 'heroImages', 'heroImagesMobile'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];
export type Settings = Record<SettingKey, string>;
