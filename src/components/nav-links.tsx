'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ChartIcon, HomeIcon, TicketIcon, UsersIcon } from '@/components/icons'
import type { NavIcon, NavItem } from '@/lib/nav'

const ICONS: Record<NavIcon, typeof HomeIcon> = {
  home: HomeIcon,
  tickets: TicketIcon,
  reports: ChartIcon,
  team: UsersIcon,
}

/**
 * The navigation links, with the current area marked.
 *
 * The list arrives already filtered by the server: what a person may reach is
 * decided where the session is, not here.
 *
 * @param props.items - The entries to render.
 * @param props.onNavigate - Called after a link is followed, so the mobile
 * drawer holding this list can close itself.
 */
export function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="sidebar-nav">
      {items.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        const Icon = ICONS[item.icon]

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
          >
            <Icon size={17} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
