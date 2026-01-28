"use client"

import { LayoutGrid, CheckSquare, Calendar, Cloud, Backpack, FileText } from "lucide-react"

interface FloatingNavProps {
  activeSection: string
}

export function FloatingNav({ activeSection }: FloatingNavProps) {
  const sections = [
    { id: 'hero', label: 'Overview', icon: LayoutGrid },
    { id: 'todo', label: 'To-Do', icon: CheckSquare },
    { id: 'itinerary', label: 'Itinerary', icon: Calendar },
    { id: 'weather', label: 'Weather', icon: Cloud },
    { id: 'packing', label: 'Packing', icon: Backpack },
    { id: 'visa', label: 'Visas', icon: FileText },
  ]
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 120
      const top = element.getBoundingClientRect().top + window.pageYOffset - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }
  
  return (
    <div className="sticky top-[64px] z-40 py-4 flex justify-center px-4 pointer-events-none">
      <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-slate-200/50 rounded-full p-1.5 flex gap-1 pointer-events-auto overflow-x-auto no-scrollbar">
        {sections.map(section => {
          const Icon = section.icon
          const isActive = activeSection === section.id
          
          return (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-600 ring-offset-2' 
                  : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm backdrop-blur-sm'
              }`}
            >
              <Icon size={16} />
              <span className="hidden md:inline">{section.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
