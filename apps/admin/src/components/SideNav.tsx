'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, ChatCircleText, ClockCounterClockwise, GearSix, House, Storefront } from '@phosphor-icons/react';
import { fill } from '@/i18n/format';
import { useI18n } from '@/i18n/client';

const ITEMS = [
  { href: '/', key: 'dashboard', icon: House },
  { href: '/bookings', key: 'bookings', icon: CalendarCheck },
  { href: '/listings', key: 'listings', icon: Storefront },
  { href: '/testimonials', key: 'testimonials', icon: ChatCircleText },
  { href: '/activity', key: 'activity', icon: ClockCounterClockwise },
  { href: '/settings', key: 'settings', icon: GearSix },
] as const;

/** `bookingsToCheck`: new requests plus transfer screenshots waiting for the admin, shown as a count next to Booking. */
export function SideNav({ bookingsToCheck = 0 }: { bookingsToCheck?: number }) {
  const path = usePathname();
  const { d } = useI18n();
  return (
    <nav aria-label={d.nav.aria} className="sidenav">
      {ITEMS.map(({ href, key, icon: Icon }) => {
        const active = href === '/' ? path === '/' : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={active ? 'active' : ''}>
            <Icon size={20} weight={active ? 'fill' : 'regular'} aria-hidden />
            {d.nav[key]}
            {key === 'bookings' && bookingsToCheck > 0 && (
              <span className="nav-count" aria-label={fill(d.bookings.badge, { n: bookingsToCheck })}>{bookingsToCheck}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
