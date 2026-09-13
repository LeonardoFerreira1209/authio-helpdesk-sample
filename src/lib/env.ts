/**
 * Every environment variable this application reads, in one place.
 *
 * Nothing here throws on import: a missing variable has to be reportable on the
 * screen, and a module that throws while being imported takes the whole app
 * down before any screen exists to report it.
 */
export const env = {
  /** Issuer of the realm this application authenticates against. */
  issuer: process.env.NEXT_PUBLIC_AUTHIO_ISSUER ?? '',

  /** The client id registered in Authio for this application. */
  clientId: process.env.AUTHIO_ID ?? '',

  /** The client secret, presented at the token endpoint on every exchange. */
  clientSecret: process.env.AUTHIO_CLIENT_SECRET ?? '',

  /** Key that encrypts this application's own session cookie. */
  sessionSecret: process.env.AUTH_SECRET ?? '',

  /** Base URL of the Authio instance, used by the Admin API calls. */
  authioUrl: (process.env.AUTHIO_URL ?? '').replace(/\/$/, ''),

  /** Realm through which Authio administers itself. */
  platformRealm: process.env.AUTHIO_PLATFORM_REALM || 'authio',

  /** Client through which Authio administers itself. */
  platformClient: process.env.AUTHIO_PLATFORM_CLIENT || 'authio',

  /** Secret presented when asking for an administrative token. */
  adminSecret: process.env.AUTHIO_ADMIN_SECRET ?? '',

  /** System user whose roles authorise the Admin API calls. */
  adminUsername: process.env.AUTHIO_ADMIN_USERNAME ?? '',

  /** Password of the system user above. */
  adminPassword: process.env.AUTHIO_ADMIN_PASSWORD ?? '',
} as const

/**
 * The realm name, derived from the issuer instead of configured twice.
 *
 * Authio issuers are always `{base}/realms/{realm}`, so the realm is already in
 * the one variable every OIDC call needs. Asking for it again is one more thing
 * that can disagree with itself.
 */
export function realmName(): string {
  const match = env.issuer.match(/\/realms\/([^/]+)\/?$/)

  return match ? decodeURIComponent(match[1]) : ''
}

/**
 * Whether login can be attempted at all.
 */
export function loginConfigured(): boolean {
  return Boolean(env.issuer && env.clientId && env.clientSecret && env.sessionSecret)
}

/**
 * Whether the Admin API calls (profile and team panels) have what they need.
 */
export function adminConfigured(): boolean {
  return Boolean(env.authioUrl && env.adminSecret && env.adminUsername && env.adminPassword && realmName())
}

/**
 * What is still missing before the Admin API area works, or `null` when nothing
 * is.
 *
 * Shown on the screen so a 403 from Authio is read as "this app is not
 * configured" rather than as "Authio is broken" -- the two look identical from
 * the browser and have opposite fixes.
 */
export function adminGap(): string | null {
  if (!env.authioUrl) {
    return 'AUTHIO_URL não está definido.'
  }

  if (!env.adminSecret) {
    return 'AUTHIO_ADMIN_SECRET não está definido.'
  }

  if (!env.adminUsername || !env.adminPassword) {
    return 'AUTHIO_ADMIN_USERNAME e AUTHIO_ADMIN_PASSWORD precisam apontar para um usuário system do realm. Sem eles o token administrativo sai sem permissão e todo endpoint /api/v1/admin responde 403.'
  }

  if (!realmName()) {
    return 'NEXT_PUBLIC_AUTHIO_ISSUER não segue o formato {base}/realms/{realm}, então o realm não pôde ser derivado.'
  }

  return null
}
