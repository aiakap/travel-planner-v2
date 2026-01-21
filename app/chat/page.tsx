import { auth } from "@/auth";
import { createConversation } from "@/lib/actions/chat-actions";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  // Create a new conversation and redirect to it (skip revalidation since we're redirecting)
  const conversation = await createConversation("New Chat", false);
  redirect(`/chat/${conversation.id}`);
}

