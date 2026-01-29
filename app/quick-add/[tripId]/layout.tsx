import { Inter } from 'next/font/google'
import './styles/quick-add-theme.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export default function QuickAddLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.variable} quick-add-theme`}>
      {children}
    </div>
  )
}
