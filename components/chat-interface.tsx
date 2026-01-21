"use client";

import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { generateGetLuckyPrompt } from "@/lib/ai/get-lucky-prompts";
import { UserPersonalizationData, ChatQuickAction, getHobbyBasedDestination, getPreferenceBudgetLevel } from "@/lib/personalization";
import { ChatWelcomeMessage } from "@/components/chat-welcome-message";
import { ChatQuickActions } from "@/components/chat-quick-actions";

interface ChatInterfaceProps {
  conversationId: string;
  initialMessages?: UIMessage[];
  profileData?: UserPersonalizationData | null;
  quickActions?: ChatQuickAction[];
}

// Helper to extract text content from message parts
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

// Helper to check for tool invocations in message parts
function getToolInvocations(message: UIMessage) {
  return message.parts.filter(
    (part: any) =>
      part.type && part.type.startsWith("tool-")
  );
}

export default function ChatInterface({
  conversationId,
  initialMessages = [],
  profileData = null,
  quickActions = [],
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    api: "/api/chat" as any,
    body: { conversationId } as any,
    initialMessages,
  } as any);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === ("in_progress" as any);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle "Get Lucky" button click - now shows plan before creating
  const handleGetLucky = () => {
    if (isLoading) return;
    
    // Generate profile-aware lucky prompt
    const destination = profileData 
      ? getHobbyBasedDestination(profileData.hobbies) 
      : null;
    const budgetLevel = (profileData 
      ? getPreferenceBudgetLevel(profileData.preferences) 
      : 'moderate') as "moderate" | "budget" | "luxury";
    
    const luckyPrompt = generateGetLuckyPrompt(destination, budgetLevel);
    
    // Bot will show the plan and ask for confirmation
    const confirmationMessage = `I have a trip idea for you:

${luckyPrompt}

What would you like to change about this plan, or should I create it as is?`;
    
    sendMessage({ text: confirmationMessage });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="space-y-8">
            {/* Personalized Welcome Message */}
            <ChatWelcomeMessage
              userName={profileData?.profile?.firstName || undefined}
              hobbies={profileData?.hobbies.map(h => h.hobby.name) || []}
              recentTrips={profileData?.recentTrips || []}
            />
            
            {/* Quick Action Buttons */}
            {quickActions.length > 0 && (
              <ChatQuickActions
                suggestions={quickActions}
                onSelect={(prompt) => {
                  sendMessage({ text: prompt });
                }}
              />
            )}
            
            {/* Surprise Me Button - Minimal Style */}
            <div className="max-w-2xl mx-auto mt-6">
              <button
                onClick={handleGetLucky}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Surprise me with a trip idea
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">
                I'll show you a plan that you can adjust before creating
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const textContent = getMessageText(message);
          const toolInvocations = getToolInvocations(message);

          return (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-5 py-3 ${
                  message.role === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-900 border border-slate-100"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{textContent}</div>

                {/* Show tool calls if present */}
                {toolInvocations.length > 0 && (
                  <div className="mt-3 text-xs opacity-60 border-t border-current/10 pt-2 space-y-1">
                    {toolInvocations.map((tool: any, idx: number) => (
                      <div key={idx}>
                        {(tool.toolName?.includes("create_trip") || tool.toolInvocation?.toolName === "create_trip") && "Created trip"}
                        {(tool.toolName?.includes("add_segment") || tool.toolInvocation?.toolName === "add_segment") && "Added segment"}
                        {(tool.toolName?.includes("suggest_reservation") || tool.toolInvocation?.toolName === "suggest_reservation") && "Added reservation"}
                        {(tool.toolName?.includes("get_user_trips") || tool.toolInvocation?.toolName === "get_user_trips") && "Fetched trips"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 rounded-lg px-5 py-3 flex items-center gap-2 border border-slate-100">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span className="text-sm text-slate-500">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-slate-200 p-6 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !isLoading) {
              sendMessage({ text: input });
              setInput("");
            }
          }}
          className="flex gap-3 max-w-4xl mx-auto"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your trip..."
            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 text-slate-900 placeholder:text-slate-400"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        {error && (
          <div className="mt-3 text-sm text-red-600 max-w-4xl mx-auto">
            {error.message}
          </div>
        )}
      </div>
    </div>
  );
}

