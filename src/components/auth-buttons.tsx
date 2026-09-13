'use client'

import { signIn, signOut } from 'next-auth/react'

/**
 * Starts the authorization code flow at Authio.
 *
 * @param props.label - The button text.
 */
export function SignInButton({ label = 'Entrar com o Authio' }: { label?: string }) {
  return (
    <button className="primary" onClick={() => signIn('authio', { callbackUrl: '/' })}>
      {label}
    </button>
  )
}

/**
 * Ends the local session.
 *
 * Only the local one: the cookie here is dropped, and the session at Authio
 * stays open, so the next sign-in goes straight through without asking for
 * credentials again. Ending both takes a redirect to the provider's
 * `end_session_endpoint`, which is a different flow and a deliberate choice.
 */
export function SignOutButton() {
  return <button onClick={() => signOut({ callbackUrl: '/sign-in' })}>Sair</button>
}
