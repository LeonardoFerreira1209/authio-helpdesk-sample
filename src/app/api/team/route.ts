import { listAssignableRoles, listUsers, rolesOf } from '@/lib/authio'
import { ROLES } from '@/lib/authz'
import { adminConfigured, adminGap } from '@/lib/env'
import { requireRole } from '@/lib/session'

/**
 * The team, read from Authio.
 *
 * This is the application's user list, and it is not stored here: the users
 * belong to the Authio client, and this endpoint is a read through to it. The
 * roles assignable to a user come back in the same response so the screen never
 * has to guess which names are real.
 */
export async function GET(request: Request): Promise<Response> {
  const guard = await requireRole(ROLES.admin)

  if (!guard.ok) {
    return guard.response
  }

  if (!adminConfigured()) {
    return Response.json({ error: adminGap() }, { status: 503 })
  }

  const url = new URL(request.url)
  const search = url.searchParams.get('search') ?? undefined
  const page = Number(url.searchParams.get('page') ?? '1')

  const [users, roles] = await Promise.all([
    listUsers(Number.isFinite(page) && page > 0 ? page : 1, 20, search),
    listAssignableRoles(),
  ])

  if (!users.ok) {
    return Response.json(
      { error: users.message ?? 'Não foi possível listar os usuários no Authio.' },
      { status: users.status },
    )
  }

  return Response.json({
    totalCount: users.totalCount,
    users: users.items.map((user) => ({
      id: user.id,
      userName: user.userName,
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' '),
      status: user.status,
      roles: rolesOf(user),
    })),
    // A failure here is not fatal: the list still renders, the role picker just
    // falls back to the names this application knows about.
    assignableRoles: roles.ok ? roles.items.map((role) => role.name) : Object.values(ROLES),
    rolesMessage: roles.ok ? null : roles.message,
  })
}
