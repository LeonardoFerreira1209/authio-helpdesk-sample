import { ROLES } from '@/lib/authz'
import { requireRole } from '@/lib/session'
import { commentOnTicket, findTicket } from '@/lib/tickets'

/**
 * Replies to a ticket.
 *
 * The author is taken from the session, never from the body: an endpoint that
 * trusts the client to say who is writing lets anyone sign a note with anyone
 * else's name.
 *
 * @param request - The incoming request, carrying the note.
 * @param context - Route parameters, carrying the ticket id.
 */
export async function POST(
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

  const payload = (await request.json().catch(() => null)) as { body?: unknown } | null
  const body = typeof payload?.body === 'string' ? payload.body.trim() : ''

  if (!body) {
    return Response.json({ error: 'A resposta não pode ser vazia.' }, { status: 400 })
  }

  const author = guard.caller.username || guard.caller.email || guard.caller.userId
  const ticket = commentOnTicket(ticketId, author, body)

  return Response.json({ message: 'Resposta registrada.', ticket })
}
