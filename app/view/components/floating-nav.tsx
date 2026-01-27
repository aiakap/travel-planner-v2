"use client"

import { LayoutGrid, CheckSquare, Calendar, Cloud, Backpack } from "lucide-react"
import { cn } from "@/lib/utils"

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
  ]
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // Account for fixed header
      const top = element.getBoundingClientRect().top + window.pageYOffset - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }
  
  return (
    <nav className="sticky top-16 z-30 flex justify-center mb-6 px-4">
      <div className="bg-card/95 backdrop-blur-sm border rounded-full px-3 py-2 shadow-lg">
        <div className="flex gap-1">
          {sections.map(section => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4 inline mr-1.5" />
                <span className="hidden md:inline">{section.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
