"use client"

import { MapPin, Heart } from "lucide-react"
import { Badge } from "./badge"

export interface RecommendationCardData {
  id: number
  title: string
  location: string
  image: string
  badge: string
  badgeColor: string
  reason: string
  author: string
  authorImg?: string
}

interface RecommendationCardProps {
  title: string
  location: string
  image: string
  badge: string
  badgeColor: string
  reason: string
  author: string
  authorImg?: string
}

export const RecommendationCard = ({ 
  title, 
  location, 
  image, 
  badge, 
  badgeColor, 
  reason, 
  author, 
  authorImg 
}: RecommendationCardProps) => (
  <div className="group relative h-64 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500">
    <div className="absolute inset-0">
      <img 
        src={image} 
        alt={title} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
    </div>
    
    <div className="absolute inset-0 p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <Badge className={`${badgeColor} backdrop-blur-md border-white/10 text-white shadow-sm`}>
          {badge}
        </Badge>
        <button className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white transition-colors">
          <Heart size={16} />
        </button>
      </div>
      
      <div>
        <div className="flex items-center gap-2 mb-2">
          {authorImg && (
            <img 
              src={authorImg} 
              alt={author} 
              className="w-6 h-6 rounded-full border border-white/50" 
            />
          )}
          <span className="text-xs font-medium text-white/80">{reason}</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
        <div className="flex items-center gap-1 text-white/60 text-xs">
          <MapPin size={12} /> {location}
        </div>
      </div>
    </div>
  </div>
)
