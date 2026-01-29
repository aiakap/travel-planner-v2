import { Inter } from 'next/font/google'
import './styles/manage1-theme.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export default function Manage1Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.variable} manage1-theme`}>
      {children}
    </div>
  )
}
