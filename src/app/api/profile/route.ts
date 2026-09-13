import { getUser, rolesOf, updateUser } from '@/lib/authio'
import { adminConfigured, adminGap } from '@/lib/env'
import { requireCaller } from '@/lib/session'

/**
 * The signed-in user's own profile, as Authio holds it.
 *
 * Any authenticated caller may read it, and the id is taken from the token's
 * `sub` rather than from the request: an endpoint that reads the user id from
 * the body lets anyone read anyone.
 */
export async function GET(): Promise<Response> {
  const guard = await requireCaller()

  if (!guard.ok) {
    return guard.response
  }

  if (!adminConfigured()) {
    return Response.json({ error: adminGap() }, { status: 503 })
  }

  const result = await getUser(guard.caller.userId)

  if (!result.ok || !result.data) {
    return Response.json(
      { error: result.message ?? 'Não foi possível ler o perfil no Authio.' },
      { status: result.status },
    )
  }

  return Response.json({
    id: result.data.id,
    userName: result.data.userName,
    email: result.data.email,
    firstName: result.data.firstName ?? '',
    lastName: result.data.lastName ?? '',
    phoneNumber: result.data.phoneNumber ?? '',
    emailConfirmed: result.data.emailConfirmed,
    roles: rolesOf(result.data),
    updated: result.data.updated,
  })
}

/**
 * Updates the signed-in user's own profile.
 *
 * Only the three fields a person may change about themselves are taken from the
 * body. Everything else -- e-mail, the confirmation flags, and above all the
 * roles -- is read back from Authio and sent as it stands: an update is a full
 * representation, so a body that omits `emailConfirmed` would land as `false`
 * and unconfirm an address nobody asked to change.
 *
 * Leaving `roles` out of the payload entirely is what keeps this endpoint from
 * being a privilege escalation: if it forwarded the roles from the body, any
 * user could grant themselves `helpdesk.admin` by editing their own name.
 *
 * @param request - The incoming request, carrying the profile fields.
 */
export async function PUT(request: Request): Promise<Response> {
  const guard = await requireCaller()

  if (!guard.ok) {
    return guard.response
  }

  if (!adminConfigured()) {
    return Response.json({ error: adminGap() }, { status: 503 })
  }

  const body = (await request.json().catch(() => null)) as {
    firstName?: string
    lastName?: string
    phoneNumber?: string
  } | null

  if (!body) {
    return Response.json({ error: 'Corpo da requisição não é um JSON válido.' }, { status: 400 })
  }

  const current = await getUser(guard.caller.userId)

  if (!current.ok || !current.data) {
    return Response.json(
      { error: current.message ?? 'Não foi possível ler o perfil antes de gravar.' },
      { status: current.status },
    )
  }

  const result = await updateUser({
    id: current.data.id,
    firstName: body.firstName ?? current.data.firstName ?? '',
    lastName: body.lastName ?? current.data.lastName ?? '',
    phoneNumber: body.phoneNumber ?? current.data.phoneNumber ?? '',
    email: current.data.email,
    emailConfirmed: current.data.emailConfirmed,
    phoneNumberConfirmed: current.data.phoneNumberConfirmed,
    twoFactorEnabled: current.data.twoFactorEnabled,
    lockoutEnabled: current.data.lockoutEnabled,
  })

  if (!result.ok) {
    return Response.json(
      { error: result.message ?? 'O Authio recusou a gravação do perfil.' },
      { status: result.status },
    )
  }

  return Response.json({
    message: 'Perfil atualizado no Authio.',
    profile: {
      firstName: body.firstName ?? current.data.firstName ?? '',
      lastName: body.lastName ?? current.data.lastName ?? '',
      phoneNumber: body.phoneNumber ?? current.data.phoneNumber ?? '',
    },
  })
}
