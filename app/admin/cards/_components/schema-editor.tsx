"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Eye, Code } from "lucide-react";
import { CardPreview } from "./card-preview";
import { Card as CardType, cardSchema } from "@/lib/schemas/exp-response-schema";

interface SchemaEditorProps {
  initialValue?: string;
  cardType?: string;
}

export function SchemaEditor({ initialValue = "", cardType }: SchemaEditorProps) {
  const [jsonInput, setJsonInput] = useState(initialValue);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    data?: CardType;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const result = cardSchema.safeParse(parsed);
      
      if (result.success) {
        setValidationResult({
          valid: true,
          data: result.data,
        });
        setShowPreview(true);
      } else {
        setValidationResult({
          valid: false,
          error: result.error.issues
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join("; "),
        });
        setShowPreview(false);
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error instanceof Error ? error.message : "Invalid JSON format",
      });
      setShowPreview(false);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch (error) {
      // Ignore formatting errors
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            JSON Editor
          </CardTitle>
          <CardDescription>
            {cardType
              ? `Enter JSON for ${cardType} type`
              : "Enter JSON for any card type"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={`{\n  "type": "trip_card",\n  "tripId": "trip_123",\n  "title": "Trip to Paris",\n  "startDate": "2026-03-15",\n  "endDate": "2026-03-22",\n  "description": "Spring in Paris"\n}`}
            className="font-mono text-sm min-h-[300px]"
          />
          
          <div className="flex gap-2">
            <Button onClick={handleValidate}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Validate
            </Button>
            <Button variant="outline" onClick={handleFormat}>
              Format JSON
            </Button>
            {validationResult?.valid && (
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
            )}
          </div>

          {validationResult && (
            <Alert variant={validationResult.valid ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {validationResult.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    {validationResult.valid ? (
                      <div>
                        <strong>✓ Valid!</strong> Card matches schema requirements.
                      </div>
                    ) : (
                      <div>
                        <strong>Validation Error:</strong>
                        <pre className="mt-2 text-xs whitespace-pre-wrap">
                          {validationResult.error}
                        </pre>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {showPreview && validationResult?.valid && validationResult.data && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visual Preview
          </h3>
          <CardPreview card={validationResult.data} />
        </div>
      )}
    </div>
  );
}
