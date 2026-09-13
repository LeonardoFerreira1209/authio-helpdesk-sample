'use client'

import { useCallback, useEffect, useState } from 'react'

import { ROLES } from '@/lib/authz'
import { callApi, errorText } from '@/lib/http'

interface TeamMember {
  id: string
  userName: string
  email: string
  name: string
  status: string | number
  roles: string[]
}

interface TeamResponse {
  totalCount: number
  users: TeamMember[]
  assignableRoles: string[]
}

/** The roles this screen manages. Anything else a person holds is left alone. */
const MANAGED = [ROLES.admin, ROLES.agent, ROLES.viewer] as const

/**
 * Whether a role is one of the ones this screen manages.
 *
 * @param role - The role name.
 */
function isManaged(role: string): boolean {
  return MANAGED.some((managed) => managed.toLowerCase() === role.toLowerCase())
}

/**
 * The team, read from the identity provider, with the Helpdesk roles editable.
 *
 * The provider replaces the whole role set on save, so roles this screen does
 * not manage are read from the person and sent back untouched. Without that,
 * granting someone `helpdesk.agent` here would silently strip every role they
 * hold in other systems.
 *
 * @param props.currentUserId - The signed-in admin, so the screen can warn about self-demotion.
 */
export function TeamTable({ currentUserId }: { currentUserId: string }) {
  const [team, setTeam] = useState<TeamResponse | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: string; text: string } | null>(null)

  const load = useCallback(async (term: string) => {
    setBusy(true)

    const call = await callApi(`/api/team${term ? `?search=${encodeURIComponent(term)}` : ''}`)

    setBusy(false)
    setEditing(null)

    if (call.ok) {
      setTeam(call.body as TeamResponse)
      setFeedback(null)

      return
    }

    setTeam(null)
    setFeedback({
      tone: call.status === 403 ? 'warn' : 'danger',
      text: errorText(call.body) ?? 'Não foi possível carregar a equipe.',
    })
  }, [])

  useEffect(() => {
    void load('')
  }, [load])

  const save = async (member: TeamMember) => {
    setBusy(true)
    setFeedback(null)

    const untouched = member.roles.filter((role) => !isManaged(role))

    const call = await callApi(`/api/team/${encodeURIComponent(member.id)}`, {
      method: 'PUT',
      body: { roles: [...untouched, ...draft] },
    })

    setBusy(false)

    if (call.ok) {
      setFeedback({
        tone: 'ok',
        text: `Acesso de ${member.name || member.userName} atualizado. Vale a partir do próximo login da pessoa.`,
      })
      await load(search)

      return
    }

    setFeedback({
      tone: call.status === 403 || call.status === 409 ? 'warn' : 'danger',
      text: errorText(call.body) ?? 'Não foi possível salvar.',
    })
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="toolbar">
          <div className="grow">
            <input
              placeholder="Buscar por nome ou e-mail"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void load(search)
                }
              }}
            />
          </div>
          <button className="primary" disabled={busy} onClick={() => void load(search)}>
            Buscar
          </button>
        </div>
      </div>

      {feedback ? (
        <div className={`note ${feedback.tone}`} style={{ marginBottom: 18 }}>
          {feedback.text}
        </div>
      ) : null}

      <div className="card flush">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pessoa</th>
                <th>Acesso no Helpdesk</th>
                <th style={{ width: 200 }} />
              </tr>
            </thead>
            <tbody>
              {(team?.users ?? []).map((member) => {
                const managed = member.roles.filter(isManaged)
                const others = member.roles.filter((role) => !isManaged(role))

                return (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.name || member.userName}</strong>
                      {member.id === currentUserId ? (
                        <span className="badge" style={{ marginLeft: 8 }}>
                          você
                        </span>
                      ) : null}
                      <br />
                      <span className="muted">{member.email}</span>
                    </td>

                    <td>
                      {editing === member.id ? (
                        <div className="row">
                          {MANAGED.map((role) => (
                            <label
                              key={role}
                              style={{ display: 'flex', gap: 6, alignItems: 'center', margin: 0 }}
                            >
                              <input
                                type="checkbox"
                                style={{ width: 'auto' }}
                                checked={draft.some((entry) => entry.toLowerCase() === role)}
                                onChange={() =>
                                  setDraft((current) =>
                                    current.some((entry) => entry.toLowerCase() === role)
                                      ? current.filter((entry) => entry.toLowerCase() !== role)
                                      : [...current, role],
                                  )
                                }
                              />
                              {role.replace('helpdesk.', '')}
                            </label>
                          ))}
                        </div>
                      ) : managed.length > 0 ? (
                        <div className="row">
                          {managed.map((role) => (
                            <span className="badge accent" key={role}>
                              {role.replace('helpdesk.', '')}
                            </span>
                          ))}
                          {others.length > 0 ? (
                            <span className="badge" title={others.join(', ')}>
                              +{others.length} fora do Helpdesk
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="muted">sem acesso</span>
                      )}
                    </td>

                    <td>
                      {editing === member.id ? (
                        <div className="row">
                          <button className="primary" disabled={busy} onClick={() => void save(member)}>
                            Salvar
                          </button>
                          <button className="subtle" disabled={busy} onClick={() => setEditing(null)}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditing(member.id)
                            setDraft(managed)
                          }}
                        >
                          Alterar acesso
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {team && team.users.length === 0 ? (
          <div className="empty">Nenhuma pessoa encontrada.</div>
        ) : null}

        {team ? (
          <footer>
            {team.totalCount} pessoa(s) com conta nesta aplicação. Papéis fora do Helpdesk não são
            alterados por esta tela.
          </footer>
        ) : null}
      </div>
    </>
  )
}
