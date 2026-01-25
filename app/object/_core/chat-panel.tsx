"use client";

/**
 * Generic chat panel
 * Displays messages and handles user input
 * Renders cards based on config
 */

import { useState, useRef, useEffect } from "react";
import { ChatPanelProps, Message, MessageCard } from "./types";
import { addItemToXml, parseXmlToGraph, createEmptyProfileXml } from "@/lib/profile-graph-xml";

export function ChatPanel({
  config,
  userId,
  params,
  xmlData,
  onDataUpdate,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show welcome message
  useEffect(() => {
    if (config.leftPanel.welcomeMessage && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: config.leftPanel.welcomeMessage,
          timestamp: new Date(),
        },
      ]);
    }
  }, [config.leftPanel.welcomeMessage, messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/object/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectType: config.id,
          message: input,
          userId,
          params,
          messageHistory: messages.slice(-10), // Last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.text || "",
        timestamp: new Date(),
        cards: data.cards?.map((card: any) => ({
          id: card.id || `card-${Date.now()}-${Math.random()}`,
          type: card.type,
          data: card.data,
          component: config.leftPanel.cardRenderers[card.type],
        })),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Handle auto-actions - call config's onAutoAction with update callback
      if (data.cards && config.autoActions?.autoActionCards) {
        const autoActionCards = data.cards.filter((card: any) =>
          config.autoActions!.autoActionCards!.includes(card.type)
        );
        
        if (autoActionCards.length > 0 && config.autoActions.onAutoAction) {
          try {
            console.log('🔄 Processing auto-action cards:', autoActionCards.length);
            
            // Call config's onAutoAction with callback to update data
            await config.autoActions.onAutoAction(autoActionCards, (updatedData) => {
              console.log('📊 Received data update from onAutoAction:', {
                hasGraphData: !!updatedData.graphData,
                hasXmlData: !!updatedData.xmlData
              });
              
              // Trigger parent update with new data
              if (updatedData.graphData || updatedData.xmlData) {
                onDataUpdate(updatedData);
              }
            });
            
            console.log('✅ Auto-action processing complete');
          } catch (error) {
            console.error("❌ Auto-action failed:", error);
            // Show error message to user
            const errorMessage: Message = {
              id: `error-${Date.now()}`,
              role: "assistant",
              content: "Failed to add items. Please try again.",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
          }
        }
      }

      // Trigger data update if needed
      if (data.updatedData) {
        onDataUpdate(data.updatedData);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCardAction = (action: string, cardData: any) => {
    console.log("🎬 [CHAT PANEL] Card action received:", {
      action,
      cardData,
      hasOnDataUpdate: !!onDataUpdate,
      timestamp: new Date().toISOString()
    });
    
    if (action === "refresh" || action === "reload") {
      console.log("🔄 [CHAT PANEL] Triggering data reload");
      onDataUpdate({ action: 'reload_data', _refresh: Date.now() });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "white",
      }}
    >
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: message.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {/* Message bubble */}
            <div
              style={{
                maxWidth: "80%",
                padding: "12px",
                borderRadius: "8px",
                background: message.role === "user" ? "#3b82f6" : "#f3f4f6",
                color: message.role === "user" ? "white" : "black",
              }}
            >
              {message.content}
            </div>

            {/* Cards */}
            {message.cards && message.cards.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginTop: "12px",
                  width: "100%",
                }}
              >
                {message.cards.map((card) => {
                  const CardComponent = card.component;
                  if (!CardComponent) {
                    return (
                      <div
                        key={card.id}
                        style={{
                          padding: "12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          background: "white",
                        }}
                      >
                        <p style={{ fontSize: "12px", color: "#6b7280" }}>
                          Card type "{card.type}" not found
                        </p>
                      </div>
                    );
                  }

                  return (
                    <CardComponent
                      key={card.id}
                      data={card.data}
                      onAction={handleCardAction}
                      onDataUpdate={onDataUpdate}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#6b7280",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid #e5e7eb",
                borderTopColor: "#3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <span>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "16px",
          background: "white",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={config.leftPanel.placeholder || "Type a message..."}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            style={{
              padding: "8px 16px",
              background: isLoading || !input.trim() ? "#e5e7eb" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Add keyframe animation */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
