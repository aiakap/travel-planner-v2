import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApiTestLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function ApiTestLayout({ title, description, children, breadcrumbs = [] }: ApiTestLayoutProps) {
  const defaultBreadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "API Testing", href: "/admin/apis" },
    ...breadcrumbs,
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/apis" className="hover:text-foreground">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to APIs
          </Button>
        </Link>
      </div>

      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-sm">
        {defaultBreadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <span className="text-muted-foreground">/</span>}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
