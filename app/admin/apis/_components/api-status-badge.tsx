import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface ApiStatusBadgeProps {
  configured: boolean;
  label?: string;
}

export function ApiStatusBadge({ configured, label = "Status" }: ApiStatusBadgeProps) {
  return (
    <Badge
      variant={configured ? "default" : "destructive"}
      className="gap-1.5"
    >
      {configured ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {configured ? "Configured" : "Not Configured"}
    </Badge>
  );
}

interface ApiStatusDetailProps {
  items: { label: string; status: boolean }[];
}

export function ApiStatusDetail({ items }: ApiStatusDetailProps) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{item.label}</span>
          <div className="flex items-center gap-1.5">
            {item.status ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-green-500">Set</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-500">Missing</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
