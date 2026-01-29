import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { QuickAddClient } from "./client"

interface PageProps {
  params: Promise<{ tripId: string }>
}

export default async function QuickAddPage({ params }: PageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/api/auth/signin")
  }

  const { tripId } = await params;

  // Fetch trip to verify user owns it
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id
    }
  })

  if (!trip) {
    notFound()
  }

  return <QuickAddClient trip={trip} />
}
