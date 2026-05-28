import type { Metadata } from 'next'
import { Fraunces, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/header'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
})

const fraunces = Fraunces({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Notion Mini',
  description: 'Ứng dụng ghi chú cá nhân xây dựng',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased`}>
        <Header />
        {children}
      </body>
    </html>
  )
}