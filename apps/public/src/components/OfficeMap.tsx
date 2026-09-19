import { ArrowSquareOut, MapPin } from '@phosphor-icons/react/dist/ssr';
import { getDict, type Locale } from '@/i18n';

/**
 * Office location at the bottom of the home page. The admin edits the address (and optionally a Google Maps link)
 * in Settings; nothing is shown until an address exists. Same idea as the villa page map: an embedded Google Map
 * (only Google may be framed, see proxy.ts) plus a link that opens Google Maps itself.
 */
export function OfficeMap({ address, mapsUrl, locale }: { address: string; mapsUrl: string; locale: Locale }) {
  const text = address.trim();
  if (!text) return null;
  const d = getDict(locale).office;
  const query = encodeURIComponent(text.split(/\s*\n+\s*/).join(', '));
  const link = mapsUrl || `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <section id="lokasi" className="sec-office" aria-labelledby="lokasi-title">
      <div className="sec office-grid">
        <div className="office-info">
          <h2 id="lokasi-title">{d.title}</h2>
          <p className="office-address">
            <MapPin size={22} weight="fill" aria-hidden />
            <span>{text}</span>
          </p>
          <a className="text-link" href={link} target="_blank" rel="noopener noreferrer">
            {d.openMaps} <ArrowSquareOut size={16} aria-hidden className="flip-rtl" />
          </a>
        </div>
        <iframe
          title={d.mapTitle}
          src={`https://www.google.com/maps?q=${query}&output=embed&hl=${locale}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}
