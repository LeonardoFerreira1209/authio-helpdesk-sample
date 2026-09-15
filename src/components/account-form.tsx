'use client'

import { useCallback, useEffect, useState } from 'react'

import { callApi, errorText } from '@/lib/http'

interface Profile {
  userName: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
}

/**
 * The signed-in person's own details.
 *
 * Nothing here is stored by this application: the form is filled from the
 * identity provider on load and written back to it on save, so the same data
 * follows the person into every other application on the same account.
 */
export function AccountForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [identity, setIdentity] = useState<{ userName: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: string; text: string } | null>(null)

  const load = useCallback(async () => {
    const call = await callApi('/api/profile')

    setLoading(false)

    if (call.ok) {
      const data = call.body as Profile

      setIdentity({ userName: data.userName, email: data.email })
      setFirstName(data.firstName ?? '')
      setLastName(data.lastName ?? '')
      setPhoneNumber(data.phoneNumber ?? '')

      return
    }

    setFeedback({
      tone: call.status === 503 ? 'warn' : 'danger',
      text: errorText(call.body) ?? 'Não foi possível carregar seus dados.',
    })
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setBusy(true)
    setFeedback(null)

    const call = await callApi('/api/profile', {
      method: 'PUT',
      body: { firstName, lastName, phoneNumber },
    })

    setBusy(false)

    if (call.ok) {
      setFeedback({ tone: 'ok', text: 'Dados salvos.' })

      return
    }

    setFeedback({
      tone: call.status === 503 ? 'warn' : 'danger',
      text: errorText(call.body) ?? 'Não foi possível salvar.',
    })
  }

  if (loading) {
    return (
      <div className="field-grid">
        {[0, 1, 2, 3, 4].map((field) => (
          <label key={field}>
            <span className="skeleton skeleton-line" style={{ width: '40%' }} />
            <span className="skeleton skeleton-block" />
          </label>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="field-grid">
        <label>
          <span>Nome</span>
          <input value={firstName} disabled={busy} onChange={(event) => setFirstName(event.target.value)} />
        </label>
        <label>
          <span>Sobrenome</span>
          <input value={lastName} disabled={busy} onChange={(event) => setLastName(event.target.value)} />
        </label>
        <label>
          <span>Telefone</span>
          <input value={phoneNumber} disabled={busy} onChange={(event) => setPhoneNumber(event.target.value)} />
        </label>
      </div>

      <div className="field-grid">
        <label>
          <span>Usuário</span>
          <input value={identity?.userName ?? ''} disabled readOnly />
        </label>
        <label>
          <span>E-mail</span>
          <input value={identity?.email ?? ''} disabled readOnly />
        </label>
      </div>

      <div className="row">
        <button className="primary" disabled={busy} onClick={() => void save()}>
          Salvar
        </button>
        <span className="muted">
          Usuário e e-mail são a sua identidade de acesso e mudam pelo suporte.
        </span>
      </div>

      {feedback ? (
        <div className={`note ${feedback.tone}`} style={{ marginTop: 14 }}>
          {feedback.text}
        </div>
      ) : null}
    </>
  )
}
