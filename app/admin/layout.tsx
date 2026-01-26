import NavigationAdmin from "@/components/navigation-admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <NavigationAdmin />

      {/* Warning Banner */}
      <div className="container mx-auto px-4 py-4 mt-20">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> This admin interface is currently open to all users. 
            Authentication and permissions will be added in a future update.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
