'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';

interface ScoringBreakdown {
  companyMatches?: {
    score: number;
    matches: string[];
  };
  semanticPhrases?: {
    score: number;
    matches: string[];
  };
  domainMatches?: {
    score: number;
    matches: string[];
  };
  confirmationKeywords?: {
    score: number;
    matches: string[];
  };
  gapBonus?: {
    score: number;
    description: string;
  };
}

interface TypeApprovalProps {
  detection: {
    topMatch: {
      type: string;
      category: string;
      confidence: number;
      score: number;
    };
    scoringBreakdown: ScoringBreakdown;
    alternativeTypes: Array<{
      type: string;
      category: string;
      confidence: number;
      score: number;
    }>;
  };
  availableTypes: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  onApprove: (selectedType: string, category: string, feedback?: string) => void;
  onBack: () => void;
}

export function TypeApproval({
  detection,
  availableTypes,
  onApprove,
  onBack,
}: TypeApprovalProps) {
  const [selectedType, setSelectedType] = useState(detection.topMatch.type);
  const [feedback, setFeedback] = useState('');

  const typeChanged = selectedType !== detection.topMatch.type;

  // Get category for selected type
  const selectedTypeInfo = availableTypes.find(t => t.name === selectedType);
  const selectedCategory = selectedTypeInfo?.category || detection.topMatch.category;

  // Group types by category for organized dropdown
  const typesByCategory = availableTypes.reduce(
    (acc, type) => {
      if (!acc[type.category]) acc[type.category] = [];
      acc[type.category].push(type);
      return acc;
    },
    {} as Record<string, typeof availableTypes>
  );

  // Get confidence level indicator
  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High', variant: 'default' as const };
    if (confidence >= 0.6) return { label: 'Medium', variant: 'secondary' as const };
    return { label: 'Low', variant: 'outline' as const };
  };

  const confidenceLevel = getConfidenceLevel(detection.topMatch.confidence);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* AI Decision Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            AI Detected Type
          </CardTitle>
          <CardDescription>
            Based on keyword analysis and semantic matching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-base px-4 py-2">
              {detection.topMatch.type}
            </Badge>
            <Badge variant={confidenceLevel.variant}>
              {confidenceLevel.label} Confidence
            </Badge>
            <span className="text-sm text-muted-foreground">
              {Math.round(detection.topMatch.confidence * 100)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Detection Reasoning
          </CardTitle>
          <CardDescription>
            How the AI determined this type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {detection.scoringBreakdown.companyMatches && (
              <ScoreItem
                label="Company Matches"
                score={detection.scoringBreakdown.companyMatches.score}
                matches={detection.scoringBreakdown.companyMatches.matches}
              />
            )}
            {detection.scoringBreakdown.semanticPhrases && (
              <ScoreItem
                label="Semantic Phrases"
                score={detection.scoringBreakdown.semanticPhrases.score}
                matches={detection.scoringBreakdown.semanticPhrases.matches}
              />
            )}
            {detection.scoringBreakdown.domainMatches && (
              <ScoreItem
                label="Domain Matches"
                score={detection.scoringBreakdown.domainMatches.score}
                matches={detection.scoringBreakdown.domainMatches.matches}
              />
            )}
            {detection.scoringBreakdown.confirmationKeywords && (
              <ScoreItem
                label="Confirmation Keywords"
                score={detection.scoringBreakdown.confirmationKeywords.score}
                matches={detection.scoringBreakdown.confirmationKeywords.matches}
              />
            )}
            {detection.scoringBreakdown.gapBonus && (
              <div className="flex justify-between items-start text-sm pt-2 border-t">
                <span className="font-medium">Confidence Gap Bonus</span>
                <div className="text-right">
                  <div className="font-mono text-green-600">+{detection.scoringBreakdown.gapBonus.score.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {detection.scoringBreakdown.gapBonus.description}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t-2 border-primary/20">
              <span className="font-semibold">Total Confidence</span>
              <span className="text-lg font-bold">{Math.round(detection.topMatch.confidence * 100)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Types */}
      {detection.alternativeTypes && detection.alternativeTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Other Possible Types</CardTitle>
            <CardDescription>
              Alternative interpretations ranked by confidence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {detection.alternativeTypes.map((alt) => (
                <Badge key={alt.type} variant="outline" className="text-sm">
                  {alt.type} ({Math.round(alt.confidence * 100)}%)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Confirm or Override Type</CardTitle>
          <CardDescription>
            Select the correct reservation type for extraction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typesByCategory).map(([category, types]) => (
                  <SelectGroup key={category}>
                    <SelectLabel>{category}</SelectLabel>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feedback section (shown when user changes type) */}
          {typeChanged && (
            <Alert variant="default" className="border-orange-500 bg-orange-50 dark:bg-orange-950">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">
                    You&apos;ve changed the type from <strong>{detection.topMatch.type}</strong> to <strong>{selectedType}</strong>
                  </p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Why was the AI wrong? (Optional but helpful for learning)
                    </label>
                    <Textarea
                      placeholder="e.g., This is actually a taxi because there's no assigned driver name or vehicle plate number..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                      className="bg-white dark:bg-slate-900"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your feedback helps improve the AI&apos;s detection accuracy for future emails.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between gap-4">
        <Button variant="outline" onClick={onBack} className="w-32">
          Back
        </Button>
        <Button 
          onClick={() => onApprove(selectedType, selectedCategory, feedback)} 
          className="flex-1"
          variant={typeChanged ? 'default' : 'default'}
        >
          {typeChanged ? (
            <>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Continue with Override: {selectedType}
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Continue with AI Selection: {selectedType}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Helper component for score items
function ScoreItem({
  label,
  score,
  matches,
}: {
  label: string;
  score: number;
  matches: string[];
}) {
  const hasMatches = matches && matches.length > 0;
  
  return (
    <div className="flex justify-between items-start text-sm">
      <span className="font-medium">{label}</span>
      <div className="text-right max-w-md">
        <div className={`font-mono ${score > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
          +{score.toFixed(2)}
        </div>
        {hasMatches && (
          <div className="text-xs text-muted-foreground mt-1">
            {matches.join(', ')}
          </div>
        )}
        {!hasMatches && score === 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            None found
          </div>
        )}
      </div>
    </div>
  );
}
