import { redirect } from 'next/navigation'

import { SignInButton } from '@/components/auth-buttons'
import { env, loginConfigured, realmName } from '@/lib/env'
import { currentCaller } from '@/lib/session'

/**
 * Reads the session cookie, so it can never be cached.
 */
export const dynamic = 'force-dynamic'

/**
 * The sign-in screen.
 *
 * There is no form here, and that is the whole point: this application has no
 * password of its own to check. The button hands the browser to Authio, and what
 * comes back is a token.
 */
export default async function SignInPage() {
  const caller = await currentCaller()

  if (caller) {
    redirect('/')
  }

  const configured = loginConfigured()

  return (
    <div className="signin">
      <section className="card">
        <div className="mark">H</div>
        <h1>Helpdesk</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Atendimento interno. A identidade é do Authio.
        </p>

        {configured ? (
          <>
            <div style={{ margin: '18px 0' }}>
              <SignInButton />
            </div>
            <p className="hint">
              realm <code>{realmName()}</code> · client <code>{env.clientId}</code>
            </p>
          </>
        ) : (
          <div className="notice error" style={{ textAlign: 'left' }}>
            Faltam variáveis de ambiente para o login. Copie <code>.env.example</code> para{' '}
            <code>.env.local</code> e preencha <code>NEXT_PUBLIC_AUTHIO_ISSUER</code>,{' '}
            <code>AUTHIO_ID</code>, <code>AUTHIO_CLIENT_SECRET</code> e <code>AUTH_SECRET</code>.
          </div>
        )}
      </section>
    </div>
  )
}
