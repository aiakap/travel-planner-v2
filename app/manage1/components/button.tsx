import { LucideIcon } from "lucide-react"

interface ButtonProps {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost" | "blue"
  icon?: LucideIcon
  className?: string
  onClick?: () => void
  size?: "sm" | "md" | "lg"
}

export const Button = ({ 
  children, 
  variant = "primary", 
  icon: Icon, 
  className = "", 
  onClick, 
  size = "md" 
}: ButtonProps) => {
  const baseStyle = "rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  }

  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    blue: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
  }

  return (
    <button onClick={onClick} className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}
