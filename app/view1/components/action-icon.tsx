import { LucideIcon, Loader2 } from "lucide-react"

interface ActionIconProps {
  icon: LucideIcon
  onClick?: () => void
  label?: string
  loading?: boolean
  disabled?: boolean
}

export const ActionIcon = ({ icon: Icon, onClick, label, loading, disabled }: ActionIconProps) => (
  <button 
    onClick={onClick}
    title={label}
    disabled={loading || disabled}
    className={`p-2 rounded-lg transition-colors ${
      loading || disabled 
        ? 'text-slate-300 cursor-not-allowed' 
        : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
    }`}
  >
    {loading ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
  </button>
)
