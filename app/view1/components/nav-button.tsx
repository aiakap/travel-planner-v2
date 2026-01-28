interface NavButtonProps {
  active: boolean
  label: string
  onClick: () => void
}

export const NavButton = ({ active, label, onClick }: NavButtonProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap
      ${active 
        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-105' 
        : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
      }`}
  >
    {label}
  </button>
)
