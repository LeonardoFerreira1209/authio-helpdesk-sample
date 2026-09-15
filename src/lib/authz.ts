import type { Claims } from '@/lib/jwt'

/**
 * The roles this application makes decisions with.
 *
 * They are plain strings because that is all a role is on the wire, and they
 * are bare -- `viewer`, not `helpdesk.viewer` -- because Authio already scopes
 * them by nesting: a role only ever arrives under this application's own
 * client id in `user_resource_access` (see {@link rolesFromToken}), so the name
 * itself does not need to repeat that scope. Create them in Authio with these
 * exact names and assign them to the users you want to test with -- the names
 * are the whole contract between the two sides.
 */
export const ROLES = {
  /** Manages the team: reads every user and changes who holds which role. */
  admin: 'admin',

  /** Works tickets: reads them and writes to them. */
  agent: 'agent',

  /** Reads tickets and nothing else. */
  viewer: 'viewer',
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
 * Authio puts a client user's roles in `user_resource_access`, nested under
 * this application's own client id and then under a resource id --
 * `{ helpdesk: { helpdesk: ["viewer", ...] } }` -- and sometimes repeats the
 * same information as a flat, client-named claim (`{ helpdesk: "viewer" }`) as
 * a shorthand. Only the entry under `clientId` is read: a token can in
 * principle carry other clients' access too, and a bare role name like
 * `viewer` is not unique enough across an Authio tenant to trust it for an
 * unrelated client. The Keycloak-shaped `realm_access` / `resource_access` and
 * the flat `roles` claim are read too, so pointing this app at a differently
 * configured realm -- or at a claim mapper that flattens roles -- does not
 * silently produce a user with no roles at all.
 *
 * @param claims - The decoded access token payload.
 * @param clientId - This application's own client id in Authio, i.e. `AUTHIO_ID`.
 */
export function rolesFromToken(claims: Claims | null, clientId: string): string[] {
  if (!claims) {
    return []
  }

  const found = new Set<string>()

  for (const role of resourceAccessRoles(claims.user_resource_access, clientId)) {
    found.add(role)
  }

  for (const role of resourceAccessRoles(claims.system_resource_access, clientId)) {
    found.add(role)
  }

  if (clientId) {
    for (const role of flatRoles(claims[clientId])) {
      found.add(role)
    }
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
 * Reads role names out of an Authio resource access claim, for one client.
 *
 * The claim may arrive already parsed or still as the JSON string Authio
 * serialised it into, depending on whether it came from the token or from an
 * endpoint that echoed it back, so both are accepted.
 *
 * Only `parsed[clientId]` is walked, not the whole claim: `user_resource_access`
 * is keyed by client id first, e.g. `{ helpdesk: { helpdesk: ["viewer"] } }`,
 * and a role nested under a different client is that client's business, not
 * this application's.
 *
 * @param value - The claim value.
 * @param clientId - This application's own client id in Authio.
 */
function resourceAccessRoles(value: unknown, clientId: string): string[] {
  const parsed = typeof value === 'string' ? safeJson(value) : value

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !clientId) {
    return []
  }

  return rolesNestedIn((parsed as Record<string, unknown>)[clientId])
}

/**
 * Collects every string held in an array anywhere inside a claim value,
 * however deep it is nested.
 *
 * The depth limit is only a guard against a pathological payload; Authio's own
 * shape is two levels deep.
 *
 * @param value - The (already parsed) claim value.
 * @param depth - How many levels have been descended so far.
 */
function rolesNestedIn(value: unknown, depth = 0): string[] {
  if (value == null || depth > 4) {
    return []
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) =>
      typeof entry === 'string' ? [entry] : rolesNestedIn(entry, depth + 1),
    )
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((entry) =>
      rolesNestedIn(entry, depth + 1),
    )
  }

  return []
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
 * The value of a claim, or an empty string when it is absent.
 *
 * Absent and empty are treated the same on purpose: a `department` that arrived
 * as `""` scopes a report to nothing, and letting that through would show an
 * empty report instead of saying the account is not linked to an area.
 *
 * @param claims - The decoded access token payload.
 * @param name - The claim to read.
 */
export function claimValue(claims: Claims | null, name: string): string {
  const value = claims?.[name]

  return typeof value === 'string' ? value.trim() : ''
}
