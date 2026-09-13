import NextAuth from 'next-auth'

import { authOptions } from '@/auth'

/**
 * The NextAuth handler: sign-in, callback, session and sign-out all live here.
 *
 * The callback Authio must have registered as this client's redirect URI is
 * `{NEXTAUTH_URL}/api/auth/callback/authio` -- the provider's id is `authio`,
 * so that is the path NextAuth serves, and it is not the page the user lands on
 * afterwards.
 */
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
