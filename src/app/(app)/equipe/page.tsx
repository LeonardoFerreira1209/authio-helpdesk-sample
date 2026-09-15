import { AlertTriangleIcon } from '@/components/icons'
import { TeamTable } from '@/components/team-table'
import { ROLES } from '@/lib/authz'
import { adminGap } from '@/lib/env'
import { requirePageRole } from '@/lib/guard'

/**
 * Team administration.
 *
 * The people listed here are not stored by this application: they are the
 * accounts of its client at the identity provider, and this screen reads and
 * writes them through the provider's administrative API.
 */
export default async function TeamPage() {
  const caller = await requirePageRole(ROLES.admin)
  const gap = adminGap()

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Equipe</h1>
          <p>Quem tem acesso ao Helpdesk e com qual papel.</p>
        </div>
      </div>

      {gap ? (
        <div className="note danger">
          <AlertTriangleIcon size={16} />A administração de usuários está indisponível: {gap}
        </div>
      ) : (
        <TeamTable currentUserId={caller.userId} />
      )}
    </div>
  )
}
