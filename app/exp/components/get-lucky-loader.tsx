"use client";

import { CheckCircle2, Loader2, MapPin, Hotel, UtensilsCrossed, Compass } from "lucide-react";

interface Stage {
  id: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
  message: string;
  items?: Array<{
    text: string;
    data?: any;
  }>;
}

interface GetLuckyLoaderProps {
  loaderId: string;
  stages: Stage[];
}

const stageIcons: Record<string, React.ReactNode> = {
  planning: <MapPin className="h-5 w-5" />,
  route: <Compass className="h-5 w-5" />,
  hotels: <Hotel className="h-5 w-5" />,
  restaurants: <UtensilsCrossed className="h-5 w-5" />,
  activities: <Compass className="h-5 w-5" />,
  complete: <CheckCircle2 className="h-5 w-5" />,
};

const stageEmojis: Record<string, string> = {
  planning: '🗺️',
  route: '🛣️',
  hotels: '🏨',
  restaurants: '🍽️',
  activities: '🎯',
  complete: '✅',
};

export function GetLuckyLoader({ loaderId, stages }: GetLuckyLoaderProps) {
  return (
    <div className="space-y-3 py-2">
      {stages.map((stage) => {
        const icon = stageIcons[stage.id] || stageIcons.planning;
        const emoji = stageEmojis[stage.id] || '📍';
        
        return (
          <div key={stage.id} className="space-y-2">
            {/* Stage header */}
            <div className="flex items-center gap-3">
              {stage.status === 'loading' && (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              )}
              {stage.status === 'complete' && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              {stage.status === 'error' && (
                <div className="h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                  !
                </div>
              )}
              {stage.status === 'pending' && (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              )}
              
              <span className={`text-base font-medium ${
                stage.status === 'complete' ? 'text-gray-700' : 
                stage.status === 'loading' ? 'text-blue-700' :
                stage.status === 'error' ? 'text-red-700' :
                'text-gray-400'
              }`}>
                <span className="mr-2">{emoji}</span>
                {stage.message}
              </span>
            </div>

            {/* Stage items */}
            {stage.items && stage.items.length > 0 && (
              <div className="ml-8 space-y-1">
                {stage.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item.text}</span>
                    {item.data?.location && (
                      <span className="text-gray-400 text-xs">
                        · {item.data.location}
                      </span>
                    )}
                    {item.data?.time && (
                      <span className="text-gray-400 text-xs">
                        · {item.data.time}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
