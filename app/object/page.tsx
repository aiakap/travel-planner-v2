import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ObjectIndexClient } from "./client";

export default async function ObjectIndexPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/");
  }

  // Fetch user's first trip for new_chat demo link
  const firstTrip = await prisma.trip.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return <ObjectIndexClient firstTripId={firstTrip?.id} />;
}
