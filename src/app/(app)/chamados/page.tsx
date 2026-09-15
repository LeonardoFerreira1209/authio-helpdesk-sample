import Link from 'next/link'

import { EmptyState } from '@/components/empty-state'
import { InboxIcon, SearchIcon } from '@/components/icons'
import { PriorityBadge, StatusBadge } from '@/components/ticket-badges'
import { hasAnyRole, ROLES } from '@/lib/authz'
import { relative } from '@/lib/format'
import { requirePageRole } from '@/lib/guard'
import { DEPARTMENTS, listTickets, STATUS_LABEL, TICKET_STATUSES } from '@/lib/tickets'

/**
 * The queue.
 *
 * Reachable by the three helpdesk roles. The filters are plain query strings
 * handled on the server -- no client state to keep in sync, and a filtered view
 * is a link somebody can send to a colleague.
 *
 * @param props.searchParams - Filters from the query string.
 */
export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; area?: string; q?: string }>
}) {
  const caller = await requirePageRole(ROLES.viewer, ROLES.agent, ROLES.admin)
  const filters = await searchParams

  const readOnly = !hasAnyRole(caller.roles, [ROLES.agent, ROLES.admin])

  const tickets = listTickets().filter((ticket) => {
    if (filters.status && ticket.status !== filters.status) {
      return false
    }

    if (filters.area && ticket.department !== filters.area) {
      return false
    }

    if (filters.q) {
      const needle = filters.q.toLowerCase()

      return (
        ticket.subject.toLowerCase().includes(needle) ||
        ticket.id.toLowerCase().includes(needle) ||
        ticket.requesterName.toLowerCase().includes(needle)
      )
    }

    return true
  })

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Chamados</h1>
          <p>
            {tickets.length} chamado(s){filters.status || filters.area || filters.q ? ' no filtro' : ' na fila'}.
          </p>
        </div>
        {readOnly ? (
          <span className="badge warn">Somente leitura — seu papel não permite editar</span>
        ) : null}
      </div>

      <form className="card">
        <div className="toolbar">
          <div className="grow input-icon">
            <SearchIcon size={15} />
            <input name="q" placeholder="Buscar por assunto, número ou solicitante" defaultValue={filters.q ?? ''} />
          </div>
          <select name="status" defaultValue={filters.status ?? ''} style={{ width: 190 }}>
            <option value="">Todos os status</option>
            {TICKET_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          <select name="area" defaultValue={filters.area ?? ''} style={{ width: 180 }}>
            <option value="">Todas as áreas</option>
            {DEPARTMENTS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
          <button className="primary" type="submit">
            Filtrar
          </button>
          <Link className="button" href="/chamados">
            Limpar
          </Link>
        </div>
      </form>

      <div className="card flush">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Chamado</th>
                <th>Solicitante</th>
                <th>Área</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <span className="id">{ticket.id}</span>
                    <br />
                    <Link className="subject" href={`/chamados/${ticket.id}`}>
                      {ticket.subject}
                    </Link>
                  </td>
                  <td>
                    {ticket.requesterName}
                    <br />
                    <span className="muted">{ticket.requesterEmail}</span>
                  </td>
                  <td className="muted">{ticket.department}</td>
                  <td>
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td>
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="muted">{ticket.assignee ?? '—'}</td>
                  <td className="muted">{relative(ticket.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tickets.length === 0 ? (
          <EmptyState
            icon={<InboxIcon size={26} />}
            title="Nenhum chamado com esses filtros"
            description="Ajuste a busca ou limpe os filtros para ver a fila inteira."
            action={
              <Link className="button" href="/chamados">
                Limpar filtros
              </Link>
            }
          />
        ) : null}
      </div>
    </div>
  )
}
