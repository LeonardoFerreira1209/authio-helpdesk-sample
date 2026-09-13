import { claimValue, DEPARTMENT_CLAIM, hasAnyRole, ROLES } from '@/lib/authz'
import type { Caller } from '@/lib/session'

/**
 * An entry in the top navigation.
 */
export interface NavItem {
  href: string
  label: string
  /** Any one of these roles reveals the item. Absent means everyone signed in. */
  roles?: readonly string[]
  /** A claim that must be present for the item to be reachable. */
  claim?: string
}

/**
 * The application's navigation, with what each area requires.
 *
 * The requirement lives next to the link so the menu and the guards cannot
 * drift apart -- but it is only what the menu *shows*. Every page and every
 * endpoint checks again on the server: hiding a link is a courtesy to the user,
 * never a control, since anyone can type the URL.
 */
export const NAV: readonly NavItem[] = [
  { href: '/', label: 'Início' },
  { href: '/chamados', label: 'Chamados', roles: [ROLES.viewer, ROLES.agent, ROLES.admin] },
  { href: '/relatorios', label: 'Relatórios', claim: DEPARTMENT_CLAIM },
  { href: '/equipe', label: 'Equipe', roles: [ROLES.admin] },
] as const

/**
 * The entries this person should see.
 *
 * @param caller - Who is signed in.
 */
export function navFor(caller: Caller): NavItem[] {
  return NAV.filter((item) => {
    if (item.roles && !hasAnyRole(caller.roles, item.roles)) {
      return false
    }

    if (item.claim) {
      return claimValue(caller.claims, item.claim) !== ''
    }

    return true
  })
}
