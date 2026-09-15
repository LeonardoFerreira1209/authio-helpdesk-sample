import { claimValue, DEPARTMENT_CLAIM, hasAnyRole, ROLES } from '@/lib/authz'
import type { Caller } from '@/lib/session'

/** Names of the icons the sidebar knows how to draw next to a link. */
export type NavIcon = 'home' | 'tickets' | 'reports' | 'team'

/**
 * An entry in the navigation.
 */
export interface NavItem {
  href: string
  label: string
  icon: NavIcon
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
  { href: '/', label: 'Início', icon: 'home' },
  {
    href: '/chamados',
    label: 'Chamados',
    icon: 'tickets',
    roles: [ROLES.viewer, ROLES.agent, ROLES.admin],
  },
  { href: '/relatorios', label: 'Relatórios', icon: 'reports', claim: DEPARTMENT_CLAIM },
  { href: '/equipe', label: 'Equipe', icon: 'team', roles: [ROLES.admin] },
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
