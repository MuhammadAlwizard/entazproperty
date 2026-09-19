'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChatCircleText, ClockCounterClockwise, GearSix, House, Storefront } from '@phosphor-icons/react';

const ITEMS = [
  { href: '/', label: 'Ringkasan', icon: House },
  { href: '/listings', label: 'Listing', icon: Storefront },
  { href: '/testimonials', label: 'Testimoni', icon: ChatCircleText },
  { href: '/activity', label: 'Aktivitas', icon: ClockCounterClockwise },
  { href: '/settings', label: 'Pengaturan', icon: GearSix },
];

export function SideNav() {
  const path = usePathname();
  return (
    <nav aria-label="Menu admin" className="sidenav">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? path === '/' : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={active ? 'active' : ''}>
            <Icon size={20} weight={active ? 'fill' : 'regular'} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
