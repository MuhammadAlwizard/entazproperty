# PT Enjaz Instan Properti: website + admin

Dua website terpisah yang membaca satu database yang sama.

| App | Folder | Port dev | Fungsi |
|---|---|---|---|
| Public | `apps/public` | 3100 | Landing page untuk pengunjung |
| Admin | `apps/admin` | 3101 | Panel pengelola (wajib login) |
| Core | `packages/core` | - | Database, aturan bisnis, auth. Dipakai kedua app |

Port 3000/3001 sengaja tidak dipakai karena bentrok dengan proyek lain di mesin ini.

> **Kena masalah deploy, tampilan HP, atau alat (Git Bash, Python, Edge)? Baca dulu bagian 'Pelajaran mahal: masalah, penyebab, solusi' di paling bawah file ini.** Isinya gejala yang benar-benar terjadi beserta penyebab dan solusinya, jangan mengulang percobaan yang sudah gagal.

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
5. **Draft vs tayang.** Public hanya menampilkan `published = 1`. Listing "unggulan" muncul paling depan di urutan. **Hapus listing:** tombol 'Hapus' merah di tiap baris daftar Listing (dua langkah: 'Yakin?' lalu 'Ya, hapus', bisa dibatalkan) dan juga di halaman ubah. Dicatat di log aktivitas. Foto milik listing yang dihapus tetap tinggal di tabel `uploads` (belum ada pembersihan otomatis).
6. **Urutan landing page (jangan diubah tanpa diminta):** Hero, lalu **Layanan** (empat kartu foto besar: Villa, Mobil, Motor, Travel & Tour), lalu Testimoni di paling bawah (peta lokasi kantor ada di footer, bukan bagian sendiri). Halaman-halaman ada di `apps/public/src/app/[lang]/`. Beranda sengaja TIDAK menampilkan daftar listing; tiap kartu layanan membuka halaman kategorinya (`/villa`, `/mobil`, `/motor`, `/tour`). Foto tiap kartu = sampul listing pertama di kategori itu (unggulan lebih dulu), jumlah listing dan harga terendah dihitung otomatis (`components/Services.tsx`).
   - **Hero:** foto memenuhi layar (`100lvh`, bukan `svh`: di iPhone bilah browser melayang dan mengecil, dan `svh` menghentikan foto sekitar 100px sebelum dasar layar sehingga bagian berikutnya mengintip. Di layar <= 600px teks dan penanda foto diberi padding bawah ekstra supaya tidak tertutup bilah browser. HP mendatar punya tata letak ringkas), header transparan melayang di atas foto (hanya di beranda, lewat `body:has(.hero)`, logo memakai `logo-icon-light.png`). Judul, teks, dan tombol di atas foto, kiri bawah. Foto dikelola admin di **Pengaturan > Foto hero** (maks `MAX_HERO_IMAGES` = 6, di `settings.heroImages`, satu URL per baris, urutan = urutan tampil). **Foto khusus HP** (`settings.heroImagesMobile`, kotak kedua di Pengaturan, opsional, foto berdiri idealnya 1080x1920): `HeroSlider` merender tiap slide sebagai `<picture>` dengan `<source media="(orientation: portrait)">`, jadi layar berdiri (HP, tablet tegak) memakai foto berdiri, laptop dan HP mendatar memakai foto lebar. Foto HP ke-N menggantikan foto ke-N, yang kurang jatuh kembali ke foto lebar. Tanpa foto HP, foto lebar dipotong kiri dan kanan sekitar 70%. Foto pertama tidak diberi `fetchPriority="high"` kalau ada versi HP-nya, karena React akan preload foto lebar juga dan HP mengunduh dua foto. Satu foto = diam. Lebih dari satu = crossfade `opacity` tiap 6 detik (`components/HeroSlider.tsx`), foto pertama dimuat langsung dan sisanya menyusul 2,5 detik kemudian. **Tidak ada tombol play/jeda (permintaan pemilik).** Sebagai gantinya pergantian berhenti saat kursor atau fokus keyboard ada di hero, saat tab tersembunyi, dan saat `prefers-reduced-motion`. Lapisan gradasi navy (`.hero-shade`) wajib ada agar teks putih dan header terbaca di foto apa pun. Maks 4 elemen teks di hero (judul, paragraf, tombol).
   - **Testimoni:** marquee tanpa henti seperti situs Yasbutiii (`components/Testimonials.tsx`): kartu bergeser ke kiri terus-menerus, berhenti saat kursor atau fokus keyboard ada di atasnya, dan menjadi baris yang bisa digeser jika `prefers-reduced-motion`. Track berisi dua salinan identik dan bergeser tepat setengahnya supaya loop tidak melompat. Tiap kartu punya foto bulat opsional (diunggah di admin, kolom `testimonials.photo`); kalau kosong tampil lingkaran huruf awal nama. Pakai foto hanya jika pelanggan setuju.
   - **Lokasi kantor** (`components/OfficeMap.tsx`, `#lokasi`, dipasang di `Footer.tsx` di bawah logo, jadi tampil di SEMUA halaman): judul kecil, peta Google kompak (maks 400px), dan tautan 'Buka di Google Maps'. Sebelumnya berupa bagian besar di beranda, dipindah ke footer atas permintaan pemilik karena dianggap tidak estetik. Alamat diisi admin di **Pengaturan > Alamat kantor** (`settings.address`, sama dengan yang tampil di footer), plus link Google Maps opsional (`settings.mapsUrl`, wajib `https://`) supaya tombol 'Buka di Google Maps' menuju titik yang tepat; tanpa link, tombol mencari dari alamat. Bagian ini TIDAK tampil sama sekali kalau alamat kosong. Peta memakai embed `google.com/maps?q=...&output=embed` tanpa API key, jadi hanya Google yang boleh di-frame (`frameSrc` di `proxy.ts`). Bahasa peta (`hl`) mengikuti bahasa halaman. JSON-LD Organization ikut memuat `hasMap`.
   - **Kategori tanpa listing tayang** (belum ada isi, atau semuanya dihapus atau draft): kartu di beranda TETAP ada, tanpa jumlah dan harga, hanya lencana **'Segera hadir'** (`.service-soon`, kunci `services.soon`). Halaman kategorinya tidak 404 dan tidak kosong: blok **'Segera hadir'** (`.coming-soon`) berisi kalimat `categories.<nama>.empty` dan tombol 'Lihat layanan lain' ke `/#layanan`. Halaman itu diberi `noindex` selama kosong (di `generateMetadata`) supaya halaman tipis tidak masuk hasil pencarian, dan otomatis normal lagi begitu ada listing tayang. Semua teksnya ada di tiga bahasa.
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
- **Ganti email login** (Pengaturan > Email untuk masuk): wajib memasukkan password saat ini, email baru dicek formatnya dan harus unik, perangkat lain dikeluarkan, dan tercatat di log. Email di `ADMIN_EMAIL` hanya dipakai saat admin PERTAMA dibuat, mengubahnya sesudah itu tidak berpengaruh apa pun.
- **Log aktivitas** (`audit_log`, halaman Aktivitas): login berhasil/gagal/diblokir, semua ubah/hapus konten, upload, ganti password, unduh cadangan.

**Header dan CSP** (`packages/core/src/csp.ts`, dipasang di `proxy.ts` kedua app)
- CSP berbasis **nonce per permintaan**, `strict-dynamic`, tanpa `unsafe-eval` dan tanpa `unsafe-inline` untuk script/style di produksi (dev lebih longgar karena hot reload). Atribut `style=` tetap diizinkan (`style-src-attr`). Hanya public yang boleh membingkai Google Maps. `frame-ancestors 'none'`, `form-action 'self'`, `object-src 'none'`.
- Juga: HSTS (produksi), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`. Admin: `Cache-Control: no-store` dan `robots: disallow /` + `noindex`.
- Menambah sumber eksternal baru (font, skrip, iframe, gambar dari domain lain) berarti mengubah `buildCsp`. Jangan melonggarkan CSP tanpa alasan.
- **Hostinger mengganti header `Content-Security-Policy` kita** menjadi `upgrade-insecure-requests` saja (CDN mereka, terverifikasi di server hidup). Karena itu kebijakan yang sama juga ditulis sebagai `<meta http-equiv="Content-Security-Policy">` di `<head>` kedua app. `proxy.ts` menghitungnya (`cspForMeta`, membuang `frame-ancestors`, `report-uri`, dan `sandbox` yang tidak boleh ada di meta) dan meneruskannya lewat header internal `x-csp-meta` ke layout. Header lain (HSTS, `X-Frame-Options`, dst) tetap lewat, jadi framing tetap dicegah. Sudah diuji di browser lewat proksi yang meniru Hostinger: injeksi `onerror` inline diblokir, dan kontrol tanpa CSP membuktikan uji itu bisa mendeteksinya. **Peringatan:** karakter backspace tak terlihat pernah terselip di regex `csp.ts` (salah escape saat menulis file lewat skrip) dan membuat filter tidak bekerja diam-diam. Kalau menulis regex lewat skrip, periksa hasilnya dengan `od -c` atau uji fungsinya langsung.

**Lain-lain**
- Upload: hanya login, dicek magic bytes (bukan nama/MIME dari klien), maks 5 MB, EXIF dibuang, disajikan dengan CSP sandbox.
- Pesan error tidak membedakan email tidak ada vs password salah, dan waktu respons disamakan.
- Secret hanya di `.env` lokal (tidak di-commit) atau environment Hostinger. `.env` lokal hanya berisi nilai pengembangan, **jangan pernah menaruh `DATABASE_URL` produksi di sana**.
- Belum ada: verifikasi dua langkah (2FA). Ini peningkatan keamanan terbesar berikutnya untuk login admin. Sengaja tidak dibuat tanpa pengawasan: kesalahan kecil di alur login bisa mengunci admin di produksi, sedangkan phpMyAdmin di hosting ini tidak selalu bisa dibuka untuk memulihkan.
- Satu user database dengan hak penuh dipakai kedua app (di Hostinger user hanya-baca belum terbukti bisa dibuat). App public tidak butuh menulis, tapi tidak ada pagar di tingkat database.

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
- Domain asli (sekarang masih alamat sementara `*.hostingersite.com`), konten asli (data contoh masih palsu), dan pembacaan teks Arab oleh penutur asli.

## Deploy ke Hostinger (sudah dijalankan dan berhasil, 2026-09-20)

Dua app Node.js terpisah di satu paket hosting, satu database MySQL bersama. Hanya paket **Business/Cloud** yang bisa Node.js, dan tidak ada SSH atau terminal.

**Kenapa cabang `deploy`, bukan cabang `main`.** Hostinger membangun dari root repo dan tidak mengerti monorepo ini (dicoba: status Selesai tapi tidak menyala, log kosong). Yang berhasil adalah cabang `deploy` berisi HASIL BUILD siap jalan, satu folder per app: `public/` dan `admin/`. Cabang ini dihasilkan, jangan diedit tangan. Pembuatnya ada di folder di luar repo `%USERPROFILE%\enjaz-deploy` (`assemble.mjs`, `branch.mjs`, dan salinan kode di `src/`), belum masuk repo. Alurnya: `next build` dengan `output: 'standalone'` di salinan itu, `assemble.mjs` merakit folder tiap app, `branch.mjs` menyusun isi cabang, lalu commit dan push ke `deploy` (Hostinger otomatis deploy ulang).
- `server.js` di tiap folder adalah pembungkus: memetakan nama `mysql2-<hash>` buatan Next kembali ke `mysql2` (Hostinger membuang semua folder `node_modules`, termasuk alias di `.next/node_modules`), lalu menjalankan server Next. Port dibaca dari `PORT`.
- `package.json` di tiap folder mencantumkan `next`, `react`, `react-dom`, `mysql2` (versi persis) supaya `npm install` Hostinger memasangnya. Script `build` sengaja kosong, sebab semuanya sudah dibangun.
- Kalau kode berubah: sinkronkan ke `enjaz-deploy/src`, build kedua app, `node assemble.mjs`, `node branch.mjs`, lalu commit dan push dari `enjaz-deploy/gitbranch`. **Uji dulu di lokal** (ekstrak hasil rakitan, `npm install`, jalankan), karena push ke `deploy` langsung tayang.

**Pengaturan tiap app di hPanel (Website > Buat website > GitHub, repo `entazproperty`):**
- Branch `deploy`. Root directory `public` (public) atau `admin` (admin). Preset framework **Other**. Build command `npm run build`. Entry file `server.js`. Direktori output kosong. Node 22.
- Environment public: `DATABASE_URL`, `SITE_URL`. Environment admin: `DATABASE_URL`, `SESSION_SECRET` (acak, 32+ karakter), `SITE_URL` (alamat admin sendiri), `PUBLIC_SITE_URL` (alamat public), `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Perubahan environment perlu deploy ulang.
- Setelah login admin pertama dan ganti password: **hapus `ADMIN_PASSWORD`** dari environment. Opsional `SEED_SAMPLE=1` di app ADMIN saja mengisi listing dan testimoni contoh (PALSU) ke database yang masih kosong, lalu hapus variabelnya.

**Pelajaran dari deploy pertama (jangan diulang):**
- `DATABASE_URL` harus memakai host **`127.0.0.1`**, bukan `localhost`. Di Hostinger akun database dibedakan per alamat asal koneksi: `localhost` menjadi `::1` (IPv6) atau unix socket, dan itu akun terpisah dengan password lain. Format: `mysql://USER:PASSWORD@127.0.0.1:3306/NAMA_DB` (nama database peka huruf besar-kecil, berawalan `u123456789_`).
- Password user database bisa diganti tanpa form hPanel: buka phpMyAdmin dari hPanel (masuk otomatis sebagai user itu), tab SQL, jalankan `SET PASSWORD = PASSWORD('...');`. `ALTER USER` ditolak (butuh hak CREATE USER). Form pembuatan user di hPanel pernah menghasilkan password yang tidak cocok, penyebabnya tidak diketahui.
- Tiga kesalahan yang menghabiskan waktu: environment terisi nilai `.env` LOKAL (`127.0.0.1:3307`), preset Next.js (harus Other), dan Root directory `./` (harus `public` atau `admin`).
- Untuk mendiagnosis koneksi database di server yang tidak bisa dijangkau dari luar, pernah dipakai `diag.js` sementara yang mencoba beberapa cara menyambung dan melaporkan hasilnya tanpa mencetak password. Sudah dihapus, tapi ide ini berguna kalau terulang.
- Domain sementara `*.hostingersite.com` menyajikan `robots.txt` bawaan Hostinger (`Disallow` untuk Googlebot). Itu berubah setelah domain asli dihubungkan. `robots.txt` dan `sitemap.xml` kita dibuat per permintaan (`force-dynamic`) supaya memakai `SITE_URL` saat berjalan, bukan saat build.

**Domain asli (belum ada):** public di domain utama dan admin di subdomain (`admin.domainmu.com`), satu domain tanpa biaya tambahan untuk subdomain. Hubungkan lewat 'Hubungkan domain' di tiap app, lalu ganti `SITE_URL` (dan `PUBLIC_SITE_URL` di admin) dan deploy ulang.

**Risiko yang masih terbuka:**
- Satu database dipakai kedua app: kalau database bermasalah, keduanya ikut mati. Pastikan backup database Hostinger aktif dan unduh cadangan dari halaman Pengaturan secara berkala.
- `getClientIp` membaca `x-forwarded-for`. Itu bisa dipercaya karena app memang di belakang proxy Hostinger (`hcdn`).
- Permintaan prefetch Next ke beranda Indonesia (`/?_rsc=...`) dijawab 404 (juga di server hidup). Tidak terlihat oleh pengunjung karena Next lalu memuat halaman biasa. Belum diperbaiki, kemungkinan berkaitan dengan penulisan ulang `/` ke `/id` di `proxy.ts`.
- Server Actions Next memeriksa Origin. Belum ada masalah, tapi kalau muncul 'Invalid Server Actions request', atur `experimental.serverActions.allowedOrigins`.

## Aturan repo publik (repo ini PUBLIK dan dipajang di LinkedIn)

Aturan umum untuk SEMUA proyek (apa yang wajib ada, apa yang dilarang, proses sebelum push) ada di file global `~/.claude/CLAUDE.md`, bagian **Public GitHub repos**. Jangan diulang di sini. Jalankan `npm run check:public` sebelum push (hook `.git/hooks/pre-push` lokal juga menjalankannya, dan hook itu tidak ikut git). Skrip `scripts/check-public.mjs` di repo ini adalah salinan dari `~/.claude/tools/check-public.mjs`.

Yang khusus proyek ini:
- Riwayat repo dipindai pada 2026-09-20 dan bersih dari rahasia. Berkas yang dihapus dari repo pada hari itu (`sewain.html`, foto WhatsApp logo mentah) masih ada di riwayat dan tidak sensitif.
- Logo dan nama PT Enjaz adalah milik klien. Minta izin klien sebelum dipajang, atau ganti logo di repo dengan placeholder. `LICENSE` belum dipilih pemilik (tanpa LICENSE semua hak dilindungi).
- Email pribadi pemilik terlihat publik di commit lama dan sempat sama dengan email login admin. Ganti email login admin ke alamat yang tidak pernah muncul di git (Pengaturan > Email untuk masuk), dan pakai alamat `noreply` GitHub untuk commit baru.
- Cabang `deploy` sengaja publik supaya Hostinger bisa mengambilnya. Kalau ingin `main` bersih sebagai portofolio, pindahkan `deploy` ke repo privat terpisah lalu arahkan ulang kedua app di hPanel (10 sampai 15 menit, ada risiko salah pengaturan). Hook pre-push tidak mencakup klon `enjaz-deploy/gitbranch`.
- Pengaturan di sisi GitHub yang harus dilakukan pemilik: Description, Topics (`nextjs`, `typescript`, `mysql`, `i18n`, `rtl`), sematkan repo di profil, gambar pratinjau sosial.

## Pelajaran mahal: masalah, penyebab, solusi (baca sebelum menebak)

Semua ini benar-benar terjadi dan menghabiskan waktu. Bentuknya **gejala, penyebab, solusi**. Kalau gejalanya mirip, mulai dari sini, jangan mengulang percobaan yang sudah gagal.

### A. Deploy dan Hostinger

**1. Deploy 'Selesai' tapi alamat menjawab 403, log runtime kosong.**
- Penyebab: app dibuat dari repo monorepo mentah (Root directory `./`, preset Other). 'Selesai' hanya berarti proses deploy berjalan, bukan aplikasinya menyala.
- Solusi: pakai cabang `deploy` berisi hasil build (lihat bagian Deploy). Cara cepat membedakan: kalau `robots.txt` di alamat itu berisi `Disallow` untuk Googlebot dan halaman 404-nya bertanggal lama, itu file bawaan Hostinger, BUKAN aplikasi kita.

**2. 503 Service Unavailable.** App sudah terdaftar tapi prosesnya tidak menjawab. Buka **Log runtime**, jangan menebak. Semua penyebab di bawah muncul di sana.

**3. `Error: Cannot find module 'next'`.** Hostinger membuang semua folder `node_modules` dari yang diunggah lalu menjalankan `npm install` sendiri. `package.json` di cabang `deploy` WAJIB mencantumkan `dependencies` (`next`, `react`, `react-dom`, `mysql2`, versi persis). Membungkus `node_modules` di zip atau git tidak berguna.

**4. `Failed to load external module mysql2-3d80...: Cannot find module`.** Next (Turbopack) memberi nama berhash pada paket eksternal dan menyimpan aliasnya di `.next/node_modules`, yang juga dibuang Hostinger. Pembungkus `server.js` memetakan `mysql2-<16 hex>` kembali ke `mysql2`. Jangan menghapus pembungkus itu.

**5. `ERROR: package.json file not found` saat build.** Root directory masih `./`, padahal di cabang `deploy` `package.json` hanya ada di `public/` dan `admin/`. Ubah Root directory (halaman Penempatan > Pengaturan dan deploy ulang).

**6. Preset Next.js menghasilkan build gagal atau app tidak jalan.** Preset itu mencari folder `.next` di root. Pilih **Other**, biarkan Direktori output KOSONG (jangan mengetik 'other' di kolom output, itu pernah terjadi), Entry file `server.js`, Build command `npm run build` (script itu sengaja tidak melakukan apa-apa). Di jalur unggah zip, isian bawaan Build command adalah `npm run start`: itu menyalakan server saat build lalu menggantung, ganti.

**7. Halaman 500 dan log `Access denied for user ...@'::1'`.**
- Penyebab: `localhost` diterjemahkan Node 22 menjadi IPv6 `::1`.
- Solusi: host `127.0.0.1`. Kalau lognya jadi `@'127.0.0.1'` dan masih ditolak, berarti PASSWORD tidak cocok. Di Hostinger akun database dibedakan per alamat asal (`localhost`, `127.0.0.1`, `::1` adalah akun berbeda dengan password berbeda), jadi mengganti password di satu tempat tidak menjamin yang lain. Password diganti lewat phpMyAdmin (dibuka dari hPanel, masuk otomatis) tab SQL: `SET PASSWORD = PASSWORD('...');`. `ALTER USER` ditolak (tidak punya hak CREATE USER).

**8. Environment berisi nilai lokal.** Berkali-kali tertempel isi `.env` lokal (`mysql://root@127.0.0.1:3307/enjaz`, `http://localhost:3100`). Cek isinya di halaman Variabel environment sebelum menyalahkan yang lain. App public hanya butuh 2 variabel (`DATABASE_URL`, `SITE_URL`), jangan diberi variabel admin. `SITE_URL` wajib berawalan `https://`. Setiap perubahan environment butuh **Simpan dan deploy ulang**.

**9. Form 'Buat Database MySQL dan Database User' di hPanel menghasilkan password yang tidak cocok.** Penyebab tidak pasti (diduga isi otomatis peramban). Klik ikon mata di kolom password untuk melihat apa yang benar-benar terisi, atau ganti password lewat `SET PASSWORD` (poin 7).

**10. phpMyAdmin: 'redirected you too many times' (ERR_TOO_MANY_REDIRECTS).** Cookie lama. Buka lewat jendela Incognito dan lewat tombol 'Buka phpMyAdmin' di hPanel, jangan mengetik alamat `auth-db...hstgr.io` langsung.

**11. Header `Content-Security-Policy` kita hilang di server hidup.** CDN Hostinger (`hcdn`) menggantinya menjadi `upgrade-insecure-requests` saja. Header lain (HSTS, `X-Frame-Options`, dst) tetap lewat. Solusinya tag `<meta http-equiv>` (lihat bagian Keamanan). Cara mengeceknya: `curl -I` ke alamat hidup dan bandingkan dengan yang dikirim aplikasi.

**12. File statis di `public/` (mis. `vh.html`) menjawab 404.** `proxy.ts` menulis ulang setiap path yang tidak ada di `matcher` menjadi `/id/...`. Yang lolos hanya `uploads`, `_next/static`, `_next/image`, `icon.png`, `logo-*.png`, `og.png`, `robots.txt`, `sitemap.xml`. Tambah file statis baru ke pengecualian matcher, atau taruh di `_next/static/`.

**13. Push ke `deploy` langsung tayang.** Hostinger deploy otomatis dalam 1 sampai 3 menit. Jangan push build yang belum diuji. Cara memastikan deploy sudah masuk: bandingkan nama file CSS berhash di halaman hidup dengan yang ada di build, atau cari teks baru di CSS/HTML hidup dengan `curl`.

**14. Dua app berarti dua alamat sementara.** Itu gratis. Untuk klien: satu domain, public di domain utama dan admin di subdomain (`admin.domain.com`), tanpa biaya tambahan. Setelah domain asli terhubung, ganti `SITE_URL` (dan `PUBLIC_SITE_URL` di admin) lalu deploy ulang.

**15. `PORT` tidak diisi di server.** Log menampilkan `0.0.0.0:3000`, dan pembungkus Hostinger (`lsnode.js`) yang mengarahkan lalu lintas. Jangan menulis port di kode.

**16. Cara mendiagnosis koneksi database di server yang tidak bisa dijangkau dari luar.** Pernah dipakai `diag.js` sementara sebagai pengganti aplikasi: server kecil yang, hanya dengan `?k=<token>` (hash token di kode), mencoba beberapa cara menyambung (host, IPv6, unix socket, tanpa nama database) dan melaporkan kode error tanpa mencetak password. Laporannya membedakan 'password salah' dari 'host salah' dalam satu kali deploy. Hapus lagi setelah selesai.

### B. iPhone dan tampilan HP

**17. Hero berhenti sekitar 100px sebelum dasar layar iPhone; bagian berikutnya mengintip.** `100svh` adalah tinggi dengan semua bilah browser terbuka, sedangkan di iPhone bilahnya melayang dan menciut. Sekarang `100lvh` (fallback `100vh`), teks dan penanda foto diberi padding bawah ekstra di layar <= 600px supaya tidak tertutup bilah, dan HP mendatar (`max-height: 520px`) punya tata letak ringkas. Emulasi desktop TIDAK bisa meniru bilah iOS: hasil akhir harus dilihat pemilik di HP asli.

**18. Foto hero mendatar terpotong di HP.** Hero penuh layar memakai `object-fit: cover`: foto 16:9 di layar 9:19 kehilangan sekitar 70% lebar. Bukan bug. Solusinya set foto berdiri terpisah (`heroImagesMobile`, lihat aturan bisnis 6).

**19. Cara melihat masalah tata letak HP tanpa perangkatnya.** Minta pemilik mengirim screenshot dari HP-nya (pemilik biasanya membuka lewat browser di dalam WhatsApp). Kalau perlu angka, taruh halaman ukur sementara yang menampilkan `innerHeight`, `visualViewport.height`, tinggi `100vh/svh/lvh/dvh`, dan `safe-area-inset` (taruh di `_next/static/`, lihat poin 12), minta pemilik membukanya, lalu hapus.

**20. `<picture>` dan preload ganda.** Gambar pertama dengan `fetchPriority="high"` membuat React menyisipkan `<link rel="preload">` untuk foto lebar, sehingga HP mengunduh dua foto. Slide yang punya versi HP tidak diberi `fetchPriority="high"`.

### C. Kode (Next 16, keamanan, data)

**21. `robots.txt` menulis `localhost:3000` di produksi.** Route metadata di-render saat build dengan `SITE_URL` bawaan. Diberi `export const dynamic = 'force-dynamic'` (`sitemap.ts` juga).

**22. CSP meta 'tidak bekerja': `frame-ancestors` masih ada di dalamnya.** Penyebabnya karakter BACKSPACE tak terlihat di dalam regex, hasil menulis file lewat skrip Python dengan `\b` di string biasa (Python mengubahnya jadi backspace). Fungsi terlihat benar di layar tapi tidak pernah cocok. Diketahui dari `od -c` dan dari menjalankan fungsinya langsung. Selalu uji fungsi hasil tulisan skrip, jangan hanya membacanya.

**23. Header internal tidak bisa dipalsukan.** `proxy.ts` selalu menimpa `x-nonce` dan `x-csp-meta` pada permintaan yang lewat matcher, jadi permintaan pengunjung yang memuat header itu tidak berpengaruh (sudah diuji).

**24. Loop pengalihan setelah logout di produksi.** Cookie `__Host-` hanya bisa ditimpa dengan atribut yang sama (`Secure`, `Path=/`). Menghapusnya harus set ulang dengan `maxAge: 0` dan atribut yang sama, dan `proxy.ts` tidak boleh mengalihkan `/login`.

**25. Uji form Server Action gagal 'diam-diam'.** Mengisi dan menekan tombol sebelum halaman selesai hydration membuat nilai hilang. Tambahkan jeda 1,5 sampai 2 detik setelah membuka halaman berformulir sebelum mengetik.

**26. Halaman `/?_rsc=...` (prefetch beranda Indonesia) menjawab 404.** Masalah lama, juga di server hidup, tidak terlihat pengunjung. Belum diperbaiki.

**27. Memilih kolom yang salah di uji.** Halaman Pengaturan punya DUA `input[name=email]` (email kontak perusahaan dan email login). Skrip uji harus menargetkan yang benar, dan lebih baik nama kolomnya dibuat unik di kode berikutnya.

### D. Lingkungan Windows dan Git Bash (jebakan alat)

**28. Git Bash mengubah argumen berawalan `/` menjadi path Windows** (`/` menjadi `C:/Program Files/Git/`). Untuk argumen yang berupa URL path atau path yang dikirim ke program Windows (Edge, Node), pakai `MSYS_NO_PATHCONV=1` dan `cygpath -m <path>` untuk mendapat bentuk `C:/...`.

**29. Python (Windows) dan Node tidak melihat `/tmp` milik Git Bash.** Simpan berkas kerja di folder scratchpad dengan path Windows lengkap.

**30. Heredoc tanpa kutip (`<<EOF`) memakan backtick dan `$(...)`.** Skrip JavaScript berisi template string jadi rusak diam-diam (fungsi kosong). Pakai `<<'EOF'` (dengan kutip) atau tulis berkas dengan alat Write.

**31. Menulis kode lewat string Python.** `\b` menjadi backspace, `\n` menjadi baris baru sungguhan di tengah kode (`join('\n')` rusak). Susun garis miring dengan `chr(92)`, atau tulis berkas apa adanya lewat Write, lalu periksa dengan `grep -P '[\x00-\x08]'`.

**32. `assemble.mjs` gagal `EPERM` menghapus `out/`.** Server uji masih memakai folder itu. Hentikan proses di port 3100 dan 3101 dulu. Kalau tidak, uji berikutnya diam-diam membaca build LAMA (pernah terjadi: tombol tampak tidak diperbaiki padahal build belum diganti).

**33. Edge headless untuk uji browser.** Port debug (`--remote-debugging-port`) bentrok kalau proses lama masih hidup: pakai port berbeda per skrip dan matikan sisa `msedge`. Permintaan pertama ke server yang baru menyala sering memberi angka aneh (hydration, pemanasan): ulangi sebelum menyimpulkan.

**34. OneDrive menyinkronkan folder proyek.** Database lokal (MariaDB portabel) sengaja di `%LOCALAPPDATA%`. Folder `deploy/` (gitignored) berisi rahasia dan tetap ikut tersinkron ke cloud: hapus `admin.env`, `COPY-PASTE.txt`, dan sejenisnya begitu selesai dipakai.

### E. Cara menguji sebelum push (urutan yang terbukti)

1. `npm run typecheck` dari root (menjalankan ketiga paket).
2. Salin berkas yang berubah ke `enjaz-deploy/src` (termasuk berkas BARU, `git diff` saja tidak menampilkannya, pakai `git status --porcelain`), build kedua app, `node assemble.mjs`.
3. Nyalakan hasil rakitan (`out/public`, `out/admin`) dengan database lokal kosong dan `SEED_SAMPLE=1`, uji di Edge lewat CDP: alur admin, tampilan public tiga bahasa, CSP, dan regresi. Untuk CSP, uji lewat proksi yang mengganti header seperti Hostinger.
4. Kalau ada bug di alat uji, buktikan bahwa uji itu bisa mendeteksi masalahnya (kontrol tanpa CSP, injeksi yang benar-benar berjalan di halaman tanpa kebijakan) sebelum percaya hasil hijau.
5. `npm run check:public` di repo utama, lalu `node branch.mjs`, periksa isi cabang (tidak ada `diag.js`, `vh.*`, `.env`), commit dan push `main` lalu `deploy`.
6. Tunggu deploy, lalu verifikasi di server hidup dengan `curl` (status, isi, CSS berhash).

Skrip pengemas (`assemble.mjs`, `branch.mjs`) ada di `%USERPROFILE%\enjaz-deploy` DI LUAR repo, dan skrip uji browser hanya ada di folder sementara. **Keduanya belum masuk git.** Kalau laptop hilang, alur ini hilang. Sebaiknya dipindah ke `tools/` di repo.

### F. Peta hPanel (tempat menemukan sesuatu)

- Membuat app: **Website > Buat website > Node.js Apps > Lanjutkan dengan GitHub**, pilih repo, atur branch, Root directory, preset, build, environment, lalu Deploy. Alamat sementara app baru tertulis di layar itu ('Deploy ke ...').
- Di dalam app (menu kiri): **Dashboard**, **Penempatan** (riwayat deploy, klik baris untuk log build; tombol pengaturan membuka 'Pengaturan dan deploy ulang' tempat mengubah branch, Root directory, preset, build, dan environment, lalu 'Simpan dan deploy ulang'), **Variabel environment**, **Log runtime**, **Domain** ('Hubungkan domain').
- Database: **Database > Manajemen** (buat database dan user, daftar), **phpMyAdmin** (tombol 'Buka phpMyAdmin', masuk otomatis), **Remote MySQL** (daftar IP yang diizinkan harus KOSONG).
- Kotak pencarian di menu kiri MENYARING menu (kata 'mana' pernah menyembunyikan menu Node.js). Kosongkan kalau menu tampak tidak lengkap.
- Ikon **JS** di daftar Website menandakan app Node.js.

### G. Cara bekerja dengan pemilik proyek

- Beri instruksi **satu langkah per pesan**, bahasa Indonesia sederhana, nilai yang harus ditempel dalam blok kode, lalu minta screenshot. Penjelasan panjang berlapis membuat langkah terlewat (ini penyebab utama deploy pertama memakan puluhan putaran).
- Screenshot pemilik masuk sebagai berkas di `%USERPROFILE%\Downloads\Cuplikan layar ...png`. Kalau pesan datang tanpa isi, cek berkas terbaru di folder itu.
- Aturan global: jangan setuju hanya untuk setuju, beri nilai 0 sampai 10 pada ide, katakan 'itu salah' kalau memang salah, dan akui kalau tidak yakin.
- Aku tidak boleh mengetik password ke form web. Password boleh dibagikan di chat atas izin pemilik, tapi sebaiknya diganti setelahnya. Nilai yang harus ditempel ke form, siapkan dalam berkas atau clipboard agar pemilik tinggal menempel.
- Push ke GitHub sudah diizinkan pemilik tanpa bertanya, tapi uji lokal dulu (poin E). Pekerjaan pengemasan berada di folder terpisah, bukan di proyek utama.
