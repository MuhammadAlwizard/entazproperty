# PT Enjaz Instan Properti: website + admin

Dua website terpisah yang membaca satu database yang sama.

| App | Folder | Port dev | Fungsi |
|---|---|---|---|
| Public | `apps/public` | 3100 | Landing page untuk pengunjung |
| Admin | `apps/admin` | 3101 | Panel pengelola (wajib login) |
| Core | `packages/core` | - | Database, aturan bisnis, auth. Dipakai kedua app |

Port 3000/3001 sengaja tidak dipakai karena bentrok dengan proyek lain di mesin ini.

Stack: Next.js 16 (App Router), React 19, MySQL/MariaDB (`mysql2`), CSS biasa (tanpa Tailwind).
Next 16 punya breaking change. Baca `node_modules/next/dist/docs/` sebelum menulis kode Next (mis. `middleware.ts` sekarang `proxy.ts`, `params` dan `searchParams` berupa Promise).

## Menjalankan (lokal)

```
npm install
cp .env.example .env      # isi ADMIN_EMAIL, ADMIN_PASSWORD (min 12), SESSION_SECRET (32+ karakter)
npm run dev               # database lokal + public :3100 + admin :3101, semuanya sekaligus
```

`npm run dev` menyalakan **MariaDB portabel** (`packages/core/src/cli/dev-db.ts`) di port 3307, membuat database `enjaz`, menjalankan migrasi, lalu kedua app. Pertama kali ia mengunduh MariaDB 11.8.9 (sekitar 97 MB) dari archive.mariadb.org, memeriksa SHA-256, dan mengekstraknya ke `%LOCALAPPDATA%/enjaz-mariadb`. Tanpa installer dan tanpa hak admin. Datanya juga di sana, sengaja di luar OneDrive karena sinkronisasi cloud merusak database yang sedang dipakai. Ini HANYA untuk pengembangan dan hanya untuk Windows (di sistem lain, jalankan MySQL sendiri dan isi `DATABASE_URL`).

Admin pertama dan tabel dibuat otomatis saat app pertama kali menyala (lihat `bootstrap`). Perintah manual: `npm run migrate`, `npm run seed` (admin + data contoh; `SEED_SAMPLE=0` untuk admin saja), `npm run backup` (tulis `backups/<waktu>/` berisi content.json + semua foto), `npm run typecheck`. Memuat ulang isi dari cadangan ke database KOSONG: `npm run import-json -w @enjaz/core -- <content.json>`.

## Database (MySQL, dari Hostinger)

- Satu-satunya konfigurasi: `DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/NAMA_DB`. Password dengan karakter khusus harus di-URL-encode.
- Hostinger hanya menyediakan MySQL (bukan PostgreSQL). Server MySQL/MariaDB yang dipakai Hostinger tidak diketahui pasti, jadi **semua SQL ditulis agar jalan di MySQL 8 DAN MariaDB 10.5+**: tanpa `RETURNING`, tanpa tipe kolom `JSON` (kolom `LONGTEXT` berisi JSON yang di-parse di kode), tanpa default berupa ekspresi, tanpa fungsi tanggal khusus. Jangan menambahkan SQL yang hanya jalan di salah satunya. Di uji hanya pada MariaDB 11.8.9.
- Skema dikelola oleh **migrasi append-only** di `packages/core/src/migrations.ts`. Jangan mengubah migrasi yang sudah pernah dijalankan, tambahkan yang baru. MySQL tidak bisa membatalkan DDL, jadi tiap statement harus aman dijalankan dua kali (`CREATE TABLE IF NOT EXISTS`).
- **Migrasi berjalan otomatis saat app menyala** (`src/instrumentation.ts` di kedua app, dengan kunci `GET_LOCK` agar dua app yang menyala bersamaan tidak berebut). Ini disengaja: paket Node.js Hostinger tidak punya SSH/terminal. `AUTO_MIGRATE=0` mematikannya.
- Semua waktu disimpan dalam **UTC**: setiap koneksi menjalankan `SET time_zone = '+00:00'`, dan semua jendela waktu (sesi, batas login) dihitung dari jam aplikasi lalu dikirim sebagai nilai.
- Charset `utf8mb4` (emoji dan huruf Arab aman). Kata `key` dicadangkan di MySQL, jadi kolom bernama `setting_key` / `attempt_key`.
- Setiap query memakai prepared statement (nilai tidak pernah disambung ke teks SQL). Satu-satunya pengecualian adalah `LIMIT`, ditulis sebagai angka bulat yang sudah divalidasi.
- Semua fungsi di `queries.ts`, `security.ts`, `uploads.ts` bersifat **async**. Halaman dan komponen server harus `await`.
- **Foto disimpan di tabel `uploads` (LONGBLOB), bukan di disk.** Di Hostinger public dan admin adalah dua aplikasi dengan disk berbeda, jadi foto yang diunggah admin tidak akan sampai ke public kalau disimpan di disk. Batas `max_allowed_packet` server harus lebih besar dari 5 MB (bawaan MySQL/MariaDB 16 MB atau lebih).
- Database **tidak boleh terbuka ke internet**: biarkan "Remote MySQL" di hPanel mati (aplikasi memakai `localhost`). Di MySQL tidak ada Row Level Security, jadi satu-satunya pagar adalah jaringan dan password database.

## Aturan bisnis (sumber kebenaran: `packages/core`)

Ubah aturan di `core`, bukan di salah satu app, supaya public dan admin selalu sepakat.

1. **Empat kategori, tetap:** `villa`, `mobil`, `motor`, `tour` (label "Travel & Tour"). Definisi, satuan harga (malam/hari/hari/orang), dan field khusus tiap kategori ada di `core/src/categories.ts`. Menambah field kategori = edit file itu saja, form admin dan kartu public mengikuti.
2. **Lokasi villa wajib dan bisa diubah admin.** Villa tidak bisa disimpan tanpa `location`. Field tambahan opsional: `address` (alamat lengkap) dan `mapsUrl` (harus `https://`). Peta di halaman villa memakai `address`, kalau kosong memakai `location`. Kategori lain punya `location` opsional (lokasi ambil / destinasi).
3. **Validasi hanya di `core/src/validation.ts`.** Semua input dari form lewat `validateListing` / `validateTestimonial`. Jangan validasi terpisah di app.
4. **Slug tidak berubah saat edit.** URL publik dan peringkat pencarian tidak boleh putus. Slug dibuat sekali saat listing dibuat (`core/src/queries.ts`).
5. **Draft vs tayang.** Public hanya menampilkan `published = 1`. Listing "unggulan" muncul paling depan di urutan.
6. **Urutan landing page (jangan diubah tanpa diminta):** Hero, lalu **Layanan** (empat kartu foto besar: Villa, Mobil, Motor, Travel & Tour), lalu Testimoni di paling bawah. Halaman-halaman ada di `apps/public/src/app/[lang]/`. Beranda sengaja TIDAK menampilkan daftar listing; tiap kartu layanan membuka halaman kategorinya (`/villa`, `/mobil`, `/motor`, `/tour`). Foto tiap kartu = sampul listing pertama di kategori itu (unggulan lebih dulu), jumlah listing dan harga terendah dihitung otomatis (`components/Services.tsx`).
   - **Hero:** foto memenuhi layar (`100svh`), header transparan melayang di atas foto (hanya di beranda, lewat `body:has(.hero)`, logo memakai `logo-icon-light.png`). Judul, teks, dan tombol di atas foto, kiri bawah. Foto dikelola admin di **Pengaturan > Foto hero** (maks `MAX_HERO_IMAGES` = 6, di `settings.heroImages`, satu URL per baris, urutan = urutan tampil). Satu foto = diam. Lebih dari satu = crossfade `opacity` tiap 6 detik (`components/HeroSlider.tsx`), foto pertama dimuat langsung dan sisanya menyusul 2,5 detik kemudian. **Tidak ada tombol play/jeda (permintaan pemilik).** Sebagai gantinya pergantian berhenti saat kursor atau fokus keyboard ada di hero, saat tab tersembunyi, dan saat `prefers-reduced-motion`. Lapisan gradasi navy (`.hero-shade`) wajib ada agar teks putih dan header terbaca di foto apa pun. Maks 4 elemen teks di hero (judul, paragraf, tombol).
   - **Testimoni:** marquee tanpa henti seperti situs Yasbutiii (`components/Testimonials.tsx`): kartu bergeser ke kiri terus-menerus, berhenti saat kursor atau fokus keyboard ada di atasnya, dan menjadi baris yang bisa digeser jika `prefers-reduced-motion`. Track berisi dua salinan identik dan bergeser tepat setengahnya supaya loop tidak melompat. Tiap kartu punya foto bulat opsional (diunggah di admin, kolom `testimonials.photo`); kalau kosong tampil lingkaran huruf awal nama. Pakai foto hanya jika pelanggan setuju.
   - Uploader admin mengecilkan foto di browser sebelum diunggah (hero 1920 px, listing 1600 px, foto testimoni 480 px, jadi WebP). Server tetap memeriksa jenis file dan batas 5 MB.
7. **Kontak WhatsApp dikelola di admin (Pengaturan), boleh beberapa nomor (maks 5, satu per baris).** Disimpan sebagai `+62...` di `settings.whatsapp`, diurai lewat `parseWhatsappNumbers` di `core/src/format.ts`. **Nomor paling atas = kontak utama** untuk semua tombol pesan (header, halaman detail, pesan otomatis berisi nama listing dan link). Semua nomor tampil di footer. Kalau kosong, tombol pesan disembunyikan. Jangan pernah menaruh nomor palsu.
8. **Mobile:** header memakai tombol WhatsApp ikon saja + menu `<details>` tanpa JS. Penanda foto hero ada di kanan bawah dan dipersempit agar tidak menabrak tombol. Kartu layanan 2x2. Halaman detail memakai bar tetap di bawah (harga + tombol Pesan) di layar <= 980px. Admin memakai sidebar yang berubah jadi baris di atas, tabel listing digeser ke samping di dalam kotaknya.
9. **Harga hanya harga publik.** Tidak ada stok atau angka internal di halaman publik maupun structured data.
10. **Foto:** maksimal 30 per listing (`MAX_LISTING_IMAGES` di `core/src/categories.ts`, dipakai uploader dan validasi). Diunggah lewat admin (`/api/upload`), disimpan di database (tabel `uploads`, LONGBLOB), dikenali dari magic bytes (JPG/PNG/WebP, maks 5 MB), disajikan lewat `/uploads/<uuid>.<ext>` dengan cache 1 tahun (`immutable`), `ETag`, dan `Content-Security-Policy: sandbox`. **Data lokasi (EXIF/GPS) dihapus**: di browser (foto selalu di-encode ulang lewat canvas) dan di server (`stripJpegMetadata`). Data contoh memakai foto acak dari picsum.photos sebagai placeholder.
11. **Data contoh (seed) adalah PALSU:** nama villa/kendaraan, harga, rating, dan seluruh testimoni. Ganti semuanya lewat admin sebelum website dipublikasikan. Testimoni harus dari pelanggan nyata.

## Bahasa: Indonesia, Inggris (AS), Arab (situs public)

**Alamat.** Indonesia di `/` tanpa awalan (URL lama tidak berubah), Inggris di `/en/...`, Arab di `/ar/...`. `apps/public/src/proxy.ts` yang mengatur: alamat tanpa awalan ditulis ulang (rewrite) ke `/id/...` secara internal, `/id/...` dialihkan 308 ke alamat tanpa awalan (satu alamat per halaman, tidak ada duplikat untuk Google). Semua halaman ada di `app/[lang]/`. Proxy juga mengirim header `x-locale` untuk halaman 404. `sitemap.xml` dan `robots.txt` tidak lewat proxy.

**Teks antarmuka** (menu, tombol, judul, kalimat tetap) ada di `apps/public/src/i18n/dictionaries/{id,en,ar}.ts`, bertipe `Dict` (`i18n/types.ts`). Inggris dan Arab **wajib punya kunci yang sama persis dengan Indonesia**, kalau tidak build gagal. **Jangan menulis teks tampilan langsung di komponen**, selalu lewat kamus. Bentuk jamak lewat `pluralize` (Arab punya aturan sendiri: 1 dan 2 memakai kata khusus tanpa angka, 3-10 jamak, 11+ tunggal).

**Konten dari admin** (judul, ringkasan, deskripsi, lokasi, fasilitas/durasi/termasuk, testimoni) ditulis dalam bahasa Indonesia. Admin bisa mengisi terjemahan Inggris dan Arab di blok "Terjemahan (opsional)" pada form listing dan testimoni. Disimpan sebagai JSON di kolom `translations` (migrasi `002_translations`). `localizeListing` / `localizeTestimonial` (`packages/core/src/localize.ts`) memilih bahasa **per kolom**: kolom yang kosong jatuh kembali ke bahasa Indonesia. Nama pelanggan, alamat lengkap, dan link peta tidak diterjemahkan. Nilai pilihan tetap (Matic, Lepas kunci, dst) diterjemahkan oleh kamus, bukan admin.

**Kanan-ke-kiri (Arab).** `<html dir="rtl" lang="ar">` diatur di `[lang]/layout.tsx`. CSS memakai properti logis (`inset-inline-*`, `padding-inline-*`) dan aturan khusus `[dir='rtl']` di bagian akhir `globals.css`: panah dibalik (`.flip-rtl`), gradasi hero dibalik, marquee testimoni bergerak ke arah sebaliknya (`tstScrollRtl`), angka dan nomor telepon dijaga tetap kiri-ke-kanan (`.num`, `.phone`, elemen `<bdi>`). Jika menambah gaya yang memakai `left`/`right`, tulis dengan properti logis.

**Font Arab.** IBM Plex Sans Arabic dimuat lewat `next/font` dengan `preload: false`; hanya dipakai di `html[lang='ar']`, jadi halaman Indonesia dan Inggris tidak mengunduhnya (sudah diukur: 0 file). Untuk Arab `letter-spacing` harus `normal` (spasi negatif memutus sambungan huruf) dan `line-height` lebih longgar.

**Format.** Harga tetap Rupiah tanpa konversi: `Rp1.200.000` (Indonesia), `Rp1,200,000` (Inggris dan Arab). Halaman Arab memakai angka Latin 0-9 (paling universal untuk harga dan nomor telepon di dunia digital), bukan angka Arab-Indic. Pesan WhatsApp otomatis ditulis dalam bahasa halaman yang sedang dibuka.

**SEO.** Tiap halaman punya `canonical` dan `hreflang` (`id`, `en-US`, `ar`, `x-default` = Indonesia) lewat `alternatesFor` di `lib/site.ts`. `sitemap.ts` memuat tiap URL dalam tiga bahasa dengan tautan alternatifnya. `og:locale` mengikuti bahasa.

**Pemilih bahasa** (`components/LangSwitcher.tsx`) adalah komponen klien: header berada di layout yang tidak dirender ulang saat berpindah halaman, jadi ia membaca `usePathname()` sendiri agar selalu menaut ke halaman yang SAMA di bahasa lain. Dropdown ikon globe + nama bahasa di header (ringkas "ID/EN/AR" di ponsel), daftar tautan di footer.

**Menambah bahasa baru:** tambahkan kode di `i18n/config.ts` (`LOCALES`, `LOCALE_META`), buat kamusnya, tambahkan ke `TRANSLATION_LANGS` di `packages/core/src/categories.ts` dan ke `LANGS` di `apps/admin/src/components/TranslationFields.tsx`, lalu rapikan proxy (saat ini hanya `en` dan `ar` yang dikenali sebagai awalan). Bahasa kanan-ke-kiri lain perlu font dan pengujian tampilan sendiri.

**Belum ada:** terjemahan otomatis (butuh layanan AI berbayar), mengingat pilihan bahasa pengunjung (cookie) atau memilih dari bahasa browser, dan bahasa untuk panel admin (admin tetap berbahasa Indonesia). **Teks Arab di kamus dan data contoh ditulis oleh AI, bukan penutur asli. Minta penutur asli untuk membacanya sebelum peluncuran.**

## Keamanan

**Login dan sesi (`apps/admin/src/lib/auth.ts`, `packages/core/src/security.ts`)**
- Password di-hash scrypt. Password baru wajib 12+ karakter, tidak memuat bagian email, dan tidak berupa kata umum (`checkNewPassword`).
- Sesi ada **di database** (`admin_sessions`). Cookie hanya berisi token acak 256-bit + tanda tangan HMAC. Database hanya menyimpan SHA-256 token, jadi kebocoran database tidak membocorkan sesi yang bisa dipakai. Batas: 8 jam mutlak dan 45 menit tanpa aktivitas.
- Logout, ganti password, dan "keluarkan perangkat lain" **mencabut sesi di server**, bukan sekadar menghapus cookie. Cookie yang disalin tidak berfungsi lagi.
- Cookie: `httpOnly`, `SameSite=Strict`, `Secure` + awalan `__Host-` di produksi (`lib/cookie.ts`). Menghapus cookie `__Host-` harus memakai atribut yang sama (lihat `endSession`), kalau tidak browser mengabaikannya dan terjadi loop pengalihan.
- Batas percobaan login **di database** (`login_attempts`): 5 kali per 10 menit, dihitung per alamat IP dan per akun. Kelemahan yang diterima: orang lain bisa mengunci akun admin 10 menit dengan sengaja gagal login.
- Admin pertama dari `seed` punya `must_change_password = true`: semua halaman dan API terkunci sampai password diganti (`requireAdmin`).
- `proxy.ts` hanya gerbang pertama (cek tanda tangan cookie tanpa database). **Setiap page, server action, dan route handler wajib memanggil `requireAdmin()` / `getSession()` sendiri.** Layout tidak dijalankan ulang saat navigasi.
- `/login` tidak pernah dialihkan oleh proxy. Cookie bisa bertanda tangan valid tapi sesinya sudah dicabut, dan pengalihan `/login` <-> `/` akan berputar selamanya.
- **Log aktivitas** (`audit_log`, halaman Aktivitas): login berhasil/gagal/diblokir, semua ubah/hapus konten, upload, ganti password, unduh cadangan.

**Header dan CSP** (`packages/core/src/csp.ts`, dipasang di `proxy.ts` kedua app)
- CSP berbasis **nonce per permintaan**, `strict-dynamic`, tanpa `unsafe-eval` dan tanpa `unsafe-inline` untuk script/style di produksi (dev lebih longgar karena hot reload). Atribut `style=` tetap diizinkan (`style-src-attr`). Hanya public yang boleh membingkai Google Maps. `frame-ancestors 'none'`, `form-action 'self'`, `object-src 'none'`.
- Juga: HSTS (produksi), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`. Admin: `Cache-Control: no-store` dan `robots: disallow /` + `noindex`.
- Menambah sumber eksternal baru (font, skrip, iframe, gambar dari domain lain) berarti mengubah `buildCsp`. Jangan melonggarkan CSP tanpa alasan.

**Lain-lain**
- Upload: hanya login, dicek magic bytes (bukan nama/MIME dari klien), maks 5 MB, EXIF dibuang, disajikan dengan CSP sandbox.
- Pesan error tidak membedakan email tidak ada vs password salah, dan waktu respons disamakan.
- Secret hanya di `.env` lokal (tidak di-commit) atau environment Hostinger. `.env` lokal hanya berisi nilai pengembangan, **jangan pernah menaruh `DATABASE_URL` produksi di sana**.
- Belum ada: verifikasi dua langkah (2FA). Ini peningkatan keamanan terbesar berikutnya untuk login admin.

## Aturan desain (ringkas, detail ada di ~/.claude/CLAUDE.md)

- Palet dari logo: navy `#0E396E` (ink/struktur) + gold `#BB9652` (satu-satunya aksen). Background dingin `#F4F6F9`, bukan krem. Satu tema terang, satu radius (4px public, 6px admin).
- Font: Bricolage Grotesque (judul) + Hanken Grotesk (isi). Bukan Inter, bukan Fraunces.
- **Dilarang tanda em-dash / en-dash di teks apa pun.** Pakai tanda hubung biasa atau koma.
- Hero: judul maksimal 2 baris, teks maksimal 20 kata, tidak ada trust strip, CTA terlihat tanpa scroll.
- Admin: satu angka utama di dashboard, kartu datar bergaris tipis, aksi hapus berupa teks merah (bukan blok merah), setiap halaman punya empty/loading/error state.
- SEO public: `generateMetadata` unik per halaman kategori dan detail, Open Graph + Twitter, JSON-LD (Organization, LodgingBusiness, Product, TouristTrip, BreadcrumbList), `robots.txt`, `sitemap.xml`.
- Animasi hanya `transform`/`opacity` dan menghormati `prefers-reduced-motion`. Tidak ada listener scroll.

## Yang belum ada (jangan diasumsikan sudah ada)

- Sistem booking/pembayaran online. Pemesanan lewat chat WhatsApp.
- Cek ketersediaan tanggal.
- Hapus otomatis file foto yang sudah tidak dipakai.
- Verifikasi dua langkah (2FA) untuk admin.
- Deploy produksi belum pernah dijalankan di Hostinger (baru diuji lokal, termasuk build produksi). Lihat bagian Deploy di bawah.

## Deploy ke Hostinger (checklist, belum pernah dijalankan di Hostinger)

Sumber: dokumentasi Hostinger (dibaca 2026-09-19). Cek lagi karena bisa berubah.

- Aplikasi Node.js hanya jalan di paket **Business Web Hosting** atau **Cloud** (Startup/Professional/Enterprise). Hosting web biasa tidak bisa. Versi Node 18, 20, 22, atau 24. **Tidak ada SSH atau terminal** di paket ini.
- Database: hPanel > Websites > Dashboard > **Databases > Management** > isi nama database, username, password > Create. Aplikasi di akun yang sama memakai host `localhost` port `3306` (tidak perlu akses jarak jauh).

Langkah:
1. Buat database MySQL di hPanel seperti di atas. Catat nama database, username, dan password (Hostinger biasanya memberi awalan `u123456789_` pada keduanya).
2. Buat dua aplikasi lewat **Websites > Add Website > Deploy Web App**: `apps/public` (domain utama) dan `apps/admin` (subdomain, misalnya `admin.domainmu.com`), dari GitHub atau unggah zip.
3. Environment Variables di dashboard aplikasi (bukan file). Public: `DATABASE_URL`, `SITE_URL`. Admin: `DATABASE_URL`, `SESSION_SECRET` (nilai acak BARU), `PUBLIC_SITE_URL`, `SITE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Format: `DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/NAMA_DB`.
4. Saat aplikasi menyala pertama kali, tabel dan admin pertama dibuat otomatis. Log akan menulis `[db] migrasi dijalankan` dan `[db] admin pertama dibuat`. Kalau password ditolak (kurang dari 12 karakter atau memuat bagian email), admin TIDAK dibuat dan log menjelaskan alasannya.
5. Login admin pertama memaksa ganti password. Setelah itu **hapus `ADMIN_PASSWORD` dari environment**.
6. Pakai HTTPS di kedua domain (HSTS dan cookie `__Host-` mengharuskannya).
7. `getClientIp` membaca `x-forwarded-for`. Itu hanya bisa dipercaya jika aplikasi memang di belakang proxy Hostinger. Kalau bisa diakses langsung, header itu bisa dipalsukan (batas login per akun tetap berlaku).
8. Server Actions Next memeriksa Origin. Jika muncul error "Invalid Server Actions request" di belakang proxy, atur `experimental.serverActions.allowedOrigins` di `next.config.mjs`.
9. Pastikan backup Hostinger untuk database aktif, dan unduh cadangan berkala dari halaman Pengaturan.

**Risiko terbuka (belum diverifikasi):**
- Repo ini **monorepo** (`apps/*` + `packages/core`). Dokumentasi Hostinger tidak menyebut dukungan monorepo. Perintah build otomatis mereka mungkin hanya bekerja dari satu folder aplikasi yang berdiri sendiri. Jika deploy gagal karena `@enjaz/core` tidak ditemukan, solusi yang perlu dicoba: `output: 'standalone'` dengan `outputFileTracingRoot` ke root repo, lalu unggah hasil build.
- Belum diketahui apakah paket yang dipakai membolehkan dua aplikasi Node.js sekaligus.
