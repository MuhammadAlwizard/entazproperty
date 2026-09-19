// Single source of truth for the four business lines.
// Both the public site and the admin panel read this file, so a change here
// (label, price unit, category-specific fields) shows up in both.

/** Max photos per listing. Used by the admin uploader and by server-side validation. */
export const MAX_LISTING_IMAGES = 30;
/** Max photos in the landing page hero slideshow (Pengaturan > Foto hero). */
export const MAX_HERO_IMAGES = 6;

export const CATEGORIES = ['villa', 'mobil', 'motor', 'tour'] as const;
export type Category = (typeof CATEGORIES)[number];

export type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  placeholder?: string;
  suffix?: string;
  /** Shown as a chip / spec line on cards */
  highlight?: boolean;
};

export type CategoryConfig = {
  label: string;
  /** Short form used in nav and section headings */
  short: string;
  priceUnit: string;
  locationLabel: string;
  locationHint: string;
  locationRequired: boolean;
  fields: FieldDef[];
};

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  villa: {
    label: 'Villa',
    short: 'Villa',
    priceUnit: 'malam',
    locationLabel: 'Lokasi villa',
    locationHint: 'Contoh: Lembang, Bandung Barat. Tampil di kartu dan halaman villa.',
    locationRequired: true,
    fields: [
      { key: 'kamar', label: 'Jumlah kamar', type: 'number', suffix: 'kamar', highlight: true },
      { key: 'tamu', label: 'Kapasitas tamu', type: 'number', suffix: 'tamu', highlight: true },
      { key: 'fasilitas', label: 'Fasilitas', type: 'text', placeholder: 'Kolam renang, Dapur, Parkir luas (pisahkan dengan koma)' },
    ],
  },
  mobil: {
    label: 'Mobil',
    short: 'Mobil',
    priceUnit: 'hari',
    locationLabel: 'Lokasi pengambilan',
    locationHint: 'Kota atau area tempat unit diambil.',
    locationRequired: false,
    fields: [
      { key: 'transmisi', label: 'Transmisi', type: 'select', options: ['Matic', 'Manual'], highlight: true },
      { key: 'kursi', label: 'Jumlah kursi', type: 'number', suffix: 'kursi', highlight: true },
      { key: 'layanan', label: 'Layanan', type: 'select', options: ['Lepas kunci', 'Dengan sopir', 'Keduanya'], highlight: true },
    ],
  },
  motor: {
    label: 'Motor',
    short: 'Motor',
    priceUnit: 'hari',
    locationLabel: 'Lokasi pengambilan',
    locationHint: 'Kota atau area tempat unit diambil.',
    locationRequired: false,
    fields: [
      { key: 'transmisi', label: 'Transmisi', type: 'select', options: ['Matic', 'Manual'], highlight: true },
      { key: 'cc', label: 'Kapasitas mesin', type: 'number', suffix: 'cc', highlight: true },
    ],
  },
  tour: {
    label: 'Travel & Tour',
    short: 'Tour',
    priceUnit: 'orang',
    locationLabel: 'Destinasi',
    locationHint: 'Tujuan utama paket, contoh: Bromo, Jawa Timur.',
    locationRequired: false,
    fields: [
      { key: 'durasi', label: 'Durasi', type: 'text', placeholder: '2 hari 1 malam', highlight: true },
      { key: 'minPeserta', label: 'Minimal peserta', type: 'number', suffix: 'orang', highlight: true },
      { key: 'termasuk', label: 'Sudah termasuk', type: 'text', placeholder: 'Transport, Pemandu, Tiket masuk (pisahkan dengan koma)' },
    ],
  },
};

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
