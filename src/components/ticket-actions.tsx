'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { callApi, errorText } from '@/lib/http'
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from '@/lib/tickets'

/**
 * The controls that change a ticket.
 *
 * `canWrite` only decides what this form looks like. The endpoint it posts to
 * checks the role again, because a disabled button is a hint to the person in
 * front of the screen and not a control over anyone else.
 *
 * @param props.ticketId - Which ticket.
 * @param props.status - Current status.
 * @param props.priority - Current priority.
 * @param props.assignee - Who is on it, if anyone.
 * @param props.canWrite - Whether this person's role allows changing it.
 * @param props.username - The signed-in login, used by "assumir".
 */
export function TicketActions({
  ticketId,
  status,
  priority,
  assignee,
  canWrite,
  username,
}: {
  ticketId: string
  status: TicketStatus
  priority: TicketPriority
  assignee: string | null
  canWrite: boolean
  username: string
}) {
  const router = useRouter()
  const [draftStatus, setDraftStatus] = useState<TicketStatus>(status)
  const [draftPriority, setDraftPriority] = useState<TicketPriority>(priority)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: string; text: string } | null>(null)

  const send = async (body: Record<string, unknown>, done: string) => {
    setBusy(true)
    setFeedback(null)

    const call = await callApi(`/api/tickets/${encodeURIComponent(ticketId)}`, {
      method: 'PUT',
      body,
    })

    setBusy(false)

    if (call.ok) {
      setFeedback({ tone: 'ok', text: done })
      router.refresh()

      return
    }

    setFeedback({
      tone: call.status === 403 ? 'warn' : 'danger',
      text: errorText(call.body) ?? 'Não foi possível salvar.',
    })
  }

  const mine = assignee === username && username !== ''

  return (
    <>
      <label>
        <span>Status</span>
        <select
          value={draftStatus}
          disabled={!canWrite || busy}
          onChange={(event) => setDraftStatus(event.target.value as TicketStatus)}
        >
          {TICKET_STATUSES.map((option) => (
            <option key={option} value={option}>
              {STATUS_LABEL[option]}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Prioridade</span>
        <select
          value={draftPriority}
          disabled={!canWrite || busy}
          onChange={(event) => setDraftPriority(event.target.value as TicketPriority)}
        >
          {TICKET_PRIORITIES.map((option) => (
            <option key={option} value={option}>
              {PRIORITY_LABEL[option]}
            </option>
          ))}
        </select>
      </label>

      <div className="row">
        <button
          className="primary"
          disabled={
            !canWrite || busy || (draftStatus === status && draftPriority === priority)
          }
          onClick={() => void send({ status: draftStatus, priority: draftPriority }, 'Chamado atualizado.')}
        >
          Salvar alterações
        </button>

        {mine ? (
          <button
            disabled={!canWrite || busy}
            onClick={() => void send({ assignee: null }, 'Chamado devolvido para a fila.')}
          >
            Devolver à fila
          </button>
        ) : (
          <button
            disabled={!canWrite || busy}
            onClick={() => void send({ assignee: username }, 'Chamado atribuído a você.')}
          >
            Assumir chamado
          </button>
        )}
      </div>

      {!canWrite ? (
        <div className="note warn" style={{ marginTop: 14 }}>
          Você está com acesso de leitura. Atender chamados exige o papel{' '}
          <code>helpdesk.agent</code>.
        </div>
      ) : null}

      {feedback ? (
        <div className={`note ${feedback.tone}`} style={{ marginTop: 14 }}>
          {feedback.text}
        </div>
      ) : null}
    </>
  )
}
