// Text that the shared business rules produce for people (validation errors, password rules).
// The rules live in core so the admin form and any future import path enforce exactly the same thing, but the WORDS
// belong to the app that shows them: the admin panel passes its own translated set (see apps/admin/src/i18n).
// Indonesian is the built-in default, so callers that pass nothing keep working.
//
// Templates use {name} placeholders, filled by fillMessage().

export type ValidationMessages = {
  chooseCategory: string;
  titleMin: string;
  titleMax: string;
  priceNumber: string;
  priceTooBig: string;
  /** {label} = the category's location label */
  locationRequired: string;
  locationMax: string;
  addressMax: string;
  mapsHttps: string;
  mapsTooLong: string;
  summaryMax: string;
  descriptionMax: string;
  /** {max} */
  imagesMax: string;
  imagesInvalid: string;
  /** {label} = the field's label */
  fieldNumber: string;
  fieldInvalid: string;
  fieldTooLong: string;
  /** {max} */
  maxChars: string;
  nameMin: string;
  nameMax: string;
  quoteMin: string;
  quoteMax: string;
  originMax: string;
  photoInvalid: string;
  ratingRange: string;
};

export type PasswordMessages = {
  tooShort: string;
  tooLong: string;
  containsEmail: string;
  tooCommon: string;
  tooMonotone: string;
};

export type UploadMessages = { tooLarge: string; badFormat: string };

export type BookingMessages = {
  nameMin: string;
  nameMax: string;
  phoneInvalid: string;
  emailInvalid: string;
  dateInvalid: string;
  datePast: string;
  /** {days} */
  dateTooFar: string;
  /** Villa: check-out must be after check-in. Vehicles: return cannot be before pickup. */
  endBeforeStart: string;
  /** {max} */
  rangeTooLong: string;
  guestsInvalid: string;
  /** {min} */
  guestsMin: string;
  noteMax: string;
  tooMany: string;
  /** The dates clash with a confirmed booking of the same listing */
  taken: string;
};

export type InvoiceMessages = {
  priceNumber: string;
  unitsNumber: string;
  /** {max} */
  extrasMax: string;
  extraLabel: string;
  extraAmount: string;
  totalZero: string;
};

export const INVOICE_ID: InvoiceMessages = {
  priceNumber: 'Isi harga dengan angka.',
  unitsNumber: 'Isi jumlah dengan angka 1 sampai 999.',
  extrasMax: 'Maksimal {max} biaya tambahan.',
  extraLabel: 'Tulis nama biayanya.',
  extraAmount: 'Isi nominal dengan angka. Pakai tanda minus untuk potongan harga.',
  totalZero: 'Total tagihan tidak boleh nol.',
};

export const BOOKING_ID: BookingMessages = {
  nameMin: 'Nama minimal 2 karakter.',
  nameMax: 'Nama maksimal 80 karakter.',
  phoneInvalid: 'Isi nomor WhatsApp yang valid, contoh 0812 3456 7890.',
  emailInvalid: 'Format email tidak valid.',
  dateInvalid: 'Pilih tanggal.',
  datePast: 'Tanggal tidak boleh sebelum hari ini.',
  dateTooFar: 'Pemesanan paling jauh {days} hari dari sekarang.',
  endBeforeStart: 'Tanggal selesai harus setelah tanggal mulai.',
  rangeTooLong: 'Maksimal {max} hari per pemesanan. Untuk lebih lama, hubungi kami lewat WhatsApp.',
  guestsInvalid: 'Isi jumlah orang dengan angka 1 sampai 99.',
  guestsMin: 'Paket ini minimal {min} orang.',
  noteMax: 'Catatan maksimal 500 karakter.',
  tooMany: 'Terlalu banyak pemesanan dari perangkat atau nomor ini. Coba lagi nanti atau hubungi kami lewat WhatsApp.',
  taken: 'Tanggal ini sudah terisi. Pilih tanggal lain atau hubungi kami lewat WhatsApp.',
};

export const VALIDATION_ID: ValidationMessages = {
  chooseCategory: 'Pilih kategori.',
  titleMin: 'Nama listing minimal 3 karakter.',
  titleMax: 'Nama listing maksimal 120 karakter.',
  priceNumber: 'Isi harga dengan angka.',
  priceTooBig: 'Harga terlalu besar.',
  locationRequired: '{label} wajib diisi.',
  locationMax: 'Lokasi maksimal 120 karakter.',
  addressMax: 'Alamat maksimal 300 karakter.',
  mapsHttps: 'Link peta harus diawali https://',
  mapsTooLong: 'Link peta terlalu panjang.',
  summaryMax: 'Ringkasan maksimal 200 karakter.',
  descriptionMax: 'Deskripsi maksimal 5000 karakter.',
  imagesMax: 'Maksimal {max} foto.',
  imagesInvalid: 'Ada foto dengan alamat tidak valid.',
  fieldNumber: '{label} harus berupa angka.',
  fieldInvalid: '{label} tidak valid.',
  fieldTooLong: '{label} terlalu panjang.',
  maxChars: 'Maksimal {max} karakter.',
  nameMin: 'Nama minimal 2 karakter.',
  nameMax: 'Nama maksimal 80 karakter.',
  quoteMin: 'Isi testimoni minimal 10 karakter.',
  quoteMax: 'Isi testimoni maksimal 600 karakter.',
  originMax: 'Keterangan maksimal 100 karakter.',
  photoInvalid: 'Alamat foto tidak valid.',
  ratingRange: 'Rating 1 sampai 5.',
};

export const PASSWORD_ID: PasswordMessages = {
  tooShort: 'Password minimal 12 karakter.',
  tooLong: 'Password terlalu panjang.',
  containsEmail: 'Password tidak boleh memuat bagian dari email.',
  tooCommon: 'Password terlalu mudah ditebak.',
  tooMonotone: 'Password terlalu monoton, pakai lebih banyak variasi karakter.',
};

export const UPLOAD_ID: UploadMessages = {
  tooLarge: 'Ukuran foto maksimal 5 MB.',
  badFormat: 'Format foto harus JPG, PNG, atau WebP.',
};

/** Fills {name} placeholders. A placeholder without a value is left as it is. */
export function fillMessage(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in params ? String(params[key]) : whole));
}
