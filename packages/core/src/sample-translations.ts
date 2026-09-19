import type { ListingTranslations, TestimonialTranslations } from './types';

// English (US) and Modern Standard Arabic versions of the SAMPLE content in seed.ts.
// Like the sample data itself, these exist to preview the design. Real content is translated
// by the admin in the panel. Keys are the Indonesian titles / names used in seed.ts.

export const SAMPLE_LISTING_TRANSLATIONS: Record<string, ListingTranslations> = {
  'Villa Kamboja': {
    en: {
      title: 'Kamboja Villa', location: 'Lembang, West Bandung',
      summary: 'A cool villa with a large garden and an open family living room.',
      description: "Ideal for large families. Fully equipped kitchen, barbecue area, and parking for three cars. The mountain air of Lembang is fresh from the first hour of the morning.",
      meta: { fasilitas: 'Garden, Kitchen, Barbecue area, Ample parking' },
    },
    ar: {
      title: 'فيلا كامبوجا', location: 'ليمبانغ، باندونغ الغربية',
      summary: 'فيلا منعشة بحديقة واسعة وصالة عائلية مفتوحة.',
      description: 'مثالية للعائلات الكبيرة. مطبخ مجهز بالكامل ومنطقة للشواء ومواقف تتسع لثلاث سيارات. ويمتاز هواء جبال ليمبانغ بالانتعاش منذ الصباح الباكر.',
      meta: { fasilitas: 'حديقة، مطبخ، منطقة شواء، مواقف واسعة' },
    },
  },
  'Villa Sawah Terrace': {
    en: {
      title: 'Sawah Terrace Villa', location: 'Ubud, Gianyar, Bali',
      summary: 'Two bedrooms facing the rice fields, five minutes from central Ubud.',
      description: 'The balcony overlooks terraced rice fields. Breakfast can be ordered through the host.',
      meta: { fasilitas: 'Swimming pool, Balcony, Breakfast' },
    },
    ar: {
      title: 'فيلا ساواه تيراس', location: 'أوبود، جيانيار، بالي',
      summary: 'غرفتا نوم تطلان على حقول الأرز، وعلى بعد خمس دقائق من وسط أوبود.',
      description: 'تطل الشرفة على حقول الأرز المدرّجة. ويمكن طلب الإفطار عبر مسؤول الفيلا.',
      meta: { fasilitas: 'مسبح، شرفة، إفطار' },
    },
  },
  'Villa Puncak Larasati': {
    en: {
      title: 'Puncak Larasati Villa', location: 'Cisarua, Bogor',
      summary: 'Four bedrooms for groups, close to the tea plantations.',
      description: 'A spacious central lounge for gatherings. Every bathroom has a water heater.',
      meta: { fasilitas: 'Water heater, Karaoke, Ample parking' },
    },
    ar: {
      title: 'فيلا بونتشاك لاراساتي', location: 'سيساروا، بوغور',
      summary: 'أربع غرف نوم للمجموعات، بالقرب من مزارع الشاي.',
      description: 'صالة مركزية واسعة للتجمعات. وتتوفر سخانات مياه في جميع الحمامات.',
      meta: { fasilitas: 'سخان مياه، كاريوكي، مواقف واسعة' },
    },
  },
  'Villa Batu Asri': {
    en: {
      title: 'Batu Asri Villa', location: 'Batu, Malang',
      summary: "Three bedrooms, a short walk from Batu's tourist center.",
      description: 'The front yard fits two cars. There is a lounge with a projector.',
      meta: { fasilitas: 'Projector, Kitchen, Yard' },
    },
    ar: {
      title: 'فيلا باتو أسري', location: 'باتو، مالانغ',
      summary: 'ثلاث غرف نوم، على مسافة قصيرة سيرًا من مركز باتو السياحي.',
      description: 'تتسع ساحة الفيلا الأمامية لسيارتين. وتضم صالة استرخاء مزودة بجهاز عرض.',
      meta: { fasilitas: 'جهاز عرض، مطبخ، ساحة' },
    },
  },

  'Toyota Avanza 2022': {
    en: { location: 'Bandung', summary: 'An economical MPV for small families.' },
    ar: { location: 'باندونغ', summary: 'سيارة عائلية اقتصادية للعائلات الصغيرة.' },
  },
  'Honda Brio Satya': {
    en: { location: 'Bandung', summary: 'Compact for city driving.' },
    ar: { location: 'باندونغ', summary: 'سيارة صغيرة مناسبة للتنقل داخل المدينة.' },
  },
  'Mitsubishi Xpander': {
    en: { location: 'Bandung', summary: 'Seven seats with generous luggage space.' },
    ar: { location: 'باندونغ', summary: 'سبعة مقاعد ومساحة أمتعة واسعة.' },
  },
  'Toyota Innova Reborn': {
    en: { location: 'South Jakarta', summary: 'Comfortable for long trips with a driver.' },
    ar: { location: 'جنوب جاكرتا', summary: 'مريحة للرحلات الطويلة مع سائق.' },
  },
  'Daihatsu Sigra': {
    en: { location: 'Bandung', summary: 'A budget-friendly choice for small groups.' },
    ar: { location: 'باندونغ', summary: 'خيار اقتصادي للمجموعات الصغيرة.' },
  },

  'Honda Vario 125': {
    en: { location: 'Bandung', summary: 'A light automatic scooter, fuel efficient.' },
    ar: { location: 'باندونغ', summary: 'دراجة أوتوماتيكية خفيفة وموفرة للوقود.' },
  },
  'Yamaha NMAX': {
    en: { location: 'Bandung', summary: 'Comfortable for long rides with a passenger.' },
    ar: { location: 'باندونغ', summary: 'مريحة للمسافات الطويلة مع راكب خلفي.' },
  },
  'Honda Scoopy': {
    en: { location: 'Bandung', summary: 'Small and nimble in narrow streets.' },
    ar: { location: 'باندونغ', summary: 'صغيرة وسريعة الحركة في الشوارع الضيقة.' },
  },
  'Honda PCX 160': {
    en: { location: 'Bali', summary: 'Stable for riding around the island.' },
    ar: { location: 'بالي', summary: 'ثابتة ومريحة للتجول في أنحاء الجزيرة.' },
  },
  'Kawasaki KLX 150': {
    en: { location: 'Malang', summary: 'A trail bike for routes to nature attractions.' },
    ar: { location: 'مالانغ', summary: 'دراجة طرق وعرة للوصول إلى الوجهات الطبيعية.' },
  },

  'Bromo Sunrise Open Trip': {
    en: {
      location: 'Bromo, East Java',
      summary: 'Jeep, guide, and entrance tickets included.',
      description: 'Depart before dawn from Malang, watch the sunrise from Penanjakan, then cross the sea of sand to the crater.',
      meta: { durasi: '2 days 1 night', termasuk: 'Jeep, Guide, Entrance tickets, Accommodation' },
    },
    ar: {
      title: 'رحلة شروق الشمس في برومو', location: 'برومو، جاوة الشرقية',
      summary: 'تشمل سيارة الجيب والمرشد وتذاكر الدخول.',
      description: 'ننطلق قبل الفجر من مالانغ، ونشاهد شروق الشمس من بيناجانجان، ثم نعبر بحر الرمال إلى فوهة البركان.',
      meta: { durasi: 'يومان وليلة واحدة', termasuk: 'سيارة جيب، مرشد، تذاكر الدخول، الإقامة' },
    },
  },
  'Bali Timur dan Nusa Penida': {
    en: {
      title: 'East Bali and Nusa Penida', location: 'Bali',
      summary: 'Four days around East Bali, with a crossing to Nusa Penida.',
      description: 'A relaxed itinerary with plenty of time at each stop. We arrange the crossing and accommodation.',
      meta: { durasi: '4 days 3 nights', termasuk: 'Hotel, Transport, Boat crossing, Guide' },
    },
    ar: {
      title: 'شرق بالي ونوسا بينيدا', location: 'بالي',
      summary: 'أربعة أيام في شرق بالي مع عبور بحري إلى نوسا بينيدا.',
      description: 'برنامج مريح يتيح وقتًا كافيًا في كل محطة. نتولى ترتيب العبور البحري والإقامة.',
      meta: { durasi: '4 أيام و3 ليالٍ', termasuk: 'فندق، مواصلات، العبور بالقارب، مرشد' },
    },
  },
  'Labuan Bajo Sailing Trip': {
    en: {
      location: 'Labuan Bajo, East Nusa Tenggara',
      summary: 'Three days on a boat, stopping at Padar Island and Komodo.',
      description: 'A cabin on the boat, three meals a day, and snorkeling at Pink Beach.',
      meta: { durasi: '3 days 2 nights', termasuk: 'Boat, Meals, Snorkeling gear, National park tickets' },
    },
    ar: {
      title: 'رحلة إبحار في لابوان باجو', location: 'لابوان باجو، نوسا تنغارا الشرقية',
      summary: 'ثلاثة أيام على متن قارب مع التوقف عند جزيرة بادار وكومودو.',
      description: 'مقصورة على القارب، وثلاث وجبات يوميًا، والغوص السطحي عند الشاطئ الوردي.',
      meta: { durasi: '3 أيام وليلتان', termasuk: 'قارب، وجبات، معدات غوص سطحي، تذاكر المتنزه الوطني' },
    },
  },
};

export const SAMPLE_TESTIMONIAL_TRANSLATIONS: Record<string, TestimonialTranslations> = {
  'Rina Kusumawati': {
    en: { origin: 'Rented Kamboja Villa, Lembang', quote: 'The address and map were clear, so our group never got lost. The villa matched the photos and the host replied quickly.' },
    ar: { origin: 'استئجار فيلا كامبوجا، ليمبانغ', quote: 'كان العنوان والخريطة واضحين، فلم تضل مجموعتنا الطريق. الفيلا مطابقة للصور وردّ المشرف بسرعة.' },
  },
  'Dimas Prakoso': {
    en: { origin: 'Rented Toyota Avanza, Bandung', quote: 'The car was clean and the handover was quick. The price matched what was listed, with no extra fees on the spot.' },
    ar: { origin: 'استئجار تويوتا أفانزا، باندونغ', quote: 'كانت السيارة نظيفة وتم التسليم بسرعة. والسعر مطابق لما هو مكتوب، دون أي رسوم إضافية في الموقع.' },
  },
  'Nadia Safitri': {
    en: { origin: 'Bromo Sunrise Open Trip', quote: 'The guide was patient and the schedule was on time. We caught the sunrise without the crowds.' },
    ar: { origin: 'رحلة شروق الشمس في برومو', quote: 'كان المرشد صبورًا والجدول دقيقًا في مواعيده. شاهدنا الشروق دون زحام.' },
  },
  'Hendra Wijaya': {
    en: { origin: 'Rented Yamaha NMAX, Bandung', quote: 'The bike was well maintained and a helmet was provided. Returning it was easy, just let them know by chat.' },
    ar: { origin: 'استئجار ياماها NMAX، باندونغ', quote: 'كانت الدراجة بحالة جيدة وتم توفير خوذة. وكان الإرجاع سهلًا، يكفي إبلاغهم عبر المحادثة.' },
  },
};
