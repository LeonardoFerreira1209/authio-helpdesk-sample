import { redirect } from 'next/navigation'

import { CheckCircleIcon } from '@/components/icons'
import { SignInButton } from '@/components/sign-in-button'
import { loginConfigured } from '@/lib/env'
import { currentCaller } from '@/lib/session'

/**
 * Reads the session cookie, so it can never be cached.
 */
export const dynamic = 'force-dynamic'

/** What the brand panel promises, in the order it matters to a support desk. */
const FEATURES = [
  'Fila única para toda a equipe, com filtros por status e área.',
  'Acesso concedido por papel: quem só acompanha nunca altera nada.',
  'Login com a sua conta corporativa -- nenhuma senha nova para lembrar.',
]

/**
 * The sign-in screen.
 */
export default async function SignInPage() {
  const caller = await currentCaller()

  if (caller) {
    redirect('/')
  }

  return (
    <div className="gate">
      <section className="gate-panel">
        <div className="mark">H</div>

        <div>
          <h2>Uma fila só, com o acesso de cada pessoa já resolvido no login.</h2>

          <ul className="gate-features">
            {FEATURES.map((feature) => (
              <li key={feature}>
                <CheckCircleIcon size={18} />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <footer>Aplicação de exemplo -- identidade delegada ao Authio.</footer>
      </section>

      <div className="gate-form">
        <section className="card">
          <div className="mark">H</div>
          <h1>Entrar no Helpdesk</h1>
          <p>Atendimento interno. Entre com a sua conta corporativa.</p>

          {loginConfigured() ? (
            <SignInButton />
          ) : (
            <div className="note danger" style={{ textAlign: 'left' }}>
              Faltam variáveis de ambiente para o login. Copie <code>.env.example</code> para{' '}
              <code>.env.local</code> e preencha <code>NEXT_PUBLIC_AUTHIO_ISSUER</code>,{' '}
              <code>AUTHIO_ID</code>, <code>AUTHIO_CLIENT_SECRET</code> e <code>AUTH_SECRET</code>.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
