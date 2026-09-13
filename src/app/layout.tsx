import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Helpdesk',
    template: '%s · Helpdesk',
  },
  description: 'Atendimento interno.',
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
