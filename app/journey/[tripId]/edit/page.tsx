import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { JourneyEditClient } from "./client"

interface PageProps {
  params: Promise<{ tripId: string }>
  searchParams: Promise<{ returnTo?: string }>
}

export default async function JourneyEditPage({ params, searchParams }: PageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/api/auth/signin")
  }

  const { tripId } = await params;
  const searchParamsResolved = await searchParams;

  // Fetch trip with all segments
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id
    },
    include: {
      segments: {
        orderBy: { order: "asc" },
        include: {
          segmentType: true
        }
      }
    }
  })

  if (!trip) {
    notFound()
  }

  // Fetch all segment types for new segments
  const segmentTypes = await prisma.segmentType.findMany({
    orderBy: { name: "asc" }
  })

  return (
    <JourneyEditClient
      trip={trip}
      segmentTypes={segmentTypes}
      returnTo={searchParamsResolved.returnTo || `/view1/${trip.id}?tab=journey`}
    />
  )
}
