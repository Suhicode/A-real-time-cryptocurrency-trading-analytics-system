import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cryptocurrency Trading Analytics',
  description: 'Real-time cryptocurrency trading analytics dashboard with RSI calculations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
