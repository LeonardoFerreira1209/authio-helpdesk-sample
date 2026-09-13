import Link from 'next/link'

import { PriorityBadge, StatusBadge } from '@/components/ticket-badges'
import { claimValue, DEPARTMENT_CLAIM, hasAnyRole, ROLES } from '@/lib/authz'
import { relative } from '@/lib/format'
import { requirePage } from '@/lib/guard'
import { listTickets, summarise } from '@/lib/tickets'

/**
 * The dashboard.
 *
 * What it shows depends on what the person holds: someone without any of the
 * three roles lands on an onboarding notice instead of an empty screen, which is
 * what a real product does with an account that was created but not yet given
 * access.
 */
export default async function HomePage() {
  const caller = await requirePage()
  const canRead = hasAnyRole(caller.roles, [ROLES.viewer, ROLES.agent, ROLES.admin])
  const firstName = (caller.name || caller.username || caller.email).split(/[\s@]/)[0]

  if (!canRead) {
    return (
      <div className="stack">
        <div className="page-head">
          <div>
            <h1>Olá, {firstName}</h1>
            <p>Sua conta está ativa, mas ainda sem acesso à fila de atendimento.</p>
          </div>
        </div>

        <div className="card">
          <h2>Acesso pendente</h2>
          <p>
            Peça a um administrador do Helpdesk para atribuir um destes papéis à sua conta. Eles são
            concedidos no provedor de identidade e valem a partir do seu próximo login.
          </p>

          <div className="stack" style={{ marginTop: 16 }}>
            <div className="note">
              <strong>{ROLES.viewer}</strong> — acompanha a fila e lê os chamados, sem alterar nada.
            </div>
            <div className="note">
              <strong>{ROLES.agent}</strong> — atende: assume chamados, muda status e responde.
            </div>
            <div className="note">
              <strong>{ROLES.admin}</strong> — tudo isso, mais a gestão da equipe.
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tickets = listTickets()
  const stats = summarise(tickets)
  const mine = tickets.filter(
    (ticket) => ticket.assignee === caller.username && ticket.status !== 'resolvido',
  )
  const recent = tickets.slice(0, 6)
  const department = claimValue(caller.claims, DEPARTMENT_CLAIM)

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Olá, {firstName}</h1>
          <p>{department ? `Fila de atendimento — área ${department}.` : 'Fila de atendimento.'}</p>
        </div>
        <Link className="button" href="/chamados">
          Ver todos os chamados
        </Link>
      </div>

      <div className="cards">
        <div className="stat">
          <div className="value">{stats.open}</div>
          <div className="label">Abertos</div>
        </div>
        <div className="stat">
          <div className="value">{stats.inProgress}</div>
          <div className="label">Em andamento</div>
        </div>
        <div className="stat">
          <div className="value">{stats.unassigned}</div>
          <div className="label">Sem responsável</div>
        </div>
        <div className="stat">
          <div className="value">{stats.critical}</div>
          <div className="label">Críticos em aberto</div>
        </div>
      </div>

      <div className="card flush">
        <header className="between">
          <h2>Atribuídos a você</h2>
          <span className="muted">{mine.length} em aberto</span>
        </header>

        {mine.length > 0 ? (
          <div className="table-wrap">
            <table>
              <tbody>
                {mine.map((ticket) => (
                  <tr key={ticket.id}>
                    <td style={{ width: 92 }}>
                      <span className="id">{ticket.id}</span>
                    </td>
                    <td>
                      <Link className="subject" href={`/chamados/${ticket.id}`}>
                        {ticket.subject}
                      </Link>
                    </td>
                    <td style={{ width: 150 }}>
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td style={{ width: 100 }}>
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            Nada atribuído a <code>{caller.username || '—'}</code> no momento.
          </div>
        )}
      </div>

      <div className="card flush">
        <header className="between">
          <h2>Movimentação recente</h2>
          <Link className="muted" href="/chamados">
            ver tudo
          </Link>
        </header>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Chamado</th>
                <th>Área</th>
                <th>Status</th>
                <th>Responsável</th>
                <th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <span className="id">{ticket.id}</span>
                    <br />
                    <Link className="subject" href={`/chamados/${ticket.id}`}>
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="muted">{ticket.department}</td>
                  <td>
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="muted">{ticket.assignee ?? '—'}</td>
                  <td className="muted">{relative(ticket.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
