'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChatCircleText, ClockCounterClockwise, GearSix, House, Storefront } from '@phosphor-icons/react';
import { useI18n } from '@/i18n/client';

const ITEMS = [
  { href: '/', key: 'dashboard', icon: House },
  { href: '/listings', key: 'listings', icon: Storefront },
  { href: '/testimonials', key: 'testimonials', icon: ChatCircleText },
  { href: '/activity', key: 'activity', icon: ClockCounterClockwise },
  { href: '/settings', key: 'settings', icon: GearSix },
] as const;

export function SideNav() {
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
          </Link>
        );
      })}
    </nav>
  );
}
