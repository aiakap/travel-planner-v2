import { LucideIcon } from "lucide-react"

interface ToolbarButtonProps {
  icon: LucideIcon
  label: string
  primary?: boolean
  onClick?: () => void
}

export const ToolbarButton = ({ icon: Icon, label, primary = false, onClick }: ToolbarButtonProps) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
    ${primary 
      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <Icon size={14} />
    <span>{label}</span>
  </button>
)
