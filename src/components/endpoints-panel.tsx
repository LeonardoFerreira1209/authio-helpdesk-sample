'use client'

import { useState } from 'react'

import { callApi, type ApiCall } from '@/lib/http'

interface Probe {
  key: string
  method: 'GET' | 'PUT'
  path: string
  requirement: string
  body?: unknown
}

/**
 * The endpoints, with what each one demands of the caller.
 *
 * Kept as data so the screen and the guards stay legible next to each other:
 * the `requirement` text here should read exactly like the check in
 * `lib/session.ts` that enforces it.
 */
const PROBES: Probe[] = [
  {
    key: 'tickets-read',
    method: 'GET',
    path: '/api/tickets',
    requirement: 'papel helpdesk.viewer, helpdesk.agent ou helpdesk.admin',
  },
  {
    key: 'tickets-write',
    method: 'PUT',
    path: '/api/tickets/TCK-1001',
    requirement: 'papel helpdesk.agent ou helpdesk.admin',
    body: { status: 'em_andamento', priority: 'alta' },
  },
  {
    key: 'reports',
    method: 'GET',
    path: '/api/reports',
    requirement: 'claim department no token',
  },
  {
    key: 'team',
    method: 'GET',
    path: '/api/team',
    requirement: 'papel helpdesk.admin',
  },
  {
    key: 'profile',
    method: 'GET',
    path: '/api/profile',
    requirement: 'qualquer sessão válida',
  },
]

/**
 * How a status code should read at a glance.
 *
 * 401 and 403 are separated on purpose: the first says the session is gone, the
 * second says the session is fine and the person is not allowed. They are
 * routinely confused and have opposite fixes.
 *
 * @param status - The HTTP status the endpoint answered with.
 */
function tone(status: number): { className: string; text: string } {
  if (status === 0) {
    return { className: 'error', text: 'sem resposta' }
  }

  if (status === 401) {
    return { className: 'warn', text: '401 — sem sessão' }
  }

  if (status === 403) {
    return { className: 'warn', text: '403 — sem permissão' }
  }

  if (status === 503) {
    return { className: 'warn', text: '503 — app não configurada' }
  }

  return { className: status < 300 ? 'ok' : 'error', text: String(status) }
}

/**
 * A console for this application's own protected endpoints.
 *
 * Every button sends a real request with the session cookie in hand, so what
 * comes back is what any other caller would get. A refusal is as interesting as
 * a success here, and the body of a 403 names the role or claim that was
 * missing.
 */
export function EndpointsPanel() {
  const [results, setResults] = useState<Record<string, ApiCall>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const run = async (probe: Probe) => {
    setBusy(probe.key)

    const call = await callApi(probe.path, { method: probe.method, body: probe.body })

    setResults((current) => ({ ...current, [probe.key]: call }))
    setSelected(probe.key)
    setBusy(null)
  }

  const shown = selected ? results[selected] : null

  return (
    <section className="card">
      <header>
        <h2>
          <span className="verb">GET · PUT</span>
          Endpoints protegidos
        </h2>
        <p className="hint">
          Papel e claim decidem coisas diferentes: o papel diz se a pessoa pode fazer, a claim{' '}
          <code>department</code> diz sobre quais registros. Dá para ver a diferença chamando os
          dois com o mesmo usuário.
        </p>
      </header>

      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Exige</th>
              <th>Resposta</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {PROBES.map((probe) => {
              const result = results[probe.key]
              const badge = result ? tone(result.status) : null

              return (
                <tr key={probe.key}>
                  <td>
                    <code>
                      {probe.method} {probe.path}
                    </code>
                  </td>
                  <td className="muted">{probe.requirement}</td>
                  <td>
                    {badge ? (
                      <button
                        className={`pill ${badge.className}`}
                        title="Ver a resposta crua"
                        onClick={() => setSelected(probe.key)}
                      >
                        {badge.text} · {result.elapsedMs}ms
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <button disabled={busy === probe.key} onClick={() => void run(probe)}>
                      Chamar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {shown ? (
        <pre>{JSON.stringify(shown.body, null, 2)}</pre>
      ) : (
        <p className="hint">Chame um endpoint para ver a resposta crua aqui.</p>
      )}
    </section>
  )
}
