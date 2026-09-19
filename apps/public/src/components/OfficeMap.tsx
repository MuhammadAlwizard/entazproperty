import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import { getDict, type Locale } from '@/i18n';

/**
 * Office location in the footer, under the logo. The admin edits the address (and optionally a Google Maps link)
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
    <div id="lokasi" className="footer-map">
      <h2>{d.title}</h2>
      <iframe
        title={d.mapTitle}
        src={`https://www.google.com/maps?q=${query}&output=embed&hl=${locale}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a className="text-link" href={link} target="_blank" rel="noopener noreferrer">
        {d.openMaps} <ArrowSquareOut size={16} aria-hidden />
      </a>
    </div>
  );
}
