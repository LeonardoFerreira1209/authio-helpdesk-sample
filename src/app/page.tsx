import { redirect } from 'next/navigation'

import { SignOutButton } from '@/components/auth-buttons'
import { EndpointsPanel } from '@/components/endpoints-panel'
import { ProfilePanel } from '@/components/profile-panel'
import { TeamPanel } from '@/components/team-panel'
import { businessClaims, hasAnyRole, ROLES } from '@/lib/authz'
import { adminGap, env, realmName } from '@/lib/env'
import { currentCaller } from '@/lib/session'

/**
 * Rendered per request: it reads the session cookie, which is never the same
 * twice and must never be cached.
 */
export const dynamic = 'force-dynamic'

/**
 * The application's single screen.
 *
 * Everything an integration has to get right is visible at once: who Authio says
 * you are, which roles and claims came with the token, what this application
 * reads and writes back to Authio, and what its own endpoints do with those
 * roles and claims.
 */
export default async function HomePage() {
  const caller = await currentCaller()

  if (!caller) {
    redirect('/sign-in')
  }

  const claims = businessClaims(caller.claims)
  const isAdmin = hasAnyRole(caller.roles, [ROLES.admin])
  const gap = adminGap()

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="mark">H</span>
          <span>
            Helpdesk
            <small>
              realm {realmName() || '—'} · client {env.clientId || '—'}
            </small>
          </span>
        </div>
        <div className="who">
          <span>
            <strong>{caller.name || caller.username || caller.email}</strong>
            {caller.email ? <span className="muted"> · {caller.email}</span> : null}
          </span>
          <SignOutButton />
        </div>
      </header>

      <main>
        {gap ? <div className="notice warn">Configuração incompleta: {gap}</div> : null}

        <section className="card">
          <header>
            <h2>
              <span className="verb">token</span>
              Quem o Authio diz que você é
            </h2>
            <p className="hint">
              Papéis e claims são carimbados no access token na emissão. Mudar um papel no Authio
              não altera o token que já está na sua mão — ele vale a partir do próximo login.
            </p>
          </header>

          <div className="row" style={{ marginBottom: 14 }}>
            {caller.roles.length > 0 ? (
              caller.roles.map((role) => (
                <span className="pill brand" key={role}>
                  {role}
                </span>
              ))
            ) : (
              <span className="pill warn">
                nenhum papel no token — os endpoints de chamados vão responder 403
              </span>
            )}
          </div>

          {Object.keys(caller.permissions).length > 0 ? (
            <div className="scroll-x">
              <table>
                <thead>
                  <tr>
                    <th>Papel</th>
                    <th>Permissões que ele carrega</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(caller.permissions).map(([role, permissions]) => (
                    <tr key={role}>
                      <td>
                        <code>{role}</code>
                      </td>
                      <td className="muted">
                        {permissions.length > 0 ? permissions.join(' · ') : 'sem permissões anexadas'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="scroll-x" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Claim</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>sub</code>
                  </td>
                  <td>
                    <code>{caller.userId}</code>
                  </td>
                </tr>
                {claims.map((claim) => (
                  <tr key={claim.name}>
                    <td>
                      <code>{claim.name}</code>
                    </td>
                    <td>{claim.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <ProfilePanel />

        <EndpointsPanel />

        {isAdmin ? (
          <TeamPanel />
        ) : (
          <section className="card">
            <header>
              <h2>
                <span className="verb">GET · PUT</span>
                Equipe
              </h2>
            </header>
            <div className="notice warn">
              Este painel é de quem tem <code>{ROLES.admin}</code>. Seu token traz{' '}
              {caller.roles.length > 0 ? <code>{caller.roles.join(', ')}</code> : 'nenhum papel'} — o
              botão <code>GET /api/team</code> acima continua disponível e responde 403, que é
              exatamente o que outro chamador receberia.
            </div>
          </section>
        )}
      </main>
    </>
  )
}
