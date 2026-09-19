import type { Dict } from '../types';

export const id: Dict = {
  meta: {
    title: 'PT Enjaz Instan Properti | Sewa Villa, Mobil, Motor dan Tour',
    description: 'Sewa villa dengan lokasi jelas, mobil, motor, dan paket travel tour dari PT Enjaz Instan Properti.',
  },
  skip: 'Langsung ke konten',
  nav: {
    villa: 'Villa', mobil: 'Mobil', motor: 'Motor', tour: 'Tour & Travel', testimoni: 'Testimoni',
    menu: 'Buka menu', mainMenu: 'Menu utama', mobileMenu: 'Menu utama (ponsel)',
    brand: 'PT Enjaz Instan Properti, beranda', whatsapp: 'Chat WhatsApp', language: 'Bahasa',
  },
  hero: {
    line1: 'Villa, kendaraan, dan tour.', line2: 'Satu tempat.',
    text: 'Sewa villa dengan lokasi jelas, kendaraan siap jalan, dan paket wisata dari PT Enjaz Instan Properti.',
    cta: 'Pilih layanan', groupLabel: 'Pilih foto latar', photoLabel: 'Tampilkan foto {n} dari {total}',
  },
  services: { title: 'Pilih layanan', note: 'Buka satu layanan untuk melihat semua listing, lokasi, dan harganya.', soon: 'Segera hadir', from: 'mulai', other: 'Lihat layanan lain' },
  categories: {
    villa: {
      name: 'Villa', title: 'Sewa Villa',
      description: 'Daftar villa untuk disewa lengkap dengan lokasi, kapasitas, fasilitas, dan harga per malam dari PT Enjaz Instan Properti.',
      intro: 'Setiap villa mencantumkan lokasi yang bisa dicek di peta sebelum kamu memesan.',
      empty: 'Layanan ini sedang kami siapkan. Silakan cek lagi nanti.',
    },
    mobil: {
      name: 'Mobil', title: 'Sewa Mobil',
      description: 'Sewa mobil lepas kunci atau dengan sopir, harga per hari yang jelas, dari PT Enjaz Instan Properti.',
      intro: 'Pilih lepas kunci atau dengan sopir, sesuai rute dan durasi perjalananmu.',
      empty: 'Layanan ini sedang kami siapkan. Silakan cek lagi nanti.',
    },
    motor: {
      name: 'Motor', title: 'Sewa Motor',
      description: 'Sewa motor harian untuk keliling kota dan tempat wisata, harga per hari, dari PT Enjaz Instan Properti.',
      intro: 'Motor harian untuk jalan sempit dan tempat wisata yang susah dijangkau mobil.',
      empty: 'Layanan ini sedang kami siapkan. Silakan cek lagi nanti.',
    },
    tour: {
      name: 'Travel & Tour', title: 'Paket Travel dan Tour',
      description: 'Paket travel dan tour dengan itinerary jelas, transport dan pemandu sudah diatur, dari PT Enjaz Instan Properti.',
      intro: 'Itinerary sudah disusun. Transport, pemandu, dan tiket masuk sudah diatur.',
      empty: 'Layanan ini sedang kami siapkan. Silakan cek lagi nanti.',
    },
  },
  units: { malam: 'malam', hari: 'hari', orang: 'orang' },
  plural: {
    villa: { one: 'villa', other: 'villa' }, mobil: { one: 'mobil', other: 'mobil' }, motor: { one: 'motor', other: 'motor' },
    paket: { one: 'paket', other: 'paket' }, kamar: { one: 'kamar', other: 'kamar' }, tamu: { one: 'tamu', other: 'tamu' },
    kursi: { one: 'kursi', other: 'kursi' }, cc: { one: 'cc', other: 'cc' }, orang: { one: 'orang', other: 'orang' },
  },
  values: { Matic: 'Matic', Manual: 'Manual', 'Lepas kunci': 'Lepas kunci', 'Dengan sopir': 'Dengan sopir', Keduanya: 'Keduanya' },
  testimonials: { title: 'Kata mereka yang sudah menyewa', region: 'Testimoni pelanggan, berhenti saat disorot atau difokuskan', stars: '{n} dari 5 bintang' },
  office: { title: 'Lokasi kantor', openMaps: 'Buka di Google Maps', mapTitle: 'Peta lokasi kantor PT Enjaz Instan Properti' },
  detail: {
    crumbs: 'Jejak halaman', home: 'Beranda', specs: 'Spesifikasi', amenities: 'Fasilitas', included: 'Sudah termasuk',
    location: 'Lokasi', openMaps: 'Buka di Google Maps', mapTitle: 'Peta lokasi {title}', photoAlt: '{title}, foto {n}',
    morePhotos: 'Foto lainnya', noPhoto: 'foto belum tersedia', aside: 'Harga dan pemesanan', book: 'Pesan', bookRest: ' lewat WhatsApp',
    contactSoon: 'Kontak pemesanan akan segera tersedia.',
    note: 'Ketersediaan dan tanggal dikonfirmasi lewat chat sebelum pembayaran.',
    autoDescription: (label, where, price, unit) => `${label}${where ? ` di ${where}` : ''} dari PT Enjaz Instan Properti, ${price} per ${unit}.`,
    priceRange: (price, unit) => `${price} per ${unit}`,
  },
  footer: { services: 'Layanan', contact: 'Kontak', contactSoon: 'Kontak akan segera ditambahkan.', language: 'Bahasa' },
  notFound: { title: 'Halaman tidak ditemukan', text: 'Listing yang kamu cari mungkin sudah tidak tersedia atau alamatnya berubah.', back: 'Kembali ke beranda' },
  wa: {
    general: 'Halo, saya ingin bertanya tentang layanan PT Enjaz Instan Properti.',
    interested: (title, where, url) => `Halo, saya tertarik dengan ${title}${where ? ` (${where})` : ''}. ${url}`,
  },
};
