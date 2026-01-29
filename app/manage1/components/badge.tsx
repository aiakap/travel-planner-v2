interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple"
}

export const Badge = ({ children, className = "", variant = "default" }: BadgeProps) => {
  const variants = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    danger: "bg-rose-100 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
