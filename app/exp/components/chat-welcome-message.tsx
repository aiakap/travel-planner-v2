"use client";

interface ChatWelcomeMessageProps {
  userName?: string;
  hobbies?: string[];
  recentTrips?: Array<{ title: string }>;
}

export function ChatWelcomeMessage({ 
  userName, 
  hobbies = [], 
  recentTrips = [] 
}: ChatWelcomeMessageProps) {
  const hasHobbies = hobbies.length > 0;
  const hasRecentTrips = recentTrips.length > 0;

  return (
    <div className="max-w-2xl mx-auto py-4">
      <h2 className="text-3xl font-light text-slate-900 mb-4">
        {userName ? `Hello, ${userName}` : 'Hello'}
      </h2>
      
      <div className="space-y-3 text-slate-600 text-lg font-light">
        {hasHobbies ? (
          <p>
            I can help you plan trips that match your interests in{' '}
            <span className="text-slate-900">
              {hobbies.slice(0, 2).join(' and ')}
            </span>
            {hobbies.length > 2 && ` and more`}.
          </p>
        ) : (
          <p>
            I'm here to help you plan your next journey. Share your ideas, and I'll create a personalized itinerary.
          </p>
        )}
        
        {hasRecentTrips && (
          <p className="text-base text-slate-500">
            Recent: {recentTrips[0].title}
          </p>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-sm text-slate-400 mb-3">Examples</p>
        <div className="space-y-2 text-sm text-slate-500">
          <div>"Plan a week-long trip to Japan"</div>
          <div>"Find me a romantic weekend getaway"</div>
          <div>"Suggest activities for my Paris trip"</div>
        </div>
      </div>
    </div>
  );
}
