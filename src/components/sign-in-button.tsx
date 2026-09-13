'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

/**
 * Hands the browser to the identity provider.
 *
 * There is no password field anywhere in this application, and that is the
 * point of the integration: the credential is never typed here, so there is
 * nothing here to steal it from.
 */
export function SignInButton() {
  const [busy, setBusy] = useState(false)

  return (
    <button
      className="primary"
      style={{ width: '100%' }}
      disabled={busy}
      onClick={() => {
        setBusy(true)
        void signIn('authio', { callbackUrl: '/' })
      }}
    >
      {busy ? 'Redirecionando...' : 'Entrar'}
    </button>
  )
}
