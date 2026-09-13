import { DEPARTMENT_CLAIM } from '@/lib/authz'
import { requireClaim } from '@/lib/session'
import { reportFor } from '@/lib/tickets'

/**
 * Ticket counts for the caller's own department.
 *
 * Gated on a claim rather than on a role, and the claim is not merely checked
 * for presence -- its value picks the rows. That is the difference worth seeing
 * here: a role would have answered "may this person open a report", and only the
 * claim answers "a report on what".
 *
 * The claim has to be on the user in Authio *and* projected into this client's
 * token by a claim mapper. Present on the user but absent from the token means
 * absent as far as this endpoint is concerned, which is the failure mode the 403
 * body explains.
 */
export async function GET(): Promise<Response> {
  const guard = await requireClaim(DEPARTMENT_CLAIM)

  if (!guard.ok) {
    return guard.response
  }

  const department = String(guard.caller.claims[DEPARTMENT_CLAIM])

  return Response.json({
    scopedBy: { claim: DEPARTMENT_CLAIM, value: department },
    report: reportFor(department),
  })
}
