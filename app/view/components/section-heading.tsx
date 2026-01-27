import { LucideIcon } from "lucide-react"

interface SectionHeadingProps {
  icon: LucideIcon
  title: string
  subtitle?: string
}

export function SectionHeading({ icon: Icon, title, subtitle }: SectionHeadingProps) {
  return (
    <div className="flex items-start gap-4 mb-8">
      <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 text-white">
        <Icon size={24} strokeWidth={2} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
