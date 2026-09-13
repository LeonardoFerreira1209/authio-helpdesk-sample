/**
 * The claims carried by a token, as a plain object.
 */
export type Claims = Record<string, unknown>

/**
 * Reads the payload of a JWT without verifying it.
 *
 * Verification is deliberately absent: this application only ever decodes a
 * token it received itself, over TLS, from the exchange it started. A resource
 * server receiving a token from a caller is the case that must verify the
 * signature against the realm's JWKS -- and that is a different job from
 * showing the operator what is inside their own session.
 *
 * @param token - A compact JWS, or `undefined` when there is no token.
 */
export function decodeClaims(token: string | undefined | null): Claims | null {
  if (!token) {
    return null
  }

  const parts = token.split('.')

  if (parts.length < 2) {
    return null
  }

  try {
    const payload = Buffer.from(
      parts[1].replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8')

    const parsed: unknown = JSON.parse(payload)

    return parsed && typeof parsed === 'object' ? (parsed as Claims) : null
  } catch {
    return null
  }
}
