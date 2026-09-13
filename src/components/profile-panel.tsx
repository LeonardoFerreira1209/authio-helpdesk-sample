'use client'

import { useCallback, useEffect, useState } from 'react'

import { callApi, errorText, type ApiCall } from '@/lib/http'

interface Profile {
  userName: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  roles: string[]
  updated: string | null
}

/**
 * Read and write of the signed-in person's own record, straight into Authio.
 *
 * The GET and the PUT are the two flows worth watching here: nothing about this
 * person is stored by this application, so the form is filled from Authio on
 * load and saved back to Authio on submit.
 */
export function ProfilePanel() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<ApiCall | null>(null)

  const load = useCallback(async () => {
    setBusy(true)

    const call = await callApi('/api/profile')

    setLast(call)

    if (call.ok) {
      const data = call.body as Profile

      setProfile(data)
      setFirstName(data.firstName ?? '')
      setLastName(data.lastName ?? '')
      setPhoneNumber(data.phoneNumber ?? '')
    }

    setBusy(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setBusy(true)

    const call = await callApi('/api/profile', {
      method: 'PUT',
      body: { firstName, lastName, phoneNumber },
    })

    setLast(call)
    setBusy(false)

    if (call.ok) {
      await load()
    }
  }

  return (
    <section className="card">
      <header>
        <h2>
          <span className="verb">GET · PUT</span>
          Meu perfil
        </h2>
        <p className="hint">
          <code>/api/profile</code> lê e grava direto no Authio, em{' '}
          <code>/api/v1/admin/realms/{'{realm}'}/clients/{'{client}'}/users</code>. O id vem do{' '}
          <code>sub</code> do token, nunca do corpo da requisição.
        </p>
      </header>

      <div className="fields">
        <label>
          <span>Nome</span>
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
        </label>
        <label>
          <span>Sobrenome</span>
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </label>
        <label>
          <span>Telefone</span>
          <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
        </label>
      </div>

      <div className="row">
        <button className="primary" disabled={busy} onClick={() => void save()}>
          Salvar no Authio
        </button>
        <button disabled={busy} onClick={() => void load()}>
          Recarregar
        </button>
        {profile ? (
          <span className="muted">
            {profile.userName} · {profile.email}
            {profile.roles.length > 0 ? ` · ${profile.roles.join(', ')}` : ''}
          </span>
        ) : null}
      </div>

      {last ? (
        <div className={`notice ${last.ok ? 'ok' : 'error'}`}>
          HTTP {last.status} · {last.elapsedMs}ms
          {errorText(last.body) ? ` — ${errorText(last.body)}` : ''}
          {last.ok && last.body && typeof last.body === 'object' && 'message' in last.body
            ? ` — ${String((last.body as { message: unknown }).message)}`
            : ''}
        </div>
      ) : null}

      {profile?.updated ? (
        <p className="hint">
          Última gravação registrada pelo Authio: {new Date(profile.updated).toLocaleString('pt-BR')}.
          O nome dentro do token só muda no próximo login — claims são carimbadas na emissão.
        </p>
      ) : null}
    </section>
  )
}
