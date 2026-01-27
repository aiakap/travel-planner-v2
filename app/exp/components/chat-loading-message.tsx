import { Loader2 } from "lucide-react"

interface ChatLoadingMessageProps {
  conversationId: string
}

export function ChatLoadingMessage({ conversationId }: ChatLoadingMessageProps) {
  const loadingPhrases = [
    { prefix: "Looking up Journey", emoji: "🗺️" },
    { prefix: "Gathering Chapter", emoji: "📖" },
    { prefix: "Loading Moment", emoji: "✨" },
    { prefix: "Finding Adventure", emoji: "🧭" },
    { prefix: "Discovering Story", emoji: "📝" },
  ]
  
  // Use conversation ID to consistently pick the same phrase for this conversation
  // This prevents the phrase from changing on re-renders
  const phraseIndex = conversationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % loadingPhrases.length
  const phrase = loadingPhrases[phraseIndex]
  const shortId = conversationId.slice(0, 8)
  
  return (
    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg animate-pulse">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        {phrase.emoji} {phrase.prefix}: {shortId}...
      </span>
    </div>
  )
}
