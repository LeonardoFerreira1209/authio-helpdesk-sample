'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { callApi, errorText } from '@/lib/http'

/**
 * The reply box on a ticket.
 *
 * @param props.ticketId - Which ticket.
 * @param props.canWrite - Whether this person's role allows replying.
 */
export function CommentBox({ ticketId, canWrite }: { ticketId: string; canWrite: boolean }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canWrite) {
    return (
      <div className="note">
        Responder a um chamado exige o papel <code>helpdesk.agent</code>.
      </div>
    )
  }

  const send = async () => {
    setBusy(true)
    setError(null)

    const call = await callApi(`/api/tickets/${encodeURIComponent(ticketId)}/comments`, {
      method: 'POST',
      body: { body },
    })

    setBusy(false)

    if (call.ok) {
      setBody('')
      router.refresh()

      return
    }

    setError(errorText(call.body) ?? 'Não foi possível enviar a resposta.')
  }

  return (
    <>
      <textarea
        placeholder="Escreva uma resposta para o solicitante..."
        value={body}
        disabled={busy}
        onChange={(event) => setBody(event.target.value)}
      />

      <div className="row" style={{ marginTop: 10 }}>
        <button className="primary" disabled={busy || body.trim().length === 0} onClick={() => void send()}>
          Responder
        </button>
      </div>

      {error ? (
        <div className="note danger" style={{ marginTop: 12 }}>
          {error}
        </div>
      ) : null}
    </>
  )
}
