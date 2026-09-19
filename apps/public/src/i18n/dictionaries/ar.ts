import type { Dict } from '../types';

// Modern Standard Arabic (the form understood across the Arab world). Right-to-left.
export const ar: Dict = {
  meta: {
    title: 'PT Enjaz Instan Properti | تأجير الفلل والسيارات والدراجات النارية والرحلات',
    description: 'تأجير فلل بمواقع واضحة، وسيارات ودراجات نارية، وباقات رحلات سياحية من PT Enjaz Instan Properti.',
  },
  skip: 'انتقل إلى المحتوى',
  nav: {
    villa: 'الفلل', mobil: 'السيارات', motor: 'الدراجات النارية', tour: 'الرحلات السياحية', testimoni: 'آراء العملاء',
    menu: 'فتح القائمة', mainMenu: 'القائمة الرئيسية', mobileMenu: 'القائمة الرئيسية (الجوال)',
    brand: 'PT Enjaz Instan Properti، الصفحة الرئيسية', whatsapp: 'تواصل عبر واتساب', language: 'اللغة',
  },
  hero: {
    line1: 'فلل ومركبات ورحلات.', line2: 'في مكان واحد.',
    text: 'استأجر فلل بمواقع واضحة ومركبات جاهزة للانطلاق وباقات سياحية من PT Enjaz Instan Properti.',
    cta: 'اختر الخدمة', groupLabel: 'اختيار صورة الخلفية', photoLabel: 'عرض الصورة {n} من {total}',
  },
  services: { title: 'اختر الخدمة', note: 'افتح أي خدمة لتشاهد جميع العروض ومواقعها وأسعارها.', soon: 'قريبًا', from: 'ابتداءً من', other: 'شاهد الخدمات الأخرى' },
  categories: {
    villa: {
      name: 'الفلل', title: 'تأجير الفلل',
      description: 'قائمة فلل للإيجار مع الموقع والسعة والمرافق والسعر لكل ليلة من PT Enjaz Instan Properti.',
      intro: 'تعرض كل فيلا موقعها، ويمكنك التحقق منه على الخريطة قبل الحجز.',
      empty: 'نعمل حاليًا على تجهيز هذه الخدمة. يرجى المراجعة لاحقًا.',
    },
    mobil: {
      name: 'السيارات', title: 'تأجير السيارات',
      description: 'تأجير سيارات بدون سائق أو مع سائق بأسعار يومية واضحة من PT Enjaz Instan Properti.',
      intro: 'اختر القيادة الذاتية أو مع سائق بحسب مسارك ومدة رحلتك.',
      empty: 'نعمل حاليًا على تجهيز هذه الخدمة. يرجى المراجعة لاحقًا.',
    },
    motor: {
      name: 'الدراجات النارية', title: 'تأجير الدراجات النارية',
      description: 'تأجير دراجات نارية يوميًا للتنقل داخل المدينة وزيارة الأماكن السياحية بأسعار يومية من PT Enjaz Instan Properti.',
      intro: 'دراجات يومية للشوارع الضيقة والأماكن التي يصعب على السيارات الوصول إليها.',
      empty: 'نعمل حاليًا على تجهيز هذه الخدمة. يرجى المراجعة لاحقًا.',
    },
    tour: {
      name: 'الرحلات السياحية', title: 'باقات السفر والرحلات',
      description: 'باقات سفر ورحلات ببرنامج واضح، مع ترتيب المواصلات والمرشد، من PT Enjaz Instan Properti.',
      intro: 'البرنامج جاهز مسبقًا. المواصلات والمرشد وتذاكر الدخول مرتبة لك.',
      empty: 'نعمل حاليًا على تجهيز هذه الخدمة. يرجى المراجعة لاحقًا.',
    },
  },
  units: { malam: 'ليلة', hari: 'يوم', orang: 'شخص' },
  plural: {
    villa: { one: 'فيلا', two: 'فيلتان', few: 'فلل', many: 'فيلا', other: 'فلل' },
    mobil: { one: 'سيارة', two: 'سيارتان', few: 'سيارات', many: 'سيارة', other: 'سيارات' },
    motor: { one: 'دراجة نارية', two: 'دراجتان ناريتان', few: 'دراجات نارية', many: 'دراجة نارية', other: 'دراجات نارية' },
    paket: { one: 'باقة', two: 'باقتان', few: 'باقات', many: 'باقة', other: 'باقات' },
    kamar: { one: 'غرفة نوم', two: 'غرفتا نوم', few: 'غرف نوم', many: 'غرفة نوم', other: 'غرف نوم' },
    tamu: { one: 'ضيف', two: 'ضيفان', few: 'ضيوف', many: 'ضيفًا', other: 'ضيوف' },
    kursi: { one: 'مقعد', two: 'مقعدان', few: 'مقاعد', many: 'مقعدًا', other: 'مقاعد' },
    cc: { one: 'cc', other: 'cc' },
    orang: { one: 'شخص', two: 'شخصان', few: 'أشخاص', many: 'شخصًا', other: 'أشخاص' },
  },
  values: { Matic: 'أوتوماتيك', Manual: 'يدوي', 'Lepas kunci': 'بدون سائق', 'Dengan sopir': 'مع سائق', Keduanya: 'بدون سائق أو مع سائق' },
  testimonials: { title: 'ماذا يقول عملاؤنا', region: 'آراء العملاء، تتوقف عند التمرير أو التركيز', stars: '{n} من 5 نجوم' },
  office: { title: 'موقع المكتب', openMaps: 'افتح في خرائط Google', mapTitle: 'خريطة موقع مكتب PT Enjaz Instan Properti' },
  detail: {
    crumbs: 'مسار التنقل', home: 'الرئيسية', specs: 'المواصفات', amenities: 'المرافق', included: 'ما يشمله السعر',
    location: 'الموقع', openMaps: 'افتح في خرائط Google', mapTitle: 'خريطة موقع {title}', photoAlt: '{title}، صورة {n}',
    morePhotos: 'صور أخرى', noPhoto: 'الصورة غير متاحة', aside: 'السعر والحجز', book: 'احجز', bookRest: ' عبر واتساب',
    contactSoon: 'ستتوفر وسيلة التواصل للحجز قريبًا.',
    note: 'يتم تأكيد التوافر والتواريخ عبر المحادثة قبل الدفع.',
    autoDescription: (label, where, price, unit) => `${label}${where ? ` في ${where}` : ''} من PT Enjaz Instan Properti، بسعر ${price} لكل ${unit}.`,
    priceRange: (price, unit) => `${price} لكل ${unit}`,
  },
  footer: { services: 'الخدمات', contact: 'التواصل', contactSoon: 'ستُضاف معلومات التواصل قريبًا.', language: 'اللغة' },
  notFound: { title: 'الصفحة غير موجودة', text: 'ربما لم يعد العرض الذي تبحث عنه متاحًا أو تغيّر عنوانه.', back: 'العودة إلى الرئيسية' },
  wa: {
    general: 'مرحبًا، أودّ الاستفسار عن خدمات PT Enjaz Instan Properti.',
    interested: (title, where, url) => `مرحبًا، أودّ الاستفسار عن ${title}${where ? ` (${where})` : ''}. ${url}`,
  },
};
