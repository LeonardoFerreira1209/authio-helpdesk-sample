import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CommentBox } from '@/components/comment-box'
import { ArrowLeftIcon } from '@/components/icons'
import { TicketActions } from '@/components/ticket-actions'
import { PriorityBadge, StatusBadge } from '@/components/ticket-badges'
import { avatarTone, initialsOf } from '@/lib/avatar'
import { hasAnyRole, ROLES } from '@/lib/authz'
import { fullDate, relative } from '@/lib/format'
import { requirePageRole } from '@/lib/guard'
import { findTicket } from '@/lib/tickets'

/**
 * One ticket, with the actions the person's role allows.
 *
 * A `helpdesk.viewer` sees exactly the same page with the controls disabled and
 * a line saying why -- which is how a product explains a permission, rather than
 * hiding the feature and leaving someone to wonder where it went.
 *
 * @param props.params - Route parameters, carrying the ticket id.
 */
export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const caller = await requirePageRole(ROLES.viewer, ROLES.agent, ROLES.admin)
  const { id } = await params
  const ticket = findTicket(decodeURIComponent(id))

  if (!ticket) {
    notFound()
  }

  const canWrite = hasAnyRole(caller.roles, [ROLES.agent, ROLES.admin])

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <Link className="eyebrow" href="/chamados">
            <ArrowLeftIcon size={14} />
            Chamados
          </Link>
          <h1 style={{ marginTop: 6 }}>{ticket.subject}</h1>
          <p>
            <span className="id">{ticket.id}</span> · aberto por {ticket.requesterName}{' '}
            {relative(ticket.createdAt)}
          </p>
        </div>
        <div className="row">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <div className="split">
        <div className="stack">
          <div className="card">
            <h2>Descrição</h2>
            <p style={{ margin: 0 }}>{ticket.description}</p>
          </div>

          <div className="card">
            <h2>Histórico</h2>
            <p>{ticket.comments.length} interação(ões) registrada(s).</p>

            {ticket.comments.length > 0 ? (
              <div className="thread">
                {ticket.comments.map((comment) => (
                  <div className="thread-item" key={comment.id}>
                    <span className={`avatar sm avatar-${avatarTone(comment.author)}`}>
                      {initialsOf(comment.author, comment.author)}
                    </span>
                    <div className="thread-bubble">
                      <header>
                        <strong>{comment.author}</strong>
                        <span>{fullDate(comment.at)}</span>
                      </header>
                      <p>{comment.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="note">Nenhuma resposta ainda.</div>
            )}

            <div style={{ marginTop: 16 }}>
              <CommentBox ticketId={ticket.id} canWrite={canWrite} />
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h2>Atendimento</h2>
            <p>Mudanças valem para todo mundo que abrir este chamado.</p>

            <TicketActions
              ticketId={ticket.id}
              status={ticket.status}
              priority={ticket.priority}
              assignee={ticket.assignee}
              canWrite={canWrite}
              username={caller.username}
            />
          </div>

          <div className="card">
            <h2>Detalhes</h2>
            <dl className="definition">
              <div>
                <dt>Solicitante</dt>
                <dd>{ticket.requesterName}</dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>{ticket.requesterEmail}</dd>
              </div>
              <div>
                <dt>Área</dt>
                <dd>{ticket.department}</dd>
              </div>
              <div>
                <dt>Responsável</dt>
                <dd>{ticket.assignee ?? 'ninguém'}</dd>
              </div>
              <div>
                <dt>Aberto em</dt>
                <dd>{fullDate(ticket.createdAt)}</dd>
              </div>
              <div>
                <dt>Atualizado</dt>
                <dd>{fullDate(ticket.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
