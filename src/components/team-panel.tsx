'use client'

import { useCallback, useEffect, useState } from 'react'

import { callApi, errorText, type ApiCall } from '@/lib/http'

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
  rolesMessage: string | null
}

/**
 * The team, read from Authio, with the roles editable in place.
 *
 * Only a `helpdesk.admin` gets past the guard on `/api/team`; everyone else sees
 * the 403 body, which is itself the point of having this panel visible to them.
 */
export function TeamPanel() {
  const [team, setTeam] = useState<TeamResponse | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<ApiCall | null>(null)

  const load = useCallback(async (term: string) => {
    setBusy(true)

    const call = await callApi(`/api/team${term ? `?search=${encodeURIComponent(term)}` : ''}`)

    setLast(call)
    setTeam(call.ok ? (call.body as TeamResponse) : null)
    setEditing(null)
    setBusy(false)
  }, [])

  useEffect(() => {
    void load('')
  }, [load])

  const startEditing = (member: TeamMember) => {
    setEditing(member.id)
    setDraft(member.roles)
  }

  const toggle = (role: string) => {
    setDraft((current) =>
      current.includes(role) ? current.filter((entry) => entry !== role) : [...current, role],
    )
  }

  const saveRoles = async (member: TeamMember) => {
    setBusy(true)

    const call = await callApi(`/api/team/${encodeURIComponent(member.id)}`, {
      method: 'PUT',
      body: { roles: draft },
    })

    setLast(call)
    setBusy(false)

    if (call.ok) {
      await load(search)
    }
  }

  return (
    <section className="card">
      <header>
        <h2>
          <span className="verb">GET · PUT</span>
          Equipe
        </h2>
        <p className="hint">
          A base de usuários é a do client no Authio — esta aplicação não guarda nenhuma. A troca de
          papéis substitui o conjunto inteiro: o que não estiver marcado é removido.
        </p>
      </header>

      <div className="row" style={{ marginBottom: 12 }}>
        <input
          style={{ maxWidth: 240 }}
          placeholder="Buscar por nome ou e-mail"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void load(search)
            }
          }}
        />
        <button disabled={busy} onClick={() => void load(search)}>
          Buscar
        </button>
      </div>

      {last && !last.ok ? (
        <div className="notice error">
          HTTP {last.status} — {errorText(last.body) ?? 'sem detalhe'}
        </div>
      ) : null}

      {team ? (
        <>
          <div className="scroll-x">
            <table>
              <thead>
                <tr>
                  <th>Pessoa</th>
                  <th>Papéis</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {team.users.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.name || member.userName}</strong>{' '}
                      <span className="pill">{String(member.status)}</span>
                      <br />
                      <span className="muted">{member.email}</span>
                    </td>
                    <td>
                      {editing === member.id ? (
                        <div className="row">
                          {team.assignableRoles.map((role) => (
                            <label
                              key={role}
                              style={{ display: 'flex', gap: 6, alignItems: 'center', margin: 0 }}
                            >
                              <input
                                type="checkbox"
                                style={{ width: 'auto' }}
                                checked={draft.includes(role)}
                                onChange={() => toggle(role)}
                              />
                              <code>{role}</code>
                            </label>
                          ))}
                        </div>
                      ) : member.roles.length > 0 ? (
                        <div className="row">
                          {member.roles.map((role) => (
                            <span className="pill brand" key={role}>
                              {role}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="muted">sem papéis</span>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {editing === member.id ? (
                        <div className="row">
                          <button
                            className="primary"
                            disabled={busy}
                            onClick={() => void saveRoles(member)}
                          >
                            Salvar
                          </button>
                          <button disabled={busy} onClick={() => setEditing(null)}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEditing(member)}>Editar papéis</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="hint">
            {team.totalCount} usuário(s) neste client.{' '}
            {team.rolesMessage
              ? `Os papéis atribuíveis não puderam ser lidos (${team.rolesMessage}), então a lista acima é a que esta aplicação conhece.`
              : 'A lista de papéis vem de /api/v1/admin/roles/assignable/user.'}
          </p>
        </>
      ) : null}

      {last?.ok && last.body && typeof last.body === 'object' && 'message' in last.body ? (
        <div className="notice ok">{String((last.body as { message: unknown }).message)}</div>
      ) : null}
    </section>
  )
}
