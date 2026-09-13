import { AccountForm } from '@/components/account-form'
import { claimValue, DEPARTMENT_CLAIM, ROLES } from '@/lib/authz'
import { adminGap } from '@/lib/env'
import { requirePage } from '@/lib/guard'

/** What each role lets someone do, in the product's own words. */
const ROLE_MEANING: Record<string, string> = {
  [ROLES.admin]: 'Administra a equipe e atende chamados.',
  [ROLES.agent]: 'Atende: assume chamados, muda status e responde.',
  [ROLES.viewer]: 'Acompanha a fila, sem alterar nada.',
}

/**
 * The signed-in person's own account.
 */
export default async function AccountPage() {
  const caller = await requirePage()
  const gap = adminGap()
  const department = claimValue(caller.claims, DEPARTMENT_CLAIM)

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Minha conta</h1>
          <p>Seus dados e o acesso que você tem no Helpdesk.</p>
        </div>
      </div>

      <div className="split">
        <div className="card">
          <h2>Dados pessoais</h2>
          <p>Valem para todas as aplicações que usam a mesma conta.</p>

          {gap ? <div className="note warn">Edição indisponível: {gap}</div> : <AccountForm />}
        </div>

        <div className="stack">
          <div className="card">
            <h2>Seu acesso</h2>
            <p>Concedido por um administrador e aplicado no seu login.</p>

            {caller.roles.length > 0 ? (
              <div className="stack" style={{ gap: 10 }}>
                {caller.roles.map((role) => (
                  <div className="note" key={role}>
                    <strong>{role}</strong>
                    {ROLE_MEANING[role.toLowerCase()] ? (
                      <>
                        <br />
                        {ROLE_MEANING[role.toLowerCase()]}
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="note warn">
                Sua conta ainda não tem acesso ao Helpdesk. Peça a um administrador.
              </div>
            )}
          </div>

          <div className="card">
            <h2>Área</h2>
            <p>Define o escopo dos seus relatórios.</p>

            {department ? (
              <span className="badge accent">{department}</span>
            ) : (
              <div className="note">
                Nenhuma área vinculada à sua conta, então a tela de relatórios fica indisponível.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
