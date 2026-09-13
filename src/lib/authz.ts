import type { Claims } from '@/lib/jwt'

/**
 * The roles this application makes decisions with.
 *
 * They are plain strings because that is all a role is on the wire. Create them
 * in Authio with these exact names and assign them to the users you want to
 * test with -- the names are the whole contract between the two sides.
 */
export const ROLES = {
  /** Manages the team: reads every user and changes who holds which role. */
  admin: 'helpdesk.admin',

  /** Works tickets: reads them and writes to them. */
  agent: 'helpdesk.agent',

  /** Reads tickets and nothing else. */
  viewer: 'helpdesk.viewer',
} as const

/**
 * A role name as this application knows it.
 */
export type HelpdeskRole = (typeof ROLES)[keyof typeof ROLES]

/**
 * The claim the reports endpoint is gated on.
 *
 * Kept separate from the roles on purpose: a role says what someone may do, and
 * this says which slice of the data they may do it to. Mixing the two is how a
 * permission model ends up with one role per department.
 */
export const DEPARTMENT_CLAIM = 'department'

/**
 * Every place a role can arrive in, across the token shapes Authio and other
 * OIDC providers emit.
 *
 * Authio puts a client user's roles in `user_resource_access`, as a JSON object
 * whose keys are the role names and whose values describe what each role may do.
 * The Keycloak-shaped `realm_access` / `resource_access` and the flat `roles`
 * claim are read too, so pointing this app at a differently configured realm --
 * or at a claim mapper that flattens roles -- does not silently produce a user
 * with no roles at all.
 *
 * @param claims - The decoded access token payload.
 */
export function rolesFromToken(claims: Claims | null): string[] {
  if (!claims) {
    return []
  }

  const found = new Set<string>()

  for (const role of resourceAccessRoles(claims.user_resource_access)) {
    found.add(role)
  }

  for (const role of resourceAccessRoles(claims.system_resource_access)) {
    found.add(role)
  }

  for (const role of nestedRoles(claims.realm_access)) {
    found.add(role)
  }

  const resourceAccess = claims.resource_access

  if (resourceAccess && typeof resourceAccess === 'object') {
    for (const entry of Object.values(resourceAccess as Record<string, unknown>)) {
      for (const role of nestedRoles(entry)) {
        found.add(role)
      }
    }
  }

  for (const role of flatRoles(claims.roles)) {
    found.add(role)
  }

  for (const role of flatRoles(claims.role)) {
    found.add(role)
  }

  return [...found]
}

/**
 * Reads role names out of an Authio resource access claim.
 *
 * The claim may arrive already parsed or still as the JSON string Authio
 * serialised it into, depending on whether it came from the token or from an
 * endpoint that echoed it back, so both are accepted.
 *
 * @param value - The claim value.
 */
function resourceAccessRoles(value: unknown): string[] {
  const parsed = typeof value === 'string' ? safeJson(value) : value

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return []
  }

  return Object.keys(parsed as Record<string, unknown>)
}

/**
 * Reads role names out of a `{ roles: [...] }` shaped claim.
 *
 * @param value - The claim value.
 */
function nestedRoles(value: unknown): string[] {
  const parsed = typeof value === 'string' ? safeJson(value) : value

  if (!parsed || typeof parsed !== 'object') {
    return []
  }

  return flatRoles((parsed as { roles?: unknown }).roles)
}

/**
 * Reads role names out of a claim that is either an array or a delimited
 * string.
 *
 * @param value - The claim value.
 */
function flatRoles(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }

  if (typeof value === 'string') {
    return value.split(/[\s,]+/).filter(Boolean)
  }

  return []
}

/**
 * Parses JSON, returning `null` instead of throwing.
 *
 * @param value - The string to parse.
 */
function safeJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

/**
 * Whether a set of roles contains any of the ones required.
 *
 * Comparison is case-insensitive because a role name is typed by hand into the
 * console on one side and into this file on the other, and `Helpdesk.Admin`
 * failing to match `helpdesk.admin` is the least interesting bug this sample
 * could produce.
 *
 * @param held - The roles the caller holds.
 * @param required - The roles that would satisfy the check.
 */
export function hasAnyRole(held: string[], required: readonly string[]): boolean {
  const normalised = new Set(held.map((role) => role.toLowerCase()))

  return required.some((role) => normalised.has(role.toLowerCase()))
}

/**
 * The permissions each role carries, as Authio described them in the token.
 *
 * Rendered on the screen next to the role name: a role is only meaningful
 * through the permissions attached to it, and showing the name alone hides the
 * half that actually decides anything on the Authio side.
 *
 * @param claims - The decoded access token payload.
 */
export function permissionsFromToken(claims: Claims | null): Record<string, string[]> {
  if (!claims) {
    return {}
  }

  const source = typeof claims.user_resource_access === 'string'
    ? safeJson(claims.user_resource_access)
    : claims.user_resource_access

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return {}
  }

  const result: Record<string, string[]> = {}

  for (const [role, permissions] of Object.entries(source as Record<string, unknown>)) {
    if (!permissions || typeof permissions !== 'object') {
      result[role] = []

      continue
    }

    result[role] = Object.entries(permissions as Record<string, unknown>).map(
      ([resource, methods]) =>
        `${resource}: ${Array.isArray(methods) ? methods.join(', ') : String(methods)}`,
    )
  }

  return result
}

/**
 * Claims worth showing on the screen, with the OIDC plumbing left out.
 *
 * `iat`, `exp`, `nbf` and the rest are protocol machinery, not attributes of
 * the person, and a table that lists them buries the three or four claims an
 * application actually makes decisions with.
 *
 * @param claims - The decoded access token payload.
 */
export function businessClaims(claims: Claims | null): Array<{ name: string; value: string }> {
  if (!claims) {
    return []
  }

  const plumbing = new Set([
    'iat',
    'exp',
    'nbf',
    'jti',
    'iss',
    'aud',
    'typ',
    'azp',
    'at_hash',
    'c_hash',
    'sid',
    'auth_time',
    'user_resource_access',
    'system_resource_access',
    'realm_access',
    'resource_access',
  ])

  return Object.entries(claims)
    .filter(([name]) => !plumbing.has(name))
    .map(([name, value]) => ({
      name,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }))
    .sort((first, second) => first.name.localeCompare(second.name))
}
