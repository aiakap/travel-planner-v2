"use client"

import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface PromoFeature {
  icon: LucideIcon
  text: string
}

interface IntelligencePromoProps {
  icon: LucideIcon
  iconGradient: string
  headline: string
  features: PromoFeature[]
  scenario: string
  visual?: React.ReactNode
}

export function IntelligencePromo({
  icon: Icon,
  iconGradient,
  headline,
  features,
  scenario,
  visual,
}: IntelligencePromoProps) {
  const router = useRouter()

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in-up">
        <div className={`inline-flex p-6 rounded-3xl bg-gradient-to-br ${iconGradient} shadow-2xl mb-6 animate-bounce-slow`}>
          <Icon className="h-16 w-16 text-white" strokeWidth={1.5} />
        </div>
        
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          {headline}
        </h2>
        
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {scenario}
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {features.map((feature, index) => {
          const FeatureIcon = feature.icon
          
          return (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`flex-shrink-0 p-2.5 rounded-lg bg-gradient-to-br ${iconGradient}`}>
                <FeatureIcon className="h-5 w-5 text-white" />
              </div>
              <p className="text-slate-700 font-medium leading-relaxed pt-1">
                {feature.text}
              </p>
            </div>
          )
        })}
      </div>

      {/* Visual Section */}
      {visual && (
        <div className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
          {visual}
        </div>
      )}

      {/* CTA Section */}
      <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Ready to unlock this feature?
        </h3>
        <p className="text-slate-600 mb-6">
          Create or select a trip to access AI-powered travel intelligence
        </p>
        <Button
          onClick={() => router.push('/view1')}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          Create Your Trip
        </Button>
      </div>
    </div>
  )
}
