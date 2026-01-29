interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export const Card = ({ children, className = "", hover = true, onClick }: CardProps) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${hover ? 'transition-all duration-300 hover:shadow-md hover:-translate-y-0.5' : 'shadow-sm'} ${className}`}
  >
    {children}
  </div>
)
