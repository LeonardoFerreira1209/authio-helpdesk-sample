import Link from 'next/link'

import { NavLinks } from '@/components/nav-links'
import { UserMenu } from '@/components/user-menu'
import { requirePage } from '@/lib/guard'
import { navFor } from '@/lib/nav'

/**
 * Every screen behind this layout reads the session cookie, which is never the
 * same twice and must never be cached.
 */
export const dynamic = 'force-dynamic'

/**
 * Two initials for the avatar.
 *
 * @param name - The display name.
 * @param fallback - Used when there is no name, usually the e-mail.
 */
function initialsOf(name: string, fallback: string): string {
  const source = (name || fallback || '?').trim()
  const parts = source.split(/[\s.@_-]+/).filter(Boolean)

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

/**
 * The signed-in shell: navigation on top, the screen below it.
 *
 * The guard runs here, once, for everything nested under it -- and every page
 * that needs more than "is signed in" guards again on its own.
 *
 * @param children - The screen being rendered.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const caller = await requirePage()
  const name = caller.name || caller.username || caller.email

  return (
    <>
      <header className="navbar">
        <Link className="logo" href="/">
          <span className="mark">H</span>
          Helpdesk
        </Link>

        <NavLinks items={navFor(caller)} />

        <UserMenu
          name={name}
          secondary={caller.email || caller.username}
          initials={initialsOf(caller.name, caller.email || caller.username)}
          roles={caller.roles}
        />
      </header>

      <div className="page">{children}</div>
    </>
  )
}
