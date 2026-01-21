import { auth } from "@/auth";
import { getConversation } from "@/lib/actions/chat-actions";
import ChatInterface from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUserPersonalizationData, generateChatQuickActions } from "@/lib/personalization";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return <div>Please sign in.</div>;
  }

  const conversation = await getConversation(conversationId);

  if (!conversation) {
    return <div>Conversation not found.</div>;
  }

  // Load user profile data for personalization
  let profileData = null;
  let quickActions: any[] = [];
  try {
    profileData = await getUserPersonalizationData(session.user.id);
    quickActions = generateChatQuickActions(profileData);
  } catch (error) {
    console.error("Error loading profile data:", error);
  }

  // Convert messages to format expected by useChat
  const initialMessages = conversation.messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
    createdAt: msg.createdAt,
    parts: [{ type: "text" as const, text: msg.content }],
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/trips">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{conversation.title}</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg">
        <ChatInterface
          conversationId={conversationId}
          initialMessages={initialMessages}
          profileData={profileData}
          quickActions={quickActions}
        />
      </div>
    </div>
  );
}


