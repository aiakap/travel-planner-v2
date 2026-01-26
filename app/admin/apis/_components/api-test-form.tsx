"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "date";
  placeholder?: string;
  defaultValue?: string | number;
  required?: boolean;
  description?: string;
}

interface ApiTestFormProps {
  title: string;
  description?: string;
  fields: FormField[];
  onSubmit: (values: Record<string, any>) => Promise<void>;
  submitLabel?: string;
}

export function ApiTestForm({
  title,
  description,
  fields,
  onSubmit,
  submitLabel = "Test API",
}: ApiTestFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue;
      }
    });
    return initial;
  });

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(values);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={values[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  rows={4}
                />
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={values[field.name] || ""}
                  onChange={(e) =>
                    handleChange(
                      field.name,
                      field.type === "number"
                        ? Number(e.target.value)
                        : e.target.value
                    )
                  }
                  required={field.required}
                />
              )}
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
            </div>
          ))}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
