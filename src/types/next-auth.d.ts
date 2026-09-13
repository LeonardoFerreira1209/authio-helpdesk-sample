import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  /**
   * What the browser is allowed to see about the session.
   *
   * The provider tokens are deliberately absent: they stay inside the encrypted
   * cookie and are read server-side, so a script running on the page cannot
   * lift a bearer token for Authio out of it.
   */
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      username: string
    }
    /** Roles read out of the access token, for rendering the screen. */
    roles: string[]
    /** When the access token expires, in milliseconds since epoch. */
    accessTokenExpires?: number
    /** Set when the session could not be renewed and a new login is needed. */
    error?: string
  }
}

declare module 'next-auth/jwt' {
  /**
   * The encrypted session cookie's payload.
   */
  interface JWT {
    username?: string
    accessToken?: string
    refreshToken?: string
    idToken?: string
    accessTokenExpires?: number
    scope?: string
    error?: string
  }
}
