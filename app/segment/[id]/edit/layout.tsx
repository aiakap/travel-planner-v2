import { Inter } from 'next/font/google'
import './styles/segment-edit-theme.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export default function SegmentEditLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.variable} segment-edit-theme`}>
      {children}
    </div>
  )
}
