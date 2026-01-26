import { Plane, MapPin } from "lucide-react";

interface TimelineItem {
  time: string;
  location: string;
  type: "departure" | "arrival";
  terminal?: string;
  extra?: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                item.type === "departure"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                  : "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300"
              }`}
            >
              {item.type === "departure" ? (
                <Plane className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </div>
            {index < items.length - 1 && (
              <div className="w-0.5 h-full min-h-[40px] bg-border" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="font-semibold">{item.time}</div>
            <div className="text-sm text-muted-foreground">{item.location}</div>
            {item.terminal && (
              <div className="text-xs text-muted-foreground mt-1">
                Terminal {item.terminal}
              </div>
            )}
            {item.extra && (
              <div className="text-xs text-muted-foreground mt-1">
                {item.extra}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
