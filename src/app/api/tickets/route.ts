import { ROLES } from '@/lib/authz'
import { requireRole } from '@/lib/session'
import { listTickets } from '@/lib/tickets'

/**
 * The ticket queue.
 *
 * Readable by anyone holding one of the three helpdesk roles. This is the
 * plainest kind of role check there is: the endpoint does not care which of
 * them the caller has, only that they have one.
 */
export async function GET(): Promise<Response> {
  const guard = await requireRole(ROLES.viewer, ROLES.agent, ROLES.admin)

  if (!guard.ok) {
    return guard.response
  }

  return Response.json({
    tickets: listTickets(),
    readAs: guard.caller.roles,
  })
}
