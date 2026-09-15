'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

import { ChevronDownIcon, LogOutIcon } from '@/components/icons'

/**
 * The account menu in the top bar.
 *
 * @param props.name - Display name.
 * @param props.secondary - Line under the name, usually the e-mail.
 * @param props.initials - Two letters for the avatar.
 * @param props.roles - Roles held, shown so it is obvious which one is in play.
 * @param props.tone - Which of the avatar hues this person landed on.
 */
export function UserMenu({
  name,
  secondary,
  initials,
  roles,
  tone,
}: {
  name: string
  secondary: string
  initials: string
  roles: string[]
  tone: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="user-menu">
      {open ? <button className="menu-backdrop" aria-label="Fechar menu" onClick={() => setOpen(false)} /> : null}

      <button className="user-chip-button" onClick={() => setOpen((current) => !current)}>
        <span className={`avatar avatar-${tone}`}>{initials}</span>
        <span className="who">
          <strong>{name}</strong>
          <span>{secondary}</span>
        </span>
        <ChevronDownIcon size={15} style={{ color: 'var(--text-faint)' }} />
      </button>

      {open ? (
        <div className="menu">
          <div className="menu-head">
            <strong>{name}</strong>
            <span className="muted">{secondary}</span>
            <div className="row" style={{ marginTop: 8 }}>
              {roles.length > 0 ? (
                roles.map((role) => (
                  <span className="badge accent" key={role}>
                    {role}
                  </span>
                ))
              ) : (
                <span className="badge warn">sem papel atribuído</span>
              )}
            </div>
          </div>
          <Link className="menu-item" href="/minha-conta" onClick={() => setOpen(false)}>
            Minha conta
          </Link>
          <button className="menu-item danger" onClick={() => signOut({ callbackUrl: '/entrar' })}>
            <LogOutIcon size={16} />
            Sair
          </button>
        </div>
      ) : null}
    </div>
  )
}
