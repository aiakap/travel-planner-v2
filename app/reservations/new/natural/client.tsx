"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Loader2, MapPin, Calendar, Clock, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { NaturalLanguageReservation } from "@/lib/schemas/natural-language-reservation-schema";
import { resolveReservationContext, ResolvedContext } from "@/lib/actions/resolve-reservation-context";
import { searchPlaceWithContext } from "@/lib/actions/google-places";
import { createNaturalLanguageReservation } from "@/lib/actions/create-natural-language-reservation";
import { GooglePlaceData } from "@/lib/types/place-suggestion";

interface ContextData {
  segment: {
    id: string;
    name: string;
    location: string;
    startDate: string;
    endDate: string;
    timezone: string;
    type: string;
  };
  trip: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
  };
  existingReservations: Array<{
    id: string;
    name: string;
    category: string;
    startTime?: string;
  }>;
  returnTo: string;
}

interface ClarificationQuestion {
  type: "date" | "time" | "location" | "place";
  question: string;
  options?: Array<{
    value: string;
    label: string;
    metadata?: any;
  }>;
}

export function NaturalLanguageReservationClient({ context }: { context: ContextData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const [step, setStep] = useState<"input" | "parsing" | "clarification" | "place-selection" | "creating">("input");
  const [parsed, setParsed] = useState<NaturalLanguageReservation | null>(null);
  const [resolved, setResolved] = useState<ResolvedContext | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [placeOptions, setPlaceOptions] = useState<GooglePlaceData[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setError(null);
    setStep("parsing");

    startTransition(async () => {
      try {
        // Step 1: Parse natural language
        console.log('[NL Client] Parsing:', { input, segmentId: context.segment.id, tripId: context.trip.id });
        const parseResponse = await fetch("/api/reservations/parse-natural-language", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: input,
            segmentId: context.segment.id,
            tripId: context.trip.id,
          }),
        });

        if (!parseResponse.ok) {
          const errorData = await parseResponse.json().catch(() => ({ error: "Unknown error" }));
          console.error('[NL Client] Parse failed:', parseResponse.status, errorData);
          throw new Error(errorData.error || `Failed to parse input (${parseResponse.status})`);
        }

        const parseData = await parseResponse.json();
        const parsedResult: NaturalLanguageReservation = parseData.parsed;
        setParsed(parsedResult);

        // Step 2: Resolve context
        const resolvedContext = await resolveReservationContext(
          parsedResult,
          context.segment.id,
          context.trip.id
        );
        setResolved(resolvedContext);

        // Check if we need clarification
        if (resolvedContext.needsClarification && resolvedContext.clarificationQuestions) {
          setClarificationQuestions(resolvedContext.clarificationQuestions);
          setStep("clarification");
          return;
        }

        // Step 3: Search for place
        if (!resolvedContext.date || !resolvedContext.locationContext) {
          throw new Error("Could not resolve date or location");
        }

        const placeResults = await searchPlaceWithContext(
          parsedResult.placeName,
          resolvedContext.locationContext,
          { maxResults: 3 }
        );

        if (placeResults.results.length === 0) {
          setError(`Could not find "${parsedResult.placeName}" in ${resolvedContext.locationContext}. Please try a different name or be more specific.`);
          setStep("input");
          return;
        }

        if (placeResults.needsDisambiguation && placeResults.results.length > 1) {
          setPlaceOptions(placeResults.results);
          setStep("place-selection");
          return;
        }

        // Step 4: Create reservation
        await createReservationWithPlace(parsedResult, resolvedContext, placeResults.results[0]);
      } catch (err) {
        console.error("Error processing reservation:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setStep("input");
      }
    });
  };

  const handleClarificationSubmit = async () => {
    if (!parsed || !resolved) return;

    setStep("parsing");

    startTransition(async () => {
      try {
        // Apply answers to resolved context
        // For now, we'll just proceed with the resolved context
        // In a full implementation, you'd update the resolved context based on answers

        // Search for place
        const placeResults = await searchPlaceWithContext(
          parsed.placeName,
          resolved.locationContext || context.segment.location,
          { maxResults: 3 }
        );

        if (placeResults.results.length === 0) {
          setError(`Could not find "${parsed.placeName}". Please try again with a different name.`);
          setStep("input");
          return;
        }

        if (placeResults.needsDisambiguation && placeResults.results.length > 1) {
          setPlaceOptions(placeResults.results);
          setStep("place-selection");
          return;
        }

        await createReservationWithPlace(parsed, resolved, placeResults.results[0]);
      } catch (err) {
        console.error("Error after clarification:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setStep("input");
      }
    });
  };

  const handlePlaceSelection = async (place: GooglePlaceData) => {
    if (!parsed || !resolved) return;

    await createReservationWithPlace(parsed, resolved, place);
  };

  const createReservationWithPlace = async (
    parsedData: NaturalLanguageReservation,
    resolvedContext: ResolvedContext,
    placeData: GooglePlaceData
  ) => {
    setStep("creating");

    try {
      if (!resolvedContext.date) {
        throw new Error("Date is required");
      }

      const result = await createNaturalLanguageReservation({
        segmentId: context.segment.id,
        placeName: parsedData.placeName,
        placeData,
        date: resolvedContext.date,
        time: resolvedContext.time,
        endDate: resolvedContext.endDate,
        endTime: resolvedContext.endTime,
        reservationType: parsedData.reservationType,
        additionalInfo: parsedData.additionalInfo,
        originalInput: input,
      });

      if (!result.success || !result.reservationId) {
        throw new Error(result.error || "Failed to create reservation");
      }

      toast.success("Reservation created! Review the details and save.");

      // Navigate to edit page
      const editUrl = `/reservation/${result.reservationId}/edit?source=natural-language&returnTo=${encodeURIComponent(context.returnTo)}`;
      router.push(editUrl);
    } catch (err) {
      console.error("Error creating reservation:", err);
      setError(err instanceof Error ? err.message : "Failed to create reservation");
      setStep("input");
    }
  };

  const examples = [
    "dinner at Chez Panisse at 5 PM on Friday",
    "lunch tomorrow at 12:30",
    "hotel check-in on Jan 31",
    "visit the Louvre on Saturday morning",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(context.returnTo)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-indigo-600" />
            Add Reservation
          </h1>
          <p className="text-gray-600 mt-2">
            Describe what you'd like to do, and I'll help you create a reservation
          </p>
        </div>

        {/* Context Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{context.segment.name}</div>
              <div className="text-sm text-gray-600">{context.segment.location}</div>
              <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(parseISO(context.segment.startDate), "MMM d")} - {format(parseISO(context.segment.endDate), "MMM d, yyyy")}
              </div>
            </div>
          </div>

          {context.existingReservations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2">Existing reservations:</div>
              <div className="space-y-1">
                {context.existingReservations.map(res => (
                  <div key={res.id} className="text-sm text-gray-600 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {res.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        {step === "input" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to do?
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., dinner at Chez Panisse at 5 PM on Friday"
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                disabled={isPending}
              />

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              <div className="mt-4">
                <div className="text-xs font-medium text-gray-500 mb-2">Examples:</div>
                <div className="flex flex-wrap gap-2">
                  {examples.map((example, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInput(example)}
                      className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isPending}
                className="mt-6 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Create Reservation
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {step === "parsing" && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900">Processing your request...</div>
            <div className="text-sm text-gray-600 mt-2">
              Parsing → Resolving context → Looking up place
            </div>
          </div>
        )}

        {step === "clarification" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">I need some clarification</h2>
            <div className="space-y-4">
              {clarificationQuestions.map((q, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-medium text-gray-900 mb-3">{q.question}</div>
                  {q.options ? (
                    <div className="space-y-2">
                      {q.options.map((option, optIdx) => (
                        <label
                          key={optIdx}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`question-${idx}`}
                            value={option.value}
                            onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [`question-${idx}`]: e.target.value })}
                            className="text-indigo-600"
                          />
                          <span className="text-gray-900">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Your answer..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [`question-${idx}`]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleClarificationSubmit}
              disabled={isPending}
              className="mt-6 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
            >
              Continue
            </button>
          </div>
        )}

        {step === "place-selection" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Which place did you mean?</h2>
            <div className="space-y-3">
              {placeOptions.map((place) => (
                <button
                  key={place.placeId}
                  onClick={() => handlePlaceSelection(place)}
                  disabled={isPending}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                >
                  <div className="font-semibold text-gray-900">{place.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{place.formattedAddress}</div>
                  {place.rating && (
                    <div className="text-sm text-gray-500 mt-1">
                      ⭐ {place.rating} ({place.userRatingsTotal} reviews)
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "creating" && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900">Creating your reservation...</div>
          </div>
        )}
      </div>
    </div>
  );
}
