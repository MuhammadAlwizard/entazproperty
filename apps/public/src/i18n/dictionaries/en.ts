import type { Dict } from '../types';

// United States English.
export const en: Dict = {
  meta: {
    title: 'PT Enjaz Instan Properti | Villa, Car, Motorbike and Tour Rentals',
    description: 'Rent villas with clear locations, cars, motorbikes, and travel tour packages from PT Enjaz Instan Properti.',
  },
  skip: 'Skip to content',
  nav: {
    villa: 'Villas', mobil: 'Cars', motor: 'Motorbikes', tour: 'Travel & Tours', testimoni: 'Reviews',
    menu: 'Open menu', mainMenu: 'Main menu', mobileMenu: 'Main menu (mobile)',
    brand: 'PT Enjaz Instan Properti, home', whatsapp: 'Chat on WhatsApp', language: 'Language',
  },
  hero: {
    line1: 'Villas, vehicles, and tours.', line2: 'One place.',
    text: 'Rent villas with clear locations, ready-to-go vehicles, and travel packages from PT Enjaz Instan Properti.',
    cta: 'Choose a service', groupLabel: 'Choose background photo', photoLabel: 'Show photo {n} of {total}',
  },
  services: { title: 'Choose a service', note: 'Open a service to see every listing, its location, and its price.', soon: 'Coming soon', from: 'from' },
  categories: {
    villa: {
      name: 'Villas', title: 'Villa Rentals',
      description: 'Villas for rent with location, capacity, amenities, and price per night from PT Enjaz Instan Properti.',
      intro: 'Every villa lists its location, which you can check on the map before you book.',
      empty: 'There are no listings in this category yet. Please check back soon.',
    },
    mobil: {
      name: 'Cars', title: 'Car Rentals',
      description: 'Self-drive or chauffeured car rentals with clear daily prices from PT Enjaz Instan Properti.',
      intro: 'Choose self-drive or with a driver, to fit your route and trip length.',
      empty: 'There are no listings in this category yet. Please check back soon.',
    },
    motor: {
      name: 'Motorbikes', title: 'Motorbike Rentals',
      description: 'Daily motorbike rentals for getting around town and reaching tourist spots, priced per day, from PT Enjaz Instan Properti.',
      intro: 'Daily motorbikes for narrow roads and places cars struggle to reach.',
      empty: 'There are no listings in this category yet. Please check back soon.',
    },
    tour: {
      name: 'Travel & Tours', title: 'Travel and Tour Packages',
      description: 'Travel and tour packages with a clear itinerary, with transport and guide arranged, from PT Enjaz Instan Properti.',
      intro: 'The itinerary is already planned. Transport, guide, and entrance tickets are arranged.',
      empty: 'There are no listings in this category yet. Please check back soon.',
    },
  },
  units: { malam: 'night', hari: 'day', orang: 'person' },
  plural: {
    villa: { one: 'villa', other: 'villas' }, mobil: { one: 'car', other: 'cars' }, motor: { one: 'motorbike', other: 'motorbikes' },
    paket: { one: 'package', other: 'packages' }, kamar: { one: 'bedroom', other: 'bedrooms' }, tamu: { one: 'guest', other: 'guests' },
    kursi: { one: 'seat', other: 'seats' }, cc: { one: 'cc', other: 'cc' }, orang: { one: 'person', other: 'people' },
  },
  values: { Matic: 'Automatic', Manual: 'Manual', 'Lepas kunci': 'Self-drive', 'Dengan sopir': 'With driver', Keduanya: 'Self-drive or with driver' },
  testimonials: { title: 'What our customers say', region: 'Customer reviews, pauses on hover or focus', stars: '{n} out of 5 stars' },
  detail: {
    crumbs: 'Breadcrumb', home: 'Home', specs: 'Specifications', amenities: 'Amenities', included: 'Included',
    location: 'Location', openMaps: 'Open in Google Maps', mapTitle: 'Map of {title}', photoAlt: '{title}, photo {n}',
    morePhotos: 'More photos', noPhoto: 'photo not available', aside: 'Price and booking', book: 'Book', bookRest: ' via WhatsApp',
    contactSoon: 'Booking contact details will be available soon.',
    note: 'Availability and dates are confirmed over chat before payment.',
    autoDescription: (label, where, price, unit) => `${label}${where ? ` in ${where}` : ''} from PT Enjaz Instan Properti, ${price} per ${unit}.`,
    priceRange: (price, unit) => `${price} per ${unit}`,
  },
  footer: { services: 'Services', contact: 'Contact', contactSoon: 'Contact details coming soon.', language: 'Language' },
  notFound: { title: 'Page not found', text: 'The listing you are looking for may no longer be available or its address has changed.', back: 'Back to home' },
  wa: {
    general: "Hello, I'd like to ask about PT Enjaz Instan Properti's services.",
    interested: (title, where, url) => `Hello, I'm interested in ${title}${where ? ` (${where})` : ''}. ${url}`,
  },
};
