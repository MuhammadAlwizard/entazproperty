import { countAdmins, createAdmin, createListing, createTestimonial, listListings, listTestimonials, saveSettings } from './queries';
import { hashPassword } from './password';
import type { ListingInput } from './types';
import { SAMPLE_LISTING_TRANSLATIONS, SAMPLE_TESTIMONIAL_TRANSLATIONS } from './sample-translations';

// SAMPLE DATA ONLY. Names, prices, ratings and testimonials below are invented
// to preview the design. Replace them in the admin panel before launch.

const img = (seed: string) => `https://picsum.photos/seed/${seed}/1200/800`;
const imgs = (seed: string, n = 3) => Array.from({ length: n }, (_, i) => img(`${seed}-${i + 1}`));

type Sample = Omit<ListingInput, 'address' | 'mapsUrl' | 'featured' | 'published' | 'summary' | 'description' | 'translations'> &
  Partial<Pick<ListingInput, 'address' | 'mapsUrl' | 'featured' | 'summary' | 'description'>>;

const samples: Sample[] = [
  // ---- Villa (location is mandatory for villa) ----
  { category: 'villa', title: 'Villa Kamboja', price: 1200000, location: 'Lembang, Bandung Barat', address: 'Jl. Raya Lembang, Kec. Lembang, Kabupaten Bandung Barat', featured: true,
    summary: 'Villa sejuk dengan taman luas dan ruang keluarga terbuka.',
    description: 'Cocok untuk keluarga besar. Ada dapur lengkap, area barbeque, dan parkir untuk tiga mobil. Udara pegunungan Lembang terasa sejak pagi.',
    images: imgs('kamboja'), meta: { kamar: '3', tamu: '8', fasilitas: 'Taman, Dapur, Area barbeque, Parkir luas' } },
  { category: 'villa', title: 'Villa Sawah Terrace', price: 950000, location: 'Ubud, Gianyar, Bali', address: 'Jl. Raya Tegallalang, Ubud, Gianyar, Bali',
    summary: 'Dua kamar menghadap sawah, lima menit ke pusat Ubud.',
    description: 'Balkon menghadap terasering sawah. Sarapan bisa dipesan lewat pengelola.',
    images: imgs('sawah'), meta: { kamar: '2', tamu: '4', fasilitas: 'Kolam renang, Balkon, Sarapan' } },
  { category: 'villa', title: 'Villa Puncak Larasati', price: 1600000, location: 'Cisarua, Bogor', address: 'Jl. Raya Puncak, Cisarua, Kabupaten Bogor',
    summary: 'Empat kamar untuk rombongan, dekat kebun teh.',
    description: 'Ruang tengah luas untuk berkumpul. Ada pemanas air di semua kamar mandi.',
    images: imgs('larasati'), meta: { kamar: '4', tamu: '12', fasilitas: 'Pemanas air, Karaoke, Parkir luas' } },
  { category: 'villa', title: 'Villa Batu Asri', price: 1100000, location: 'Batu, Malang', address: 'Jl. Panglima Sudirman, Batu, Jawa Timur',
    summary: 'Tiga kamar, jalan kaki ke pusat wisata Batu.',
    description: 'Halaman depan cukup untuk dua mobil. Ada ruang santai dengan proyektor.',
    images: imgs('batuasri'), meta: { kamar: '3', tamu: '9', fasilitas: 'Proyektor, Dapur, Halaman' } },

  // ---- Mobil ----
  { category: 'mobil', title: 'Toyota Avanza 2022', price: 350000, location: 'Bandung', featured: true, summary: 'MPV irit untuk keluarga kecil.', images: imgs('avanza'), meta: { transmisi: 'Matic', kursi: '6', layanan: 'Keduanya' } },
  { category: 'mobil', title: 'Honda Brio Satya', price: 275000, location: 'Bandung', summary: 'Kompak untuk dalam kota.', images: imgs('brio'), meta: { transmisi: 'Manual', kursi: '5', layanan: 'Lepas kunci' } },
  { category: 'mobil', title: 'Mitsubishi Xpander', price: 425000, location: 'Bandung', summary: 'Tujuh kursi dengan bagasi lega.', images: imgs('xpander'), meta: { transmisi: 'Matic', kursi: '7', layanan: 'Keduanya' } },
  { category: 'mobil', title: 'Toyota Innova Reborn', price: 650000, location: 'Jakarta Selatan', summary: 'Nyaman untuk perjalanan jauh dengan sopir.', images: imgs('innova'), meta: { transmisi: 'Matic', kursi: '7', layanan: 'Dengan sopir' } },
  { category: 'mobil', title: 'Daihatsu Sigra', price: 250000, location: 'Bandung', summary: 'Pilihan hemat untuk rombongan kecil.', images: imgs('sigra'), meta: { transmisi: 'Manual', kursi: '7', layanan: 'Lepas kunci' } },

  // ---- Motor ----
  { category: 'motor', title: 'Honda Vario 125', price: 70000, location: 'Bandung', featured: true, summary: 'Matic ringan, irit bensin.', images: imgs('vario'), meta: { transmisi: 'Matic', cc: '125' } },
  { category: 'motor', title: 'Yamaha NMAX', price: 110000, location: 'Bandung', summary: 'Nyaman untuk boncengan jarak jauh.', images: imgs('nmax'), meta: { transmisi: 'Matic', cc: '155' } },
  { category: 'motor', title: 'Honda Scoopy', price: 65000, location: 'Bandung', summary: 'Kecil dan lincah di jalan sempit.', images: imgs('scoopy'), meta: { transmisi: 'Matic', cc: '110' } },
  { category: 'motor', title: 'Honda PCX 160', price: 130000, location: 'Bali', summary: 'Stabil untuk keliling pulau.', images: imgs('pcx'), meta: { transmisi: 'Matic', cc: '160' } },
  { category: 'motor', title: 'Kawasaki KLX 150', price: 150000, location: 'Malang', summary: 'Trail untuk jalur menuju kawasan wisata alam.', images: imgs('klx'), meta: { transmisi: 'Manual', cc: '150' } },

  // ---- Tour ----
  { category: 'tour', title: 'Bromo Sunrise Open Trip', price: 650000, location: 'Bromo, Jawa Timur', featured: true, summary: 'Jeep, pemandu, dan tiket masuk sudah termasuk.',
    description: 'Berangkat dini hari dari Malang, melihat matahari terbit dari Penanjakan, lalu menyeberangi lautan pasir menuju kawah.',
    images: imgs('bromo'), meta: { durasi: '2 hari 1 malam', minPeserta: '4', termasuk: 'Jeep, Pemandu, Tiket masuk, Penginapan' } },
  { category: 'tour', title: 'Bali Timur dan Nusa Penida', price: 2400000, location: 'Bali', summary: 'Empat hari keliling Bali timur dan menyeberang ke Nusa Penida.',
    description: 'Itinerary santai dengan waktu cukup di setiap titik. Penyeberangan dan penginapan diatur oleh kami.',
    images: imgs('nusapenida'), meta: { durasi: '4 hari 3 malam', minPeserta: '2', termasuk: 'Hotel, Transport, Penyeberangan, Pemandu' } },
  { category: 'tour', title: 'Labuan Bajo Sailing Trip', price: 3100000, location: 'Labuan Bajo, NTT', summary: 'Tiga hari di atas kapal, singgah di Pulau Padar dan Komodo.',
    description: 'Kabin di kapal, makan tiga kali sehari, dan snorkeling di Pink Beach.',
    images: imgs('labuanbajo'), meta: { durasi: '3 hari 2 malam', minPeserta: '6', termasuk: 'Kapal, Makan, Alat snorkeling, Tiket taman nasional' } },
];

const testimonials = [
  { name: 'Rina Kusumawati', origin: 'Menyewa Villa Kamboja, Lembang', quote: 'Alamat dan petanya jelas, jadi rombongan kami tidak nyasar. Villa sesuai foto dan pengelolanya cepat membalas pesan.', rating: 5 },
  { name: 'Dimas Prakoso', origin: 'Menyewa Toyota Avanza, Bandung', quote: 'Mobil bersih dan serah terima cepat. Harga sesuai yang tertulis, tanpa biaya tambahan di tempat.', rating: 5 },
  { name: 'Nadia Safitri', origin: 'Bromo Sunrise Open Trip', quote: 'Pemandunya sabar dan jadwalnya tepat waktu. Kami dapat sunrise tanpa berdesakan.', rating: 4 },
  { name: 'Hendra Wijaya', origin: 'Menyewa Yamaha NMAX, Bandung', quote: 'Motor terawat dan helm disediakan. Pengembalian gampang, tinggal kabari lewat chat.', rating: 5 },
];

export async function seedSampleContent(): Promise<{ listings: number; testimonials: number }> {
  let l = 0;
  let t = 0;
  if ((await listListings({ limit: 1 })).length === 0) {
    for (const s of samples) {
      await createListing({ address: '', mapsUrl: '', featured: false, summary: '', description: '', translations: SAMPLE_LISTING_TRANSLATIONS[s.title] ?? {}, ...s, published: true });
      l++;
    }
    await saveSettings({ heroImages: [1, 2, 3].map((n) => `https://picsum.photos/seed/enjaz-hero-${n}/1920/1080`).join(String.fromCharCode(10)) });
  }
  if ((await listTestimonials({ limit: 1 })).length === 0) {
    for (const x of testimonials) { await createTestimonial({ ...x, photo: '', translations: SAMPLE_TESTIMONIAL_TRANSLATIONS[x.name] ?? {}, published: true }); t++; }
  }
  return { listings: l, testimonials: t };
}

/** The first admin must change this password at first login (must_change_password = true). */
export async function ensureAdmin(email: string, password: string): Promise<boolean> {
  if ((await countAdmins()) > 0) return false;
  await createAdmin(email, hashPassword(password), true);
  return true;
}
