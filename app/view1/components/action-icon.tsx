import { LucideIcon } from "lucide-react"

interface ActionIconProps {
  icon: LucideIcon
  onClick?: () => void
  label?: string
}

export const ActionIcon = ({ icon: Icon, onClick, label }: ActionIconProps) => (
  <button 
    onClick={onClick}
    title={label}
    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
  >
    <Icon size={18} />
  </button>
)
