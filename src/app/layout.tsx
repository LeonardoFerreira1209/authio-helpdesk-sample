import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Helpdesk — identidade pelo Authio',
  description:
    'Aplicação de exemplo que delega login, papéis e cadastro de usuários ao Authio.',
}

/**
 * The document shell.
 *
 * @param children - The page being rendered.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
