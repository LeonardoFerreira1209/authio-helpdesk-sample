import { cookies } from 'next/headers'
import { decode, type JWT } from 'next-auth/jwt'

import { hasAnyRole, rolesFromToken } from '@/lib/authz'
import { env } from '@/lib/env'
import { decodeClaims, type Claims } from '@/lib/jwt'

/**
 * The two names NextAuth gives the session cookie, secure first.
 */
const COOKIE_NAMES = ['__Secure-next-auth.session-token', 'next-auth.session-token']

/**
 * Who is signed in, as far as this application is concerned.
 */
export interface Caller {
  /** The Authio user id, from the token's `sub`. */
  userId: string

  /** The login name, when the token carries one. */
  username: string

  /** The display name. */
  name: string

  /** The e-mail address. */
  email: string

  /** Roles read out of the access token. */
  roles: string[]

  /** Every claim in the access token, decoded. */
  claims: Claims

  /** The access token itself, for calls this application makes on the user's behalf. */
  accessToken: string
}

/**
 * Reassembles the session cookie, which NextAuth splits into numbered chunks
 * once the payload outgrows the 4 KB browser limit.
 */
async function readSessionCookie(): Promise<string | null> {
  const store = await cookies()

  for (const name of COOKIE_NAMES) {
    const single = store.get(name)?.value

    if (single) {
      return single
    }

    const chunks = store
      .getAll()
      .filter((cookie) => cookie.name.startsWith(`${name}.`))
      .sort((first, second) => Number(first.name.split('.').pop()) - Number(second.name.split('.').pop()))

    if (chunks.length > 0) {
      return chunks.map((chunk) => chunk.value).join('')
    }
  }

  return null
}

/**
 * Decrypts the session cookie and returns its payload.
 *
 * The provider tokens live inside this encrypted cookie and are never copied
 * into the session object the browser receives, so every server-side reader
 * comes through here.
 */
async function readSessionJwt(): Promise<JWT | null> {
  const token = await readSessionCookie()

  if (!token || !env.sessionSecret) {
    return null
  }

  try {
    return await decode({ token, secret: env.sessionSecret })
  } catch {
    return null
  }
}

/**
 * The signed-in caller, or `null` when there is no usable session.
 *
 * A session whose renewal failed is treated as no session: it still names a
 * user, and every call made with it would be refused by Authio, which is a far
 * more confusing way to be signed out than simply not being signed in.
 */
export async function currentCaller(): Promise<Caller | null> {
  const jwt = await readSessionJwt()

  if (!jwt?.accessToken || jwt.error) {
    return null
  }

  const claims = decodeClaims(jwt.accessToken) ?? {}

  return {
    userId: typeof claims.sub === 'string' ? claims.sub : (jwt.sub ?? ''),
    username:
      typeof claims.preferred_username === 'string'
        ? claims.preferred_username
        : (jwt.username ?? ''),
    name: jwt.name ?? (typeof claims.name === 'string' ? claims.name : ''),
    email: jwt.email ?? (typeof claims.email === 'string' ? claims.email : ''),
    roles: rolesFromToken(claims),
    claims,
    accessToken: jwt.accessToken,
  }
}

/**
 * What a guard decided about a request.
 *
 * A refusal carries the response to send, so a route handler never has to
 * restate the status code or the shape of the error body -- the two things that
 * drift apart first when every endpoint writes its own.
 */
export type Guard = { ok: true; caller: Caller } | { ok: false; response: Response }

/**
 * Refuses a request, saying what was needed and what the caller actually had.
 *
 * The "held" half matters: a 403 that only names the requirement sends whoever
 * is testing back to the console to check something they already configured,
 * when the real answer is that the token in hand does not carry it yet.
 *
 * @param status - 401 when unauthenticated, 403 when authenticated but not allowed.
 * @param message - What the caller should read.
 * @param detail - What was required and what was held.
 */
function refuse(status: number, message: string, detail?: Record<string, unknown>): Response {
  return Response.json({ error: message, ...detail }, { status })
}

/**
 * Requires a signed-in caller and nothing more.
 */
export async function requireCaller(): Promise<Guard> {
  const caller = await currentCaller()

  if (!caller) {
    return {
      ok: false,
      response: refuse(401, 'Sua sessão expirou. Entre novamente.'),
    }
  }

  return { ok: true, caller }
}

/**
 * Requires a signed-in caller holding at least one of the given roles.
 *
 * @param roles - Any one of these satisfies the check.
 */
export async function requireRole(...roles: string[]): Promise<Guard> {
  const guard = await requireCaller()

  if (!guard.ok) {
    return guard
  }

  if (!hasAnyRole(guard.caller.roles, roles)) {
    return {
      ok: false,
      response: refuse(
        403,
        'Seu usuário não tem o papel exigido por este endpoint.',
        { required: roles, held: guard.caller.roles },
      ),
    }
  }

  return guard
}
