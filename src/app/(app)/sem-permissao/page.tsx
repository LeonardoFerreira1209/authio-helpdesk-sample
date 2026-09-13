import Link from 'next/link'

import { requirePage } from '@/lib/guard'

/**
 * Where a guard sends someone who is signed in but not allowed in.
 *
 * It says which access is missing and who grants it. A dead end that only says
 * "acesso negado" sends the person to open a ticket about the ticket system.
 *
 * @param props.searchParams - Carries the roles the area required.
 */
export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ precisa?: string }>
}) {
  const caller = await requirePage()
  const { precisa } = await searchParams
  const required = (precisa ?? '').split(',').filter(Boolean)

  return (
    <div className="stack" style={{ maxWidth: 620 }}>
      <div className="page-head">
        <div>
          <h1>Você não tem acesso a esta área</h1>
          <p>Sua sessão está válida — o que falta é permissão.</p>
        </div>
      </div>

      <div className="card">
        {required.length > 0 ? (
          <>
            <h2>Acesso necessário</h2>
            <div className="row" style={{ marginBottom: 16 }}>
              {required.map((role) => (
                <span className="badge accent" key={role}>
                  {role}
                </span>
              ))}
            </div>
          </>
        ) : null}

        <h2>O que você tem hoje</h2>
        <div className="row" style={{ marginBottom: 16 }}>
          {caller.roles.length > 0 ? (
            caller.roles.map((role) => (
              <span className="badge" key={role}>
                {role}
              </span>
            ))
          ) : (
            <span className="badge warn">nenhum papel atribuído</span>
          )}
        </div>

        <div className="note">
          Um administrador do Helpdesk concede o acesso. Depois disso é preciso sair e entrar de
          novo: as permissões são gravadas na sessão no momento do login.
        </div>

        <div className="row" style={{ marginTop: 18 }}>
          <Link className="button" href="/">
            Voltar ao início
          </Link>
          <Link className="button" href="/minha-conta">
            Ver meu acesso
          </Link>
        </div>
      </div>
    </div>
  )
}
