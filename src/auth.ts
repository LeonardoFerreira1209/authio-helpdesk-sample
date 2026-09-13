import type { Account, NextAuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import { Authio, type AuthioProfile } from 'authio-provider-nextauth'

import { rolesFromToken } from '@/lib/authz'
import { env, loginConfigured } from '@/lib/env'
import { decodeClaims } from '@/lib/jwt'

/**
 * Scopes asked for at the authorization endpoint.
 *
 * `offline_access` is what makes a refresh token come back. Without it the
 * session dies with the first access token, which in a support desk means being
 * signed out in the middle of a ticket.
 */
const SCOPE = 'openid profile email offline_access'

/**
 * How long before expiry the access token is renewed.
 */
const RENEW_WINDOW_MS = 60_000

/**
 * Placeholder used to sign the session cookie when AUTH_SECRET is absent.
 *
 * Nothing can be done with it -- with no provider registered there is no login
 * to have a session from -- but this module must not throw while being
 * imported: it is pulled in by the route handler, and a module that throws at
 * import time makes the whole application fail to start, which is a far worse
 * way to report a missing variable than the notice the sign-in page already
 * shows.
 */
const UNCONFIGURED_SECRET = 'helpdesk-sem-AUTH_SECRET-configurado'

/**
 * The token endpoint response as Authio sends it.
 */
type AuthioAccount = Account & { refresh_expires_in?: number }

/**
 * Builds the session from the tokens the authorization code exchange returned.
 *
 * @param token - The JWT NextAuth is assembling.
 * @param account - The token endpoint response.
 * @param profile - The id_token claims, as the provider returned them.
 */
function startSession(
  token: JWT,
  account: AuthioAccount,
  profile: AuthioProfile | undefined,
): JWT {
  const expiresIn = typeof account.expires_in === 'number' ? account.expires_in : 3600

  return {
    ...token,
    username: profile?.preferred_username ?? '',
    accessToken: account.access_token,
    refreshToken: account.refresh_token,
    idToken: account.id_token,
    scope: typeof account.scope === 'string' ? account.scope : undefined,
    accessTokenExpires: account.expires_at
      ? account.expires_at * 1000
      : Date.now() + expiresIn * 1000,
    error: undefined,
  }
}

/**
 * Exchanges the refresh token for a fresh access token.
 *
 * The credential is presented as `client_secret_basic`, the method the seeded
 * Authio client registers. Authio holds a client to the method it registered
 * (OIDC Core §9), so a correct secret presented the wrong way comes back as
 * `invalid_client` -- indistinguishable, from here, from a wrong secret.
 *
 * @param token - The session whose access token is expiring.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: 'RefreshTokenAusente' }
  }

  try {
    const endpoint = `${env.issuer.replace(/\/$/, '')}/protocol/openid-connect/token`
    const credential = Buffer.from(`${env.clientId}:${env.clientSecret}`).toString('base64')

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credential}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    })

    const body = (await response.json().catch(() => null)) as {
      access_token?: string
      refresh_token?: string
      id_token?: string
      expires_in?: number
    } | null

    if (!response.ok || !body?.access_token) {
      return { ...token, error: 'RenovacaoRecusada' }
    }

    return {
      ...token,
      accessToken: body.access_token,
      // Authio rotates the refresh token, so the old one stops being redeemable
      // the moment this exchange succeeds. Keeping it would sign the user out on
      // the next renewal.
      refreshToken: body.refresh_token ?? token.refreshToken,
      idToken: body.id_token ?? token.idToken,
      accessTokenExpires: Date.now() + (body.expires_in ?? 3600) * 1000,
      error: undefined,
    }
  } catch {
    return { ...token, error: 'ProvedorInacessivel' }
  }
}

/**
 * NextAuth configuration, shared by the route handler and by any server code
 * that needs the session.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  secret: env.sessionSecret || UNCONFIGURED_SECRET,
  pages: {
    signIn: '/entrar',
    error: '/entrar',
  },
  providers: loginConfigured()
    ? [
        Authio({
          issuer: env.issuer,
          clientId: env.clientId,
          clientSecret: env.clientSecret,
          authorization: { params: { scope: SCOPE } },
          checks: ['pkce', 'state', 'nonce'],
          client: { token_endpoint_auth_method: 'client_secret_basic' },
        }),
      ]
    : [],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        return startSession(token, account as AuthioAccount, profile as AuthioProfile | undefined)
      }

      const expiresAt = token.accessTokenExpires ?? 0

      if (token.error || Date.now() < expiresAt - RENEW_WINDOW_MS) {
        return token
      }

      return refreshAccessToken(token)
    },
    session({ session, token }) {
      session.user.id = token.sub ?? ''
      session.user.username = token.username ?? ''
      session.user.name = token.name ?? ''
      session.user.email = token.email ?? ''
      session.roles = rolesFromToken(decodeClaims(token.accessToken))
      session.accessTokenExpires = token.accessTokenExpires
      session.error = token.error

      return session
    },
  },
}
