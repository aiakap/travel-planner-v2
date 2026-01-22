"use client";

import { useState } from "react";

interface PromptInputProps {
  onSubmit: (text: string) => void;
  isProcessing: boolean;
}

export function PromptInput({ onSubmit, isProcessing }: PromptInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isProcessing) {
      onSubmit(text);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Image Generation Prompts</h2>
      <p className="text-gray-600 mb-4">
        Paste your text containing image prompts below. The AI will extract all prompts
        and add them to the generation queue.
      </p>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your prompts here... 

Examples:
1. A futuristic city at sunset with neon lights
2. An astronaut riding a horse in space
3. A mountain landscape with a crystal clear lake

Or any format - the AI will extract the prompts!"
          className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isProcessing}
        />
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {text.length} characters
          </div>
          <button
            type="submit"
            disabled={!text.trim() || isProcessing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? "Processing..." : "Extract & Generate"}
          </button>
        </div>
      </form>
    </div>
  );
}
