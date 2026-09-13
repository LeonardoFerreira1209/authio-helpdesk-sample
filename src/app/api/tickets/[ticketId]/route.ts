import { ROLES } from '@/lib/authz'
import { requireRole } from '@/lib/session'
import {
  findTicket,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  updateTicket,
  type TicketPriority,
  type TicketStatus,
} from '@/lib/tickets'

/**
 * Writes to a ticket.
 *
 * The pair with `GET /api/tickets` is the point: the same three roles can read
 * the queue, and only two of them can change anything in it. A `helpdesk.viewer`
 * that gets 200 on the list and 403 here is the authorisation model working, not
 * a bug.
 *
 * @param request - The incoming request, carrying the fields to change.
 * @param context - Route parameters, carrying the ticket id.
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ ticketId: string }> },
): Promise<Response> {
  const guard = await requireRole(ROLES.agent, ROLES.admin)

  if (!guard.ok) {
    return guard.response
  }

  const { ticketId } = await context.params

  if (!findTicket(ticketId)) {
    return Response.json({ error: `Chamado ${ticketId} não existe.` }, { status: 404 })
  }

  const body = (await request.json().catch(() => null)) as {
    status?: string
    priority?: string
    assignee?: string | null
  } | null

  if (!body) {
    return Response.json({ error: 'Corpo da requisição não é um JSON válido.' }, { status: 400 })
  }

  if (body.status && !TICKET_STATUSES.includes(body.status as TicketStatus)) {
    return Response.json(
      { error: `status inválido. Use um de: ${TICKET_STATUSES.join(', ')}.` },
      { status: 400 },
    )
  }

  if (body.priority && !TICKET_PRIORITIES.includes(body.priority as TicketPriority)) {
    return Response.json(
      { error: `priority inválida. Use uma de: ${TICKET_PRIORITIES.join(', ')}.` },
      { status: 400 },
    )
  }

  const ticket = updateTicket(ticketId, {
    status: body.status as TicketStatus | undefined,
    priority: body.priority as TicketPriority | undefined,
    // A ticket assigned to nobody is a real state, so `null` has to survive the
    // trip while an absent property still means "leave it alone".
    assignee:
      body.assignee === undefined
        ? undefined
        : body.assignee === null || body.assignee === ''
          ? null
          : body.assignee,
  })

  return Response.json({
    message: `Chamado ${ticketId} atualizado por ${guard.caller.username || guard.caller.email}.`,
    ticket,
  })
}
