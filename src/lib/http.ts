/**
 * What a call to this application's own API returned.
 *
 * The status is kept next to the body because the panels exist to show both:
 * "403 with a body naming the role you are missing" is the whole lesson of the
 * endpoints panel, and a helper that threw on failure would hide it.
 */
export interface ApiCall {
  status: number
  ok: boolean
  body: unknown
  /** How long the round trip took, in milliseconds. */
  elapsedMs: number
}

/**
 * Calls one of this application's endpoints from the browser.
 *
 * The session cookie travels automatically; nothing here handles a token,
 * because the browser never sees one.
 *
 * @param path - The endpoint path, below the origin.
 * @param init - Method and JSON body.
 */
export async function callApi(
  path: string,
  init: { method?: 'GET' | 'PUT' | 'POST' | 'DELETE'; body?: unknown } = {},
): Promise<ApiCall> {
  const started = performance.now()

  try {
    const response = await fetch(path, {
      method: init.method ?? 'GET',
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })

    const text = await response.text()
    let body: unknown = text

    try {
      body = text ? JSON.parse(text) : null
    } catch {
      // Left as text: an HTML error page is still worth showing verbatim.
    }

    return {
      status: response.status,
      ok: response.ok,
      body,
      elapsedMs: Math.round(performance.now() - started),
    }
  } catch (error) {
    return {
      status: 0,
      ok: false,
      body: { error: error instanceof Error ? error.message : 'Falha de rede.' },
      elapsedMs: Math.round(performance.now() - started),
    }
  }
}

/**
 * The `error` field of a JSON error body, when there is one.
 *
 * @param body - The parsed response body.
 */
export function errorText(body: unknown): string | null {
  if (body && typeof body === 'object' && 'error' in body) {
    const message = (body as { error: unknown }).error

    return typeof message === 'string' ? message : JSON.stringify(message)
  }

  return null
}
