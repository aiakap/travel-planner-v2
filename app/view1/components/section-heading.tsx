import { LucideIcon } from "lucide-react"

interface SectionHeadingProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export const SectionHeading = ({ icon: Icon, title, subtitle, actions }: SectionHeadingProps) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-start gap-4">
      <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 text-white">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex gap-2">{actions}</div>}
  </div>
)
