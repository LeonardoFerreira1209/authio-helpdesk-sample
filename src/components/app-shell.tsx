'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

import { MenuIcon, XIcon } from '@/components/icons'
import { NavLinks } from '@/components/nav-links'
import { UserMenu } from '@/components/user-menu'
import type { NavItem } from '@/lib/nav'

/**
 * The signed-in shell: a sidebar with the navigation, a top bar, and the
 * screen below them.
 *
 * A client component because the sidebar collapses into a drawer on a narrow
 * screen, and that open/closed state has nowhere to live on the server. Who
 * may see what was already decided before this rendered -- `items` and `user`
 * arrive as plain data, filtered and read server-side.
 *
 * @param props.items - The navigation entries this person may see.
 * @param props.user - The signed-in person, for the avatar and menu.
 * @param props.children - The screen being rendered.
 */
export function AppShell({
  items,
  user,
  children,
}: {
  items: NavItem[]
  user: { name: string; secondary: string; initials: string; roles: string[]; tone: number }
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const current = items.find((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
  )

  return (
    <div className="shell">
      <button
        className="sidebar-scrim"
        data-open={open}
        aria-label="Fechar navegação"
        onClick={() => setOpen(false)}
      />

      <aside className="sidebar" data-open={open}>
        <div className="sidebar-brand">
          <Link className="row" href="/" style={{ gap: 10 }}>
            <span className="mark">H</span>
            Helpdesk
          </Link>
          <button
            className="icon-button sidebar-close"
            aria-label="Fechar navegação"
            onClick={() => setOpen(false)}
          >
            <XIcon size={18} />
          </button>
        </div>

        <NavLinks items={items} onNavigate={() => setOpen(false)} />

        <div className="sidebar-foot">
          <span className="badge">Ambiente de exemplo</span>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <button className="icon-button menu-toggle" aria-label="Abrir navegação" onClick={() => setOpen(true)}>
            <MenuIcon />
          </button>

          <span className="topbar-title">{current?.label ?? 'Helpdesk'}</span>

          <UserMenu
            name={user.name}
            secondary={user.secondary}
            initials={user.initials}
            roles={user.roles}
            tone={user.tone}
          />
        </header>

        <div className="page">{children}</div>
      </div>
    </div>
  )
}
