import { redirect } from 'next/navigation'

import { hasAnyRole } from '@/lib/authz'
import { currentCaller, type Caller } from '@/lib/session'

/**
 * Page-level guards.
 *
 * Separate from the guards in `lib/session.ts` because they answer differently:
 * a page sends the person somewhere they can act on, an endpoint sends a status
 * code. Both run on the server, and both run even when the navigation already
 * hid the link -- a hidden link is a courtesy, not a control.
 */

/**
 * Requires a signed-in person, sending them to the sign-in screen otherwise.
 */
export async function requirePage(): Promise<Caller> {
  const caller = await currentCaller()

  if (!caller) {
    redirect('/entrar')
  }

  return caller
}

/**
 * Requires a signed-in person holding at least one of the given roles.
 *
 * @param roles - Any one of these satisfies the check.
 */
export async function requirePageRole(...roles: string[]): Promise<Caller> {
  const caller = await requirePage()

  if (!hasAnyRole(caller.roles, roles)) {
    redirect(`/sem-permissao?precisa=${encodeURIComponent(roles.join(','))}`)
  }

  return caller
}
