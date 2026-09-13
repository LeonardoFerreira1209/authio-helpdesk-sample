import { env, realmName } from '@/lib/env'

/**
 * Client for the Authio Admin API.
 *
 * Server-side only. It carries administrative credentials and must never be
 * imported from a component that ships to the browser.
 *
 * Everything under `/api/v1/admin` is guarded by a claim, not by a scope: the
 * token has to carry `system_resource_access` (a user flagged as system, who is
 * responsible for the realm) or `secret_resource_access` (an API key with roles
 * attached). A token obtained with the client secret alone authenticates
 * perfectly and is then refused by every administrative endpoint with 403 --
 * which reads like a broken API and is a wrong credential. That is why the
 * default path here is the password grant with a system user.
 */

/** The Admin API is versioned in the path; pinned so a default change cannot move it silently. */
const API_VERSION = 'v1'

/** How long before expiry the cached token is considered spent. */
const TOKEN_SKEW_MS = 30_000

interface CachedToken {
  token: string
  expiresAt: number
}

let cached: CachedToken | null = null

/**
 * A user as the Admin API returns it.
 *
 * Only the fields this application actually reads are named. The response
 * carries considerably more, and listing all of it here would mean editing this
 * file every time Authio adds a property.
 */
export interface AuthioUser {
  id: string
  userName: string
  email: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string | null
  status: string | number
  emailConfirmed: boolean
  phoneNumberConfirmed: boolean
  twoFactorEnabled: boolean
  lockoutEnabled: boolean
  created: string
  updated: string | null
  userRoles?: Array<{ roleId: string; role?: { id: string; name: string; description?: string } }>
}

/**
 * A role as the Admin API returns it.
 */
export interface AuthioRole {
  id: string
  name: string
  description: string | null
}

/**
 * The envelope every Admin API endpoint answers with.
 */
interface ApiEnvelope<T> {
  success?: boolean
  statusCode?: string | number
  message?: string
  data?: T
  pagination?: { items: T[]; totalCount: number; pageNumber: number; pageSize: number }
  errors?: unknown
}

/**
 * The outcome of an Admin API call, kept as data rather than thrown.
 *
 * Route handlers need the status and the body to pass on to the screen: this
 * sample exists to show what Authio answered, and an exception loses exactly
 * that.
 */
export interface AuthioResult<T> {
  ok: boolean
  status: number
  data: T | null
  items: T[]
  totalCount: number
  message: string | null
}

/**
 * Obtains an administrative token, reusing the cached one while it is valid.
 *
 * The grant is `password`, against the realm through which Authio administers
 * itself -- the same door any other user of that realm walks through, with the
 * same lockout and rotation rules. The credential presented for the client is
 * `client_secret_basic`, which is how the platform client is seeded.
 *
 * @throws Error naming what to change when no token could be obtained.
 */
async function adminToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + TOKEN_SKEW_MS) {
    return cached.token
  }

  const endpoint = `${env.authioUrl}/realms/${encodeURIComponent(env.platformRealm)}/protocol/openid-connect/token`

  const credential = Buffer.from(`${env.platformClient}:${env.adminSecret}`).toString('base64')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credential}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: env.adminUsername,
      password: env.adminPassword,
    }),
    cache: 'no-store',
  })

  const body = (await response.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; error?: string; error_description?: string }
    | null

  if (!response.ok || !body?.access_token) {
    throw new Error(
      `Não foi possível obter o token administrativo (HTTP ${response.status}${
        body?.error ? ` · ${body.error}` : ''
      }${body?.error_description ? ` — ${body.error_description}` : ''}). ` +
        'Confira AUTHIO_ADMIN_USERNAME/PASSWORD (usuário system do realm) e AUTHIO_ADMIN_SECRET ' +
        `(o segredo do client "${env.platformClient}").`,
    )
  }

  cached = {
    token: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 300) * 1000,
  }

  return cached.token
}

/**
 * Performs an authenticated call against the Admin API.
 *
 * @param path - Path below `/api/{version}/admin`.
 * @param init - Method, body and query string.
 */
async function adminFetch<T>(
  path: string,
  init: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    query?: Record<string, string | number | undefined>
  } = {},
): Promise<AuthioResult<T>> {
  const token = await adminToken()
  const query = new URLSearchParams()

  for (const [name, value] of Object.entries(init.query ?? {})) {
    if (value !== undefined) {
      query.set(name, String(value))
    }
  }

  const suffix = query.toString() ? `?${query}` : ''

  const response = await fetch(`${env.authioUrl}/api/${API_VERSION}/admin${path}${suffix}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  })

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null

  return {
    ok: response.ok,
    status: response.status,
    data: envelope?.data ?? null,
    items: envelope?.pagination?.items ?? [],
    totalCount: envelope?.pagination?.totalCount ?? 0,
    message: envelope?.message ?? (response.ok ? null : authorizationAdvice(response.status)),
  }
}

/**
 * What a 401 or a 403 from the Admin API actually means, since the two are
 * routinely confused and lead to opposite fixes.
 *
 * @param status - The status Authio answered with.
 */
function authorizationAdvice(status: number): string | null {
  if (status === 401) {
    return 'O token administrativo não foi aceito. Ele expirou, ou veio de outra instância: confira AUTHIO_URL.'
  }

  if (status === 403) {
    return 'O token foi aceito mas não carrega permissão administrativa. Os endpoints /api/v1/admin exigem system_resource_access — use um usuário marcado como system em AUTHIO_ADMIN_USERNAME.'
  }

  return null
}

/**
 * The realm and client this application administers its own users under.
 */
function target(): { realm: string; client: string } {
  return { realm: realmName(), client: env.clientId }
}

/**
 * Base path of the user endpoints for this application's own client.
 */
function usersPath(): string {
  const { realm, client } = target()

  return `/realms/${encodeURIComponent(realm)}/clients/${encodeURIComponent(client)}/users`
}

/**
 * Reads one user.
 *
 * @param userId - The Authio user id.
 */
export async function getUser(userId: string): Promise<AuthioResult<AuthioUser>> {
  return adminFetch<AuthioUser>(`${usersPath()}/${encodeURIComponent(userId)}`)
}

/**
 * Reads a page of the client's users.
 *
 * @param pageNumber - 1-based page index.
 * @param pageSize - How many per page.
 * @param searchTerm - Optional filter.
 */
export async function listUsers(
  pageNumber = 1,
  pageSize = 20,
  searchTerm?: string,
): Promise<AuthioResult<AuthioUser>> {
  return adminFetch<AuthioUser>(usersPath(), {
    query: { PageNumber: pageNumber, PageSize: pageSize, SearchTerm: searchTerm || undefined },
  })
}

/**
 * Reads the claims stored on a user.
 *
 * These are the claims as Authio holds them, which is not the same list the
 * token carries: what reaches a token depends on the scopes granted and on the
 * client's claim mappers. Showing both side by side is the point of the team
 * panel.
 *
 * @param userId - The Authio user id.
 */
export async function getUserClaims(
  userId: string,
): Promise<AuthioResult<Array<{ type: string; value: string }>>> {
  return adminFetch<Array<{ type: string; value: string }>>(
    `${usersPath()}/${encodeURIComponent(userId)}/claims`,
  )
}

/**
 * The fields a user update may change.
 *
 * `roles` replaces the whole set: any role not in the list is removed. Omitting
 * the property leaves the current roles alone, which is why it is optional
 * rather than defaulted to an empty array.
 */
export interface UserUpdate {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  emailConfirmed: boolean
  phoneNumberConfirmed: boolean
  twoFactorEnabled: boolean
  lockoutEnabled: boolean
  roles?: string[]
}

/**
 * Writes a user back.
 *
 * The update is a full representation, not a patch: the boolean flags are sent
 * as they currently stand, because a JSON body that omits them lands on the
 * server as `false` and would quietly unconfirm an e-mail address that was
 * confirmed. Callers read the user first and change only what they mean to.
 *
 * @param payload - The user as it should end up.
 */
export async function updateUser(payload: UserUpdate): Promise<AuthioResult<AuthioUser>> {
  return adminFetch<AuthioUser>(usersPath(), { method: 'PUT', body: payload })
}

/**
 * Lists the roles that may be assigned to a user.
 *
 * @remarks Roles are managed at the account level, so this endpoint is not
 * scoped to the realm or the client the way the user endpoints are.
 */
export async function listAssignableRoles(): Promise<AuthioResult<AuthioRole>> {
  const result = await adminFetch<AuthioRole[]>('/roles/assignable/user')

  return {
    ok: result.ok,
    status: result.status,
    data: null,
    items: Array.isArray(result.data) ? result.data : [],
    totalCount: Array.isArray(result.data) ? result.data.length : 0,
    message: result.message,
  }
}

/**
 * The role names a user currently holds, read from an Admin API response.
 *
 * @param user - The user as the Admin API returned it.
 */
export function rolesOf(user: AuthioUser): string[] {
  return (user.userRoles ?? [])
    .map((entry) => entry.role?.name)
    .filter((name): name is string => Boolean(name))
}
