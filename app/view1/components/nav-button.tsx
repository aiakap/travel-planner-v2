interface NavButtonProps {
  active: boolean
  label: string
  onClick: () => void
}

export const NavButton = ({ active, label, onClick }: NavButtonProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap
      ${active 
        ? 'bg-slate-900 text-white shadow-md' 
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
      }`}
  >
    {label}
  </button>
)
