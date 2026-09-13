import { getUser, rolesOf, updateUser } from '@/lib/authio'
import { ROLES } from '@/lib/authz'
import { adminConfigured, adminGap } from '@/lib/env'
import { requireRole } from '@/lib/session'

/**
 * Replaces the roles a team member holds.
 *
 * The whole set is sent: Authio removes any role not in the list and adds any
 * that is new, so this is an assignment, not an append. That is also why the
 * screen sends the complete selection rather than a delta.
 *
 * The change takes effect in Authio immediately and in the affected person's
 * token only on their next one -- roles are minted into a token when it is
 * issued. A demotion that has to bite right now needs the session revoked as
 * well, which is a different call.
 *
 * @param request - The incoming request, carrying the role names.
 * @param context - Route parameters, carrying the Authio user id.
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ userId: string }> },
): Promise<Response> {
  const guard = await requireRole(ROLES.admin)

  if (!guard.ok) {
    return guard.response
  }

  if (!adminConfigured()) {
    return Response.json({ error: adminGap() }, { status: 503 })
  }

  const { userId } = await context.params

  const body = (await request.json().catch(() => null)) as { roles?: unknown } | null

  if (!body || !Array.isArray(body.roles) || body.roles.some((role) => typeof role !== 'string')) {
    return Response.json(
      { error: 'Envie { "roles": ["nome-do-papel", ...] }. Uma lista vazia remove todos os papéis.' },
      { status: 400 },
    )
  }

  if (userId === guard.caller.userId && !body.roles.includes(ROLES.admin)) {
    return Response.json(
      {
        error:
          'Você está removendo o seu próprio papel de administrador. Peça para outro administrador fazer isso, ou o painel de equipe fica sem ninguém que possa abri-lo.',
      },
      { status: 409 },
    )
  }

  const current = await getUser(userId)

  if (!current.ok || !current.data) {
    return Response.json(
      { error: current.message ?? 'Usuário não encontrado neste client.' },
      { status: current.status },
    )
  }

  const result = await updateUser({
    id: current.data.id,
    firstName: current.data.firstName ?? '',
    lastName: current.data.lastName ?? '',
    phoneNumber: current.data.phoneNumber ?? '',
    email: current.data.email,
    emailConfirmed: current.data.emailConfirmed,
    phoneNumberConfirmed: current.data.phoneNumberConfirmed,
    twoFactorEnabled: current.data.twoFactorEnabled,
    lockoutEnabled: current.data.lockoutEnabled,
    roles: body.roles as string[],
  })

  if (!result.ok) {
    return Response.json(
      { error: result.message ?? 'O Authio recusou a troca de papéis.' },
      { status: result.status },
    )
  }

  const refreshed = await getUser(userId)

  return Response.json({
    message: 'Papéis atualizados no Authio. Eles entram no token da pessoa no próximo login.',
    roles: refreshed.ok && refreshed.data ? rolesOf(refreshed.data) : (body.roles as string[]),
  })
}
