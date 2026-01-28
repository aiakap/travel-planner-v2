interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export const Card = ({ children, className = "", hover = true }: CardProps) => (
  <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${hover ? 'transition-all duration-300 hover:shadow-md hover:-translate-y-0.5' : 'shadow-sm'} ${className}`}>
    {children}
  </div>
)
