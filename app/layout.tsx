import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Anoma Card For Community',
    template: '%s | Anoma'
  },
  icons: [
    { rel: 'icon', url: '/anoma-logo.svg', type: 'image/svg+xml' }
  ]
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
