import { AppShell } from '@/components/app-shell'
import { avatarTone, initialsOf } from '@/lib/avatar'
import { requirePage } from '@/lib/guard'
import { navFor } from '@/lib/nav'

/**
 * Every screen behind this layout reads the session cookie, which is never the
 * same twice and must never be cached.
 */
export const dynamic = 'force-dynamic'

/**
 * The signed-in shell: navigation on one side, the screen on the other.
 *
 * The guard runs here, once, for everything nested under it -- and every page
 * that needs more than "is signed in" guards again on its own.
 *
 * @param children - The screen being rendered.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const caller = await requirePage()
  const name = caller.name || caller.username || caller.email
  const secondary = caller.email || caller.username

  return (
    <AppShell
      items={navFor(caller)}
      user={{
        name,
        secondary,
        initials: initialsOf(caller.name, secondary),
        roles: caller.roles,
        tone: avatarTone(caller.userId || secondary),
      }}
    >
      {children}
    </AppShell>
  )
}
