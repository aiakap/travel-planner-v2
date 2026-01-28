import { Inter } from 'next/font/google'
import './styles/view1-theme.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export default function View1Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.variable} view1-theme`}>
      {children}
    </div>
  )
}
